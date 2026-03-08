import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // 1. Auto-expire leases
    const { data: expiredCount } = await supabase.rpc("auto_expire_leases");
    console.log(`[DAILY-TASKS] Expired ${expiredCount || 0} leases`);

    // 2. Check trial expirations and notify
    const { data: expiringTrials } = await supabase
      .from("customer_subscriptions")
      .select("organization_id, trial_ends_at, organizations(name)")
      .eq("status", "trialing")
      .lte("trial_ends_at", new Date(Date.now() + 3 * 86400000).toISOString())
      .gte("trial_ends_at", new Date().toISOString());

    if (expiringTrials && expiringTrials.length > 0) {
      for (const trial of expiringTrials) {
        // Get org admins
        const { data: admins } = await supabase
          .from("organization_members")
          .select("user_id")
          .eq("organization_id", trial.organization_id)
          .in("role", ["organization_admin", "super_admin"]);

        if (admins) {
          for (const admin of admins) {
            await supabase.from("notifications").insert({
              user_id: admin.user_id,
              organization_id: trial.organization_id,
              title: "Trial Ending Soon",
              body: `Your trial for ${(trial as any).organizations?.name || "your organization"} is ending soon. Upgrade to continue using all features.`,
              type: "warning",
              category: "subscription",
              action_url: "/subscriptions",
            });
          }
        }
      }
      console.log(`[DAILY-TASKS] Notified ${expiringTrials.length} orgs about trial expiry`);
    }

    // 3. Expire trials that have passed
    const { data: expiredTrials } = await supabase
      .from("customer_subscriptions")
      .update({ status: "expired" })
      .eq("status", "trialing")
      .lt("trial_ends_at", new Date().toISOString())
      .select("id");
    console.log(`[DAILY-TASKS] Expired ${expiredTrials?.length || 0} trials`);

    // 4. Lease renewal reminders
    const { data: renewalLeases } = await supabase
      .from("leases")
      .select("id, tenant_id, end_date, renewal_reminder_days, organization_id, tenants(full_name)")
      .eq("status", "active");

    let reminderCount = 0;
    if (renewalLeases) {
      for (const lease of renewalLeases) {
        const reminderDays = lease.renewal_reminder_days || 30;
        const endDate = new Date(lease.end_date);
        const reminderDate = new Date(endDate.getTime() - reminderDays * 86400000);
        const today = new Date();

        if (today >= reminderDate && today < endDate) {
          const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / 86400000);
          // Get org admins
          const { data: admins } = await supabase
            .from("organization_members")
            .select("user_id")
            .eq("organization_id", lease.organization_id)
            .in("role", ["organization_admin", "super_admin", "property_manager"]);

          if (admins) {
            for (const admin of admins) {
              // Check if already notified today
              const { count } = await supabase
                .from("notifications")
                .select("*", { count: "exact", head: true })
                .eq("user_id", admin.user_id)
                .eq("related_id", lease.id)
                .eq("related_type", "lease_renewal")
                .gte("created_at", new Date(today.setHours(0, 0, 0, 0)).toISOString());

              if (!count || count === 0) {
                await supabase.from("notifications").insert({
                  user_id: admin.user_id,
                  organization_id: lease.organization_id,
                  title: "Lease Renewal Reminder",
                  body: `Lease for ${(lease as any).tenants?.full_name || "tenant"} expires in ${daysLeft} days (${lease.end_date}).`,
                  type: "warning",
                  category: "lease",
                  related_id: lease.id,
                  related_type: "lease_renewal",
                  action_url: "/leases",
                });
                reminderCount++;
              }
            }
          }
        }
      }
    }
    console.log(`[DAILY-TASKS] Sent ${reminderCount} lease renewal reminders`);

    return new Response(JSON.stringify({
      success: true,
      expired_leases: expiredCount || 0,
      trial_notifications: expiringTrials?.length || 0,
      expired_trials: expiredTrials?.length || 0,
      renewal_reminders: reminderCount,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[DAILY-TASKS] Error: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

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
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const { organization_id, action } = await req.json();
    if (!organization_id) throw new Error("organization_id required");

    // Verify user is member of org
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("organization_id", organization_id)
      .maybeSingle();
    if (!membership || !["organization_admin", "super_admin"].includes(membership.role)) {
      throw new Error("Not authorized");
    }

    const { data: sub } = await supabase
      .from("customer_subscriptions")
      .select("*, subscription_plans(name)")
      .eq("organization_id", organization_id)
      .maybeSingle();
    if (!sub) throw new Error("No subscription found");

    if (action === "cancel") {
      await supabase
        .from("customer_subscriptions")
        .update({ status: "cancelled", expires_at: sub.next_billing_date || new Date().toISOString() })
        .eq("id", sub.id);

      await supabase.from("billing_history").insert({
        organization_id,
        action: "cancellation",
        plan_name: (sub as any).subscription_plans?.name,
        amount: 0,
        description: `Subscription cancelled - access until ${sub.next_billing_date || "end of period"}`,
        status: "completed",
        subscription_id: sub.id,
      });

      await supabase.from("audit_logs").insert({
        action: "subscription_cancelled",
        table_name: "customer_subscriptions",
        record_id: sub.id,
        organization_id,
        user_id: userData.user.id,
      });
    } else if (action === "reactivate") {
      await supabase
        .from("customer_subscriptions")
        .update({ status: "active", expires_at: null })
        .eq("id", sub.id);

      await supabase.from("billing_history").insert({
        organization_id,
        action: "renewal",
        plan_name: (sub as any).subscription_plans?.name,
        amount: sub.total_amount || 0,
        description: "Subscription reactivated",
        status: "completed",
        subscription_id: sub.id,
      });
    }

    return new Response(JSON.stringify({ success: true, action }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

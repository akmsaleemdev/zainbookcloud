import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    // Authenticate
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const { session_id, plan_id, billing_cycle, organization_id } = await req.json();
    if (!session_id) throw new Error("session_id required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ verified: false, message: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get plan
    const effectivePlanId = plan_id || session.metadata?.plan_id;
    const effectiveCycle = billing_cycle || session.metadata?.billing_cycle || "monthly";
    const effectiveOrgId = organization_id || session.metadata?.organization_id;

    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", effectivePlanId)
      .single();
    if (!plan) throw new Error("Plan not found");

    const totalAmount = effectiveCycle === "yearly" ? plan.price * 10 : plan.price;
    const nextBilling = new Date(Date.now() + (effectiveCycle === "yearly" ? 365 : 30) * 86400000).toISOString().split("T")[0];

    // Check existing subscription
    const { data: existingSub } = await supabase
      .from("customer_subscriptions")
      .select("id")
      .eq("organization_id", effectiveOrgId)
      .maybeSingle();

    let subId: string;
    if (existingSub) {
      const { data: updated } = await supabase
        .from("customer_subscriptions")
        .update({
          plan_id: effectivePlanId,
          billing_cycle: effectiveCycle,
          total_amount: totalAmount,
          status: "active",
          trial_ends_at: null,
          next_billing_date: nextBilling,
        })
        .eq("id", existingSub.id)
        .select("id")
        .single();
      subId = updated!.id;
    } else {
      const { data: newSub } = await supabase
        .from("customer_subscriptions")
        .insert({
          organization_id: effectiveOrgId,
          plan_id: effectivePlanId,
          billing_cycle: effectiveCycle,
          total_amount: totalAmount,
          status: "active",
          next_billing_date: nextBilling,
        })
        .select("id")
        .single();
      subId = newSub!.id;
    }

    // Enable plan modules
    const { data: planModules } = await supabase
      .from("plan_modules")
      .select("module_id")
      .eq("plan_id", effectivePlanId)
      .eq("is_included", true);

    if (planModules && planModules.length > 0) {
      for (const pm of planModules) {
        await supabase.from("subscription_modules").upsert(
          { subscription_id: subId, module_id: pm.module_id, is_enabled: true, enabled_at: new Date().toISOString() },
          { onConflict: "subscription_id,module_id" }
        );
      }
    }

    // Log billing
    await supabase.from("billing_history").insert({
      organization_id: effectiveOrgId,
      action: existingSub ? "plan_change" : "new_subscription",
      plan_name: plan.name,
      amount: totalAmount,
      billing_cycle: effectiveCycle,
      description: `Payment for ${plan.name} plan via Stripe`,
      invoice_number: `INV-${Date.now().toString(36).toUpperCase()}`,
      status: "completed",
      subscription_id: subId,
    });

    // Log audit
    await supabase.from("audit_logs").insert({
      action: "stripe_payment_verified",
      table_name: "customer_subscriptions",
      record_id: subId,
      organization_id: effectiveOrgId,
      user_id: userData.user.id,
      new_data: { plan_name: plan.name, amount: totalAmount, stripe_session_id: session_id },
    });

    return new Response(JSON.stringify({ verified: true, subscription_id: subId }), {
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

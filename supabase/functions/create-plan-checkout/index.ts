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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("Not authenticated");
    const user = userData.user;

    const { plan_id, billing_cycle, organization_id } = await req.json();
    if (!plan_id || !organization_id) throw new Error("plan_id and organization_id required");

    // Get plan details
    const { data: plan, error: planError } = await supabaseClient
      .from("subscription_plans")
      .select("*")
      .eq("id", plan_id)
      .single();
    if (planError || !plan) throw new Error("Plan not found");

    // Free/trial plans don't need payment
    if (plan.price === 0) {
      return new Response(JSON.stringify({ free: true, message: "This plan is free, no payment needed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id, organization_id },
      });
      customerId = customer.id;
    }

    const cycle = billing_cycle || "monthly";
    const amount = cycle === "yearly" ? Math.round(plan.price * 10 * 100) : Math.round(plan.price * 100);
    const origin = req.headers.get("origin") || "https://localhost:3000";

    // Create a one-time checkout session for plan payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: (plan.currency || "aed").toLowerCase(),
            product_data: {
              name: `${plan.name} Plan - ${cycle === "yearly" ? "Annual" : "Monthly"}`,
              description: plan.description || `ZainBook ${plan.name} subscription`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/subscriptions?payment=success&plan_id=${plan_id}&billing_cycle=${cycle}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscriptions?payment=cancelled`,
      metadata: {
        plan_id,
        billing_cycle: cycle,
        organization_id,
        user_id: user.id,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
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

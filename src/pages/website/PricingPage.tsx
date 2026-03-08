import { useState } from "react";
import { Link } from "react-router-dom";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PricingPage = () => {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const { data: plans = [] } = useQuery({
    queryKey: ["website-plans"],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
  });

  const displayPlans = plans.filter(
    (p: any) => p.plan_type === billing || p.plan_type === "trial"
  );

  return (
    <WebsiteLayout>
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground md:text-5xl">Simple, Transparent Pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Start free, scale as you grow. All plans include core property management features.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 inline-flex items-center rounded-full border border-border/50 bg-secondary/50 p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                billing === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                billing === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Yearly <span className="text-xs opacity-80">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {displayPlans.map((plan: any) => (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.is_featured
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/50 bg-card"
              }`}
            >
              {plan.is_featured && (
                <Badge className="self-start mb-3 bg-primary/20 text-primary border-0">Most Popular</Badge>
              )}
              <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-foreground">
                  {plan.price === 0 ? "Free" : `AED ${plan.price}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-sm text-muted-foreground">/{plan.plan_type === "yearly" ? "yr" : "mo"}</span>
                )}
              </div>
              <ul className="mt-6 flex-1 space-y-2">
                <PlanFeature>Up to {plan.max_users === -1 ? "Unlimited" : plan.max_users} users</PlanFeature>
                <PlanFeature>Up to {plan.max_units === -1 ? "Unlimited" : plan.max_units} units</PlanFeature>
                <PlanFeature>{plan.max_storage_gb === -1 ? "Unlimited" : `${plan.max_storage_gb} GB`} storage</PlanFeature>
                {plan.ai_usage_limit > 0 && <PlanFeature>AI features ({plan.ai_usage_limit} requests/mo)</PlanFeature>}
              </ul>
              <Link to={`/auth?plan=${plan.id}`} className="mt-6">
                <Button
                  className="w-full gap-1.5"
                  variant={plan.is_featured ? "default" : "outline"}
                >
                  {plan.plan_type === "trial" ? "Start Free Trial" : "Subscribe Now"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">Accepted Payment Methods</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {["Stripe", "PayTabs", "Checkout.com", "Telr", "Amazon Payment Services", "Network International"].map((gw) => (
              <span key={gw} className="rounded-lg border border-border/50 bg-secondary/50 px-4 py-2 text-xs font-medium text-muted-foreground">
                {gw}
              </span>
            ))}
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
};

const PlanFeature = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2 text-sm text-muted-foreground">
    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
    {children}
  </li>
);

export default PricingPage;

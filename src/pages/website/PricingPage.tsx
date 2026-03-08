import { useState } from "react";
import { Link } from "react-router-dom";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, X, Shield, Zap, Crown, Building2, Users, HardDrive, Brain, Globe, CreditCard } from "lucide-react";
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

  const { data: planModules = [] } = useQuery({
    queryKey: ["website-plan-modules"],
    queryFn: async () => {
      const { data } = await supabase
        .from("plan_modules")
        .select("*, platform_modules(name, slug, category)")
        .eq("is_included", true);
      return data || [];
    },
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["website-modules"],
    queryFn: async () => {
      const { data } = await supabase
        .from("platform_modules")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
  });

  const planIcons = [Shield, Zap, Crown, Building2];

  const getPrice = (plan: any) => {
    if (plan.price === 0) return "Free";
    const multiplier = billing === "yearly" ? 10 : 1;
    return `AED ${(plan.price * multiplier).toLocaleString()}`;
  };

  const getPeriod = (plan: any) => {
    if (plan.price === 0) return "";
    return billing === "yearly" ? "/yr" : "/mo";
  };

  const getModulesForPlan = (planId: string) =>
    planModules.filter((pm: any) => pm.plan_id === planId).map((pm: any) => pm.platform_modules?.slug);

  // Group modules by category
  const categories = [...new Set(modules.map((m: any) => m.category || "Other"))];

  return (
    <WebsiteLayout>
      <section className="mx-auto max-w-7xl px-6 py-24">
        {/* Hero */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/20 text-primary border-0">Pricing</Badge>
          <h1 className="text-4xl font-bold text-foreground md:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Start with a free trial, scale as you grow. All plans include core property management features.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 inline-flex items-center rounded-full border border-border/50 bg-secondary/50 p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${
                billing === "monthly" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${
                billing === "yearly" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly <span className="text-xs opacity-80 ml-1">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan: any, i: number) => {
            const Icon = planIcons[i] || Shield;
            const moduleCount = getModulesForPlan(plan.id).length;

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden flex flex-col transition-all hover:shadow-lg ${
                  plan.is_featured
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20 scale-[1.02]"
                    : "border-border/50 bg-card hover:border-border"
                }`}
              >
                {plan.is_featured && (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50" />
                    <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground text-[10px]">Most Popular</Badge>
                  </>
                )}
                <CardHeader className="text-center pb-2">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                    i === 0 ? "from-muted to-muted/50" : i === 1 ? "from-blue-500/20 to-blue-600/10" : i === 2 ? "from-primary/20 to-primary/10" : "from-amber-500/20 to-amber-600/10"
                  } flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="w-6 h-6 text-foreground" />
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="text-center mb-6">
                    <span className="text-3xl font-bold text-foreground">{getPrice(plan)}</span>
                    <span className="text-sm text-muted-foreground">{getPeriod(plan)}</span>
                    {plan.plan_type === "trial" && (
                      <p className="text-xs text-primary mt-1">{plan.trial_days}-day free trial</p>
                    )}
                  </div>

                  <ul className="flex-1 space-y-2.5 mb-6">
                    <PlanFeature>{plan.max_users === -1 ? "Unlimited" : plan.max_users} users</PlanFeature>
                    <PlanFeature>{plan.max_units === -1 ? "Unlimited" : plan.max_units} units</PlanFeature>
                    <PlanFeature>{plan.max_properties === -1 ? "Unlimited" : plan.max_properties} properties</PlanFeature>
                    <PlanFeature>{plan.max_storage_gb === -1 ? "Unlimited" : `${plan.max_storage_gb} GB`} storage</PlanFeature>
                    {plan.ai_features_access && (
                      <PlanFeature>{plan.ai_usage_limit === -1 ? "Unlimited" : plan.ai_usage_limit} AI queries/mo</PlanFeature>
                    )}
                    {plan.report_access && <PlanFeature>Report generation</PlanFeature>}
                    <PlanFeature>{moduleCount} modules included</PlanFeature>
                  </ul>

                  <Link to={`/auth?plan=${plan.id}`}>
                    <Button
                      className="w-full gap-2"
                      variant={plan.is_featured ? "default" : "outline"}
                      size="lg"
                    >
                      {plan.plan_type === "trial" ? "Start Free Trial" : (
                        <><CreditCard className="h-4 w-4" /> Subscribe Now</>
                      )}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Matrix */}
        {plans.length > 0 && modules.length > 0 && (
          <div className="mt-24">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-foreground">Detailed Feature Comparison</h2>
              <p className="text-muted-foreground mt-2">See exactly what's included in each plan</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground w-[250px]">Feature</th>
                    {plans.map((plan: any) => (
                      <th key={plan.id} className="text-center py-4 px-4 min-w-[140px]">
                        <span className="text-sm font-semibold text-foreground">{plan.name}</span>
                        <div className="text-xs text-muted-foreground mt-0.5">{getPrice(plan)}{getPeriod(plan)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Limits section */}
                  <tr className="bg-muted/30">
                    <td colSpan={plans.length + 1} className="py-2 px-4 text-xs font-semibold text-foreground uppercase tracking-wide">
                      Limits & Quotas
                    </td>
                  </tr>
                  {[
                    { label: "Users", key: "max_users" },
                    { label: "Units", key: "max_units" },
                    { label: "Properties", key: "max_properties" },
                    { label: "Storage", key: "max_storage_gb", suffix: " GB" },
                    { label: "API Calls", key: "max_api_calls" },
                    { label: "AI Queries/mo", key: "ai_usage_limit" },
                  ].map((row) => (
                    <tr key={row.key} className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                      <td className="py-3 px-4 text-sm text-muted-foreground">{row.label}</td>
                      {plans.map((plan: any) => {
                        const val = plan[row.key];
                        return (
                          <td key={plan.id} className="py-3 px-4 text-center text-sm font-medium">
                            {val === -1 ? "Unlimited" : val === 0 ? "—" : `${val?.toLocaleString() || 0}${row.suffix || ""}`}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Features section */}
                  <tr className="bg-muted/30">
                    <td colSpan={plans.length + 1} className="py-2 px-4 text-xs font-semibold text-foreground uppercase tracking-wide">
                      Features
                    </td>
                  </tr>
                  {[
                    { label: "AI Features", key: "ai_features_access" },
                    { label: "Report Access", key: "report_access" },
                  ].map((row) => (
                    <tr key={row.key} className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                      <td className="py-3 px-4 text-sm text-muted-foreground">{row.label}</td>
                      {plans.map((plan: any) => (
                        <td key={plan.id} className="py-3 px-4 text-center">
                          {plan[row.key] ? (
                            <CheckCircle2 className="w-5 h-5 text-primary mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Modules by category */}
                  {categories.map((cat) => {
                    const catModules = modules.filter((m: any) => (m.category || "Other") === cat);
                    if (catModules.length === 0) return null;
                    return (
                      <tbody key={cat}>
                        <tr className="bg-muted/30">
                          <td colSpan={plans.length + 1} className="py-2 px-4 text-xs font-semibold text-foreground uppercase tracking-wide">
                            {cat}
                          </td>
                        </tr>
                        {catModules.map((mod: any) => (
                          <tr key={mod.id} className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                            <td className="py-3 px-4 text-sm text-muted-foreground">{mod.name}</td>
                            {plans.map((plan: any) => {
                              const included = getModulesForPlan(plan.id).includes(mod.slug);
                              return (
                                <td key={plan.id} className="py-3 px-4 text-center">
                                  {included ? (
                                    <CheckCircle2 className="w-5 h-5 text-primary mx-auto" />
                                  ) : (
                                    <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">Secure Payment Processing</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {["Stripe", "PayTabs", "Checkout.com", "Telr", "Amazon Payment Services", "Network International"].map((gw) => (
              <span key={gw} className="rounded-lg border border-border/50 bg-secondary/50 px-4 py-2 text-xs font-medium text-muted-foreground">
                {gw}
              </span>
            ))}
          </div>
        </div>

        {/* FAQ teaser */}
        <div className="mt-20 text-center max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold text-foreground mb-3">Have questions?</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Our team is ready to help you choose the right plan for your property management needs.
          </p>
          <Link to="/website/contact">
            <Button variant="outline" size="lg">Contact Sales</Button>
          </Link>
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

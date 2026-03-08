import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Check, Crown, Zap, Building2, Star, ArrowRight, Shield, Clock, Users, HardDrive, Brain, Globe } from "lucide-react";

const Subscriptions = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const { data: plans = [] } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscription_plans").select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["platform-modules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("platform_modules").select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: currentSub } = useQuery({
    queryKey: ["current-subscription", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return null;
      const { data } = await supabase.from("customer_subscriptions").select("*, subscription_plans(*)").eq("organization_id", currentOrg.id).maybeSingle();
      return data;
    },
    enabled: !!currentOrg?.id,
  });

  const { data: enabledModules = [] } = useQuery({
    queryKey: ["enabled-modules", currentSub?.id],
    queryFn: async () => {
      if (!currentSub?.id) return [];
      const { data } = await supabase.from("subscription_modules").select("*, platform_modules(*)").eq("subscription_id", currentSub.id);
      return data || [];
    },
    enabled: !!currentSub?.id,
  });

  const getPrice = (price: number) => {
    if (price === 0) return "Free";
    const multiplier = billingCycle === "yearly" ? 10 : 1;
    return `AED ${(price * multiplier).toLocaleString()}${billingCycle === "yearly" ? "/yr" : "/mo"}`;
  };

  const planIcons = [Shield, Zap, Crown, Building2];
  const planColors = [
    "from-muted to-muted/50",
    "from-blue-500/20 to-blue-600/10",
    "from-primary/20 to-primary/10",
    "from-amber-500/20 to-amber-600/10",
  ];

  const currentPlanId = (currentSub as any)?.plan_id;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header flex items-center gap-2"><Crown className="w-6 h-6 text-primary" /> Subscription Plans</h1>
            <p className="text-sm text-muted-foreground mt-1">Choose the perfect plan for your business</p>
          </div>
          {currentSub && (
            <Badge className="bg-primary/20 text-primary border border-primary/30 px-4 py-2 text-sm">
              Current: {(currentSub as any)?.subscription_plans?.name || "N/A"} — {(currentSub as any)?.status}
            </Badge>
          )}
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm ${billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
          <Switch checked={billingCycle === "yearly"} onCheckedChange={(v) => setBillingCycle(v ? "yearly" : "monthly")} />
          <span className={`text-sm ${billingCycle === "yearly" ? "text-foreground" : "text-muted-foreground"}`}>
            Yearly <Badge variant="secondary" className="ml-1 text-xs">Save 17%</Badge>
          </span>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan: any, i: number) => {
            const Icon = planIcons[i] || Star;
            const isCurrent = plan.id === currentPlanId;
            return (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`glass-card relative overflow-hidden h-full flex flex-col ${plan.is_featured ? "border-primary ring-1 ring-primary/30" : ""} ${isCurrent ? "border-primary/50" : ""}`}>
                  {plan.is_featured && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50" />
                  )}
                  <CardHeader className="text-center pb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${planColors[i]} flex items-center justify-center mx-auto mb-3`}>
                      <Icon className="w-7 h-7 text-foreground" />
                    </div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                    <div className="text-3xl font-bold mt-3">{getPrice(plan.price)}</div>
                    {plan.plan_type === "trial" && <p className="text-xs text-primary mt-1">{plan.trial_days}-day free trial</p>}
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between gap-4">
                    <ul className="space-y-2.5">
                      <li className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-primary shrink-0" />
                        {plan.max_users === -1 ? "Unlimited" : plan.max_users} users
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Building2 className="w-4 h-4 text-primary shrink-0" />
                        {plan.max_units === -1 ? "Unlimited" : plan.max_units} units
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <HardDrive className="w-4 h-4 text-primary shrink-0" />
                        {plan.max_storage_gb}GB storage
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-primary shrink-0" />
                        {plan.max_api_calls === -1 ? "Unlimited" : plan.max_api_calls.toLocaleString()} API calls
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Brain className="w-4 h-4 text-primary shrink-0" />
                        {plan.ai_usage_limit === -1 ? "Unlimited" : plan.ai_usage_limit} AI queries
                      </li>
                    </ul>
                    <Button 
                      className="w-full gap-2" 
                      variant={isCurrent ? "outline" : plan.is_featured ? "default" : "secondary"} 
                      disabled={isCurrent}
                    >
                      {isCurrent ? "Current Plan" : "Upgrade"} {!isCurrent && <ArrowRight className="w-4 h-4" />}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Modules */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> Available Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod: any) => {
              const isEnabled = enabledModules.some((em: any) => em.module_id === mod.id && em.is_enabled);
              return (
                <Card key={mod.id} className={`glass-card ${isEnabled ? "border-primary/30" : ""}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEnabled ? "bg-primary/20" : "bg-muted"}`}>
                        <Zap className={`w-5 h-5 ${isEnabled ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{mod.name}</p>
                        <p className="text-xs text-muted-foreground">{mod.category}</p>
                      </div>
                    </div>
                    <Badge variant={isEnabled ? "default" : "secondary"} className={isEnabled ? "bg-primary/20 text-primary" : ""}>
                      {isEnabled ? "Active" : "Available"}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Subscriptions;

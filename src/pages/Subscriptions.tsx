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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import {
  Check, Crown, Zap, Building2, Star, ArrowRight, Shield, Clock,
  Users, HardDrive, Brain, Globe, CreditCard, Receipt, History,
  AlertTriangle, ArrowUpRight, Settings
} from "lucide-react";

const Subscriptions = () => {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [upgradeDialog, setUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("plans");

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
      const { data } = await supabase
        .from("customer_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("organization_id", currentOrg.id)
        .maybeSingle();
      return data;
    },
    enabled: !!currentOrg?.id,
  });

  const { data: enabledModules = [] } = useQuery({
    queryKey: ["enabled-modules", currentSub?.id],
    queryFn: async () => {
      if (!currentSub?.id) return [];
      const { data } = await supabase
        .from("subscription_modules")
        .select("*, platform_modules(*)")
        .eq("subscription_id", currentSub.id);
      return data || [];
    },
    enabled: !!currentSub?.id,
  });

  const { data: planModules = [] } = useQuery({
    queryKey: ["plan-modules"],
    queryFn: async () => {
      const { data } = await supabase.from("plan_modules").select("*, platform_modules(*)");
      return data || [];
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      if (!currentOrg?.id || !user?.id) throw new Error("Missing org or user");
      const plan = plans.find((p: any) => p.id === planId);
      if (!plan) throw new Error("Plan not found");

      const multiplier = billingCycle === "yearly" ? 10 : 1;
      const totalAmount = plan.price * multiplier;

      if (currentSub) {
        const { error } = await supabase
          .from("customer_subscriptions")
          .update({
            plan_id: planId,
            billing_cycle: billingCycle,
            total_amount: totalAmount,
            status: plan.plan_type === "trial" ? "trial" : "active",
            trial_ends_at: plan.plan_type === "trial"
              ? new Date(Date.now() + (plan.trial_days || 14) * 86400000).toISOString()
              : null,
          })
          .eq("id", currentSub.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("customer_subscriptions").insert({
          organization_id: currentOrg.id,
          plan_id: planId,
          billing_cycle: billingCycle,
          total_amount: totalAmount,
          status: plan.plan_type === "trial" ? "trial" : "active",
          trial_ends_at: plan.plan_type === "trial"
            ? new Date(Date.now() + (plan.trial_days || 14) * 86400000).toISOString()
            : null,
          next_billing_date: new Date(Date.now() + (billingCycle === "yearly" ? 365 : 30) * 86400000).toISOString().split("T")[0],
        });
        if (error) throw error;
      }

      // Enable included modules for this plan
      const includedMods = planModules.filter((pm: any) => pm.plan_id === planId && pm.is_included);
      if (includedMods.length > 0) {
        const subData = await supabase
          .from("customer_subscriptions")
          .select("id")
          .eq("organization_id", currentOrg.id)
          .maybeSingle();
        
        if (subData.data) {
          for (const pm of includedMods) {
            await supabase.from("subscription_modules").upsert({
              subscription_id: subData.data.id,
              module_id: pm.module_id,
              is_enabled: true,
              enabled_at: new Date().toISOString(),
            }, { onConflict: "subscription_id,module_id" }).select();
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["enabled-modules"] });
      setUpgradeDialog(false);
      toast({ title: "Plan Updated", description: "Your subscription has been updated successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
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
  const currentPlanIndex = plans.findIndex((p: any) => p.id === currentPlanId);

  const getModulesForPlan = (planId: string) =>
    planModules.filter((pm: any) => pm.plan_id === planId && pm.is_included);

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header flex items-center gap-2">
              <Crown className="w-6 h-6 text-primary" /> Subscription & Billing
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your plan, modules, and billing</p>
          </div>
          {currentSub && (
            <Badge className="bg-primary/20 text-primary border border-primary/30 px-4 py-2 text-sm">
              Current: {(currentSub as any)?.subscription_plans?.name || "N/A"} — {(currentSub as any)?.status}
            </Badge>
          )}
        </div>

        {/* Current Subscription Summary */}
        {currentSub && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: Crown, label: "Current Plan", value: (currentSub as any)?.subscription_plans?.name || "N/A", color: "text-primary" },
              { icon: CreditCard, label: "Billing Cycle", value: (currentSub as any)?.billing_cycle === "yearly" ? "Annual" : "Monthly", color: "text-blue-400" },
              { icon: Receipt, label: "Amount", value: `AED ${((currentSub as any)?.total_amount || 0).toLocaleString()}`, color: "text-emerald-400" },
              {
                icon: Clock, label: "Next Billing",
                value: (currentSub as any)?.next_billing_date
                  ? format(new Date((currentSub as any).next_billing_date), "dd MMM yyyy")
                  : "N/A",
                color: "text-amber-400"
              },
            ].map((stat, i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-sm font-semibold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-6 mt-4">
            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm ${billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
              <Switch checked={billingCycle === "yearly"} onCheckedChange={(v) => setBillingCycle(v ? "yearly" : "monthly")} />
              <span className={`text-sm ${billingCycle === "yearly" ? "text-foreground" : "text-muted-foreground"}`}>
                Yearly <Badge variant="secondary" className="ml-1 text-xs">Save 17%</Badge>
              </span>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan: any, i: number) => {
                const Icon = planIcons[i] || Star;
                const isCurrent = plan.id === currentPlanId;
                const isDowngrade = currentPlanIndex >= 0 && i < currentPlanIndex;
                const includedMods = getModulesForPlan(plan.id);

                return (
                  <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Card className={`glass-card relative overflow-hidden h-full flex flex-col ${plan.is_featured ? "border-primary ring-1 ring-primary/30" : ""} ${isCurrent ? "border-primary/50" : ""}`}>
                      {plan.is_featured && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50" />
                      )}
                      {isCurrent && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-primary text-primary-foreground text-[10px]">Your Plan</Badge>
                        </div>
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
                            {plan.max_api_calls === -1 ? "Unlimited" : (plan.max_api_calls || 0).toLocaleString()} API calls
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Brain className="w-4 h-4 text-primary shrink-0" />
                            {plan.ai_usage_limit === -1 ? "Unlimited" : plan.ai_usage_limit} AI queries
                          </li>
                          {includedMods.length > 0 && (
                            <li className="flex items-start gap-2 text-sm">
                              <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <span>{includedMods.length} modules included</span>
                            </li>
                          )}
                        </ul>
                        <Button
                          className="w-full gap-2"
                          variant={isCurrent ? "outline" : plan.is_featured ? "default" : "secondary"}
                          disabled={isCurrent}
                          onClick={() => {
                            setSelectedPlan(plan);
                            setUpgradeDialog(true);
                          }}
                        >
                          {isCurrent ? "Current Plan" : isDowngrade ? "Downgrade" : "Upgrade"}
                          {!isCurrent && <ArrowRight className="w-4 h-4" />}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="modules" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((mod: any) => {
                const isEnabled = enabledModules.some((em: any) => em.module_id === mod.id && em.is_enabled);
                const planMod = planModules.find((pm: any) => pm.module_id === mod.id && pm.plan_id === currentPlanId);
                const isIncluded = planMod?.is_included;
                const addonPrice = planMod?.addon_price;

                return (
                  <Card key={mod.id} className={`glass-card ${isEnabled ? "border-primary/30" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
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
                          {isEnabled ? "Active" : isIncluded ? "Included" : addonPrice ? `AED ${addonPrice}/mo` : "Available"}
                        </Badge>
                      </div>
                      {mod.description && (
                        <p className="text-xs text-muted-foreground mt-2">{mod.description}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="usage" className="mt-4">
            {currentSub ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Users", current: 1, max: (currentSub as any)?.subscription_plans?.max_users, icon: Users },
                  { label: "Units", current: 0, max: (currentSub as any)?.subscription_plans?.max_units, icon: Building2 },
                  { label: "Storage", current: 0.1, max: (currentSub as any)?.subscription_plans?.max_storage_gb, icon: HardDrive, unit: "GB" },
                  { label: "AI Queries", current: 0, max: (currentSub as any)?.subscription_plans?.ai_usage_limit, icon: Brain },
                ].map((usage, i) => {
                  const isUnlimited = usage.max === -1;
                  const pct = isUnlimited ? 5 : Math.min((usage.current / usage.max) * 100, 100);
                  return (
                    <Card key={i} className="glass-card">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <usage.icon className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">{usage.label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {usage.current}{usage.unit ? usage.unit : ""} / {isUnlimited ? "∞" : `${usage.max}${usage.unit || ""}`}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct > 80 ? "bg-destructive" : "bg-primary"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {pct > 80 && !isUnlimited && (
                          <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Approaching limit — consider upgrading
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>No active subscription. Choose a plan to get started.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Upgrade Confirmation Dialog */}
        <Dialog open={upgradeDialog} onOpenChange={setUpgradeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedPlan?.price === 0 ? "Start Free Trial" : "Confirm Plan Change"}
              </DialogTitle>
              <DialogDescription>
                {selectedPlan?.price === 0
                  ? `Start your ${selectedPlan?.trial_days}-day free trial of ${selectedPlan?.name}.`
                  : `You are about to switch to the ${selectedPlan?.name} plan at ${getPrice(selectedPlan?.price || 0)}.`}
              </DialogDescription>
            </DialogHeader>
            {selectedPlan && (
              <div className="space-y-3 py-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Billing</span>
                  <span className="font-medium">{billingCycle === "yearly" ? "Annual" : "Monthly"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">{getPrice(selectedPlan.price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Users</span>
                  <span className="font-medium">{selectedPlan.max_users === -1 ? "Unlimited" : selectedPlan.max_users}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Units</span>
                  <span className="font-medium">{selectedPlan.max_units === -1 ? "Unlimited" : selectedPlan.max_units}</span>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setUpgradeDialog(false)}>Cancel</Button>
              <Button
                onClick={() => selectedPlan && upgradeMutation.mutate(selectedPlan.id)}
                disabled={upgradeMutation.isPending}
              >
                {upgradeMutation.isPending ? "Processing..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </AppLayout>
  );
};

export default Subscriptions;

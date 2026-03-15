import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format, differenceInDays } from "date-fns";
import {
  Check, Crown, Zap, Building2, Star, ArrowRight, Shield, Clock,
  Users, HardDrive, Brain, Globe, CreditCard, Receipt, History,
  AlertTriangle, ArrowUpRight, Settings, FileText, XCircle, RefreshCw, Loader2
} from "lucide-react";

const Subscriptions = () => {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [upgradeDialog, setUpgradeDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

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

  const { data: currentSub, refetch: refetchSub } = useQuery({
    queryKey: ["current-subscription", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return null;
      const { data, error } = await supabase
        .from("customer_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("organization_id", currentOrg.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrg?.id,
  });

  const { data: enabledModules = [] } = useQuery({
    queryKey: ["enabled-modules", currentSub?.id],
    queryFn: async () => {
      if (!currentSub?.id) return [];
      const { data, error } = await supabase
        .from("subscription_modules")
        .select("*, platform_modules(*)")
        .eq("subscription_id", currentSub.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentSub?.id,
  });

  const { data: planModules = [] } = useQuery({
    queryKey: ["plan-modules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_modules").select("*, platform_modules(*)");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: billingHistory = [] } = useQuery({
    queryKey: ["billing-history", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data, error } = await supabase
        .from("billing_history")
        .select("*")
        .eq("organization_id", currentOrg.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrg?.id,
  });

  const { data: usageLimits = [] } = useQuery({
    queryKey: ["usage-limits", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data, error } = await supabase
        .from("usage_limits")
        .select("*")
        .eq("organization_id", currentOrg.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrg?.id,
  });

  const getUsageCount = (resource: string) => {
    const entry = usageLimits.find((u: any) => u.resource_type === resource);
    return entry?.current_count || 0;
  };

  // Handle payment callback from Stripe
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");
    const planId = searchParams.get("plan_id");
    const cycle = searchParams.get("billing_cycle");

    if (paymentStatus === "success" && sessionId && currentOrg?.id) {
      // Verify payment with backend
      const verifyPayment = async () => {
        try {
          const { data, error } = await supabase.functions.invoke("verify-plan-payment", {
            body: { session_id: sessionId, plan_id: planId, billing_cycle: cycle, organization_id: currentOrg.id },
          });
          if (error) throw error;
          if (data?.verified) {
            toast({ title: "Payment Successful! 🎉", description: "Your subscription has been activated." });
            queryClient.invalidateQueries({ queryKey: ["current-subscription"] });
            queryClient.invalidateQueries({ queryKey: ["enabled-modules"] });
            queryClient.invalidateQueries({ queryKey: ["billing-history"] });
          } else {
            toast({ title: "Payment Pending", description: "We're verifying your payment. Please refresh in a moment.", variant: "destructive" });
          }
        } catch (e: any) {
          toast({ title: "Verification Error", description: e.message, variant: "destructive" });
        }
      };
      verifyPayment();
      setSearchParams({}, { replace: true });
    } else if (paymentStatus === "cancelled") {
      toast({ title: "Payment Cancelled", description: "You can try again whenever you're ready." });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, currentOrg?.id]);

  // Auto-open upgrade dialog if plan param is in URL (from website pricing)
  useEffect(() => {
    const planId = searchParams.get("plan");
    if (planId && plans.length > 0 && !searchParams.get("payment")) {
      const plan = plans.find((p: any) => p.id === planId);
      if (plan && plan.id !== (currentSub as any)?.plan_id) {
        setSelectedPlan(plan);
        setUpgradeDialog(true);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, plans, currentSub]);

  // Stripe checkout for paid plans
  const handleStripeCheckout = async (plan: any) => {
    if (!currentOrg?.id) return;
    setCheckoutLoading(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-plan-checkout", {
        body: { plan_id: plan.id, billing_cycle: billingCycle, organization_id: currentOrg.id },
      });
      if (error) throw error;
      if (data?.free) {
        // Free plan - handle directly
        await handleFreePlanSwitch(plan);
      } else if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCheckoutLoading(null);
      setUpgradeDialog(false);
    }
  };

  // Free/trial plan switch (no payment needed)
  const handleFreePlanSwitch = async (plan: any) => {
    if (!currentOrg?.id || !user?.id) return;
    const multiplier = billingCycle === "yearly" ? 10 : 1;
    const totalAmount = plan.price * multiplier;
    const action = currentSub ? "plan_change" : "new_subscription";
    const prevPlan = (currentSub as any)?.subscription_plans?.name;

    if (currentSub) {
      await supabase.from("customer_subscriptions").update({
        plan_id: plan.id, billing_cycle: billingCycle, total_amount: totalAmount,
        status: plan.plan_type === "trial" ? "trialing" : "active",
        trial_ends_at: plan.plan_type === "trial" ? new Date(Date.now() + (plan.trial_days || 14) * 86400000).toISOString() : null,
        next_billing_date: new Date(Date.now() + (billingCycle === "yearly" ? 365 : 30) * 86400000).toISOString().split("T")[0],
      }).eq("id", currentSub.id);
    } else {
      await supabase.from("customer_subscriptions").insert({
        organization_id: currentOrg.id, plan_id: plan.id, billing_cycle: billingCycle,
        total_amount: totalAmount, status: plan.plan_type === "trial" ? "trialing" : "active",
        trial_ends_at: plan.plan_type === "trial" ? new Date(Date.now() + (plan.trial_days || 14) * 86400000).toISOString() : null,
        next_billing_date: new Date(Date.now() + (billingCycle === "yearly" ? 365 : 30) * 86400000).toISOString().split("T")[0],
      });
    }

    await supabase.from("billing_history").insert({
      organization_id: currentOrg.id, action, plan_name: plan.name, amount: totalAmount,
      billing_cycle: billingCycle,
      description: action === "plan_change" ? `Changed from ${prevPlan} to ${plan.name}` : `Subscribed to ${plan.name} plan`,
      invoice_number: `INV-${Date.now().toString(36).toUpperCase()}`,
      status: plan.price === 0 ? "trial" : "completed",
    });

    // Enable modules
    const subData = await supabase.from("customer_subscriptions").select("id").eq("organization_id", currentOrg.id).maybeSingle();
    if (subData.data) {
      const includedMods = planModules.filter((pm: any) => pm.plan_id === plan.id && pm.is_included);
      for (const pm of includedMods) {
        await supabase.from("subscription_modules").upsert(
          { subscription_id: subData.data.id, module_id: pm.module_id, is_enabled: true, enabled_at: new Date().toISOString() },
          { onConflict: "subscription_id,module_id" }
        ).select();
      }
    }

    queryClient.invalidateQueries({ queryKey: ["current-subscription"] });
    queryClient.invalidateQueries({ queryKey: ["enabled-modules"] });
    queryClient.invalidateQueries({ queryKey: ["billing-history"] });
    setUpgradeDialog(false);
    toast({ title: "Plan Updated", description: `Switched to ${plan.name} plan.` });
  };

  // Cancel subscription
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!currentOrg?.id) throw new Error("No org");
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: { organization_id: currentOrg.id, action: "cancel" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["billing-history"] });
      setCancelDialog(false);
      toast({ title: "Subscription Cancelled", description: "Your access will continue until the end of the billing period." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Reactivate subscription
  const reactivateMutation = useMutation({
    mutationFn: async () => {
      if (!currentOrg?.id) throw new Error("No org");
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: { organization_id: currentOrg.id, action: "reactivate" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["billing-history"] });
      toast({ title: "Subscription Reactivated! 🎉" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const getPrice = (price: number) => {
    if (price === 0) return "Free";
    const multiplier = billingCycle === "yearly" ? 10 : 1;
    return `AED ${(price * multiplier).toLocaleString()}${billingCycle === "yearly" ? "/yr" : "/mo"}`;
  };

  const planIcons = [Shield, Zap, Crown, Building2];
  const planColors = ["from-muted to-muted/50", "from-blue-500/20 to-blue-600/10", "from-primary/20 to-primary/10", "from-amber-500/20 to-amber-600/10"];

  const currentPlanId = (currentSub as any)?.plan_id;
  const currentPlanIndex = plans.findIndex((p: any) => p.id === currentPlanId);
  const getModulesForPlan = (planId: string) => planModules.filter((pm: any) => pm.plan_id === planId && pm.is_included);

  const isCancelled = currentSub?.status === "cancelled";
  const isTrialing = currentSub?.status === "trialing";
  const trialDaysLeft = isTrialing && currentSub?.trial_ends_at
    ? Math.max(0, differenceInDays(new Date(currentSub.trial_ends_at), new Date()))
    : 0;

  const actionLabels: Record<string, string> = {
    new_subscription: "New Subscription", plan_change: "Plan Change", payment: "Payment",
    renewal: "Renewal", cancellation: "Cancellation", refund: "Refund",
  };
  const actionColors: Record<string, string> = {
    new_subscription: "bg-emerald-500/20 text-emerald-400", plan_change: "bg-blue-500/20 text-blue-400",
    payment: "bg-primary/20 text-primary", renewal: "bg-primary/20 text-primary",
    cancellation: "bg-destructive/20 text-destructive", refund: "bg-orange-500/20 text-orange-400",
  };

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
              Current: {(currentSub as any)?.subscription_plans?.name || "N/A"} — {currentSub.status}
            </Badge>
          )}
        </div>

        {/* Trial Warning Banner */}
        {isTrialing && trialDaysLeft <= 7 && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-400">Trial ending soon</AlertTitle>
            <AlertDescription className="text-amber-400/80">
              Your trial expires in {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""}.
              <Button variant="link" className="text-amber-400 p-0 ml-1 h-auto" onClick={() => setActiveTab("plans")}>
                Upgrade now →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Cancelled Banner */}
        {isCancelled && (
          <Alert className="border-destructive/50 bg-destructive/10">
            <XCircle className="h-4 w-4 text-destructive" />
            <AlertTitle className="text-destructive">Subscription Cancelled</AlertTitle>
            <AlertDescription className="text-destructive/80">
              Access continues until {currentSub?.expires_at ? format(new Date(currentSub.expires_at), "dd MMM yyyy") : "end of period"}.
              <Button
                variant="link" className="text-destructive p-0 ml-1 h-auto"
                onClick={() => reactivateMutation.mutate()}
                disabled={reactivateMutation.isPending}
              >
                {reactivateMutation.isPending ? "Reactivating..." : "Reactivate →"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Row */}
        {currentSub && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: Crown, label: "Current Plan", value: (currentSub as any)?.subscription_plans?.name || "N/A", color: "text-primary" },
              { icon: CreditCard, label: "Billing Cycle", value: currentSub.billing_cycle === "yearly" ? "Annual" : "Monthly", color: "text-blue-400" },
              { icon: Receipt, label: "Amount", value: `AED ${(currentSub.total_amount || 0).toLocaleString()}`, color: "text-emerald-400" },
              { icon: Clock, label: isTrialing ? "Trial Ends" : "Next Billing", value: isTrialing && currentSub.trial_ends_at ? format(new Date(currentSub.trial_ends_at), "dd MMM yyyy") : currentSub.next_billing_date ? format(new Date(currentSub.next_billing_date), "dd MMM yyyy") : "N/A", color: "text-amber-400" },
            ].map((stat, i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
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
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
            <TabsTrigger value="billing">Billing History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4 space-y-6">
            {currentSub ? (
              <>
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Crown className="w-5 h-5 text-primary" /> Your Subscription
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        {[
                          { l: "Plan", v: (currentSub as any)?.subscription_plans?.name },
                          { l: "Status", v: <Badge className={`text-xs ${currentSub.status === "active" ? "bg-emerald-500/20 text-emerald-400" : currentSub.status === "trialing" ? "bg-amber-500/20 text-amber-400" : "bg-destructive/20 text-destructive"}`}>{currentSub.status}</Badge> },
                          { l: "Billing Cycle", v: currentSub.billing_cycle === "yearly" ? "Annual" : "Monthly" },
                          { l: "Amount", v: `AED ${(currentSub.total_amount || 0).toLocaleString()}` },
                        ].map((row, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{row.l}</span>
                            <span className="font-medium">{row.v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3">
                        {[
                          { l: "Started", v: format(new Date(currentSub.started_at), "dd MMM yyyy") },
                          { l: "Next Billing", v: currentSub.next_billing_date ? format(new Date(currentSub.next_billing_date), "dd MMM yyyy") : "—" },
                          { l: "Max Users", v: (currentSub as any)?.subscription_plans?.max_users === -1 ? "Unlimited" : (currentSub as any)?.subscription_plans?.max_users },
                          { l: "Max Units", v: (currentSub as any)?.subscription_plans?.max_units === -1 ? "Unlimited" : (currentSub as any)?.subscription_plans?.max_units },
                        ].map((row, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{row.l}</span>
                            <span className="font-medium">{row.v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border/30">
                      <Button variant="outline" onClick={() => setActiveTab("plans")} className="gap-2">
                        <ArrowUpRight className="w-4 h-4" /> Change Plan
                      </Button>
                      {!isCancelled && currentSub.status !== "trialing" && (
                        <Button variant="ghost" className="text-destructive hover:text-destructive gap-2" onClick={() => setCancelDialog(true)}>
                          <XCircle className="w-4 h-4" /> Cancel Subscription
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" /> Active Modules ({enabledModules.filter((em: any) => em.is_enabled).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {enabledModules.filter((em: any) => em.is_enabled).map((em: any) => (
                        <Badge key={em.id} className="bg-primary/20 text-primary text-xs px-3 py-1">
                          {em.platform_modules?.name || "Module"}
                        </Badge>
                      ))}
                      {enabledModules.filter((em: any) => em.is_enabled).length === 0 && (
                        <p className="text-sm text-muted-foreground">No modules enabled yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="glass-card">
                <CardContent className="p-8 text-center">
                  <Crown className="w-12 h-12 mx-auto mb-3 text-primary opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
                  <p className="text-sm text-muted-foreground mb-4">Choose a plan below to get started.</p>
                  <Button onClick={() => setActiveTab("plans")}>View Plans</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6 mt-4">
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm ${billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
              <Switch checked={billingCycle === "yearly"} onCheckedChange={(v) => setBillingCycle(v ? "yearly" : "monthly")} />
              <span className={`text-sm ${billingCycle === "yearly" ? "text-foreground" : "text-muted-foreground"}`}>
                Yearly <Badge variant="secondary" className="ml-1 text-xs">Save 17%</Badge>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan: any, i: number) => {
                const Icon = planIcons[i] || Star;
                const isCurrent = plan.id === currentPlanId;
                const isDowngrade = currentPlanIndex >= 0 && i < currentPlanIndex;
                const includedMods = getModulesForPlan(plan.id);

                return (
                  <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Card className={`glass-card relative overflow-hidden h-full flex flex-col ${plan.is_featured ? "border-primary ring-1 ring-primary/30" : ""} ${isCurrent ? "border-primary/50" : ""}`}>
                      {plan.is_featured && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50" />}
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
                          <li className="flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-primary shrink-0" /> {plan.max_users === -1 ? "Unlimited" : plan.max_users} users</li>
                          <li className="flex items-center gap-2 text-sm"><Building2 className="w-4 h-4 text-primary shrink-0" /> {plan.max_units === -1 ? "Unlimited" : plan.max_units} units</li>
                          <li className="flex items-center gap-2 text-sm"><HardDrive className="w-4 h-4 text-primary shrink-0" /> {plan.max_storage_gb}GB storage</li>
                          <li className="flex items-center gap-2 text-sm"><Globe className="w-4 h-4 text-primary shrink-0" /> {plan.max_api_calls === -1 ? "Unlimited" : (plan.max_api_calls || 0).toLocaleString()} API calls</li>
                          <li className="flex items-center gap-2 text-sm"><Brain className="w-4 h-4 text-primary shrink-0" /> {plan.ai_usage_limit === -1 ? "Unlimited" : plan.ai_usage_limit} AI queries</li>
                          {includedMods.length > 0 && (
                            <li className="flex items-start gap-2 text-sm"><Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {includedMods.length} modules</li>
                          )}
                        </ul>
                        <Button
                          className="w-full gap-2"
                          variant={isCurrent ? "outline" : plan.is_featured ? "default" : "secondary"}
                          disabled={isCurrent || checkoutLoading === plan.id}
                          onClick={() => {
                            if (plan.price === 0) {
                              handleFreePlanSwitch(plan);
                            } else {
                              setSelectedPlan(plan);
                              setUpgradeDialog(true);
                            }
                          }}
                        >
                          {checkoutLoading === plan.id ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                          ) : isCurrent ? "Current Plan" : isDowngrade ? "Downgrade" : plan.price === 0 ? "Start Trial" : (
                            <><CreditCard className="w-4 h-4" /> {isDowngrade ? "Downgrade" : "Upgrade"}</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((mod: any) => {
                const isEnabled = enabledModules.some((em: any) => em.module_id === mod.id && em.is_enabled);
                const planMod = planModules.find((pm: any) => pm.module_id === mod.id && pm.plan_id === currentPlanId);
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
                          {isEnabled ? "Active" : addonPrice ? `AED ${addonPrice}/mo` : "Available"}
                        </Badge>
                      </div>
                      {mod.description && <p className="text-xs text-muted-foreground mt-2">{mod.description}</p>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="mt-4">
            {currentSub ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Properties", current: getUsageCount("properties"), max: (currentSub as any)?.subscription_plans?.max_properties, icon: Building2 },
                  { label: "Tenants", current: getUsageCount("tenants"), max: (currentSub as any)?.subscription_plans?.max_tenants, icon: Users },
                  { label: "Users", current: getUsageCount("users"), max: (currentSub as any)?.subscription_plans?.max_users, icon: Users },
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
                            {usage.current}{usage.unit || ""} / {isUnlimited ? "∞" : `${usage.max}${usage.unit || ""}`}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${pct > 80 ? "bg-destructive" : "bg-primary"}`} style={{ width: `${pct}%` }} />
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

          {/* Billing History Tab */}
          <TabsContent value="billing" className="mt-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" /> Billing History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {billingHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Invoice #</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billingHistory.map((entry: any) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-sm">{format(new Date(entry.created_at), "dd MMM yyyy")}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-xs ${actionColors[entry.action] || ""}`}>
                              {actionLabels[entry.action] || entry.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{entry.plan_name || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{entry.description || "—"}</TableCell>
                          <TableCell className="text-sm font-mono text-muted-foreground">{entry.invoice_number || "—"}</TableCell>
                          <TableCell className="text-sm text-right font-medium">
                            {entry.amount > 0 ? `${entry.currency || "AED"} ${Number(entry.amount).toLocaleString()}` : "Free"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={entry.status === "completed" ? "default" : "secondary"}
                              className={entry.status === "completed" ? "bg-emerald-500/20 text-emerald-400" : ""}>
                              {entry.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No billing history yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Upgrade Confirmation Dialog (Stripe checkout) */}
        <Dialog open={upgradeDialog} onOpenChange={setUpgradeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                {selectedPlan?.price === 0 ? "Start Free Trial" : "Confirm & Pay"}
              </DialogTitle>
              <DialogDescription>
                {selectedPlan?.price === 0
                  ? `Start your ${selectedPlan?.trial_days}-day free trial of ${selectedPlan?.name}.`
                  : `You'll be redirected to secure checkout to complete your ${selectedPlan?.name} plan payment.`}
              </DialogDescription>
            </DialogHeader>
            {selectedPlan && (
              <div className="space-y-3 py-2">
                {[
                  { l: "Plan", v: selectedPlan.name },
                  { l: "Billing", v: billingCycle === "yearly" ? "Annual" : "Monthly" },
                  { l: "Price", v: getPrice(selectedPlan.price) },
                  { l: "Users", v: selectedPlan.max_users === -1 ? "Unlimited" : selectedPlan.max_users },
                  { l: "Units", v: selectedPlan.max_units === -1 ? "Unlimited" : selectedPlan.max_units },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{r.l}</span>
                    <span className="font-medium">{r.v}</span>
                  </div>
                ))}
                {selectedPlan.price > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      Secure payment powered by Stripe. Your card details are never stored on our servers.
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setUpgradeDialog(false)}>Cancel</Button>
              <Button
                onClick={() => selectedPlan && (selectedPlan.price === 0 ? handleFreePlanSwitch(selectedPlan) : handleStripeCheckout(selectedPlan))}
                disabled={checkoutLoading === selectedPlan?.id}
                className="gap-2"
              >
                {checkoutLoading === selectedPlan?.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : selectedPlan?.price === 0 ? "Start Trial" : (
                  <><CreditCard className="w-4 h-4" /> Pay & Subscribe</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Confirmation Dialog */}
        <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <XCircle className="w-5 h-5" /> Cancel Subscription
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel? Your access will continue until the end of your current billing period
                {currentSub?.next_billing_date && ` (${format(new Date(currentSub.next_billing_date), "dd MMM yyyy")})`}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelDialog(false)}>Keep Subscription</Button>
              <Button variant="destructive" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending} className="gap-2">
                {cancelMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling...</> : "Confirm Cancellation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </AppLayout>
  );
};

export default Subscriptions;

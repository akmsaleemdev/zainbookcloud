import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMasterAdmin } from "@/hooks/useMasterAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Building2, Crown, CheckCircle2, ArrowRight, ArrowLeft,
  Shield, Zap, Loader2,
} from "lucide-react";

type Step = "plan" | "organization" | "complete";

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPlanId = searchParams.get("plan");

  // ── MASTER ADMIN REDIRECT ────────────────────────────────────
  // Must be at the top — before any other logic
  const { isMasterAdmin, loading: adminLoading } = useMasterAdmin();

  useEffect(() => {
    if (!adminLoading && isMasterAdmin) {
      navigate("/master-admin", { replace: true });
    }
  }, [isMasterAdmin, adminLoading, navigate]);

  const [step, setStep] = useState<Step>("plan");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(preselectedPlanId);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [orgName, setOrgName] = useState("");
  const [orgNameAr, setOrgNameAr] = useState("");
  const [emirate, setEmirate] = useState("Dubai");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPhone, setOrgPhone] = useState("");

  // Check if normal user already has an org — redirect to dashboard
  const { data: existingOrg, isLoading: checkingOrg } = useQuery({
    queryKey: ["onboarding-check-org", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      return data;
    },
    // Only run for confirmed non-admin users
    enabled: !!user && !adminLoading && !isMasterAdmin,
  });

  useEffect(() => {
    if (existingOrg) {
      navigate("/dashboard", { replace: true });
    }
  }, [existingOrg, navigate]);

  // Prefill email from user
  useEffect(() => {
    if (user?.email && !orgEmail) {
      setOrgEmail(user.email);
    }
  }, [user]);

  const { data: plans = [] } = useQuery({
    queryKey: ["onboarding-plans"],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
    enabled: !isMasterAdmin,
  });

  useEffect(() => {
    if (preselectedPlanId && plans.length > 0) {
      setSelectedPlanId(preselectedPlanId);
    }
  }, [preselectedPlanId, plans]);

  const { data: planModules = [] } = useQuery({
    queryKey: ["onboarding-plan-modules"],
    queryFn: async () => {
      const { data } = await supabase
        .from("plan_modules")
        .select("*, platform_modules(name, slug)")
        .eq("is_included", true);
      return data || [];
    },
    enabled: !isMasterAdmin,
  });

  const createOrgMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedPlanId) throw new Error("Missing user or plan");
      const { data, error } = await supabase.rpc("onboard_organization", {
        _user_id: user.id,
        _org_name: orgName,
        _org_name_ar: orgNameAr || null,
        _emirate: emirate,
        _org_email: orgEmail,
        _org_phone: orgPhone || null,
        _plan_id: selectedPlanId,
        _billing_cycle: billingCycle,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setStep("complete");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create organization");
    },
  });

  const selectedPlan = plans.find((p: any) => p.id === selectedPlanId);
  const planIcon = [Shield, Zap, Crown, Building2];

  // Show spinner while checking admin status or if master admin (redirect in progress)
  if (adminLoading || isMasterAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (checkingOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">ZainBook AI</h1>
            <p className="text-xs text-muted-foreground">Setup your workspace</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-4xl mx-auto px-6 pt-8 w-full">
        <div className="flex items-center gap-2 mb-8">
          {(["plan", "organization", "complete"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : (["plan", "organization", "complete"].indexOf(step) > i)
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {["plan", "organization", "complete"].indexOf(step) > i ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {s === "plan" ? "Select Plan" : s === "organization" ? "Create Workspace" : "Ready!"}
              </span>
              {i < 2 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-4xl mx-auto px-6 pb-12 w-full">
        <AnimatePresence mode="wait">
          {step === "plan" && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-foreground">Choose Your Plan</h2>
                <p className="text-muted-foreground mt-1">Start with a free trial or pick the plan that fits your needs.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    billingCycle === "monthly" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    billingCycle === "yearly" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  Yearly <span className="text-xs opacity-80">Save 17%</span>
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {plans.filter((p: any) => p.plan_type === billingCycle || p.plan_type === "trial").map((plan: any, i: number) => {
                  const Icon = planIcon[i % planIcon.length];
                  const isSelected = selectedPlanId === plan.id;
                  const price = plan.price === 0 ? "Free" : `AED ${(plan.price * (billingCycle === "yearly" ? 10 : 1)).toLocaleString()}`;
                  return (
                    <Card
                      key={plan.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                          : "border-border/50 hover:border-primary/30"
                      }`}
                      onClick={() => setSelectedPlanId(plan.id)}
                    >
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          {plan.is_featured && <Badge className="bg-primary/20 text-primary border-0 text-xs">Popular</Badge>}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{plan.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                          {price}
                          {plan.price > 0 && <span className="text-sm font-normal text-muted-foreground">/{billingCycle === "yearly" ? "yr" : "mo"}</span>}
                        </div>
                        <ul className="space-y-1.5">
                          <li className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-primary" />
                            {plan.max_users === -1 ? "Unlimited" : plan.max_users} users
                          </li>
                          <li className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-primary" />
                            {plan.max_units === -1 ? "Unlimited" : plan.max_units} units
                          </li>
                          <li className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-primary" />
                            {plan.max_storage_gb === -1 ? "Unlimited" : `${plan.max_storage_gb} GB`} storage
                          </li>
                        </ul>
                        {isSelected && (
                          <div className="pt-2">
                            <Badge className="bg-primary text-primary-foreground w-full justify-center py-1">Selected</Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep("organization")} disabled={!selectedPlanId} className="gap-2" size="lg">
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "organization" && (
            <motion.div
              key="organization"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-foreground">Create Your Workspace</h2>
                <p className="text-muted-foreground mt-1">Set up your organization to start managing properties.</p>
              </div>

              {selectedPlan && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <Crown className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{(selectedPlan as any).name} Plan</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedPlan as any).price === 0
                        ? `${(selectedPlan as any).trial_days || 14}-day free trial`
                        : `AED ${((selectedPlan as any).price * (billingCycle === "yearly" ? 10 : 1)).toLocaleString()}/${billingCycle === "yearly" ? "yr" : "mo"}`}
                    </p>
                  </div>
                  <button onClick={() => setStep("plan")} className="ml-auto text-xs text-primary hover:underline">Change</button>
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Organization Name *</Label>
                  <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. Al Fattan Properties LLC" className="h-11 bg-secondary/50 border-border/30" required />
                </div>
                <div className="space-y-2">
                  <Label>Organization Name (Arabic)</Label>
                  <Input value={orgNameAr} onChange={(e) => setOrgNameAr(e.target.value)} placeholder="الاسم بالعربي" className="h-11 bg-secondary/50 border-border/30" dir="rtl" />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} placeholder="contact@company.com" className="h-11 bg-secondary/50 border-border/30" required />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={orgPhone} onChange={(e) => setOrgPhone(e.target.value)} placeholder="+971 50 123 4567" className="h-11 bg-secondary/50 border-border/30" />
                </div>
                <div className="space-y-2">
                  <Label>Emirate *</Label>
                  <select value={emirate} onChange={(e) => setEmirate(e.target.value)} className="w-full h-11 rounded-md border border-border/30 bg-secondary/50 px-3 text-sm text-foreground">
                    {["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"].map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep("plan")} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button onClick={() => createOrgMutation.mutate()} disabled={!orgName.trim() || !orgEmail.trim() || createOrgMutation.isPending} className="gap-2" size="lg">
                  {createOrgMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                  ) : (
                    <>Create Workspace <ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "complete" && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 space-y-6">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">You're All Set!</h2>
                <p className="text-muted-foreground mt-2">
                  Your workspace <strong>{orgName}</strong> has been created with the{" "}
                  <strong>{(selectedPlan as any)?.name}</strong> plan.
                </p>
              </div>
              <Button size="lg" className="gap-2" onClick={() => { window.location.href = "/dashboard"; }}>
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;

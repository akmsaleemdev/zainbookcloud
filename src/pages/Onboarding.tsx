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
  Shield, Zap, Loader2, Gift,
} from "lucide-react";

type Step = "plan" | "organization" | "complete";
const PLAN_ICONS = [Gift, Zap, Shield, Crown, Building2];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPlanId = searchParams.get("plan");
  const { isMasterAdmin, loading: adminLoading } = useMasterAdmin();

  useEffect(() => {
    if (!adminLoading && isMasterAdmin) navigate("/master-admin", { replace: true });
  }, [isMasterAdmin, adminLoading, navigate]);

  const [step, setStep] = useState<Step>("plan");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(preselectedPlanId);
  const [orgName, setOrgName] = useState("");
  const [orgNameAr, setOrgNameAr] = useState("");
  const [emirate, setEmirate] = useState("Dubai");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPhone, setOrgPhone] = useState("");

  const { data: existingOrg, isLoading: checkingOrg } = useQuery({
    queryKey: ["onboarding-check-org", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("organization_members").select("organization_id")
        .eq("user_id", user.id).limit(1).maybeSingle();
      return data;
    },
    enabled: !!user && !adminLoading && !isMasterAdmin,
  });

  useEffect(() => { if (existingOrg) navigate("/dashboard", { replace: true }); }, [existingOrg, navigate]);
  useEffect(() => { if (user?.email && !orgEmail) setOrgEmail(user.email); }, [user]);

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["onboarding-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans").select("*")
        .eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !isMasterAdmin,
  });

  useEffect(() => {
    if (preselectedPlanId && plans.length > 0) {
      setSelectedPlanId(preselectedPlanId);
    } else if (!selectedPlanId && plans.length > 0) {
      const trial = plans.find((p: any) => p.plan_type === "trial");
      if (trial) setSelectedPlanId(trial.id);
    }
  }, [preselectedPlanId, plans]);

  const createOrgMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedPlanId) throw new Error("Missing user or plan");
      const { data, error } = await supabase.rpc("onboard_organization", {
        _user_id: user.id, _org_name: orgName, _org_name_ar: orgNameAr || null,
        _emirate: emirate, _org_email: orgEmail, _org_phone: orgPhone || null,
        _plan_id: selectedPlanId, _billing_cycle: "monthly",
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => setStep("complete"),
    onError: (err: any) => toast.error(err.message || "Failed to create organization"),
  });

  const selectedPlan = plans.find((p: any) => p.id === selectedPlanId);

  const formatPrice = (plan: any) => {
    if (plan.plan_type === "trial" || plan.price === 0) return "Free";
    return `AED ${Number(plan.price).toLocaleString()}`;
  };
  const getPriceSuffix = (plan: any) => {
    if (plan.plan_type === "trial" || plan.price === 0) return "";
    return plan.plan_type === "yearly" ? "/yr" : "/mo";
  };
  const getMaxLabel = (val: number, unit: string) =>
    val === -1 ? `Unlimited ${unit}` : `${val} ${unit}`;

  if (adminLoading || isMasterAdmin) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (checkingOrg) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">ZainBook AI</h1>
            <p className="text-xs text-muted-foreground">Setup your workspace</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-8 w-full">
        <div className="flex items-center gap-2 mb-8">
          {(["plan", "organization", "complete"] as Step[]).map((s, i) => {
            const idx = ["plan", "organization", "complete"].indexOf(step);
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${step === s ? "bg-primary text-primary-foreground" : idx > i ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {idx > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {s === "plan" ? "Select Plan" : s === "organization" ? "Create Workspace" : "Ready!"}
                </span>
                {i < 2 && <div className="flex-1 h-px bg-border" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto px-6 pb-12 w-full">
        <AnimatePresence mode="wait">
          {step === "plan" && (
            <motion.div key="plan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Choose Your Plan</h2>
                <p className="text-muted-foreground mt-1">Start with a free 14-day trial or pick a plan that fits your business.</p>
              </div>
              {plansLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : plans.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground"><p>No plans available. Please contact support.</p></div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {plans.map((plan: any, i: number) => {
                    const Icon = PLAN_ICONS[i % PLAN_ICONS.length];
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <Card key={plan.id} className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border/50 hover:border-primary/30"}`} onClick={() => setSelectedPlanId(plan.id)}>
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                            <div className="flex gap-1 flex-wrap justify-end">
                              {plan.plan_type === "trial" && <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border text-xs">Free Trial</Badge>}
                              {plan.is_featured && plan.plan_type !== "trial" && <Badge className="bg-primary/20 text-primary border-primary/30 border text-xs">Popular</Badge>}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{plan.name}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{plan.description}</p>
                          </div>
                          <div className="text-2xl font-bold text-foreground">
                            {formatPrice(plan)}
                            {getPriceSuffix(plan) && <span className="text-sm font-normal text-muted-foreground">{getPriceSuffix(plan)}</span>}
                          </div>
                          <ul className="space-y-1.5">
                            <li className="text-xs text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-primary shrink-0" />{getMaxLabel(plan.max_users, "users")}</li>
                            <li className="text-xs text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-primary shrink-0" />{getMaxLabel(plan.max_properties, "properties")}</li>
                            <li className="text-xs text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-primary shrink-0" />{getMaxLabel(plan.max_units, "units")}</li>
                            {plan.ai_features_access && <li className="text-xs text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-primary shrink-0" />AI features included</li>}
                            {plan.plan_type === "trial" && <li className="text-xs text-green-400 flex items-center gap-1.5 font-medium"><Gift className="w-3 h-3 shrink-0" />{plan.trial_days || 14} days free — no card needed</li>}
                          </ul>
                          {isSelected && <Badge className="bg-primary text-primary-foreground w-full justify-center py-1">✓ Selected</Badge>}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => setStep("organization")} disabled={!selectedPlanId || plansLoading} className="gap-2" size="lg">
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "organization" && (
            <motion.div key="organization" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Create Your Workspace</h2>
                <p className="text-muted-foreground mt-1">Set up your organization to start managing properties.</p>
              </div>
              {selectedPlan && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <Crown className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedPlan.name} Plan</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPlan.plan_type === "trial" ? `${selectedPlan.trial_days || 14}-day free trial — full access` : `AED ${Number(selectedPlan.price).toLocaleString()}/mo`}
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
                    {["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"].map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep("plan")} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={() => createOrgMutation.mutate()} disabled={!orgName.trim() || !orgEmail.trim() || createOrgMutation.isPending} className="gap-2" size="lg">
                  {createOrgMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <>Create Workspace <ArrowRight className="w-4 h-4" /></>}
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
                  Your workspace <strong>{orgName}</strong> has been created{selectedPlan && <> with the <strong>{selectedPlan.name}</strong> plan</>}.
                </p>
                {selectedPlan?.plan_type === "trial" && (
                  <p className="text-sm text-green-400 mt-2">🎉 Your {selectedPlan.trial_days || 14}-day free trial starts now!</p>
                )}
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

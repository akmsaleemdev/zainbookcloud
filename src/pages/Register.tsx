import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, UploadCloud, CheckCircle2, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { isMasterAdminEmail } from "@/lib/auth-constants";
import { toast } from "sonner";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [firstName,    setFirstName]    = useState("");
  const [lastName,     setLastName]     = useState("");
  const [companyName,  setCompanyName]  = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [confirmPass,  setConfirmPass]  = useState("");
  const [tradeLicense, setTradeLicense] = useState("");

  // ── Step 1: Validate and proceed ───────────────────────────
  const handleStep1 = () => {
    if (!firstName.trim()) { toast.error("First name is required"); return; }
    if (!lastName.trim())  { toast.error("Last name is required"); return; }
    if (!email.trim() || !email.includes("@")) { toast.error("Valid email is required"); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== confirmPass) { toast.error("Passwords do not match"); return; }
    setStep(2);
  };

  // ── Step 2: Create account with Supabase ───────────────────
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email:    email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name:    `${firstName.trim()} ${lastName.trim()}`,
            company_name: companyName.trim() || null,
          },
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("Account creation failed. Please try again.");

      // 2. Create profile row
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          user_id:    authData.user.id,
          full_name:  `${firstName.trim()} ${lastName.trim()}`,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (profileError) console.error("Profile create error:", profileError.message);

      // 3. If email confirmation is disabled (instant login), redirect by role
      if (authData.session) {
        toast.success("Account created!");
        if (isMasterAdminEmail(authData.user?.email)) {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }
      } else {
        // Email confirmation required — show step 3
        setStep(3);
      }

    } catch (err: any) {
      const msg = err?.message || "Registration failed";
      if (msg.includes("already registered") || msg.includes("already been registered")) {
        toast.error("This email is already registered. Please sign in instead.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 gap-8 z-10">

        {/* ── Left: Registration Form ──────────────────────── */}
        <Card className="glass-card border-border/50 shadow-2xl relative overflow-hidden">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-500 ease-in-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          <CardContent className="p-8 md:p-12 space-y-8 mt-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Create your account</h1>
              <p className="text-muted-foreground text-sm">
                Join ZainBook AI — start your 14-day free trial
              </p>
            </div>

            {/* ── STEP 1: Account Details ─────────────────── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="e.g. Al Fattan Properties LLC"
                    className="bg-secondary/50 h-12"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      className="bg-secondary/50 h-12"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      className="bg-secondary/50 h-12"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Work Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@company.com"
                    className="bg-secondary/50 h-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      className="bg-secondary/50 h-12 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPass">Confirm Password *</Label>
                  <Input
                    id="confirmPass"
                    type="password"
                    placeholder="Repeat password"
                    className="bg-secondary/50 h-12"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleStep1()}
                  />
                </div>

                <Button className="w-full h-12 rounded-xl" onClick={handleStep1}>
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <div className="text-center text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 inline mr-1 text-primary" />
                  14-day free trial · No credit card required · Cancel anytime
                </div>
              </div>
            )}

            {/* ── STEP 2: Business Details + Submit ──────── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="tradeLicense">Trade License Number (optional)</Label>
                  <Input
                    id="tradeLicense"
                    placeholder="TRN-XXXXXX"
                    className="bg-secondary/50 h-12"
                    value={tradeLicense}
                    onChange={(e) => setTradeLicense(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    You can add this later in organization settings
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Upload Trade License (optional)</Label>
                  <div className="border-2 border-dashed border-border/50 rounded-2xl p-8 hover:bg-secondary/20 hover:border-primary/50 transition-colors cursor-pointer text-center group">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <UploadCloud className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">PDF, JPG or PNG (max. 10MB)</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Account Summary</p>
                  <p className="text-sm text-foreground font-medium">{firstName} {lastName}</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                  {companyName && <p className="text-sm text-muted-foreground">{companyName}</p>}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="h-12 w-12 shrink-0 rounded-xl bg-secondary/50 border-border/50"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </Button>
                  <Button
                    className="w-full h-12 rounded-xl flex-1"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Account...</>
                    ) : (
                      <>Create Account & Start Trial <ArrowRight className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Email Verification Sent ────────── */}
            {step === 3 && (
              <div className="space-y-6 text-center py-8">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Check your email!</h2>
                <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  We sent a verification link to <strong className="text-foreground">{email}</strong>.
                  Click the link to activate your account and start your free trial.
                </p>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
                  After verifying, you'll be taken to set up your workspace and select your plan.
                </div>
                <div className="pt-2 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl"
                    onClick={() => navigate("/auth")}
                  >
                    Back to Sign In
                  </Button>
                  <button
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    onClick={async () => {
                      const { error } = await supabase.auth.resend({
                        type: "signup",
                        email: email,
                        options: { emailRedirectTo: `${window.location.origin}/onboarding` },
                      });
                      if (error) toast.error(error.message);
                      else toast.success("Verification email resent!");
                    }}
                  >
                    Didn't receive it? Resend email
                  </button>
                </div>
              </div>
            )}

            {step < 3 && (
              <p className="text-center text-sm text-muted-foreground pt-4">
                Already have an account?{" "}
                <Link to="/auth" className="text-primary font-semibold hover:underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Right: Value Proposition ─────────────────────── */}
        <div className="hidden lg:flex flex-col justify-center p-12 relative">
          <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm flex items-center justify-center mb-8">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            The all-in-one platform for UAE property management
          </h2>
          <p className="text-white/60 text-sm mb-8">
            Start your 14-day free trial. No credit card required.
          </p>
          <ul className="space-y-5">
            {[
              "Automate Ejari and contract renewals",
              "Integrated VAT-compliant accounting",
              "Manage HR and WPS payroll natively",
              "AI-powered rent pricing and insights",
              "Full bed space and room management",
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-white/80">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[15px]">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMasterAdmin } from "@/hooks/useMasterAdmin";
import { isMasterAdminEmail } from "@/lib/auth-constants";
import { motion } from "framer-motion";

const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isMasterAdmin, loading: adminLoading } = useMasterAdmin();
  const selectedPlanId = searchParams.get("plan");

  // ── ROLE-BASED REDIRECT ─────────────────────────────────────
  // This runs when user is already logged in (page refresh / direct visit)
  // Wait for admin check to complete before redirecting
  useEffect(() => {
    if (!user || adminLoading) return;

    if (isMasterAdmin) {
      navigate("/master-admin", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isMasterAdmin, adminLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;

        toast.success("Welcome back!");

        // ── ROLE-BASED REDIRECT AFTER LOGIN ─────────────────
        const uid = authData.user?.id;
        const userEmail = authData.user?.email ?? email?.trim()?.toLowerCase();
        if (uid) {
          // Master Admin (by email) → always platform dashboard, never onboarding
          if (isMasterAdminEmail(userEmail)) {
            navigate("/master-admin", { replace: true });
            return;
          }

          // Super Admin / Master Admin by DB role (migration adds master_admin to app_role)
          const { data: roleRow } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", uid)
            .in("role", ["super_admin", "master_admin"])
            .limit(1)
            .maybeSingle();
          if (roleRow) {
            navigate("/master-admin", { replace: true });
            return;
          }

          // Normal user: org membership
          const { data: membership } = await supabase
            .from("organization_members")
            .select("id")
            .eq("user_id", uid)
            .limit(1)
            .maybeSingle();

          if (membership) {
            navigate("/dashboard", { replace: true });
          } else {
            const dest = selectedPlanId
              ? `/onboarding?plan=${selectedPlanId}`
              : "/onboarding";
            navigate(dest, { replace: true });
          }
        }

      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/onboarding`,
          },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to verify.");

      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          { redirectTo: `${window.location.origin}/reset-password` }
        );
        if (error) throw error;
        toast.success("Password reset email sent!");
        setMode("login");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="floating-card w-full max-w-[460px] p-12 relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">ZainBook</h1>
            <p className="text-xs text-muted-foreground font-medium tracking-widest uppercase">AI Property Management</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-center text-foreground mb-1">
          {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Password"}
        </h2>
        <p className="text-[15px] text-muted-foreground text-center mb-8">
          {mode === "login" ? "Sign in to continue" : mode === "signup" ? "Get started with ZainBook" : "Enter your email"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-[15px] text-muted-foreground">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="h-12 text-[15px] bg-secondary/50 border-border/30 rounded-xl"
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[15px] text-muted-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="pl-12 h-12 text-[15px] bg-secondary/50 border-border/30 rounded-xl"
                required
              />
            </div>
          </div>
          {mode !== "forgot" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[15px] text-muted-foreground">Password</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-12 pr-12 h-12 text-[15px] bg-secondary/50 border-border/30 rounded-xl"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-[15px] btn-premium rounded-xl font-semibold"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : mode === "signup"
              ? "Create Account"
              : "Send Reset Link"}
          </Button>
        </form>

        <div className="text-[15px] text-center text-muted-foreground mt-8">
          {mode === "forgot" ? (
            <button
              onClick={() => setMode("login")}
              className="text-primary hover:underline font-medium flex items-center gap-1.5 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </button>
          ) : (
            <p>
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-primary hover:underline font-semibold"
              >
                {mode === "login" ? "Sign Up" : "Sign In"}
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;

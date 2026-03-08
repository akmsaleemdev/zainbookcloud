import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to verify.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[15%] w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-info/[0.03] rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="floating-card w-full max-w-[400px] p-8 relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">ZainBook</h1>
            <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">AI Property Management</p>
          </div>
        </div>

        <h2 className="text-base font-semibold text-center text-foreground mb-0.5">
          {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Password"}
        </h2>
        <p className="text-xs text-muted-foreground text-center mb-6">
          {mode === "login" ? "Sign in to continue" : mode === "signup" ? "Get started with ZainBook" : "Enter your email"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs text-muted-foreground">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="h-9 text-sm bg-muted/30 border-border/30 rounded-lg" required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="pl-9 h-9 text-sm bg-muted/30 border-border/30 rounded-lg" required />
            </div>
          </div>
          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs text-muted-foreground">Password</Label>
                {mode === "login" && (
                  <button type="button" onClick={() => setMode("forgot")} className="text-[10px] text-primary hover:underline font-medium">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9 pr-9 h-9 text-sm bg-muted/30 border-border/30 rounded-lg" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full h-9 text-sm btn-premium rounded-lg font-medium" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
          </Button>
        </form>

        <div className="text-xs text-center text-muted-foreground mt-5">
          {mode === "forgot" ? (
            <button onClick={() => setMode("login")} className="text-primary hover:underline font-medium flex items-center gap-1 mx-auto">
              <ArrowLeft className="w-3 h-3" /> Back to Sign In
            </button>
          ) : (
            <p>
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-primary hover:underline font-medium">
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

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
        toast.success("Password reset email sent! Check your inbox.");
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
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-info/5 rounded-full blur-3xl" />
      </div>

      <div className="glass-panel w-full max-w-md p-8 relative z-10">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">ZainBook</h1>
            <p className="text-xs text-muted-foreground">AI Property Management</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-center text-foreground mb-1">
          {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Password"}
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {mode === "login" ? "Sign in to your account" : mode === "signup" ? "Get started with ZainBook" : "Enter your email to reset your password"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-muted-foreground">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" className="bg-secondary/50 border-border/50" required />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="pl-10 bg-secondary/50 border-border/50" required />
            </div>
          </div>
          {mode !== "forgot" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-muted-foreground">Password</Label>
                {mode === "login" && (
                  <button type="button" onClick={() => setMode("forgot")} className="text-xs text-primary hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 pr-10 bg-secondary/50 border-border/50" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
          </Button>
        </form>

        <div className="text-sm text-center text-muted-foreground mt-6">
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
      </div>
    </div>
  );
};

export default AuthPage;

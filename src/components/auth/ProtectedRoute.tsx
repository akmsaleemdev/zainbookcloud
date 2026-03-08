import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  // Check if user has any organization membership
  const { data: hasMembership, isLoading: checkingOrg } = useQuery({
    queryKey: ["has-org-membership", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("organization_members")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  // Also check if super_admin (they don't need org membership)
  const { data: isSuperAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["is-super-admin-protected", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "super_admin",
      });
      return !!data;
    },
    enabled: !!user,
  });

  if (loading || (user && (checkingOrg || checkingAdmin))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // If user has no org and is not super_admin, redirect to onboarding
  if (!hasMembership && !isSuperAdmin) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

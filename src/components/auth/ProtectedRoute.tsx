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

  // Check if user is ANY admin type using SECURITY DEFINER RPCs (bypasses RLS)
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["is-any-admin-check", user?.id],
    queryFn: async () => {
      if (!user) return false;

      // Check super_admin
      const { data: isSuperAdmin } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "super_admin",
      });
      if (isSuperAdmin) return true;

      // Check master_admin (added to enum via ALTER TYPE)
      try {
        const { data: isMasterAdmin } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "master_admin",
        });
        if (isMasterAdmin) return true;
      } catch {
        // master_admin may not exist in enum yet — that's fine
      }

      return false;
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

  // Any admin type bypasses org membership requirement
  if (isAdmin) {
    return <>{children}</>;
  }

  // Regular users without org membership → onboarding
  if (!hasMembership) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

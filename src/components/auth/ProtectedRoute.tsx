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

  // Check if user is any kind of admin (super_admin or master_admin)
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["is-admin-protected", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["super_admin", "master_admin"])
        .limit(1)
        .maybeSingle();
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

  // If user has no org and is not an admin, redirect to onboarding
  if (!hasMembership && !isAdmin) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

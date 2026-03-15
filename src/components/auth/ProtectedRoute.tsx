// src/components/auth/ProtectedRoute.tsx
// Master Admin and Super Admin NEVER go to onboarding.
// Sync email check runs first; membership query only for non-admin users.

import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMasterAdmin } from "@/hooks/useMasterAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isMasterAdminEmail } from "@/lib/auth-constants";

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isMasterAdmin, loading: adminLoading } = useMasterAdmin();

  // Synchronous: Master Admin email never goes to onboarding (no race)
  const isMasterAdminByEmail = isMasterAdminEmail(user?.email);

  // Org membership — only for non-admin users; never run for master admin email
  const { data: hasMembership, isLoading: membershipLoading } = useQuery({
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
    enabled: !!user && !authLoading && !adminLoading && !isMasterAdmin && !isMasterAdminByEmail,
    staleTime: 30_000,
  });

  // 1. Auth still resolving
  if (authLoading) return <Spinner />;

  // 2. Not logged in
  if (!user) return <Navigate to="/auth" replace />;

  // 3. MASTER ADMIN (sync email) — bypass everything, never onboarding
  if (isMasterAdminByEmail) return <>{children}</>;

  // 4. Still resolving async admin check (e.g. super_admin via DB)
  if (adminLoading) return <Spinner />;

  // 5. Super Admin / Master Admin (DB) — bypass
  if (isMasterAdmin) return <>{children}</>;

  // 6. Normal user — wait for membership
  if (membershipLoading) return <Spinner />;

  // 7. No org membership → onboarding (only for non-admin)
  if (!hasMembership) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
};

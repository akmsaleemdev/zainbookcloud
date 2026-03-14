// src/components/auth/ProtectedRoute.tsx
// COMPLETE REWRITE using useMasterAdmin hook.
// Master admin check is SYNCHRONOUS (email match) — zero latency.
// Membership query only runs AFTER master admin is confirmed false.

import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMasterAdmin } from "@/hooks/useMasterAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isMasterAdmin, loading: adminLoading } = useMasterAdmin();

  // Org membership — only checked for non-admin users
  // enabled gate ensures this NEVER runs until admin=false is confirmed
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
    // KEY: only run when auth is settled AND user is confirmed NOT master admin
    enabled: !!user && !authLoading && !adminLoading && !isMasterAdmin,
    staleTime: 30_000,
  });

  // 1. Auth still resolving
  if (authLoading) return <Spinner />;

  // 2. Not logged in
  if (!user) return <Navigate to="/auth" replace />;

  // 3. Still checking if master admin
  if (adminLoading) return <Spinner />;

  // 4. MASTER ADMIN — bypass everything, render immediately
  if (isMasterAdmin) return <>{children}</>;

  // 5. Normal user — wait for membership check
  if (membershipLoading) return <Spinner />;

  // 6. No org membership → onboarding
  if (!hasMembership) return <Navigate to="/onboarding" replace />;

  // 7. Normal org user — render
  return <>{children}</>;
};

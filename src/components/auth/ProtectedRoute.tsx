// src/components/auth/ProtectedRoute.tsx
// FIX: Same race condition as ModuleGuard.
// isAdmin query and hasMembership query run in parallel.
// If isAdmin resolves to true but we already evaluated !hasMembership
// during a prior render frame, user gets sent to /onboarding.
//
// FIX APPLIED:
//   1. Never evaluate hasMembership redirect until isAdmin is settled
//   2. isAdmin check includes both email hardcode + RPC results
//   3. Spinner stays up until isAdmin query is complete

import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  // ── Admin check (runs first, controls all branching) ─────────
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["is-any-admin-check", user?.id],
    queryFn: async () => {
      if (!user) return false;

      // Zero-latency hardcode for system owner
      if (user.email?.toLowerCase().trim() === "zainbooksys@gmail.com") {
        return true;
      }

      // Check master_admin first (highest privilege)
      try {
        const { data: isMasterAdmin } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "master_admin",
        });
        if (isMasterAdmin) return true;
      } catch {
        // master_admin may not be in enum yet
      }

      // Check super_admin
      const { data: isSuperAdmin } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "super_admin",
      });
      if (isSuperAdmin) return true;

      return false;
    },
    enabled: !!user,
    staleTime: 60_000, // cache for 60s — role doesn't change mid-session
  });

  // ── Org membership check (only relevant for non-admins) ───────
  // enabled: only run AFTER we know user is NOT an admin
  // This prevents the race: don't evaluate membership until admin=false is confirmed
  const adminSettled = !checkingAdmin;
  const userIsNotAdmin = adminSettled && isAdmin === false;

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
    // ⭐ KEY FIX: only run this query if we KNOW the user is not an admin
    // Prevents the race where membership=false fires before admin check completes
    enabled: !!user && userIsNotAdmin,
    staleTime: 30_000,
  });

  // ── Loading states ────────────────────────────────────────────
  // Wait for auth to resolve
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated → login
  if (!user) return <Navigate to="/auth" replace />;

  // Wait for admin check to complete (never skip this)
  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Admin: full bypass, no org membership needed ──────────────
  if (isAdmin) return <>{children}</>;

  // ── Non-admin: wait for membership check ─────────────────────
  if (checkingOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No org membership → onboarding
  if (!hasMembership) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

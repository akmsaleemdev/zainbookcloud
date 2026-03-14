// src/components/access-control/ModuleGuard.tsx
// FIX: isSuperAdmin in usePermissions already returns true for master_admin
// (adminRole === "master_admin" sets isSuperAdmin = true in usePermissions.ts)
// BUT the race condition was: orgLoading finishes before adminRole query resolves,
// so for 1 render: isSuperAdmin=false + currentOrg=null → redirect to /onboarding
//
// FIX APPLIED:
//   1. Add isMasterAdmin check alongside isSuperAdmin everywhere
//   2. Keep spinner up until BOTH permsLoading AND adminRole are resolved
//   3. Never redirect to /onboarding until we are certain user is not an admin

import { usePermissions } from "@/hooks/usePermissions";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { UpgradePrompt } from "./UpgradePrompt";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ModuleGuardProps {
  module: string;
  children: React.ReactNode;
}

export const ModuleGuard = ({ module, children }: ModuleGuardProps) => {
  const { user } = useAuth();
  const { canAccessModule, isSuperAdmin, isMasterAdmin, loading: permsLoading } = usePermissions();
  const { hasModuleAccess } = useSubscriptionAccess();
  const { currentOrg, loading: orgLoading } = useOrganization();

  // ── CRITICAL: derive isAnyAdmin from BOTH flags ──────────────
  // isSuperAdmin is already true when adminRole === "master_admin"
  // (see usePermissions: isSuperAdmin = adminRole === "super_admin" || adminRole === "master_admin")
  // But we also add the email hardcode as a zero-latency safety net
  const isAnyAdmin =
    isSuperAdmin ||
    isMasterAdmin ||
    user?.email?.toLowerCase().trim() === "zainbooksys@gmail.com";

  // ── CRITICAL: do not stop spinner until admin check is settled ─
  // permsLoading = !userRole && !!user  →  true while adminRole query is in-flight
  // Also wait for org to finish loading for non-admin users
  const stillLoading = permsLoading || (orgLoading && !isAnyAdmin);

  if (stillLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Admin bypass: full access, no org required ────────────────
  if (isAnyAdmin) return <>{children}</>;

  // ── Non-admin: require org membership ────────────────────────
  if (!currentOrg) {
    return <Navigate to="/onboarding" replace />;
  }

  // ── Subscription plan check ───────────────────────────────────
  if (!hasModuleAccess(module)) {
    return <UpgradePrompt module={module} reason="subscription" />;
  }

  // ── Role-based permission check ───────────────────────────────
  if (!canAccessModule(module)) {
    return <UpgradePrompt module={module} reason="permission" />;
  }

  return <>{children}</>;
};

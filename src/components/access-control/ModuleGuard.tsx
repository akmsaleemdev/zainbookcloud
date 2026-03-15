// src/components/access-control/ModuleGuard.tsx
// COMPLETE REWRITE using useMasterAdmin hook.
// Master admin is detected synchronously via email match.
// Never redirects to /onboarding for master admin under any condition.

import { usePermissions } from "@/hooks/usePermissions";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { UpgradePrompt } from "./UpgradePrompt";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useMasterAdmin } from "@/hooks/useMasterAdmin";
import { Navigate } from "react-router-dom";

interface ModuleGuardProps {
  module: string;
  children: React.ReactNode;
}

export const ModuleGuard = ({ module, children }: ModuleGuardProps) => {
  const { isMasterAdmin, loading: adminLoading } = useMasterAdmin();
  const { canAccessModule, loading: permsLoading } = usePermissions();
  const { hasModuleAccess } = useSubscriptionAccess();
  const { currentOrg, loading: orgLoading } = useOrganization();

  // Wait for admin check first — never proceed until this is settled
  if (adminLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // MASTER ADMIN — full bypass, no org, no subscription, no role check
  if (isMasterAdmin) return <>{children}</>;

  // Normal user — wait for permissions and org to load
  if (permsLoading || orgLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No org → onboarding (only reached for confirmed non-admin users)
  if (!currentOrg) {
    return <Navigate to="/onboarding" replace />;
  }

  // Subscription plan check
  if (!hasModuleAccess(module)) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[ModuleGuard] Module access denied (subscription)", { module });
    }
    return <UpgradePrompt module={module} reason="subscription" />;
  }

  // Role permission check
  if (!canAccessModule(module)) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[ModuleGuard] Module access denied (permission)", { module });
    }
    return <UpgradePrompt module={module} reason="permission" />;
  }

  return <>{children}</>;
};

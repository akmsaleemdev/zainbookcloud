import { usePermissions } from "@/hooks/usePermissions";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { UpgradePrompt } from "./UpgradePrompt";

interface ModuleGuardProps {
  module: string;
  children: React.ReactNode;
}

/**
 * Route-level guard: checks both role permissions and subscription plan access.
 * Wraps a page component to enforce access control.
 */
export const ModuleGuard = ({ module, children }: ModuleGuardProps) => {
  const { canAccessModule, isSuperAdmin, loading } = usePermissions();
  const { hasModuleAccess } = useSubscriptionAccess();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Super admins bypass all checks
  if (isSuperAdmin) return <>{children}</>;

  // Check subscription plan access
  if (!hasModuleAccess(module)) {
    return <UpgradePrompt module={module} reason="subscription" />;
  }

  // Check role-based permission
  if (!canAccessModule(module)) {
    return <UpgradePrompt module={module} reason="permission" />;
  }

  return <>{children}</>;
};

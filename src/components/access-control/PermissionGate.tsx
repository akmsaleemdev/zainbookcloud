import { usePermissions, type Permission } from "@/hooks/usePermissions";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { UpgradePrompt } from "./UpgradePrompt";

interface PermissionGateProps {
  module: string;
  permission?: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

export const PermissionGate = ({
  module,
  permission = "can_read",
  children,
  fallback,
  showUpgrade = false,
}: PermissionGateProps) => {
  const { hasPermission } = usePermissions();
  const { hasModuleAccess } = useSubscriptionAccess();

  // Check subscription access first
  if (!hasModuleAccess(module)) {
    if (showUpgrade) return <UpgradePrompt module={module} reason="subscription" />;
    return fallback ? <>{fallback}</> : null;
  }

  // Check role permission
  if (!hasPermission(module, permission)) {
    if (showUpgrade) return <UpgradePrompt module={module} reason="permission" />;
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

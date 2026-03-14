// src/hooks/useSubscriptionAccess.ts
// FIXED:
//   Master admin always returns true for hasModuleAccess
//   regardless of currentOrg or subscription status.
//   This prevents any UpgradePrompt from showing to master admin.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { usePermissions } from "./usePermissions";
import { useMasterAdmin } from "./useMasterAdmin";

interface UsageInfo {
  current: number;
  max: number;
  allowed: boolean;
}

export const useSubscriptionAccess = () => {
  const { currentOrg }    = useOrganization();
  const { isSuperAdmin }  = usePermissions();
  const { isMasterAdmin } = useMasterAdmin();

  // Master admin bypasses all subscription checks
  const isFullAccess = isMasterAdmin || isSuperAdmin;

  // Subscription query — skip for master admin (no org required)
  const { data: subscription } = useQuery({
    queryKey: ["org-subscription", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return null;
      const { data } = await supabase
        .from("customer_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("organization_id", currentOrg.id)
        .in("status", ["active", "trialing"])
        .maybeSingle();
      return data;
    },
    enabled: !!currentOrg && !isFullAccess,
  });

  // Plan modules — skip for master admin
  const { data: planModules = [] } = useQuery({
    queryKey: ["plan-modules", (subscription as any)?.plan_id],
    queryFn: async () => {
      if (!(subscription as any)?.plan_id) return [];
      const { data } = await supabase
        .from("plan_modules")
        .select("*, platform_modules(slug, name)")
        .eq("plan_id", (subscription as any).plan_id)
        .eq("is_included", true);
      return data || [];
    },
    enabled: !!(subscription as any)?.plan_id && !isFullAccess,
  });

  const hasModuleAccess = (moduleSlug: string): boolean => {
    // Master admin + super admin: FULL access to every module always
    if (isFullAccess) return true;

    // No subscription = only dashboard
    if (!subscription) return moduleSlug === "dashboard";

    // No plan modules configured = allow all (grace period)
    if (planModules.length === 0) return true;

    return planModules.some((pm: any) => pm.platform_modules?.slug === moduleSlug);
  };

  const checkUsageLimit = async (resource: string): Promise<UsageInfo> => {
    // Master admin has unlimited usage
    if (isFullAccess || !currentOrg) {
      return { current: 0, max: 999999, allowed: true };
    }
    const { data } = await supabase.rpc("check_usage_limit", {
      _org_id: currentOrg.id,
      _resource: resource,
    });
    if (data) return data as unknown as UsageInfo;
    return { current: 0, max: 999999, allowed: true };
  };

  const plan = (subscription as any)?.subscription_plans as any;

  return {
    subscription,
    plan,
    planModules,
    hasModuleAccess,
    checkUsageLimit,
    isTrialing: (subscription as any)?.status === "trialing",
    hasActiveSubscription: !!subscription || isFullAccess,
    hasAiAccess: isFullAccess || !!plan?.ai_features_access,
    hasReportAccess: isFullAccess || !!plan?.report_access,
  };
};

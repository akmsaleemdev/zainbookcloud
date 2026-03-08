import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { usePermissions } from "./usePermissions";

interface UsageInfo {
  current: number;
  max: number;
  allowed: boolean;
}

export const useSubscriptionAccess = () => {
  const { currentOrg } = useOrganization();
  const { isSuperAdmin } = usePermissions();

  // Get current subscription with plan details
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
    enabled: !!currentOrg,
  });

  // Get plan modules
  const { data: planModules = [] } = useQuery({
    queryKey: ["plan-modules", subscription?.plan_id],
    queryFn: async () => {
      if (!subscription?.plan_id) return [];
      const { data } = await supabase
        .from("plan_modules")
        .select("*, platform_modules(slug, name)")
        .eq("plan_id", subscription.plan_id)
        .eq("is_included", true);
      return data || [];
    },
    enabled: !!subscription?.plan_id,
  });

  const hasModuleAccess = (moduleSlug: string): boolean => {
    // Super admins always have access
    if (isSuperAdmin) return true;
    // No subscription = no access (except dashboard)
    if (!subscription) return moduleSlug === "dashboard";
    // If no plan modules configured, allow all (grace)
    if (planModules.length === 0) return true;
    return planModules.some((pm: any) => pm.platform_modules?.slug === moduleSlug);
  };

  const checkUsageLimit = async (resource: string): Promise<UsageInfo> => {
    if (isSuperAdmin || !currentOrg) {
      return { current: 0, max: 999999, allowed: true };
    }
    const { data } = await supabase.rpc("check_usage_limit", {
      _org_id: currentOrg.id,
      _resource: resource,
    });
    if (data) return data as unknown as UsageInfo;
    return { current: 0, max: 999999, allowed: true };
  };

  const plan = subscription?.subscription_plans as any;

  return {
    subscription,
    plan,
    planModules,
    hasModuleAccess,
    checkUsageLimit,
    isTrialing: subscription?.status === "trialing",
    hasActiveSubscription: !!subscription,
    hasAiAccess: !!plan?.ai_features_access,
    hasReportAccess: !!plan?.report_access,
  };
};

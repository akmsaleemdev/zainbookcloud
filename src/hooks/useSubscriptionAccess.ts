// src/hooks/useSubscriptionAccess.ts
// FIXED:
//   1. Master admin always returns true for ALL modules
//   2. Slug matching handles both underscore and hyphen formats
//      DB: property_management | Sidebar: properties, buildings etc.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { usePermissions } from "./usePermissions";
import { useMasterAdmin } from "./useMasterAdmin";

interface UsageInfo { current: number; max: number; allowed: boolean; }

// Maps sidebar route slugs → all DB module slugs that cover them
const SLUG_MAP: Record<string, string[]> = {
  "dashboard":        ["dashboard"],
  "organizations":    ["organizations","property_management"],
  "properties":       ["properties","property_management"],
  "buildings":        ["buildings","property_management"],
  "floors":           ["floors","property_management"],
  "units":            ["units","property_management","unit_management"],
  "rooms":            ["rooms","property_management","unit_management"],
  "bed-spaces":       ["bed_spaces","bed-spaces","unit_management"],
  "tenants":          ["tenants","tenant_management"],
  "leases":           ["leases","lease_management"],
  "ejari":            ["ejari","lease_management"],
  "rent-management":  ["rent_management","rent-management","lease_management"],
  "invoices":         ["invoices","financial_reports"],
  "payments":         ["payments","financial_reports"],
  "cheque-tracking":  ["cheque_tracking","cheque-tracking","financial_reports"],
  "maintenance":      ["maintenance"],
  "amenities":        ["amenities"],
  "utilities":        ["utilities"],
  "documents":        ["documents"],
  "uae-management":   ["uae_management","uae-management"],
  "messaging":        ["messaging"],
  "notifications":    ["notifications"],
  "complaints":       ["complaints"],
  "notices":          ["notices"],
  "reports":          ["reports","financial_reports"],
  "analytics":        ["analytics"],
  "ai-insights":      ["ai_insights","ai-insights"],
  "automation":       ["automation"],
  "owner-portal":     ["owner_portal","owner-portal"],
  "tenant-portal":    ["tenant_portal","tenant-portal"],
  "public-booking":   ["public_booking","public-booking"],
  "hr-payroll":       ["hr_payroll","hr-payroll"],
  "accounting":       ["accounting"],
  "erp-integrations": ["erp_integrations","erp-integrations"],
  "support":          ["support"],
  "subscriptions":    ["subscriptions"],
  "master-admin":     ["master_admin","master-admin"],
  "user-management":  ["user_management","user-management"],
  "settings":         ["settings"],
};

export const useSubscriptionAccess = () => {
  const { currentOrg }    = useOrganization();
  const { isSuperAdmin }  = usePermissions();
  const { isMasterAdmin } = useMasterAdmin();
  const isFullAccess      = isMasterAdmin || isSuperAdmin;

  const { data: subscription } = useQuery({
    queryKey: ["org-subscription", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return null;
      const { data } = await supabase
        .from("customer_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("organization_id", currentOrg.id)
        .in("status", ["active","trialing"])
        .maybeSingle();
      return data;
    },
    enabled: !!currentOrg && !isFullAccess,
    staleTime: 60_000,
  });

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
    staleTime: 60_000,
  });

  const hasModuleAccess = (moduleSlug: string): boolean => {
    if (isFullAccess) return true;
    if (!subscription) return moduleSlug === "dashboard";
    if (planModules.length === 0) return true;
    const possible = SLUG_MAP[moduleSlug] || [moduleSlug, moduleSlug.replace(/-/g,"_")];
    return planModules.some((pm: any) => {
      const s = pm.platform_modules?.slug;
      return s && possible.includes(s);
    });
  };

  const checkUsageLimit = async (resource: string): Promise<UsageInfo> => {
    if (isFullAccess || !currentOrg) return { current: 0, max: 999999, allowed: true };
    const { data } = await supabase.rpc("check_usage_limit", { _org_id: currentOrg.id, _resource: resource });
    return (data as unknown as UsageInfo) || { current: 0, max: 999999, allowed: true };
  };

  const plan = (subscription as any)?.subscription_plans as any;
  return {
    subscription, plan, planModules, hasModuleAccess, checkUsageLimit,
    isTrialing:            (subscription as any)?.status === "trialing",
    hasActiveSubscription: !!subscription || isFullAccess,
    hasAiAccess:           isFullAccess || !!plan?.ai_features_access,
    hasReportAccess:       isFullAccess || !!plan?.report_access,
  };
};

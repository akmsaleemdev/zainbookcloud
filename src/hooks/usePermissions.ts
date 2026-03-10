import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useOrganization } from "@/contexts/OrganizationContext";

export type Permission = "can_create" | "can_read" | "can_update" | "can_delete" | "can_approve" | "can_export" | "can_manage";

interface RolePermission {
  module_slug: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_approve: boolean;
  can_export: boolean;
  can_manage: boolean;
}

export const usePermissions = () => {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();

  // Get user's role in current org
  const { data: membership } = useQuery({
    queryKey: ["user-membership", user?.id, currentOrg?.id],
    queryFn: async () => {
      if (!user || !currentOrg) return null;
      const { data } = await supabase
        .from("organization_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("organization_id", currentOrg.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!currentOrg,
  });

  // Also check if user is master_admin or super_admin via user_roles
  const { data: globalRole } = useQuery({
    queryKey: ["global-role", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Check for master_admin (Absolute Power)
      const { data: isMaster } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "master_admin" as any,
      });
      if (isMaster) return "master_admin";

      // Check for super_admin (Regional Power)
      const { data: isSuper } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "super_admin",
      });
      if (isSuper) return "super_admin";

      return null;
    },
    enabled: !!user,
  });

  const isMasterAdmin = globalRole === "master_admin";
  const isSuperAdmin = isMasterAdmin || globalRole === "super_admin";

  const userRole = globalRole || membership?.role || null;

  // Get role permissions
  const { data: permissions = [] } = useQuery({
    queryKey: ["role-permissions", userRole],
    queryFn: async () => {
      if (!userRole) return [];
      const { data } = await supabase
        .from("role_permissions")
        .select("*")
        .eq("role", userRole);
      return (data || []) as RolePermission[];
    },
    enabled: !!userRole,
  });

  const hasPermission = (moduleSlug: string, permission: Permission): boolean => {
    if (isSuperAdmin) return true;
    const perm = permissions.find((p) => p.module_slug === moduleSlug);
    if (!perm) return false;
    return !!perm[permission];
  };

  const canAccessModule = (moduleSlug: string): boolean => {
    if (isSuperAdmin) return true;
    const perm = permissions.find((p) => p.module_slug === moduleSlug);
    return !!perm?.can_read;
  };

  const getModulePermissions = (moduleSlug: string) => {
    if (isSuperAdmin) {
      return { can_create: true, can_read: true, can_update: true, can_delete: true, can_approve: true, can_export: true, can_manage: true };
    }
    return permissions.find((p) => p.module_slug === moduleSlug) || null;
  };

  return {
    userRole,
    isMasterAdmin,
    isSuperAdmin: !!isSuperAdmin,
    permissions,
    hasPermission,
    canAccessModule,
    getModulePermissions,
    loading: !userRole && !!user,
  };
};

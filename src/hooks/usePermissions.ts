// src/hooks/usePermissions.ts
// FIXED:
//   1. loading state is now stable — never flickers to false before adminRole resolves
//   2. Master admin email hardcode returns instantly (synchronous)
//   3. isSuperAdmin = true for both master_admin AND super_admin roles
//   4. canAccessModule always returns true for master admin

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useOrganization } from "@/contexts/OrganizationContext";

const MASTER_ADMIN_EMAIL = "zainbooksys@gmail.com";

export type Permission =
  | "can_create" | "can_read" | "can_update" | "can_delete"
  | "can_approve" | "can_export" | "can_manage";

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
  const { user }       = useAuth();
  const { currentOrg } = useOrganization();

  // Synchronous email check — instant, no DB needed
  const isEmailMasterAdmin =
    !!user?.email &&
    user.email.toLowerCase().trim() === MASTER_ADMIN_EMAIL;

  // Admin role check via RPC — skipped if email already matches
  const { data: adminRole, isLoading: adminRoleLoading } = useQuery({
    queryKey: ["admin-role-check", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Email match = instant master_admin, skip DB
      if (isEmailMasterAdmin) return "master_admin";

      // Check master_admin role
      try {
        const { data: isMaster } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "master_admin",
        });
        if (isMaster) return "master_admin";
      } catch { /* enum may not exist yet */ }

      // Check super_admin role
      try {
        const { data: isSuper } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "super_admin",
        });
        if (isSuper) return "super_admin";
      } catch { /* ignore */ }

      return null;
    },
    enabled: !!user,
    staleTime: Infinity,   // role doesn't change mid-session
    gcTime: Infinity,
    retry: 1,
  });

  // Org membership role (for non-admin users)
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
    enabled: !!user && !!currentOrg && !isEmailMasterAdmin,
  });

  // If email matches, we know instantly — no loading needed
  const effectiveAdminRole = isEmailMasterAdmin ? "master_admin" : adminRole;

  const isMasterAdmin = effectiveAdminRole === "master_admin";
  const isSuperAdmin  = effectiveAdminRole === "super_admin" || effectiveAdminRole === "master_admin";
  const userRole      = effectiveAdminRole || membership?.role || null;

  // Role permissions (skipped for admins — they have full access)
  const { data: permissions = [] } = useQuery({
    queryKey: ["role-permissions", userRole],
    queryFn: async () => {
      if (!userRole) return [];
      if (userRole === "super_admin" || userRole === "master_admin") return [];
      const { data } = await supabase
        .from("role_permissions")
        .select("*")
        .eq("role", userRole);
      return (data || []) as RolePermission[];
    },
    enabled: !!userRole && !isSuperAdmin,
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
      return {
        can_create: true, can_read: true, can_update: true,
        can_delete: true, can_approve: true, can_export: true, can_manage: true,
      };
    }
    return permissions.find((p) => p.module_slug === moduleSlug) || null;
  };

  // FIXED loading: only true when admin check is still in-flight AND email didn't match
  // If email matches → loading is always false (we know instantly)
  const loading = !isEmailMasterAdmin && adminRoleLoading && !effectiveAdminRole && !!user;

  return {
    userRole,
    isMasterAdmin,
    isSuperAdmin,
    permissions,
    hasPermission,
    canAccessModule,
    getModulePermissions,
    loading,
  };
};

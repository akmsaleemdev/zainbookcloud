// src/contexts/OrganizationContext.tsx
// FIX: Master admin with no organizations no longer gets stuck.
// isMasterAdminEmail check is synchronous — sets loading=false immediately
// so ModuleGuard and ProtectedRoute never see orgLoading=true for long.

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const MASTER_ADMIN_EMAIL = "zainbooksys@gmail.com";

interface Organization {
  id: string;
  name: string;
  name_ar: string | null;
  emirate: string | null;
  email: string | null;
  phone: string | null;
}

interface OrgContextType {
  organizations: Organization[];
  currentOrg: Organization | null;
  setCurrentOrg: (org: Organization | null) => void;
  loading: boolean;
  refetch: () => void;
  isMasterAdminContext: boolean;
}

const OrgContext = createContext<OrgContextType>({
  organizations: [],
  currentOrg: null,
  setCurrentOrg: () => {},
  loading: true,
  refetch: () => {},
  isMasterAdminContext: false,
});

export const useOrganization = () => useContext(OrgContext);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  // Synchronous email check — known before any DB query
  const isMasterAdminEmail =
    !!user?.email &&
    user.email.toLowerCase().trim() === MASTER_ADMIN_EMAIL;

  const fetchOrgs = async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrg(null);
      setLoading(false);
      return;
    }

    // ── MASTER ADMIN (email match) ──────────────────────────
    if (isMasterAdminEmail) {
      const { data: allOrgs } = await supabase
        .from("organizations")
        .select("id, name, name_ar, emirate, email, phone")
        .order("name");

      const orgs = allOrgs || [];
      setOrganizations(orgs);

      // Master admin: set first org if available, but null is also fine
      // ModuleGuard will NOT redirect to /onboarding for master admin
      // regardless of whether currentOrg is null
      setCurrentOrg((prev) => {
        if (prev && orgs.find((o) => o.id === prev.id)) return prev;
        return orgs[0] || null;
      });
      setLoading(false);
      return;
    }

    // ── Check super_admin or master_admin role via RPC ──────
    let isAdminRole = false;
    try {
      const { data: isSuperAdmin } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "super_admin",
      });
      if (isSuperAdmin) isAdminRole = true;
    } catch {}

    if (!isAdminRole) {
      try {
        const { data: isMasterAdmin } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "master_admin",
        });
        if (isMasterAdmin) isAdminRole = true;
      } catch {}
    }

    if (isAdminRole) {
      const { data: allOrgs } = await supabase
        .from("organizations")
        .select("id, name, name_ar, emirate, email, phone")
        .order("name");
      const orgs = allOrgs || [];
      setOrganizations(orgs);
      setCurrentOrg((prev) => {
        if (prev && orgs.find((o) => o.id === prev.id)) return prev;
        return orgs[0] || null;
      });
      setLoading(false);
      return;
    }

    // ── Normal org user ─────────────────────────────────────
    const { data: memberships } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id);

    if (memberships && memberships.length > 0) {
      const orgIds = memberships.map((m) => m.organization_id);
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name, name_ar, emirate, email, phone")
        .in("id", orgIds)
        .order("name");

      const orgList = orgs || [];
      setOrganizations(orgList);
      setCurrentOrg((prev) => {
        if (prev && orgList.find((o) => o.id === prev.id)) return prev;
        return orgList[0] || null;
      });
    } else {
      setOrganizations([]);
      setCurrentOrg(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchOrgs();
  }, [user?.id]);

  return (
    <OrgContext.Provider
      value={{
        organizations,
        currentOrg,
        setCurrentOrg,
        loading,
        refetch: fetchOrgs,
        isMasterAdminContext: isMasterAdminEmail,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
};

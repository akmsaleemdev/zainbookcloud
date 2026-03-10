import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
}

const OrgContext = createContext<OrgContextType>({
  organizations: [],
  currentOrg: null,
  setCurrentOrg: () => { },
  loading: true,
  refetch: () => { },
});

export const useOrganization = () => useContext(OrgContext);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrgs = async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrg(null);
      setLoading(false);
      return;
    }

    // Check if user is master_admin (Global) - direct table query for resilience
    const { data: masterRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "master_admin")
      .maybeSingle();
    const isMaster = !!masterRole;

    if (isMaster) {
      const { data: allOrgs } = await supabase
        .from("organizations")
        .select("id, name, name_ar, emirate, email, phone")
        .order("name");

      if (allOrgs) {
        setOrganizations(allOrgs);
        if (!currentOrg || !allOrgs.find((o) => o.id === currentOrg.id)) {
          setCurrentOrg(allOrgs[0] || null);
        }
      }
    } else {
      // Normal flow: only show memberships
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

        if (orgs) {
          setOrganizations(orgs);
          if (!currentOrg || !orgs.find((o) => o.id === currentOrg.id)) {
            setCurrentOrg(orgs[0] || null);
          }
        }
      } else {
        setOrganizations([]);
        setCurrentOrg(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrgs();
  }, [user]);

  return (
    <OrgContext.Provider value={{ organizations, currentOrg, setCurrentOrg, loading, refetch: fetchOrgs }}>
      {children}
    </OrgContext.Provider>
  );
};

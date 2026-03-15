// src/hooks/useMasterAdmin.ts
// Single source of truth for master admin detection.
// Uses email (auth-constants) as instant sync check + RPC for super_admin.

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { isMasterAdminEmail } from "@/lib/auth-constants";

export const useMasterAdmin = () => {
  const { user, loading: authLoading } = useAuth();

  const isEmailMatch = isMasterAdminEmail(user?.email);

  // Async DB verification via RPC
  const { data: dbConfirmed, isLoading: dbLoading } = useQuery({
    queryKey: ["master-admin-check", user?.id],
    queryFn: async () => {
      if (!user) return false;

      // Email match is already trusted — skip DB round-trip
      if (isEmailMatch) return true;

      // Check master_admin role
      try {
        const { data: isMaster } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "master_admin",
        });
        if (isMaster) return true;
      } catch { /* enum may not exist */ }

      // Check super_admin role
      try {
        const { data: isSuper } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "super_admin",
        });
        if (isSuper) return true;
      } catch { /* ignore */ }

      return false;
    },
    enabled: !!user && !isEmailMatch, // skip DB if email already matches
    staleTime: Infinity,              // never re-fetch during session
    gcTime: Infinity,                 // keep in cache
    retry: 1,
  });

  // isMasterAdmin is TRUE immediately if email matches,
  // OR after DB confirms the role
  const isMasterAdmin = isEmailMatch || dbConfirmed === true;

  // loading: true only while we're waiting for DB AND email didn't match
  const loading = authLoading || (!isEmailMatch && dbLoading && !dbConfirmed);

  return { isMasterAdmin, loading };
};

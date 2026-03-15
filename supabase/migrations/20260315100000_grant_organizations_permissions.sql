-- Fix "permission denied for table organizations" when master admin creates an org.
-- Ensures authenticated role has table privileges and RLS policy allows INSERT for platform admins.

-- Table-level grants (required for Supabase client using authenticated role)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Explicit WITH CHECK for INSERT so platform admins (master_admin/super_admin) can create orgs
DROP POLICY IF EXISTS "Admins can manage orgs" ON public.organizations;
CREATE POLICY "Admins can manage orgs" ON public.organizations
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

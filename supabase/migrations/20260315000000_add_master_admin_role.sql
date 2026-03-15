-- Add master_admin to app_role so has_role() and user_roles work for platform owner.
-- Frontend also treats Master Admin by email (auth-constants); this supports DB-backed role.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'master_admin'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'master_admin';
  END IF;
END
$$;

-- Helper: true if user is platform-level admin (super_admin or master_admin)
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin', 'master_admin')
  )
$$;

-- user_roles: allow master_admin to manage roles (same as super_admin)
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- organizations: platform admins can manage all
DROP POLICY IF EXISTS "Admins can manage orgs" ON public.organizations;
CREATE POLICY "Admins can manage orgs" ON public.organizations
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- subscription_plans, platform_modules, etc. often use has_role(super_admin);
-- optional: add policy for master_admin where needed, or use is_platform_admin in future migrations.

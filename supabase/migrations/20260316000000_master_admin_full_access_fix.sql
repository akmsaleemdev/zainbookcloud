-- Master Admin full access fix (order: 1–6)
-- Run after: 20260315000000_add_master_admin_role.sql, 20260315100000, 20260315200000
-- 1. Users (organization_members) – platform admin CRUD + avoid RLS recursion
-- 2. Roles & Permissions (role_permissions)
-- 3. Subscription Plans – already in 20260315200000; ensure no conflict
-- 4. Pricing – subscription_plans same
-- 5. Module Access – platform_modules same; usage_limits for platform admin
-- 6. Billing / Invoices / Payments – org tables already in 20260315200000; email_domains, payment_gateways

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: is_org_admin (avoids RLS recursion when checking org admin on organization_members)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_org_admin(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _org_id AND user_id = _user_id AND role = 'organization_admin'
  )
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. organization_members: Platform admins full CRUD; org admins via helper (no recursion)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Org admins can insert members" ON public.organization_members;
CREATE POLICY "Org admins can insert members" ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin(auth.uid())
    OR public.is_org_admin(organization_members.organization_id, auth.uid())
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Org admins can update members" ON public.organization_members;
CREATE POLICY "Org admins can update members" ON public.organization_members
  FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin(auth.uid())
    OR public.is_org_admin(organization_members.organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Org admins can delete members" ON public.organization_members;
CREATE POLICY "Org admins can delete members" ON public.organization_members
  FOR DELETE TO authenticated
  USING (
    public.is_platform_admin(auth.uid())
    OR public.is_org_admin(organization_members.organization_id, auth.uid())
  );

-- Explicit platform-only policy so Master Admin always has full access (redundant with above but clear)
DROP POLICY IF EXISTS "Platform admins manage org members" ON public.organization_members;
CREATE POLICY "Platform admins manage org members" ON public.organization_members
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Roles & Permissions: platform admins can manage role_permissions
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Super admins manage role_permissions" ON public.role_permissions;
CREATE POLICY "Platform admins manage role_permissions" ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- 3–4. subscription_plans: ensure platform admin (idempotent with 20260315200000)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins manage plans" ON public.subscription_plans;
CREATE POLICY "Admins manage plans" ON public.subscription_plans
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. usage_limits: platform admins can view and manage any org (for usage refresh / admin)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Members can view own org usage" ON public.usage_limits;
CREATE POLICY "Members can view own org usage" ON public.usage_limits
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
    OR public.is_platform_admin(auth.uid())
  );

DROP POLICY IF EXISTS "System manages usage" ON public.usage_limits;
CREATE POLICY "System manages usage" ON public.usage_limits
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = usage_limits.organization_id AND om.user_id = auth.uid()
        AND om.role IN ('organization_admin', 'property_owner')
    )
    OR public.is_platform_admin(auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = usage_limits.organization_id AND om.user_id = auth.uid()
        AND om.role IN ('organization_admin', 'property_owner')
    )
    OR public.is_platform_admin(auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. email_domains: platform admins manage (Master Admin was blocked here)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Super admins manage email domains" ON public.email_domains;
CREATE POLICY "Platform admins manage email domains" ON public.email_domains
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- payment_gateway_configs: re-apply so name matches and is idempotent
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Super admins manage payment gateways" ON public.payment_gateway_configs;
DROP POLICY IF EXISTS "Platform admins manage payment gateways" ON public.payment_gateway_configs;
CREATE POLICY "Platform admins manage payment gateways" ON public.payment_gateway_configs
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles: platform admins can read all (for User Management / All Users)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Platform admins can view all profiles" ON public.profiles;
CREATE POLICY "Platform admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

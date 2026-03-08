
-- Role permissions table for granular CRUD access per role per module
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  module_slug text NOT NULL,
  can_create boolean NOT NULL DEFAULT false,
  can_read boolean NOT NULL DEFAULT true,
  can_update boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  can_approve boolean NOT NULL DEFAULT false,
  can_export boolean NOT NULL DEFAULT false,
  can_manage boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role, module_slug)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read role_permissions" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins manage role_permissions" ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Usage limits tracking table
CREATE TABLE public.usage_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  resource_type text NOT NULL, -- 'properties', 'tenants', 'users', 'storage_mb'
  current_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, resource_type)
);

ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view usage" ON public.usage_limits
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = usage_limits.organization_id AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "System manages usage" ON public.usage_limits
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = usage_limits.organization_id AND om.user_id = auth.uid() AND om.role IN ('organization_admin', 'property_owner'))
    OR public.has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = usage_limits.organization_id AND om.user_id = auth.uid() AND om.role IN ('organization_admin', 'property_owner'))
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- Seed default role permissions for all modules
INSERT INTO public.role_permissions (role, module_slug, can_create, can_read, can_update, can_delete, can_approve, can_export, can_manage) VALUES
-- super_admin: full access to everything
('super_admin', 'dashboard', true, true, true, true, true, true, true),
('super_admin', 'organizations', true, true, true, true, true, true, true),
('super_admin', 'properties', true, true, true, true, true, true, true),
('super_admin', 'buildings', true, true, true, true, true, true, true),
('super_admin', 'floors', true, true, true, true, true, true, true),
('super_admin', 'units', true, true, true, true, true, true, true),
('super_admin', 'rooms', true, true, true, true, true, true, true),
('super_admin', 'bed-spaces', true, true, true, true, true, true, true),
('super_admin', 'tenants', true, true, true, true, true, true, true),
('super_admin', 'leases', true, true, true, true, true, true, true),
('super_admin', 'ejari', true, true, true, true, true, true, true),
('super_admin', 'rent-management', true, true, true, true, true, true, true),
('super_admin', 'invoices', true, true, true, true, true, true, true),
('super_admin', 'payments', true, true, true, true, true, true, true),
('super_admin', 'cheque-tracking', true, true, true, true, true, true, true),
('super_admin', 'maintenance', true, true, true, true, true, true, true),
('super_admin', 'amenities', true, true, true, true, true, true, true),
('super_admin', 'utilities', true, true, true, true, true, true, true),
('super_admin', 'documents', true, true, true, true, true, true, true),
('super_admin', 'uae-management', true, true, true, true, true, true, true),
('super_admin', 'messaging', true, true, true, true, true, true, true),
('super_admin', 'notifications', true, true, true, true, true, true, true),
('super_admin', 'complaints', true, true, true, true, true, true, true),
('super_admin', 'notices', true, true, true, true, true, true, true),
('super_admin', 'reports', true, true, true, true, true, true, true),
('super_admin', 'analytics', true, true, true, true, true, true, true),
('super_admin', 'ai-insights', true, true, true, true, true, true, true),
('super_admin', 'automation', true, true, true, true, true, true, true),
('super_admin', 'owner-portal', true, true, true, true, true, true, true),
('super_admin', 'tenant-portal', true, true, true, true, true, true, true),
('super_admin', 'public-booking', true, true, true, true, true, true, true),
('super_admin', 'erp-integrations', true, true, true, true, true, true, true),
('super_admin', 'support', true, true, true, true, true, true, true),
('super_admin', 'subscriptions', true, true, true, true, true, true, true),
('super_admin', 'master-admin', true, true, true, true, true, true, true),
('super_admin', 'user-management', true, true, true, true, true, true, true),
('super_admin', 'settings', true, true, true, true, true, true, true),

-- organization_admin: full access except master-admin/subscriptions
('organization_admin', 'dashboard', true, true, true, true, true, true, true),
('organization_admin', 'organizations', false, true, true, false, false, true, true),
('organization_admin', 'properties', true, true, true, true, true, true, true),
('organization_admin', 'buildings', true, true, true, true, true, true, true),
('organization_admin', 'floors', true, true, true, true, true, true, true),
('organization_admin', 'units', true, true, true, true, true, true, true),
('organization_admin', 'rooms', true, true, true, true, true, true, true),
('organization_admin', 'bed-spaces', true, true, true, true, true, true, true),
('organization_admin', 'tenants', true, true, true, true, true, true, true),
('organization_admin', 'leases', true, true, true, true, true, true, true),
('organization_admin', 'ejari', true, true, true, true, true, true, true),
('organization_admin', 'rent-management', true, true, true, true, true, true, true),
('organization_admin', 'invoices', true, true, true, true, true, true, true),
('organization_admin', 'payments', true, true, true, true, true, true, true),
('organization_admin', 'cheque-tracking', true, true, true, true, true, true, true),
('organization_admin', 'maintenance', true, true, true, true, true, true, true),
('organization_admin', 'amenities', true, true, true, true, true, true, true),
('organization_admin', 'utilities', true, true, true, true, true, true, true),
('organization_admin', 'documents', true, true, true, true, true, true, true),
('organization_admin', 'uae-management', true, true, true, true, true, true, true),
('organization_admin', 'messaging', true, true, true, true, true, true, true),
('organization_admin', 'notifications', true, true, true, true, true, true, true),
('organization_admin', 'complaints', true, true, true, true, true, true, true),
('organization_admin', 'notices', true, true, true, true, true, true, true),
('organization_admin', 'reports', true, true, true, true, true, true, true),
('organization_admin', 'analytics', true, true, true, true, true, true, true),
('organization_admin', 'ai-insights', true, true, true, true, true, true, true),
('organization_admin', 'automation', true, true, true, true, true, true, true),
('organization_admin', 'owner-portal', true, true, true, true, true, true, true),
('organization_admin', 'tenant-portal', true, true, true, true, true, true, true),
('organization_admin', 'public-booking', true, true, true, true, true, true, true),
('organization_admin', 'erp-integrations', true, true, true, true, true, true, true),
('organization_admin', 'support', true, true, true, true, true, true, true),
('organization_admin', 'subscriptions', false, true, false, false, false, false, false),
('organization_admin', 'user-management', true, true, true, true, true, true, true),
('organization_admin', 'settings', true, true, true, true, true, true, true),

-- property_manager: manage day-to-day ops
('property_manager', 'dashboard', false, true, false, false, false, true, false),
('property_manager', 'properties', false, true, true, false, false, true, false),
('property_manager', 'buildings', true, true, true, false, false, true, false),
('property_manager', 'floors', true, true, true, false, false, true, false),
('property_manager', 'units', true, true, true, false, false, true, false),
('property_manager', 'rooms', true, true, true, false, false, true, false),
('property_manager', 'bed-spaces', true, true, true, false, false, true, false),
('property_manager', 'tenants', true, true, true, false, false, true, false),
('property_manager', 'leases', true, true, true, false, true, true, false),
('property_manager', 'ejari', true, true, true, false, false, true, false),
('property_manager', 'rent-management', false, true, true, false, false, true, false),
('property_manager', 'invoices', true, true, true, false, false, true, false),
('property_manager', 'payments', true, true, true, false, false, true, false),
('property_manager', 'cheque-tracking', true, true, true, false, false, true, false),
('property_manager', 'maintenance', true, true, true, true, true, true, false),
('property_manager', 'amenities', true, true, true, false, false, false, false),
('property_manager', 'utilities', true, true, true, false, false, true, false),
('property_manager', 'documents', true, true, true, false, false, true, false),
('property_manager', 'uae-management', true, true, true, false, false, true, false),
('property_manager', 'messaging', true, true, true, false, false, false, false),
('property_manager', 'notifications', false, true, false, false, false, false, false),
('property_manager', 'complaints', true, true, true, false, false, true, false),
('property_manager', 'notices', true, true, true, false, false, true, false),
('property_manager', 'reports', false, true, false, false, false, true, false),
('property_manager', 'analytics', false, true, false, false, false, false, false),

-- accountant: finance focus
('accountant', 'dashboard', false, true, false, false, false, true, false),
('accountant', 'tenants', false, true, false, false, false, true, false),
('accountant', 'leases', false, true, false, false, false, true, false),
('accountant', 'rent-management', true, true, true, false, true, true, false),
('accountant', 'invoices', true, true, true, true, true, true, true),
('accountant', 'payments', true, true, true, false, true, true, true),
('accountant', 'cheque-tracking', true, true, true, false, true, true, true),
('accountant', 'reports', false, true, false, false, false, true, false),

-- maintenance_staff
('maintenance_staff', 'dashboard', false, true, false, false, false, false, false),
('maintenance_staff', 'maintenance', true, true, true, false, false, false, false),
('maintenance_staff', 'uae-management', false, true, true, false, false, false, false),

-- tenant role: limited self-service
('tenant', 'dashboard', false, true, false, false, false, false, false),
('tenant', 'tenant-portal', false, true, true, false, false, false, false),
('tenant', 'maintenance', true, true, false, false, false, false, false),
('tenant', 'complaints', true, true, false, false, false, false, false),
('tenant', 'messaging', true, true, false, false, false, false, false),
('tenant', 'notifications', false, true, false, false, false, false, false),
('tenant', 'documents', false, true, false, false, false, false, false);

-- Function to check module access by subscription
CREATE OR REPLACE FUNCTION public.check_plan_module_access(
  _org_id uuid,
  _module_slug text
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM customer_subscriptions cs
    JOIN plan_modules pm ON pm.plan_id = cs.plan_id
    JOIN platform_modules m ON m.id = pm.module_id
    WHERE cs.organization_id = _org_id
      AND cs.status IN ('active', 'trialing')
      AND pm.is_included = true
      AND m.slug = _module_slug
  )
$$;

-- Function to check usage limits
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  _org_id uuid,
  _resource text
) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'current', COALESCE(ul.current_count, 0),
    'max', CASE _resource
      WHEN 'properties' THEN COALESCE(sp.max_properties, 999999)
      WHEN 'tenants' THEN COALESCE(sp.max_tenants, 999999)
      WHEN 'users' THEN COALESCE(sp.max_users, 999999)
      ELSE 999999
    END,
    'allowed', COALESCE(ul.current_count, 0) < CASE _resource
      WHEN 'properties' THEN COALESCE(sp.max_properties, 999999)
      WHEN 'tenants' THEN COALESCE(sp.max_tenants, 999999)
      WHEN 'users' THEN COALESCE(sp.max_users, 999999)
      ELSE 999999
    END
  )
  FROM customer_subscriptions cs
  JOIN subscription_plans sp ON sp.id = cs.plan_id
  LEFT JOIN usage_limits ul ON ul.organization_id = _org_id AND ul.resource_type = _resource
  WHERE cs.organization_id = _org_id AND cs.status IN ('active', 'trialing')
  LIMIT 1
$$;

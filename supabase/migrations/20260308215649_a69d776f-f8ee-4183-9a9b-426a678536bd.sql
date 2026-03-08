
-- ==========================================
-- 1. Usage Limits Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.usage_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  current_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, resource_type)
);

ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own org usage" ON public.usage_limits
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

-- ==========================================
-- 2. Refresh usage counts function
-- ==========================================
CREATE OR REPLACE FUNCTION public.refresh_usage_counts(_org_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_properties integer; v_tenants integer; v_users integer;
BEGIN
  SELECT count(*) INTO v_properties FROM properties WHERE organization_id = _org_id;
  SELECT count(*) INTO v_tenants FROM tenants WHERE organization_id = _org_id;
  SELECT count(*) INTO v_users FROM organization_members WHERE organization_id = _org_id AND is_active = true;

  INSERT INTO usage_limits (organization_id, resource_type, current_count) VALUES (_org_id, 'properties', v_properties)
  ON CONFLICT (organization_id, resource_type) DO UPDATE SET current_count = v_properties, updated_at = now();
  INSERT INTO usage_limits (organization_id, resource_type, current_count) VALUES (_org_id, 'tenants', v_tenants)
  ON CONFLICT (organization_id, resource_type) DO UPDATE SET current_count = v_tenants, updated_at = now();
  INSERT INTO usage_limits (organization_id, resource_type, current_count) VALUES (_org_id, 'users', v_users)
  ON CONFLICT (organization_id, resource_type) DO UPDATE SET current_count = v_users, updated_at = now();
END; $$;

-- ==========================================
-- 3. Auto-refresh triggers
-- ==========================================
CREATE OR REPLACE FUNCTION public.trg_refresh_usage()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'organization_members' THEN
    v_org_id := COALESCE(NEW.organization_id, OLD.organization_id);
  ELSE
    v_org_id := COALESCE(NEW.organization_id, OLD.organization_id);
  END IF;
  IF v_org_id IS NOT NULL THEN PERFORM refresh_usage_counts(v_org_id); END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER trg_properties_usage AFTER INSERT OR DELETE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_usage();
CREATE TRIGGER trg_tenants_usage AFTER INSERT OR DELETE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_usage();
CREATE TRIGGER trg_members_usage AFTER INSERT OR DELETE ON public.organization_members FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_usage();

-- ==========================================
-- 4. Lease auto-expire function
-- ==========================================
CREATE OR REPLACE FUNCTION public.auto_expire_leases()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer;
BEGIN
  UPDATE leases SET status = 'expired' WHERE status = 'active' AND end_date < CURRENT_DATE;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  UPDATE units SET status = 'available'
  WHERE id IN (
    SELECT unit_id FROM leases WHERE status = 'expired' AND unit_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM leases l2 WHERE l2.unit_id = leases.unit_id AND l2.status = 'active' AND l2.id != leases.id)
  );
  RETURN v_count;
END; $$;

-- ==========================================
-- 5. Audit log trigger for key tables
-- ==========================================
CREATE OR REPLACE FUNCTION public.trg_audit_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN v_org_id := OLD.organization_id; ELSE v_org_id := NEW.organization_id; END IF;
  INSERT INTO audit_logs (action, table_name, record_id, organization_id, user_id, old_data, new_data)
  VALUES (
    lower(TG_OP), TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id::text ELSE NEW.id::text END,
    v_org_id, auth.uid(),
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER audit_properties AFTER INSERT OR UPDATE OR DELETE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.trg_audit_log();
CREATE TRIGGER audit_tenants AFTER INSERT OR UPDATE OR DELETE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.trg_audit_log();
CREATE TRIGGER audit_leases AFTER INSERT OR UPDATE OR DELETE ON public.leases FOR EACH ROW EXECUTE FUNCTION public.trg_audit_log();
CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.trg_audit_log();
CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.trg_audit_log();

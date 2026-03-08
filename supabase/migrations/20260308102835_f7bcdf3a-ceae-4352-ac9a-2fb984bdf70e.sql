
-- Ejari Contracts table
CREATE TABLE public.ejari_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lease_id UUID REFERENCES public.leases(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  ejari_number TEXT NOT NULL,
  contract_number TEXT,
  property_name TEXT,
  unit_number TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  annual_rent NUMERIC NOT NULL,
  security_deposit NUMERIC DEFAULT 0,
  registration_date DATE,
  expiry_date DATE,
  status TEXT DEFAULT 'draft',
  contract_type TEXT DEFAULT 'new',
  payment_method TEXT DEFAULT 'cheque',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ejari_contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Org members can view ejari" ON public.ejari_contracts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = ejari_contracts.organization_id AND organization_members.user_id = auth.uid())
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Org members can insert ejari" ON public.ejari_contracts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = ejari_contracts.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin', 'property_owner', 'property_manager'))
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Org members can update ejari" ON public.ejari_contracts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = ejari_contracts.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin', 'property_owner', 'property_manager'))
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Org members can delete ejari" ON public.ejari_contracts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = ejari_contracts.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin', 'property_owner'))
    OR has_role(auth.uid(), 'super_admin')
  );

-- Updated_at trigger
CREATE TRIGGER update_ejari_contracts_updated_at
  BEFORE UPDATE ON public.ejari_contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

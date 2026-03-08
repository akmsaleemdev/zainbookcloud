
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT,
  file_size BIGINT,
  file_type TEXT,
  category TEXT DEFAULT 'general',
  description TEXT,
  related_type TEXT,
  related_id UUID,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  lease_id UUID REFERENCES public.leases(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  uploaded_by UUID,
  expiry_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view documents" ON public.documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = documents.organization_id AND organization_members.user_id = auth.uid())
    OR has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Staff can insert documents" ON public.documents
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = documents.organization_id AND organization_members.user_id = auth.uid())
    OR has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Staff can update documents" ON public.documents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = documents.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin', 'property_owner', 'property_manager', 'staff'))
    OR has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Managers can delete documents" ON public.documents
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = documents.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin', 'property_owner'))
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

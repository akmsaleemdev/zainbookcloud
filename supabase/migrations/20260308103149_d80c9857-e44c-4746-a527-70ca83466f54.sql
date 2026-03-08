
CREATE TABLE public.amenities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  category TEXT DEFAULT 'general',
  description TEXT,
  is_paid BOOLEAN DEFAULT false,
  price NUMERIC DEFAULT 0,
  billing_frequency TEXT DEFAULT 'monthly',
  status TEXT DEFAULT 'active',
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view amenities" ON public.amenities
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = amenities.organization_id AND organization_members.user_id = auth.uid())
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Managers can insert amenities" ON public.amenities
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = amenities.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin', 'property_owner', 'property_manager'))
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Managers can update amenities" ON public.amenities
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = amenities.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin', 'property_owner', 'property_manager'))
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Managers can delete amenities" ON public.amenities
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = amenities.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin', 'property_owner'))
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE TRIGGER update_amenities_updated_at
  BEFORE UPDATE ON public.amenities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

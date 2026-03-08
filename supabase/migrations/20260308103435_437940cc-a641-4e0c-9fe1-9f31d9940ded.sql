
CREATE TABLE public.utility_meters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  meter_number TEXT NOT NULL,
  utility_type TEXT NOT NULL DEFAULT 'electricity',
  provider TEXT,
  account_number TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.utility_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meter_id UUID NOT NULL REFERENCES public.utility_meters(id) ON DELETE CASCADE,
  reading_value NUMERIC NOT NULL,
  reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
  consumption NUMERIC,
  amount NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.utility_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_readings ENABLE ROW LEVEL SECURITY;

-- Meters RLS
CREATE POLICY "Org members can view meters" ON public.utility_meters
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = utility_meters.organization_id AND organization_members.user_id = auth.uid())
    OR has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Managers can insert meters" ON public.utility_meters
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = utility_meters.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin', 'property_owner', 'property_manager', 'staff'))
    OR has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Managers can update meters" ON public.utility_meters
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = utility_meters.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin', 'property_owner', 'property_manager'))
    OR has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Managers can delete meters" ON public.utility_meters
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = utility_meters.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin', 'property_owner'))
    OR has_role(auth.uid(), 'super_admin')
  );

-- Readings RLS (via meter -> org)
CREATE POLICY "Org members can view readings" ON public.utility_readings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM utility_meters m JOIN organization_members om ON om.organization_id = m.organization_id WHERE m.id = utility_readings.meter_id AND om.user_id = auth.uid())
    OR has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Staff can insert readings" ON public.utility_readings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM utility_meters m JOIN organization_members om ON om.organization_id = m.organization_id WHERE m.id = utility_readings.meter_id AND om.user_id = auth.uid())
    OR has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Staff can update readings" ON public.utility_readings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM utility_meters m JOIN organization_members om ON om.organization_id = m.organization_id WHERE m.id = utility_readings.meter_id AND om.user_id = auth.uid() AND om.role IN ('organization_admin', 'property_owner', 'property_manager'))
    OR has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Managers can delete readings" ON public.utility_readings
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM utility_meters m JOIN organization_members om ON om.organization_id = m.organization_id WHERE m.id = utility_readings.meter_id AND om.user_id = auth.uid() AND om.role IN ('organization_admin', 'property_owner'))
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE TRIGGER update_utility_meters_updated_at
  BEFORE UPDATE ON public.utility_meters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

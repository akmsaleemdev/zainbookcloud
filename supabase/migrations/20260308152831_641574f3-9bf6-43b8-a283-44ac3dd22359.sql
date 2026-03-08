
-- Property images gallery
CREATE TABLE public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  is_primary boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View property images via org" ON public.property_images FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM properties p JOIN organization_members om ON om.organization_id = p.organization_id WHERE p.id = property_images.property_id AND om.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Manage property images" ON public.property_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM properties p JOIN organization_members om ON om.organization_id = p.organization_id WHERE p.id = property_images.property_id AND om.user_id = auth.uid() AND om.role IN ('organization_admin','property_owner','property_manager')) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM properties p JOIN organization_members om ON om.organization_id = p.organization_id WHERE p.id = property_images.property_id AND om.user_id = auth.uid() AND om.role IN ('organization_admin','property_owner','property_manager')) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Tenant family members
CREATE TABLE public.tenant_family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  relationship text NOT NULL DEFAULT 'spouse',
  emirates_id text,
  date_of_birth date,
  visa_number text,
  visa_expiry date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tenant_family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View family via tenant org" ON public.tenant_family_members FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tenants t JOIN organization_members om ON om.organization_id = t.organization_id WHERE t.id = tenant_family_members.tenant_id AND om.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Manage family members" ON public.tenant_family_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM tenants t JOIN organization_members om ON om.organization_id = t.organization_id WHERE t.id = tenant_family_members.tenant_id AND om.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM tenants t JOIN organization_members om ON om.organization_id = t.organization_id WHERE t.id = tenant_family_members.tenant_id AND om.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Parking spaces
CREATE TABLE public.parking_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  space_number text NOT NULL,
  space_type text DEFAULT 'standard',
  floor_level text,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  vehicle_plate text,
  vehicle_type text,
  permit_number text,
  permit_expiry date,
  monthly_fee numeric DEFAULT 0,
  status text DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.parking_spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View parking via property org" ON public.parking_spaces FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM properties p JOIN organization_members om ON om.organization_id = p.organization_id WHERE p.id = parking_spaces.property_id AND om.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Manage parking spaces" ON public.parking_spaces FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM properties p JOIN organization_members om ON om.organization_id = p.organization_id WHERE p.id = parking_spaces.property_id AND om.user_id = auth.uid() AND om.role IN ('organization_admin','property_owner','property_manager','staff')) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM properties p JOIN organization_members om ON om.organization_id = p.organization_id WHERE p.id = parking_spaces.property_id AND om.user_id = auth.uid() AND om.role IN ('organization_admin','property_owner','property_manager','staff')) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Visitor management
CREATE TABLE public.visitor_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  visitor_name text NOT NULL,
  visitor_phone text,
  visitor_emirates_id text,
  purpose text DEFAULT 'visit',
  vehicle_plate text,
  unit_number text,
  check_in_at timestamptz NOT NULL DEFAULT now(),
  check_out_at timestamptz,
  approved_by uuid,
  status text DEFAULT 'checked_in',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View visitors via property org" ON public.visitor_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM properties p JOIN organization_members om ON om.organization_id = p.organization_id WHERE p.id = visitor_logs.property_id AND om.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Manage visitors" ON public.visitor_logs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM properties p JOIN organization_members om ON om.organization_id = p.organization_id WHERE p.id = visitor_logs.property_id AND om.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM properties p JOIN organization_members om ON om.organization_id = p.organization_id WHERE p.id = visitor_logs.property_id AND om.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Access cards
CREATE TABLE public.access_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  card_number text NOT NULL,
  card_type text DEFAULT 'resident',
  issued_date date DEFAULT CURRENT_DATE,
  expiry_date date,
  deposit_amount numeric DEFAULT 0,
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.access_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View access cards via property org" ON public.access_cards FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM properties p JOIN organization_members om ON om.organization_id = p.organization_id WHERE p.id = access_cards.property_id AND om.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Manage access cards" ON public.access_cards FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM properties p JOIN organization_members om ON om.organization_id = p.organization_id WHERE p.id = access_cards.property_id AND om.user_id = auth.uid() AND om.role IN ('organization_admin','property_owner','property_manager','staff')) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM properties p JOIN organization_members om ON om.organization_id = p.organization_id WHERE p.id = access_cards.property_id AND om.user_id = auth.uid() AND om.role IN ('organization_admin','property_owner','property_manager','staff')) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Building inspections (fire safety, elevator, move-in/out)
CREATE TABLE public.building_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  building_id uuid REFERENCES public.buildings(id) ON DELETE SET NULL,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  inspection_type text NOT NULL DEFAULT 'fire_safety',
  title text NOT NULL,
  description text,
  inspector_name text,
  inspection_date date NOT NULL DEFAULT CURRENT_DATE,
  next_inspection_date date,
  status text DEFAULT 'scheduled',
  findings text,
  checklist jsonb DEFAULT '[]'::jsonb,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.building_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View inspections via property org" ON public.building_inspections FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM properties p JOIN organization_members om ON om.organization_id = p.organization_id WHERE p.id = building_inspections.property_id AND om.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Manage inspections" ON public.building_inspections FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM properties p JOIN organization_members om ON om.organization_id = p.organization_id WHERE p.id = building_inspections.property_id AND om.user_id = auth.uid() AND om.role IN ('organization_admin','property_owner','property_manager','staff','maintenance_staff')) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM properties p JOIN organization_members om ON om.organization_id = p.organization_id WHERE p.id = building_inspections.property_id AND om.user_id = auth.uid() AND om.role IN ('organization_admin','property_owner','property_manager','staff','maintenance_staff')) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Service charges
CREATE TABLE public.service_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  charge_type text NOT NULL DEFAULT 'building_service',
  description text,
  amount numeric NOT NULL DEFAULT 0,
  frequency text DEFAULT 'annual',
  effective_date date DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View service charges via property org" ON public.service_charges FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM properties p JOIN organization_members om ON om.organization_id = p.organization_id WHERE p.id = service_charges.property_id AND om.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Manage service charges" ON public.service_charges FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM properties p JOIN organization_members om ON om.organization_id = p.organization_id WHERE p.id = service_charges.property_id AND om.user_id = auth.uid() AND om.role IN ('organization_admin','property_owner','property_manager','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM properties p JOIN organization_members om ON om.organization_id = p.organization_id WHERE p.id = service_charges.property_id AND om.user_id = auth.uid() AND om.role IN ('organization_admin','property_owner','property_manager','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Cheque tracking for PDC (Post Dated Cheques)
CREATE TABLE public.cheque_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lease_id uuid REFERENCES public.leases(id) ON DELETE SET NULL,
  cheque_number text NOT NULL,
  bank_name text,
  amount numeric NOT NULL,
  cheque_date date NOT NULL,
  status text DEFAULT 'pending',
  deposited_date date,
  cleared_date date,
  bounced_date date,
  bounce_reason text,
  replacement_cheque_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cheque_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View cheques via org" ON public.cheque_tracking FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = cheque_tracking.organization_id AND om.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Manage cheques" ON public.cheque_tracking FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = cheque_tracking.organization_id AND om.user_id = auth.uid() AND om.role IN ('organization_admin','property_owner','property_manager','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = cheque_tracking.organization_id AND om.user_id = auth.uid() AND om.role IN ('organization_admin','property_owner','property_manager','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Add profile_photo_url to tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS profile_photo_url text;

-- Add lat/lng to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS longitude numeric;

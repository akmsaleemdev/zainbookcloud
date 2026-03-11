
-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- App roles enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'organization_admin', 'property_owner', 'property_manager', 'staff', 'accountant', 'maintenance_staff', 'tenant');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  nationality TEXT,
  emirates_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Organizations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  trade_license TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  emirate TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Organization members
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'staff',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their org" ON public.organizations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = id AND user_id = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Admins can manage orgs" ON public.organizations FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Members can view org members" ON public.organization_members FOR SELECT USING (
  user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin')
);

-- Properties
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  property_type TEXT NOT NULL DEFAULT 'residential',
  address TEXT,
  emirate TEXT NOT NULL,
  city TEXT,
  area TEXT,
  community TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  total_units INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Org members can view properties" ON public.properties FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = properties.organization_id AND user_id = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Admins can manage properties" ON public.properties FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Buildings
CREATE TABLE public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  floors_count INTEGER DEFAULT 1,
  year_built INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON public.buildings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "View buildings via property" ON public.buildings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE p.id = buildings.property_id AND om.user_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'super_admin')
);

-- Units
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
  unit_number TEXT NOT NULL,
  floor_number INTEGER,
  unit_type TEXT DEFAULT 'apartment',
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  area_sqft NUMERIC,
  status TEXT DEFAULT 'available',
  monthly_rent NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "View units via building" ON public.units FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.buildings b
    JOIN public.properties p ON p.id = b.property_id
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE b.id = units.building_id AND om.user_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'super_admin')
);

-- Rooms
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  room_number TEXT NOT NULL,
  room_type TEXT DEFAULT 'single',
  max_occupancy INTEGER DEFAULT 1,
  monthly_rent NUMERIC,
  status TEXT DEFAULT 'available',
  furnishing TEXT DEFAULT 'furnished',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "View rooms via unit" ON public.rooms FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.units u
    JOIN public.buildings b ON b.id = u.building_id
    JOIN public.properties p ON p.id = b.property_id
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE u.id = rooms.unit_id AND om.user_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'super_admin')
);

-- Bed Spaces
CREATE TABLE public.bed_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  bed_number TEXT NOT NULL,
  bed_type TEXT DEFAULT 'single',
  monthly_rent NUMERIC,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bed_spaces ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_bed_spaces_updated_at BEFORE UPDATE ON public.bed_spaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "View bed spaces via room" ON public.bed_spaces FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.rooms r
    JOIN public.units u ON u.id = r.unit_id
    JOIN public.buildings b ON b.id = u.building_id
    JOIN public.properties p ON p.id = b.property_id
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE r.id = bed_spaces.room_id AND om.user_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'super_admin')
);

-- Tenants
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  nationality TEXT,
  emirates_id TEXT,
  passport_number TEXT,
  visa_number TEXT,
  visa_expiry DATE,
  occupation TEXT,
  employer TEXT,
  emergency_contact TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Org members can view tenants" ON public.tenants FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = tenants.organization_id AND user_id = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Leases
CREATE TABLE public.leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
  unit_id UUID REFERENCES public.units(id),
  room_id UUID REFERENCES public.rooms(id),
  bed_space_id UUID REFERENCES public.bed_spaces(id),
  lease_type TEXT DEFAULT 'fixed',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent NUMERIC NOT NULL,
  security_deposit NUMERIC DEFAULT 0,
  payment_frequency TEXT DEFAULT 'monthly',
  status TEXT DEFAULT 'active',
  ejari_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_leases_updated_at BEFORE UPDATE ON public.leases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Org members can view leases" ON public.leases FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = leases.organization_id AND user_id = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
  lease_id UUID REFERENCES public.leases(id),
  invoice_number TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  vat_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Org members can view invoices" ON public.invoices FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = invoices.organization_id AND user_id = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id),
  tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'bank_transfer',
  reference_number TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = payments.organization_id AND user_id = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Maintenance Requests
CREATE TABLE public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  unit_id UUID REFERENCES public.units(id),
  room_id UUID REFERENCES public.rooms(id),
  reported_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  category TEXT,
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Org members can view maintenance" ON public.maintenance_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = maintenance_requests.organization_id AND user_id = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

-- Allow authenticated users to create organizations
CREATE POLICY "Authenticated users can create orgs"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Allow org admins to update their org
CREATE POLICY "Org admins can update their org"
ON public.organizations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = organizations.id
    AND user_id = auth.uid()
    AND role IN ('organization_admin', 'super_admin')
  )
);

-- Allow org admins to delete their org
CREATE POLICY "Org admins can delete their org"
ON public.organizations FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = organizations.id
    AND user_id = auth.uid()
    AND role = 'organization_admin'
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Organization members: allow org admins to manage members
CREATE POLICY "Org admins can insert members"
ON public.organization_members FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('organization_admin')
  )
  OR auth.uid() = user_id -- Allow self-insert when creating org
);

CREATE POLICY "Org admins can update members"
ON public.organization_members FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role = 'organization_admin'
  )
);

CREATE POLICY "Org admins can delete members"
ON public.organization_members FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role = 'organization_admin'
  )
);

-- Properties: allow org members with management roles to CRUD
CREATE POLICY "Org managers can insert properties"
ON public.properties FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = properties.organization_id
    AND user_id = auth.uid()
    AND role IN ('organization_admin', 'property_owner', 'property_manager')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Org managers can update properties"
ON public.properties FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = properties.organization_id
    AND user_id = auth.uid()
    AND role IN ('organization_admin', 'property_owner', 'property_manager')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Org managers can delete properties"
ON public.properties FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = properties.organization_id
    AND user_id = auth.uid()
    AND role IN ('organization_admin', 'property_owner')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Buildings: CRUD for org managers via property
CREATE POLICY "Managers can insert buildings"
ON public.buildings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties p
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE p.id = buildings.property_id
    AND om.user_id = auth.uid()
    AND om.role IN ('organization_admin', 'property_owner', 'property_manager')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Managers can update buildings"
ON public.buildings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE p.id = buildings.property_id
    AND om.user_id = auth.uid()
    AND om.role IN ('organization_admin', 'property_owner', 'property_manager')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Managers can delete buildings"
ON public.buildings FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE p.id = buildings.property_id
    AND om.user_id = auth.uid()
    AND om.role IN ('organization_admin', 'property_owner')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Units: CRUD via building->property->org
CREATE POLICY "Managers can insert units"
ON public.units FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.buildings b
    JOIN public.properties p ON p.id = b.property_id
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE b.id = units.building_id
    AND om.user_id = auth.uid()
    AND om.role IN ('organization_admin', 'property_owner', 'property_manager')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Managers can update units"
ON public.units FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.buildings b
    JOIN public.properties p ON p.id = b.property_id
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE b.id = units.building_id
    AND om.user_id = auth.uid()
    AND om.role IN ('organization_admin', 'property_owner', 'property_manager')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Managers can delete units"
ON public.units FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.buildings b
    JOIN public.properties p ON p.id = b.property_id
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE b.id = units.building_id
    AND om.user_id = auth.uid()
    AND om.role IN ('organization_admin', 'property_owner')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Rooms: CRUD via unit->building->property->org
CREATE POLICY "Managers can insert rooms"
ON public.rooms FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.units u
    JOIN public.buildings b ON b.id = u.building_id
    JOIN public.properties p ON p.id = b.property_id
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE u.id = rooms.unit_id
    AND om.user_id = auth.uid()
    AND om.role IN ('organization_admin', 'property_owner', 'property_manager')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Managers can update rooms"
ON public.rooms FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.units u
    JOIN public.buildings b ON b.id = u.building_id
    JOIN public.properties p ON p.id = b.property_id
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE u.id = rooms.unit_id
    AND om.user_id = auth.uid()
    AND om.role IN ('organization_admin', 'property_owner', 'property_manager')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Managers can delete rooms"
ON public.rooms FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.units u
    JOIN public.buildings b ON b.id = u.building_id
    JOIN public.properties p ON p.id = b.property_id
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE u.id = rooms.unit_id
    AND om.user_id = auth.uid()
    AND om.role IN ('organization_admin', 'property_owner')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Bed Spaces: CRUD via room->unit->building->property->org
CREATE POLICY "Managers can insert bed spaces"
ON public.bed_spaces FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rooms r
    JOIN public.units u ON u.id = r.unit_id
    JOIN public.buildings b ON b.id = u.building_id
    JOIN public.properties p ON p.id = b.property_id
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE r.id = bed_spaces.room_id
    AND om.user_id = auth.uid()
    AND om.role IN ('organization_admin', 'property_owner', 'property_manager')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Managers can update bed spaces"
ON public.bed_spaces FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rooms r
    JOIN public.units u ON u.id = r.unit_id
    JOIN public.buildings b ON b.id = u.building_id
    JOIN public.properties p ON p.id = b.property_id
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE r.id = bed_spaces.room_id
    AND om.user_id = auth.uid()
    AND om.role IN ('organization_admin', 'property_owner', 'property_manager')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Managers can delete bed spaces"
ON public.bed_spaces FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rooms r
    JOIN public.units u ON u.id = r.unit_id
    JOIN public.buildings b ON b.id = u.building_id
    JOIN public.properties p ON p.id = b.property_id
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE r.id = bed_spaces.room_id
    AND om.user_id = auth.uid()
    AND om.role IN ('organization_admin', 'property_owner')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Tenants: CRUD for org members
CREATE POLICY "Org members can insert tenants"
ON public.tenants FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = tenants.organization_id
    AND user_id = auth.uid()
    AND role IN ('organization_admin', 'property_owner', 'property_manager', 'staff')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Org members can update tenants"
ON public.tenants FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = tenants.organization_id
    AND user_id = auth.uid()
    AND role IN ('organization_admin', 'property_owner', 'property_manager', 'staff')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Org members can delete tenants"
ON public.tenants FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = tenants.organization_id
    AND user_id = auth.uid()
    AND role IN ('organization_admin', 'property_owner')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Leases: CRUD for org members
CREATE POLICY "Org members can insert leases"
ON public.leases FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = leases.organization_id
    AND user_id = auth.uid()
    AND role IN ('organization_admin', 'property_owner', 'property_manager')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Org members can update leases"
ON public.leases FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = leases.organization_id
    AND user_id = auth.uid()
    AND role IN ('organization_admin', 'property_owner', 'property_manager')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Org members can delete leases"
ON public.leases FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = leases.organization_id
    AND user_id = auth.uid()
    AND role IN ('organization_admin', 'property_owner')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Invoices: CRUD for org members
CREATE POLICY "Org members can insert invoices"
ON public.invoices FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = invoices.organization_id
    AND user_id = auth.uid()
    AND role IN ('organization_admin', 'property_owner', 'property_manager', 'accountant')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Org members can update invoices"
ON public.invoices FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = invoices.organization_id
    AND user_id = auth.uid()
    AND role IN ('organization_admin', 'property_owner', 'property_manager', 'accountant')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Org members can delete invoices"
ON public.invoices FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = invoices.organization_id
    AND user_id = auth.uid()
    AND role IN ('organization_admin')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Payments: CRUD for org members
CREATE POLICY "Org members can insert payments"
ON public.payments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = payments.organization_id
    AND user_id = auth.uid()
    AND role IN ('organization_admin', 'property_owner', 'property_manager', 'accountant')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Org members can update payments"
ON public.payments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = payments.organization_id
    AND user_id = auth.uid()
    AND role IN ('organization_admin', 'accountant')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Org members can delete payments"
ON public.payments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = payments.organization_id
    AND user_id = auth.uid()
    AND role IN ('organization_admin')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Maintenance: CRUD for org members
CREATE POLICY "Org members can insert maintenance"
ON public.maintenance_requests FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = maintenance_requests.organization_id
    AND user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Org members can update maintenance"
ON public.maintenance_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = maintenance_requests.organization_id
    AND user_id = auth.uid()
    AND role IN ('organization_admin', 'property_owner', 'property_manager', 'maintenance_staff')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Org members can delete maintenance"
ON public.maintenance_requests FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = maintenance_requests.organization_id
    AND user_id = auth.uid()
    AND role IN ('organization_admin', 'property_owner')
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Audit logs: allow authenticated to insert
CREATE POLICY "Authenticated can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

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

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, 20971520, ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain']);

CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can view documents" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'documents');

-- Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  recipient_id UUID,
  subject TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal',
  channel TEXT DEFAULT 'internal',
  related_type TEXT,
  related_id UUID,
  parent_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'info',
  category TEXT DEFAULT 'system',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  related_type TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Messages RLS
CREATE POLICY "Org members can view messages" ON public.messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = messages.organization_id AND organization_members.user_id = auth.uid())
    OR has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Org members can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = messages.organization_id AND organization_members.user_id = auth.uid())
    OR has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Sender can update messages" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Sender can delete messages" ON public.messages
  FOR DELETE USING (sender_id = auth.uid() OR has_role(auth.uid(), 'super_admin'));

-- Notifications RLS
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = notifications.organization_id AND organization_members.user_id = auth.uid())
    OR has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Subscription Plans
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  plan_type TEXT NOT NULL DEFAULT 'monthly' CHECK (plan_type IN ('trial', 'monthly', 'quarterly', 'half_yearly', 'yearly')),
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AED',
  max_users INTEGER DEFAULT 1,
  max_units INTEGER DEFAULT 5,
  max_storage_gb INTEGER DEFAULT 1,
  max_api_calls INTEGER DEFAULT 1000,
  ai_usage_limit INTEGER DEFAULT 100,
  trial_days INTEGER DEFAULT 14,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Platform Modules
CREATE TABLE public.platform_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  category TEXT DEFAULT 'core',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Plan-Module mapping (which modules each plan includes)
CREATE TABLE public.plan_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.platform_modules(id) ON DELETE CASCADE,
  is_included BOOLEAN DEFAULT true,
  addon_price NUMERIC DEFAULT 0,
  UNIQUE(plan_id, module_id)
);

-- Customer Subscriptions
CREATE TABLE public.customer_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trial', 'active', 'suspended', 'cancelled', 'expired')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  billing_cycle TEXT DEFAULT 'monthly',
  next_billing_date DATE,
  total_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- Subscription Module Add-ons
CREATE TABLE public.subscription_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.customer_subscriptions(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.platform_modules(id),
  is_enabled BOOLEAN DEFAULT true,
  enabled_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(subscription_id, module_id)
);

-- Support Tickets
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  assigned_to UUID,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('sales', 'technical', 'billing', 'general')),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  sla_due_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  ai_suggested_solution TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Support Ticket Messages
CREATE TABLE public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID,
  sender_type TEXT DEFAULT 'user' CHECK (sender_type IN ('user', 'agent', 'ai', 'system')),
  body TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Support Chat Sessions
CREATE TABLE public.ai_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'escalated')),
  escalated_ticket_id UUID REFERENCES public.support_tickets(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Chat Messages
CREATE TABLE public.ai_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ERP Connections
CREATE TABLE public.erp_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  erp_type TEXT NOT NULL CHECK (erp_type IN ('oracle_netsuite', 'dynamics_365', 'odoo', 'sap_business_one', 'zoho')),
  connection_name TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'syncing')),
  config JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  sync_frequency TEXT DEFAULT 'manual' CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'manual')),
  enabled_sync_types TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, erp_type)
);

-- ERP Sync Logs
CREATE TABLE public.erp_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.erp_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed')),
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Plans & modules are readable by all authenticated users
CREATE POLICY "Anyone can view plans" ON public.subscription_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view modules" ON public.platform_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view plan modules" ON public.plan_modules FOR SELECT TO authenticated USING (true);

-- Only super_admins can manage plans/modules
CREATE POLICY "Admins manage plans" ON public.subscription_plans FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins manage modules" ON public.platform_modules FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins manage plan_modules" ON public.plan_modules FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Customer subscriptions
CREATE POLICY "Org members view sub" ON public.customer_subscriptions FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = customer_subscriptions.organization_id AND user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins manage subs" ON public.customer_subscriptions FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Org members view sub_modules" ON public.subscription_modules FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM customer_subscriptions cs JOIN organization_members om ON om.organization_id = cs.organization_id WHERE cs.id = subscription_modules.subscription_id AND om.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins manage sub_modules" ON public.subscription_modules FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Support tickets
CREATE POLICY "Users view own tickets" ON public.support_tickets FOR SELECT TO authenticated 
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users create tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users update own tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (created_by = auth.uid() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins delete tickets" ON public.support_tickets FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'));

-- Ticket messages
CREATE POLICY "View ticket msgs" ON public.ticket_messages FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_messages.ticket_id AND (created_by = auth.uid() OR has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "Insert ticket msgs" ON public.ticket_messages FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_messages.ticket_id AND (created_by = auth.uid() OR has_role(auth.uid(), 'super_admin'))));

-- AI chat sessions
CREATE POLICY "Users own chat sessions" ON public.ai_chat_sessions FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users create chat sessions" ON public.ai_chat_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update chat sessions" ON public.ai_chat_sessions FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- AI chat messages
CREATE POLICY "Users view chat msgs" ON public.ai_chat_messages FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM ai_chat_sessions WHERE id = ai_chat_messages.session_id AND (user_id = auth.uid() OR has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "Users insert chat msgs" ON public.ai_chat_messages FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM ai_chat_sessions WHERE id = ai_chat_messages.session_id AND user_id = auth.uid()));

-- ERP connections
CREATE POLICY "Org members view erp" ON public.erp_connections FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = erp_connections.organization_id AND user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Org admins manage erp" ON public.erp_connections FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = erp_connections.organization_id AND user_id = auth.uid() AND role = 'organization_admin') OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = erp_connections.organization_id AND user_id = auth.uid() AND role = 'organization_admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "View sync logs" ON public.erp_sync_logs FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM erp_connections ec JOIN organization_members om ON om.organization_id = ec.organization_id WHERE ec.id = erp_sync_logs.connection_id AND om.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins manage sync logs" ON public.erp_sync_logs FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Seed default platform modules
INSERT INTO public.platform_modules (name, slug, description, icon, category, sort_order) VALUES
  ('Property Management', 'property_management', 'Manage properties, buildings, floors, units, rooms, and bed spaces', 'Building2', 'core', 1),
  ('Tenant Management', 'tenant_management', 'Manage tenants, documents, and communications', 'Users', 'core', 2),
  ('Lease Management', 'lease_management', 'Lease creation, renewal, and Ejari integration', 'FileText', 'core', 3),
  ('Unit Management', 'unit_management', 'Advanced unit and room management', 'DoorOpen', 'core', 4),
  ('Maintenance', 'maintenance', 'Work orders, preventive maintenance, and vendor management', 'Wrench', 'operations', 5),
  ('Financial Reports', 'financial_reports', 'Revenue reports, expense tracking, and financial dashboards', 'BarChart3', 'finance', 6),
  ('AI Insights', 'ai_insights', 'AI-powered analytics, predictions, and recommendations', 'Brain', 'intelligence', 7),
  ('Document Management', 'document_management', 'Document storage, versioning, and expiry tracking', 'FolderOpen', 'operations', 8),
  ('Accounting Sync', 'accounting_sync', 'Sync with accounting systems and generate reports', 'Receipt', 'finance', 9),
  ('ERP Integration', 'erp_integration', 'Connect to Oracle, SAP, Dynamics, Odoo, Zoho', 'Zap', 'integration', 10),
  ('CRM Module', 'crm', 'Customer relationship management and lead tracking', 'UserCircle', 'sales', 11),
  ('Support System', 'support_system', 'AI-powered support chat and ticketing', 'MessageSquare', 'support', 12);

-- Seed default subscription plans
INSERT INTO public.subscription_plans (name, description, plan_type, price, max_users, max_units, max_storage_gb, max_api_calls, ai_usage_limit, trial_days, is_featured, sort_order) VALUES
  ('Free Trial', '14-day free trial with full access', 'trial', 0, 2, 10, 1, 500, 50, 14, false, 1),
  ('Starter', 'For small landlords and property owners', 'monthly', 199, 3, 25, 5, 2000, 200, 0, false, 2),
  ('Professional', 'For property management companies', 'monthly', 499, 10, 100, 25, 10000, 1000, 0, true, 3),
  ('Enterprise', 'For large portfolios and corporates', 'monthly', 1499, -1, -1, 100, -1, -1, 0, false, 4);

-- Complaints table
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'general',
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_to UUID,
  resolution TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  resolved_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view complaints" ON public.complaints FOR SELECT
  USING ((EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = complaints.organization_id AND organization_members.user_id = auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Org members can insert complaints" ON public.complaints FOR INSERT
  WITH CHECK ((EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = complaints.organization_id AND organization_members.user_id = auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Managers can update complaints" ON public.complaints FOR UPDATE
  USING ((EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = complaints.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['organization_admin'::app_role, 'property_owner'::app_role, 'property_manager'::app_role, 'staff'::app_role]))) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete complaints" ON public.complaints FOR DELETE
  USING ((EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = complaints.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['organization_admin'::app_role, 'property_owner'::app_role]))) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Notices table
CREATE TABLE public.notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  notice_type TEXT NOT NULL DEFAULT 'general',
  recipient_type TEXT NOT NULL DEFAULT 'all',
  recipient_ids UUID[] DEFAULT '{}',
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view notices" ON public.notices FOR SELECT
  USING ((EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = notices.organization_id AND organization_members.user_id = auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Managers can insert notices" ON public.notices FOR INSERT
  WITH CHECK ((EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = notices.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['organization_admin'::app_role, 'property_owner'::app_role, 'property_manager'::app_role, 'staff'::app_role]))) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Managers can update notices" ON public.notices FOR UPDATE
  USING ((EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = notices.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['organization_admin'::app_role, 'property_owner'::app_role, 'property_manager'::app_role, 'staff'::app_role]))) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete notices" ON public.notices FOR DELETE
  USING ((EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = notices.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['organization_admin'::app_role, 'property_owner'::app_role]))) OR has_role(auth.uid(), 'super_admin'::app_role));

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS vat_number TEXT,
  ADD COLUMN IF NOT EXISTS vat_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS vat_rate NUMERIC DEFAULT 5,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'AED',
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'UAE',
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Dubai';

CREATE TABLE public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'schedule',
  trigger_config JSONB DEFAULT '{}'::jsonb,
  action_type TEXT NOT NULL DEFAULT 'notification',
  action_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view automation rules" ON public.automation_rules FOR SELECT
  USING ((EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = automation_rules.organization_id AND organization_members.user_id = auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Managers can insert automation rules" ON public.automation_rules FOR INSERT
  WITH CHECK ((EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = automation_rules.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['organization_admin'::app_role, 'property_owner'::app_role, 'property_manager'::app_role]))) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Managers can update automation rules" ON public.automation_rules FOR UPDATE
  USING ((EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = automation_rules.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['organization_admin'::app_role, 'property_owner'::app_role, 'property_manager'::app_role]))) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete automation rules" ON public.automation_rules FOR DELETE
  USING ((EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = automation_rules.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['organization_admin'::app_role, 'property_owner'::app_role]))) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE TABLE public.billing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.customer_subscriptions(id) ON DELETE SET NULL,
  action text NOT NULL DEFAULT 'payment',
  plan_name text,
  amount numeric DEFAULT 0,
  currency text DEFAULT 'AED',
  billing_cycle text,
  description text,
  invoice_number text,
  status text DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view billing history"
  ON public.billing_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = billing_history.organization_id
        AND organization_members.user_id = auth.uid()
    ) OR has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "System insert billing history"
  ON public.billing_history FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = billing_history.organization_id
        AND organization_members.user_id = auth.uid()
    ) OR has_role(auth.uid(), 'super_admin'::app_role)
  );
-- Payment gateway configurations table for Master Admin
CREATE TABLE public.payment_gateway_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  display_name text NOT NULL,
  api_key text,
  secret_key text,
  merchant_id text,
  access_token text,
  extra_config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT false,
  is_test_mode boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_gateway_configs ENABLE ROW LEVEL SECURITY;

-- Only super_admin can manage payment gateways
CREATE POLICY "Super admins manage payment gateways"
  ON public.payment_gateway_configs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Add missing subscription control columns to subscription_plans
ALTER TABLE public.subscription_plans 
  ADD COLUMN IF NOT EXISTS max_properties integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_tenants integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS report_access boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_features_access boolean DEFAULT true;

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

-- Recurring invoices table
CREATE TABLE public.recurring_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lease_id uuid REFERENCES public.leases(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  description text,
  frequency text NOT NULL DEFAULT 'monthly',
  next_generate_date date NOT NULL,
  is_active boolean DEFAULT true,
  auto_send boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view recurring invoices" ON public.recurring_invoices
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = recurring_invoices.organization_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Managers manage recurring invoices" ON public.recurring_invoices
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = recurring_invoices.organization_id AND user_id = auth.uid() AND role IN ('organization_admin', 'property_owner', 'property_manager', 'accountant'))
    OR has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = recurring_invoices.organization_id AND user_id = auth.uid() AND role IN ('organization_admin', 'property_owner', 'property_manager', 'accountant'))
    OR has_role(auth.uid(), 'super_admin')
  );

-- Add rent management fields to leases
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS late_fee_rate numeric DEFAULT 0;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS grace_period_days integer DEFAULT 5;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS rent_due_day integer DEFAULT 1;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS auto_generate_invoice boolean DEFAULT false;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS deposit_status text DEFAULT 'held';
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS renewal_reminder_days integer DEFAULT 30;

-- Rent schedule tracking table
CREATE TABLE public.rent_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lease_id uuid NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  amount numeric NOT NULL,
  late_fee numeric DEFAULT 0,
  status text DEFAULT 'upcoming',
  paid_date date,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rent_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view rent schedules" ON public.rent_schedules
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = rent_schedules.organization_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Managers manage rent schedules" ON public.rent_schedules
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = rent_schedules.organization_id AND user_id = auth.uid() AND role IN ('organization_admin', 'property_owner', 'property_manager', 'accountant'))
    OR has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = rent_schedules.organization_id AND user_id = auth.uid() AND role IN ('organization_admin', 'property_owner', 'property_manager', 'accountant'))
    OR has_role(auth.uid(), 'super_admin')
  );

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

-- Fix broken org SELECT policy (was referencing organization_members.id instead of organizations.id)
DROP POLICY IF EXISTS "Org members can view their org" ON public.organizations;
CREATE POLICY "Org members can view their org" ON public.organizations
  FOR SELECT USING (
    (EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
    )) OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Allow users to also view org they just created (before membership is added)
DROP POLICY IF EXISTS "Creator can view own org" ON public.organizations;
CREATE POLICY "Creator can view own org" ON public.organizations
  FOR SELECT USING (created_by = auth.uid());

CREATE OR REPLACE FUNCTION public.onboard_organization(
  _user_id uuid,
  _org_name text,
  _org_name_ar text DEFAULT NULL,
  _emirate text DEFAULT 'Dubai',
  _org_email text DEFAULT NULL,
  _org_phone text DEFAULT NULL,
  _plan_id uuid DEFAULT NULL,
  _billing_cycle text DEFAULT 'monthly'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_sub_id uuid;
  v_plan record;
  v_total_amount numeric;
  v_is_trial boolean;
BEGIN
  -- Verify user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check user doesn't already have an org
  IF EXISTS (SELECT 1 FROM organization_members WHERE user_id = _user_id) THEN
    RAISE EXCEPTION 'User already belongs to an organization';
  END IF;

  -- Get plan details
  IF _plan_id IS NOT NULL THEN
    SELECT * INTO v_plan FROM subscription_plans WHERE id = _plan_id AND is_active = true;
    IF v_plan IS NULL THEN
      RAISE EXCEPTION 'Plan not found or inactive';
    END IF;
  END IF;

  -- 1. Create organization
  INSERT INTO organizations (name, name_ar, emirate, email, phone, created_by, country, currency, timezone)
  VALUES (_org_name, _org_name_ar, _emirate, _org_email, _org_phone, _user_id, 'UAE', 'AED', 'Asia/Dubai')
  RETURNING id INTO v_org_id;

  -- 2. Add user as organization_admin
  INSERT INTO organization_members (user_id, organization_id, role, is_active)
  VALUES (_user_id, v_org_id, 'organization_admin', true);

  -- 3. Create subscription if plan selected
  IF v_plan IS NOT NULL THEN
    v_is_trial := v_plan.plan_type = 'trial';
    v_total_amount := CASE WHEN _billing_cycle = 'yearly' THEN v_plan.price * 10 ELSE v_plan.price END;

    INSERT INTO customer_subscriptions (
      organization_id, plan_id, billing_cycle, total_amount, status,
      trial_ends_at, next_billing_date
    ) VALUES (
      v_org_id, _plan_id, _billing_cycle, v_total_amount,
      CASE WHEN v_is_trial THEN 'trialing' ELSE 'active' END,
      CASE WHEN v_is_trial THEN now() + ((COALESCE(v_plan.trial_days, 14))::text || ' days')::interval ELSE NULL END,
      (now() + CASE WHEN _billing_cycle = 'yearly' THEN interval '365 days' ELSE interval '30 days' END)::date
    )
    RETURNING id INTO v_sub_id;

    -- 4. Enable plan modules
    INSERT INTO subscription_modules (subscription_id, module_id, is_enabled, enabled_at)
    SELECT v_sub_id, pm.module_id, true, now()
    FROM plan_modules pm
    WHERE pm.plan_id = _plan_id AND pm.is_included = true
    ON CONFLICT (subscription_id, module_id) DO NOTHING;

    -- 5. Log billing history
    INSERT INTO billing_history (
      organization_id, action, plan_name, amount, billing_cycle,
      description, invoice_number, status, subscription_id
    ) VALUES (
      v_org_id, 'new_subscription', v_plan.name, v_total_amount, _billing_cycle,
      'Subscribed to ' || v_plan.name || ' plan',
      'INV-' || upper(to_hex(extract(epoch from now())::int)),
      CASE WHEN v_plan.price = 0 THEN 'trial' ELSE 'completed' END,
      v_sub_id
    );
  END IF;

  RETURN jsonb_build_object(
    'organization_id', v_org_id,
    'subscription_id', v_sub_id,
    'success', true
  );
END;
$$;

-- Fix platform_modules: add all sidebar slugs
INSERT INTO platform_modules (slug, name, description, category)
VALUES
  ('dashboard', 'Dashboard', 'Main dashboard', 'core'),
  ('organizations', 'Organizations', 'Organization management', 'core'),
  ('properties', 'Properties', 'Property management', 'property'),
  ('buildings', 'Buildings', 'Building management', 'property'),
  ('floors', 'Floors', 'Floor management', 'property'),
  ('units', 'Units', 'Unit management', 'property'),
  ('rooms', 'Rooms', 'Room management', 'property'),
  ('bed-spaces', 'Bed Spaces', 'Bed space management', 'property'),
  ('tenants', 'Tenants', 'Tenant management', 'tenants'),
  ('leases', 'Leases', 'Lease management', 'tenants'),
  ('ejari', 'Ejari', 'Ejari contract management', 'tenants'),
  ('rent-management', 'Rent Management', 'Rent tracking', 'finance'),
  ('invoices', 'Invoices', 'Invoice management', 'finance'),
  ('payments', 'Payments', 'Payment tracking', 'finance'),
  ('cheque-tracking', 'Cheque Tracking', 'Cheque management', 'finance'),
  ('maintenance', 'Maintenance', 'Maintenance requests', 'operations'),
  ('amenities', 'Amenities', 'Amenity management', 'operations'),
  ('utilities', 'Utilities', 'Utility tracking', 'operations'),
  ('documents', 'Documents', 'Document management', 'operations'),
  ('uae-management', 'UAE Management', 'UAE-specific management', 'operations'),
  ('messaging', 'Messaging', 'Internal messaging', 'communication'),
  ('notifications', 'Notifications', 'Notification center', 'communication'),
  ('complaints', 'Complaints', 'Complaint management', 'communication'),
  ('notices', 'Notices', 'Notice board', 'communication'),
  ('reports', 'Reports', 'Report generation', 'intelligence'),
  ('analytics', 'Analytics', 'Analytics dashboard', 'intelligence'),
  ('ai-insights', 'AI Insights', 'AI-powered insights', 'intelligence'),
  ('automation', 'Automation', 'Workflow automation', 'intelligence'),
  ('owner-portal', 'Owner Portal', 'Property owner portal', 'portals'),
  ('tenant-portal', 'Tenant Portal', 'Tenant self-service portal', 'portals'),
  ('public-booking', 'Public Booking', 'Public booking portal', 'portals'),
  ('erp-integrations', 'ERP Integrations', 'ERP connections', 'integrations'),
  ('support', 'Support Center', 'Support system', 'integrations'),
  ('subscriptions', 'Subscription Plans', 'Plan management', 'system'),
  ('master-admin', 'Master Admin', 'Platform administration', 'system'),
  ('user-management', 'User Management', 'User and role management', 'system'),
  ('settings', 'Settings', 'System settings', 'system')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category;

-- Add missing role permissions for property_owner
INSERT INTO role_permissions (role, module_slug, can_create, can_read, can_update, can_delete, can_approve, can_export, can_manage)
SELECT 'property_owner'::app_role, module_slug, can_create, can_read, can_update, can_delete, can_approve, can_export, false
FROM role_permissions
WHERE role = 'organization_admin' AND module_slug NOT IN ('master-admin')
ON CONFLICT (role, module_slug) DO NOTHING;

-- Add missing role permissions for staff
INSERT INTO role_permissions (role, module_slug, can_create, can_read, can_update, can_delete, can_approve, can_export, can_manage)
VALUES
  ('staff', 'dashboard', false, true, false, false, false, false, false),
  ('staff', 'properties', false, true, false, false, false, false, false),
  ('staff', 'buildings', false, true, false, false, false, false, false),
  ('staff', 'floors', false, true, false, false, false, false, false),
  ('staff', 'units', false, true, false, false, false, false, false),
  ('staff', 'rooms', false, true, false, false, false, false, false),
  ('staff', 'bed-spaces', false, true, false, false, false, false, false),
  ('staff', 'tenants', true, true, true, false, false, false, false),
  ('staff', 'leases', false, true, false, false, false, false, false),
  ('staff', 'invoices', false, true, false, false, false, false, false),
  ('staff', 'payments', false, true, false, false, false, false, false),
  ('staff', 'maintenance', true, true, true, false, false, false, false),
  ('staff', 'complaints', true, true, true, false, false, false, false),
  ('staff', 'documents', true, true, true, false, false, false, false),
  ('staff', 'messaging', true, true, true, false, false, false, false),
  ('staff', 'notifications', false, true, false, false, false, false, false),
  ('staff', 'notices', false, true, false, false, false, false, false),
  ('staff', 'settings', false, true, false, false, false, false, false)
ON CONFLICT (role, module_slug) DO NOTHING;

-- Link platform_modules to plan_modules for Professional & Enterprise (all modules)
INSERT INTO plan_modules (plan_id, module_id, is_included)
SELECT sp.id, pm.id, true
FROM subscription_plans sp
CROSS JOIN platform_modules pm
WHERE sp.id IN ('6dd8897d-6cef-46f9-9e5b-b2de8c56f66d', '42f8b824-3259-45b1-89f0-ab4975bee2e0')
ON CONFLICT DO NOTHING;

-- For Starter plan - core modules only
INSERT INTO plan_modules (plan_id, module_id, is_included)
SELECT sp.id, pm.id, true
FROM subscription_plans sp
CROSS JOIN platform_modules pm
WHERE sp.id = 'e7a8771c-1783-47cb-928e-2e528957a887'
  AND pm.category IN ('core', 'property', 'tenants', 'finance', 'operations', 'communication', 'system')
ON CONFLICT DO NOTHING;

-- For Free Trial - same as Professional
INSERT INTO plan_modules (plan_id, module_id, is_included)
SELECT sp.id, pm.id, true
FROM subscription_plans sp
CROSS JOIN platform_modules pm
WHERE sp.id = 'e71c2052-582f-41fb-a255-a28903e1a9e0'
ON CONFLICT DO NOTHING;

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

CREATE TABLE public.email_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  dns_records JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage email domains"
ON public.email_domains
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Leads / inquiry capture table for public booking
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  listing_type TEXT NOT NULL DEFAULT 'unit',
  listing_id UUID,
  listing_label TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  move_in_date DATE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT DEFAULT 'public_booking',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Org members can view leads
CREATE POLICY "Org members view leads" ON public.leads
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = leads.organization_id
      AND organization_members.user_id = auth.uid()
    ) OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Managers can manage leads
CREATE POLICY "Managers manage leads" ON public.leads
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = leads.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('organization_admin', 'property_owner', 'property_manager')
    ) OR has_role(auth.uid(), 'super_admin'::app_role)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = leads.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('organization_admin', 'property_owner', 'property_manager')
    ) OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Allow anonymous/public inserts for lead capture (anyone can submit an inquiry)
CREATE POLICY "Anyone can submit leads" ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- =====================================================
-- HR & PAYROLL MODULE - Core Tables
-- =====================================================

-- 1. Employees
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  employee_number TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  first_name_ar TEXT,
  last_name_ar TEXT,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT DEFAULT 'male',
  nationality TEXT,
  marital_status TEXT DEFAULT 'single',
  department TEXT,
  job_title TEXT,
  job_position TEXT,
  employment_type TEXT DEFAULT 'full_time',
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  probation_end_date DATE,
  contract_end_date DATE,
  termination_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  basic_salary NUMERIC DEFAULT 0,
  housing_allowance NUMERIC DEFAULT 0,
  transport_allowance NUMERIC DEFAULT 0,
  food_allowance NUMERIC DEFAULT 0,
  phone_allowance NUMERIC DEFAULT 0,
  other_allowances NUMERIC DEFAULT 0,
  total_salary NUMERIC GENERATED ALWAYS AS (basic_salary + housing_allowance + transport_allowance + food_allowance + phone_allowance + other_allowances) STORED,
  bank_name TEXT,
  bank_account_number TEXT,
  iban TEXT,
  routing_code TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  address TEXT,
  country TEXT DEFAULT 'UAE',
  region TEXT DEFAULT 'Dubai',
  notes TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, employee_number)
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view employees" ON public.employees
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = employees.organization_id AND organization_members.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Managers manage employees" ON public.employees
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = employees.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','property_manager')) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = employees.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','property_manager')) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 2. Employee Documents (passports, visas, emirates IDs, iqamas, contracts)
CREATE TABLE public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL, -- passport, visa, emirates_id, iqama, employment_contract, other
  document_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  issuing_authority TEXT,
  issuing_country TEXT,
  file_url TEXT,
  file_name TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, expired, renewed, cancelled
  renewal_alert_days INTEGER DEFAULT 30,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view employee docs" ON public.employee_documents
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = employee_documents.organization_id AND organization_members.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Managers manage employee docs" ON public.employee_documents
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = employee_documents.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','property_manager','staff')) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = employee_documents.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','property_manager','staff')) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 3. Attendance Logs
CREATE TABLE public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  check_in_method TEXT DEFAULT 'manual', -- biometric, manual, mobile, gps
  check_in_location JSONB,
  shift_name TEXT,
  scheduled_start TIME,
  scheduled_end TIME,
  total_hours NUMERIC,
  overtime_hours NUMERIC DEFAULT 0,
  is_late BOOLEAN DEFAULT false,
  late_minutes INTEGER DEFAULT 0,
  is_early_leave BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'present', -- present, absent, half_day, holiday, weekend
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view attendance" ON public.attendance_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = attendance_logs.organization_id AND organization_members.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Managers manage attendance" ON public.attendance_logs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = attendance_logs.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','property_manager','staff')) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = attendance_logs.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','property_manager','staff')) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 4. Leave Requests
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  leave_type TEXT NOT NULL DEFAULT 'annual', -- annual, sick, emergency, maternity, unpaid, hajj, compassionate
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days NUMERIC NOT NULL DEFAULT 1,
  reason TEXT,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, cancelled
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view leaves" ON public.leave_requests
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = leave_requests.organization_id AND organization_members.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Members manage leaves" ON public.leave_requests
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = leave_requests.organization_id AND organization_members.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = leave_requests.organization_id AND organization_members.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 5. Leave Balances
CREATE TABLE public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  leave_type TEXT NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  entitled_days NUMERIC NOT NULL DEFAULT 0,
  used_days NUMERIC NOT NULL DEFAULT 0,
  remaining_days NUMERIC GENERATED ALWAYS AS (entitled_days - used_days) STORED,
  carried_over NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, leave_type, year)
);

ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view leave balances" ON public.leave_balances
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = leave_balances.organization_id AND organization_members.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Managers manage leave balances" ON public.leave_balances
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = leave_balances.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','property_manager')) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = leave_balances.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','property_manager')) OR has_role(auth.uid(), 'super_admin'::app_role));

-- =====================================================
-- PAYROLL MODULE
-- =====================================================

-- 6. Payroll Runs
CREATE TABLE public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  payroll_month INTEGER NOT NULL,
  payroll_year INTEGER NOT NULL,
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, processing, approved, paid, cancelled
  total_basic NUMERIC DEFAULT 0,
  total_allowances NUMERIC DEFAULT 0,
  total_deductions NUMERIC DEFAULT 0,
  total_net_salary NUMERIC DEFAULT 0,
  total_employees INTEGER DEFAULT 0,
  wps_file_url TEXT,
  wps_generated_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, payroll_month, payroll_year)
);

ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view payroll runs" ON public.payroll_runs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = payroll_runs.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins manage payroll runs" ON public.payroll_runs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = payroll_runs.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = payroll_runs.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 7. Payroll Items (per employee per payroll run)
CREATE TABLE public.payroll_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID REFERENCES public.payroll_runs(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  basic_salary NUMERIC DEFAULT 0,
  housing_allowance NUMERIC DEFAULT 0,
  transport_allowance NUMERIC DEFAULT 0,
  food_allowance NUMERIC DEFAULT 0,
  phone_allowance NUMERIC DEFAULT 0,
  other_allowances NUMERIC DEFAULT 0,
  gross_salary NUMERIC DEFAULT 0,
  absence_deduction NUMERIC DEFAULT 0,
  loan_deduction NUMERIC DEFAULT 0,
  penalty_deduction NUMERIC DEFAULT 0,
  other_deductions NUMERIC DEFAULT 0,
  total_deductions NUMERIC DEFAULT 0,
  net_salary NUMERIC DEFAULT 0,
  overtime_hours NUMERIC DEFAULT 0,
  overtime_amount NUMERIC DEFAULT 0,
  working_days INTEGER DEFAULT 0,
  absent_days INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'calculated', -- calculated, approved, paid
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(payroll_run_id, employee_id)
);

ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View payroll items via run" ON public.payroll_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM payroll_runs pr JOIN organization_members om ON om.organization_id = pr.organization_id WHERE pr.id = payroll_items.payroll_run_id AND om.user_id = auth.uid() AND om.role IN ('organization_admin','property_owner','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Manage payroll items via run" ON public.payroll_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM payroll_runs pr JOIN organization_members om ON om.organization_id = pr.organization_id WHERE pr.id = payroll_items.payroll_run_id AND om.user_id = auth.uid() AND om.role IN ('organization_admin','property_owner','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM payroll_runs pr JOIN organization_members om ON om.organization_id = pr.organization_id WHERE pr.id = payroll_items.payroll_run_id AND om.user_id = auth.uid() AND om.role IN ('organization_admin','property_owner','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 8. Employee Loans
CREATE TABLE public.employee_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  loan_type TEXT DEFAULT 'salary_advance',
  loan_amount NUMERIC NOT NULL,
  monthly_deduction NUMERIC NOT NULL,
  total_paid NUMERIC DEFAULT 0,
  remaining_balance NUMERIC,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  installments_count INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, cancelled
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org view employee loans" ON public.employee_loans
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = employee_loans.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins manage employee loans" ON public.employee_loans
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = employee_loans.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = employee_loans.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role));

-- =====================================================
-- ACCOUNTING & VAT MODULE
-- =====================================================

-- 9. Chart of Accounts
CREATE TABLE public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_name_ar TEXT,
  account_type TEXT NOT NULL DEFAULT 'expense', -- asset, liability, equity, revenue, expense
  parent_account_id UUID REFERENCES public.chart_of_accounts(id),
  is_group BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  opening_balance NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'AED',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, account_code)
);

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view COA" ON public.chart_of_accounts
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = chart_of_accounts.organization_id AND organization_members.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins manage COA" ON public.chart_of_accounts
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = chart_of_accounts.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = chart_of_accounts.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 10. Expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  expense_number TEXT,
  account_id UUID REFERENCES public.chart_of_accounts(id),
  category TEXT DEFAULT 'general',
  description TEXT,
  amount NUMERIC NOT NULL,
  vat_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash',
  reference_number TEXT,
  vendor_name TEXT,
  receipt_url TEXT,
  property_id UUID REFERENCES public.properties(id),
  employee_id UUID REFERENCES public.employees(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, paid, rejected
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view expenses" ON public.expenses
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = expenses.organization_id AND organization_members.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Managers manage expenses" ON public.expenses
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = expenses.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','property_manager','accountant','staff')) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = expenses.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','property_manager','accountant','staff')) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 11. Bank Transactions (reconciliation)
CREATE TABLE public.bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.chart_of_accounts(id),
  transaction_date DATE NOT NULL,
  description TEXT,
  reference TEXT,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  balance NUMERIC DEFAULT 0,
  bank_name TEXT,
  is_reconciled BOOLEAN DEFAULT false,
  reconciled_with TEXT, -- invoice_id, expense_id, payment_id
  reconciled_at TIMESTAMPTZ,
  source TEXT DEFAULT 'manual', -- manual, import, api
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org view bank txns" ON public.bank_transactions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = bank_transactions.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins manage bank txns" ON public.bank_transactions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = bank_transactions.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = bank_transactions.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 12. VAT Records
CREATE TABLE public.vat_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  record_type TEXT NOT NULL DEFAULT 'output', -- input (purchases), output (sales)
  related_type TEXT, -- invoice, expense, payment
  related_id UUID,
  invoice_number TEXT,
  vendor_customer_name TEXT,
  trn_number TEXT, -- Tax Registration Number
  taxable_amount NUMERIC NOT NULL DEFAULT 0,
  vat_rate NUMERIC NOT NULL DEFAULT 5,
  vat_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_month INTEGER,
  period_year INTEGER,
  status TEXT NOT NULL DEFAULT 'active', -- active, void, adjusted
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vat_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org view vat records" ON public.vat_records
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = vat_records.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins manage vat records" ON public.vat_records
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = vat_records.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = vat_records.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role IN ('organization_admin','property_owner','accountant')) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 13. Expense Claims (employee-initiated)
CREATE TABLE public.expense_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  claim_number TEXT,
  description TEXT,
  amount NUMERIC NOT NULL,
  category TEXT DEFAULT 'general',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, paid
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view claims" ON public.expense_claims
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = expense_claims.organization_id AND organization_members.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Members manage claims" ON public.expense_claims
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = expense_claims.organization_id AND organization_members.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = expense_claims.organization_id AND organization_members.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));
-- Phase 4: HR & Accounting Tables
-- Add missing tables required for Phase 2/4 modules

-- 1. Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT,
    email TEXT,
    phone TEXT,
    join_date DATE,
    contract_end_date DATE,
    basic_salary NUMERIC(10, 2) DEFAULT 0,
    housing_allowance NUMERIC(10, 2) DEFAULT 0,
    transport_allowance NUMERIC(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status TEXT DEFAULT 'present',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Leave Requests Table
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Payroll Runs Table
CREATE TABLE IF NOT EXISTS public.payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_amount NUMERIC(12, 2) DEFAULT 0,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Payslips Table
CREATE TABLE IF NOT EXISTS public.payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    basic_salary NUMERIC(10, 2) DEFAULT 0,
    total_allowances NUMERIC(10, 2) DEFAULT 0,
    deductions NUMERIC(10, 2) DEFAULT 0,
    net_salary NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Employees
CREATE POLICY "Users can view employees in their organization"
    ON public.employees FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert employees in their organization"
    ON public.employees FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update employees in their organization"
    ON public.employees FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete employees in their organization"
    ON public.employees FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

-- Attendance
CREATE POLICY "Users can view attendance in their organization"
    ON public.attendance FOR SELECT
    USING (employee_id IN (
        SELECT id FROM public.employees WHERE organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can manage attendance in their organization"
    ON public.attendance FOR ALL
    USING (employee_id IN (
        SELECT id FROM public.employees WHERE organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    ));

-- Leave Requests
CREATE POLICY "Users can view leave_requests in their organization"
    ON public.leave_requests FOR SELECT
    USING (employee_id IN (
        SELECT id FROM public.employees WHERE organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can manage leave_requests in their organization"
    ON public.leave_requests FOR ALL
    USING (employee_id IN (
        SELECT id FROM public.employees WHERE organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    ));

-- Payroll Runs
CREATE POLICY "Users can view payroll_runs in their organization"
    ON public.payroll_runs FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can manage payroll_runs in their organization"
    ON public.payroll_runs FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

-- Payslips
CREATE POLICY "Users can view payslips in their organization"
    ON public.payslips FOR SELECT
    USING (payroll_run_id IN (
        SELECT id FROM public.payroll_runs WHERE organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can manage payslips in their organization"
    ON public.payslips FOR ALL
    USING (payroll_run_id IN (
        SELECT id FROM public.payroll_runs WHERE organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    ));

-- Audit Log Triggers
CREATE TRIGGER audit_employees AFTER INSERT OR UPDATE OR DELETE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.trg_audit_log();
CREATE TRIGGER audit_attendance AFTER INSERT OR UPDATE OR DELETE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.trg_audit_log();
CREATE TRIGGER audit_leave_requests AFTER INSERT OR UPDATE OR DELETE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.trg_audit_log();
CREATE TRIGGER audit_payroll_runs AFTER INSERT OR UPDATE OR DELETE ON public.payroll_runs FOR EACH ROW EXECUTE FUNCTION public.trg_audit_log();
CREATE TRIGGER audit_payslips AFTER INSERT OR UPDATE OR DELETE ON public.payslips FOR EACH ROW EXECUTE FUNCTION public.trg_audit_log();

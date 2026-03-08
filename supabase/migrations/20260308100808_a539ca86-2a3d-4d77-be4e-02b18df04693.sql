
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

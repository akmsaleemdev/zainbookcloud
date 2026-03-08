
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


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

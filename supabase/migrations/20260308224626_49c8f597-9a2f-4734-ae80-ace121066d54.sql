
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

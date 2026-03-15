-- Platform admin (Master Admin) access for all remaining app tables.
-- Run after 20260316000000_master_admin_full_access_fix.sql
-- Ensures every module works for Master Admin: HR, Utilities, Cheques, Leads, Rent schedules,
-- Property images, Tenant family, Parking, Visitors, Access cards, Inspections, Service charges, Billing.

-- property_images (child of properties)
DROP POLICY IF EXISTS "Platform admins property_images" ON public.property_images;
CREATE POLICY "Platform admins property_images" ON public.property_images
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

-- tenant_family_members (child of tenants)
DROP POLICY IF EXISTS "Platform admins tenant_family_members" ON public.tenant_family_members;
CREATE POLICY "Platform admins tenant_family_members" ON public.tenant_family_members
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

-- cheque_tracking (org-scoped)
DROP POLICY IF EXISTS "Platform admins cheque_tracking" ON public.cheque_tracking;
CREATE POLICY "Platform admins cheque_tracking" ON public.cheque_tracking
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

-- leads (org-scoped)
DROP POLICY IF EXISTS "Platform admins leads" ON public.leads;
CREATE POLICY "Platform admins leads" ON public.leads
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

-- rent_schedules (via lease -> org)
DROP POLICY IF EXISTS "Platform admins rent_schedules" ON public.rent_schedules;
CREATE POLICY "Platform admins rent_schedules" ON public.rent_schedules
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

-- utility_meters (org-scoped)
DROP POLICY IF EXISTS "Platform admins utility_meters" ON public.utility_meters;
CREATE POLICY "Platform admins utility_meters" ON public.utility_meters
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

-- utility_readings (child of utility_meters)
DROP POLICY IF EXISTS "Platform admins utility_readings" ON public.utility_readings;
CREATE POLICY "Platform admins utility_readings" ON public.utility_readings
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

-- billing_history (org-scoped)
DROP POLICY IF EXISTS "Platform admins billing_history" ON public.billing_history;
CREATE POLICY "Platform admins billing_history" ON public.billing_history
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

-- HR: employees
DROP POLICY IF EXISTS "Platform admins employees" ON public.employees;
CREATE POLICY "Platform admins employees" ON public.employees
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

-- employee_documents
DROP POLICY IF EXISTS "Platform admins employee_documents" ON public.employee_documents;
CREATE POLICY "Platform admins employee_documents" ON public.employee_documents
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

-- attendance_logs
DROP POLICY IF EXISTS "Platform admins attendance_logs" ON public.attendance_logs;
CREATE POLICY "Platform admins attendance_logs" ON public.attendance_logs
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

-- leave_requests
DROP POLICY IF EXISTS "Platform admins leave_requests" ON public.leave_requests;
CREATE POLICY "Platform admins leave_requests" ON public.leave_requests
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

-- leave_balances
DROP POLICY IF EXISTS "Platform admins leave_balances" ON public.leave_balances;
CREATE POLICY "Platform admins leave_balances" ON public.leave_balances
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

-- payroll_runs
DROP POLICY IF EXISTS "Platform admins payroll_runs" ON public.payroll_runs;
CREATE POLICY "Platform admins payroll_runs" ON public.payroll_runs
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

-- payroll_items
DROP POLICY IF EXISTS "Platform admins payroll_items" ON public.payroll_items;
CREATE POLICY "Platform admins payroll_items" ON public.payroll_items
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

-- UAE / property-scoped
DROP POLICY IF EXISTS "Platform admins parking_spaces" ON public.parking_spaces;
CREATE POLICY "Platform admins parking_spaces" ON public.parking_spaces
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Platform admins visitor_logs" ON public.visitor_logs;
CREATE POLICY "Platform admins visitor_logs" ON public.visitor_logs
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Platform admins access_cards" ON public.access_cards;
CREATE POLICY "Platform admins access_cards" ON public.access_cards
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Platform admins building_inspections" ON public.building_inspections;
CREATE POLICY "Platform admins building_inspections" ON public.building_inspections
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Platform admins service_charges" ON public.service_charges;
CREATE POLICY "Platform admins service_charges" ON public.service_charges
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

-- Accounting & VAT
DROP POLICY IF EXISTS "Platform admins chart_of_accounts" ON public.chart_of_accounts;
CREATE POLICY "Platform admins chart_of_accounts" ON public.chart_of_accounts
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Platform admins expenses" ON public.expenses;
CREATE POLICY "Platform admins expenses" ON public.expenses
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Platform admins bank_transactions" ON public.bank_transactions;
CREATE POLICY "Platform admins bank_transactions" ON public.bank_transactions
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Platform admins vat_records" ON public.vat_records;
CREATE POLICY "Platform admins vat_records" ON public.vat_records
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

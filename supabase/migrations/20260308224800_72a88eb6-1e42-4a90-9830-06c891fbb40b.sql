
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

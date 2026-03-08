
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

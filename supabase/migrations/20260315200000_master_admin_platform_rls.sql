-- Master Admin full platform access: allow master_admin role same RLS as super_admin.
-- Uses is_platform_admin(auth.uid()) which returns true for super_admin OR master_admin.
-- Run after 20260315000000_add_master_admin_role.sql (which creates is_platform_admin).

-- subscription_plans
DROP POLICY IF EXISTS "Admins manage plans" ON public.subscription_plans;
CREATE POLICY "Admins manage plans" ON public.subscription_plans
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- platform_modules
DROP POLICY IF EXISTS "Admins manage modules" ON public.platform_modules;
CREATE POLICY "Admins manage modules" ON public.platform_modules
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- plan_modules
DROP POLICY IF EXISTS "Admins manage plan_modules" ON public.plan_modules;
CREATE POLICY "Admins manage plan_modules" ON public.plan_modules
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- customer_subscriptions: view (org members OR platform admin), manage (platform admin)
DROP POLICY IF EXISTS "Org members view sub" ON public.customer_subscriptions;
CREATE POLICY "Org members view sub" ON public.customer_subscriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = customer_subscriptions.organization_id AND user_id = auth.uid())
    OR public.is_platform_admin(auth.uid())
  );
DROP POLICY IF EXISTS "Admins manage subs" ON public.customer_subscriptions;
CREATE POLICY "Admins manage subs" ON public.customer_subscriptions
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- subscription_modules
DROP POLICY IF EXISTS "Org members view sub_modules" ON public.subscription_modules;
CREATE POLICY "Org members view sub_modules" ON public.subscription_modules
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM customer_subscriptions cs JOIN organization_members om ON om.organization_id = cs.organization_id WHERE cs.id = subscription_modules.subscription_id AND om.user_id = auth.uid())
    OR public.is_platform_admin(auth.uid())
  );
DROP POLICY IF EXISTS "Admins manage sub_modules" ON public.subscription_modules;
CREATE POLICY "Admins manage sub_modules" ON public.subscription_modules
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- support_tickets
DROP POLICY IF EXISTS "Users view own tickets" ON public.support_tickets;
CREATE POLICY "Users view own tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "Users update own tickets" ON public.support_tickets;
CREATE POLICY "Users update own tickets" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins delete tickets" ON public.support_tickets;
CREATE POLICY "Admins delete tickets" ON public.support_tickets
  FOR DELETE TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- ticket_messages
DROP POLICY IF EXISTS "View ticket msgs" ON public.ticket_messages;
CREATE POLICY "View ticket msgs" ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_messages.ticket_id AND (created_by = auth.uid() OR public.is_platform_admin(auth.uid()))));
DROP POLICY IF EXISTS "Insert ticket msgs" ON public.ticket_messages;
CREATE POLICY "Insert ticket msgs" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_messages.ticket_id AND (created_by = auth.uid() OR public.is_platform_admin(auth.uid()))));

-- payment_gateway_configs
DROP POLICY IF EXISTS "Super admins manage payment gateways" ON public.payment_gateway_configs;
CREATE POLICY "Super admins manage payment gateways" ON public.payment_gateway_configs
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- ai_chat_sessions (view: own or platform admin)
DROP POLICY IF EXISTS "Users own chat sessions" ON public.ai_chat_sessions;
CREATE POLICY "Users own chat sessions" ON public.ai_chat_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

-- ai_chat_messages (view: session owner or platform admin)
DROP POLICY IF EXISTS "Users view chat msgs" ON public.ai_chat_messages;
CREATE POLICY "Users view chat msgs" ON public.ai_chat_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM ai_chat_sessions WHERE id = ai_chat_messages.session_id AND (user_id = auth.uid() OR public.is_platform_admin(auth.uid()))));

-- erp_connections (view and manage: org admin or platform admin)
DROP POLICY IF EXISTS "Org members view erp" ON public.erp_connections;
CREATE POLICY "Org members view erp" ON public.erp_connections
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = erp_connections.organization_id AND user_id = auth.uid()) OR public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "Org admins manage erp" ON public.erp_connections;
CREATE POLICY "Org admins manage erp" ON public.erp_connections
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = erp_connections.organization_id AND user_id = auth.uid() AND role = 'organization_admin') OR public.is_platform_admin(auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = erp_connections.organization_id AND user_id = auth.uid() AND role = 'organization_admin') OR public.is_platform_admin(auth.uid()));

-- erp_sync_logs
DROP POLICY IF EXISTS "View sync logs" ON public.erp_sync_logs;
CREATE POLICY "View sync logs" ON public.erp_sync_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM erp_connections ec JOIN organization_members om ON om.organization_id = ec.organization_id WHERE ec.id = erp_sync_logs.connection_id AND om.user_id = auth.uid()) OR public.is_platform_admin(auth.uid()));

-- organization_members: platform admins can view all (for User Management / tenant listing)
DROP POLICY IF EXISTS "Members can view org members" ON public.organization_members;
CREATE POLICY "Members can view org members" ON public.organization_members
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

-- Platform admins full access to org-scoped tables (bypass tenant restriction for Master Admin)
-- These policies OR with existing org-member policies so platform admins see and manage all data.
DROP POLICY IF EXISTS "Platform admins properties" ON public.properties;
CREATE POLICY "Platform admins properties" ON public.properties FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "Platform admins tenants" ON public.tenants;
CREATE POLICY "Platform admins tenants" ON public.tenants FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "Platform admins leases" ON public.leases;
CREATE POLICY "Platform admins leases" ON public.leases FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "Platform admins invoices" ON public.invoices;
CREATE POLICY "Platform admins invoices" ON public.invoices FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "Platform admins payments" ON public.payments;
CREATE POLICY "Platform admins payments" ON public.payments FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "Platform admins maintenance" ON public.maintenance_requests;
CREATE POLICY "Platform admins maintenance" ON public.maintenance_requests FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "Platform admins audit_logs" ON public.audit_logs;
CREATE POLICY "Platform admins audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));

-- Child/related tables so Master Admin can access full hierarchy
DROP POLICY IF EXISTS "Platform admins buildings" ON public.buildings;
CREATE POLICY "Platform admins buildings" ON public.buildings FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "Platform admins units" ON public.units;
CREATE POLICY "Platform admins units" ON public.units FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "Platform admins rooms" ON public.rooms;
CREATE POLICY "Platform admins rooms" ON public.rooms FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "Platform admins bed_spaces" ON public.bed_spaces;
CREATE POLICY "Platform admins bed_spaces" ON public.bed_spaces FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "Platform admins amenities" ON public.amenities;
CREATE POLICY "Platform admins amenities" ON public.amenities FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "Platform admins documents" ON public.documents;
CREATE POLICY "Platform admins documents" ON public.documents FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "Platform admins messages" ON public.messages;
CREATE POLICY "Platform admins messages" ON public.messages FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "Platform admins notifications" ON public.notifications;
CREATE POLICY "Platform admins notifications" ON public.notifications FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

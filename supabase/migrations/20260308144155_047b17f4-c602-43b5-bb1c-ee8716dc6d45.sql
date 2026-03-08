
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

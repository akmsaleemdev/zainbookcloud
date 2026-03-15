-- Automation: workflows table for WorkflowBuilder persistence
CREATE TABLE public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  nodes JSONB NOT NULL DEFAULT '[]',
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflows_organization_id ON public.workflows(organization_id);

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view workflows"
  ON public.workflows FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = workflows.organization_id
        AND organization_members.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Org members manage workflows"
  ON public.workflows FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = workflows.organization_id
        AND organization_members.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = workflows.organization_id
        AND organization_members.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Platform admins manage workflows"
  ON public.workflows FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'platform_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'platform_admin'::app_role));

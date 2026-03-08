
-- Fix broken org SELECT policy (was referencing organization_members.id instead of organizations.id)
DROP POLICY IF EXISTS "Org members can view their org" ON public.organizations;
CREATE POLICY "Org members can view their org" ON public.organizations
  FOR SELECT USING (
    (EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
    )) OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Allow users to also view org they just created (before membership is added)
DROP POLICY IF EXISTS "Creator can view own org" ON public.organizations;
CREATE POLICY "Creator can view own org" ON public.organizations
  FOR SELECT USING (created_by = auth.uid());

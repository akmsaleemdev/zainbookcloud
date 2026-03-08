CREATE TABLE public.billing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.customer_subscriptions(id) ON DELETE SET NULL,
  action text NOT NULL DEFAULT 'payment',
  plan_name text,
  amount numeric DEFAULT 0,
  currency text DEFAULT 'AED',
  billing_cycle text,
  description text,
  invoice_number text,
  status text DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view billing history"
  ON public.billing_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = billing_history.organization_id
        AND organization_members.user_id = auth.uid()
    ) OR has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "System insert billing history"
  ON public.billing_history FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = billing_history.organization_id
        AND organization_members.user_id = auth.uid()
    ) OR has_role(auth.uid(), 'super_admin'::app_role)
  );
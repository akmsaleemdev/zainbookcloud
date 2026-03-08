
-- Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  recipient_id UUID,
  subject TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal',
  channel TEXT DEFAULT 'internal',
  related_type TEXT,
  related_id UUID,
  parent_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'info',
  category TEXT DEFAULT 'system',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  related_type TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Messages RLS
CREATE POLICY "Org members can view messages" ON public.messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = messages.organization_id AND organization_members.user_id = auth.uid())
    OR has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Org members can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = messages.organization_id AND organization_members.user_id = auth.uid())
    OR has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Sender can update messages" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Sender can delete messages" ON public.messages
  FOR DELETE USING (sender_id = auth.uid() OR has_role(auth.uid(), 'super_admin'));

-- Notifications RLS
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = notifications.organization_id AND organization_members.user_id = auth.uid())
    OR has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

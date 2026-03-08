import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Send, Users, Bell } from "lucide-react";

interface BulkNotificationSenderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BulkNotificationSender = ({ open, onOpenChange }: BulkNotificationSenderProps) => {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    body: "",
    type: "info",
    category: "announcement",
    target: "all_members",
  });

  const sendBulkMutation = useMutation({
    mutationFn: async () => {
      if (!currentOrg || !user) throw new Error("Missing context");

      // Get target users
      const { data: members } = await supabase
        .from("organization_members")
        .select("user_id, role")
        .eq("organization_id", currentOrg.id)
        .eq("is_active", true);

      if (!members?.length) throw new Error("No members found");

      let targetUserIds = members.map((m) => m.user_id);

      if (form.target === "admins_only") {
        targetUserIds = members
          .filter((m) => m.role === "organization_admin" || m.role === "property_owner")
          .map((m) => m.user_id);
      } else if (form.target === "staff_only") {
        targetUserIds = members
          .filter((m) => m.role === "staff" || m.role === "property_manager" || m.role === "maintenance_staff")
          .map((m) => m.user_id);
      }

      // Insert notifications for all target users
      const notifications = targetUserIds.map((userId) => ({
        user_id: userId,
        organization_id: currentOrg.id,
        title: form.title,
        body: form.body,
        type: form.type,
        category: form.category,
        is_read: false,
      }));

      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;

      return targetUserIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      onOpenChange(false);
      setForm({ title: "", body: "", type: "info", category: "announcement", target: "all_members" });
      toast({ title: "Notifications sent", description: `Sent to ${count} users` });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> Send Bulk Notification</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notification title" />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Notification message..." rows={3} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Target</Label>
              <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_members">All Members</SelectItem>
                  <SelectItem value="admins_only">Admins Only</SelectItem>
                  <SelectItem value="staff_only">Staff Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => sendBulkMutation.mutate()} disabled={!form.title || sendBulkMutation.isPending} className="gap-2">
            <Send className="w-4 h-4" /> Send to All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

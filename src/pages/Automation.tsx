import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zap, Plus, Search, Trash2, Clock, Bell, Mail, CalendarClock, FileWarning } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";

const TRIGGER_TYPES = [
  { value: "lease_expiry", label: "Lease Expiry Reminder", icon: CalendarClock },
  { value: "rent_due", label: "Rent Due Date", icon: Clock },
  { value: "maintenance_overdue", label: "Maintenance Overdue", icon: FileWarning },
  { value: "document_expiry", label: "Document Expiry", icon: FileWarning },
  { value: "schedule", label: "Scheduled (Daily/Weekly)", icon: CalendarClock },
];

const ACTION_TYPES = [
  { value: "notification", label: "Send Notification" },
  { value: "email", label: "Send Email" },
  { value: "status_update", label: "Update Status" },
  { value: "create_invoice", label: "Create Invoice" },
];

const FREQUENCIES = ["daily", "weekly", "monthly", "on_event"];

const Automation = () => {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", trigger_type: "lease_expiry", action_type: "notification",
    is_active: true, frequency: "daily", days_before: "7", message: "",
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["automation-rules", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data, error } = await supabase
        .from("automation_rules")
        .select("*")
        .eq("organization_id", currentOrg.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const createMutation = useMutation({
    mutationFn: async (f: typeof form) => {
      const { error } = await supabase.from("automation_rules").insert({
        organization_id: currentOrg!.id,
        name: f.name,
        description: f.description || null,
        trigger_type: f.trigger_type,
        action_type: f.action_type,
        is_active: f.is_active,
        trigger_config: { frequency: f.frequency, days_before: parseInt(f.days_before) || 7 } as any,
        action_config: { message: f.message } as any,
        created_by: user!.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["automation-rules"] }); toast.success("Rule created"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: typeof form }) => {
      const { error } = await supabase.from("automation_rules").update({
        name: f.name,
        description: f.description || null,
        trigger_type: f.trigger_type,
        action_type: f.action_type,
        is_active: f.is_active,
        trigger_config: { frequency: f.frequency, days_before: parseInt(f.days_before) || 7 } as any,
        action_config: { message: f.message } as any,
      } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["automation-rules"] }); toast.success("Rule updated"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("automation_rules").update({ is_active: active } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["automation-rules"] }); toast.success("Rule toggled"); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("automation_rules").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["automation-rules"] }); toast.success("Rule deleted"); setDeleteId(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const emptyForm = { name: "", description: "", trigger_type: "lease_expiry", action_type: "notification", is_active: true, frequency: "daily", days_before: "7", message: "" };
  const openCreate = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (r: any) => {
    const tc = r.trigger_config || {};
    const ac = r.action_config || {};
    setForm({
      name: r.name, description: r.description || "", trigger_type: r.trigger_type, action_type: r.action_type,
      is_active: r.is_active, frequency: tc.frequency || "daily", days_before: String(tc.days_before || 7), message: ac.message || "",
    });
    setEditingId(r.id); setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error("Rule name is required"); return; }
    if (editingId) {
      updateMutation.mutate({ id: editingId, f: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filtered = rules.filter((r: any) => r.name.toLowerCase().includes(search.toLowerCase()));

  const getTriggerIcon = (type: string) => {
    const t = TRIGGER_TYPES.find((tt) => tt.value === type);
    return t ? t.icon : Zap;
  };

  const getActionIcon = (type: string) => {
    if (type === "email") return Mail;
    if (type === "notification") return Bell;
    return Zap;
  };

  if (!currentOrg) return <AppLayout><div className="glass-card p-12 text-center"><p className="text-muted-foreground">Please create an organization first.</p></div></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Automation</h1>
            <p className="text-sm text-muted-foreground mt-1">Create rules to automate reminders and notifications</p>
          </div>
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Create Rule</Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search rules..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{rules.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Rules</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">{rules.filter((r: any) => r.is_active).length}</p>
            <p className="text-xs text-muted-foreground mt-1">Active</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{rules.filter((r: any) => !r.is_active).length}</p>
            <p className="text-xs text-muted-foreground mt-1">Paused</p>
          </div>
        </div>

        {isLoading ? (
          <div className="glass-card p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No automation rules yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r: any) => {
              const TriggerIcon = getTriggerIcon(r.trigger_type);
              const ActionIcon = getActionIcon(r.action_type);
              return (
                <div key={r.id} className="glass-card p-4 flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors" onClick={() => openEdit(r)}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${r.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <TriggerIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{r.name}</span>
                        {r.description && <span className="text-xs text-muted-foreground">— {r.description}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] capitalize gap-1"><TriggerIcon className="w-3 h-3" />{(r.trigger_type || "").replace("_", " ")}</Badge>
                        <span className="text-xs text-muted-foreground">→</span>
                        <Badge variant="outline" className="text-[10px] capitalize gap-1"><ActionIcon className="w-3 h-3" />{(r.action_type || "").replace("_", " ")}</Badge>
                        {r.run_count > 0 && <span className="text-xs text-muted-foreground">• Ran {r.run_count}x</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={r.is_active} onCheckedChange={(v) => { toggleMutation.mutate({ id: r.id, active: v }); }} onClick={(e) => e.stopPropagation()} />
                    <Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Active" : "Paused"}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Rule" : "Create Rule"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Rule Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Lease Expiry Reminder" required /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trigger</Label>
                <Select value={form.trigger_type} onValueChange={(v) => setForm({ ...form, trigger_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TRIGGER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Action</Label>
                <Select value={form.action_type} onValueChange={(v) => setForm({ ...form, action_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ACTION_TYPES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FREQUENCIES.map((f) => <SelectItem key={f} value={f} className="capitalize">{f.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Days Before Event</Label>
                <Input type="number" value={form.days_before} onChange={(e) => setForm({ ...form, days_before: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message Template</Label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} placeholder="Your lease for {unit} expires in {days} days..." />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit">{editingId ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader><AlertDialogTitle>Delete Rule?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Automation;

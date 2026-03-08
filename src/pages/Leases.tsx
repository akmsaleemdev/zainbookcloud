import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Plus, Search, Pencil, Trash2, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

const Leases = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    tenant_id: "", unit_id: "", lease_type: "fixed", start_date: "", end_date: "",
    monthly_rent: "", security_deposit: "0", payment_frequency: "monthly", ejari_number: "",
    late_fee_rate: "0", grace_period_days: "5", rent_due_day: "1", renewal_reminder_days: "30",
  });
  const [search, setSearch] = useState("");

  const { data: tenantsList = [] } = useQuery({
    queryKey: ["tenants-list", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase.from("tenants").select("id, full_name").eq("organization_id", currentOrg.id).order("full_name");
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const { data: unitsList = [] } = useQuery({
    queryKey: ["units-for-lease", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data: props } = await supabase.from("properties").select("id").eq("organization_id", currentOrg.id);
      if (!props?.length) return [];
      const { data: blds } = await supabase.from("buildings").select("id").in("property_id", props.map((p: any) => p.id));
      if (!blds?.length) return [];
      const { data } = await supabase.from("units").select("id, unit_number, buildings(name)").in("building_id", blds.map((b: any) => b.id)).order("unit_number");
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const { data: leases = [], isLoading } = useQuery({
    queryKey: ["leases", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data, error } = await supabase.from("leases").select("*, tenants(full_name), units(unit_number, buildings(name))").eq("organization_id", currentOrg.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const createMutation = useMutation({
    mutationFn: async (f: typeof form) => {
      const { error } = await supabase.from("leases").insert({
        organization_id: currentOrg!.id, tenant_id: f.tenant_id, unit_id: f.unit_id || null,
        lease_type: f.lease_type, start_date: f.start_date, end_date: f.end_date,
        monthly_rent: parseFloat(f.monthly_rent), security_deposit: parseFloat(f.security_deposit) || 0,
        payment_frequency: f.payment_frequency, ejari_number: f.ejari_number || null,
        late_fee_rate: parseFloat(f.late_fee_rate) || 0, grace_period_days: parseInt(f.grace_period_days) || 5,
        rent_due_day: parseInt(f.rent_due_day) || 1, renewal_reminder_days: parseInt(f.renewal_reminder_days) || 30,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["leases"] }); toast.success("Lease created"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: typeof form }) => {
      const { error } = await supabase.from("leases").update({
        tenant_id: f.tenant_id, unit_id: f.unit_id || null, lease_type: f.lease_type,
        start_date: f.start_date, end_date: f.end_date, monthly_rent: parseFloat(f.monthly_rent),
        security_deposit: parseFloat(f.security_deposit) || 0, payment_frequency: f.payment_frequency,
        ejari_number: f.ejari_number || null,
        late_fee_rate: parseFloat(f.late_fee_rate) || 0, grace_period_days: parseInt(f.grace_period_days) || 5,
        rent_due_day: parseInt(f.rent_due_day) || 1, renewal_reminder_days: parseInt(f.renewal_reminder_days) || 30,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["leases"] }); toast.success("Lease updated"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("leases").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["leases"] }); toast.success("Lease deleted"); setDeleteId(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const emptyForm = { tenant_id: "", unit_id: "", lease_type: "fixed", start_date: "", end_date: "", monthly_rent: "", security_deposit: "0", payment_frequency: "monthly", ejari_number: "", late_fee_rate: "0", grace_period_days: "5", rent_due_day: "1", renewal_reminder_days: "30" };
  const openCreate = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (l: any) => {
    setForm({ tenant_id: l.tenant_id, unit_id: l.unit_id || "", lease_type: l.lease_type, start_date: l.start_date, end_date: l.end_date, monthly_rent: String(l.monthly_rent), security_deposit: String(l.security_deposit || 0), payment_frequency: l.payment_frequency, ejari_number: l.ejari_number || "", late_fee_rate: String(l.late_fee_rate || 0), grace_period_days: String(l.grace_period_days || 5), rent_due_day: String(l.rent_due_day || 1), renewal_reminder_days: String(l.renewal_reminder_days || 30) });
    setEditingId(l.id); setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!form.tenant_id || !form.start_date || !form.end_date || !form.monthly_rent) { toast.error("Fill required fields"); return; } editingId ? updateMutation.mutate({ id: editingId, f: form }) : createMutation.mutate(form); };

  const filtered = leases.filter((l: any) => (l.tenants?.full_name || "").toLowerCase().includes(search.toLowerCase()) || (l.ejari_number || "").includes(search));
  if (!currentOrg) return <AppLayout><div className="glass-card p-12 text-center"><p className="text-muted-foreground">Please create an organization first.</p></div></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="page-header">Leases</h1><p className="text-sm text-muted-foreground mt-1">Manage lease contracts</p></div>
          <Button onClick={openCreate} className="gap-2" disabled={tenantsList.length === 0}><Plus className="w-4 h-4" /> Add Lease</Button>
        </div>
        <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search leases..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" /></div>

        {isLoading ? <div className="glass-card p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div> :
        filtered.length === 0 ? <div className="glass-card p-12 text-center"><p className="text-muted-foreground">No leases yet.</p></div> :
        <div className="glass-card overflow-hidden overflow-x-auto">
          <table className="w-full"><thead><tr className="border-b border-border/30">
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Tenant</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Unit</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Period</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Rent</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Ejari</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4"></th>
          </tr></thead><tbody>
            {filtered.map((l: any) => (
              <tr key={l.id} className="border-b border-border/20 hover:bg-accent/30">
                <td className="p-4 font-medium text-sm text-foreground">{l.tenants?.full_name}</td>
                <td className="p-4 text-sm text-muted-foreground">{l.units ? `${l.units.unit_number} - ${l.units.buildings?.name}` : "-"}</td>
                <td className="p-4 text-sm text-muted-foreground"><div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}</div></td>
                <td className="p-4 text-sm font-medium text-foreground">AED {Number(l.monthly_rent).toLocaleString()}</td>
                <td className="p-4 text-sm text-muted-foreground font-mono">{l.ejari_number || "-"}</td>
                <td className="p-4"><Badge variant={l.status === "active" ? "default" : l.status === "expired" ? "destructive" : "secondary"}>{l.status}</Badge></td>
                <td className="p-4"><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(l)}><Pencil className="w-3 h-3" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => setDeleteId(l.id)}><Trash2 className="w-3 h-3" /></Button></div></td>
              </tr>
            ))}
          </tbody></table>
        </div>}
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Lease" : "Create Lease"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tenant *</Label><Select value={form.tenant_id} onValueChange={(v) => setForm({ ...form, tenant_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{tenantsList.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Unit</Label><Select value={form.unit_id} onValueChange={(v) => setForm({ ...form, unit_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{unitsList.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.unit_number} - {u.buildings?.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date *</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required /></div>
              <div className="space-y-2"><Label>End Date *</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Monthly Rent (AED) *</Label><Input type="number" value={form.monthly_rent} onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Security Deposit</Label><Input type="number" value={form.security_deposit} onChange={(e) => setForm({ ...form, security_deposit: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Payment Frequency</Label><Select value={form.payment_frequency} onValueChange={(v) => setForm({ ...form, payment_frequency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="semi_annual">Semi-Annual</SelectItem><SelectItem value="annual">Annual</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Ejari Number</Label><Input value={form.ejari_number} onChange={(e) => setForm({ ...form, ejari_number: e.target.value })} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button><Button type="submit">{editingId ? "Update" : "Create"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border"><AlertDialogHeader><AlertDialogTitle>Delete Lease?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Leases;

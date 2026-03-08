import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Plus, Search, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const PAYMENT_METHODS = ["bank_transfer", "cash", "cheque", "credit_card", "online"];

const Payments = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ tenant_id: "", invoice_id: "", amount: "", payment_method: "bank_transfer", reference_number: "", payment_date: new Date().toISOString().split("T")[0], notes: "" });
  const [search, setSearch] = useState("");

  const { data: tenantsList = [] } = useQuery({
    queryKey: ["tenants-pay", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase.from("tenants").select("id, full_name").eq("organization_id", currentOrg.id).order("full_name");
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const { data: invoicesList = [] } = useQuery({
    queryKey: ["invoices-pay", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase.from("invoices").select("id, invoice_number, total_amount, tenants(full_name)").eq("organization_id", currentOrg.id).in("status", ["pending", "overdue"]);
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data, error } = await supabase.from("payments").select("*, tenants(full_name), invoices(invoice_number)").eq("organization_id", currentOrg.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const createMutation = useMutation({
    mutationFn: async (f: typeof form) => {
      const { error } = await supabase.from("payments").insert({
        organization_id: currentOrg!.id, tenant_id: f.tenant_id, invoice_id: f.invoice_id || null,
        amount: parseFloat(f.amount), payment_method: f.payment_method,
        reference_number: f.reference_number || null, payment_date: f.payment_date, notes: f.notes || null,
      });
      if (error) throw error;

      // Auto-mark invoice as paid if linked
      if (f.invoice_id) {
        await supabase.from("invoices").update({ status: "paid" }).eq("id", f.invoice_id);
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["payments"] }); queryClient.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Payment recorded"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("payments").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["payments"] }); toast.success("Payment deleted"); setDeleteId(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const emptyForm = { tenant_id: "", invoice_id: "", amount: "", payment_method: "bank_transfer", reference_number: "", payment_date: new Date().toISOString().split("T")[0], notes: "" };
  const openCreate = () => { setForm(emptyForm); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!form.tenant_id || !form.amount) { toast.error("Tenant and amount required"); return; } createMutation.mutate(form); };

  // Auto-fill amount from invoice
  const handleInvoiceSelect = (invoiceId: string) => {
    const inv = invoicesList.find((i: any) => i.id === invoiceId);
    if (inv) {
      setForm({ ...form, invoice_id: invoiceId, tenant_id: (inv as any).tenant_id || form.tenant_id, amount: String(inv.total_amount) });
    }
  };

  const filtered = payments.filter((p: any) => (p.tenants?.full_name || "").toLowerCase().includes(search.toLowerCase()) || (p.reference_number || "").includes(search));
  if (!currentOrg) return <AppLayout><div className="glass-card p-12 text-center"><p className="text-muted-foreground">Please create an organization first.</p></div></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="page-header">Payments</h1><p className="text-sm text-muted-foreground mt-1">Record and track payments</p></div>
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Record Payment</Button>
        </div>
        <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search payments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" /></div>

        {isLoading ? <div className="glass-card p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div> :
        filtered.length === 0 ? <div className="glass-card p-12 text-center"><CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No payments recorded.</p></div> :
        <div className="glass-card overflow-hidden overflow-x-auto">
          <table className="w-full"><thead><tr className="border-b border-border/30">
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Tenant</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Invoice</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Amount</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Method</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Reference</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Date</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4"></th>
          </tr></thead><tbody>
            {filtered.map((p: any) => (
              <tr key={p.id} className="border-b border-border/20 hover:bg-accent/30">
                <td className="p-4 text-sm text-foreground">{p.tenants?.full_name}</td>
                <td className="p-4 text-sm text-muted-foreground font-mono">{p.invoices?.invoice_number || "-"}</td>
                <td className="p-4 text-sm font-medium text-foreground">AED {Number(p.amount).toLocaleString()}</td>
                <td className="p-4 text-sm text-muted-foreground capitalize">{p.payment_method.replace("_", " ")}</td>
                <td className="p-4 text-sm text-muted-foreground">{p.reference_number || "-"}</td>
                <td className="p-4 text-sm text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</td>
                <td className="p-4"><Badge variant={p.status === "completed" ? "default" : "secondary"}>{p.status}</Badge></td>
                <td className="p-4"><Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="w-3 h-3" /></Button></td>
              </tr>
            ))}
          </tbody></table>
        </div>}
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Invoice (optional)</Label><Select value={form.invoice_id} onValueChange={handleInvoiceSelect}><SelectTrigger><SelectValue placeholder="Select invoice to pay" /></SelectTrigger><SelectContent>{invoicesList.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.invoice_number} - {i.tenants?.full_name} - AED {Number(i.total_amount).toLocaleString()}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tenant *</Label><Select value={form.tenant_id} onValueChange={(v) => setForm({ ...form, tenant_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{tenantsList.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Amount (AED) *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Method</Label><Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Reference Number</Label><Input value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button><Button type="submit">Record Payment</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border"><AlertDialogHeader><AlertDialogTitle>Delete Payment?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Payments;

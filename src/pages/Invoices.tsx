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
import { Receipt, Plus, Search, Pencil, Trash2, Download, RefreshCw, Copy, Eye } from "lucide-react";
import { generateInvoicePDF, generateTablePDF } from "@/lib/pdfUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { InvoiceTemplate } from "@/components/InvoiceTemplate";

const VAT_RATE = 0.05;

const Invoices = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ tenant_id: "", lease_id: "", invoice_number: "", amount: "", due_date: "", description: "", status: "pending" });
  const [recurringForm, setRecurringForm] = useState({ tenant_id: "", lease_id: "", amount: "", description: "", frequency: "monthly", next_generate_date: "", is_active: true });
  const [search, setSearch] = useState("");
  const [selectedForBulk, setSelectedForBulk] = useState<string[]>([]);
  const [bulkDueDate, setBulkDueDate] = useState("");
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);

  const { data: tenantsList = [] } = useQuery({
    queryKey: ["tenants-inv", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase.from("tenants").select("id, full_name").eq("organization_id", currentOrg.id).order("full_name");
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const { data: leasesList = [] } = useQuery({
    queryKey: ["leases-inv", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase.from("leases").select("id, tenant_id, monthly_rent, tenants(full_name)").eq("organization_id", currentOrg.id).eq("status", "active");
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data, error } = await supabase.from("invoices").select("*, tenants(full_name)").eq("organization_id", currentOrg.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const { data: recurringInvoices = [] } = useQuery({
    queryKey: ["recurring-invoices", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase.from("recurring_invoices").select("*, tenants(full_name)").eq("organization_id", currentOrg.id).order("next_generate_date");
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const createMutation = useMutation({
    mutationFn: async (f: typeof form) => {
      const amount = parseFloat(f.amount);
      const vatAmount = amount * VAT_RATE;
      const { error } = await supabase.from("invoices").insert({
        organization_id: currentOrg!.id, tenant_id: f.tenant_id, lease_id: f.lease_id || null,
        invoice_number: f.invoice_number, amount, vat_amount: vatAmount, total_amount: amount + vatAmount,
        due_date: f.due_date, description: f.description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Invoice created"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: typeof form }) => {
      const amount = parseFloat(f.amount);
      const vatAmount = amount * VAT_RATE;
      const { error } = await supabase.from("invoices").update({
        tenant_id: f.tenant_id, lease_id: f.lease_id || null, invoice_number: f.invoice_number,
        amount, vat_amount: vatAmount, total_amount: amount + vatAmount,
        due_date: f.due_date, description: f.description || null, status: f.status,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Invoice updated"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("invoices").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Invoice deleted"); setDeleteId(null); },
    onError: (err: any) => toast.error(err.message),
  });

  // Bulk invoice generation
  const bulkGenerateMutation = useMutation({
    mutationFn: async () => {
      if (!bulkDueDate || selectedForBulk.length === 0) throw new Error("Select tenants and due date");
      const invoicesToInsert = selectedForBulk.map((leaseId) => {
        const lease = leasesList.find((l: any) => l.id === leaseId);
        if (!lease) return null;
        const amount = Number(lease.monthly_rent);
        const vatAmount = amount * VAT_RATE;
        return {
          organization_id: currentOrg!.id,
          tenant_id: lease.tenant_id,
          lease_id: lease.id,
          invoice_number: `INV-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
          amount,
          vat_amount: vatAmount,
          total_amount: amount + vatAmount,
          due_date: bulkDueDate,
          description: "Monthly Rent",
        };
      }).filter(Boolean);

      const { error } = await supabase.from("invoices").insert(invoicesToInsert as any);
      if (error) throw error;
      return invoicesToInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(`${count} invoices generated`);
      setBulkDialogOpen(false);
      setSelectedForBulk([]);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Recurring invoice creation
  const createRecurringMutation = useMutation({
    mutationFn: async (f: typeof recurringForm) => {
      const { error } = await supabase.from("recurring_invoices").insert({
        organization_id: currentOrg!.id,
        tenant_id: f.tenant_id,
        lease_id: f.lease_id || null,
        amount: parseFloat(f.amount),
        description: f.description || null,
        frequency: f.frequency,
        next_generate_date: f.next_generate_date,
        is_active: f.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-invoices"] });
      toast.success("Recurring invoice setup created");
      setRecurringDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recurring_invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["recurring-invoices"] }); toast.success("Recurring invoice deleted"); },
  });

  const emptyForm = { tenant_id: "", lease_id: "", invoice_number: "", amount: "", due_date: "", description: "", status: "pending" };
  const openCreate = () => {
    const invNum = `INV-${Date.now().toString().slice(-6)}`;
    setForm({ ...emptyForm, invoice_number: invNum }); setEditingId(null); setDialogOpen(true);
  };
  const openEdit = (inv: any) => {
    setForm({ tenant_id: inv.tenant_id, lease_id: inv.lease_id || "", invoice_number: inv.invoice_number, amount: String(inv.amount), due_date: inv.due_date, description: inv.description || "", status: inv.status });
    setEditingId(inv.id); setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };
  const handleSubmit = (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!form.tenant_id || !form.amount || !form.due_date) { 
      toast.error("Fill required fields"); 
      return; 
    } 
    if (editingId) {
      updateMutation.mutate({ id: editingId, f: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filtered = invoices.filter((i: any) => i.invoice_number.toLowerCase().includes(search.toLowerCase()) || (i.tenants?.full_name || "").toLowerCase().includes(search.toLowerCase()));
  if (!currentOrg) return <AppLayout><div className="glass-card p-12 text-center"><p className="text-muted-foreground">Please create an organization first.</p></div></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="page-header">Invoices</h1><p className="text-sm text-muted-foreground mt-1">Manage invoices with 5% VAT</p></div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => {
              generateTablePDF({
                title: "Invoice Report", orgName: currentOrg?.name || "",
                subtitle: `Total: ${filtered.length} invoices`,
                columns: ["Invoice #", "Tenant", "Amount", "VAT", "Total", "Due Date", "Status"],
                rows: filtered.map((i: any) => [i.invoice_number, i.tenants?.full_name || "—", `AED ${Number(i.amount).toLocaleString()}`, `AED ${Number(i.vat_amount).toLocaleString()}`, `AED ${Number(i.total_amount).toLocaleString()}`, new Date(i.due_date).toLocaleDateString(), i.status]),
                filename: "invoices-report.pdf",
              });
              toast.success("PDF exported");
            }}><Download className="w-4 h-4" /> Export PDF</Button>
            <Button variant="outline" className="gap-2" onClick={() => setBulkDialogOpen(true)} disabled={leasesList.length === 0}>
              <Copy className="w-4 h-4" /> Bulk Generate
            </Button>
            <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Create Invoice</Button>
          </div>
        </div>

        <Tabs defaultValue="invoices">
          <TabsList>
            <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
            <TabsTrigger value="recurring">Recurring ({recurringInvoices.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="space-y-4">
            <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" /></div>

            {isLoading ? <div className="glass-card p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div> :
            filtered.length === 0 ? <div className="glass-card p-12 text-center"><Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No invoices yet.</p></div> :
            <div className="glass-card overflow-hidden overflow-x-auto">
              <table className="w-full"><thead><tr className="border-b border-border/30">
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Invoice #</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Tenant</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Amount</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">VAT</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Total</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Due Date</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4"></th>
              </tr></thead><tbody>
                {filtered.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-border/20 hover:bg-accent/30">
                    <td className="p-4 font-mono text-sm text-foreground">{inv.invoice_number}</td>
                    <td className="p-4 text-sm text-foreground">{inv.tenants?.full_name}</td>
                    <td className="p-4 text-sm text-muted-foreground">AED {Number(inv.amount).toLocaleString()}</td>
                    <td className="p-4 text-sm text-muted-foreground">AED {Number(inv.vat_amount).toLocaleString()}</td>
                    <td className="p-4 text-sm font-medium text-foreground">AED {Number(inv.total_amount).toLocaleString()}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(inv.due_date).toLocaleDateString()}</td>
                    <td className="p-4"><Badge variant={inv.status === "paid" ? "default" : inv.status === "overdue" ? "destructive" : "secondary"}>{inv.status}</Badge></td>
                    <td className="p-4"><div className="flex gap-1 flex-wrap justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/20" title="View Template" onClick={() => setViewInvoiceId(inv.invoice_number)}><Eye className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Download PDF" onClick={() => { generateInvoicePDF(inv, currentOrg?.name || ""); toast.success("Invoice PDF downloaded"); }}><Download className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(inv)}><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => setDeleteId(inv.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div></td>
                  </tr>
                ))}
              </tbody></table>
            </div>}
          </TabsContent>

          <TabsContent value="recurring" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setRecurringForm({ tenant_id: "", lease_id: "", amount: "", description: "", frequency: "monthly", next_generate_date: "", is_active: true }); setRecurringDialogOpen(true); }} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Add Recurring Invoice
              </Button>
            </div>
            {recurringInvoices.length === 0 ? (
              <div className="glass-card p-12 text-center"><RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No recurring invoices configured.</p></div>
            ) : (
              <div className="glass-card overflow-hidden overflow-x-auto">
                <table className="w-full"><thead><tr className="border-b border-border/30">
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Tenant</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Amount</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Frequency</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Next Date</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Active</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4"></th>
                </tr></thead><tbody>
                  {recurringInvoices.map((r: any) => (
                    <tr key={r.id} className="border-b border-border/20 hover:bg-accent/30">
                      <td className="p-4 text-sm text-foreground">{r.tenants?.full_name}</td>
                      <td className="p-4 text-sm font-medium text-foreground">AED {Number(r.amount).toLocaleString()}</td>
                      <td className="p-4 text-sm text-muted-foreground capitalize">{r.frequency}</td>
                      <td className="p-4 text-sm text-muted-foreground">{new Date(r.next_generate_date).toLocaleDateString()}</td>
                      <td className="p-4"><Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Active" : "Paused"}</Badge></td>
                      <td className="p-4"><Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => deleteRecurringMutation.mutate(r.id)}><Trash2 className="w-3 h-3" /></Button></td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Create/Edit Invoice Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Invoice" : "Create Invoice"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Invoice # *</Label><Input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Tenant *</Label><Select value={form.tenant_id} onValueChange={(v) => setForm({ ...form, tenant_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{tenantsList.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Amount (AED) *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                {form.amount && <p className="text-xs text-muted-foreground">VAT (5%): AED {(parseFloat(form.amount) * VAT_RATE).toFixed(2)} | Total: AED {(parseFloat(form.amount) * 1.05).toFixed(2)}</p>}
              </div>
              <div className="space-y-2"><Label>Due Date *</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required /></div>
            </div>
            <div className="space-y-2"><Label>Lease</Label><Select value={form.lease_id} onValueChange={(v) => setForm({ ...form, lease_id: v })}><SelectTrigger><SelectValue placeholder="Select (optional)" /></SelectTrigger><SelectContent>{leasesList.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.tenants?.full_name} - AED {Number(l.monthly_rent).toLocaleString()}/mo</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            {editingId && <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="overdue">Overdue</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select></div>}
            <DialogFooter><Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button><Button type="submit">{editingId ? "Update" : "Create"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Generate Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Bulk Generate Invoices</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select active leases to generate invoices for. Each will use the lease's monthly rent with 5% VAT.</p>
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input type="date" value={bulkDueDate} onChange={(e) => setBulkDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Select Leases ({selectedForBulk.length} selected)</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto border border-border/30 rounded-lg p-3">
                {leasesList.map((l: any) => (
                  <label key={l.id} className="flex items-center gap-3 p-2 rounded hover:bg-accent/20 cursor-pointer">
                    <Checkbox
                      checked={selectedForBulk.includes(l.id)}
                      onCheckedChange={(checked) => {
                        setSelectedForBulk(checked ? [...selectedForBulk, l.id] : selectedForBulk.filter((id) => id !== l.id));
                      }}
                    />
                    <span className="text-sm">{l.tenants?.full_name} — AED {Number(l.monthly_rent).toLocaleString()}/mo</span>
                  </label>
                ))}
                {leasesList.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No active leases found.</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => bulkGenerateMutation.mutate()} disabled={selectedForBulk.length === 0 || !bulkDueDate}>
              Generate {selectedForBulk.length} Invoices
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recurring Invoice Dialog */}
      <Dialog open={recurringDialogOpen} onOpenChange={setRecurringDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle>Setup Recurring Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tenant *</Label><Select value={recurringForm.tenant_id} onValueChange={(v) => setRecurringForm({ ...recurringForm, tenant_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{tenantsList.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Amount (AED) *</Label><Input type="number" value={recurringForm.amount} onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Frequency</Label><Select value={recurringForm.frequency} onValueChange={(v) => setRecurringForm({ ...recurringForm, frequency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="semi_annual">Semi-Annual</SelectItem><SelectItem value="annual">Annual</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Next Generate Date *</Label><Input type="date" value={recurringForm.next_generate_date} onChange={(e) => setRecurringForm({ ...recurringForm, next_generate_date: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={recurringForm.description} onChange={(e) => setRecurringForm({ ...recurringForm, description: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><Label>Lease (optional)</Label><Select value={recurringForm.lease_id} onValueChange={(v) => setRecurringForm({ ...recurringForm, lease_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{leasesList.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.tenants?.full_name} - AED {Number(l.monthly_rent).toLocaleString()}/mo</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecurringDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (!recurringForm.tenant_id || !recurringForm.amount || !recurringForm.next_generate_date) { toast.error("Fill required fields"); return; } createRecurringMutation.mutate(recurringForm); }}>
              Create Recurring
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border"><AlertDialogHeader><AlertDialogTitle>Delete Invoice?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      {/* Invoice Viewer Modal */}
      {viewInvoiceId && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <InvoiceTemplate 
            invoiceId={viewInvoiceId}
            onClose={() => setViewInvoiceId(null)}
          />
        </div>
      )}
    </AppLayout>
  );
};

export default Invoices;

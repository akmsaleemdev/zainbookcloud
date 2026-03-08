import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Filter, Pencil, Trash2, ShieldCheck, FileText, Download } from "lucide-react";
import { generateEjariPDF, generateTablePDF } from "@/lib/pdfUtils";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  registered: "bg-emerald-500/20 text-emerald-400",
  expired: "bg-destructive/20 text-destructive",
  cancelled: "bg-orange-500/20 text-orange-400",
  pending: "bg-yellow-500/20 text-yellow-400",
};

const defaultForm = {
  ejari_number: "",
  contract_number: "",
  tenant_id: "",
  lease_id: "",
  property_name: "",
  unit_number: "",
  start_date: "",
  end_date: "",
  annual_rent: "",
  security_deposit: "",
  registration_date: "",
  expiry_date: "",
  status: "draft",
  contract_type: "new",
  payment_method: "cheque",
  notes: "",
};

const Ejari = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [search, setSearch] = useState("");

  const orgId = currentOrg?.id;

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["ejari", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("ejari_contracts")
        .select("*, tenants(full_name), leases(monthly_rent)")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants-list", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("tenants").select("id, full_name").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: leases = [] } = useQuery({
    queryKey: ["leases-list", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("leases").select("id, monthly_rent, tenant_id").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org");
      const payload = {
        organization_id: orgId,
        ejari_number: form.ejari_number,
        contract_number: form.contract_number || null,
        tenant_id: form.tenant_id,
        lease_id: form.lease_id || null,
        property_name: form.property_name || null,
        unit_number: form.unit_number || null,
        start_date: form.start_date,
        end_date: form.end_date,
        annual_rent: parseFloat(form.annual_rent),
        security_deposit: form.security_deposit ? parseFloat(form.security_deposit) : 0,
        registration_date: form.registration_date || null,
        expiry_date: form.expiry_date || null,
        status: form.status,
        contract_type: form.contract_type,
        payment_method: form.payment_method,
        notes: form.notes || null,
      };
      if (editId) {
        const { error } = await supabase.from("ejari_contracts").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ejari_contracts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ejari"] });
      setOpen(false);
      setEditId(null);
      setForm(defaultForm);
      toast({ title: editId ? "Contract updated" : "Contract created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ejari_contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ejari"] });
      toast({ title: "Contract deleted" });
    },
  });

  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      ejari_number: c.ejari_number,
      contract_number: c.contract_number || "",
      tenant_id: c.tenant_id,
      lease_id: c.lease_id || "",
      property_name: c.property_name || "",
      unit_number: c.unit_number || "",
      start_date: c.start_date,
      end_date: c.end_date,
      annual_rent: String(c.annual_rent),
      security_deposit: String(c.security_deposit || ""),
      registration_date: c.registration_date || "",
      expiry_date: c.expiry_date || "",
      status: c.status || "draft",
      contract_type: c.contract_type || "new",
      payment_method: c.payment_method || "cheque",
      notes: c.notes || "",
    });
    setOpen(true);
  };

  const filtered = contracts.filter((c: any) =>
    c.ejari_number?.toLowerCase().includes(search.toLowerCase()) ||
    c.tenants?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.property_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (!orgId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Please select an organization first.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header flex items-center gap-2"><ShieldCheck className="w-6 h-6" /> Ejari Contracts</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage Ejari registrations and contract compliance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => {
              generateTablePDF({
                title: "Ejari Contracts Report",
                orgName: currentOrg?.name || "",
                subtitle: `Total: ${filtered.length} contracts`,
                columns: ["Ejari #", "Tenant", "Property", "Annual Rent", "Start", "End", "Status"],
                rows: filtered.map((c: any) => [c.ejari_number, c.tenants?.full_name || "—", c.property_name || "—", `AED ${Number(c.annual_rent).toLocaleString()}`, new Date(c.start_date).toLocaleDateString(), new Date(c.end_date).toLocaleDateString(), c.status]),
                filename: "ejari-report.pdf",
              });
              toast({ title: "PDF exported" });
            }}><Download className="w-4 h-4" /> Export PDF</Button>
            <Button onClick={() => { setEditId(null); setForm(defaultForm); setOpen(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> New Ejari
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search contracts..." className="pl-10 bg-secondary/50 border-border/50" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ejari #</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Annual Rent</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No Ejari contracts found.</TableCell></TableRow>
              ) : (
                filtered.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.ejari_number}</TableCell>
                    <TableCell>{c.tenants?.full_name || "—"}</TableCell>
                    <TableCell>{c.property_name || "—"}</TableCell>
                    <TableCell>AED {Number(c.annual_rent).toLocaleString()}</TableCell>
                    <TableCell>{format(new Date(c.start_date), "dd MMM yyyy")}</TableCell>
                    <TableCell>{format(new Date(c.end_date), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[c.status] || ""}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{c.contract_type}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" title="Download PDF" onClick={() => { generateEjariPDF(c, currentOrg?.name || ""); toast({ title: "Ejari PDF downloaded" }); }}><Download className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> {editId ? "Edit" : "New"} Ejari Contract
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Ejari Number *</Label>
              <Input value={form.ejari_number} onChange={(e) => setForm({ ...form, ejari_number: e.target.value })} placeholder="e.g. 1234567890" />
            </div>
            <div className="space-y-2">
              <Label>Contract Number</Label>
              <Input value={form.contract_number} onChange={(e) => setForm({ ...form, contract_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tenant *</Label>
              <Select value={form.tenant_id} onValueChange={(v) => setForm({ ...form, tenant_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                <SelectContent>
                  {tenants.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Linked Lease</Label>
              <Select value={form.lease_id} onValueChange={(v) => setForm({ ...form, lease_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select lease (optional)" /></SelectTrigger>
                <SelectContent>
                  {leases.map((l: any) => <SelectItem key={l.id} value={l.id}>AED {l.monthly_rent}/mo</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Property Name</Label>
              <Input value={form.property_name} onChange={(e) => setForm({ ...form, property_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Unit Number</Label>
              <Input value={form.unit_number} onChange={(e) => setForm({ ...form, unit_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Annual Rent (AED) *</Label>
              <Input type="number" value={form.annual_rent} onChange={(e) => setForm({ ...form, annual_rent: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Security Deposit (AED)</Label>
              <Input type="number" value={form.security_deposit} onChange={(e) => setForm({ ...form, security_deposit: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Registration Date</Label>
              <Input type="date" value={form.registration_date} onChange={(e) => setForm({ ...form, registration_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contract Type</Label>
              <Select value={form.contract_type} onValueChange={(v) => setForm({ ...form, contract_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="renewal">Renewal</SelectItem>
                  <SelectItem value="amendment">Amendment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.ejari_number || !form.tenant_id || !form.start_date || !form.end_date || !form.annual_rent}>
              {editId ? "Update" : "Create"} Contract
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Ejari;

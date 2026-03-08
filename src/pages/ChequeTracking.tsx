import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Banknote, Plus, Search, Pencil, Trash2, AlertTriangle,
  FileCheck, Calendar, DollarSign, ArrowUpDown
} from "lucide-react";

const ChequeTracking = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({
    tenant_id: "", lease_id: "", cheque_number: "", bank_name: "",
    amount: "", cheque_date: "", status: "pending", notes: "",
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants-chq", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase.from("tenants").select("id, full_name").eq("organization_id", currentOrg.id);
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const { data: leases = [] } = useQuery({
    queryKey: ["leases-chq", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase.from("leases").select("id, tenants(full_name), monthly_rent").eq("organization_id", currentOrg.id).eq("status", "active");
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const { data: cheques = [], isLoading } = useQuery({
    queryKey: ["cheques", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data, error } = await supabase.from("cheque_tracking").select("*, tenants(full_name)").eq("organization_id", currentOrg.id).order("cheque_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        organization_id: currentOrg!.id,
        tenant_id: form.tenant_id,
        lease_id: form.lease_id || null,
        cheque_number: form.cheque_number,
        bank_name: form.bank_name || null,
        amount: parseFloat(form.amount),
        cheque_date: form.cheque_date,
        status: form.status,
        notes: form.notes || null,
      };
      if (editId) {
        const { error } = await supabase.from("cheque_tracking").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cheque_tracking").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cheques"] }); setDialog(false); setEditId(null); toast({ title: "Cheque saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = cheques.filter((c: any) => {
    const matchSearch = c.cheque_number?.includes(search) || c.tenants?.full_name?.toLowerCase().includes(search.toLowerCase()) || c.bank_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPending = cheques.filter((c: any) => c.status === "pending").reduce((s: number, c: any) => s + (c.amount || 0), 0);
  const totalCleared = cheques.filter((c: any) => c.status === "cleared").reduce((s: number, c: any) => s + (c.amount || 0), 0);
  const totalBounced = cheques.filter((c: any) => c.status === "bounced").length;
  const upcoming = cheques.filter((c: any) => {
    if (c.status !== "pending") return false;
    const d = new Date(c.cheque_date);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).length;

  const openAdd = () => {
    setEditId(null);
    setForm({ tenant_id: "", lease_id: "", cheque_number: "", bank_name: "", amount: "", cheque_date: "", status: "pending", notes: "" });
    setDialog(true);
  };

  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      tenant_id: c.tenant_id, lease_id: c.lease_id || "", cheque_number: c.cheque_number,
      bank_name: c.bank_name || "", amount: String(c.amount), cheque_date: c.cheque_date,
      status: c.status, notes: c.notes || "",
    });
    setDialog(true);
  };

  if (!currentOrg) return <AppLayout><div className="glass-card p-12 text-center"><p className="text-muted-foreground">Please create an organization first.</p></div></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header flex items-center gap-2"><Banknote className="w-6 h-6 text-primary" /> Cheque Tracking</h1>
            <p className="text-sm text-muted-foreground mt-1">Post-dated cheque (PDC) management for {currentOrg.name}</p>
          </div>
          <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Cheque</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card"><CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center"><DollarSign className="w-6 h-6 text-amber-400" /></div>
            <div><p className="text-xs text-muted-foreground">Pending Amount</p><p className="text-2xl font-bold">AED {totalPending.toLocaleString()}</p></div>
          </CardContent></Card>
          <Card className="glass-card"><CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center"><FileCheck className="w-6 h-6 text-emerald-400" /></div>
            <div><p className="text-xs text-muted-foreground">Cleared Amount</p><p className="text-2xl font-bold">AED {totalCleared.toLocaleString()}</p></div>
          </CardContent></Card>
          <Card className="glass-card"><CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-destructive" /></div>
            <div><p className="text-xs text-muted-foreground">Bounced</p><p className="text-2xl font-bold">{totalBounced}</p></div>
          </CardContent></Card>
          <Card className="glass-card"><CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center"><Calendar className="w-6 h-6 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground">Due This Week</p><p className="text-2xl font-bold">{upcoming}</p></div>
          </CardContent></Card>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search cheque #, tenant, bank..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {["pending", "deposited", "cleared", "bounced", "replaced", "cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="glass-card overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Cheque #</TableHead><TableHead>Tenant</TableHead><TableHead>Bank</TableHead>
              <TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></TableCell></TableRow> :
              filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No cheques found</TableCell></TableRow> :
              filtered.map((c: any) => {
                const isOverdue = c.status === "pending" && new Date(c.cheque_date) < new Date();
                return (
                  <TableRow key={c.id} className={isOverdue ? "bg-destructive/5" : ""}>
                    <TableCell className="font-mono font-medium">{c.cheque_number}</TableCell>
                    <TableCell className="text-sm">{c.tenants?.full_name || "—"}</TableCell>
                    <TableCell className="text-sm">{c.bank_name || "—"}</TableCell>
                    <TableCell className="font-medium">AED {c.amount?.toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{new Date(c.cheque_date).toLocaleDateString()}{isOverdue && <span className="text-destructive text-xs ml-1">⚠ Overdue</span>}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "cleared" ? "default" : c.status === "bounced" ? "destructive" : c.status === "deposited" ? "secondary" : "outline"}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit Cheque" : "Add Cheque"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tenant *</Label>
                <Select value={form.tenant_id} onValueChange={(v) => setForm({ ...form, tenant_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                  <SelectContent>{tenants.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Lease</Label>
                <Select value={form.lease_id} onValueChange={(v) => setForm({ ...form, lease_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent><SelectItem value="">None</SelectItem>{leases.map((l: any) => <SelectItem key={l.id} value={l.id}>{(l as any).tenants?.full_name} — AED {l.monthly_rent}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Cheque # *</Label><Input value={form.cheque_number} onChange={(e) => setForm({ ...form, cheque_number: e.target.value })} /></div>
              <div className="space-y-2"><Label>Bank Name</Label><Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Amount (AED) *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div className="space-y-2"><Label>Cheque Date *</Label><Input type="date" value={form.cheque_date} onChange={(e) => setForm({ ...form, cheque_date: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["pending", "deposited", "cleared", "bounced", "replaced", "cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button><Button onClick={() => saveMutation.mutate()} disabled={!form.tenant_id || !form.cheque_number || !form.amount || !form.cheque_date}>{editId ? "Update" : "Add Cheque"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ChequeTracking;

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
import { MessageSquareWarning, Plus, Search, Trash2, Clock, AlertTriangle, CheckCircle2, Filter, Download } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";
import { generateComplaintPDF, generateTablePDF } from "@/lib/pdfUtils";

const CATEGORIES = ["general", "noise", "cleanliness", "security", "parking", "maintenance", "neighbor", "pest", "utilities", "other"];
const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["open", "in_progress", "resolved", "closed"];

const Complaints = () => {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({
    subject: "", description: "", category: "general", priority: "medium",
    tenant_id: "", property_id: "", unit_id: "", status: "open", resolution: "",
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants-for-complaints", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase.from("tenants").select("id, full_name").eq("organization_id", currentOrg.id).order("full_name");
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["props-for-complaints", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase.from("properties").select("id, name").eq("organization_id", currentOrg.id).order("name");
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const { data: unitsList = [] } = useQuery({
    queryKey: ["units-for-complaints", currentOrg?.id],
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

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["complaints", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data, error } = await supabase
        .from("complaints")
        .select("*, tenants(full_name), properties(name), units(unit_number)")
        .eq("organization_id", currentOrg.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const createMutation = useMutation({
    mutationFn: async (f: typeof form) => {
      const { error } = await supabase.from("complaints").insert({
        organization_id: currentOrg!.id,
        subject: f.subject,
        description: f.description || null,
        category: f.category,
        priority: f.priority,
        tenant_id: f.tenant_id || null,
        property_id: f.property_id || null,
        unit_id: f.unit_id || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["complaints"] }); toast.success("Complaint created"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: typeof form }) => {
      const updateData: any = {
        subject: f.subject,
        description: f.description || null,
        category: f.category,
        priority: f.priority,
        tenant_id: f.tenant_id || null,
        property_id: f.property_id || null,
        unit_id: f.unit_id || null,
        status: f.status,
        resolution: f.resolution || null,
      };
      if (f.status === "resolved" || f.status === "closed") updateData.resolved_at = new Date().toISOString();
      const { error } = await supabase.from("complaints").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["complaints"] }); toast.success("Complaint updated"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("complaints").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["complaints"] }); toast.success("Complaint deleted"); setDeleteId(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const emptyForm = { subject: "", description: "", category: "general", priority: "medium", tenant_id: "", property_id: "", unit_id: "", status: "open", resolution: "" };
  const openCreate = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (c: any) => {
    setForm({
      subject: c.subject, description: c.description || "", category: c.category, priority: c.priority,
      tenant_id: c.tenant_id || "", property_id: c.property_id || "", unit_id: c.unit_id || "",
      status: c.status, resolution: c.resolution || "",
    });
    setEditingId(c.id); setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject) { toast.error("Subject is required"); return; }
    if (editingId) {
      updateMutation.mutate({ id: editingId, f: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filtered = complaints.filter((c: any) => {
    const matchesSearch = c.subject.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusIcon = (s: string) => {
    if (s === "resolved" || s === "closed") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (s === "in_progress") return <Clock className="w-4 h-4 text-amber-500" />;
    return <AlertTriangle className="w-4 h-4 text-destructive" />;
  };

  const priorityColor = (p: string) => {
    if (p === "urgent") return "destructive";
    if (p === "high") return "secondary";
    return "outline" as const;
  };

  if (!currentOrg) return <AppLayout><div className="glass-card p-12 text-center"><p className="text-muted-foreground">Please create an organization first.</p></div></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Complaints</h1>
            <p className="text-sm text-muted-foreground mt-1">Track and manage tenant complaints</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => {
              generateTablePDF({
                title: "Complaints Report", orgName: currentOrg?.name || "",
                columns: ["Subject", "Category", "Priority", "Tenant", "Status", "Date"],
                rows: filtered.map((c: any) => [c.subject, c.category, c.priority, c.tenants?.full_name || "—", c.status, new Date(c.created_at).toLocaleDateString()]),
                filename: "complaints-report.pdf",
              });
              toast.success("Report exported");
            }}><Download className="w-4 h-4" /> Export PDF</Button>
            <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> File Complaint</Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search complaints..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] bg-secondary/50 border-border/50">
              <Filter className="w-4 h-4 mr-2" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total", count: complaints.length, color: "text-foreground" },
            { label: "Open", count: complaints.filter((c: any) => c.status === "open").length, color: "text-destructive" },
            { label: "In Progress", count: complaints.filter((c: any) => c.status === "in_progress").length, color: "text-amber-500" },
            { label: "Resolved", count: complaints.filter((c: any) => c.status === "resolved" || c.status === "closed").length, color: "text-emerald-500" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="glass-card p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <MessageSquareWarning className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No complaints found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c: any) => (
              <div key={c.id} className="glass-card p-4 flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors" onClick={() => openEdit(c)}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.priority === "urgent" ? "bg-destructive/10" : c.priority === "high" ? "bg-amber-500/10" : "bg-primary/10"}`}>
                    {statusIcon(c.status)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{c.subject}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{c.category}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {c.tenants?.full_name && <span className="text-xs text-muted-foreground">{c.tenants.full_name}</span>}
                      {c.properties?.name && <span className="text-xs text-muted-foreground">• {c.properties.name}</span>}
                      {c.units?.unit_number && <span className="text-xs text-muted-foreground">• Unit {c.units.unit_number}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={priorityColor(c.priority)} className="capitalize">{c.priority}</Badge>
                  <Badge variant={c.status === "resolved" || c.status === "closed" ? "default" : c.status === "in_progress" ? "secondary" : "outline"} className="capitalize">
                    {c.status.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(c.created_at).toLocaleDateString()}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Download PDF" onClick={(e) => { e.stopPropagation(); generateComplaintPDF(c, currentOrg?.name || ""); toast.success("PDF downloaded"); }}>
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(c.id); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Complaint" : "File Complaint"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Subject *</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tenant</Label>
                <Select value={form.tenant_id} onValueChange={(v) => setForm({ ...form, tenant_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                  <SelectContent>{tenants.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Property</Label>
                <Select value={form.property_id} onValueChange={(v) => setForm({ ...form, property_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                  <SelectContent>{properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={form.unit_id} onValueChange={(v) => setForm({ ...form, unit_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                <SelectContent>{unitsList.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.unit_number} - {u.buildings?.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {editingId && (
              <>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Resolution Notes</Label><Textarea value={form.resolution} onChange={(e) => setForm({ ...form, resolution: e.target.value })} rows={2} placeholder="How was this complaint resolved?" /></div>
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit">{editingId ? "Update" : "Submit"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader><AlertDialogTitle>Delete Complaint?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Complaints;

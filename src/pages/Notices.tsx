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
import { Megaphone, Plus, Search, Trash2, Clock, Send, FileText, Filter, Eye, Download } from "lucide-react";
import { generateNoticePDF, generateTablePDF } from "@/lib/pdfUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";

const NOTICE_TYPES = ["general", "maintenance", "policy", "event", "emergency", "payment", "lease", "other"];
const RECIPIENT_TYPES = ["all", "tenants", "owners", "staff", "specific_property"];

const Notices = () => {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState({
    title: "", description: "", notice_type: "general", recipient_type: "all",
    property_id: "", status: "draft", expires_at: "",
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["props-for-notices", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase.from("properties").select("id, name").eq("organization_id", currentOrg.id).order("name");
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ["notices", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data, error } = await supabase
        .from("notices")
        .select("*, properties(name)")
        .eq("organization_id", currentOrg.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const createMutation = useMutation({
    mutationFn: async (f: typeof form) => {
      const { error } = await supabase.from("notices").insert({
        organization_id: currentOrg!.id,
        title: f.title,
        description: f.description || null,
        notice_type: f.notice_type,
        recipient_type: f.recipient_type,
        property_id: f.property_id || null,
        status: f.status,
        expires_at: f.expires_at || null,
        published_at: f.status === "published" ? new Date().toISOString() : null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notices"] }); toast.success("Notice created"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: typeof form }) => {
      const updateData: any = {
        title: f.title,
        description: f.description || null,
        notice_type: f.notice_type,
        recipient_type: f.recipient_type,
        property_id: f.property_id || null,
        status: f.status,
        expires_at: f.expires_at || null,
      };
      if (f.status === "published") updateData.published_at = new Date().toISOString();
      const { error } = await supabase.from("notices").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notices"] }); toast.success("Notice updated"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("notices").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notices"] }); toast.success("Notice deleted"); setDeleteId(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notices").update({ status: "published", published_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notices"] }); toast.success("Notice published"); },
    onError: (err: any) => toast.error(err.message),
  });

  const emptyForm = { title: "", description: "", notice_type: "general", recipient_type: "all", property_id: "", status: "draft", expires_at: "" };
  const openCreate = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (n: any) => {
    setForm({
      title: n.title, description: n.description || "", notice_type: n.notice_type, recipient_type: n.recipient_type,
      property_id: n.property_id || "", status: n.status, expires_at: n.expires_at ? n.expires_at.split("T")[0] : "",
    });
    setEditingId(n.id); setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { toast.error("Title is required"); return; }
    editingId ? updateMutation.mutate({ id: editingId, f: form }) : createMutation.mutate(form);
  };

  const filtered = notices.filter((n: any) => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || n.notice_type === filterType;
    return matchesSearch && matchesType;
  });

  const statusBadge = (s: string) => {
    if (s === "published") return <Badge variant="default" className="capitalize">Published</Badge>;
    if (s === "archived") return <Badge variant="secondary" className="capitalize">Archived</Badge>;
    return <Badge variant="outline" className="capitalize">Draft</Badge>;
  };

  if (!currentOrg) return <AppLayout><div className="glass-card p-12 text-center"><p className="text-muted-foreground">Please create an organization first.</p></div></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Notices</h1>
            <p className="text-sm text-muted-foreground mt-1">Create and distribute notices to tenants and staff</p>
          </div>
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Create Notice</Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search notices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] bg-secondary/50 border-border/50">
              <Filter className="w-4 h-4 mr-2" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {NOTICE_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Notices", count: notices.length, color: "text-foreground" },
            { label: "Published", count: notices.filter((n: any) => n.status === "published").length, color: "text-emerald-500" },
            { label: "Drafts", count: notices.filter((n: any) => n.status === "draft").length, color: "text-amber-500" },
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
            <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notices found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((n: any) => (
              <div key={n.id} className="glass-card p-4 flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors" onClick={() => openEdit(n)}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${n.notice_type === "emergency" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                    {n.notice_type === "emergency" ? <Megaphone className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{n.title}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{n.notice_type}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground capitalize">To: {n.recipient_type.replace("_", " ")}</span>
                      {n.properties?.name && <span className="text-xs text-muted-foreground">• {n.properties.name}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {statusBadge(n.status)}
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(n.created_at).toLocaleDateString()}</span>
                  {n.status === "draft" && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary" onClick={(e) => { e.stopPropagation(); publishMutation.mutate(n.id); }} title="Publish">
                      <Send className="w-3 h-3" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(n.id); }}>
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
          <DialogHeader><DialogTitle>{editingId ? "Edit Notice" : "Create Notice"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Notice Type</Label>
                <Select value={form.notice_type} onValueChange={(v) => setForm({ ...form, notice_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{NOTICE_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Recipients</Label>
                <Select value={form.recipient_type} onValueChange={(v) => setForm({ ...form, recipient_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RECIPIENT_TYPES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Property (optional)</Label>
                <Select value={form.property_id} onValueChange={(v) => setForm({ ...form, property_id: v })}>
                  <SelectTrigger><SelectValue placeholder="All properties" /></SelectTrigger>
                  <SelectContent>{properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expires On</Label>
                <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
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
          <AlertDialogHeader><AlertDialogTitle>Delete Notice?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Notices;

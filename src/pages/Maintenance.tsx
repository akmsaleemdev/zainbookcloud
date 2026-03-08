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
import { Wrench, Plus, Search, Pencil, Trash2, Clock, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const CATEGORIES = ["plumbing", "electrical", "hvac", "cleaning", "structural", "appliance", "pest_control", "painting", "other"];

const Maintenance = () => {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", category: "", unit_id: "", estimated_cost: "", status: "open" });
  const [search, setSearch] = useState("");

  const { data: unitsList = [] } = useQuery({
    queryKey: ["units-for-maint", currentOrg?.id],
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

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["maintenance", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data, error } = await supabase.from("maintenance_requests").select("*, units(unit_number, buildings(name))").eq("organization_id", currentOrg.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const createMutation = useMutation({
    mutationFn: async (f: typeof form) => {
      const { error } = await supabase.from("maintenance_requests").insert({
        organization_id: currentOrg!.id, title: f.title, description: f.description || null,
        priority: f.priority, category: f.category || null, unit_id: f.unit_id || null,
        estimated_cost: f.estimated_cost ? parseFloat(f.estimated_cost) : null, reported_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["maintenance"] }); toast.success("Ticket created"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: typeof form }) => {
      const updateData: any = {
        title: f.title, description: f.description || null, priority: f.priority,
        category: f.category || null, unit_id: f.unit_id || null,
        estimated_cost: f.estimated_cost ? parseFloat(f.estimated_cost) : null, status: f.status,
      };
      if (f.status === "resolved") updateData.completed_at = new Date().toISOString();
      const { error } = await supabase.from("maintenance_requests").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["maintenance"] }); toast.success("Ticket updated"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("maintenance_requests").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["maintenance"] }); toast.success("Ticket deleted"); setDeleteId(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const emptyForm = { title: "", description: "", priority: "medium", category: "", unit_id: "", estimated_cost: "", status: "open" };
  const openCreate = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (t: any) => {
    setForm({ title: t.title, description: t.description || "", priority: t.priority, category: t.category || "", unit_id: t.unit_id || "", estimated_cost: t.estimated_cost ? String(t.estimated_cost) : "", status: t.status });
    setEditingId(t.id); setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!form.title) { toast.error("Title required"); return; } editingId ? updateMutation.mutate({ id: editingId, f: form }) : createMutation.mutate(form); };

  const filtered = tickets.filter((t: any) => t.title.toLowerCase().includes(search.toLowerCase()));
  if (!currentOrg) return <AppLayout><div className="glass-card p-12 text-center"><p className="text-muted-foreground">Please create an organization first.</p></div></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="page-header">Maintenance</h1><p className="text-sm text-muted-foreground mt-1">Track and manage maintenance requests</p></div>
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Create Ticket</Button>
        </div>
        <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" /></div>

        {isLoading ? <div className="glass-card p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div> :
        filtered.length === 0 ? <div className="glass-card p-12 text-center"><Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No maintenance tickets.</p></div> :
        <div className="space-y-3">
          {filtered.map((t: any) => (
            <div key={t.id} className="glass-card p-4 flex items-center justify-between cursor-pointer" onClick={() => openEdit(t)}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.priority === "urgent" ? "bg-destructive/10 text-destructive" : t.priority === "high" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>
                  {t.priority === "urgent" ? <AlertTriangle className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">{t.title}</span>
                    {t.category && <span className="text-xs text-muted-foreground capitalize">• {t.category.replace("_", " ")}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{t.units ? `${t.units.unit_number} - ${t.units.buildings?.name}` : "No unit"}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={t.priority === "urgent" ? "destructive" : t.priority === "high" ? "secondary" : "outline"}>{t.priority}</Badge>
                <Badge variant={t.status === "resolved" ? "default" : t.status === "in_progress" ? "secondary" : "outline"}>{t.status.replace("_", " ")}</Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{new Date(t.created_at).toLocaleDateString()}</div>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
        </div>}
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Ticket" : "Create Ticket"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Priority</Label><Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Category</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Unit</Label><Select value={form.unit_id} onValueChange={(v) => setForm({ ...form, unit_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{unitsList.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.unit_number} - {u.buildings?.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Est. Cost (AED)</Label><Input type="number" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} /></div>
            </div>
            {editingId && (
              <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="resolved">Resolved</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent></Select></div>
            )}
            <DialogFooter><Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button><Button type="submit">{editingId ? "Update" : "Create"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border"><AlertDialogHeader><AlertDialogTitle>Delete Ticket?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Maintenance;

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
import { Building2, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Buildings = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", property_id: "", floors_count: "1", year_built: "" });
  const [search, setSearch] = useState("");

  const { data: properties = [] } = useQuery({
    queryKey: ["properties", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase.from("properties").select("id, name").eq("organization_id", currentOrg.id).order("name");
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const { data: buildings = [], isLoading } = useQuery({
    queryKey: ["buildings", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const propIds = properties.map((p: any) => p.id);
      if (propIds.length === 0) return [];
      const { data, error } = await supabase.from("buildings").select("*, properties(name)").in("property_id", propIds).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrg && properties.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: async (f: typeof form) => {
      const { error } = await supabase.from("buildings").insert({
        name: f.name,
        property_id: f.property_id,
        floors_count: parseInt(f.floors_count) || 1,
        year_built: f.year_built ? parseInt(f.year_built) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["buildings"] }); toast.success("Building created"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: typeof form }) => {
      const { error } = await supabase.from("buildings").update({
        name: f.name,
        property_id: f.property_id,
        floors_count: parseInt(f.floors_count) || 1,
        year_built: f.year_built ? parseInt(f.year_built) : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["buildings"] }); toast.success("Building updated"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("buildings").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["buildings"] }); toast.success("Building deleted"); setDeleteId(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const openCreate = () => { setForm({ name: "", property_id: "", floors_count: "1", year_built: "" }); setEditingId(null); setDialogOpen(true); };
  const openEdit = (b: any) => {
    setForm({ name: b.name, property_id: b.property_id, floors_count: String(b.floors_count || 1), year_built: b.year_built ? String(b.year_built) : "" });
    setEditingId(b.id); setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.property_id) { toast.error("Name and property are required"); return; }
    editingId ? updateMutation.mutate({ id: editingId, f: form }) : createMutation.mutate(form);
  };

  const filtered = buildings.filter((b: any) => b.name.toLowerCase().includes(search.toLowerCase()));

  if (!currentOrg) return <AppLayout><div className="glass-card p-12 text-center"><p className="text-muted-foreground">Please create an organization first.</p></div></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="page-header">Buildings</h1><p className="text-sm text-muted-foreground mt-1">Manage buildings within your properties</p></div>
          <Button onClick={openCreate} className="gap-2" disabled={properties.length === 0}><Plus className="w-4 h-4" /> Add Building</Button>
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search buildings..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" />
        </div>
        {isLoading ? (
          <div className="glass-card p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center"><p className="text-muted-foreground">No buildings yet. {properties.length === 0 ? "Create a property first." : "Add your first building."}</p></div>
        ) : (
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-border/30">
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Building</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Property</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Floors</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Year Built</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map((b: any) => (
                  <tr key={b.id} className="border-b border-border/20 hover:bg-accent/30 transition-colors">
                    <td className="p-4 font-medium text-sm text-foreground">{b.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{b.properties?.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{b.floors_count}</td>
                    <td className="p-4 text-sm text-muted-foreground">{b.year_built || "-"}</td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(b)}><Pencil className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => setDeleteId(b.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>{editingId ? "Edit Building" : "Add Building"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2">
              <Label>Property *</Label>
              <Select value={form.property_id} onValueChange={(v) => setForm({ ...form, property_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                <SelectContent>{properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Floors</Label><Input type="number" value={form.floors_count} onChange={(e) => setForm({ ...form, floors_count: e.target.value })} min="1" /></div>
              <div className="space-y-2"><Label>Year Built</Label><Input type="number" value={form.year_built} onChange={(e) => setForm({ ...form, year_built: e.target.value })} placeholder="2024" /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingId ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader><AlertDialogTitle>Delete Building?</AlertDialogTitle><AlertDialogDescription>This will delete the building and all units, rooms, and bed spaces within it.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Buildings;

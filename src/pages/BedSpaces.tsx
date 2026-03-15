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
import { BedDouble, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BED_TYPES = ["single", "upper", "lower", "double", "bunk"];

const BedSpaces = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ bed_number: "", room_id: "", bed_type: "single", monthly_rent: "" });
  const [search, setSearch] = useState("");

  const { data: roomsList = [] } = useQuery({
    queryKey: ["rooms-list", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data: props, error: e1 } = await supabase.from("properties").select("id").eq("organization_id", currentOrg.id);
      if (e1) throw e1;
      if (!props?.length) return [];
      const { data: blds, error: e2 } = await supabase.from("buildings").select("id").in("property_id", props.map((p: any) => p.id));
      if (e2) throw e2;
      if (!blds?.length) return [];
      const { data: units, error: e3 } = await supabase.from("units").select("id").in("building_id", blds.map((b: any) => b.id));
      if (e3) throw e3;
      if (!units?.length) return [];
      const { data, error: e4 } = await supabase.from("rooms").select("id, room_number, units(unit_number, buildings(name))").in("unit_id", units.map((u: any) => u.id)).order("room_number");
      if (e4) throw e4;
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const { data: bedSpaces = [], isLoading } = useQuery({
    queryKey: ["bed-spaces", currentOrg?.id],
    queryFn: async () => {
      if (!roomsList.length) return [];
      const { data, error } = await supabase.from("bed_spaces").select("*, rooms(room_number, units(unit_number, buildings(name)))").in("room_id", roomsList.map((r: any) => r.id)).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: roomsList.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: async (f: typeof form) => {
      const { error } = await supabase.from("bed_spaces").insert({ bed_number: f.bed_number, room_id: f.room_id, bed_type: f.bed_type, monthly_rent: f.monthly_rent ? parseFloat(f.monthly_rent) : null });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bed-spaces"] }); toast.success("Bed space created"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: typeof form }) => {
      const { error } = await supabase.from("bed_spaces").update({ bed_number: f.bed_number, room_id: f.room_id, bed_type: f.bed_type, monthly_rent: f.monthly_rent ? parseFloat(f.monthly_rent) : null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bed-spaces"] }); toast.success("Bed space updated"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("bed_spaces").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bed-spaces"] }); toast.success("Bed space deleted"); setDeleteId(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const openCreate = () => { setForm({ bed_number: "", room_id: "", bed_type: "single", monthly_rent: "" }); setEditingId(null); setDialogOpen(true); };
  const openEdit = (b: any) => { setForm({ bed_number: b.bed_number, room_id: b.room_id, bed_type: b.bed_type, monthly_rent: b.monthly_rent ? String(b.monthly_rent) : "" }); setEditingId(b.id); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };
  const handleSubmit = (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!form.bed_number || !form.room_id) { 
      toast.error("Bed number and room required"); 
      return; 
    } 
    if (editingId) {
      updateMutation.mutate({ id: editingId, f: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filtered = bedSpaces.filter((b: any) => b.bed_number.toLowerCase().includes(search.toLowerCase()));
  if (!currentOrg) return <AppLayout><div className="glass-card p-12 text-center"><p className="text-muted-foreground">Please create an organization first.</p></div></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="page-header">Bed Spaces</h1><p className="text-sm text-muted-foreground mt-1">Manage bed space inventory</p></div>
          <Button onClick={openCreate} className="gap-2" disabled={roomsList.length === 0}><Plus className="w-4 h-4" /> Add Bed Space</Button>
        </div>
        <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" /></div>

        {isLoading ? <div className="glass-card p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div> :
        filtered.length === 0 ? <div className="glass-card p-12 text-center"><BedDouble className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No bed spaces yet.</p></div> :
        <div className="glass-card overflow-hidden">
          <table className="w-full"><thead><tr className="border-b border-border/30">
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Bed</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Room</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Type</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Rent</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4"></th>
          </tr></thead><tbody>
            {filtered.map((b: any) => (
              <tr key={b.id} className="border-b border-border/20 hover:bg-accent/30">
                <td className="p-4 font-medium text-sm text-foreground">{b.bed_number}</td>
                <td className="p-4 text-sm text-muted-foreground">{b.rooms?.room_number} - {b.rooms?.units?.unit_number}</td>
                <td className="p-4 text-sm text-muted-foreground capitalize">{b.bed_type}</td>
                <td className="p-4 text-sm text-foreground">{b.monthly_rent ? `AED ${Number(b.monthly_rent).toLocaleString()}` : "-"}</td>
                <td className="p-4"><span className={`text-xs px-2 py-0.5 rounded-full ${b.status === "available" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>{b.status}</span></td>
                <td className="p-4"><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(b)}><Pencil className="w-3 h-3" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => setDeleteId(b.id)}><Trash2 className="w-3 h-3" /></Button></div></td>
              </tr>
            ))}
          </tbody></table>
        </div>}
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>{editingId ? "Edit Bed Space" : "Add Bed Space"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Bed Number *</Label><Input value={form.bed_number} onChange={(e) => setForm({ ...form, bed_number: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Room *</Label><Select value={form.room_id} onValueChange={(v) => setForm({ ...form, room_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{roomsList.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.room_number} - {r.units?.unit_number}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Type</Label><Select value={form.bed_type} onValueChange={(v) => setForm({ ...form, bed_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BED_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Rent (AED)</Label><Input type="number" value={form.monthly_rent} onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button><Button type="submit">{editingId ? "Update" : "Create"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border"><AlertDialogHeader><AlertDialogTitle>Delete Bed Space?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default BedSpaces;

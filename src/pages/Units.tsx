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
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DoorOpen, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const UNIT_TYPES = ["apartment", "studio", "villa", "townhouse", "penthouse", "duplex", "office", "shop", "warehouse"];

const Units = () => {
  const { currentOrg } = useOrganization();
  const { checkUsageLimit } = useSubscriptionAccess();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ unit_number: "", building_id: "", floor_number: "", unit_type: "apartment", bedrooms: "1", bathrooms: "1", area_sqft: "", monthly_rent: "" });
  const [search, setSearch] = useState("");

  const { data: buildings = [] } = useQuery({
    queryKey: ["buildings-list", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data: props } = await supabase.from("properties").select("id").eq("organization_id", currentOrg.id);
      if (!props || props.length === 0) return [];
      const { data } = await supabase.from("buildings").select("id, name, properties(name)").in("property_id", props.map((p: any) => p.id)).order("name");
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const { data: units = [], isLoading } = useQuery({
    queryKey: ["units", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg || buildings.length === 0) return [];
      const { data, error } = await supabase.from("units").select("*, buildings(name, properties(name))").in("building_id", buildings.map((b: any) => b.id)).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrg && buildings.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: async (f: typeof form) => {
      const usage = await checkUsageLimit("units");
      if (!usage.allowed) {
        throw new Error(`Plan limit reached. You can only manage up to ${usage.max} units. Please upgrade to add more.`);
      }

      const { error } = await supabase.from("units").insert({
        unit_number: f.unit_number, building_id: f.building_id, floor_number: f.floor_number ? parseInt(f.floor_number) : null,
        unit_type: f.unit_type, bedrooms: parseInt(f.bedrooms) || 1, bathrooms: parseInt(f.bathrooms) || 1,
        area_sqft: f.area_sqft ? parseFloat(f.area_sqft) : null, monthly_rent: f.monthly_rent ? parseFloat(f.monthly_rent) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["units"] }); toast.success("Unit created"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: typeof form }) => {
      const { error } = await supabase.from("units").update({
        unit_number: f.unit_number, building_id: f.building_id, floor_number: f.floor_number ? parseInt(f.floor_number) : null,
        unit_type: f.unit_type, bedrooms: parseInt(f.bedrooms) || 1, bathrooms: parseInt(f.bathrooms) || 1,
        area_sqft: f.area_sqft ? parseFloat(f.area_sqft) : null, monthly_rent: f.monthly_rent ? parseFloat(f.monthly_rent) : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["units"] }); toast.success("Unit updated"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("units").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["units"] }); toast.success("Unit deleted"); setDeleteId(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const openCreate = () => { setForm({ unit_number: "", building_id: "", floor_number: "", unit_type: "apartment", bedrooms: "1", bathrooms: "1", area_sqft: "", monthly_rent: "" }); setEditingId(null); setDialogOpen(true); };
  const openEdit = (u: any) => {
    setForm({ unit_number: u.unit_number, building_id: u.building_id, floor_number: u.floor_number ? String(u.floor_number) : "", unit_type: u.unit_type, bedrooms: String(u.bedrooms), bathrooms: String(u.bathrooms), area_sqft: u.area_sqft ? String(u.area_sqft) : "", monthly_rent: u.monthly_rent ? String(u.monthly_rent) : "" });
    setEditingId(u.id); setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!form.unit_number || !form.building_id) { toast.error("Unit number and building required"); return; } editingId ? updateMutation.mutate({ id: editingId, f: form }) : createMutation.mutate(form); };

  const filtered = units.filter((u: any) => u.unit_number.toLowerCase().includes(search.toLowerCase()));
  if (!currentOrg) return <AppLayout><div className="glass-card p-12 text-center"><p className="text-muted-foreground">Please create an organization first.</p></div></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="page-header">Units</h1><p className="text-sm text-muted-foreground mt-1">Manage property units</p></div>
          <Button onClick={openCreate} className="gap-2" disabled={buildings.length === 0}><Plus className="w-4 h-4" /> Add Unit</Button>
        </div>
        <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search units..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" /></div>
        {isLoading ? <div className="glass-card p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div> :
          filtered.length === 0 ? <div className="glass-card p-12 text-center"><p className="text-muted-foreground">No units yet.</p></div> :
            <div className="glass-card overflow-hidden">
              <table className="w-full"><thead><tr className="border-b border-border/30">
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Unit</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Building</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Type</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Floor</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Beds/Baths</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Rent</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4"></th>
              </tr></thead><tbody>
                  {filtered.map((u: any) => (
                    <tr key={u.id} className="border-b border-border/20 hover:bg-accent/30">
                      <td className="p-4 font-medium text-sm text-foreground">{u.unit_number}</td>
                      <td className="p-4 text-sm text-muted-foreground">{u.buildings?.name}</td>
                      <td className="p-4 text-sm text-muted-foreground capitalize">{u.unit_type}</td>
                      <td className="p-4 text-sm text-muted-foreground">{u.floor_number ?? "-"}</td>
                      <td className="p-4 text-sm text-muted-foreground">{u.bedrooms}B / {u.bathrooms}B</td>
                      <td className="p-4 text-sm text-foreground">{u.monthly_rent ? `AED ${Number(u.monthly_rent).toLocaleString()}` : "-"}</td>
                      <td className="p-4"><span className={`text-xs px-2 py-0.5 rounded-full ${u.status === "available" ? "bg-success/10 text-success" : u.status === "occupied" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>{u.status}</span></td>
                      <td className="p-4"><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(u)}><Pencil className="w-3 h-3" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => setDeleteId(u.id)}><Trash2 className="w-3 h-3" /></Button></div></td>
                    </tr>
                  ))}
                </tbody></table>
            </div>}
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Unit" : "Add Unit"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Unit Number *</Label><Input value={form.unit_number} onChange={(e) => setForm({ ...form, unit_number: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Building *</Label><Select value={form.building_id} onValueChange={(v) => setForm({ ...form, building_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{buildings.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name} - {b.properties?.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Type</Label><Select value={form.unit_type} onValueChange={(v) => setForm({ ...form, unit_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UNIT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Floor</Label><Input type="number" value={form.floor_number} onChange={(e) => setForm({ ...form, floor_number: e.target.value })} /></div>
              <div className="space-y-2"><Label>Area (sqft)</Label><Input type="number" value={form.area_sqft} onChange={(e) => setForm({ ...form, area_sqft: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Bedrooms</Label><Input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} min="0" /></div>
              <div className="space-y-2"><Label>Bathrooms</Label><Input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} min="0" /></div>
              <div className="space-y-2"><Label>Rent (AED)</Label><Input type="number" value={form.monthly_rent} onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button><Button type="submit">{editingId ? "Update" : "Create"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border"><AlertDialogHeader><AlertDialogTitle>Delete Unit?</AlertDialogTitle><AlertDialogDescription>This will delete the unit and all rooms and bed spaces within it.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Units;

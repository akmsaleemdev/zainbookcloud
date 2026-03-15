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
import { DoorOpen, Plus, Search, Pencil, Trash2, LayoutGrid, List } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RoomLayoutVisualizer } from "@/components/RoomLayoutVisualizer";

const ROOM_TYPES = ["single", "partition", "private", "master_bedroom", "shared", "capsule", "loft"];
const FURNISHING = ["furnished", "semi_furnished", "unfurnished"];

const Rooms = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ room_number: "", unit_id: "", room_type: "single", max_occupancy: "1", monthly_rent: "", furnishing: "furnished" });
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Get all units for this org
  const { data: unitsList = [] } = useQuery({
    queryKey: ["units-list", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data: props, error: e1 } = await supabase.from("properties").select("id").eq("organization_id", currentOrg.id);
      if (e1) throw e1;
      if (!props?.length) return [];
      const { data: blds, error: e2 } = await supabase.from("buildings").select("id").in("property_id", props.map((p: any) => p.id));
      if (e2) throw e2;
      if (!blds?.length) return [];
      const { data, error: e3 } = await supabase.from("units").select("id, unit_number, buildings(name)").in("building_id", blds.map((b: any) => b.id)).order("unit_number");
      if (e3) throw e3;
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms", currentOrg?.id],
    queryFn: async () => {
      if (!unitsList.length) return [];
      const { data, error } = await supabase.from("rooms").select("*, units(unit_number, buildings(name))").in("unit_id", unitsList.map((u: any) => u.id)).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: unitsList.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: async (f: typeof form) => {
      const { error } = await supabase.from("rooms").insert({ room_number: f.room_number, unit_id: f.unit_id, room_type: f.room_type, max_occupancy: parseInt(f.max_occupancy) || 1, monthly_rent: f.monthly_rent ? parseFloat(f.monthly_rent) : null, furnishing: f.furnishing });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["rooms"] }); toast.success("Room created"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: typeof form }) => {
      const { error } = await supabase.from("rooms").update({ room_number: f.room_number, unit_id: f.unit_id, room_type: f.room_type, max_occupancy: parseInt(f.max_occupancy) || 1, monthly_rent: f.monthly_rent ? parseFloat(f.monthly_rent) : null, furnishing: f.furnishing }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["rooms"] }); toast.success("Room updated"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("rooms").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["rooms"] }); toast.success("Room deleted"); setDeleteId(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const openCreate = () => { setForm({ room_number: "", unit_id: "", room_type: "single", max_occupancy: "1", monthly_rent: "", furnishing: "furnished" }); setEditingId(null); setDialogOpen(true); };
  const openEdit = (r: any) => {
    setForm({ room_number: r.room_number, unit_id: r.unit_id, room_type: r.room_type, max_occupancy: String(r.max_occupancy), monthly_rent: r.monthly_rent ? String(r.monthly_rent) : "", furnishing: r.furnishing });
    setEditingId(r.id); setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };
  const handleSubmit = (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!form.room_number || !form.unit_id) { 
      toast.error("Room number and unit required"); 
      return; 
    } 
    if (editingId) {
      updateMutation.mutate({ id: editingId, f: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filtered = rooms.filter((r: any) => r.room_number.toLowerCase().includes(search.toLowerCase()));
  if (!currentOrg) return <AppLayout><div className="glass-card p-12 text-center"><p className="text-muted-foreground">Please create an organization first.</p></div></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="page-header">Rooms</h1><p className="text-sm text-muted-foreground mt-1">Manage rooms and assignments</p></div>
          <Button onClick={openCreate} className="gap-2" disabled={unitsList.length === 0}><Plus className="w-4 h-4" /> Add Room</Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search rooms..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" />
          </div>
          <div className="flex bg-secondary/50 p-1 rounded-xl">
            <Button variant={viewMode === 'list' ? "default" : "ghost"} size="sm" onClick={() => setViewMode('list')} className={viewMode === 'list' ? "shadow-sm" : ""}>
              <List className="w-4 h-4 mr-2" /> List View
            </Button>
            <Button variant={viewMode === 'map' ? "default" : "ghost"} size="sm" onClick={() => setViewMode('map')} className={viewMode === 'map' ? "shadow-sm" : ""}>
              <LayoutGrid className="w-4 h-4 mr-2" /> Visual Map
            </Button>
          </div>
        </div>

        {isLoading ? <div className="glass-card p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div> :
        filtered.length === 0 ? <div className="glass-card p-12 text-center"><p className="text-muted-foreground">No rooms yet.</p></div> :
        viewMode === 'list' ? (
        <div className="glass-card overflow-hidden">
          <table className="w-full"><thead><tr className="border-b border-border/30">
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Room</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Unit</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Type</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Capacity</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Rent</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4"></th>
          </tr></thead><tbody>
            {filtered.map((r: any) => (
              <tr key={r.id} className="border-b border-border/20 hover:bg-accent/30">
                <td className="p-4 font-medium text-sm text-foreground">{r.room_number}</td>
                <td className="p-4 text-sm text-muted-foreground">{r.units?.unit_number} - {r.units?.buildings?.name}</td>
                <td className="p-4 text-sm text-muted-foreground capitalize">{r.room_type.replace("_", " ")}</td>
                <td className="p-4 text-sm text-muted-foreground">{r.max_occupancy}</td>
                <td className="p-4 text-sm text-foreground">{r.monthly_rent ? `AED ${Number(r.monthly_rent).toLocaleString()}` : "-"}</td>
                <td className="p-4"><span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "available" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>{r.status}</span></td>
                <td className="p-4"><div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/20" onClick={() => { setSelectedRoomId(r.room_number); setViewMode('map'); }}>
                    <LayoutGrid className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => setDeleteId(r.id)}><Trash2 className="w-3 h-3" /></Button>
                </div></td>
              </tr>
            ))}
          </tbody></table>
        </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[700px]">
            {/* Rooms List for Map View */}
            <div className="glass-card flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-border/50 bg-secondary/30 font-semibold">Select Room to Visualize</div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filtered.map((r: any) => (
                  <div 
                    key={r.id} 
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${selectedRoomId === r.room_number ? 'bg-primary/10 border-primary/50 text-foreground' : 'bg-secondary/20 border-border/50 text-muted-foreground hover:bg-secondary/50'}`}
                    onClick={() => setSelectedRoomId(r.room_number)}
                  >
                    <div className="font-semibold">{r.room_number}</div>
                    <div className="text-xs mt-1">{r.units?.buildings?.name}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* The Visualizer Canvas */}
            <div className="lg:col-span-3 h-full">
              {selectedRoomId ? (
                <RoomLayoutVisualizer roomId={selectedRoomId} />
              ) : (
                <div className="glass-card h-full flex flex-col items-center justify-center text-muted-foreground p-12 border-dashed">
                  <LayoutGrid className="w-12 h-12 mb-4 opacity-20" />
                  <p>Select a room from the left to visualize its layout and bed spaces.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>{editingId ? "Edit Room" : "Add Room"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Room Number *</Label><Input value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Unit *</Label><Select value={form.unit_id} onValueChange={(v) => setForm({ ...form, unit_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{unitsList.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.unit_number} - {u.buildings?.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Type</Label><Select value={form.room_type} onValueChange={(v) => setForm({ ...form, room_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROOM_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Furnishing</Label><Select value={form.furnishing} onValueChange={(v) => setForm({ ...form, furnishing: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FURNISHING.map((f) => <SelectItem key={f} value={f}>{f.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Max Occupancy</Label><Input type="number" value={form.max_occupancy} onChange={(e) => setForm({ ...form, max_occupancy: e.target.value })} min="1" /></div>
            </div>
            <div className="space-y-2"><Label>Monthly Rent (AED)</Label><Input type="number" value={form.monthly_rent} onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button><Button type="submit">{editingId ? "Update" : "Create"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border"><AlertDialogHeader><AlertDialogTitle>Delete Room?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Rooms;

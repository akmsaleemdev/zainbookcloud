import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, Plus, Search, Pencil, Trash2, MapPin, Home, Image, Upload, X, Map } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const EMIRATES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Umm Al Quwain", "Fujairah"];
const PROPERTY_TYPES = ["residential", "commercial", "mixed", "industrial", "staff_accommodation"];

interface PropForm {
  name: string; name_ar: string; property_type: string; address: string;
  emirate: string; city: string; area: string; community: string;
  latitude: string; longitude: string;
}

const emptyForm: PropForm = { name: "", name_ar: "", property_type: "residential", address: "", emirate: "", city: "", area: "", community: "", latitude: "", longitude: "" };

const Properties = () => {
  const { currentOrg } = useOrganization();
  const { checkUsageLimit } = useSubscriptionAccess();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PropForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [detailProp, setDetailProp] = useState<any>(null);
  const [detailTab, setDetailTab] = useState("gallery");

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data, error } = await supabase.from("properties").select("*").eq("organization_id", currentOrg.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const { data: images = [] } = useQuery({
    queryKey: ["property-images", detailProp?.id],
    queryFn: async () => {
      if (!detailProp) return [];
      const { data } = await supabase.from("property_images").select("*").eq("property_id", detailProp.id).order("sort_order");
      return data || [];
    },
    enabled: !!detailProp,
  });

  const createMutation = useMutation({
    mutationFn: async (formData: PropForm) => {
      const usage = await checkUsageLimit("properties");
      if (!usage.allowed) {
        throw new Error(`Plan limit reached. You can only manage up to ${usage.max} properties on your current plan. Please upgrade to add more.`);
      }

      const { latitude, longitude, ...rest } = formData;
      const { error } = await supabase.from("properties").insert({
        ...rest, organization_id: currentOrg!.id,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["properties"] }); toast.success("Property created"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: PropForm }) => {
      const { latitude, longitude, ...rest } = formData;
      const { error } = await supabase.from("properties").update({
        ...rest,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["properties"] }); toast.success("Property updated"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("properties").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["properties"] }); toast.success("Property deleted"); setDeleteId(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const uploadImage = async (file: File) => {
    if (!detailProp) return;
    const ext = file.name.split('.').pop();
    const path = `properties/${detailProp.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);
    if (error) { toast.error("Upload failed"); return; }
    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
    const { error: insertErr } = await supabase.from("property_images").insert({
      property_id: detailProp.id, image_url: urlData.publicUrl,
    } as any);
    if (insertErr) { toast.error(insertErr.message); return; }
    queryClient.invalidateQueries({ queryKey: ["property-images"] });
    toast.success("Image uploaded");
  };

  const deleteImage = async (id: string) => {
    await supabase.from("property_images").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["property-images"] });
  };

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (p: any) => {
    setForm({
      name: p.name, name_ar: p.name_ar || "", property_type: p.property_type,
      address: p.address || "", emirate: p.emirate, city: p.city || "",
      area: p.area || "", community: p.community || "",
      latitude: p.latitude ? String(p.latitude) : "", longitude: p.longitude ? String(p.longitude) : "",
    });
    setEditingId(p.id); setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.emirate) { toast.error("Name and emirate are required"); return; }
    if (editingId) {
      updateMutation.mutate({ id: editingId, formData: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filtered = properties.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.emirate || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.area || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!currentOrg) {
    return <AppLayout><div className="glass-card p-12 text-center"><Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Please create an organization first.</p></div></AppLayout>;
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="page-header">Properties</h1><p className="text-sm text-muted-foreground mt-1">Manage properties for {currentOrg.name}</p></div>
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Property</Button>
        </div>
        <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search properties..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" /></div>

        {isLoading ? <div className="glass-card p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div> :
          filtered.length === 0 ? <div className="glass-card p-12 text-center"><Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No properties yet.</p><Button onClick={openCreate} className="mt-4 gap-2"><Plus className="w-4 h-4" /> Add Property</Button></div> :
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p: any) => (
                <div key={p.id} className="glass-card p-5 cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all" onClick={() => { setDetailProp(p); setDetailTab("gallery"); }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  <span className="text-xs text-primary capitalize">{(p.property_type || "residential").replace("_", " ")}</span>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="w-3 h-3" />{[p.area, p.city, p.emirate].filter(Boolean).join(", ")}</div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                    <span className="text-xs text-muted-foreground">{p.total_units || 0} units</span>
                    {p.latitude && <span className="text-xs text-muted-foreground flex items-center gap-1"><Map className="w-3 h-3" /> GPS</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}>
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>}
      </motion.div>

      {/* Property Detail Dialog */}
      <Dialog open={!!detailProp} onOpenChange={() => setDetailProp(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{detailProp?.name} — Details</DialogTitle></DialogHeader>
          <Tabs value={detailTab} onValueChange={setDetailTab}>
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="gallery"><Image className="w-3.5 h-3.5 mr-1.5" />Gallery</TabsTrigger>
              <TabsTrigger value="map"><Map className="w-3.5 h-3.5 mr-1.5" />Location</TabsTrigger>
            </TabsList>
            <TabsContent value="gallery" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{images.length} image(s)</p>
                <label>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
                  <Button variant="outline" size="sm" className="gap-2 cursor-pointer" asChild><span><Upload className="w-3.5 h-3.5" /> Upload Image</span></Button>
                </label>
              </div>
              {images.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
                  <Image className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No images yet. Upload property photos.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((img: any) => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden aspect-video bg-muted">
                      <img src={img.image_url} alt={img.caption || "Property"} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect fill='%23e5e7eb' width='200' height='150'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14'%3EImage%3C/text%3E%3C/svg%3E"; }} />
                      <button onClick={() => deleteImage(img.id)} className="absolute top-2 right-2 w-6 h-6 bg-destructive/80 text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="map" className="space-y-4">
              {detailProp?.latitude && detailProp?.longitude ? (
                <div className="rounded-xl overflow-hidden border border-border">
                  <iframe
                    title="Property Location"
                    width="100%" height="400"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://www.google.com/maps?q=${detailProp.latitude},${detailProp.longitude}&z=16&output=embed`}
                  />
                  <div className="p-3 bg-muted/50 text-sm text-muted-foreground">
                    Lat: {detailProp.latitude} • Lng: {detailProp.longitude}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
                  <Map className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No coordinates set. Edit the property to add latitude/longitude.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Property" : "Add Property"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Arabic Name</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} dir="rtl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.property_type} onValueChange={(v) => setForm({ ...form, property_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Emirate *</Label>
                <Select value={form.emirate} onValueChange={(v) => setForm({ ...form, emirate: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{EMIRATES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div className="space-y-2"><Label>Area</Label><Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></div>
              <div className="space-y-2"><Label>Community</Label><Input value={form.community} onChange={(e) => setForm({ ...form, community: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="border-t border-border/30 pt-4">
              <p className="text-sm font-medium mb-3 flex items-center gap-1.5"><Map className="w-4 h-4" /> Geo Location</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Latitude</Label><Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="25.2048" /></div>
                <div className="space-y-2"><Label>Longitude</Label><Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="55.2708" /></div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingId ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader><AlertDialogTitle>Delete Property?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the property and all associated data.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Properties;

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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, Wifi, Dumbbell, Car, ShieldCheck, Waves, TreePine, Zap, Coffee } from "lucide-react";

const categories = [
  { value: "general", label: "General" },
  { value: "fitness", label: "Fitness & Sports" },
  { value: "parking", label: "Parking" },
  { value: "security", label: "Security" },
  { value: "pool", label: "Pool & Spa" },
  { value: "outdoor", label: "Outdoor" },
  { value: "utilities", label: "Utilities" },
  { value: "lounge", label: "Lounge & Social" },
];

const categoryIcons: Record<string, any> = {
  general: Wifi, fitness: Dumbbell, parking: Car, security: ShieldCheck,
  pool: Waves, outdoor: TreePine, utilities: Zap, lounge: Coffee,
};

const defaultForm = {
  name: "", name_ar: "", category: "general", description: "",
  is_paid: false, price: "", billing_frequency: "monthly",
  status: "active", property_id: "",
};

const Amenities = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  const orgId = currentOrg?.id;

  const { data: amenities = [], isLoading } = useQuery({
    queryKey: ["amenities", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("amenities")
        .select("*, properties(name)")
        .eq("organization_id", orgId)
        .order("category")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["properties-list", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("properties").select("id, name").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org");
      const payload = {
        organization_id: orgId,
        name: form.name,
        name_ar: form.name_ar || null,
        category: form.category,
        description: form.description || null,
        is_paid: form.is_paid,
        price: form.is_paid && form.price ? parseFloat(form.price) : null,
        billing_frequency: form.billing_frequency,
        status: form.status,
        property_id: form.property_id || null,
      };
      if (editId) {
        const { error } = await supabase.from("amenities").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("amenities").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amenities"] });
      setOpen(false); setEditId(null); setForm(defaultForm);
      toast({ title: editId ? "Amenity updated" : "Amenity added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("amenities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amenities"] });
      toast({ title: "Amenity deleted" });
    },
  });

  const openEdit = (a: any) => {
    setEditId(a.id);
    setForm({
      name: a.name, name_ar: a.name_ar || "", category: a.category || "general",
      description: a.description || "", is_paid: a.is_paid || false,
      price: String(a.price || ""), billing_frequency: a.billing_frequency || "monthly",
      status: a.status || "active", property_id: a.property_id || "",
    });
    setOpen(true);
  };

  const filtered = amenities.filter((a: any) => {
    const matchSearch = a.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || a.category === filterCat;
    return matchSearch && matchCat;
  });

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
            <h1 className="page-header flex items-center gap-2"><Wifi className="w-6 h-6" /> Amenities</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage property and room amenities</p>
          </div>
          <Button onClick={() => { setEditId(null); setForm(defaultForm); setOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Add Amenity
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search amenities..." className="pl-10 bg-secondary/50 border-border/50" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="glass-card p-12 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center text-muted-foreground">No amenities found. Click "Add Amenity" to get started.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((a: any) => {
              const Icon = categoryIcons[a.category] || Wifi;
              return (
                <Card key={a.id} className="glass-card hover:border-primary/30 transition-colors">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">{a.name}</CardTitle>
                        <p className="text-xs text-muted-foreground capitalize">{a.category}</p>
                      </div>
                    </div>
                    <Badge variant={a.status === "active" ? "default" : "secondary"}>{a.status}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {a.description && <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>}
                    {a.properties?.name && <p className="text-xs text-muted-foreground">📍 {a.properties.name}</p>}
                    <div className="flex items-center justify-between">
                      <div>
                        {a.is_paid ? (
                          <span className="text-sm font-semibold text-primary">AED {Number(a.price).toLocaleString()}/{a.billing_frequency === "monthly" ? "mo" : a.billing_frequency}</span>
                        ) : (
                          <Badge variant="outline" className="text-xs">Free</Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(a.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit" : "Add"} Amenity</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Swimming Pool" />
            </div>
            <div className="space-y-2">
              <Label>Name (Arabic)</Label>
              <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Property</Label>
              <Select value={form.property_id} onValueChange={(v) => setForm({ ...form, property_id: v })}>
                <SelectTrigger><SelectValue placeholder="All properties" /></SelectTrigger>
                <SelectContent>
                  {properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <Switch checked={form.is_paid} onCheckedChange={(v) => setForm({ ...form, is_paid: v })} />
              <Label>Paid amenity</Label>
            </div>
            {form.is_paid && (
              <>
                <div className="space-y-2">
                  <Label>Price (AED)</Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Billing Frequency</Label>
                  <Select value={form.billing_frequency} onValueChange={(v) => setForm({ ...form, billing_frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One Time</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.name}>
              {editId ? "Update" : "Add"} Amenity
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Amenities;

import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building, Plus, Search, Filter, Pencil, Trash2, MapPin, Mail, Phone, MoreHorizontal, Globe, DollarSign } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const EMIRATES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Umm Al Quwain", "Fujairah"];
const CURRENCIES = ["AED", "USD", "EUR", "GBP", "SAR", "QAR", "BHD", "KWD", "OMR"];
const LANGUAGES = [{ value: "en", label: "English" }, { value: "ar", label: "Arabic" }];
const COUNTRIES = ["UAE", "Saudi Arabia", "Qatar", "Bahrain", "Kuwait", "Oman", "Egypt", "Jordan"];
const TIMEZONES = ["Asia/Dubai", "Asia/Riyadh", "Asia/Qatar", "Asia/Bahrain", "Asia/Kuwait", "Asia/Muscat", "Africa/Cairo"];

interface OrgForm {
  name: string;
  name_ar: string;
  trade_license: string;
  email: string;
  phone: string;
  address: string;
  emirate: string;
  vat_number: string;
  vat_enabled: boolean;
  vat_rate: string;
  currency: string;
  language: string;
  country: string;
  timezone: string;
}

const emptyForm: OrgForm = { name: "", name_ar: "", trade_license: "", email: "", phone: "", address: "", emirate: "", vat_number: "", vat_enabled: true, vat_rate: "5", currency: "AED", language: "en", country: "UAE", timezone: "Asia/Dubai" };

const Organizations = () => {
  const { user } = useAuth();
  const { refetch: refetchContext } = useOrganization();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OrgForm>(emptyForm);
  const [search, setSearch] = useState("");

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      // Get org IDs the user is a member of
      const { data: memberships } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user!.id);

      if (!memberships || memberships.length === 0) return [];

      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .in("id", memberships.map(m => m.organization_id))
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (formData: OrgForm) => {
      const { vat_rate, vat_enabled, ...rest } = formData;
      const payload = { ...rest, vat_rate: parseFloat(vat_rate) || 5, vat_enabled, created_by: user!.id };
      const { data: org, error } = await supabase
        .from("organizations")
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;

      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({ organization_id: org.id, user_id: user!.id, role: "organization_admin" as any });
      if (memberError) throw memberError;

      return org;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      refetchContext();
      toast.success("Organization created successfully");
      closeDialog();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: OrgForm }) => {
      const { vat_rate, vat_enabled, ...rest } = formData;
      const payload = { ...rest, vat_rate: parseFloat(vat_rate) || 5, vat_enabled };
      const { error } = await supabase.from("organizations").update(payload as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      refetchContext();
      toast.success("Organization updated");
      closeDialog();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("organizations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      refetchContext();
      toast.success("Organization deleted");
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (org: any) => {
    setForm({
      name: org.name, name_ar: org.name_ar || "", trade_license: org.trade_license || "",
      email: org.email || "", phone: org.phone || "", address: org.address || "", emirate: org.emirate || "",
      vat_number: org.vat_number || "", vat_enabled: org.vat_enabled !== false, vat_rate: String(org.vat_rate || 5),
      currency: org.currency || "AED", language: org.language || "en", country: org.country || "UAE", timezone: org.timezone || "Asia/Dubai",
    });
    setEditingId(org.id);
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Organization name is required"); return; }
    if (editingId) {
      updateMutation.mutate({ id: editingId, formData: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filtered = orgs.filter((o: any) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    (o.emirate || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Organizations</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your organizations and companies</p>
          </div>
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Organization</Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search organizations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" />
          </div>
        </div>

        {isLoading ? (
          <div className="glass-card p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No organizations yet. Create your first organization to get started.</p>
            <Button onClick={openCreate} className="mt-4 gap-2"><Plus className="w-4 h-4" /> Create Organization</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((org: any) => (
              <div key={org.id} className="glass-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(org)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(org.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground">{org.name}</h3>
                {org.name_ar && <p className="text-sm text-muted-foreground" dir="rtl">{org.name_ar}</p>}
                <div className="space-y-1 mt-3">
                  {org.emirate && <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="w-3 h-3" />{org.emirate}</div>}
                  {org.email && <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Mail className="w-3 h-3" />{org.email}</div>}
                  {org.phone && <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Phone className="w-3 h-3" />{org.phone}</div>}
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><DollarSign className="w-3 h-3" />{org.currency || "AED"}</div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Globe className="w-3 h-3" />{org.country || "UAE"} • {org.timezone || "Asia/Dubai"}</div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
                  {org.trade_license && <span className="text-xs text-muted-foreground">License: {org.trade_license}</span>}
                  <span className="text-xs text-muted-foreground">VAT: {org.vat_enabled !== false ? `${org.vat_rate || 5}%` : "Disabled"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Organization" : "Create Organization"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name (English) *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Company Name" required />
              </div>
              <div className="space-y-2">
                <Label>Name (Arabic)</Label>
                <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} placeholder="اسم الشركة" dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trade License</Label>
                <Input value={form.trade_license} onChange={(e) => setForm({ ...form, trade_license: e.target.value })} placeholder="License number" />
              </div>
              <div className="space-y-2">
                <Label>Emirate</Label>
                <Select value={form.emirate} onValueChange={(v) => setForm({ ...form, emirate: v })}>
                  <SelectTrigger><SelectValue placeholder="Select emirate" /></SelectTrigger>
                  <SelectContent>
                    {EMIRATES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="info@company.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+971 XX XXX XXXX" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
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

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the organization and all associated data. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Organizations;

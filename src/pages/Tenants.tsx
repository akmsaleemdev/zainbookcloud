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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Plus, Search, Pencil, Trash2, Mail, Phone, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

const Tenants = () => {
  const { currentOrg } = useOrganization();
  const { checkUsageLimit } = useSubscriptionAccess();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", nationality: "", emirates_id: "",
    passport_number: "", visa_number: "", visa_expiry: "", occupation: "",
    employer: "", emergency_contact: "", status: "active",
  });
  const [search, setSearch] = useState("");

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data, error } = await supabase.from("tenants").select("*").eq("organization_id", currentOrg.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const createMutation = useMutation({
    mutationFn: async (f: typeof form) => {
      const usage = await checkUsageLimit("tenants");
      if (!usage.allowed) {
        throw new Error(`Plan limit reached. You can only manage up to ${usage.max} tenants. Please upgrade to add more.`);
      }

      const { error } = await supabase.from("tenants").insert({
        ...f, organization_id: currentOrg!.id,
        visa_expiry: f.visa_expiry || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tenants"] }); toast.success("Tenant added"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: typeof form }) => {
      const { error } = await supabase.from("tenants").update({
        ...f, visa_expiry: f.visa_expiry || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tenants"] }); toast.success("Tenant updated"); closeDialog(); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("tenants").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tenants"] }); toast.success("Tenant removed"); setDeleteId(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const emptyForm = { full_name: "", email: "", phone: "", nationality: "", emirates_id: "", passport_number: "", visa_number: "", visa_expiry: "", occupation: "", employer: "", emergency_contact: "", status: "active" };
  const openCreate = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (t: any) => {
    setForm({
      full_name: t.full_name, email: t.email || "", phone: t.phone || "", nationality: t.nationality || "",
      emirates_id: t.emirates_id || "", passport_number: t.passport_number || "", visa_number: t.visa_number || "",
      visa_expiry: t.visa_expiry || "", occupation: t.occupation || "", employer: t.employer || "",
      emergency_contact: t.emergency_contact || "", status: t.status || "active",
    });
    setEditingId(t.id); setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!form.full_name) { toast.error("Full name required"); return; } editingId ? updateMutation.mutate({ id: editingId, f: form }) : createMutation.mutate(form); };

  const filtered = tenants.filter((t: any) =>
    t.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (t.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.phone || "").includes(search)
  );

  if (!currentOrg) return <AppLayout><div className="glass-card p-12 text-center"><p className="text-muted-foreground">Please create an organization first.</p></div></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="page-header">Tenants</h1><p className="text-sm text-muted-foreground mt-1">Manage tenant profiles for {currentOrg.name}</p></div>
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Tenant</Button>
        </div>
        <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search tenants..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" /></div>

        {isLoading ? <div className="glass-card p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div> :
          filtered.length === 0 ? <div className="glass-card p-12 text-center"><Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No tenants yet.</p><Button onClick={openCreate} className="mt-4 gap-2"><Plus className="w-4 h-4" /> Add Tenant</Button></div> :
            <div className="glass-card overflow-hidden overflow-x-auto">
              <table className="w-full"><thead><tr className="border-b border-border/30">
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Tenant</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Contact</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Nationality</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Emirates ID</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Visa Expiry</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4"></th>
              </tr></thead><tbody>
                  {filtered.map((t: any) => (
                    <tr key={t.id} className="border-b border-border/20 hover:bg-accent/30 transition-colors cursor-pointer">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">{t.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</div>
                          <div><span className="font-medium text-sm text-foreground">{t.full_name}</span>{t.occupation && <p className="text-xs text-muted-foreground">{t.occupation}</p>}</div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {t.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{t.email}</div>}
                        {t.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{t.phone}</div>}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{t.nationality || "-"}</td>
                      <td className="p-4 text-sm text-muted-foreground font-mono">{t.emirates_id || "-"}</td>
                      <td className="p-4 text-sm text-muted-foreground">{t.visa_expiry ? <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(t.visa_expiry).toLocaleDateString()}</div> : "-"}</td>
                      <td className="p-4"><Badge variant={t.status === "active" ? "default" : t.status === "notice" ? "secondary" : "destructive"}>{t.status}</Badge></td>
                      <td className="p-4"><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}><Pencil className="w-3 h-3" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => setDeleteId(t.id)}><Trash2 className="w-3 h-3" /></Button></div></td>
                    </tr>
                  ))}
                </tbody></table>
            </div>}
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Tenant" : "Add Tenant"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full Name *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+971 XX XXX XXXX" /></div>
              <div className="space-y-2"><Label>Nationality</Label><Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Emirates ID</Label><Input value={form.emirates_id} onChange={(e) => setForm({ ...form, emirates_id: e.target.value })} placeholder="784-XXXX-XXXXXXX-X" /></div>
              <div className="space-y-2"><Label>Passport Number</Label><Input value={form.passport_number} onChange={(e) => setForm({ ...form, passport_number: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Visa Number</Label><Input value={form.visa_number} onChange={(e) => setForm({ ...form, visa_number: e.target.value })} /></div>
              <div className="space-y-2"><Label>Visa Expiry</Label><Input type="date" value={form.visa_expiry} onChange={(e) => setForm({ ...form, visa_expiry: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Occupation</Label><Input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} /></div>
              <div className="space-y-2"><Label>Employer</Label><Input value={form.employer} onChange={(e) => setForm({ ...form, employer: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Emergency Contact</Label><Input value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="notice">Notice</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="blacklisted">Blacklisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button><Button type="submit">{editingId ? "Update" : "Create"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border"><AlertDialogHeader><AlertDialogTitle>Delete Tenant?</AlertDialogTitle><AlertDialogDescription>This will permanently remove the tenant record.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Tenants;

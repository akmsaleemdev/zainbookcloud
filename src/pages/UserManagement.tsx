import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, ShieldCheck, Pencil, Trash2, Mail, UserPlus } from "lucide-react";
import { Constants } from "@/integrations/supabase/types";

const roles = Constants.public.Enums.app_role;

const roleColors: Record<string, string> = {
  super_admin: "bg-destructive/20 text-destructive",
  organization_admin: "bg-primary/20 text-primary",
  property_owner: "bg-emerald-500/20 text-emerald-400",
  property_manager: "bg-blue-500/20 text-blue-400",
  staff: "bg-muted text-muted-foreground",
  accountant: "bg-orange-500/20 text-orange-400",
  maintenance_staff: "bg-yellow-500/20 text-yellow-400",
  tenant: "bg-muted text-muted-foreground",
};

const UserManagement = () => {
  const { currentOrg } = useOrganization();
  const { checkUsageLimit } = useSubscriptionAccess();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ user_id: "", role: "staff" as string });
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", full_name: "", role: "staff" });

  const orgId = currentOrg?.id;

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["org-members-mgmt", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name, phone");
      if (error) throw error;
      return data || [];
    },
  });

  const getProfile = (userId: string) => profiles.find((p: any) => p.user_id === userId);
  const getProfileName = (userId: string) => getProfile(userId)?.full_name || userId.slice(0, 8) + "...";

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org");
      if (editId) {
        const { error } = await supabase.from("organization_members").update({ role: form.role as any }).eq("id", editId);
        if (error) throw error;
      } else {
        const usage = await checkUsageLimit("users");
        if (!usage.allowed) {
          throw new Error(`Plan limit reached. You can only manage up to ${usage.max} users. Please upgrade to add more.`);
        }

        const { error } = await supabase.from("organization_members").insert({
          organization_id: orgId,
          user_id: form.user_id,
          role: form.role as any,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members-mgmt"] });
      setOpen(false); setEditId(null); setForm({ user_id: "", role: "staff" });
      toast({ title: editId ? "Member updated" : "Member added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("organization_members").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members-mgmt"] });
      toast({ title: "Member status updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("organization_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members-mgmt"] });
      toast({ title: "Member removed" });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const usage = await checkUsageLimit("users");
      if (!usage.allowed) {
        throw new Error(`Plan limit reached. You can only manage up to ${usage.max} users. Please upgrade to invite more.`);
      }

      // Sign up the user with email (they'll get a confirmation email)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: inviteForm.email,
        password: crypto.randomUUID().slice(0, 16) + "Aa1!",
        options: { data: { full_name: inviteForm.full_name } },
      });
      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Failed to create user");

      // Add to organization
      const { error } = await supabase.from("organization_members").insert({
        organization_id: orgId!,
        user_id: signUpData.user.id,
        role: inviteForm.role as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members-mgmt"] });
      setInviteOpen(false);
      setInviteForm({ email: "", full_name: "", role: "staff" });
      toast({ title: "Invitation sent", description: "The user will receive a confirmation email." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = members.filter((m: any) =>
    getProfileName(m.user_id).toLowerCase().includes(search.toLowerCase()) ||
    m.role?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = members.filter((m: any) => m.is_active).length;

  if (!orgId) {
    return <AppLayout><div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Please select an organization first.</p></div></AppLayout>;
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header flex items-center gap-2"><ShieldCheck className="w-6 h-6" /> User Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage organization members and roles</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditId(null); setForm({ user_id: "", role: "staff" }); setOpen(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> Add by ID
            </Button>
            <Button onClick={() => { setInviteForm({ email: "", full_name: "", role: "staff" }); setInviteOpen(true); }} className="gap-2">
              <Mail className="w-4 h-4" /> Invite by Email
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{members.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Members</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">{activeCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Active</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{members.length - activeCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Inactive</p>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search members..." className="pl-10 bg-secondary/50 border-border/50" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No members found.</TableCell></TableRow>
              ) : filtered.map((m: any) => {
                const prof = getProfile(m.user_id);
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{prof?.full_name || m.user_id.slice(0, 8) + "..."}</span>
                        {prof?.phone && <p className="text-xs text-muted-foreground">{prof.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell><Badge className={roleColors[m.role] || ""}>{m.role?.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell>
                      <Switch
                        checked={m.is_active}
                        onCheckedChange={(v) => toggleActiveMutation.mutate({ id: m.id, active: v })}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditId(m.id); setForm({ user_id: m.user_id, role: m.role }); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(m.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {/* Add by ID Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Edit Member Role" : "Add Member"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {!editId && (
              <div className="space-y-2">
                <Label>User ID</Label>
                <Input value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} placeholder="Paste user UUID" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!editId && !form.user_id}>{editId ? "Update" : "Add"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite by Email Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" /> Invite Member</DialogTitle>
            <DialogDescription>Send an email invitation to join this organization</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={inviteForm.full_name} onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteForm.role} onValueChange={(v) => setInviteForm({ ...inviteForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.filter(r => r !== "super_admin").map((r) => (
                    <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={() => inviteMutation.mutate()} disabled={!inviteForm.email || inviteMutation.isPending}>
              {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default UserManagement;

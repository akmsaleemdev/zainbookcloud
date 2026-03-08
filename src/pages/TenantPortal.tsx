import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Users, FileText, CreditCard, Wrench, Home, Plus, CalendarDays, AlertCircle, FolderOpen, Download, ExternalLink } from "lucide-react";
import { format, differenceInDays } from "date-fns";

const TenantPortal = () => {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [maintenanceDialog, setMaintenanceDialog] = useState(false);
  const [reqForm, setReqForm] = useState({ title: "", description: "", category: "general", priority: "medium" });

  const { data: tenantRecord } = useQuery({
    queryKey: ["tenant-self", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("tenants").select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: leases = [] } = useQuery({
    queryKey: ["tenant-leases", tenantRecord?.id],
    queryFn: async () => {
      if (!tenantRecord) return [];
      const { data } = await supabase.from("leases").select("*, units(unit_number, buildings(name))").eq("tenant_id", tenantRecord.id).order("start_date", { ascending: false });
      return data || [];
    },
    enabled: !!tenantRecord,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["tenant-invoices", tenantRecord?.id],
    queryFn: async () => {
      if (!tenantRecord) return [];
      const { data } = await supabase.from("invoices").select("*").eq("tenant_id", tenantRecord.id).order("due_date", { ascending: false });
      return data || [];
    },
    enabled: !!tenantRecord,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["tenant-payments", tenantRecord?.id],
    queryFn: async () => {
      if (!tenantRecord) return [];
      const { data } = await supabase.from("payments").select("*").eq("tenant_id", tenantRecord.id).order("payment_date", { ascending: false });
      return data || [];
    },
    enabled: !!tenantRecord,
  });

  const { data: maintenanceReqs = [] } = useQuery({
    queryKey: ["tenant-maintenance", tenantRecord?.id],
    queryFn: async () => {
      if (!tenantRecord) return [];
      const { data } = await supabase.from("maintenance_requests").select("*").eq("reported_by", tenantRecord.user_id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!tenantRecord,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["tenant-documents", tenantRecord?.id],
    queryFn: async () => {
      if (!tenantRecord) return [];
      const { data } = await supabase.from("documents").select("*").eq("tenant_id", tenantRecord.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!tenantRecord,
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ["tenant-complaints", tenantRecord?.id, currentOrg?.id],
    queryFn: async () => {
      if (!tenantRecord || !currentOrg) return [];
      const { data } = await supabase.from("complaints").select("*").eq("tenant_id", tenantRecord.id).eq("organization_id", currentOrg.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!tenantRecord && !!currentOrg,
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: async () => {
      if (!currentOrg || !user) throw new Error("Missing context");
      const { error } = await supabase.from("maintenance_requests").insert({
        organization_id: currentOrg.id,
        reported_by: user.id,
        unit_id: activeLease?.unit_id || null,
        ...reqForm,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-maintenance"] });
      setMaintenanceDialog(false);
      setReqForm({ title: "", description: "", category: "general", priority: "medium" });
      toast({ title: "Maintenance request submitted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const activeLease = leases.find((l: any) => l.status === "active");
  const pendingInvoices = invoices.filter((i: any) => i.status === "pending" || i.status === "overdue");
  const totalPaid = payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const daysToExpiry = activeLease ? differenceInDays(new Date(activeLease.end_date), new Date()) : 0;
  const leaseProgress = activeLease ? Math.round(
    ((differenceInDays(new Date(), new Date(activeLease.start_date))) / 
    (differenceInDays(new Date(activeLease.end_date), new Date(activeLease.start_date)))) * 100
  ) : 0;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header flex items-center gap-2"><Users className="w-6 h-6" /> Tenant Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">Your lease, payments, documents, and requests</p>
          </div>
          {tenantRecord && (
            <Button onClick={() => setMaintenanceDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Maintenance Request
            </Button>
          )}
        </div>

        {!tenantRecord ? (
          <div className="glass-card p-12 text-center text-muted-foreground">
            No tenant profile linked to your account. Please contact your property manager.
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="glass-card"><CardContent className="pt-6 text-center"><Home className="w-7 h-7 mx-auto text-primary mb-2" /><div className="text-lg font-bold">{activeLease ? "Active" : "No Lease"}</div><p className="text-xs text-muted-foreground">Lease Status</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="pt-6 text-center"><CreditCard className="w-7 h-7 mx-auto text-emerald-400 mb-2" /><div className="text-lg font-bold">AED {activeLease ? Number(activeLease.monthly_rent).toLocaleString() : "0"}</div><p className="text-xs text-muted-foreground">Monthly Rent</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="pt-6 text-center"><FileText className="w-7 h-7 mx-auto text-orange-400 mb-2" /><div className="text-lg font-bold">{pendingInvoices.length}</div><p className="text-xs text-muted-foreground">Pending Invoices</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="pt-6 text-center"><Wrench className="w-7 h-7 mx-auto text-blue-400 mb-2" /><div className="text-lg font-bold">{maintenanceReqs.filter((m: any) => m.status !== "completed").length}</div><p className="text-xs text-muted-foreground">Open Requests</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="pt-6 text-center"><FolderOpen className="w-7 h-7 mx-auto text-violet-400 mb-2" /><div className="text-lg font-bold">{documents.length}</div><p className="text-xs text-muted-foreground">Documents</p></CardContent></Card>
            </div>

            {/* Lease Timeline */}
            {activeLease && (
              <Card className="glass-card">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Lease Timeline</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {daysToExpiry <= 30 && daysToExpiry > 0 && (
                        <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> Expiring in {daysToExpiry} days</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(activeLease.start_date), "dd MMM yyyy")} → {format(new Date(activeLease.end_date), "dd MMM yyyy")}
                      </span>
                    </div>
                  </div>
                  <Progress value={Math.min(Math.max(leaseProgress, 0), 100)} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Unit: {activeLease.units?.unit_number || "—"} • {activeLease.units?.buildings?.name || ""}</span>
                    <span>Total Paid: AED {totalPaid.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="invoices">
              <TabsList className="bg-secondary/50 flex-wrap">
                <TabsTrigger value="invoices" className="gap-1.5"><FileText className="w-4 h-4" /> Invoices</TabsTrigger>
                <TabsTrigger value="payments" className="gap-1.5"><CreditCard className="w-4 h-4" /> Payments</TabsTrigger>
                <TabsTrigger value="maintenance" className="gap-1.5"><Wrench className="w-4 h-4" /> Maintenance</TabsTrigger>
                <TabsTrigger value="documents" className="gap-1.5"><FolderOpen className="w-4 h-4" /> Documents</TabsTrigger>
                <TabsTrigger value="complaints" className="gap-1.5"><AlertCircle className="w-4 h-4" /> Complaints</TabsTrigger>
              </TabsList>

              <TabsContent value="invoices">
                <Card className="glass-card">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Amount</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {invoices.length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No invoices</TableCell></TableRow>
                        ) : invoices.map((inv: any) => (
                          <TableRow key={inv.id}>
                            <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                            <TableCell>AED {Number(inv.total_amount).toLocaleString()}</TableCell>
                            <TableCell>{format(new Date(inv.due_date), "dd MMM yyyy")}</TableCell>
                            <TableCell><Badge variant={inv.status === "paid" ? "default" : inv.status === "overdue" ? "destructive" : "secondary"}>{inv.status}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments">
                <Card className="glass-card">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Reference</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {payments.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No payments</TableCell></TableRow>
                        ) : payments.map((p: any) => (
                          <TableRow key={p.id}>
                            <TableCell className="text-xs">{format(new Date(p.payment_date), "dd MMM yyyy")}</TableCell>
                            <TableCell>AED {Number(p.amount).toLocaleString()}</TableCell>
                            <TableCell className="capitalize text-xs">{p.payment_method || "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{p.reference_number || "—"}</TableCell>
                            <TableCell><Badge variant={p.status === "completed" ? "default" : "secondary"}>{p.status}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="maintenance">
                <Card className="glass-card">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {maintenanceReqs.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No requests</TableCell></TableRow>
                        ) : maintenanceReqs.map((m: any) => (
                          <TableRow key={m.id}>
                            <TableCell>{m.title}</TableCell>
                            <TableCell className="capitalize text-xs">{m.category || "—"}</TableCell>
                            <TableCell><Badge variant={m.priority === "critical" ? "destructive" : "outline"}>{m.priority}</Badge></TableCell>
                            <TableCell><Badge variant="secondary">{m.status}</Badge></TableCell>
                            <TableCell className="text-xs">{format(new Date(m.created_at), "dd MMM yyyy")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents">
                <Card className="glass-card">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Type</TableHead><TableHead>Expiry</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {documents.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No documents</TableCell></TableRow>
                        ) : documents.map((d: any) => (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium">{d.name}</TableCell>
                            <TableCell><Badge variant="outline">{d.category || "general"}</Badge></TableCell>
                            <TableCell className="text-xs text-muted-foreground">{d.file_type || "—"}</TableCell>
                            <TableCell className="text-xs">{d.expiry_date ? format(new Date(d.expiry_date), "dd MMM yyyy") : "—"}</TableCell>
                            <TableCell>
                              {d.file_url && (
                                <Button variant="ghost" size="icon" asChild>
                                  <a href={d.file_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a>
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="complaints">
                <Card className="glass-card">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Category</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {complaints.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No complaints</TableCell></TableRow>
                        ) : complaints.map((c: any) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.subject}</TableCell>
                            <TableCell className="capitalize text-xs">{c.category}</TableCell>
                            <TableCell><Badge variant={c.priority === "critical" || c.priority === "high" ? "destructive" : "outline"}>{c.priority}</Badge></TableCell>
                            <TableCell><Badge variant={c.status === "resolved" ? "default" : "secondary"}>{c.status}</Badge></TableCell>
                            <TableCell className="text-xs">{format(new Date(c.created_at), "dd MMM yyyy")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </motion.div>

      {/* New Maintenance Request Dialog */}
      <Dialog open={maintenanceDialog} onOpenChange={setMaintenanceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Wrench className="w-5 h-5" /> New Maintenance Request</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={reqForm.title} onChange={(e) => setReqForm({ ...reqForm, title: e.target.value })} placeholder="Brief description of the issue" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={reqForm.description} onChange={(e) => setReqForm({ ...reqForm, description: e.target.value })} placeholder="Detailed description..." rows={4} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={reqForm.category} onValueChange={(v) => setReqForm({ ...reqForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["general", "plumbing", "electrical", "hvac", "appliance", "structural", "pest_control", "cleaning"].map((c) => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={reqForm.priority} onValueChange={(v) => setReqForm({ ...reqForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low", "medium", "high", "critical"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMaintenanceDialog(false)}>Cancel</Button>
            <Button onClick={() => createMaintenanceMutation.mutate()} disabled={!reqForm.title || createMaintenanceMutation.isPending}>Submit Request</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default TenantPortal;

import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Banknote, Plus, Search, Calendar, AlertTriangle, CheckCircle2, Clock, Download, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateTablePDF } from "@/lib/pdfUtils";

const RentManagement = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedLeaseId, setSelectedLeaseId] = useState("");

  const orgId = currentOrg?.id;

  const { data: leases = [] } = useQuery({
    queryKey: ["rent-leases", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("leases")
        .select("*, tenants(full_name), units(unit_number, buildings(name))")
        .eq("organization_id", orgId)
        .eq("status", "active")
        .order("end_date");
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: rentSchedules = [], isLoading } = useQuery({
    queryKey: ["rent-schedules", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("rent_schedules")
        .select("*, tenants(full_name), leases(monthly_rent, units(unit_number))")
        .eq("organization_id", orgId)
        .order("due_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["rent-invoices", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("invoices").select("id, status, total_amount, due_date").eq("organization_id", orgId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Generate rent schedule for a lease
  const generateScheduleMutation = useMutation({
    mutationFn: async (leaseId: string) => {
      const lease = leases.find((l: any) => l.id === leaseId);
      if (!lease) throw new Error("Lease not found");

      const start = new Date(lease.start_date);
      const end = new Date(lease.end_date);
      const schedules: any[] = [];
      const current = new Date(start);
      current.setDate(lease.rent_due_day || 1);
      if (current < start) current.setMonth(current.getMonth() + 1);

      while (current <= end) {
        schedules.push({
          organization_id: orgId!,
          lease_id: lease.id,
          tenant_id: lease.tenant_id,
          due_date: current.toISOString().split("T")[0],
          amount: Number(lease.monthly_rent),
          status: current < new Date() ? "overdue" : "upcoming",
        });
        current.setMonth(current.getMonth() + 1);
      }

      if (schedules.length > 0) {
        const { error } = await supabase.from("rent_schedules").insert(schedules);
        if (error) throw error;
      }
      return schedules.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["rent-schedules"] });
      toast.success(`Generated ${count} rent schedule entries`);
      setGenerateDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Apply late fees
  const applyLateFeeMutation = useMutation({
    mutationFn: async () => {
      const today = new Date();
      const overdueSchedules = rentSchedules.filter((s: any) => {
        const due = new Date(s.due_date);
        const lease = leases.find((l: any) => l.id === s.lease_id);
        const graceDays = lease?.grace_period_days || 5;
        const graceEnd = new Date(due);
        graceEnd.setDate(graceEnd.getDate() + graceDays);
        return s.status === "upcoming" && graceEnd < today;
      });

      for (const schedule of overdueSchedules) {
        const lease = leases.find((l: any) => l.id === schedule.lease_id);
        const lateFeeRate = lease?.late_fee_rate || 0;
        const lateFee = Number(schedule.amount) * (lateFeeRate / 100);
        await supabase.from("rent_schedules").update({
          status: "overdue",
          late_fee: lateFee,
        }).eq("id", schedule.id);
      }
      return overdueSchedules.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["rent-schedules"] });
      toast.success(`Updated ${count} overdue entries with late fees`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Mark as paid
  const markPaidMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase.from("rent_schedules").update({
        status: "paid",
        paid_date: new Date().toISOString().split("T")[0],
      }).eq("id", scheduleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rent-schedules"] });
      toast.success("Marked as paid");
    },
  });

  // Stats
  const totalMonthlyRent = leases.reduce((s: number, l: any) => s + Number(l.monthly_rent || 0), 0);
  const overdueCount = rentSchedules.filter((s: any) => s.status === "overdue").length;
  const paidCount = rentSchedules.filter((s: any) => s.status === "paid").length;
  const totalLateFees = rentSchedules.reduce((s: number, r: any) => s + Number(r.late_fee || 0), 0);
  const leasesExpiringSoon = leases.filter((l: any) => {
    const end = new Date(l.end_date);
    const reminderDays = l.renewal_reminder_days || 30;
    const alertDate = new Date();
    alertDate.setDate(alertDate.getDate() + reminderDays);
    return end <= alertDate;
  });

  const depositHeld = leases.reduce((s: number, l: any) => s + Number(l.security_deposit || 0), 0);

  const filteredSchedules = rentSchedules.filter((s: any) =>
    (s.tenants?.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!orgId) return <AppLayout><div className="glass-card p-12 text-center"><p className="text-muted-foreground">Please select an organization first.</p></div></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header flex items-center gap-2"><Banknote className="w-6 h-6" /> Rent Management</h1>
            <p className="text-sm text-muted-foreground mt-1">UAE-compliant rent tracking with late fees, deposits & renewal alerts</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => applyLateFeeMutation.mutate()}>
              <AlertTriangle className="w-4 h-4" /> Apply Late Fees
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => {
              generateTablePDF({
                title: "Rent Schedule Report",
                orgName: currentOrg?.name || "",
                subtitle: `Active Leases: ${leases.length} | Monthly Rent: AED ${totalMonthlyRent.toLocaleString()}`,
                columns: ["Tenant", "Due Date", "Amount (AED)", "Late Fee", "Status"],
                rows: filteredSchedules.map((s: any) => [
                  s.tenants?.full_name || "—",
                  new Date(s.due_date).toLocaleDateString(),
                  `AED ${Number(s.amount).toLocaleString()}`,
                  s.late_fee ? `AED ${Number(s.late_fee).toLocaleString()}` : "—",
                  s.status,
                ]),
                filename: "rent-schedule-report.pdf",
              });
              toast.success("Report exported");
            }}><Download className="w-4 h-4" /> Export</Button>
            <Button onClick={() => setGenerateDialogOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Generate Schedule</Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Monthly Rent", value: `AED ${totalMonthlyRent.toLocaleString()}`, color: "text-primary" },
            { label: "Active Leases", value: leases.length, color: "text-foreground" },
            { label: "Paid", value: paidCount, color: "text-emerald-500" },
            { label: "Overdue", value: overdueCount, color: "text-destructive" },
            { label: "Total Late Fees", value: `AED ${totalLateFees.toLocaleString()}`, color: "text-amber-500" },
            { label: "Deposits Held", value: `AED ${depositHeld.toLocaleString()}`, color: "text-blue-400" },
          ].map((s) => (
            <Card key={s.label} className="glass-card">
              <CardContent className="p-4 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Lease Renewal Alerts */}
        {leasesExpiringSoon.length > 0 && (
          <Card className="glass-card border-amber-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-500">
                <AlertTriangle className="w-4 h-4" /> Lease Renewal Reminders ({leasesExpiringSoon.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leasesExpiringSoon.map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-amber-500/5">
                    <span className="text-foreground">{l.tenants?.full_name} — {l.units?.unit_number || "No unit"}</span>
                    <span className="text-muted-foreground">Expires: {new Date(l.end_date).toLocaleDateString()}</span>
                    <Badge variant="secondary">AED {Number(l.monthly_rent).toLocaleString()}/mo</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="schedule">
          <TabsList>
            <TabsTrigger value="schedule">Rent Schedule ({rentSchedules.length})</TabsTrigger>
            <TabsTrigger value="deposits">Security Deposits ({leases.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by tenant..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" />
            </div>

            {isLoading ? (
              <div className="glass-card p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : filteredSchedules.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No rent schedules. Generate one from an active lease.</p>
              </div>
            ) : (
              <div className="glass-card overflow-hidden overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left text-xs font-medium text-muted-foreground p-4">Tenant</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4">Due Date</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4">Amount</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4">Late Fee</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4">Total Due</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4">Paid Date</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSchedules.map((s: any) => (
                      <tr key={s.id} className="border-b border-border/20 hover:bg-accent/30">
                        <td className="p-4 text-sm font-medium text-foreground">{s.tenants?.full_name}</td>
                        <td className="p-4 text-sm text-muted-foreground">{new Date(s.due_date).toLocaleDateString()}</td>
                        <td className="p-4 text-sm text-foreground">AED {Number(s.amount).toLocaleString()}</td>
                        <td className="p-4 text-sm text-destructive">{s.late_fee ? `AED ${Number(s.late_fee).toLocaleString()}` : "—"}</td>
                        <td className="p-4 text-sm font-medium text-foreground">AED {(Number(s.amount) + Number(s.late_fee || 0)).toLocaleString()}</td>
                        <td className="p-4">
                          <Badge variant={s.status === "paid" ? "default" : s.status === "overdue" ? "destructive" : "secondary"}>
                            {s.status === "paid" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {s.status === "overdue" && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {s.status === "upcoming" && <Clock className="w-3 h-3 mr-1" />}
                            {s.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{s.paid_date ? new Date(s.paid_date).toLocaleDateString() : "—"}</td>
                        <td className="p-4">
                          {s.status !== "paid" && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markPaidMutation.mutate(s.id)}>
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Paid
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="deposits">
            <div className="glass-card overflow-hidden overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Tenant</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Unit</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Deposit Amount</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Lease End</th>
                  </tr>
                </thead>
                <tbody>
                  {leases.filter((l: any) => Number(l.security_deposit) > 0).map((l: any) => (
                    <tr key={l.id} className="border-b border-border/20 hover:bg-accent/30">
                      <td className="p-4 text-sm font-medium text-foreground">{l.tenants?.full_name}</td>
                      <td className="p-4 text-sm text-muted-foreground">{l.units?.unit_number || "—"}</td>
                      <td className="p-4 text-sm font-medium text-foreground">AED {Number(l.security_deposit).toLocaleString()}</td>
                      <td className="p-4"><Badge variant={l.deposit_status === "refunded" ? "secondary" : "default"}>{l.deposit_status || "held"}</Badge></td>
                      <td className="p-4 text-sm text-muted-foreground">{new Date(l.end_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {leases.filter((l: any) => Number(l.security_deposit) > 0).length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No security deposits found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Generate Schedule Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader><DialogTitle>Generate Rent Schedule</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Select an active lease to auto-generate monthly rent entries based on the lease period, due day, and late fee configuration.</p>
            <div className="space-y-2">
              <Label>Active Lease *</Label>
              <Select value={selectedLeaseId} onValueChange={setSelectedLeaseId}>
                <SelectTrigger><SelectValue placeholder="Select lease" /></SelectTrigger>
                <SelectContent>
                  {leases.map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.tenants?.full_name} — AED {Number(l.monthly_rent).toLocaleString()}/mo — Due day {l.rent_due_day || 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedLeaseId && (() => {
              const l = leases.find((l: any) => l.id === selectedLeaseId);
              if (!l) return null;
              return (
                <div className="p-3 rounded-lg bg-secondary/30 space-y-1 text-sm">
                  <p>Period: {new Date(l.start_date).toLocaleDateString()} — {new Date(l.end_date).toLocaleDateString()}</p>
                  <p>Monthly Rent: AED {Number(l.monthly_rent).toLocaleString()}</p>
                  <p>Grace Period: {l.grace_period_days || 5} days</p>
                  <p>Late Fee Rate: {l.late_fee_rate || 0}%</p>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => selectedLeaseId && generateScheduleMutation.mutate(selectedLeaseId)} disabled={!selectedLeaseId}>
              <RefreshCw className="w-4 h-4 mr-2" /> Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default RentManagement;

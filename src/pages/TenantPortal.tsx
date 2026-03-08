import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, CreditCard, Wrench, Home } from "lucide-react";
import { format } from "date-fns";

const TenantPortal = () => {
  const { user } = useAuth();

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
      const { data } = await supabase.from("leases").select("*").eq("tenant_id", tenantRecord.id).order("start_date", { ascending: false });
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

  const { data: maintenanceReqs = [] } = useQuery({
    queryKey: ["tenant-maintenance", tenantRecord?.id],
    queryFn: async () => {
      if (!tenantRecord) return [];
      const { data } = await supabase.from("maintenance_requests").select("*").eq("reported_by", tenantRecord.user_id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!tenantRecord,
  });

  const activeLease = leases.find((l: any) => l.status === "active");
  const pendingInvoices = invoices.filter((i: any) => i.status === "pending" || i.status === "overdue");

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="page-header flex items-center gap-2"><Users className="w-6 h-6" /> Tenant Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">Your lease, payments, and requests</p>
        </div>

        {!tenantRecord ? (
          <div className="glass-card p-12 text-center text-muted-foreground">
            No tenant profile linked to your account. Please contact your property manager.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="glass-card"><CardContent className="pt-6 text-center"><Home className="w-8 h-8 mx-auto text-primary mb-2" /><div className="text-lg font-bold">{activeLease ? "Active" : "No Lease"}</div><p className="text-xs text-muted-foreground">Lease Status</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="pt-6 text-center"><CreditCard className="w-8 h-8 mx-auto text-emerald-400 mb-2" /><div className="text-lg font-bold">AED {activeLease ? Number(activeLease.monthly_rent).toLocaleString() : "0"}</div><p className="text-xs text-muted-foreground">Monthly Rent</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="pt-6 text-center"><FileText className="w-8 h-8 mx-auto text-orange-400 mb-2" /><div className="text-lg font-bold">{pendingInvoices.length}</div><p className="text-xs text-muted-foreground">Pending Invoices</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="pt-6 text-center"><Wrench className="w-8 h-8 mx-auto text-blue-400 mb-2" /><div className="text-lg font-bold">{maintenanceReqs.length}</div><p className="text-xs text-muted-foreground">Maintenance Requests</p></CardContent></Card>
            </div>

            <Card className="glass-card">
              <CardHeader><CardTitle className="text-sm">Your Invoices</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Amount</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No invoices</TableCell></TableRow>
                    ) : invoices.slice(0, 10).map((inv: any) => (
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

            <Card className="glass-card">
              <CardHeader><CardTitle className="text-sm">Maintenance Requests</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {maintenanceReqs.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No requests</TableCell></TableRow>
                    ) : maintenanceReqs.map((m: any) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.title}</TableCell>
                        <TableCell><Badge variant="outline">{m.priority}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{m.status}</Badge></TableCell>
                        <TableCell className="text-xs">{format(new Date(m.created_at), "dd MMM yyyy")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default TenantPortal;

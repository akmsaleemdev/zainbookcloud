import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Home, DollarSign, Wrench, TrendingUp } from "lucide-react";
import { format } from "date-fns";

const OwnerPortal = () => {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?.id;

  const { data: properties = [] } = useQuery({
    queryKey: ["owner-properties", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("properties").select("*").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["owner-invoices", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("invoices").select("*").eq("organization_id", orgId).order("due_date", { ascending: false }).limit(10);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["owner-payments", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("payments").select("*").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: maintenance = [] } = useQuery({
    queryKey: ["owner-maintenance", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("maintenance_requests").select("*").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(10);
      return data || [];
    },
    enabled: !!orgId,
  });

  const totalRevenue = payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const openMaintenance = maintenance.filter((m: any) => m.status !== "completed" && m.status !== "closed").length;

  if (!orgId) {
    return <AppLayout><div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Please select an organization first.</p></div></AppLayout>;
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="page-header flex items-center gap-2"><UserCircle className="w-6 h-6" /> Owner Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">Property owner dashboard and reports</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card"><CardContent className="pt-6 text-center"><Home className="w-8 h-8 mx-auto text-primary mb-2" /><div className="text-2xl font-bold">{properties.length}</div><p className="text-xs text-muted-foreground">Properties</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="pt-6 text-center"><DollarSign className="w-8 h-8 mx-auto text-emerald-400 mb-2" /><div className="text-2xl font-bold">AED {totalRevenue.toLocaleString()}</div><p className="text-xs text-muted-foreground">Total Revenue</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="pt-6 text-center"><TrendingUp className="w-8 h-8 mx-auto text-blue-400 mb-2" /><div className="text-2xl font-bold">{invoices.length}</div><p className="text-xs text-muted-foreground">Recent Invoices</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="pt-6 text-center"><Wrench className="w-8 h-8 mx-auto text-orange-400 mb-2" /><div className="text-2xl font-bold">{openMaintenance}</div><p className="text-xs text-muted-foreground">Open Requests</p></CardContent></Card>
        </div>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-sm">Recent Invoices</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Amount</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No invoices</TableCell></TableRow>
                ) : invoices.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                    <TableCell>AED {Number(inv.total_amount).toLocaleString()}</TableCell>
                    <TableCell>{format(new Date(inv.due_date), "dd MMM yyyy")}</TableCell>
                    <TableCell><Badge variant={inv.status === "paid" ? "default" : "secondary"}>{inv.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-sm">Recent Maintenance</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {maintenance.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No requests</TableCell></TableRow>
                ) : maintenance.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.title}</TableCell>
                    <TableCell><Badge variant={m.priority === "critical" ? "destructive" : "outline"}>{m.priority}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{m.status}</Badge></TableCell>
                    <TableCell className="text-xs">{format(new Date(m.created_at), "dd MMM yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </AppLayout>
  );
};

export default OwnerPortal;

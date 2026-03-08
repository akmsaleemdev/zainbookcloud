import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { UserCircle, Home, DollarSign, Wrench, TrendingUp, Building2, FileText, PieChart } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell } from "recharts";

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

  const { data: units = [] } = useQuery({
    queryKey: ["owner-units", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("units").select("*, buildings!inner(property_id, properties!inner(organization_id))").eq("buildings.properties.organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: leases = [] } = useQuery({
    queryKey: ["owner-leases", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("leases").select("*").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["owner-invoices", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("invoices").select("*").eq("organization_id", orgId).order("due_date", { ascending: false }).limit(20);
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
      const { data } = await supabase.from("maintenance_requests").select("*").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
    enabled: !!orgId,
  });

  const totalRevenue = payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const openMaintenance = maintenance.filter((m: any) => m.status !== "completed" && m.status !== "closed").length;
  const activeLeases = leases.filter((l: any) => l.status === "active");
  const monthlyRentRoll = activeLeases.reduce((s: number, l: any) => s + Number(l.monthly_rent || 0), 0);
  const occupiedUnits = units.filter((u: any) => u.status === "occupied").length;
  const totalUnits = units.length;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // Revenue by month (from payments)
  const revenueByMonth = payments.reduce((acc: any, p: any) => {
    const month = format(new Date(p.payment_date || p.created_at), "MMM yyyy");
    acc[month] = (acc[month] || 0) + Number(p.amount || 0);
    return acc;
  }, {});
  const revenueChartData = Object.entries(revenueByMonth).slice(-6).map(([name, value]) => ({ name, value }));

  // Unit status distribution
  const unitStatusData = units.reduce((acc: any, u: any) => {
    const status = u.status || "unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(unitStatusData).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--muted-foreground))", "#f59e0b", "#ef4444", "#10b981"];

  if (!orgId) {
    return <AppLayout><div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Please select an organization first.</p></div></AppLayout>;
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="page-header flex items-center gap-2"><UserCircle className="w-6 h-6" /> Owner Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">Property performance, revenue & occupancy overview</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="glass-card"><CardContent className="pt-6 text-center"><Home className="w-7 h-7 mx-auto text-primary mb-2" /><div className="text-2xl font-bold">{properties.length}</div><p className="text-xs text-muted-foreground">Properties</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="pt-6 text-center"><Building2 className="w-7 h-7 mx-auto text-blue-400 mb-2" /><div className="text-2xl font-bold">{totalUnits}</div><p className="text-xs text-muted-foreground">Total Units</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="pt-6 text-center"><PieChart className="w-7 h-7 mx-auto text-amber-400 mb-2" /><div className="text-2xl font-bold">{occupancyRate}%</div><p className="text-xs text-muted-foreground">Occupancy</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="pt-6 text-center"><DollarSign className="w-7 h-7 mx-auto text-emerald-400 mb-2" /><div className="text-2xl font-bold">AED {totalRevenue.toLocaleString()}</div><p className="text-xs text-muted-foreground">Total Revenue</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="pt-6 text-center"><TrendingUp className="w-7 h-7 mx-auto text-violet-400 mb-2" /><div className="text-2xl font-bold">AED {monthlyRentRoll.toLocaleString()}</div><p className="text-xs text-muted-foreground">Monthly Rent Roll</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="pt-6 text-center"><Wrench className="w-7 h-7 mx-auto text-orange-400 mb-2" /><div className="text-2xl font-bold">{openMaintenance}</div><p className="text-xs text-muted-foreground">Open Requests</p></CardContent></Card>
        </div>

        {/* Occupancy Progress */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Portfolio Occupancy</span>
              <span className="text-sm text-muted-foreground">{occupiedUnits} / {totalUnits} units occupied</span>
            </div>
            <Progress value={occupancyRate} className="h-3" />
          </CardContent>
        </Card>

        <Tabs defaultValue="revenue">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="revenue" className="gap-1.5"><DollarSign className="w-4 h-4" /> Revenue</TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1.5"><FileText className="w-4 h-4" /> Invoices</TabsTrigger>
            <TabsTrigger value="maintenance" className="gap-1.5"><Wrench className="w-4 h-4" /> Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-sm">Revenue by Month</CardTitle></CardHeader>
                <CardContent>
                  {revenueChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={revenueChartData}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip formatter={(v: any) => [`AED ${Number(v).toLocaleString()}`, "Revenue"]} />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">No payment data yet</p>
                  )}
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-sm">Unit Status Distribution</CardTitle></CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <RPieChart>
                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {pieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </RPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">No units data yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="invoices">
            <Card className="glass-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Amount</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
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

          <TabsContent value="maintenance">
            <Card className="glass-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {maintenance.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No requests</TableCell></TableRow>
                    ) : maintenance.map((m: any) => (
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
        </Tabs>
      </motion.div>
    </AppLayout>
  );
};

export default OwnerPortal;

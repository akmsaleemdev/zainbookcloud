import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, DollarSign, Home, Users, Wrench, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const Reports = () => {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?.id;

  const { data: properties = [] } = useQuery({
    queryKey: ["report-properties", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("properties").select("id, name, property_type").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["report-tenants", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("tenants").select("id, status").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["report-invoices", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("invoices").select("id, amount, total_amount, status, due_date").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["report-payments", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("payments").select("id, amount, payment_date, status").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: maintenance = [] } = useQuery({
    queryKey: ["report-maintenance", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("maintenance_requests").select("id, status, priority, actual_cost").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const totalRevenue = payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const totalOutstanding = invoices.filter((i: any) => i.status === "pending" || i.status === "overdue").reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
  const activeTenants = tenants.filter((t: any) => t.status === "active").length;
  const openMaintenance = maintenance.filter((m: any) => m.status !== "completed" && m.status !== "closed").length;

  const invoiceStatusData = ["pending", "paid", "overdue", "cancelled"].map(s => ({
    name: s, value: invoices.filter((i: any) => i.status === s).length,
  })).filter(d => d.value > 0);

  const maintenancePriorityData = ["low", "medium", "high", "critical"].map(p => ({
    name: p, value: maintenance.filter((m: any) => m.priority === p).length,
  })).filter(d => d.value > 0);

  const propertyTypeData = [...new Set(properties.map((p: any) => p.property_type))].map(type => ({
    name: String(type), value: properties.filter((p: any) => p.property_type === type).length,
  }));

  if (!orgId) {
    return <AppLayout><div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Please select an organization first.</p></div></AppLayout>;
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="page-header flex items-center gap-2"><BarChart3 className="w-6 h-6" /> Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Financial summaries and operational insights</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">AED {totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1"><TrendingUp className="w-3 h-3" /> From {payments.length} payments</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
              <FileText className="w-4 h-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">AED {totalOutstanding.toLocaleString()}</div>
              <p className="text-xs text-orange-400 flex items-center gap-1 mt-1"><TrendingDown className="w-3 h-3" /> {invoices.filter((i: any) => i.status === "overdue").length} overdue</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Tenants</CardTitle>
              <Users className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTenants}</div>
              <p className="text-xs text-muted-foreground mt-1">of {tenants.length} total</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Maintenance</CardTitle>
              <Wrench className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openMaintenance}</div>
              <p className="text-xs text-muted-foreground mt-1">of {maintenance.length} total</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm">Invoice Status Distribution</CardTitle></CardHeader>
            <CardContent>
              {invoiceStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={invoiceStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {invoiceStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-12">No invoice data</p>}
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm">Maintenance by Priority</CardTitle></CardHeader>
            <CardContent>
              {maintenancePriorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={maintenancePriorityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-12">No maintenance data</p>}
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm">Properties by Type</CardTitle></CardHeader>
            <CardContent>
              {propertyTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={propertyTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-12">No property data</p>}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Reports;

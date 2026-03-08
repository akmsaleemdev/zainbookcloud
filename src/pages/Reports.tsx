import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, DollarSign, Home, Users, Wrench, FileText, TrendingUp, TrendingDown, Download, Zap, Building2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateTablePDF } from "@/lib/pdfUtils";
import { toast } from "sonner";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const Reports = () => {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?.id;

  const { data: properties = [] } = useQuery({
    queryKey: ["report-properties", orgId],
    queryFn: async () => { if (!orgId) return []; const { data } = await supabase.from("properties").select("id, name, property_type").eq("organization_id", orgId); return data || []; },
    enabled: !!orgId,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["report-tenants", orgId],
    queryFn: async () => { if (!orgId) return []; const { data } = await supabase.from("tenants").select("id, full_name, status, nationality").eq("organization_id", orgId); return data || []; },
    enabled: !!orgId,
  });

  const { data: leases = [] } = useQuery({
    queryKey: ["report-leases", orgId],
    queryFn: async () => { if (!orgId) return []; const { data } = await supabase.from("leases").select("id, status, monthly_rent, start_date, end_date, tenant_id, unit_id").eq("organization_id", orgId); return data || []; },
    enabled: !!orgId,
  });

  const { data: units = [] } = useQuery({
    queryKey: ["report-units", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data: props } = await supabase.from("properties").select("id").eq("organization_id", orgId);
      if (!props?.length) return [];
      const { data: blds } = await supabase.from("buildings").select("id").in("property_id", props.map((p: any) => p.id));
      if (!blds?.length) return [];
      const { data } = await supabase.from("units").select("id, status, unit_number").in("building_id", blds.map((b: any) => b.id));
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["report-invoices", orgId],
    queryFn: async () => { if (!orgId) return []; const { data } = await supabase.from("invoices").select("id, amount, total_amount, vat_amount, status, due_date").eq("organization_id", orgId); return data || []; },
    enabled: !!orgId,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["report-payments", orgId],
    queryFn: async () => { if (!orgId) return []; const { data } = await supabase.from("payments").select("id, amount, payment_date, status, payment_method").eq("organization_id", orgId); return data || []; },
    enabled: !!orgId,
  });

  const { data: maintenance = [] } = useQuery({
    queryKey: ["report-maintenance", orgId],
    queryFn: async () => { if (!orgId) return []; const { data } = await supabase.from("maintenance_requests").select("id, status, priority, actual_cost, category").eq("organization_id", orgId); return data || []; },
    enabled: !!orgId,
  });

  const { data: utilityReadings = [] } = useQuery({
    queryKey: ["report-utilities", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data: meters } = await supabase.from("utility_meters").select("id, utility_type").eq("organization_id", orgId);
      if (!meters?.length) return [];
      const { data } = await supabase.from("utility_readings").select("id, amount, consumption, utility_meters(utility_type)").in("meter_id", meters.map((m: any) => m.id));
      return data || [];
    },
    enabled: !!orgId,
  });

  // Calculations
  const totalRevenue = payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const totalOutstanding = invoices.filter((i: any) => i.status === "pending" || i.status === "overdue").reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
  const totalVAT = invoices.reduce((s: number, i: any) => s + Number(i.vat_amount || 0), 0);
  const activeTenants = tenants.filter((t: any) => t.status === "active").length;
  const openMaintenance = maintenance.filter((m: any) => m.status !== "completed" && m.status !== "closed").length;
  const maintenanceCost = maintenance.reduce((s: number, m: any) => s + Number(m.actual_cost || 0), 0);
  const occupiedUnits = units.filter((u: any) => u.status === "occupied").length;
  const occupancyRate = units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0;

  const invoiceStatusData = ["pending", "paid", "overdue", "cancelled"].map(s => ({ name: s, value: invoices.filter((i: any) => i.status === s).length })).filter(d => d.value > 0);
  const maintenancePriorityData = ["low", "medium", "high", "critical"].map(p => ({ name: p, value: maintenance.filter((m: any) => m.priority === p).length })).filter(d => d.value > 0);
  const propertyTypeData = [...new Set(properties.map((p: any) => p.property_type))].map(type => ({ name: String(type), value: properties.filter((p: any) => p.property_type === type).length }));
  const paymentMethodData = [...new Set(payments.map((p: any) => p.payment_method))].map(m => ({ name: String(m).replace("_", " "), value: payments.filter((p: any) => p.payment_method === m).length })).filter(d => d.value > 0);
  const tenantNationalityData = [...new Set(tenants.map((t: any) => t.nationality).filter(Boolean))].map(n => ({ name: String(n), value: tenants.filter((t: any) => t.nationality === n).length })).sort((a, b) => b.value - a.value).slice(0, 8);
  const maintenanceCategoryData = [...new Set(maintenance.map((m: any) => m.category).filter(Boolean))].map(c => ({ name: String(c), value: maintenance.filter((m: any) => m.category === c).length })).filter(d => d.value > 0);
  const utilityByType = [...new Set(utilityReadings.map((r: any) => r.utility_meters?.utility_type).filter(Boolean))].map(t => ({
    name: String(t).replace("_", " "),
    totalAmount: utilityReadings.filter((r: any) => r.utility_meters?.utility_type === t).reduce((s: number, r: any) => s + Number(r.amount || 0), 0),
    totalConsumption: utilityReadings.filter((r: any) => r.utility_meters?.utility_type === t).reduce((s: number, r: any) => s + Number(r.consumption || 0), 0),
  }));

  const exportReport = (title: string, columns: string[], rows: (string | number)[][], filename: string) => {
    generateTablePDF({ title, orgName: currentOrg?.name || "", columns, rows, filename });
    toast.success(`${title} exported`);
  };

  if (!orgId) return <AppLayout><div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Please select an organization first.</p></div></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header flex items-center gap-2"><BarChart3 className="w-6 h-6" /> Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">Comprehensive financial and operational reports</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: "Revenue", value: `AED ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400" },
            { label: "Outstanding", value: `AED ${totalOutstanding.toLocaleString()}`, icon: FileText, color: "text-amber-400" },
            { label: "VAT Collected", value: `AED ${totalVAT.toLocaleString()}`, icon: FileText, color: "text-blue-400" },
            { label: "Occupancy", value: `${occupancyRate}%`, icon: Building2, color: "text-primary" },
            { label: "Active Tenants", value: activeTenants, icon: Users, color: "text-foreground" },
            { label: "Maintenance Cost", value: `AED ${maintenanceCost.toLocaleString()}`, icon: Wrench, color: "text-destructive" },
          ].map((s) => (
            <Card key={s.label} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="financial">
          <TabsList className="flex-wrap">
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
            <TabsTrigger value="tenant">Tenant</TabsTrigger>
            <TabsTrigger value="property">Property</TabsTrigger>
            <TabsTrigger value="utility">Utility</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="export-all">Export All</TabsTrigger>
          </TabsList>

          {/* FINANCIAL */}
          <TabsContent value="financial" className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" className="gap-2" onClick={() => exportReport("Financial Report", ["Metric", "Value"], [
                ["Total Revenue", `AED ${totalRevenue.toLocaleString()}`],
                ["Outstanding", `AED ${totalOutstanding.toLocaleString()}`],
                ["VAT Collected", `AED ${totalVAT.toLocaleString()}`],
                ["Total Invoices", String(invoices.length)],
                ["Paid Invoices", String(invoices.filter((i: any) => i.status === "paid").length)],
                ["Overdue Invoices", String(invoices.filter((i: any) => i.status === "overdue").length)],
                ["Total Payments", String(payments.length)],
              ], "financial-report.pdf")}><Download className="w-4 h-4" /> Export PDF</Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-sm">Invoice Status</CardTitle></CardHeader>
                <CardContent>
                  {invoiceStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart><Pie data={invoiceStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{invoiceStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-center text-muted-foreground py-12">No data</p>}
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-sm">Payment Methods</CardTitle></CardHeader>
                <CardContent>
                  {paymentMethodData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={paymentMethodData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} /><YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-center text-muted-foreground py-12">No data</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* OCCUPANCY */}
          <TabsContent value="occupancy" className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" className="gap-2" onClick={() => exportReport("Occupancy Report", ["Metric", "Value"], [
                ["Total Units", String(units.length)],
                ["Occupied", String(occupiedUnits)],
                ["Vacant", String(units.length - occupiedUnits)],
                ["Occupancy Rate", `${occupancyRate}%`],
                ["Active Leases", String(leases.filter((l: any) => l.status === "active").length)],
                ["Expired Leases", String(leases.filter((l: any) => l.status === "expired").length)],
              ], "occupancy-report.pdf")}><Download className="w-4 h-4" /> Export PDF</Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-sm">Unit Occupancy</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart><Pie data={[{ name: "Occupied", value: occupiedUnits }, { name: "Vacant", value: units.length - occupiedUnits }]} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{[0, 1].map(i => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip /></PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-sm">Properties by Type</CardTitle></CardHeader>
                <CardContent>
                  {propertyTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={propertyTypeData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} /><YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} /></BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-center text-muted-foreground py-12">No data</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TENANT */}
          <TabsContent value="tenant" className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" className="gap-2" onClick={() => exportReport("Tenant Report", ["Metric", "Value"], [
                ["Total Tenants", String(tenants.length)],
                ["Active", String(activeTenants)],
                ["Inactive", String(tenants.length - activeTenants)],
                ...tenantNationalityData.map(n => [`Nationality: ${n.name}`, String(n.value)]),
              ], "tenant-report.pdf")}><Download className="w-4 h-4" /> Export PDF</Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-sm">Tenant Status</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart><Pie data={[{ name: "Active", value: activeTenants }, { name: "Inactive", value: tenants.length - activeTenants }]} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{[0, 1].map(i => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip /></PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-sm">Top Nationalities</CardTitle></CardHeader>
                <CardContent>
                  {tenantNationalityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={tenantNationalityData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} /><YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} /></BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-center text-muted-foreground py-12">No nationality data</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* PROPERTY PERFORMANCE */}
          <TabsContent value="property" className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" className="gap-2" onClick={() => exportReport("Property Performance Report", ["Property", "Type", "Monthly Revenue"],
                properties.map((p: any) => {
                  const propLeases = leases.filter((l: any) => l.status === "active");
                  const revenue = propLeases.reduce((s: number, l: any) => s + Number(l.monthly_rent || 0), 0);
                  return [p.name, p.property_type || "—", `AED ${revenue.toLocaleString()}`];
                }),
                "property-performance-report.pdf"
              )}><Download className="w-4 h-4" /> Export PDF</Button>
            </div>
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-sm">Properties by Type</CardTitle></CardHeader>
              <CardContent>
                {propertyTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={propertyTypeData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} /><YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} /></BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-12">No data</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* UTILITY */}
          <TabsContent value="utility" className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" className="gap-2" onClick={() => exportReport("Utility Report", ["Type", "Total Consumption", "Total Amount (AED)"],
                utilityByType.map(u => [u.name, String(u.totalConsumption.toLocaleString()), `AED ${u.totalAmount.toLocaleString()}`]),
                "utility-report.pdf"
              )}><Download className="w-4 h-4" /> Export PDF</Button>
            </div>
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-sm">Utility Costs by Type</CardTitle></CardHeader>
              <CardContent>
                {utilityByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={utilityByType}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} /><YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} /><Tooltip /><Bar dataKey="totalAmount" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} name="Amount (AED)" /></BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-12">No utility data</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* MAINTENANCE */}
          <TabsContent value="maintenance" className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" className="gap-2" onClick={() => exportReport("Maintenance Report", ["Metric", "Value"], [
                ["Total Requests", String(maintenance.length)],
                ["Open", String(openMaintenance)],
                ["Completed", String(maintenance.filter((m: any) => m.status === "completed").length)],
                ["Total Cost", `AED ${maintenanceCost.toLocaleString()}`],
                ...maintenancePriorityData.map(p => [`Priority: ${p.name}`, String(p.value)]),
              ], "maintenance-report.pdf")}><Download className="w-4 h-4" /> Export PDF</Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-sm">By Priority</CardTitle></CardHeader>
                <CardContent>
                  {maintenancePriorityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={maintenancePriorityData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} /><YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-center text-muted-foreground py-12">No data</p>}
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-sm">By Category</CardTitle></CardHeader>
                <CardContent>
                  {maintenanceCategoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart><Pie data={maintenanceCategoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{maintenanceCategoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-center text-muted-foreground py-12">No data</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </AppLayout>
  );
};

export default Reports;

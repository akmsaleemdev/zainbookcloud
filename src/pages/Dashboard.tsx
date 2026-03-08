import { motion } from "framer-motion";
import {
  Building2, Home, BedDouble, Users, FileText, CreditCard,
  Wrench, TrendingUp, TrendingDown, Calendar,
  Clock, ChevronRight, Receipt, AlertCircle
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

const Dashboard = () => {
  const { currentOrg } = useOrganization();

  // Fetch properties count
  const { data: propertiesCount = 0 } = useQuery({
    queryKey: ["dashboard-properties", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return 0;
      const { count } = await supabase.from("properties").select("*", { count: "exact", head: true }).eq("organization_id", currentOrg.id);
      return count || 0;
    },
    enabled: !!currentOrg,
  });

  // Fetch buildings count
  const { data: buildingsCount = 0 } = useQuery({
    queryKey: ["dashboard-buildings", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return 0;
      const { data: props } = await supabase.from("properties").select("id").eq("organization_id", currentOrg.id);
      if (!props?.length) return 0;
      const { count } = await supabase.from("buildings").select("*", { count: "exact", head: true }).in("property_id", props.map(p => p.id));
      return count || 0;
    },
    enabled: !!currentOrg,
  });

  // Fetch tenants count
  const { data: tenantsCount = 0 } = useQuery({
    queryKey: ["dashboard-tenants", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return 0;
      const { count } = await supabase.from("tenants").select("*", { count: "exact", head: true }).eq("organization_id", currentOrg.id).eq("status", "active");
      return count || 0;
    },
    enabled: !!currentOrg,
  });

  // Fetch leases count
  const { data: leasesCount = 0 } = useQuery({
    queryKey: ["dashboard-leases", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return 0;
      const { count } = await supabase.from("leases").select("*", { count: "exact", head: true }).eq("organization_id", currentOrg.id).eq("status", "active");
      return count || 0;
    },
    enabled: !!currentOrg,
  });

  // Fetch invoices data
  const { data: invoiceStats } = useQuery({
    queryKey: ["dashboard-invoices", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return { pending: 0, overdue: 0, totalPending: 0 };
      const { data: pending } = await supabase.from("invoices").select("total_amount").eq("organization_id", currentOrg.id).eq("status", "pending");
      const { data: overdue } = await supabase.from("invoices").select("total_amount").eq("organization_id", currentOrg.id).eq("status", "overdue");
      return {
        pending: pending?.length || 0,
        overdue: overdue?.length || 0,
        totalPending: pending?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0,
      };
    },
    enabled: !!currentOrg,
  });

  // Fetch maintenance requests
  const { data: maintenanceStats } = useQuery({
    queryKey: ["dashboard-maintenance", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return { open: 0, inProgress: 0 };
      const { count: open } = await supabase.from("maintenance_requests").select("*", { count: "exact", head: true }).eq("organization_id", currentOrg.id).eq("status", "open");
      const { count: inProgress } = await supabase.from("maintenance_requests").select("*", { count: "exact", head: true }).eq("organization_id", currentOrg.id).eq("status", "in_progress");
      return { open: open || 0, inProgress: inProgress || 0 };
    },
    enabled: !!currentOrg,
  });

  // Fetch recent payments
  const { data: recentPayments = [] } = useQuery({
    queryKey: ["dashboard-payments", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase.from("payments").select("*, tenants(full_name)").eq("organization_id", currentOrg.id).order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!currentOrg,
  });

  // Monthly revenue data
  const { data: monthlyRevenue = [] } = useQuery({
    queryKey: ["dashboard-revenue", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase.from("payments").select("amount, payment_date").eq("organization_id", currentOrg.id).eq("status", "completed").gte("payment_date", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
      
      const monthlyData: Record<string, number> = {};
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      data?.forEach(p => {
        const date = new Date(p.payment_date);
        const monthKey = months[date.getMonth()];
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(p.amount);
      });

      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = months[d.getMonth()];
        last6Months.push({ month: monthName, revenue: monthlyData[monthName] || 0 });
      }
      return last6Months;
    },
    enabled: !!currentOrg,
  });

  // Bed spaces occupancy
  const { data: occupancyData } = useQuery({
    queryKey: ["dashboard-occupancy", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [
        { name: "Occupied", value: 0, color: "hsl(153, 54%, 45%)" },
        { name: "Vacant", value: 100, color: "hsl(0, 0%, 18%)" },
      ];
      
      const { data: props } = await supabase.from("properties").select("id").eq("organization_id", currentOrg.id);
      if (!props?.length) return [{ name: "Occupied", value: 0, color: "hsl(153, 54%, 45%)" }, { name: "Vacant", value: 100, color: "hsl(0, 0%, 18%)" }];
      
      const { data: blds } = await supabase.from("buildings").select("id").in("property_id", props.map(p => p.id));
      if (!blds?.length) return [{ name: "Occupied", value: 0, color: "hsl(153, 54%, 45%)" }, { name: "Vacant", value: 100, color: "hsl(0, 0%, 18%)" }];
      
      const { data: units } = await supabase.from("units").select("id, status").in("building_id", blds.map(b => b.id));
      
      const total = units?.length || 0;
      const occupied = units?.filter(u => u.status === "occupied").length || 0;
      const vacant = units?.filter(u => u.status === "available").length || 0;
      const maintenance = units?.filter(u => u.status === "maintenance").length || 0;
      
      if (total === 0) return [{ name: "Occupied", value: 0, color: "hsl(153, 54%, 45%)" }, { name: "Vacant", value: 100, color: "hsl(0, 0%, 18%)" }];
      
      return [
        { name: "Occupied", value: Math.round((occupied / total) * 100), color: "hsl(153, 54%, 45%)" },
        { name: "Vacant", value: Math.round((vacant / total) * 100), color: "hsl(0, 0%, 18%)" },
        { name: "Maintenance", value: Math.round((maintenance / total) * 100), color: "hsl(38, 92%, 50%)" },
      ].filter(d => d.value > 0);
    },
    enabled: !!currentOrg,
  });

  const stats = [
    { label: "Properties", value: String(propertiesCount), icon: Home, to: "/properties" },
    { label: "Buildings", value: String(buildingsCount), icon: Building2, to: "/buildings" },
    { label: "Active Tenants", value: String(tenantsCount), icon: Users, to: "/tenants" },
    { label: "Active Leases", value: String(leasesCount), icon: FileText, to: "/leases" },
    { label: "Pending Invoices", value: String(invoiceStats?.pending || 0), icon: Receipt, to: "/invoices" },
    { label: "Open Tickets", value: String((maintenanceStats?.open || 0) + (maintenanceStats?.inProgress || 0)), icon: Wrench, to: "/maintenance" },
  ];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  })();

  if (!currentOrg) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to ZainBook AI</h2>
          <p className="text-muted-foreground mb-6 max-w-md">Get started by creating your first organization to manage properties, tenants, and more.</p>
          <Button asChild size="lg">
            <Link to="/organizations">Create Organization</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-[1440px]">
        {/* Header */}
        <motion.div variants={item} className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight">{greeting}</h1>
            <p className="text-lg text-muted-foreground mt-2">{currentOrg.name} — Portfolio Overview</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[15px] text-muted-foreground bg-secondary rounded-2xl px-5 py-2.5">
              <Calendar className="w-5 h-5" />
              {new Date().toLocaleDateString("en-AE", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat) => (
            <Link key={stat.label} to={stat.to} className="glass-card stat-glow p-5 group cursor-pointer hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1 font-medium">{stat.label}</div>
            </Link>
          ))}
        </motion.div>

        {/* Alerts */}
        {(invoiceStats?.overdue || 0) > 0 && (
          <motion.div variants={item} className="glass-card p-4 border-warning/30 bg-warning/5">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-warning" />
              <p className="text-sm text-foreground">
                <span className="font-semibold">{invoiceStats?.overdue} overdue invoice(s)</span> requiring attention
              </p>
              <Button variant="outline" size="sm" asChild className="ml-auto">
                <Link to="/invoices">View Invoices</Link>
              </Button>
            </div>
          </motion.div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Revenue Chart */}
          <motion.div variants={item} className="floating-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-foreground text-xl">Revenue Analytics</h3>
                <p className="text-[15px] text-muted-foreground mt-1">Last 6 months collection</p>
              </div>
              <Badge variant="outline" className="text-sm border-border/40 text-muted-foreground px-4 py-1.5 rounded-xl">
                AED
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(153, 54%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(153, 54%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 13%)" />
                <XAxis dataKey="month" stroke="hsl(0, 0%, 30%)" fontSize={14} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(0, 0%, 30%)" fontSize={14} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 10%)",
                    border: "1px solid hsl(0, 0%, 18%)",
                    borderRadius: "16px",
                    color: "hsl(0, 0%, 95%)",
                    fontSize: "14px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    padding: "12px 16px",
                  }}
                  formatter={(value: number) => [`AED ${value.toLocaleString()}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(153, 54%, 45%)" fill="url(#revGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Occupancy Pie */}
          <motion.div variants={item} className="floating-card p-6">
            <h3 className="font-bold text-foreground text-xl mb-1">Unit Occupancy</h3>
            <p className="text-[15px] text-muted-foreground mb-5">Current portfolio status</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={occupancyData || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={4}
                  strokeWidth={0}
                >
                  {(occupancyData || []).map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 mt-4">
              {(occupancyData || []).map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[15px] text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="text-[15px] font-bold text-foreground">{d.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Pending Amount */}
          <motion.div variants={item} className="floating-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-foreground text-xl">Pending Collection</h3>
                <p className="text-[15px] text-muted-foreground mt-1">Outstanding invoices</p>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-10 text-[15px] text-muted-foreground hover:text-primary rounded-xl">
                <Link to="/invoices">View All <ChevronRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </div>
            <div className="text-4xl font-bold text-warning">
              AED {(invoiceStats?.totalPending || 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {invoiceStats?.pending || 0} pending • {invoiceStats?.overdue || 0} overdue
            </p>
          </motion.div>

          {/* Recent Payments */}
          <motion.div variants={item} className="floating-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-foreground text-xl">Recent Payments</h3>
                <p className="text-[15px] text-muted-foreground mt-1">Latest collections</p>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-10 text-[15px] text-muted-foreground hover:text-primary rounded-xl">
                <Link to="/payments">View All <ChevronRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </div>
            <div className="space-y-1">
              {recentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No payments recorded yet</p>
              ) : (
                recentPayments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-3 border-b border-border/20 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.tenants?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary">+AED {Number(p.amount).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Dashboard;

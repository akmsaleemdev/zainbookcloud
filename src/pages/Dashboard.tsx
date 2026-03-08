import { motion } from "framer-motion";
import {
  Building2, Home, BedDouble, Users, FileText, CreditCard,
  Wrench, TrendingUp, TrendingDown, ArrowUpRight
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";

const revenueData = [
  { month: "Jan", revenue: 125000, expenses: 45000 },
  { month: "Feb", revenue: 138000, expenses: 48000 },
  { month: "Mar", revenue: 142000, expenses: 42000 },
  { month: "Apr", revenue: 155000, expenses: 51000 },
  { month: "May", revenue: 168000, expenses: 47000 },
  { month: "Jun", revenue: 172000, expenses: 53000 },
];

const occupancyData = [
  { name: "Occupied", value: 78, color: "hsl(213, 90%, 50%)" },
  { name: "Vacant", value: 15, color: "hsl(220, 20%, 22%)" },
  { name: "Maintenance", value: 7, color: "hsl(38, 92%, 50%)" },
];

const maintenanceData = [
  { type: "Plumbing", count: 12 },
  { type: "Electrical", count: 8 },
  { type: "HVAC", count: 15 },
  { type: "Cleaning", count: 6 },
  { type: "Other", count: 4 },
];

const recentActivity = [
  { action: "New tenant registered", name: "Ahmed Al Maktoum", time: "2 min ago", type: "tenant" },
  { action: "Payment received", name: "AED 5,200", time: "15 min ago", type: "payment" },
  { action: "Maintenance request", name: "Unit 4B - AC Repair", time: "1 hour ago", type: "maintenance" },
  { action: "Lease renewed", name: "Sara Khan - Unit 2A", time: "3 hours ago", type: "lease" },
  { action: "New property added", name: "Marina Tower", time: "5 hours ago", type: "property" },
];

const stats = [
  { label: "Total Properties", value: "47", icon: Home, change: "+3", positive: true },
  { label: "Active Tenants", value: "312", icon: Users, change: "+18", positive: true },
  { label: "Occupancy Rate", value: "78%", icon: BedDouble, change: "+2.3%", positive: true },
  { label: "Monthly Revenue", value: "AED 172K", icon: CreditCard, change: "+8.5%", positive: true },
  { label: "Open Tickets", value: "23", icon: Wrench, change: "-5", positive: true },
  { label: "Active Leases", value: "289", icon: FileText, change: "+12", positive: true },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const Dashboard = () => {
  return (
    <AppLayout>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Welcome back! Here's your property overview.</p>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-AE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card stat-glow p-4">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="w-5 h-5 text-primary" />
                <span className={`text-xs font-medium flex items-center gap-0.5 ${stat.positive ? "text-success" : "text-destructive"}`}>
                  {stat.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Chart */}
          <motion.div variants={item} className="glass-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Revenue Analytics</h3>
              <span className="text-xs text-muted-foreground">Last 6 months</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(213, 90%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(213, 90%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 16%, 18%)" />
                <XAxis dataKey="month" stroke="hsl(218, 11%, 45%)" fontSize={12} />
                <YAxis stroke="hsl(218, 11%, 45%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220, 26%, 14%)",
                    border: "1px solid hsl(220, 16%, 22%)",
                    borderRadius: "8px",
                    color: "hsl(210, 40%, 98%)",
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(213, 90%, 50%)" fill="url(#revGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="hsl(0, 84%, 60%)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Occupancy Pie */}
          <motion.div variants={item} className="glass-card p-5">
            <h3 className="font-semibold text-foreground mb-4">Occupancy Rate</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {occupancyData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {occupancyData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-medium text-foreground">{d.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Maintenance Bar */}
          <motion.div variants={item} className="glass-card p-5">
            <h3 className="font-semibold text-foreground mb-4">Maintenance Requests</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={maintenanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 16%, 18%)" />
                <XAxis dataKey="type" stroke="hsl(218, 11%, 45%)" fontSize={12} />
                <YAxis stroke="hsl(218, 11%, 45%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220, 26%, 14%)",
                    border: "1px solid hsl(220, 16%, 22%)",
                    borderRadius: "8px",
                    color: "hsl(210, 40%, 98%)",
                  }}
                />
                <Bar dataKey="count" fill="hsl(213, 90%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={item} className="glass-card p-5">
            <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      a.type === "payment" ? "bg-success/10 text-success" :
                      a.type === "maintenance" ? "bg-warning/10 text-warning" :
                      "bg-primary/10 text-primary"
                    }`}>
                      {a.type === "payment" ? <CreditCard className="w-4 h-4" /> :
                       a.type === "maintenance" ? <Wrench className="w-4 h-4" /> :
                       a.type === "tenant" ? <Users className="w-4 h-4" /> :
                       a.type === "lease" ? <FileText className="w-4 h-4" /> :
                       <Building2 className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{a.action}</p>
                      <p className="text-xs text-muted-foreground">{a.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {a.time}
                    <ArrowUpRight className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Dashboard;

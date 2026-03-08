import { motion } from "framer-motion";
import {
  Building2, Home, BedDouble, Users, FileText, CreditCard,
  Wrench, TrendingUp, TrendingDown, Calendar,
  Clock, Sparkles, ChevronRight
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const revenueData = [
  { month: "Jan", revenue: 125000, expenses: 45000 },
  { month: "Feb", revenue: 138000, expenses: 48000 },
  { month: "Mar", revenue: 142000, expenses: 42000 },
  { month: "Apr", revenue: 155000, expenses: 51000 },
  { month: "May", revenue: 168000, expenses: 47000 },
  { month: "Jun", revenue: 172000, expenses: 53000 },
];

const occupancyData = [
  { name: "Occupied", value: 78, color: "hsl(153, 54%, 45%)" },
  { name: "Vacant", value: 15, color: "hsl(0, 0%, 18%)" },
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
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const Dashboard = () => {
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  })();

  return (
    <AppLayout>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-[1440px]">
        {/* Header */}
        <motion.div variants={item} className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight">{greeting}</h1>
            <p className="text-lg text-muted-foreground mt-2">Here's your property portfolio overview</p>
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
            <div key={stat.label} className="glass-card stat-glow p-5 group cursor-default">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <span className={`text-sm font-semibold flex items-center gap-1 ${stat.positive ? "text-primary" : "text-destructive"}`}>
                  {stat.positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {stat.change}
                </span>
              </div>
              <div className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1 font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Revenue Chart */}
          <motion.div variants={item} className="floating-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-foreground text-xl">Revenue Analytics</h3>
                <p className="text-[15px] text-muted-foreground mt-1">Last 6 months performance</p>
              </div>
              <Badge variant="outline" className="text-sm border-border/40 text-muted-foreground px-4 py-1.5 rounded-xl">
                AED
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(153, 54%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(153, 54%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 13%)" />
                <XAxis dataKey="month" stroke="hsl(0, 0%, 30%)" fontSize={14} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(0, 0%, 30%)" fontSize={14} tickLine={false} axisLine={false} />
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
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(153, 54%, 45%)" fill="url(#revGrad)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="expenses" stroke="hsl(0, 72%, 51%)" fill="transparent" strokeWidth={1.5} strokeDasharray="6 4" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Occupancy Pie */}
          <motion.div variants={item} className="floating-card p-6">
            <h3 className="font-bold text-foreground text-xl mb-1">Occupancy Rate</h3>
            <p className="text-[15px] text-muted-foreground mb-5">Current portfolio status</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={4}
                  strokeWidth={0}
                >
                  {occupancyData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 mt-4">
              {occupancyData.map((d) => (
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
          {/* Maintenance Bar */}
          <motion.div variants={item} className="floating-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-foreground text-xl">Maintenance</h3>
                <p className="text-[15px] text-muted-foreground mt-1">Active requests by category</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={maintenanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 13%)" />
                <XAxis dataKey="type" stroke="hsl(0, 0%, 30%)" fontSize={14} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(0, 0%, 30%)" fontSize={14} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 10%)",
                    border: "1px solid hsl(0, 0%, 18%)",
                    borderRadius: "16px",
                    color: "hsl(0, 0%, 95%)",
                    fontSize: "14px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  }}
                />
                <Bar dataKey="count" fill="hsl(153, 54%, 45%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={item} className="floating-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-foreground text-xl">Recent Activity</h3>
                <p className="text-[15px] text-muted-foreground mt-1">Latest updates</p>
              </div>
              <Button variant="ghost" size="sm" className="h-10 text-[15px] text-muted-foreground hover:text-primary rounded-xl">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-1">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center justify-between py-3.5 border-b border-border/20 last:border-0 group cursor-default">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                      a.type === "payment" ? "bg-primary/10 text-primary" :
                      a.type === "maintenance" ? "bg-warning/10 text-warning" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {a.type === "payment" ? <CreditCard className="w-5 h-5" /> :
                       a.type === "maintenance" ? <Wrench className="w-5 h-5" /> :
                       a.type === "tenant" ? <Users className="w-5 h-5" /> :
                       a.type === "lease" ? <FileText className="w-5 h-5" /> :
                       <Building2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-[15px] text-foreground font-semibold">{a.action}</p>
                      <p className="text-sm text-muted-foreground">{a.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {a.time}
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

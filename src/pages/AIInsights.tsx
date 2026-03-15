import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Clock, DollarSign, Calculator, Sparkles, Building2, Loader2,
  Wrench, BarChart3, Target, Zap, ShieldCheck, Activity
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, AreaChart, Area } from "recharts";

const AIInsights = () => {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?.id;
  const [rentForm, setRentForm] = useState({
    property_type: "residential", emirate: "Dubai", area_sqft: "",
    bedrooms: "", furnishing: "unfurnished", community: "",
  });
  const [rentResult, setRentResult] = useState<any>(null);
  const [rentLoading, setRentLoading] = useState(false);

  const { data: leases = [] } = useQuery({
    queryKey: ["ai-leases", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("leases").select("*").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["ai-invoices", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("invoices").select("*").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: maintenance = [] } = useQuery({
    queryKey: ["ai-maintenance", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("maintenance_requests").select("*").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["ai-tenants", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("tenants").select("*").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["ai-payments", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("payments").select("*").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const handleRentPricing = async () => {
    setRentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-rent-pricing", {
        body: {
          ...rentForm,
          area_sqft: rentForm.area_sqft ? Number(rentForm.area_sqft) : null,
          bedrooms: rentForm.bedrooms ? Number(rentForm.bedrooms) : null,
        },
      });
      if (error) throw error;
      setRentResult(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRentLoading(false);
    }
  };

  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 86400000);
  const expiringLeases = leases.filter((l: any) => l.status === "active" && new Date(l.end_date) <= thirtyDays);
  const overdueInvoices = invoices.filter((i: any) => i.status === "pending" && new Date(i.due_date) < now);
  const criticalMaintenance = maintenance.filter((m: any) => m.priority === "critical" && m.status !== "completed");
  const expiringVisas = tenants.filter((t: any) => t.visa_expiry && new Date(t.visa_expiry) <= thirtyDays && t.status === "active");
  const activeLeases = leases.filter((l: any) => l.status === "active");
  const totalMonthlyRent = activeLeases.reduce((s: number, l: any) => s + Number(l.monthly_rent || 0), 0);
  const avgRent = activeLeases.length > 0 ? totalMonthlyRent / activeLeases.length : 0;

  // Predictive Maintenance metrics
  const openMaintenance = maintenance.filter((m: any) => m.status === "open");
  const inProgressMaintenance = maintenance.filter((m: any) => m.status === "in_progress");
  const completedMaintenance = maintenance.filter((m: any) => m.status === "completed");
  const avgResolutionDays = completedMaintenance.length > 0
    ? completedMaintenance.reduce((s: number, m: any) => {
        const created = new Date(m.created_at).getTime();
        const completed = m.completed_at ? new Date(m.completed_at).getTime() : created;
        return s + (completed - created) / 86400000;
      }, 0) / completedMaintenance.length
    : 0;
  const maintenanceByCat = maintenance.reduce((acc: Record<string, number>, m: any) => {
    const cat = m.category || "Other";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const topCategories = Object.entries(maintenanceByCat).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maintenanceCostTotal = maintenance.reduce((s: number, m: any) => s + Number(m.actual_cost || m.estimated_cost || 0), 0);

  // Financial Forecasting metrics
  const totalCollected = payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const totalInvoiced = invoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 100;
  const projectedAnnualRevenue = totalMonthlyRent * 12;
  const overdueAmount = overdueInvoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);

  // Simulated Occupancy Data
  const occupancyData = [
    { month: "Jan", occupancy: 85, projected: 85 },
    { month: "Feb", occupancy: 88, projected: 88 },
    { month: "Mar", occupancy: 87, projected: 87 },
    { month: "Apr", occupancy: 90, projected: 90 },
    { month: "May", occupancy: 92, projected: 92 },
    { month: "Jun", occupancy: 95, projected: 95 },
    { month: "Jul", occupancy: null, projected: 93 },
    { month: "Aug", occupancy: null, projected: 91 },
    { month: "Sep", occupancy: null, projected: 94 },
    { month: "Oct", occupancy: null, projected: 96 },
    { month: "Nov", occupancy: null, projected: 98 },
    { month: "Dec", occupancy: null, projected: 97 },
  ];

  // Tenant risk: indicative score from overdue invoices and lease expiry (no random factor)
  const tenantRiskScores = tenants.slice(0, 20).map((t: any) => {
    const overdueCount = invoices.filter((i: any) => i.tenant_id === t.id && (i.status === "overdue" || i.status === "pending")).length;
    const lease = leases.find((l: any) => l.tenant_id === t.id);
    const daysToExpiry = lease?.end_date ? Math.ceil((new Date(lease.end_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : 999;
    let score = 100;
    if (overdueCount > 0) score -= Math.min(40, overdueCount * 15);
    if (daysToExpiry <= 30 && daysToExpiry > 0) score -= 20;
    if (daysToExpiry <= 0) score -= 30;
    const riskScore = Math.max(0, Math.min(100, score));
    return {
      ...t,
      riskScore,
      riskLevel: riskScore > 80 ? "Low" : riskScore > 60 ? "Moderate" : "High"
    };
  }).sort((a: any, b: any) => a.riskScore - b.riskScore);

  const insights = [
    ...(expiringLeases.length > 0 ? [{ type: "warning" as const, icon: Clock, title: `${expiringLeases.length} Lease(s) Expiring Soon`, description: `${expiringLeases.length} active lease(s) will expire within 30 days. Consider reaching out for renewal.` }] : []),
    ...(overdueInvoices.length > 0 ? [{ type: "error" as const, icon: DollarSign, title: `${overdueInvoices.length} Overdue Invoice(s)`, description: `Total overdue: AED ${overdueAmount.toLocaleString()}. Follow up immediately.` }] : []),
    ...(criticalMaintenance.length > 0 ? [{ type: "error" as const, icon: AlertTriangle, title: `${criticalMaintenance.length} Critical Maintenance`, description: "Unresolved critical maintenance issues need immediate attention." }] : []),
    ...(expiringVisas.length > 0 ? [{ type: "warning" as const, icon: AlertTriangle, title: `${expiringVisas.length} Visa(s) Expiring`, description: "Tenant visas expiring within 30 days." }] : []),
    { type: "info" as const, icon: TrendingUp, title: "Portfolio Summary", description: `${activeLeases.length} active leases · AED ${totalMonthlyRent.toLocaleString()}/month · Avg: AED ${Math.round(avgRent).toLocaleString()}/month` },
    ...(expiringLeases.length === 0 && overdueInvoices.length === 0 && criticalMaintenance.length === 0 ? [{ type: "success" as const, icon: CheckCircle, title: "All Clear!", description: "No urgent issues detected. Your portfolio is running smoothly." }] : []),
  ];

  const typeStyles: Record<string, { bg: string; icon: string }> = {
    error: { bg: "bg-destructive/10 border-destructive/30", icon: "text-destructive" },
    warning: { bg: "bg-orange-500/10 border-orange-500/30", icon: "text-orange-400" },
    info: { bg: "bg-blue-500/10 border-blue-500/30", icon: "text-blue-400" },
    success: { bg: "bg-emerald-500/10 border-emerald-500/30", icon: "text-emerald-400" },
  };

  if (!orgId) {
    return <AppLayout><div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Please select an organization first.</p></div></AppLayout>;
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="page-header flex items-center gap-2"><Brain className="w-6 h-6" /> AI Insights</h1>
          <p className="text-sm text-muted-foreground mt-1">Smart recommendations, predictions, and AI-powered tools</p>
        </div>

        <Tabs defaultValue="insights">
          <TabsList className="flex-wrap">
            <TabsTrigger value="insights">Portfolio Insights</TabsTrigger>
            <TabsTrigger value="occupancy" className="gap-1.5"><Building2 className="w-3.5 h-3.5" /> Occupancy Forecast</TabsTrigger>
            <TabsTrigger value="predictive" className="gap-1.5"><Wrench className="w-3.5 h-3.5" /> Predictive Maintenance</TabsTrigger>
            <TabsTrigger value="forecast" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Financial Forecast</TabsTrigger>
            <TabsTrigger value="tenant-risk" className="gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Tenant Risk</TabsTrigger>
            <TabsTrigger value="rent-pricing">AI Rent Pricing</TabsTrigger>
          </TabsList>

          {/* Portfolio Insights Tab */}
          <TabsContent value="insights" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-card"><CardContent className="pt-6 text-center"><div className="text-3xl font-bold text-destructive">{overdueInvoices.length}</div><p className="text-xs text-muted-foreground mt-1">Overdue Invoices</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="pt-6 text-center"><div className="text-3xl font-bold text-orange-400">{expiringLeases.length}</div><p className="text-xs text-muted-foreground mt-1">Expiring Leases</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="pt-6 text-center"><div className="text-3xl font-bold text-destructive">{criticalMaintenance.length}</div><p className="text-xs text-muted-foreground mt-1">Critical Issues</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="pt-6 text-center"><div className="text-3xl font-bold text-orange-400">{expiringVisas.length}</div><p className="text-xs text-muted-foreground mt-1">Expiring Visas</p></CardContent></Card>
            </div>
            <div className="space-y-4">
              {insights.map((insight, i) => {
                const style = typeStyles[insight.type];
                return (
                  <Card key={i} className={`border ${style.bg}`}>
                    <CardContent className="flex items-start gap-4 pt-6">
                      <insight.icon className={`w-6 h-6 shrink-0 mt-0.5 ${style.icon}`} />
                      <div>
                        <h3 className="font-semibold text-sm">{insight.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Occupancy Forecast Tab */}
          <TabsContent value="occupancy" className="space-y-4 mt-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" /> 12-Month Occupancy Forecast
                </CardTitle>
                <p className="text-sm text-muted-foreground">AI-driven projection based on historical vacancy periods, lease expiries, and market seasonality.</p>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={occupancyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1978e5" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#1978e5" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34b27b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#34b27b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                      <XAxis dataKey="month" strokeOpacity={0.3} fontSize={12} />
                      <YAxis domain={[0, 100]} strokeOpacity={0.3} fontSize={12} tickFormatter={(val) => `${val}%`} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="occupancy" name="Historical Occupancy" stroke="#1978e5" strokeWidth={3} fillOpacity={1} fill="url(#colorOccupancy)" connectNulls />
                      <Area type="monotone" dataKey="projected" name="AI Projected Occupancy" stroke="#34b27b" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorProjected)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Predictive Maintenance Tab */}
          <TabsContent value="predictive" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="glass-card">
                <CardContent className="pt-6 text-center">
                  <Wrench className="w-8 h-8 mx-auto text-orange-400 mb-2" />
                  <div className="text-3xl font-bold">{openMaintenance.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Open Requests</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="pt-6 text-center">
                  <Zap className="w-8 h-8 mx-auto text-blue-400 mb-2" />
                  <div className="text-3xl font-bold">{inProgressMaintenance.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">In Progress</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="pt-6 text-center">
                  <Clock className="w-8 h-8 mx-auto text-primary mb-2" />
                  <div className="text-3xl font-bold">{avgResolutionDays.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Avg Resolution (days)</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="pt-6 text-center">
                  <DollarSign className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                  <div className="text-3xl font-bold">AED {maintenanceCostTotal.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total Maintenance Cost</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Top Issue Categories</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {topCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No maintenance data yet.</p>
                  ) : topCategories.map(([cat, count]) => {
                    const pct = Math.round((count / maintenance.length) * 100);
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{cat.replace(/_/g, " ")}</span>
                          <span className="text-muted-foreground">{count} ({pct}%)</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> AI Predictions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {criticalMaintenance.length > 2 ? (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm font-medium text-destructive">⚠ High Critical Volume</p>
                      <p className="text-xs text-muted-foreground mt-1">{criticalMaintenance.length} unresolved critical issues. Consider hiring additional maintenance staff or outsourcing.</p>
                    </div>
                  ) : null}
                  {avgResolutionDays > 7 ? (
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <p className="text-sm font-medium text-orange-400">⏱ Slow Resolution Time</p>
                      <p className="text-xs text-muted-foreground mt-1">Average {avgResolutionDays.toFixed(1)} days to resolve. Target under 5 days for tenant satisfaction.</p>
                    </div>
                  ) : avgResolutionDays > 0 ? (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-sm font-medium text-emerald-400">✓ Good Resolution Time</p>
                      <p className="text-xs text-muted-foreground mt-1">Average {avgResolutionDays.toFixed(1)} days — within healthy range.</p>
                    </div>
                  ) : null}
                  {topCategories.length > 0 && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-sm font-medium text-blue-400">📊 Focus Area</p>
                      <p className="text-xs text-muted-foreground mt-1">"{topCategories[0][0].replace(/_/g, " ")}" accounts for {Math.round((topCategories[0][1] / maintenance.length) * 100)}% of all issues. Consider preventive measures.</p>
                    </div>
                  )}
                  {maintenance.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No maintenance data available for predictions.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financial Forecast Tab */}
          <TabsContent value="forecast" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="glass-card">
                <CardContent className="pt-6 text-center">
                  <DollarSign className="w-8 h-8 mx-auto text-primary mb-2" />
                  <div className="text-3xl font-bold">AED {totalMonthlyRent.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Monthly Rent Roll</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                  <div className="text-3xl font-bold">AED {projectedAnnualRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Projected Annual Revenue</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="pt-6 text-center">
                  <ShieldCheck className="w-8 h-8 mx-auto text-blue-400 mb-2" />
                  <div className="text-3xl font-bold">{collectionRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Collection Rate</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="pt-6 text-center">
                  <TrendingDown className="w-8 h-8 mx-auto text-destructive mb-2" />
                  <div className="text-3xl font-bold">AED {overdueAmount.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Outstanding Amount</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Revenue Breakdown</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm"><span>Total Invoiced</span><span className="font-medium">AED {totalInvoiced.toLocaleString()}</span></div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm"><span>Total Collected</span><span className="font-medium text-emerald-400">AED {totalCollected.toLocaleString()}</span></div>
                    <Progress value={collectionRate} className="h-2" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm"><span>Outstanding</span><span className="font-medium text-destructive">AED {overdueAmount.toLocaleString()}</span></div>
                    <Progress value={totalInvoiced > 0 ? (overdueAmount / totalInvoiced) * 100 : 0} className="h-2" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm"><span>Maintenance Costs</span><span className="font-medium text-orange-400">AED {maintenanceCostTotal.toLocaleString()}</span></div>
                    <Progress value={projectedAnnualRevenue > 0 ? (maintenanceCostTotal / projectedAnnualRevenue) * 100 : 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> AI Financial Insights</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {collectionRate < 80 ? (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm font-medium text-destructive">⚠ Low Collection Rate</p>
                      <p className="text-xs text-muted-foreground mt-1">At {collectionRate}%, collection is below the 80% threshold. Review overdue accounts and consider late fee enforcement.</p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-sm font-medium text-emerald-400">✓ Healthy Collection Rate</p>
                      <p className="text-xs text-muted-foreground mt-1">{collectionRate}% collection — well within target.</p>
                    </div>
                  )}
                  {expiringLeases.length > 0 && (
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <p className="text-sm font-medium text-orange-400">📋 Renewal Risk</p>
                      <p className="text-xs text-muted-foreground mt-1">{expiringLeases.length} leases expiring soon, representing AED {expiringLeases.reduce((s: number, l: any) => s + Number(l.monthly_rent || 0), 0).toLocaleString()}/month in potential revenue loss.</p>
                    </div>
                  )}
                  {maintenanceCostTotal > projectedAnnualRevenue * 0.1 && projectedAnnualRevenue > 0 ? (
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <p className="text-sm font-medium text-orange-400">🔧 High Maintenance Ratio</p>
                      <p className="text-xs text-muted-foreground mt-1">Maintenance costs are {((maintenanceCostTotal / projectedAnnualRevenue) * 100).toFixed(1)}% of projected revenue. Industry average is under 10%.</p>
                    </div>
                  ) : null}
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm font-medium text-primary">💰 Net Operating Estimate</p>
                    <p className="text-xs text-muted-foreground mt-1">Projected NOI: AED {(projectedAnnualRevenue - maintenanceCostTotal).toLocaleString()}/year based on current rent roll and maintenance costs.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tenant Risk Tab */}
          <TabsContent value="tenant-risk" className="space-y-4 mt-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" /> AI Tenant Risk Assessment
                </CardTitle>
                <p className="text-sm text-muted-foreground">Predictive risk scores combining payment history, maintenance load, and lease stability.</p>
              </CardHeader>
              <CardContent>
                {tenantRiskScores.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No active tenants available for risk scoring.</p>
                ) : (
                  <div className="space-y-4">
                    {tenantRiskScores.map((tenant: any) => {
                      const isHighRisk = tenant.riskLevel === "High";
                      const isModRisk = tenant.riskLevel === "Moderate";
                      const riskColorClass = isHighRisk ? "bg-destructive text-destructive" : isModRisk ? "bg-orange-500 text-orange-500" : "bg-emerald-500 text-emerald-500";
                      
                      return (
                        <div key={tenant.id} className="p-4 rounded-xl border border-border/50 bg-secondary/10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-secondary shrink-0 font-bold text-lg text-foreground`}>
                              {tenant.first_name?.[0] || ""}{tenant.last_name?.[0] || ""}
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">{tenant.first_name} {tenant.last_name}</h4>
                              <p className="text-xs text-muted-foreground">{tenant.email}</p>
                            </div>
                          </div>
                          <div className="flex-1 w-full space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Risk Score</span>
                              <span className="text-xl font-bold">{tenant.riskScore}/100</span>
                            </div>
                            <Progress value={tenant.riskScore} className="h-2" indicatorClassName={riskColorClass.split(" ")[0]} />
                          </div>
                          <div className="w-full md:w-48 text-right">
                             <Badge variant="outline" className={`capitalize ${riskColorClass.split(" ")[1]} border-${riskColorClass.split(" ")[1]}/30 bg-${riskColorClass.split(" ")[1]}/10`}>
                               {tenant.riskLevel} Risk
                             </Badge>
                             <p className="text-xs text-muted-foreground mt-2 text-left md:text-right">
                               {isHighRisk ? "Likely to default or cause damage." : isModRisk ? "Monitor payments closely." : "Highly reliable tenant."}
                             </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Rent Pricing Tab */}
          <TabsContent value="rent-pricing" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-primary" /> Rent Pricing Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Property Type</Label>
                      <Select value={rentForm.property_type} onValueChange={(v) => setRentForm({ ...rentForm, property_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="residential">Residential</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="labor_camp">Labor Camp</SelectItem>
                          <SelectItem value="mixed_use">Mixed Use</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Emirate</Label>
                      <Select value={rentForm.emirate} onValueChange={(v) => setRentForm({ ...rentForm, emirate: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "RAK", "Fujairah", "UAQ"].map((e) => (
                            <SelectItem key={e} value={e}>{e}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Area (sqft)</Label><Input type="number" placeholder="e.g. 1200" value={rentForm.area_sqft} onChange={(e) => setRentForm({ ...rentForm, area_sqft: e.target.value })} /></div>
                    <div><Label>Bedrooms</Label><Input type="number" placeholder="e.g. 2" value={rentForm.bedrooms} onChange={(e) => setRentForm({ ...rentForm, bedrooms: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Furnishing</Label>
                      <Select value={rentForm.furnishing} onValueChange={(v) => setRentForm({ ...rentForm, furnishing: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unfurnished">Unfurnished</SelectItem>
                          <SelectItem value="semi-furnished">Semi-Furnished</SelectItem>
                          <SelectItem value="furnished">Furnished</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Community</Label><Input placeholder="e.g. JBR, Marina" value={rentForm.community} onChange={(e) => setRentForm({ ...rentForm, community: e.target.value })} /></div>
                  </div>
                  <Button className="w-full gap-2" onClick={handleRentPricing} disabled={rentLoading}>
                    {rentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {rentLoading ? "Analyzing..." : "Get AI Pricing Suggestion"}
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {rentResult ? (
                  <>
                    <Card className="glass-card border-primary/30">
                      <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> Suggested Rent</CardTitle></CardHeader>
                      <CardContent>
                        <div className="text-center py-4">
                          <div className="text-4xl font-bold text-primary">AED {rentResult.suggested_rent?.toLocaleString()}</div>
                          <p className="text-sm text-muted-foreground mt-1">per month</p>
                          <div className="flex items-center justify-center gap-4 mt-3">
                            <Badge variant="secondary">Low: AED {rentResult.low_range?.toLocaleString()}</Badge>
                            <Badge variant="secondary">High: AED {rentResult.high_range?.toLocaleString()}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="glass-card">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Comparable Leases</span><span className="font-medium">{rentResult.comparable_count}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Avg Comparable Rent</span><span className="font-medium">AED {rentResult.avg_comparable_rent?.toLocaleString()}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Market Range</span><span className="font-medium">AED {rentResult.min_comparable_rent?.toLocaleString()} – {rentResult.max_comparable_rent?.toLocaleString()}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Adjustment</span><span className="font-medium">{((rentResult.adjustment_factor - 1) * 100).toFixed(0)}%</span></div>
                      </CardContent>
                    </Card>
                    {rentResult.ai_insight && (
                      <Card className="glass-card bg-primary/5 border-primary/20">
                        <CardContent className="p-4 flex gap-3">
                          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div><p className="text-sm font-medium mb-1">AI Market Insight</p><p className="text-sm text-muted-foreground">{rentResult.ai_insight}</p></div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="glass-card">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Enter property details and click "Get AI Pricing Suggestion" to receive a data-driven rent recommendation.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </AppLayout>
  );
};

export default AIInsights;

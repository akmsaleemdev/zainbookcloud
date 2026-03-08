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
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Clock, DollarSign, Calculator, Sparkles, Building2, Loader2
} from "lucide-react";

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

  const insights = [
    ...(expiringLeases.length > 0 ? [{ type: "warning" as const, icon: Clock, title: `${expiringLeases.length} Lease(s) Expiring Soon`, description: `${expiringLeases.length} active lease(s) will expire within 30 days. Consider reaching out for renewal.` }] : []),
    ...(overdueInvoices.length > 0 ? [{ type: "error" as const, icon: DollarSign, title: `${overdueInvoices.length} Overdue Invoice(s)`, description: `Total overdue: AED ${overdueInvoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0).toLocaleString()}. Follow up immediately.` }] : []),
    ...(criticalMaintenance.length > 0 ? [{ type: "error" as const, icon: AlertTriangle, title: `${criticalMaintenance.length} Critical Maintenance`, description: "Unresolved critical maintenance issues need immediate attention." }] : []),
    ...(expiringVisas.length > 0 ? [{ type: "warning" as const, icon: AlertTriangle, title: `${expiringVisas.length} Visa(s) Expiring`, description: "Tenant visas expiring within 30 days. Ensure compliance documentation is updated." }] : []),
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
          <p className="text-sm text-muted-foreground mt-1">Smart recommendations and AI-powered tools</p>
        </div>

        <Tabs defaultValue="insights">
          <TabsList>
            <TabsTrigger value="insights">Portfolio Insights</TabsTrigger>
            <TabsTrigger value="rent-pricing">AI Rent Pricing</TabsTrigger>
          </TabsList>

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

          <TabsContent value="rent-pricing" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Form */}
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
                    <div>
                      <Label>Area (sqft)</Label>
                      <Input type="number" placeholder="e.g. 1200" value={rentForm.area_sqft} onChange={(e) => setRentForm({ ...rentForm, area_sqft: e.target.value })} />
                    </div>
                    <div>
                      <Label>Bedrooms</Label>
                      <Input type="number" placeholder="e.g. 2" value={rentForm.bedrooms} onChange={(e) => setRentForm({ ...rentForm, bedrooms: e.target.value })} />
                    </div>
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
                    <div>
                      <Label>Community</Label>
                      <Input placeholder="e.g. JBR, Marina" value={rentForm.community} onChange={(e) => setRentForm({ ...rentForm, community: e.target.value })} />
                    </div>
                  </div>
                  <Button className="w-full gap-2" onClick={handleRentPricing} disabled={rentLoading}>
                    {rentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {rentLoading ? "Analyzing..." : "Get AI Pricing Suggestion"}
                  </Button>
                </CardContent>
              </Card>

              {/* Results */}
              <div className="space-y-4">
                {rentResult ? (
                  <>
                    <Card className="glass-card border-primary/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-primary" /> Suggested Rent
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-4">
                          <div className="text-4xl font-bold text-primary">
                            AED {rentResult.suggested_rent?.toLocaleString()}
                          </div>
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
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Comparable Leases</span>
                          <span className="font-medium">{rentResult.comparable_count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Avg Comparable Rent</span>
                          <span className="font-medium">AED {rentResult.avg_comparable_rent?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Market Range</span>
                          <span className="font-medium">AED {rentResult.min_comparable_rent?.toLocaleString()} – {rentResult.max_comparable_rent?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Adjustment Factor</span>
                          <span className="font-medium">{((rentResult.adjustment_factor - 1) * 100).toFixed(0)}%</span>
                        </div>
                      </CardContent>
                    </Card>

                    {rentResult.ai_insight && (
                      <Card className="glass-card bg-primary/5 border-primary/20">
                        <CardContent className="p-4 flex gap-3">
                          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium mb-1">AI Market Insight</p>
                            <p className="text-sm text-muted-foreground">{rentResult.ai_insight}</p>
                          </div>
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

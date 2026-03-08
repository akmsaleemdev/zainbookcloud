import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, DollarSign } from "lucide-react";

const AIInsights = () => {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?.id;

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

  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringLeases = leases.filter((l: any) => l.status === "active" && new Date(l.end_date) <= thirtyDays);
  const overdueInvoices = invoices.filter((i: any) => i.status === "pending" && new Date(i.due_date) < now);
  const criticalMaintenance = maintenance.filter((m: any) => m.priority === "critical" && m.status !== "completed");
  const expiringVisas = tenants.filter((t: any) => t.visa_expiry && new Date(t.visa_expiry) <= thirtyDays && t.status === "active");
  const activeLeases = leases.filter((l: any) => l.status === "active");
  const totalMonthlyRent = activeLeases.reduce((s: number, l: any) => s + Number(l.monthly_rent || 0), 0);
  const avgRent = activeLeases.length > 0 ? totalMonthlyRent / activeLeases.length : 0;

  const insights = [
    ...(expiringLeases.length > 0 ? [{
      type: "warning" as const, icon: Clock, title: `${expiringLeases.length} Lease(s) Expiring Soon`,
      description: `${expiringLeases.length} active lease(s) will expire within 30 days. Consider reaching out for renewal.`,
    }] : []),
    ...(overdueInvoices.length > 0 ? [{
      type: "error" as const, icon: DollarSign, title: `${overdueInvoices.length} Overdue Invoice(s)`,
      description: `Total overdue: AED ${overdueInvoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0).toLocaleString()}. Follow up immediately.`,
    }] : []),
    ...(criticalMaintenance.length > 0 ? [{
      type: "error" as const, icon: AlertTriangle, title: `${criticalMaintenance.length} Critical Maintenance`,
      description: "Unresolved critical maintenance issues need immediate attention.",
    }] : []),
    ...(expiringVisas.length > 0 ? [{
      type: "warning" as const, icon: AlertTriangle, title: `${expiringVisas.length} Visa(s) Expiring`,
      description: "Tenant visas expiring within 30 days. Ensure compliance documentation is updated.",
    }] : []),
    {
      type: "info" as const, icon: TrendingUp, title: "Portfolio Summary",
      description: `${activeLeases.length} active leases · AED ${totalMonthlyRent.toLocaleString()}/month · Avg: AED ${Math.round(avgRent).toLocaleString()}/month`,
    },
    ...(expiringLeases.length === 0 && overdueInvoices.length === 0 && criticalMaintenance.length === 0 ? [{
      type: "success" as const, icon: CheckCircle, title: "All Clear!",
      description: "No urgent issues detected. Your portfolio is running smoothly.",
    }] : []),
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
          <p className="text-sm text-muted-foreground mt-1">Smart recommendations based on your portfolio data</p>
        </div>

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
      </motion.div>
    </AppLayout>
  );
};

export default AIInsights;

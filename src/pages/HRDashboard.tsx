import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Users, AlertTriangle, Calendar, FileText, ArrowUpRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function HRDashboard() {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?.id;

  const { data: employeeCount = 0 } = useQuery({
    queryKey: ["hr-employees-count", orgId],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count } = await supabase.from("employees").select("*", { count: "exact", head: true }).eq("organization_id", orgId);
      return count || 0;
    },
    enabled: !!orgId,
  });

  const { data: pendingLeaves = 0 } = useQuery({
    queryKey: ["hr-pending-leaves", orgId],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count } = await supabase.from("leave_requests").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "pending");
      return count || 0;
    },
    enabled: !!orgId,
  });

  const { data: payrollSummary } = useQuery({
    queryKey: ["hr-payroll-summary", orgId],
    queryFn: async () => {
      if (!orgId) return { total: 0, nextRun: null };
      const { data: runs } = await supabase.from("payroll_runs").select("id, total_amount, pay_period_end, status").eq("organization_id", orgId).order("pay_period_end", { ascending: false }).limit(1);
      const run = runs?.[0];
      return { total: run ? Number(run.total_amount || 0) : 0, nextRun: run?.pay_period_end ?? null };
    },
    enabled: !!orgId,
  });

  const { data: recentEmployees = [] } = useQuery({
    queryKey: ["hr-recent-employees", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("employees").select("id, first_name, last_name, job_title, created_at").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!orgId,
  });

  const formatAgo = (iso: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    const now = new Date();
    const days = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
    if (days === 0) return "Today";
    if (days === 1) return "1d ago";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  if (!orgId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Please select an organization first.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 animate-fade-in pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="page-header">HR & Payroll Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your workforce and payroll metrics</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="glass-input rounded-xl h-11" asChild>
              <Link to="/reports">
                <FileText className="w-4 h-4 mr-2" />
                Download Reports
              </Link>
            </Button>
            <Button className="btn-premium rounded-xl h-11 px-6" asChild>
              <Link to="/payroll">Run Payroll</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card stat-glow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Employees</p>
                  <p className="text-3xl font-bold text-foreground">{employeeCount}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-muted-foreground">Manage in Employees</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card stat-glow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pending Leaves</p>
                  <p className="text-3xl font-bold text-foreground">{pendingLeaves}</p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-warning font-medium">Requires Approval</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card stat-glow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Last Payroll</p>
                  <p className="text-3xl font-bold text-foreground">AED {Number(payrollSummary?.total || 0).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-info/10 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-info" />
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {payrollSummary?.nextRun && (
                  <div className="text-xs text-muted-foreground font-medium">
                    Period end: {new Date(payrollSummary.nextRun).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card stat-glow gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between group">
                <div>
                  <p className="text-sm font-medium text-primary-foreground/80 mb-1">Expiring Documents</p>
                  <p className="text-3xl font-bold text-primary-foreground group-hover:scale-105 transition-transform origin-left">—</p>
                </div>
                <div className="w-12 h-12 bg-black/20 rounded-2xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="mt-4 text-sm text-primary-foreground/80 leading-relaxed font-medium">
                Visas & Emirates IDs (connect employee docs for count)
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Headcount
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground text-sm">Total employees: {employeeCount}. Use Reports for detailed analytics.</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Recent Hires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEmployees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No employees yet. Add from Employees.</p>
                ) : (
                  recentEmployees.map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                          {(e.first_name?.[0] || e.last_name?.[0] || "E").toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{[e.first_name, e.last_name].filter(Boolean).join(" ") || "Employee"}</p>
                          <p className="text-xs text-muted-foreground">{e.job_title || "—"}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                        {formatAgo(e.created_at)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AppLayout>
  );
}

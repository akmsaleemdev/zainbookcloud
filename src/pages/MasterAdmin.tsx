import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { PaymentGatewaysTab } from "@/components/master-admin/PaymentGatewaysTab";
import { EmailDomainsTab } from "@/components/master-admin/EmailDomainsTab";
import { PlanDialog, defaultPlanForm, type PlanFormData } from "@/components/master-admin/PlanDialog";
import { TenantsTab } from "@/components/master-admin/TenantsTab";
import { SubscriptionsTab } from "@/components/master-admin/SubscriptionsTab";
import { TicketsTab } from "@/components/master-admin/TicketsTab";
import { ModulesTab } from "@/components/master-admin/ModulesTab";
import { AuditLogsTab } from "@/components/master-admin/AuditLogsTab";
import {
  Shield, Building2, Plus, Pencil, Trash2,
  AlertTriangle, TrendingUp, Crown, CreditCard, FileText, Mail
} from "lucide-react";

const MasterAdmin = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [planDialog, setPlanDialog] = useState(false);
  const [editPlan, setEditPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState<PlanFormData>(defaultPlanForm);

  // Overview stats queries
  const { data: orgCount = 0 } = useQuery({
    queryKey: ["master-org-count"],
    queryFn: async () => {
      const { count } = await supabase.from("organizations").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: activeSubs = 0 } = useQuery({
    queryKey: ["master-active-subs"],
    queryFn: async () => {
      const { count } = await supabase.from("customer_subscriptions").select("*", { count: "exact", head: true }).in("status", ["active", "trialing"]);
      return count || 0;
    },
  });

  const { data: openTickets = 0 } = useQuery({
    queryKey: ["master-open-tickets"],
    queryFn: async () => {
      const { count } = await supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open");
      return count || 0;
    },
  });

  const { data: totalRevenue = 0 } = useQuery({
    queryKey: ["master-revenue"],
    queryFn: async () => {
      const { data } = await supabase.from("customer_subscriptions").select("total_amount");
      return (data || []).reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0);
    },
  });

  // Plans (for plans tab)
  const { data: plans = [] } = useQuery({
    queryKey: ["master-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("subscription_plans").select("*").order("sort_order");
      return data || [];
    },
  });

  // Plan mutations
  const savePlanMutation = useMutation({
    mutationFn: async () => {
      if (editPlan) {
        const { error } = await supabase.from("subscription_plans").update(planForm as any).eq("id", editPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subscription_plans").insert(planForm as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-plans"] });
      setPlanDialog(false); setEditPlan(null);
      toast({ title: editPlan ? "Plan updated" : "Plan created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subscription_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-plans"] });
      toast({ title: "Plan deleted" });
    },
  });

  const stats = [
    { label: "Total Organizations", value: orgCount, icon: Building2, color: "text-blue-400" },
    { label: "Active Subscriptions", value: activeSubs, icon: Crown, color: "text-primary" },
    { label: "Open Tickets", value: openTickets, icon: AlertTriangle, color: "text-amber-400" },
    { label: "Revenue (AED)", value: Number(totalRevenue).toLocaleString(), icon: TrendingUp, color: "text-emerald-400" },
  ];

  const openAddPlan = () => {
    setEditPlan(null);
    setPlanForm(defaultPlanForm);
    setPlanDialog(true);
  };

  const openEditPlan = (p: any) => {
    setEditPlan(p);
    setPlanForm({
      name: p.name || "", description: p.description || "", plan_type: p.plan_type || "monthly",
      price: p.price || 0, max_users: p.max_users ?? 5, max_units: p.max_units ?? 25,
      max_properties: p.max_properties ?? 10, max_tenants: p.max_tenants ?? 50,
      max_storage_gb: p.max_storage_gb ?? 5, max_api_calls: p.max_api_calls ?? 2000,
      ai_usage_limit: p.ai_usage_limit ?? 200, report_access: p.report_access !== false,
      ai_features_access: p.ai_features_access !== false,
    });
    setPlanDialog(true);
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="page-header flex items-center gap-2"><Shield className="w-6 h-6 text-primary" /> Master Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform-wide management and analytics</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/50 flex-wrap">
            <TabsTrigger value="overview">Organizations</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="gateways" className="gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Gateways
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <TenantsTab />
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={openAddPlan} className="gap-2"><Plus className="w-4 h-4" /> Add Plan</Button>
            </div>
            <div className="glass-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Properties</TableHead>
                    <TableHead>AI</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><Badge variant="secondary">{p.plan_type}</Badge></TableCell>
                      <TableCell>AED {p.price}</TableCell>
                      <TableCell>{p.max_users === -1 ? "∞" : p.max_users}</TableCell>
                      <TableCell>{p.max_units === -1 ? "∞" : p.max_units}</TableCell>
                      <TableCell>{p.max_properties === -1 ? "∞" : p.max_properties ?? "—"}</TableCell>
                      <TableCell>{p.ai_features_access !== false ? "✓" : "✗"}</TableCell>
                      <TableCell><Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditPlan(p)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deletePlanMutation.mutate(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <SubscriptionsTab />
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            <TicketsTab />
          </TabsContent>

          <TabsContent value="modules" className="space-y-4">
            <ModulesTab />
          </TabsContent>

          <TabsContent value="gateways">
            <PaymentGatewaysTab />
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <AuditLogsTab />
          </TabsContent>
        </Tabs>
      </motion.div>

      <PlanDialog
        open={planDialog}
        onOpenChange={setPlanDialog}
        form={planForm}
        setForm={setPlanForm}
        isEdit={!!editPlan}
        onSave={() => savePlanMutation.mutate()}
        isSaving={savePlanMutation.isPending}
      />
    </AppLayout>
  );
};

export default MasterAdmin;

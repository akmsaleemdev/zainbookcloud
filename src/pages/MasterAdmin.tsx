import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { PaymentGatewaysTab } from "@/components/master-admin/PaymentGatewaysTab";
import { PlanDialog, defaultPlanForm, type PlanFormData } from "@/components/master-admin/PlanDialog";
import {
  Shield, Building2, Search, Plus, Pencil, Trash2,
  AlertTriangle, TrendingUp, Crown, CreditCard
} from "lucide-react";

const MasterAdmin = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [planDialog, setPlanDialog] = useState(false);
  const [editPlan, setEditPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState<PlanFormData>(defaultPlanForm);

  // Queries
  const { data: allOrgs = [] } = useQuery({
    queryKey: ["master-orgs"],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: allSubs = [] } = useQuery({
    queryKey: ["master-subs"],
    queryFn: async () => {
      const { data } = await supabase.from("customer_subscriptions").select("*, subscription_plans(*), organizations(name)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["master-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("subscription_plans").select("*").order("sort_order");
      return data || [];
    },
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["master-tickets"],
    queryFn: async () => {
      const { data } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["master-modules"],
    queryFn: async () => {
      const { data } = await supabase.from("platform_modules").select("*").order("sort_order");
      return data || [];
    },
  });

  // Mutations
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
    { label: "Total Tenants", value: allOrgs.length, icon: Building2, color: "text-blue-400" },
    { label: "Active Subscriptions", value: allSubs.filter((s: any) => s.status === "active").length, icon: Crown, color: "text-primary" },
    { label: "Open Tickets", value: tickets.filter((t: any) => t.status === "open").length, icon: AlertTriangle, color: "text-amber-400" },
    { label: "Revenue (AED)", value: allSubs.reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0).toLocaleString(), icon: TrendingUp, color: "text-emerald-400" },
  ];

  const filteredOrgs = allOrgs.filter((o: any) => o.name?.toLowerCase().includes(search.toLowerCase()));

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
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="overview">Tenants</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="gateways" className="gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Payment Gateways
            </TabsTrigger>
          </TabsList>

          {/* Tenants Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search tenants..." className="pl-10 bg-secondary/50 border-border/50" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="glass-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Emirate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No tenants found</TableCell></TableRow>
                  ) : filteredOrgs.map((org: any) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>{org.emirate || "—"}</TableCell>
                      <TableCell><Badge variant={org.is_active ? "default" : "secondary"}>{org.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(org.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Plans Tab */}
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

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <div className="glass-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allSubs.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No subscriptions yet</TableCell></TableRow>
                  ) : allSubs.map((sub: any) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.organizations?.name || "—"}</TableCell>
                      <TableCell>{sub.subscription_plans?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={sub.status === "active" ? "default" : sub.status === "suspended" ? "destructive" : "secondary"}>
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{sub.billing_cycle}</TableCell>
                      <TableCell>AED {sub.total_amount || 0}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-4">
            <div className="glass-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No tickets yet</TableCell></TableRow>
                  ) : tickets.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.ticket_number}</TableCell>
                      <TableCell className="font-medium">{t.subject}</TableCell>
                      <TableCell><Badge variant="secondary">{t.category}</Badge></TableCell>
                      <TableCell>
                        <Badge className={t.priority === "critical" ? "bg-destructive/20 text-destructive" : t.priority === "high" ? "bg-amber-500/20 text-amber-400" : "bg-muted text-muted-foreground"}>
                          {t.priority}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge variant={t.status === "open" ? "default" : "secondary"}>{t.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((m: any) => (
                <Card key={m.id} className="glass-card">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{m.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
                      <Badge variant="secondary" className="mt-2 text-xs">{m.category}</Badge>
                    </div>
                    <Badge variant={m.is_active ? "default" : "secondary"}>{m.is_active ? "Active" : "Disabled"}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Payment Gateways Tab */}
          <TabsContent value="gateways">
            <PaymentGatewaysTab />
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

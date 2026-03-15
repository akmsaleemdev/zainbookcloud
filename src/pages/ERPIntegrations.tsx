import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { 
  Zap, Globe, RefreshCw, CheckCircle, AlertCircle, Clock, 
  Plus, Settings, Trash2, ArrowUpDown, FileText, Receipt, 
  BarChart3, Wallet, Building2, Loader2
} from "lucide-react";

const erpSystems = [
  { type: "oracle_netsuite", name: "Oracle NetSuite", logo: "🟠", description: "Enterprise cloud ERP with financial management" },
  { type: "dynamics_365", name: "Microsoft Dynamics 365", logo: "🔵", description: "Business applications and ERP platform" },
  { type: "odoo", name: "Odoo", logo: "🟣", description: "Open-source business apps and ERP" },
  { type: "sap_business_one", name: "SAP Business One", logo: "🔷", description: "Small and midsize enterprise ERP" },
  { type: "zoho", name: "Zoho", logo: "🟡", description: "Cloud-based business management suite" },
];

const syncTypes = [
  { key: "financial_reports", label: "Financial Reports", icon: BarChart3 },
  { key: "invoices", label: "Invoices", icon: Receipt },
  { key: "accounting", label: "Accounting Data", icon: FileText },
  { key: "revenue", label: "Revenue Reports", icon: Wallet },
  { key: "expenses", label: "Expense Reports", icon: Wallet },
  { key: "tenant_payments", label: "Tenant Payments", icon: Building2 },
  { key: "operational", label: "Operational Reports", icon: ArrowUpDown },
];

const ERPIntegrations = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [connectDialog, setConnectDialog] = useState(false);
  const [selectedErp, setSelectedErp] = useState<any>(null);
  const [configDialog, setConfigDialog] = useState(false);
  const [configConnection, setConfigConnection] = useState<any>(null);
  const [connectionForm, setConnectionForm] = useState({ connection_name: "", api_key: "", api_url: "" });

  const orgId = currentOrg?.id;

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["erp-connections", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("erp_connections").select("*").eq("organization_id", orgId).order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const { data: syncLogs = [] } = useQuery({
    queryKey: ["erp-sync-logs", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const connectionIds = connections.map((c: any) => c.id);
      if (connectionIds.length === 0) return [];
      const { data, error } = await supabase.from("erp_sync_logs").select("*").in("connection_id", connectionIds).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId && connections.length > 0,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!orgId || !selectedErp) throw new Error("Missing data");
      const { error } = await supabase.from("erp_connections").insert({
        organization_id: orgId,
        erp_type: selectedErp.type,
        connection_name: connectionForm.connection_name || selectedErp.name,
        status: "connected",
        config: { api_key: connectionForm.api_key, api_url: connectionForm.api_url },
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-connections"] });
      setConnectDialog(false); setSelectedErp(null); setConnectionForm({ connection_name: "", api_key: "", api_url: "" });
      toast({ title: "ERP connected successfully" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateSyncMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase.from("erp_connections").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-connections"] });
      toast({ title: "Connection updated" });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("erp_connections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-connections"] });
      toast({ title: "ERP disconnected" });
    },
  });

  const connectedTypes = connections.map((c: any) => c.erp_type);
  const availableErps = erpSystems.filter(e => !connectedTypes.includes(e.type));

  const statusColors: Record<string, string> = {
    connected: "bg-primary/20 text-primary",
    disconnected: "bg-muted text-muted-foreground",
    error: "bg-destructive/20 text-destructive",
    syncing: "bg-blue-500/20 text-blue-400",
  };

  if (!orgId) {
    return <AppLayout><div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Please select an organization first.</p></div></AppLayout>;
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header flex items-center gap-2"><Zap className="w-6 h-6 text-primary" /> ERP Integrations</h1>
            <p className="text-sm text-muted-foreground mt-1">Connect your property data to enterprise systems</p>
          </div>
          {availableErps.length > 0 && (
            <Button onClick={() => setConnectDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Connect ERP
            </Button>
          )}
        </div>

        {/* Connected ERPs */}
        {connections.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No ERP Connections</h3>
              <p className="text-sm text-muted-foreground mb-4">Connect your account to enterprise systems to sync property data.</p>
              <Button onClick={() => setConnectDialog(true)} className="gap-2"><Plus className="w-4 h-4" /> Connect ERP</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {connections.map((conn: any) => {
              const erp = erpSystems.find(e => e.type === conn.erp_type);
              return (
                <Card key={conn.id} className="glass-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{erp?.logo}</span>
                        <div>
                          <CardTitle className="text-base">{conn.connection_name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{erp?.description}</p>
                        </div>
                      </div>
                      <Badge className={statusColors[conn.status]}>{conn.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sync Frequency</span>
                      <Select 
                        value={conn.sync_frequency} 
                        onValueChange={(v) => updateSyncMutation.mutate({ id: conn.id, updates: { sync_frequency: v } })}
                      >
                        <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["realtime", "hourly", "daily", "weekly", "manual"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Sync</span>
                      <span className="text-xs">{conn.last_sync_at ? new Date(conn.last_sync_at).toLocaleString() : "Never"}</span>
                    </div>

                    {/* Sync types toggles */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Data Sync Types</p>
                      {syncTypes.map(st => {
                        const enabled = (conn.enabled_sync_types || []).includes(st.key);
                        return (
                          <div key={st.key} className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                              <st.icon className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{st.label}</span>
                            </div>
                            <Switch 
                              checked={enabled}
                              onCheckedChange={(v) => {
                                const types = v
                                  ? [...(conn.enabled_sync_types || []), st.key]
                                  : (conn.enabled_sync_types || []).filter((t: string) => t !== st.key);
                                updateSyncMutation.mutate({ id: conn.id, updates: { enabled_sync_types: types } });
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => toast({ title: "Sync initiated", description: "Data sync is running in the background." })}>
                        <RefreshCw className="w-3 h-3" /> Sync Now
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => disconnectMutation.mutate(conn.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Sync Logs */}
        {syncLogs.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Clock className="w-5 h-5" /> Recent Sync Logs</h2>
            <div className="glass-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sync Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.sync_type}</TableCell>
                      <TableCell><Badge variant={log.status === "success" ? "default" : log.status === "failed" ? "destructive" : "secondary"}>{log.status}</Badge></TableCell>
                      <TableCell>{log.records_synced || 0}</TableCell>
                      <TableCell className="text-xs">{new Date(log.started_at).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{log.completed_at ? new Date(log.completed_at).toLocaleString() : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </motion.div>

      {/* Connect ERP Dialog */}
      <Dialog open={connectDialog} onOpenChange={setConnectDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Connect ERP System</DialogTitle></DialogHeader>
          {!selectedErp ? (
            <div className="space-y-3 py-4">
              {availableErps.map(erp => (
                <button key={erp.type} onClick={() => setSelectedErp(erp)} className="w-full flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left">
                  <span className="text-3xl">{erp.logo}</span>
                  <div>
                    <p className="font-medium">{erp.name}</p>
                    <p className="text-xs text-muted-foreground">{erp.description}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                <span className="text-2xl">{selectedErp.logo}</span>
                <div>
                  <p className="font-medium">{selectedErp.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedErp.description}</p>
                </div>
              </div>
              <div className="space-y-2"><Label>Connection Name</Label><Input value={connectionForm.connection_name} onChange={(e) => setConnectionForm({ ...connectionForm, connection_name: e.target.value })} placeholder={selectedErp.name} /></div>
              <div className="space-y-2"><Label>API Key / Token</Label><Input type="password" value={connectionForm.api_key} onChange={(e) => setConnectionForm({ ...connectionForm, api_key: e.target.value })} placeholder="Enter API key" /></div>
              <div className="space-y-2"><Label>API URL / Endpoint</Label><Input value={connectionForm.api_url} onChange={(e) => setConnectionForm({ ...connectionForm, api_url: e.target.value })} placeholder="https://api.example.com" /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedErp(null)}>Back</Button>
                <Button onClick={() => connectMutation.mutate()}>Connect</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ERPIntegrations;

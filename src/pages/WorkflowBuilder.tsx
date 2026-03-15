import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Zap, Plus, ArrowRight, Play, Settings, Save, Trash2, Clock, Mail, MessageSquare, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";

export type WorkflowNode = {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  title: string;
  config: Record<string, any>;
  icon: any;
};

const NODE_ICONS = { trigger: Zap, condition: AlertTriangle, action: Play } as const;

function nodesFromDb(nodesJson: { id: string; type: string; title: string; config?: Record<string, unknown> }[]): WorkflowNode[] {
  if (!Array.isArray(nodesJson)) return [];
  return nodesJson.map((n) => ({
    id: n.id,
    type: (n.type === "trigger" || n.type === "condition" || n.type === "action" ? n.type : "action") as WorkflowNode["type"],
    title: n.title || "Untitled",
    config: n.config || {},
    icon: NODE_ICONS[n.type as keyof typeof NODE_ICONS] || Play,
  }));
}

function nodesToDb(nodes: WorkflowNode[]): { id: string; type: string; title: string; config: Record<string, unknown> }[] {
  return nodes.map((n) => ({ id: n.id, type: n.type, title: n.title, config: n.config || {} }));
}

function formatLastRun(lastRunAt: string | null): string {
  if (!lastRunAt) return "Never";
  const d = new Date(lastRunAt);
  const now = new Date();
  const ms = now.getTime() - d.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

export default function WorkflowBuilder() {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const { data: workflowsRows = [] } = useQuery({
    queryKey: ["workflows", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("workflows").select("id, name, status, nodes, last_run_at").eq("organization_id", orgId).order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const workflows = workflowsRows.map((w: any) => ({
    id: w.id,
    name: w.name,
    status: w.status,
    lastRun: formatLastRun(w.last_run_at),
    nodes: nodesFromDb(w.nodes || []),
  }));

  const [editingWf, setEditingWf] = useState<string | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [activeNodes, setActiveNodes] = useState<WorkflowNode[]>([]);
  const [wfName, setWfName] = useState("New Automation");

  const saveMutation = useMutation({
    mutationFn: async ({ id, name, nodes }: { id?: string; name: string; nodes: WorkflowNode[] }) => {
      if (!orgId) throw new Error("Select an organization first");
      const payload = { name: name.trim(), nodes: nodesToDb(nodes), updated_at: new Date().toISOString() };
      if (id) {
        const { error } = await supabase.from("workflows").update(payload).eq("id", id).eq("organization_id", orgId);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("workflows").insert({ organization_id: orgId, ...payload });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows", orgId] });
      setIsBuilderOpen(false);
      setEditingWf(null);
      toast.success("Workflow saved");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to save workflow"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error("Select an organization first");
      const { error } = await supabase.from("workflows").delete().eq("id", id).eq("organization_id", orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows", orgId] });
      toast.success("Workflow deleted");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to delete workflow"),
  });

  const openBuilder = (wfId?: string) => {
    if (wfId) {
      const wf = workflows.find(w => w.id === wfId);
      if (wf) {
        setWfName(wf.name);
        setActiveNodes(wf.nodes);
        setEditingWf(wf.id);
      }
    } else {
      setWfName("New Automation");
      setActiveNodes([]);
      setEditingWf(null);
    }
    setIsBuilderOpen(true);
  };

  const saveWorkflow = () => {
    if (activeNodes.length === 0) {
      toast.error("Workflow must have at least one node.");
      return;
    }
    const name = wfName.trim() || "Unnamed Workflow";
    saveMutation.mutate({ id: editingWf || undefined, name, nodes: activeNodes });
  };

  const deleteWorkflow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate(id);
  };

  const addNode = (type: 'trigger' | 'condition' | 'action') => {
    const newNode: WorkflowNode = {
      id: `n-${Date.now()}`,
      type,
      title: type === 'trigger' ? 'New Trigger' : type === 'condition' ? 'New Condition' : 'New Action',
      icon: type === 'trigger' ? Zap : type === 'condition' ? AlertTriangle : Play,
      config: {}
    };
    setActiveNodes(prev => [...prev, newNode]);
  };

  const removeNode = (id: string) => {
    setActiveNodes(prev => prev.filter(n => n.id !== id));
  };

  const getNodeColor = (type: string) => {
    switch(type) {
      case 'trigger': return 'bg-violet-500/10 border-violet-500/30 text-violet-500';
      case 'condition': return 'bg-amber-500/10 border-amber-500/30 text-amber-500';
      case 'action': return 'bg-success/10 border-success/30 text-success';
      default: return 'bg-secondary border-border text-foreground';
    }
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
              <Zap className="w-8 h-8 text-primary" />
              Automation Builder
            </h1>
            <p className="text-muted-foreground mt-1">Create intelligent property management workflows</p>
          </div>
          <Button className="btn-premium" onClick={() => openBuilder()}>
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.length === 0 ? (
            <Card className="glass-card col-span-full p-12 text-center">
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Create triggers, conditions, and actions to automate rent reminders, lease renewals, and more.</p>
              <Button className="btn-premium" onClick={() => openBuilder()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Workflow
              </Button>
            </Card>
          ) : workflows.map(wf => (
            <Card key={wf.id} className="glass-card cursor-pointer hover:border-primary/30 transition-all group" onClick={() => openBuilder(wf.id)}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={wf.status === 'active' ? 'default' : 'secondary'} className="capitalize">{wf.status}</Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10" onClick={(e) => deleteWorkflow(wf.id, e)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <h3 className="font-semibold text-lg mb-1">{wf.name}</h3>
                <p className="text-xs text-muted-foreground mb-6">Last run: {wf.lastRun}</p>

                <div className="flex bg-secondary/30 rounded-lg p-2 gap-1 overflow-hidden">
                  {wf.nodes.map((node, i) => {
                    const Icon = node.icon;
                    return (
                      <div key={node.id} className="flex items-center">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center border ${getNodeColor(node.type)}`} title={node.title}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {i < wf.nodes.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground mx-1" />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Builder Dialog */}
        <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
          <DialogContent className="bg-card glass-card border-border sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-6 border-b border-border/50 bg-secondary/10">
              <div className="flex justify-between items-center">
                <div>
                  <DialogTitle className="text-xl">Workflow Canvas</DialogTitle>
                  <DialogDescription>Define triggers, conditions, and actions</DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    value={wfName} 
                    onChange={(e) => setWfName(e.target.value)}
                    className="w-48 bg-background border-border"
                    placeholder="Workflow Name"
                  />
                  <Button variant="outline" onClick={() => setIsBuilderOpen(false)}>Cancel</Button>
                  <Button className="btn-premium" onClick={saveWorkflow} disabled={saveMutation.isPending}><Save className="w-4 h-4 mr-2" /> Save</Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-8 bg-black/5 flex flex-col items-center">
              
              {activeNodes.length === 0 ? (
                <div className="text-center py-20 max-w-sm">
                  <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto flex items-center justify-center mb-4">
                    <Zap className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Empty Workflow</h3>
                  <p className="text-muted-foreground text-sm mb-6">Start by adding a trigger that will kick off this automation.</p>
                  <Button onClick={() => addNode('trigger')} className="btn-premium"><Plus className="w-4 h-4 mr-2" /> Add Trigger</Button>
                </div>
              ) : (
                <div className="w-full max-w-2xl space-y-4">
                  {activeNodes.map((node, i) => {
                    const Icon = node.icon;
                    const isTrigger = node.type === 'trigger';
                    const isCondition = node.type === 'condition';
                    
                    return (
                      <div key={node.id} className="relative">
                        {/* Connecting Line */}
                        {i > 0 && (
                          <div className="absolute -top-4 left-1/2 w-0.5 h-4 bg-border/50 -translate-x-1/2" />
                        )}
                        
                        <Card className={`glass-card border-2 ${isTrigger ? 'border-violet-500/30' : isCondition ? 'border-amber-500/30' : 'border-success/30'}`}>
                          <CardContent className="p-4 flex gap-4 items-start">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${getNodeColor(node.type)}`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <Badge variant="outline" className={`mb-1 uppercase text-[10px] tracking-wider ${getNodeColor(node.type)}`}>{node.type}</Badge>
                                  <h4 className="font-semibold text-foreground">{node.title}</h4>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeNode(node.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Config area for selected node */}
                              <div className="mt-4 p-3 bg-secondary/30 rounded-lg border border-border/50">
                                {isTrigger ? (
                                  <div className="space-y-3">
                                    <Label className="text-xs">Event Type</Label>
                                    <Select defaultValue="invoice_overdue">
                                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="invoice_overdue">Invoice Overdue</SelectItem>
                                        <SelectItem value="lease_expiring">Lease Expiring</SelectItem>
                                        <SelectItem value="maintenance_created">Maintenance Raised</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ) : isCondition ? (
                                  <div className="space-y-3">
                                    <Label className="text-xs">Condition Rule</Label>
                                    <div className="flex gap-2">
                                      <Select defaultValue="amount"><SelectTrigger className="h-8 text-sm"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="amount">Outstanding Amount</SelectItem></SelectContent></Select>
                                      <Select defaultValue="gt"><SelectTrigger className="h-8 text-sm w-20"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="gt">{">"}</SelectItem></SelectContent></Select>
                                      <Input className="h-8 text-sm w-24" defaultValue="0" type="number" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <Label className="text-xs">Action Type</Label>
                                    <Select defaultValue="whatsapp">
                                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="whatsapp">Send WhatsApp Message</SelectItem>
                                        <SelectItem value="email">Send Email</SelectItem>
                                        <SelectItem value="task">Create Task</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Label className="text-xs mt-2 block">Message Template</Label>
                                    <Input className="h-8 text-sm" defaultValue="Friendly reminder: your rent is due..." />
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )
                  })}
                  
                  {/* Add Node Button Block */}
                  <div className="pt-4 flex justify-center pb-8">
                    <div className="flex gap-2 bg-secondary/80 p-1.5 rounded-full border border-border/50 shadow-lg backdrop-blur-md">
                      {activeNodes.length === 0 || activeNodes[0].type !== 'trigger' ? (
                        <Button variant="ghost" size="sm" className="rounded-full text-violet-500 hover:text-violet-400 hover:bg-violet-500/10" onClick={() => addNode('trigger')}><Zap className="w-4 h-4 mr-2"/> Trigger</Button>
                      ) : (
                        <>
                          <Button variant="ghost" size="sm" className="rounded-full text-amber-500 hover:text-amber-400 hover:bg-amber-500/10" onClick={() => addNode('condition')}><AlertTriangle className="w-4 h-4 mr-2"/> Condition</Button>
                          <Button variant="ghost" size="sm" className="rounded-full text-success hover:text-success hover:bg-success/10" onClick={() => addNode('action')}><Play className="w-4 h-4 mr-2"/> Action</Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </motion.div>
    </AppLayout>
  );
}

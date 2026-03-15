import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { DollarSign, FileText, ArrowUpRight, ArrowDownRight, Activity, Percent, BookOpen, Download, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";

const ACCOUNT_TYPES = ["asset", "liability", "equity", "revenue", "expense"] as const;

const COA_TEMPLATE: { account_code: string; account_name: string; account_type: string }[] = [
  { account_code: "1000", account_name: "Cash and Bank", account_type: "asset" },
  { account_code: "1100", account_name: "Receivables", account_type: "asset" },
  { account_code: "1200", account_name: "Prepaid Rent", account_type: "asset" },
  { account_code: "2000", account_name: "Payables", account_type: "liability" },
  { account_code: "2100", account_name: "Security Deposits", account_type: "liability" },
  { account_code: "3000", account_name: "Owner Equity", account_type: "equity" },
  { account_code: "4000", account_name: "Rental Income", account_type: "revenue" },
  { account_code: "4100", account_name: "Other Income", account_type: "revenue" },
  { account_code: "5000", account_name: "Operating Expenses", account_type: "expense" },
  { account_code: "5100", account_name: "Maintenance", account_type: "expense" },
  { account_code: "5200", account_name: "Utilities", account_type: "expense" },
];

export default function Accounting() {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const [coaTab, setCoaTab] = useState("coa");
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({ account_code: "", account_name: "", account_type: "expense" as string, opening_balance: "", description: "" });
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);

  const { data: payments = [] } = useQuery({
    queryKey: ["accounting-payments", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("payments").select("amount, status").eq("organization_id", orgId).eq("status", "completed");
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["accounting-invoices", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("invoices").select("total_amount, vat_amount, status").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["accounting-expenses", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("expenses").select("total_amount, status").eq("organization_id", orgId).in("status", ["approved", "paid"]);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounting-coa", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("chart_of_accounts").select("*").eq("organization_id", orgId).eq("is_active", true).order("account_code");
      return data || [];
    },
    enabled: !!orgId,
  });

  const coaMutation = useMutation({
    mutationFn: async (payload: { id?: string; account_code: string; account_name: string; account_type: string; opening_balance?: number; description?: string }) => {
      if (!orgId) throw new Error("No organization");
      if (payload.id) {
        const { error } = await supabase.from("chart_of_accounts").update({
          account_name: payload.account_name,
          account_type: payload.account_type,
          description: payload.description || null,
          updated_at: new Date().toISOString(),
        }).eq("id", payload.id).eq("organization_id", orgId);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("chart_of_accounts").insert({
        organization_id: orgId,
        account_code: payload.account_code.trim(),
        account_name: payload.account_name.trim(),
        account_type: payload.account_type,
        opening_balance: payload.opening_balance ?? 0,
        current_balance: payload.opening_balance ?? 0,
        description: payload.description?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounting-coa", orgId] });
      setAccountDialogOpen(false);
      setEditingAccountId(null);
      setAccountForm({ account_code: "", account_name: "", account_type: "expense", opening_balance: "", description: "" });
      toast.success("Account saved");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to save account"),
  });

  const deleteCoaMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error("No organization");
      const { error } = await supabase.from("chart_of_accounts").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id).eq("organization_id", orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounting-coa", orgId] });
      setDeleteAccountId(null);
      toast.success("Account deactivated");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to deactivate account"),
  });

  const importTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No organization");
      let inserted = 0;
      for (const row of COA_TEMPLATE) {
        const { error } = await supabase.from("chart_of_accounts").insert({
          organization_id: orgId,
          account_code: row.account_code,
          account_name: row.account_name,
          account_type: row.account_type,
          opening_balance: 0,
          current_balance: 0,
        });
        if (!error) inserted++;
      }
      return inserted;
    },
    onSuccess: (inserted) => {
      queryClient.invalidateQueries({ queryKey: ["accounting-coa", orgId] });
      toast.success(`Imported ${inserted} accounts. Duplicate codes were skipped.`);
    },
    onError: (e: Error) => toast.error(e.message || "Import failed"),
  });

  const openAddAccount = () => {
    setEditingAccountId(null);
    setAccountForm({ account_code: "", account_name: "", account_type: "expense", opening_balance: "", description: "" });
    setAccountDialogOpen(true);
  };

  const openEditAccount = (a: { id: string; account_code: string; account_name: string; account_type: string; opening_balance?: number; current_balance?: number; description?: string | null }) => {
    setEditingAccountId(a.id);
    setAccountForm({
      account_code: a.account_code,
      account_name: a.account_name,
      account_type: a.account_type,
      opening_balance: String(a.current_balance ?? a.opening_balance ?? 0),
      description: a.description || "",
    });
    setAccountDialogOpen(true);
  };

  const submitAccount = () => {
    const code = accountForm.account_code.trim();
    const name = accountForm.account_name.trim();
    if (!code) {
      toast.error("Account code is required");
      return;
    }
    if (!name) {
      toast.error("Account name is required");
      return;
    }
    const num = Number(accountForm.opening_balance) || 0;
    if (editingAccountId) {
      coaMutation.mutate({ id: editingAccountId, account_code: code, account_name: name, account_type: accountForm.account_type, opening_balance: num, description: accountForm.description || undefined });
    } else {
      coaMutation.mutate({ account_code: code, account_name: name, account_type: accountForm.account_type, opening_balance: num, description: accountForm.description || undefined });
    }
  };

  const totalRevenue = payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.total_amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
  const vatFromInvoices = invoices.reduce((s: number, i: any) => s + Number(i.vat_amount || 0), 0);

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
            <h1 className="page-header">Accounting & VAT</h1>
            <p className="text-muted-foreground mt-1">Manage finances, chart of accounts, and local tax compliance</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="glass-input rounded-xl h-11">
              <Download className="w-4 h-4 mr-2" />
              Export TB
            </Button>
            <Button className="btn-premium rounded-xl h-11 px-6">
              <BookOpen className="w-4 h-4 mr-2" />
              New Journal Entry
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card stat-glow border-success/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground">AED {Number(totalRevenue).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-success" />
                </div>
              </div>
              <p className="mt-4 text-xs font-medium text-success">From completed payments</p>
            </CardContent>
          </Card>

          <Card className="glass-card stat-glow border-destructive/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Expenses</p>
                  <p className="text-2xl font-bold text-foreground">AED {Number(totalExpenses).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center">
                  <ArrowDownRight className="w-6 h-6 text-destructive" />
                </div>
              </div>
              <p className="mt-4 text-xs font-medium text-destructive">Approved / paid expenses</p>
            </CardContent>
          </Card>

          <Card className="glass-card stat-glow border-info/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Net Profit</p>
                  <p className="text-2xl font-bold text-foreground">AED {Number(netProfit).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-info/10 rounded-2xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-info" />
                </div>
              </div>
              <p className="mt-4 text-xs font-medium text-info">Margin: {margin}%</p>
            </CardContent>
          </Card>

          <Card className="glass-card stat-glow gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80 mb-1">VAT (5%)</p>
                  <p className="text-2xl font-bold text-white">AED {Number(vatFromInvoices).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-black/20 rounded-2xl flex items-center justify-center">
                  <Percent className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="mt-4 text-xs font-medium text-white/80">From invoices</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={coaTab} onValueChange={setCoaTab} className="w-full">
          <TabsList className="bg-secondary/50 border border-border/50 p-1 rounded-xl h-12">
            <TabsTrigger value="coa" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg h-9 px-6 font-medium">Chart of Accounts</TabsTrigger>
            <TabsTrigger value="journals" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg h-9 px-6 font-medium">Journals</TabsTrigger>
            <TabsTrigger value="vat" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg h-9 px-6 font-medium">VAT (FTA)</TabsTrigger>
          </TabsList>

          <TabsContent value="coa" className="mt-6">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Accounts List</CardTitle>
                {accounts.length > 0 && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => importTemplateMutation.mutate()} disabled={importTemplateMutation.isPending}>
                      Import Template
                    </Button>
                    <Button size="sm" onClick={openAddAccount}>
                      <Plus className="w-4 h-4 mr-1" /> Add Account
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {accounts.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center border-b border-border/50">
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                      <BookOpen className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No accounts configured yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                      Set up your chart of accounts or import a standard real estate template to get started with full double-entry accounting.
                    </p>
                    <div className="flex gap-4">
                      <Button variant="outline" className="border-border" onClick={() => importTemplateMutation.mutate()} disabled={importTemplateMutation.isPending}>
                        Import Template
                      </Button>
                      <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={openAddAccount}>
                        Add First Account
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left p-3 font-medium">Code</th>
                          <th className="text-left p-3 font-medium">Name</th>
                          <th className="text-left p-3 font-medium">Type</th>
                          <th className="text-right p-3 font-medium">Balance (AED)</th>
                          <th className="text-right p-3 font-medium w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accounts.map((a: any) => (
                          <tr key={a.id} className="border-b border-border/30 hover:bg-muted/30">
                            <td className="p-3 font-mono">{a.account_code}</td>
                            <td className="p-3">{a.account_name}</td>
                            <td className="p-3 capitalize">{a.account_type}</td>
                            <td className="p-3 text-right">{Number(a.current_balance ?? a.opening_balance ?? 0).toLocaleString()}</td>
                            <td className="p-3 text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditAccount(a)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteAccountId(a.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="journals" className="mt-6">
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">General Journal entries will appear here once journal entry feature is connected.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vat" className="mt-6">
            <Card className="glass-card">
              <CardContent className="p-12 text-center text-muted-foreground">
                <Percent className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>FTA VAT 201 Reports module. Connect vat_records for full VAT reporting.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingAccountId ? "Edit Account" : "Add Account"}</DialogTitle>
              <DialogDescription>Chart of accounts. Code must be unique per organization.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account Code *</Label>
                  <Input value={accountForm.account_code} onChange={(e) => setAccountForm((f) => ({ ...f, account_code: e.target.value }))} placeholder="e.g. 1000" disabled={!!editingAccountId} />
                </div>
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={accountForm.account_type} onValueChange={(v) => setAccountForm((f) => ({ ...f, account_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Account Name *</Label>
                <Input value={accountForm.account_name} onChange={(e) => setAccountForm((f) => ({ ...f, account_name: e.target.value }))} placeholder="e.g. Cash and Bank" />
              </div>
              <div className="space-y-2">
                <Label>Opening Balance (AED)</Label>
                <Input type="number" step="0.01" value={accountForm.opening_balance} onChange={(e) => setAccountForm((f) => ({ ...f, opening_balance: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input value={accountForm.description} onChange={(e) => setAccountForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional notes" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAccountDialogOpen(false)}>Cancel</Button>
              <Button onClick={submitAccount} disabled={coaMutation.isPending}>{editingAccountId ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteAccountId} onOpenChange={(open) => !open && setDeleteAccountId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate account?</AlertDialogTitle>
              <AlertDialogDescription>This will hide the account from the chart. Existing transactions are not changed. You can add it again with the same code later if needed.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteAccountId && deleteCoaMutation.mutate(deleteAccountId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Deactivate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </AppLayout>
  );
}

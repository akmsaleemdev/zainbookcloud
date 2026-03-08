import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { CreditCard, Plus, Pencil, Trash2, Eye, EyeOff, Wifi, WifiOff } from "lucide-react";

const PROVIDERS = [
  { id: "stripe", name: "Stripe", fields: ["api_key", "secret_key"] },
  { id: "paytabs", name: "PayTabs", fields: ["api_key", "secret_key", "merchant_id"] },
  { id: "checkout_com", name: "Checkout.com", fields: ["api_key", "secret_key"] },
  { id: "telr", name: "Telr", fields: ["api_key", "merchant_id", "access_token"] },
  { id: "amazon_ps", name: "Amazon Payment Services", fields: ["api_key", "secret_key", "merchant_id", "access_token"] },
  { id: "network_intl", name: "Network International", fields: ["api_key", "secret_key", "merchant_id"] },
];

const FIELD_LABELS: Record<string, string> = {
  api_key: "API Key / Publishable Key",
  secret_key: "Secret Key",
  merchant_id: "Merchant ID",
  access_token: "Access Token",
};

interface GatewayForm {
  provider: string;
  display_name: string;
  api_key: string;
  secret_key: string;
  merchant_id: string;
  access_token: string;
  is_active: boolean;
  is_test_mode: boolean;
}

const emptyForm: GatewayForm = {
  provider: "", display_name: "", api_key: "", secret_key: "",
  merchant_id: "", access_token: "", is_active: false, is_test_mode: true,
};

export const PaymentGatewaysTab = () => {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<GatewayForm>(emptyForm);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const { data: gateways = [] } = useQuery({
    queryKey: ["payment-gateways"],
    queryFn: async () => {
      const { data } = await supabase.from("payment_gateway_configs").select("*").order("created_at");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form };
      if (editId) {
        const { error } = await supabase.from("payment_gateway_configs").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payment_gateway_configs").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-gateways"] });
      setDialog(false); setEditId(null); setForm(emptyForm);
      toast({ title: editId ? "Gateway updated" : "Gateway added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_gateway_configs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-gateways"] });
      toast({ title: "Gateway removed" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("payment_gateway_configs").update({ is_active } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment-gateways"] }),
  });

  const openAdd = () => { setEditId(null); setForm(emptyForm); setDialog(true); };
  const openEdit = (g: any) => {
    setEditId(g.id);
    setForm({
      provider: g.provider, display_name: g.display_name,
      api_key: g.api_key || "", secret_key: g.secret_key || "",
      merchant_id: g.merchant_id || "", access_token: g.access_token || "",
      is_active: g.is_active, is_test_mode: g.is_test_mode,
    });
    setDialog(true);
  };

  const selectedProvider = PROVIDERS.find(p => p.id === form.provider);

  const maskValue = (val: string) => val ? val.slice(0, 6) + "••••••" + val.slice(-4) : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configure payment gateway credentials. Once integrated, the system auto-connects with the provider.
        </p>
        <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Gateway</Button>
      </div>

      {gateways.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No payment gateways configured yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gateways.map((g: any) => {
            const prov = PROVIDERS.find(p => p.id === g.provider);
            return (
              <Card key={g.id} className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{g.display_name}</p>
                        <p className="text-xs text-muted-foreground">{prov?.name || g.provider}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={g.is_test_mode ? "secondary" : "default"} className="text-xs">
                        {g.is_test_mode ? "Test" : "Live"}
                      </Badge>
                      <Switch
                        checked={g.is_active}
                        onCheckedChange={(v) => toggleActive.mutate({ id: g.id, is_active: v })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    {g.api_key && <div>API Key: {maskValue(g.api_key)}</div>}
                    {g.secret_key && <div>Secret: {maskValue(g.secret_key)}</div>}
                    {g.merchant_id && <div>Merchant ID: {g.merchant_id}</div>}
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                    <Badge variant={g.is_active ? "default" : "secondary"} className="gap-1 text-xs">
                      {g.is_active ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      {g.is_active ? "Connected" : "Disconnected"}
                    </Badge>
                    <div className="ml-auto flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(g)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(g.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Payment Gateway" : "Add Payment Gateway"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={form.provider} onValueChange={(v) => {
                const prov = PROVIDERS.find(p => p.id === v);
                setForm({ ...form, provider: v, display_name: form.display_name || prov?.name || "" });
              }}>
                <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="e.g. Stripe Production" />
            </div>

            {selectedProvider && (
              <div className="border-t border-border/30 pt-4 space-y-3">
                <p className="text-sm font-medium">Credentials</p>
                {selectedProvider.fields.map(field => (
                  <div key={field} className="space-y-2">
                    <Label>{FIELD_LABELS[field]}</Label>
                    <div className="relative">
                      <Input
                        type={showSecrets[field] ? "text" : "password"}
                        value={(form as any)[field]}
                        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                        placeholder={`Enter ${FIELD_LABELS[field]}`}
                      />
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowSecrets(p => ({ ...p, [field]: !p[field] }))}
                      >
                        {showSecrets[field] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border/30 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Test Mode</Label>
                <Switch checked={form.is_test_mode} onCheckedChange={(v) => setForm({ ...form, is_test_mode: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Enable Gateway</Label>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.provider || !form.display_name}>
              {editId ? "Update" : "Add Gateway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

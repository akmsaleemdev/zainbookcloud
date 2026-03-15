import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, Landmark, Gauge, Droplets, Zap, Flame } from "lucide-react";
import { format } from "date-fns";

const utilityTypes = [
  { value: "electricity", label: "Electricity", icon: Zap },
  { value: "water", label: "Water", icon: Droplets },
  { value: "gas", label: "Gas", icon: Flame },
  { value: "district_cooling", label: "District Cooling", icon: Landmark },
];

const typeIcons: Record<string, any> = { electricity: Zap, water: Droplets, gas: Flame, district_cooling: Landmark };

const defaultMeterForm = { meter_number: "", utility_type: "electricity", provider: "", account_number: "", status: "active", property_id: "", unit_id: "" };
const defaultReadingForm = { meter_id: "", reading_value: "", reading_date: new Date().toISOString().split("T")[0], consumption: "", amount: "", notes: "" };

const Utilities = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [meterOpen, setMeterOpen] = useState(false);
  const [readingOpen, setReadingOpen] = useState(false);
  const [editMeterId, setEditMeterId] = useState<string | null>(null);
  const [meterForm, setMeterForm] = useState(defaultMeterForm);
  const [readingForm, setReadingForm] = useState(defaultReadingForm);
  const [search, setSearch] = useState("");

  const orgId = currentOrg?.id;

  const { data: meters = [], isLoading } = useQuery({
    queryKey: ["utility_meters", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("utility_meters")
        .select("*, properties(name), units(unit_number)")
        .eq("organization_id", orgId)
        .order("utility_type");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const { data: readings = [] } = useQuery({
    queryKey: ["utility_readings", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const meterIds = meters.map((m: any) => m.id);
      if (!meterIds.length) return [];
      const { data, error } = await supabase
        .from("utility_readings")
        .select("*, utility_meters(meter_number, utility_type)")
        .in("meter_id", meterIds)
        .order("reading_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!orgId && meters.length > 0,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["props-list", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("properties").select("id, name").eq("organization_id", orgId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const saveMeterMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org");
      const payload = {
        organization_id: orgId,
        meter_number: meterForm.meter_number,
        utility_type: meterForm.utility_type,
        provider: meterForm.provider || null,
        account_number: meterForm.account_number || null,
        status: meterForm.status,
        property_id: meterForm.property_id || null,
        unit_id: meterForm.unit_id || null,
      };
      if (editMeterId) {
        const { error } = await supabase.from("utility_meters").update(payload).eq("id", editMeterId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("utility_meters").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utility_meters"] });
      setMeterOpen(false); setEditMeterId(null); setMeterForm(defaultMeterForm);
      toast({ title: editMeterId ? "Meter updated" : "Meter added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveReadingMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        meter_id: readingForm.meter_id,
        reading_value: parseFloat(readingForm.reading_value),
        reading_date: readingForm.reading_date,
        consumption: readingForm.consumption ? parseFloat(readingForm.consumption) : null,
        amount: readingForm.amount ? parseFloat(readingForm.amount) : null,
        notes: readingForm.notes || null,
      };
      const { error } = await supabase.from("utility_readings").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utility_readings"] });
      setReadingOpen(false); setReadingForm(defaultReadingForm);
      toast({ title: "Reading recorded" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMeterMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("utility_meters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utility_meters"] });
      toast({ title: "Meter deleted" });
    },
  });

  const openEditMeter = (m: any) => {
    setEditMeterId(m.id);
    setMeterForm({
      meter_number: m.meter_number, utility_type: m.utility_type, provider: m.provider || "",
      account_number: m.account_number || "", status: m.status || "active",
      property_id: m.property_id || "", unit_id: m.unit_id || "",
    });
    setMeterOpen(true);
  };

  const filteredMeters = meters.filter((m: any) =>
    m.meter_number?.toLowerCase().includes(search.toLowerCase()) ||
    m.utility_type?.toLowerCase().includes(search.toLowerCase()) ||
    m.provider?.toLowerCase().includes(search.toLowerCase())
  );

  if (!orgId) {
    return <AppLayout><div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Please select an organization first.</p></div></AppLayout>;
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header flex items-center gap-2"><Landmark className="w-6 h-6" /> Utilities</h1>
            <p className="text-sm text-muted-foreground mt-1">Track utility meters, readings, and bills</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setReadingForm(defaultReadingForm); setReadingOpen(true); }} className="gap-2" disabled={meters.length === 0}>
              <Gauge className="w-4 h-4" /> Add Reading
            </Button>
            <Button onClick={() => { setEditMeterId(null); setMeterForm(defaultMeterForm); setMeterOpen(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> Add Meter
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search meters..." className="pl-10 bg-secondary/50 border-border/50" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <Tabs defaultValue="meters">
          <TabsList>
            <TabsTrigger value="meters">Meters ({meters.length})</TabsTrigger>
            <TabsTrigger value="readings">Readings ({readings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="meters">
            <div className="glass-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Meter #</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Account #</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : filteredMeters.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No meters found.</TableCell></TableRow>
                  ) : filteredMeters.map((m: any) => {
                    const Icon = typeIcons[m.utility_type] || Zap;
                    return (
                      <TableRow key={m.id}>
                        <TableCell><div className="flex items-center gap-2"><Icon className="w-4 h-4 text-primary" /><span className="capitalize">{m.utility_type.replace("_", " ")}</span></div></TableCell>
                        <TableCell className="font-mono text-xs">{m.meter_number}</TableCell>
                        <TableCell>{m.provider || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{m.account_number || "—"}</TableCell>
                        <TableCell>{m.properties?.name || "—"}</TableCell>
                        <TableCell>{m.units?.unit_number || "—"}</TableCell>
                        <TableCell><Badge variant={m.status === "active" ? "default" : "secondary"}>{m.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditMeter(m)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMeterMutation.mutate(m.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="readings">
            <div className="glass-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Meter</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reading</TableHead>
                    <TableHead>Consumption</TableHead>
                    <TableHead>Amount (AED)</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No readings recorded.</TableCell></TableRow>
                  ) : readings.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>{format(new Date(r.reading_date), "dd MMM yyyy")}</TableCell>
                      <TableCell className="font-mono text-xs">{r.utility_meters?.meter_number}</TableCell>
                      <TableCell className="capitalize">{r.utility_meters?.utility_type?.replace("_", " ")}</TableCell>
                      <TableCell className="font-semibold">{Number(r.reading_value).toLocaleString()}</TableCell>
                      <TableCell>{r.consumption ? Number(r.consumption).toLocaleString() : "—"}</TableCell>
                      <TableCell>{r.amount ? `AED ${Number(r.amount).toLocaleString()}` : "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{r.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Add/Edit Meter Dialog */}
      <Dialog open={meterOpen} onOpenChange={setMeterOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editMeterId ? "Edit" : "Add"} Meter</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Meter Number *</Label>
              <Input value={meterForm.meter_number} onChange={(e) => setMeterForm({ ...meterForm, meter_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Utility Type</Label>
              <Select value={meterForm.utility_type} onValueChange={(v) => setMeterForm({ ...meterForm, utility_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {utilityTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Input value={meterForm.provider} onChange={(e) => setMeterForm({ ...meterForm, provider: e.target.value })} placeholder="e.g. DEWA, SEWA" />
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input value={meterForm.account_number} onChange={(e) => setMeterForm({ ...meterForm, account_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Property</Label>
              <Select value={meterForm.property_id} onValueChange={(v) => setMeterForm({ ...meterForm, property_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                <SelectContent>
                  {properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={meterForm.status} onValueChange={(v) => setMeterForm({ ...meterForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="disconnected">Disconnected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMeterOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMeterMutation.mutate()} disabled={!meterForm.meter_number}>{editMeterId ? "Update" : "Add"} Meter</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Reading Dialog */}
      <Dialog open={readingOpen} onOpenChange={setReadingOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Record Reading</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label>Meter *</Label>
              <Select value={readingForm.meter_id} onValueChange={(v) => setReadingForm({ ...readingForm, meter_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select meter" /></SelectTrigger>
                <SelectContent>
                  {meters.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.meter_number} ({m.utility_type})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reading Value *</Label>
              <Input type="number" value={readingForm.reading_value} onChange={(e) => setReadingForm({ ...readingForm, reading_value: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Reading Date</Label>
              <Input type="date" value={readingForm.reading_date} onChange={(e) => setReadingForm({ ...readingForm, reading_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Consumption</Label>
              <Input type="number" value={readingForm.consumption} onChange={(e) => setReadingForm({ ...readingForm, consumption: e.target.value })} placeholder="Units consumed" />
            </div>
            <div className="space-y-2">
              <Label>Amount (AED)</Label>
              <Input type="number" value={readingForm.amount} onChange={(e) => setReadingForm({ ...readingForm, amount: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea value={readingForm.notes} onChange={(e) => setReadingForm({ ...readingForm, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReadingOpen(false)}>Cancel</Button>
            <Button onClick={() => saveReadingMutation.mutate()} disabled={!readingForm.meter_id || !readingForm.reading_value}>Record Reading</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Utilities;

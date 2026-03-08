import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Car, UserCheck, CreditCard, ShieldCheck, Flame, Construction,
  ClipboardCheck, Plus, Search, Pencil, Trash2, LogIn, LogOut,
  DollarSign, Calendar, AlertTriangle
} from "lucide-react";

const UAEApartmentManagement = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("parking");
  const [search, setSearch] = useState("");

  // Dialog states
  const [parkingDialog, setParkingDialog] = useState(false);
  const [visitorDialog, setVisitorDialog] = useState(false);
  const [accessDialog, setAccessDialog] = useState(false);
  const [inspectionDialog, setInspectionDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Forms
  const [parkingForm, setParkingForm] = useState({ property_id: "", space_number: "", space_type: "standard", floor_level: "", tenant_id: "", vehicle_plate: "", vehicle_type: "", permit_number: "", permit_expiry: "", monthly_fee: "0", status: "available" });
  const [visitorForm, setVisitorForm] = useState({ property_id: "", visitor_name: "", visitor_phone: "", visitor_emirates_id: "", purpose: "visit", vehicle_plate: "", unit_number: "", tenant_id: "", notes: "" });
  const [accessForm, setAccessForm] = useState({ property_id: "", tenant_id: "", card_number: "", card_type: "resident", expiry_date: "", deposit_amount: "0", status: "active", notes: "" });
  const [inspectionForm, setInspectionForm] = useState({ property_id: "", inspection_type: "fire_safety", title: "", description: "", inspector_name: "", inspection_date: new Date().toISOString().split("T")[0], next_inspection_date: "", status: "scheduled", findings: "" });

  // Data queries
  const { data: properties = [] } = useQuery({
    queryKey: ["props-uae", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase.from("properties").select("id, name").eq("organization_id", currentOrg.id);
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants-uae", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase.from("tenants").select("id, full_name").eq("organization_id", currentOrg.id);
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const propIds = properties.map((p: any) => p.id);

  const { data: parkingSpaces = [] } = useQuery({
    queryKey: ["parking", propIds],
    queryFn: async () => {
      if (!propIds.length) return [];
      const { data } = await supabase.from("parking_spaces").select("*, tenants(full_name), properties(name)").in("property_id", propIds).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: propIds.length > 0,
  });

  const { data: visitors = [] } = useQuery({
    queryKey: ["visitors", propIds],
    queryFn: async () => {
      if (!propIds.length) return [];
      const { data } = await supabase.from("visitor_logs").select("*, tenants(full_name), properties(name)").in("property_id", propIds).order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
    enabled: propIds.length > 0,
  });

  const { data: accessCards = [] } = useQuery({
    queryKey: ["access-cards", propIds],
    queryFn: async () => {
      if (!propIds.length) return [];
      const { data } = await supabase.from("access_cards").select("*, tenants(full_name), properties(name)").in("property_id", propIds).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: propIds.length > 0,
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ["inspections", propIds],
    queryFn: async () => {
      if (!propIds.length) return [];
      const { data } = await supabase.from("building_inspections").select("*, properties(name)").in("property_id", propIds).order("inspection_date", { ascending: false });
      return data || [];
    },
    enabled: propIds.length > 0,
  });

  // Mutations
  const saveParkingMutation = useMutation({
    mutationFn: async () => {
      const payload: any = { ...parkingForm, monthly_fee: parseFloat(parkingForm.monthly_fee) || 0, tenant_id: parkingForm.tenant_id || null, permit_expiry: parkingForm.permit_expiry || null };
      if (editId) { const { error } = await supabase.from("parking_spaces").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("parking_spaces").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["parking"] }); setParkingDialog(false); setEditId(null); toast({ title: "Parking space saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveVisitorMutation = useMutation({
    mutationFn: async () => {
      const payload: any = { ...visitorForm, tenant_id: visitorForm.tenant_id || null };
      const { error } = await supabase.from("visitor_logs").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["visitors"] }); setVisitorDialog(false); toast({ title: "Visitor logged" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const checkoutVisitor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("visitor_logs").update({ check_out_at: new Date().toISOString(), status: "checked_out" } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["visitors"] }); toast({ title: "Visitor checked out" }); },
  });

  const saveAccessMutation = useMutation({
    mutationFn: async () => {
      const payload: any = { ...accessForm, deposit_amount: parseFloat(accessForm.deposit_amount) || 0, tenant_id: accessForm.tenant_id || null, expiry_date: accessForm.expiry_date || null };
      if (editId) { const { error } = await supabase.from("access_cards").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("access_cards").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["access-cards"] }); setAccessDialog(false); setEditId(null); toast({ title: "Access card saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveInspectionMutation = useMutation({
    mutationFn: async () => {
      const payload: any = { ...inspectionForm, next_inspection_date: inspectionForm.next_inspection_date || null };
      if (editId) { const { error } = await supabase.from("building_inspections").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("building_inspections").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["inspections"] }); setInspectionDialog(false); setEditId(null); toast({ title: "Inspection saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const stats = [
    { label: "Parking Spaces", value: parkingSpaces.length, icon: Car, color: "text-blue-400" },
    { label: "Active Visitors", value: visitors.filter((v: any) => v.status === "checked_in").length, icon: UserCheck, color: "text-emerald-400" },
    { label: "Access Cards", value: accessCards.filter((c: any) => c.status === "active").length, icon: CreditCard, color: "text-primary" },
    { label: "Pending Inspections", value: inspections.filter((i: any) => i.status === "scheduled").length, icon: AlertTriangle, color: "text-amber-400" },
  ];

  const PropertySelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
      <SelectContent>{properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
    </Select>
  );

  const TenantSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Select tenant (optional)" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="">None</SelectItem>
        {tenants.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  if (!currentOrg) return <AppLayout><div className="glass-card p-12 text-center"><p className="text-muted-foreground">Please create an organization first.</p></div></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="page-header flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-primary" /> UAE Apartment Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Parking, visitors, access cards, inspections & compliance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center"><s.icon className={`w-6 h-6 ${s.color}`} /></div>
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="parking"><Car className="w-3.5 h-3.5 mr-1" />Parking</TabsTrigger>
            <TabsTrigger value="visitors"><UserCheck className="w-3.5 h-3.5 mr-1" />Visitors</TabsTrigger>
            <TabsTrigger value="access"><CreditCard className="w-3.5 h-3.5 mr-1" />Access Cards</TabsTrigger>
            <TabsTrigger value="inspections"><ClipboardCheck className="w-3.5 h-3.5 mr-1" />Inspections</TabsTrigger>
          </TabsList>

          {/* Parking Tab */}
          <TabsContent value="parking" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setEditId(null); setParkingForm({ property_id: properties[0]?.id || "", space_number: "", space_type: "standard", floor_level: "", tenant_id: "", vehicle_plate: "", vehicle_type: "", permit_number: "", permit_expiry: "", monthly_fee: "0", status: "available" }); setParkingDialog(true); }} className="gap-2"><Plus className="w-4 h-4" /> Add Space</Button>
            </div>
            <div className="glass-card overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Space #</TableHead><TableHead>Property</TableHead><TableHead>Type</TableHead>
                  <TableHead>Tenant</TableHead><TableHead>Vehicle</TableHead><TableHead>Permit</TableHead><TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {parkingSpaces.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No parking spaces</TableCell></TableRow> :
                  parkingSpaces.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.space_number}</TableCell>
                      <TableCell className="text-sm">{p.properties?.name}</TableCell>
                      <TableCell><Badge variant="secondary">{p.space_type}</Badge></TableCell>
                      <TableCell className="text-sm">{p.tenants?.full_name || "—"}</TableCell>
                      <TableCell className="text-sm font-mono">{p.vehicle_plate || "—"}</TableCell>
                      <TableCell className="text-xs">{p.permit_number || "—"}{p.permit_expiry && <div className="text-muted-foreground">Exp: {new Date(p.permit_expiry).toLocaleDateString()}</div>}</TableCell>
                      <TableCell><Badge variant={p.status === "occupied" ? "default" : p.status === "available" ? "secondary" : "destructive"}>{p.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEditId(p.id); setParkingForm({ property_id: p.property_id, space_number: p.space_number, space_type: p.space_type, floor_level: p.floor_level || "", tenant_id: p.tenant_id || "", vehicle_plate: p.vehicle_plate || "", vehicle_type: p.vehicle_type || "", permit_number: p.permit_number || "", permit_expiry: p.permit_expiry || "", monthly_fee: String(p.monthly_fee || 0), status: p.status }); setParkingDialog(true); }}><Pencil className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Visitors Tab */}
          <TabsContent value="visitors" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setVisitorForm({ property_id: properties[0]?.id || "", visitor_name: "", visitor_phone: "", visitor_emirates_id: "", purpose: "visit", vehicle_plate: "", unit_number: "", tenant_id: "", notes: "" }); setVisitorDialog(true); }} className="gap-2"><Plus className="w-4 h-4" /> Log Visitor</Button>
            </div>
            <div className="glass-card overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Visitor</TableHead><TableHead>Property</TableHead><TableHead>Purpose</TableHead>
                  <TableHead>Visiting</TableHead><TableHead>Check In</TableHead><TableHead>Check Out</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {visitors.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No visitor logs</TableCell></TableRow> :
                  visitors.map((v: any) => (
                    <TableRow key={v.id}>
                      <TableCell><div className="font-medium text-sm">{v.visitor_name}</div>{v.visitor_phone && <div className="text-xs text-muted-foreground">{v.visitor_phone}</div>}</TableCell>
                      <TableCell className="text-sm">{v.properties?.name}</TableCell>
                      <TableCell><Badge variant="secondary">{v.purpose}</Badge></TableCell>
                      <TableCell className="text-sm">{v.tenants?.full_name || v.unit_number || "—"}</TableCell>
                      <TableCell className="text-xs">{new Date(v.check_in_at).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{v.check_out_at ? new Date(v.check_out_at).toLocaleString() : "—"}</TableCell>
                      <TableCell><Badge variant={v.status === "checked_in" ? "default" : "secondary"}>{v.status}</Badge></TableCell>
                      <TableCell>
                        {v.status === "checked_in" && <Button size="sm" variant="outline" className="gap-1" onClick={() => checkoutVisitor.mutate(v.id)}><LogOut className="w-3 h-3" /> Out</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Access Cards Tab */}
          <TabsContent value="access" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setEditId(null); setAccessForm({ property_id: properties[0]?.id || "", tenant_id: "", card_number: "", card_type: "resident", expiry_date: "", deposit_amount: "0", status: "active", notes: "" }); setAccessDialog(true); }} className="gap-2"><Plus className="w-4 h-4" /> Issue Card</Button>
            </div>
            <div className="glass-card overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Card #</TableHead><TableHead>Property</TableHead><TableHead>Type</TableHead>
                  <TableHead>Tenant</TableHead><TableHead>Expiry</TableHead><TableHead>Deposit</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {accessCards.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No access cards</TableCell></TableRow> :
                  accessCards.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-medium">{c.card_number}</TableCell>
                      <TableCell className="text-sm">{c.properties?.name}</TableCell>
                      <TableCell><Badge variant="secondary">{c.card_type}</Badge></TableCell>
                      <TableCell className="text-sm">{c.tenants?.full_name || "—"}</TableCell>
                      <TableCell className="text-xs">{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>AED {c.deposit_amount || 0}</TableCell>
                      <TableCell><Badge variant={c.status === "active" ? "default" : "destructive"}>{c.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEditId(c.id); setAccessForm({ property_id: c.property_id, tenant_id: c.tenant_id || "", card_number: c.card_number, card_type: c.card_type, expiry_date: c.expiry_date || "", deposit_amount: String(c.deposit_amount || 0), status: c.status, notes: c.notes || "" }); setAccessDialog(true); }}><Pencil className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Inspections Tab */}
          <TabsContent value="inspections" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setEditId(null); setInspectionForm({ property_id: properties[0]?.id || "", inspection_type: "fire_safety", title: "", description: "", inspector_name: "", inspection_date: new Date().toISOString().split("T")[0], next_inspection_date: "", status: "scheduled", findings: "" }); setInspectionDialog(true); }} className="gap-2"><Plus className="w-4 h-4" /> Add Inspection</Button>
            </div>
            <div className="glass-card overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Title</TableHead><TableHead>Property</TableHead><TableHead>Type</TableHead>
                  <TableHead>Inspector</TableHead><TableHead>Date</TableHead><TableHead>Next</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {inspections.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No inspections</TableCell></TableRow> :
                  inspections.map((ins: any) => (
                    <TableRow key={ins.id}>
                      <TableCell className="font-medium text-sm">{ins.title}</TableCell>
                      <TableCell className="text-sm">{ins.properties?.name}</TableCell>
                      <TableCell><Badge variant="secondary" className={ins.inspection_type === "fire_safety" ? "bg-destructive/10 text-destructive" : ins.inspection_type === "elevator" ? "bg-amber-500/10 text-amber-400" : ""}>{ins.inspection_type.replace("_", " ")}</Badge></TableCell>
                      <TableCell className="text-sm">{ins.inspector_name || "—"}</TableCell>
                      <TableCell className="text-xs">{new Date(ins.inspection_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-xs">{ins.next_inspection_date ? new Date(ins.next_inspection_date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell><Badge variant={ins.status === "passed" ? "default" : ins.status === "failed" ? "destructive" : "secondary"}>{ins.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEditId(ins.id); setInspectionForm({ property_id: ins.property_id, inspection_type: ins.inspection_type, title: ins.title, description: ins.description || "", inspector_name: ins.inspector_name || "", inspection_date: ins.inspection_date, next_inspection_date: ins.next_inspection_date || "", status: ins.status, findings: ins.findings || "" }); setInspectionDialog(true); }}><Pencil className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Parking Dialog */}
      <Dialog open={parkingDialog} onOpenChange={setParkingDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Parking Space" : "Add Parking Space"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Property *</Label><PropertySelect value={parkingForm.property_id} onChange={(v) => setParkingForm({ ...parkingForm, property_id: v })} /></div>
              <div className="space-y-2"><Label>Space # *</Label><Input value={parkingForm.space_number} onChange={(e) => setParkingForm({ ...parkingForm, space_number: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Type</Label>
                <Select value={parkingForm.space_type} onValueChange={(v) => setParkingForm({ ...parkingForm, space_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["standard", "covered", "vip", "disabled", "visitor"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Floor</Label><Input value={parkingForm.floor_level} onChange={(e) => setParkingForm({ ...parkingForm, floor_level: e.target.value })} placeholder="B1, G, 1" /></div>
            </div>
            <div className="space-y-2"><Label>Assigned Tenant</Label><TenantSelect value={parkingForm.tenant_id} onChange={(v) => setParkingForm({ ...parkingForm, tenant_id: v })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Vehicle Plate</Label><Input value={parkingForm.vehicle_plate} onChange={(e) => setParkingForm({ ...parkingForm, vehicle_plate: e.target.value })} /></div>
              <div className="space-y-2"><Label>Vehicle Type</Label><Input value={parkingForm.vehicle_type} onChange={(e) => setParkingForm({ ...parkingForm, vehicle_type: e.target.value })} placeholder="Sedan, SUV..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Permit #</Label><Input value={parkingForm.permit_number} onChange={(e) => setParkingForm({ ...parkingForm, permit_number: e.target.value })} /></div>
              <div className="space-y-2"><Label>Permit Expiry</Label><Input type="date" value={parkingForm.permit_expiry} onChange={(e) => setParkingForm({ ...parkingForm, permit_expiry: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Monthly Fee (AED)</Label><Input type="number" value={parkingForm.monthly_fee} onChange={(e) => setParkingForm({ ...parkingForm, monthly_fee: e.target.value })} /></div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={parkingForm.status} onValueChange={(v) => setParkingForm({ ...parkingForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["available", "occupied", "reserved", "maintenance"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setParkingDialog(false)}>Cancel</Button><Button onClick={() => saveParkingMutation.mutate()} disabled={!parkingForm.property_id || !parkingForm.space_number}>{editId ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visitor Dialog */}
      <Dialog open={visitorDialog} onOpenChange={setVisitorDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log Visitor</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Property *</Label><PropertySelect value={visitorForm.property_id} onChange={(v) => setVisitorForm({ ...visitorForm, property_id: v })} /></div>
              <div className="space-y-2"><Label>Unit #</Label><Input value={visitorForm.unit_number} onChange={(e) => setVisitorForm({ ...visitorForm, unit_number: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Visitor Name *</Label><Input value={visitorForm.visitor_name} onChange={(e) => setVisitorForm({ ...visitorForm, visitor_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={visitorForm.visitor_phone} onChange={(e) => setVisitorForm({ ...visitorForm, visitor_phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Emirates ID</Label><Input value={visitorForm.visitor_emirates_id} onChange={(e) => setVisitorForm({ ...visitorForm, visitor_emirates_id: e.target.value })} /></div>
              <div className="space-y-2"><Label>Vehicle Plate</Label><Input value={visitorForm.vehicle_plate} onChange={(e) => setVisitorForm({ ...visitorForm, vehicle_plate: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Purpose</Label>
                <Select value={visitorForm.purpose} onValueChange={(v) => setVisitorForm({ ...visitorForm, purpose: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["visit", "delivery", "maintenance", "contractor", "official", "other"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Visiting Tenant</Label><TenantSelect value={visitorForm.tenant_id} onChange={(v) => setVisitorForm({ ...visitorForm, tenant_id: v })} /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={visitorForm.notes} onChange={(e) => setVisitorForm({ ...visitorForm, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setVisitorDialog(false)}>Cancel</Button><Button onClick={() => saveVisitorMutation.mutate()} disabled={!visitorForm.property_id || !visitorForm.visitor_name}>Check In</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Card Dialog */}
      <Dialog open={accessDialog} onOpenChange={setAccessDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit Access Card" : "Issue Access Card"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Property *</Label><PropertySelect value={accessForm.property_id} onChange={(v) => setAccessForm({ ...accessForm, property_id: v })} /></div>
              <div className="space-y-2"><Label>Card # *</Label><Input value={accessForm.card_number} onChange={(e) => setAccessForm({ ...accessForm, card_number: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tenant</Label><TenantSelect value={accessForm.tenant_id} onChange={(v) => setAccessForm({ ...accessForm, tenant_id: v })} /></div>
              <div className="space-y-2"><Label>Type</Label>
                <Select value={accessForm.card_type} onValueChange={(v) => setAccessForm({ ...accessForm, card_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["resident", "visitor", "staff", "contractor", "master"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Expiry</Label><Input type="date" value={accessForm.expiry_date} onChange={(e) => setAccessForm({ ...accessForm, expiry_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Deposit (AED)</Label><Input type="number" value={accessForm.deposit_amount} onChange={(e) => setAccessForm({ ...accessForm, deposit_amount: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Status</Label>
                <Select value={accessForm.status} onValueChange={(v) => setAccessForm({ ...accessForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["active", "lost", "deactivated", "returned"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={accessForm.notes} onChange={(e) => setAccessForm({ ...accessForm, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAccessDialog(false)}>Cancel</Button><Button onClick={() => saveAccessMutation.mutate()} disabled={!accessForm.property_id || !accessForm.card_number}>{editId ? "Update" : "Issue"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inspection Dialog */}
      <Dialog open={inspectionDialog} onOpenChange={setInspectionDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Inspection" : "Add Inspection"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Property *</Label><PropertySelect value={inspectionForm.property_id} onChange={(v) => setInspectionForm({ ...inspectionForm, property_id: v })} /></div>
              <div className="space-y-2"><Label>Type *</Label>
                <Select value={inspectionForm.inspection_type} onValueChange={(v) => setInspectionForm({ ...inspectionForm, inspection_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["fire_safety", "elevator", "move_in", "move_out", "general", "plumbing", "electrical", "pest_control"].map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Title *</Label><Input value={inspectionForm.title} onChange={(e) => setInspectionForm({ ...inspectionForm, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={inspectionForm.description} onChange={(e) => setInspectionForm({ ...inspectionForm, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Inspector</Label><Input value={inspectionForm.inspector_name} onChange={(e) => setInspectionForm({ ...inspectionForm, inspector_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={inspectionForm.status} onValueChange={(v) => setInspectionForm({ ...inspectionForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["scheduled", "in_progress", "passed", "failed", "requires_followup"].map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Inspection Date</Label><Input type="date" value={inspectionForm.inspection_date} onChange={(e) => setInspectionForm({ ...inspectionForm, inspection_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Next Inspection</Label><Input type="date" value={inspectionForm.next_inspection_date} onChange={(e) => setInspectionForm({ ...inspectionForm, next_inspection_date: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Findings</Label><Textarea value={inspectionForm.findings} onChange={(e) => setInspectionForm({ ...inspectionForm, findings: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setInspectionDialog(false)}>Cancel</Button><Button onClick={() => saveInspectionMutation.mutate()} disabled={!inspectionForm.property_id || !inspectionForm.title}>{editId ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default UAEApartmentManagement;

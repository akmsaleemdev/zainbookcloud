import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Globe, BedDouble, DoorOpen, Home, MapPin, Phone, Mail, Search, Filter } from "lucide-react";

const PublicBooking = () => {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?.id;
  const [inquiryDialog, setInquiryDialog] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: units = [] } = useQuery({
    queryKey: ["booking-units", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("units")
        .select("*, buildings!inner(name, property_id, properties!inner(name, organization_id, emirate, community))")
        .eq("buildings.properties.organization_id", orgId)
        .eq("status", "available");
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["booking-rooms", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("rooms")
        .select("*, units!inner(unit_number, buildings!inner(name, properties!inner(name, organization_id, emirate)))")
        .eq("units.buildings.properties.organization_id", orgId)
        .eq("status", "available");
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: beds = [] } = useQuery({
    queryKey: ["booking-beds", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("bed_spaces")
        .select("*, rooms!inner(room_number, units!inner(unit_number, buildings!inner(name, properties!inner(name, organization_id, emirate))))")
        .eq("rooms.units.buildings.properties.organization_id", orgId)
        .eq("status", "available");
      return data || [];
    },
    enabled: !!orgId,
  });

  const openInquiry = (listing: any) => {
    setSelectedListing(listing);
    setInquiryDialog(true);
  };

  const handleInquiry = () => {
    toast({ title: "Inquiry Sent!", description: "Our team will contact you within 24 hours." });
    setInquiryDialog(false);
    setSelectedListing(null);
  };

  const filteredUnits = units.filter((u: any) => {
    const matchSearch = !search || u.unit_number?.toLowerCase().includes(search.toLowerCase()) || u.buildings?.name?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || u.unit_type === typeFilter;
    return matchSearch && matchType;
  });

  const unitTypes = [...new Set(units.map((u: any) => u.unit_type).filter(Boolean))];

  if (!orgId) {
    return <AppLayout><div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Please select an organization first.</p></div></AppLayout>;
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="page-header flex items-center gap-2"><Globe className="w-6 h-6" /> Public Booking</h1>
          <p className="text-sm text-muted-foreground mt-1">Browse available listings and submit inquiries</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card"><CardContent className="pt-6 text-center"><DoorOpen className="w-8 h-8 mx-auto text-primary mb-2" /><div className="text-2xl font-bold">{units.length}</div><p className="text-xs text-muted-foreground">Available Units</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="pt-6 text-center"><Home className="w-8 h-8 mx-auto text-blue-400 mb-2" /><div className="text-2xl font-bold">{rooms.length}</div><p className="text-xs text-muted-foreground">Available Rooms</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="pt-6 text-center"><BedDouble className="w-8 h-8 mx-auto text-emerald-400 mb-2" /><div className="text-2xl font-bold">{beds.length}</div><p className="text-xs text-muted-foreground">Available Beds</p></CardContent></Card>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search listings..." className="pl-10 bg-secondary/50 border-border/50" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {unitTypes.map((t: any) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="units">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="units" className="gap-1.5"><DoorOpen className="w-4 h-4" /> Units ({filteredUnits.length})</TabsTrigger>
            <TabsTrigger value="beds" className="gap-1.5"><BedDouble className="w-4 h-4" /> Bed Spaces ({beds.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="units">
            {filteredUnits.length === 0 ? (
              <div className="glass-card p-12 text-center text-muted-foreground">No available units matching your criteria.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUnits.map((u: any) => (
                  <Card key={u.id} className="glass-card hover:border-primary/30 transition-colors group">
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold">Unit {u.unit_number}</h3>
                        <Badge className="bg-emerald-500/20 text-emerald-400">Available</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {u.buildings?.name} — {u.buildings?.properties?.name}
                      </p>
                      {u.buildings?.properties?.emirate && (
                        <p className="text-xs text-muted-foreground">{u.buildings.properties.emirate}{u.buildings.properties.community ? ` · ${u.buildings.properties.community}` : ""}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {u.unit_type && <Badge variant="outline" className="text-[10px]">{u.unit_type}</Badge>}
                        {u.bedrooms != null && <Badge variant="outline" className="text-[10px]">{u.bedrooms} BR</Badge>}
                        {u.bathrooms != null && <Badge variant="outline" className="text-[10px]">{u.bathrooms} Bath</Badge>}
                        {u.area_sqft && <Badge variant="outline" className="text-[10px]">{u.area_sqft} sqft</Badge>}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/30">
                        {u.monthly_rent ? (
                          <span className="font-bold text-primary">AED {Number(u.monthly_rent).toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Price on request</span>
                        )}
                        <Button size="sm" variant="outline" onClick={() => openInquiry({ type: "unit", label: `Unit ${u.unit_number}`, building: u.buildings?.name })}>Inquire</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="beds">
            {beds.length === 0 ? (
              <div className="glass-card p-12 text-center text-muted-foreground">No available bed spaces at the moment.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {beds.map((b: any) => (
                  <Card key={b.id} className="glass-card hover:border-primary/30 transition-colors">
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold">Bed {b.bed_number}</h3>
                        <Badge className="bg-emerald-500/20 text-emerald-400">Available</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Room {b.rooms?.room_number} · Unit {b.rooms?.units?.unit_number}</p>
                      <div className="flex flex-wrap gap-2">
                        {b.bed_type && <Badge variant="outline" className="text-[10px]">{b.bed_type}</Badge>}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/30">
                        {b.monthly_rent ? (
                          <span className="font-bold text-primary">AED {Number(b.monthly_rent).toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Price on request</span>
                        )}
                        <Button size="sm" variant="outline" onClick={() => openInquiry({ type: "bed", label: `Bed ${b.bed_number}`, building: b.rooms?.units?.buildings?.name })}>Inquire</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Inquiry Dialog */}
      <Dialog open={inquiryDialog} onOpenChange={setInquiryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Inquiry — {selectedListing?.label}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Fill in your details and we'll get back to you within 24 hours.</p>
            <div className="space-y-2"><Label>Full Name *</Label><Input placeholder="Your name" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email *</Label><Input type="email" placeholder="you@email.com" /></div>
              <div className="space-y-2"><Label>Phone *</Label><Input placeholder="+971 50 000 0000" /></div>
            </div>
            <div className="space-y-2"><Label>Move-in Date (approx)</Label><Input type="date" /></div>
            <div className="space-y-2"><Label>Message</Label><Textarea placeholder="Any special requirements or questions..." rows={3} /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setInquiryDialog(false)}>Cancel</Button>
            <Button onClick={handleInquiry} className="gap-2"><Mail className="w-4 h-4" /> Send Inquiry</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default PublicBooking;

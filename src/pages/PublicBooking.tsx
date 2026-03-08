import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, BedDouble, DoorOpen, Home, MapPin } from "lucide-react";

const PublicBooking = () => {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?.id;

  const { data: properties = [] } = useQuery({
    queryKey: ["booking-properties", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("properties").select("*").eq("organization_id", orgId).eq("is_active", true);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: units = [] } = useQuery({
    queryKey: ["booking-units", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("units")
        .select("*, buildings!inner(name, property_id, properties!inner(name, organization_id))")
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
        .select("*, units!inner(unit_number, buildings!inner(name, properties!inner(name, organization_id)))")
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
        .select("*, rooms!inner(room_number, units!inner(unit_number, buildings!inner(name, properties!inner(name, organization_id))))")
        .eq("rooms.units.buildings.properties.organization_id", orgId)
        .eq("status", "available");
      return data || [];
    },
    enabled: !!orgId,
  });

  if (!orgId) {
    return <AppLayout><div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Please select an organization first.</p></div></AppLayout>;
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="page-header flex items-center gap-2"><Globe className="w-6 h-6" /> Public Booking</h1>
          <p className="text-sm text-muted-foreground mt-1">Available listings for prospective tenants</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card"><CardContent className="pt-6 text-center"><DoorOpen className="w-8 h-8 mx-auto text-primary mb-2" /><div className="text-2xl font-bold">{units.length}</div><p className="text-xs text-muted-foreground">Available Units</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="pt-6 text-center"><Home className="w-8 h-8 mx-auto text-blue-400 mb-2" /><div className="text-2xl font-bold">{rooms.length}</div><p className="text-xs text-muted-foreground">Available Rooms</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="pt-6 text-center"><BedDouble className="w-8 h-8 mx-auto text-emerald-400 mb-2" /><div className="text-2xl font-bold">{beds.length}</div><p className="text-xs text-muted-foreground">Available Beds</p></CardContent></Card>
        </div>

        {units.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Available Units</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map((u: any) => (
                <Card key={u.id} className="glass-card hover:border-primary/30 transition-colors">
                  <CardContent className="pt-6 space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold">Unit {u.unit_number}</h3>
                      <Badge className="bg-emerald-500/20 text-emerald-400">Available</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {u.buildings?.name} - {u.buildings?.properties?.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground capitalize">{u.unit_type} · {u.bedrooms || 0}BR · {u.area_sqft || "—"} sqft</span>
                      {u.monthly_rent && <span className="font-semibold text-primary">AED {Number(u.monthly_rent).toLocaleString()}/mo</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {beds.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Available Bed Spaces</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {beds.map((b: any) => (
                <Card key={b.id} className="glass-card hover:border-primary/30 transition-colors">
                  <CardContent className="pt-6 space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold">Bed {b.bed_number}</h3>
                      <Badge className="bg-emerald-500/20 text-emerald-400">Available</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Room {b.rooms?.room_number} · Unit {b.rooms?.units?.unit_number}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground capitalize">{b.bed_type} bed</span>
                      {b.monthly_rent && <span className="font-semibold text-primary">AED {Number(b.monthly_rent).toLocaleString()}/mo</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {units.length === 0 && rooms.length === 0 && beds.length === 0 && (
          <div className="glass-card p-12 text-center text-muted-foreground">No available listings at the moment.</div>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default PublicBooking;

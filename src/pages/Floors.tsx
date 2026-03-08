import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Layers, Building2 } from "lucide-react";

const Floors = () => {
  const { currentOrg } = useOrganization();
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const orgId = currentOrg?.id;

  const { data: buildings = [] } = useQuery({
    queryKey: ["floors-buildings", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("buildings")
        .select("id, name, floors_count, properties(name, organization_id)")
        .eq("properties.organization_id", orgId);
      return (data || []).filter((b: any) => b.properties);
    },
    enabled: !!orgId,
  });

  const { data: units = [] } = useQuery({
    queryKey: ["floors-units", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("units")
        .select("id, unit_number, floor_number, status, unit_type, monthly_rent, building_id, buildings!inner(property_id, properties!inner(organization_id))")
        .eq("buildings.properties.organization_id", orgId)
        .order("floor_number");
      return data || [];
    },
    enabled: !!orgId,
  });

  const filteredBuildings = selectedBuilding === "all" ? buildings : buildings.filter((b: any) => b.id === selectedBuilding);

  const getFloorUnits = (buildingId: string, floor: number) =>
    units.filter((u: any) => u.building_id === buildingId && u.floor_number === floor);

  const statusColor: Record<string, string> = {
    available: "bg-emerald-500/20 text-emerald-400",
    occupied: "bg-primary/20 text-primary",
    maintenance: "bg-orange-500/20 text-orange-400",
    reserved: "bg-blue-500/20 text-blue-400",
  };

  if (!orgId) {
    return <AppLayout><div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Please select an organization first.</p></div></AppLayout>;
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header flex items-center gap-2"><Layers className="w-6 h-6" /> Floors</h1>
            <p className="text-sm text-muted-foreground mt-1">Visual floor plans and unit layouts</p>
          </div>
          <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="All Buildings" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Buildings</SelectItem>
              {buildings.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {filteredBuildings.length === 0 ? (
          <div className="glass-card p-12 text-center text-muted-foreground">No buildings found. Add buildings first.</div>
        ) : (
          filteredBuildings.map((building: any) => {
            const floorCount = building.floors_count || 1;
            return (
              <Card key={building.id} className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="w-5 h-5 text-primary" />
                    {building.name}
                    <Badge variant="outline" className="ml-2">{floorCount} floors</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Array.from({ length: floorCount }, (_, i) => floorCount - i).map((floor) => {
                    const floorUnits = getFloorUnits(building.id, floor);
                    return (
                      <div key={floor} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                        <div className="w-16 text-sm font-semibold text-muted-foreground shrink-0">Floor {floor}</div>
                        <div className="flex flex-wrap gap-2 flex-1">
                          {floorUnits.length > 0 ? floorUnits.map((u: any) => (
                            <div key={u.id} className={`px-3 py-1.5 rounded-md text-xs font-medium ${statusColor[u.status] || "bg-muted text-muted-foreground"}`}>
                              {u.unit_number}
                            </div>
                          )) : (
                            <span className="text-xs text-muted-foreground">No units assigned</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })
        )}
      </motion.div>
    </AppLayout>
  );
};

export default Floors;

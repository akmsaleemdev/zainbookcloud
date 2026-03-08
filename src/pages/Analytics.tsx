import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Building2, BedDouble, DoorOpen, TrendingUp, Percent } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const Analytics = () => {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?.id;

  const { data: units = [] } = useQuery({
    queryKey: ["analytics-units", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("units")
        .select("id, status, unit_type, monthly_rent, building_id, buildings!inner(property_id, properties!inner(organization_id))")
        .eq("buildings.properties.organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["analytics-rooms", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("rooms")
        .select("id, status, room_type, monthly_rent, unit_id, units!inner(building_id, buildings!inner(property_id, properties!inner(organization_id)))")
        .eq("units.buildings.properties.organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: bedSpaces = [] } = useQuery({
    queryKey: ["analytics-beds", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("bed_spaces")
        .select("id, status, monthly_rent, room_id, rooms!inner(unit_id, units!inner(building_id, buildings!inner(property_id, properties!inner(organization_id))))")
        .eq("rooms.units.buildings.properties.organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: leases = [] } = useQuery({
    queryKey: ["analytics-leases", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("leases").select("id, monthly_rent, status, start_date, end_date").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const totalUnits = units.length;
  const occupiedUnits = units.filter((u: any) => u.status === "occupied").length;
  const unitOccupancy = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r: any) => r.status === "occupied").length;

  const totalBeds = bedSpaces.length;
  const occupiedBeds = bedSpaces.filter((b: any) => b.status === "occupied").length;

  const activeLeases = leases.filter((l: any) => l.status === "active");
  const monthlyRevenue = activeLeases.reduce((s: number, l: any) => s + Number(l.monthly_rent || 0), 0);

  const unitStatusData = ["available", "occupied", "maintenance", "reserved"].map(s => ({
    name: s, value: units.filter((u: any) => u.status === s).length,
  })).filter(d => d.value > 0);

  const unitTypeData = [...new Set(units.map((u: any) => u.unit_type))].map(type => ({
    name: String(type), value: units.filter((u: any) => u.unit_type === type).length,
  }));

  const roomTypeData = [...new Set(rooms.map((r: any) => r.room_type))].map(type => ({
    name: String(type), value: rooms.filter((r: any) => r.room_type === type).length,
  }));

  if (!orgId) {
    return <AppLayout><div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Please select an organization first.</p></div></AppLayout>;
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="page-header flex items-center gap-2"><BarChart3 className="w-6 h-6" /> Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Occupancy rates, revenue trends, and portfolio insights</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unit Occupancy</CardTitle>
              <Percent className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unitOccupancy}%</div>
              <p className="text-xs text-muted-foreground mt-1">{occupiedUnits} of {totalUnits} units</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rooms</CardTitle>
              <DoorOpen className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{occupiedRooms}/{totalRooms}</div>
              <p className="text-xs text-muted-foreground mt-1">rooms occupied</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Bed Spaces</CardTitle>
              <BedDouble className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{occupiedBeds}/{totalBeds}</div>
              <p className="text-xs text-muted-foreground mt-1">beds occupied</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">AED {monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{activeLeases.length} active leases</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm">Unit Status Overview</CardTitle></CardHeader>
            <CardContent>
              {unitStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={unitStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {unitStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-12">No unit data</p>}
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm">Units by Type</CardTitle></CardHeader>
            <CardContent>
              {unitTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={unitTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-12">No data</p>}
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm">Rooms by Type</CardTitle></CardHeader>
            <CardContent>
              {roomTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={roomTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-12">No data</p>}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Analytics;

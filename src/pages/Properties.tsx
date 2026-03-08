import { ModulePage } from "@/components/modules/ModulePage";
import { toast } from "sonner";
import { Building2, MapPin, Users, Home } from "lucide-react";

const mockProperties = [
  { id: 1, name: "Marina Tower", location: "Dubai Marina", units: 45, occupancy: 87, revenue: "AED 245K" },
  { id: 2, name: "Business Bay Residences", location: "Business Bay", units: 120, occupancy: 92, revenue: "AED 680K" },
  { id: 3, name: "JVC Apartments", location: "JVC", units: 32, occupancy: 75, revenue: "AED 128K" },
  { id: 4, name: "Downtown Studios", location: "Downtown Dubai", units: 80, occupancy: 95, revenue: "AED 520K" },
  { id: 5, name: "Sharjah Staff Housing", location: "Sharjah", units: 200, occupancy: 68, revenue: "AED 340K" },
];

const Properties = () => {
  return (
    <ModulePage
      title="Properties"
      description="Manage all your properties across the UAE"
      onAdd={() => toast.info("Add property form coming soon")}
      addLabel="Add Property"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockProperties.map((p) => (
          <div key={p.id} className="glass-card p-5 cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                p.occupancy >= 90 ? "bg-success/10 text-success" :
                p.occupancy >= 70 ? "bg-primary/10 text-primary" :
                "bg-warning/10 text-warning"
              }`}>
                {p.occupancy}% Occupied
              </span>
            </div>
            <h3 className="font-semibold text-foreground">{p.name}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" /> {p.location}
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Home className="w-3 h-3" /> {p.units} units
              </div>
              <span className="text-sm font-medium text-foreground">{p.revenue}/mo</span>
            </div>
          </div>
        ))}
      </div>
    </ModulePage>
  );
};

export default Properties;

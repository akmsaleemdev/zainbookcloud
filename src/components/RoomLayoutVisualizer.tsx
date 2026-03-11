import { useState } from "react";
import { Maximize2, Move, Plus, Trash2, BedDouble, Users, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BedSpace {
  id: string;
  label: string;
  x: number;
  y: number;
  status: 'occupied' | 'vacant' | 'maintenance';
  tenant?: string;
  price: string;
}

export const RoomLayoutVisualizer = ({ roomId = "RM-402" }: { roomId?: string }) => {
  // Mock data for the room layout
  const [beds, setBeds] = useState<BedSpace[]>([
    { id: "B1", label: "Bed 1 (Lower)", x: 10, y: 10, status: 'occupied', tenant: 'Ahmed S.', price: 'AED 800/mo' },
    { id: "B2", label: "Bed 2 (Upper)", x: 10, y: 40, status: 'vacant', price: 'AED 750/mo' },
    { id: "B3", label: "Bed 3 (Lower)", x: 60, y: 10, status: 'occupied', tenant: 'Mohammed A.', price: 'AED 800/mo' },
    { id: "B4", label: "Bed 4 (Upper)", x: 60, y: 40, status: 'maintenance', price: 'AED 750/mo' },
  ]);

  const [selectedBed, setSelectedBed] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-success/20 border-success/50 text-success';
      case 'vacant': return 'bg-primary/20 border-primary/50 text-primary';
      case 'maintenance': return 'bg-warning/20 border-warning/50 text-warning';
      default: return 'bg-secondary border-border text-muted-foreground';
    }
  };

  const handleDragEnd = (id: string, newX: number, newY: number) => {
    if (!isEditMode) return;
    setBeds(beds.map(b => b.id === id ? { ...b, x: Math.max(0, Math.min(80, newX)), y: Math.max(0, Math.min(80, newY)) } : b));
  };

  return (
    <Card className="glass-card w-full h-full overflow-hidden flex flex-col">
      <CardHeader className="bg-secondary/30 border-b border-border/50 px-4 py-3 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-primary" />
            Room Layout: {roomId}
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {beds.length} Beds Total
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={isEditMode ? "default" : "outline"} 
            size="sm" 
            className={isEditMode ? "bg-primary text-primary-foreground" : "border-border/50"}
            onClick={() => setIsEditMode(!isEditMode)}
          >
            <Move className="w-4 h-4 mr-2" />
            {isEditMode ? "Save Layout" : "Edit Layout"}
          </Button>
          {isEditMode && (
            <Button variant="outline" size="sm" className="border-border/50">
              <Plus className="w-4 h-4 mr-2" />
              Add Bed
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 relative bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')]">
        
        {/* The Room Canvas */}
        <div className="absolute inset-4 border-2 border-border/50 rounded-xl bg-background/50 backdrop-blur-sm overflow-hidden">
          {/* Room Entrance Marker */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-2 bg-border/50 rounded-t-md flex items-end justify-center pb-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Door</span>
          </div>

          <TooltipProvider>
            {beds.map((bed) => (
              <Tooltip key={bed.id}>
                <TooltipTrigger asChild>
                  <div
                    className={`absolute w-[18%] h-[25%] min-w-[80px] min-h-[100px] rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all shadow-lg ${getStatusColor(bed.status)} ${selectedBed === bed.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background z-10 scale-105' : 'hover:scale-105'}`}
                    style={{ left: `${bed.x}%`, top: `${bed.y}%` }}
                    onClick={() => setSelectedBed(bed.id)}
                    draggable={isEditMode}
                    onDragStart={(e) => {
                      if (!isEditMode) e.preventDefault();
                    }}
                  >
                    <BedDouble className="w-8 h-8 mb-2 opacity-80" />
                    <span className="text-xs font-bold text-center px-1">{bed.id}</span>
                    <span className="text-[10px] opacity-80 uppercase tracking-widest mt-1">{bed.status}</span>
                    
                    {isEditMode && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md hover:bg-destructive/90">
                        <Trash2 className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl p-3 space-y-2 z-50">
                  <div className="font-semibold text-sm border-b border-border/50 pb-2 mb-2">
                    {bed.label}
                  </div>
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline" className={`h-5 ${getStatusColor(bed.status)}`}>{bed.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-medium text-foreground">{bed.price}</span>
                  </div>
                  {bed.tenant && (
                    <div className="flex items-center justify-between gap-4 text-xs pt-2 border-t border-border/50 mt-2">
                      <span className="text-muted-foreground">Tenant</span>
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <Users className="w-3 h-3 text-primary" />
                        {bed.tenant}
                      </div>
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-md border border-border/50 p-3 rounded-xl shadow-lg flex flex-col gap-2 pointer-events-none">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              <Info className="w-3 h-3" /> Legend
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-success/20 border border-success/50" /> Occupied
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-primary/20 border border-primary/50" /> Vacant
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-warning/20 border border-warning/50" /> Maintenance
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

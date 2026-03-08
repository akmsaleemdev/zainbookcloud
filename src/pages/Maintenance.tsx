import { ModulePage } from "@/components/modules/ModulePage";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Wrench, Clock, AlertTriangle } from "lucide-react";

const mockTickets = [
  { id: "MT-001", title: "AC not working", unit: "Marina Tower - 4B", priority: "High", status: "Open", created: "2 hours ago" },
  { id: "MT-002", title: "Water leak in bathroom", unit: "JVC - 12C", priority: "Urgent", status: "In Progress", created: "5 hours ago" },
  { id: "MT-003", title: "Light fixture replacement", unit: "Business Bay - 2A", priority: "Low", status: "Open", created: "1 day ago" },
  { id: "MT-004", title: "Door lock malfunction", unit: "Downtown - 8A", priority: "Medium", status: "Resolved", created: "2 days ago" },
];

const Maintenance = () => (
  <ModulePage title="Maintenance" description="Track and manage maintenance requests" onAdd={() => toast.info("Create ticket coming soon")} addLabel="Create Ticket">
    <div className="space-y-3">
      {mockTickets.map((t) => (
        <div key={t.id} className="glass-card p-4 flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              t.priority === "Urgent" ? "bg-destructive/10 text-destructive" :
              t.priority === "High" ? "bg-warning/10 text-warning" :
              "bg-primary/10 text-primary"
            }`}>
              {t.priority === "Urgent" ? <AlertTriangle className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">{t.id}</span>
                <span className="font-medium text-sm text-foreground">{t.title}</span>
              </div>
              <span className="text-xs text-muted-foreground">{t.unit}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={t.priority === "Urgent" ? "destructive" : t.priority === "High" ? "secondary" : "outline"}>
              {t.priority}
            </Badge>
            <Badge variant={t.status === "Resolved" ? "default" : "secondary"}>
              {t.status}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" /> {t.created}
            </div>
          </div>
        </div>
      ))}
    </div>
  </ModulePage>
);

export default Maintenance;

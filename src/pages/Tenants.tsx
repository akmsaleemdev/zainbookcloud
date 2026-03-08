import { ModulePage } from "@/components/modules/ModulePage";
import { toast } from "sonner";
import { Users, Phone, Mail, Calendar, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const mockTenants = [
  { id: 1, name: "Ahmed Al Maktoum", email: "ahmed@email.com", phone: "+971 50 123 4567", unit: "Marina Tower - 4B", status: "Active", leaseEnd: "2026-08-15" },
  { id: 2, name: "Sara Khan", email: "sara@email.com", phone: "+971 55 987 6543", unit: "Business Bay - 2A", status: "Active", leaseEnd: "2026-03-20" },
  { id: 3, name: "Mohammed Ali", email: "m.ali@email.com", phone: "+971 52 456 7890", unit: "JVC - 12C", status: "Notice", leaseEnd: "2026-04-01" },
  { id: 4, name: "Fatima Noor", email: "fatima@email.com", phone: "+971 56 321 0987", unit: "Downtown - 8A", status: "Active", leaseEnd: "2027-01-10" },
  { id: 5, name: "Raj Patel", email: "raj@email.com", phone: "+971 58 654 3210", unit: "Sharjah - B12", status: "Overdue", leaseEnd: "2026-06-30" },
];

const Tenants = () => {
  return (
    <ModulePage
      title="Tenants"
      description="Manage tenant profiles and information"
      onAdd={() => toast.info("Add tenant form coming soon")}
      addLabel="Add Tenant"
    >
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Tenant</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Contact</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Unit</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Lease End</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4"></th>
            </tr>
          </thead>
          <tbody>
            {mockTenants.map((t) => (
              <tr key={t.id} className="border-b border-border/20 hover:bg-accent/30 transition-colors cursor-pointer">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                      {t.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span className="font-medium text-sm text-foreground">{t.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{t.email}</div>
                    <div className="flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{t.phone}</div>
                  </div>
                </td>
                <td className="p-4 text-sm text-foreground">{t.unit}</td>
                <td className="p-4">
                  <Badge variant={t.status === "Active" ? "default" : t.status === "Notice" ? "secondary" : "destructive"}>
                    {t.status}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(t.leaseEnd).toLocaleDateString()}
                  </div>
                </td>
                <td className="p-4">
                  <button className="text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModulePage>
  );
};

export default Tenants;

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Crown, CreditCard, TrendingUp, Clock } from "lucide-react";
import { format } from "date-fns";

export const SubscriptionsTab = () => {
  const { data: allSubs = [] } = useQuery({
    queryKey: ["master-all-subs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customer_subscriptions")
        .select("*, subscription_plans(name, plan_type, price), organizations(name, email, emirate)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const activeSubs = allSubs.filter((s: any) => s.status === "active").length;
  const trialSubs = allSubs.filter((s: any) => s.status === "trialing").length;
  const totalRevenue = allSubs.reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0);

  const statusStyles: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400",
    trialing: "bg-amber-500/20 text-amber-400",
    suspended: "bg-destructive/20 text-destructive",
    cancelled: "bg-muted text-muted-foreground",
    expired: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Crown, label: "Total Subscriptions", value: allSubs.length, color: "text-primary" },
          { icon: CreditCard, label: "Active", value: activeSubs, color: "text-emerald-400" },
          { icon: Clock, label: "On Trial", value: trialSubs, color: "text-amber-400" },
          { icon: TrendingUp, label: "Total Revenue (AED)", value: totalRevenue.toLocaleString(), color: "text-blue-400" },
        ].map((s, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead>Amount (AED)</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Next Billing</TableHead>
              <TableHead>Expires</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allSubs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No subscriptions yet
                </TableCell>
              </TableRow>
            ) : (
              allSubs.map((sub: any) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.organizations?.name || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{sub.organizations?.email || "—"}</TableCell>
                  <TableCell>
                    <Badge className="bg-primary/20 text-primary text-xs">
                      {sub.subscription_plans?.name || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-xs ${statusStyles[sub.status] || ""}`}>
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{sub.billing_cycle === "yearly" ? "Annual" : "Monthly"}</TableCell>
                  <TableCell className="text-sm font-medium">{(sub.total_amount || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(sub.started_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {sub.next_billing_date ? format(new Date(sub.next_billing_date), "dd MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {sub.expires_at ? format(new Date(sub.expires_at), "dd MMM yyyy") : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

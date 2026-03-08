import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Building2, Users, Crown } from "lucide-react";
import { format } from "date-fns";

export const TenantsTab = () => {
  const [search, setSearch] = useState("");

  const { data: orgsWithSubs = [] } = useQuery({
    queryKey: ["master-orgs-subs"],
    queryFn: async () => {
      const { data: orgs } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: subs } = await supabase
        .from("customer_subscriptions")
        .select("*, subscription_plans(name, plan_type, price)")
        .in("status", ["active", "trialing"]);

      const { data: members } = await supabase
        .from("organization_members")
        .select("organization_id, user_id");

      return (orgs || []).map((org: any) => {
        const sub = (subs || []).find((s: any) => s.organization_id === org.id);
        const memberCount = (members || []).filter((m: any) => m.organization_id === org.id).length;
        return { ...org, subscription: sub, memberCount };
      });
    },
  });

  const filtered = orgsWithSubs.filter((o: any) =>
    o.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = orgsWithSubs.filter((o: any) => o.is_active).length;
  const subscribedCount = orgsWithSubs.filter((o: any) => o.subscription).length;
  const trialCount = orgsWithSubs.filter((o: any) => o.subscription?.status === "trialing").length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Organizations</p>
              <p className="text-xl font-bold">{orgsWithSubs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Subscribed</p>
              <p className="text-xl font-bold">{subscribedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">On Trial</p>
              <p className="text-xl font-bold">{trialCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search organizations..."
          className="pl-10 bg-secondary/50 border-border/50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Emirate</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Sub Status</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No organizations found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((org: any) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>{org.emirate || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{org.email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{org.memberCount} users</Badge>
                  </TableCell>
                  <TableCell>
                    {org.subscription ? (
                      <Badge className="bg-primary/20 text-primary text-xs">
                        {org.subscription.subscription_plans?.name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">No plan</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {org.subscription ? (
                      <Badge
                        variant={org.subscription.status === "active" ? "default" : "secondary"}
                        className={
                          org.subscription.status === "active"
                            ? "bg-emerald-500/20 text-emerald-400 text-xs"
                            : org.subscription.status === "trialing"
                            ? "bg-amber-500/20 text-amber-400 text-xs"
                            : "text-xs"
                        }
                      >
                        {org.subscription.status}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={org.is_active ? "default" : "secondary"}>
                      {org.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(org.created_at), "dd MMM yyyy")}
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

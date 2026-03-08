import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Search, Building2, Users, Crown, Eye, Power, Pencil } from "lucide-react";
import { format } from "date-fns";

export const TenantsTab = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [detailOrg, setDetailOrg] = useState<any>(null);

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

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("organizations").update({ is_active } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-orgs-subs"] });
      toast({ title: "Organization status updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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
                        variant="secondary"
                        className={`text-xs ${
                          org.subscription.status === "active"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : org.subscription.status === "trialing"
                            ? "bg-amber-500/20 text-amber-400"
                            : ""
                        }`}
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
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailOrg(org)} title="View Details">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => toggleActiveMutation.mutate({ id: org.id, is_active: !org.is_active })}
                      title={org.is_active ? "Deactivate" : "Activate"}
                    >
                      <Power className={`w-3.5 h-3.5 ${org.is_active ? "text-emerald-400" : "text-destructive"}`} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Org Detail Dialog */}
      <Dialog open={!!detailOrg} onOpenChange={() => setDetailOrg(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Organization Details</DialogTitle>
          </DialogHeader>
          {detailOrg && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{detailOrg.name}</span></div>
                <div><span className="text-muted-foreground">Arabic:</span> <span className="font-medium">{detailOrg.name_ar || "—"}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{detailOrg.email || "—"}</span></div>
                <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{detailOrg.phone || "—"}</span></div>
                <div><span className="text-muted-foreground">Emirate:</span> <span className="font-medium">{detailOrg.emirate || "—"}</span></div>
                <div><span className="text-muted-foreground">Country:</span> <span className="font-medium">{detailOrg.country || "UAE"}</span></div>
                <div><span className="text-muted-foreground">Currency:</span> <span className="font-medium">{detailOrg.currency || "AED"}</span></div>
                <div><span className="text-muted-foreground">Members:</span> <span className="font-medium">{detailOrg.memberCount}</span></div>
                <div><span className="text-muted-foreground">Trade License:</span> <span className="font-medium">{detailOrg.trade_license || "—"}</span></div>
                <div><span className="text-muted-foreground">VAT #:</span> <span className="font-medium">{detailOrg.vat_number || "—"}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={detailOrg.is_active ? "default" : "secondary"}>{detailOrg.is_active ? "Active" : "Inactive"}</Badge></div>
                <div><span className="text-muted-foreground">Plan:</span> <span className="font-medium">{detailOrg.subscription?.subscription_plans?.name || "No Plan"}</span></div>
              </div>
              <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
                Created: {format(new Date(detailOrg.created_at), "dd MMM yyyy HH:mm")}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOrg(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

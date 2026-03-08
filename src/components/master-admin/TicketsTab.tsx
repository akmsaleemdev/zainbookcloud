import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, Clock, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export const TicketsTab = () => {
  const queryClient = useQueryClient();

  const { data: tickets = [] } = useQuery({
    queryKey: ["master-tickets-full"],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("*, organizations(name)")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: string }) => {
      const update: any = { [field]: value };
      if (field === "status" && (value === "resolved" || value === "closed")) {
        update.resolved_at = new Date().toISOString();
      }
      const { error } = await supabase.from("support_tickets").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-tickets-full"] });
      queryClient.invalidateQueries({ queryKey: ["master-open-tickets"] });
      toast({ title: "Ticket updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openCount = tickets.filter((t: any) => t.status === "open").length;
  const inProgressCount = tickets.filter((t: any) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t: any) => t.status === "resolved" || t.status === "closed").length;
  const criticalCount = tickets.filter((t: any) => t.priority === "critical" || t.priority === "high").length;

  const priorityStyles: Record<string, string> = {
    critical: "bg-destructive/20 text-destructive",
    high: "bg-amber-500/20 text-amber-400",
    medium: "bg-blue-500/20 text-blue-400",
    low: "bg-muted text-muted-foreground",
  };

  const statusStyles: Record<string, string> = {
    open: "bg-primary/20 text-primary",
    in_progress: "bg-amber-500/20 text-amber-400",
    resolved: "bg-emerald-500/20 text-emerald-400",
    closed: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: MessageSquare, label: "Total Tickets", value: tickets.length, color: "text-blue-400" },
          { icon: AlertTriangle, label: "Open", value: openCount, color: "text-primary" },
          { icon: Clock, label: "In Progress", value: inProgressCount, color: "text-amber-400" },
          { icon: CheckCircle, label: "Resolved", value: resolvedCount, color: "text-emerald-400" },
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

      {criticalCount > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="text-sm text-destructive font-medium">
            {criticalCount} high/critical priority ticket{criticalCount > 1 ? "s" : ""} require attention
          </span>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket #</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No support tickets yet
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.ticket_number}</TableCell>
                  <TableCell className="text-sm">{t.organizations?.name || "—"}</TableCell>
                  <TableCell className="font-medium text-sm max-w-[200px] truncate">{t.subject}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{t.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={t.priority}
                      onValueChange={(v) => updateTicketMutation.mutate({ id: t.id, field: "priority", value: v })}
                    >
                      <SelectTrigger className={`h-7 text-xs w-24 border-0 ${priorityStyles[t.priority] || ""}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["low", "medium", "high", "critical"].map((p) => (
                          <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={t.status}
                      onValueChange={(v) => updateTicketMutation.mutate({ id: t.id, field: "status", value: v })}
                    >
                      <SelectTrigger className={`h-7 text-xs w-28 border-0 ${statusStyles[t.status] || ""}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["open", "in_progress", "resolved", "closed"].map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">{s.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(t.created_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs text-muted-foreground">
                      {t.resolved_at ? `Resolved ${format(new Date(t.resolved_at), "dd MMM")}` : ""}
                    </span>
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

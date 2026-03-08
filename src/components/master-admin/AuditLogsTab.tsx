import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText } from "lucide-react";
import { format } from "date-fns";

export const AuditLogsTab = () => {
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  const { data: logs = [] } = useQuery({
    queryKey: ["master-audit-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      return data || [];
    },
  });

  const actions = [...new Set(logs.map((l: any) => l.action))];

  const filtered = logs.filter((l: any) => {
    const matchSearch = !search ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.table_name?.toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction === "all" || l.action === filterAction;
    return matchSearch && matchAction;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            className="pl-10 bg-secondary/50 border-border/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-40 bg-secondary/50 border-border/50">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>Record ID</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-mono">{log.table_name || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {log.record_id ? log.record_id.slice(0, 8) + "..." : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.ip_address || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), "dd MMM yyyy HH:mm:ss")}
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

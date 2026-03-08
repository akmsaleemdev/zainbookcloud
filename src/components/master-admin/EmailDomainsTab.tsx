import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Mail, Trash2, RefreshCw, Globe, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface EmailDomain {
  id: string;
  domain: string;
  status: string;
  verified_at: string | null;
  dns_records: any;
  created_at: string;
  notes: string | null;
}

export const EmailDomainsTab = () => {
  const queryClient = useQueryClient();
  const [addDialog, setAddDialog] = useState(false);
  const [domain, setDomain] = useState("");

  const { data: domains = [], isLoading } = useQuery({
    queryKey: ["email-domains"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_domains" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as EmailDomain[];
    },
  });

  const addDomainMutation = useMutation({
    mutationFn: async () => {
      const dnsRecords = {
        spf: { type: "TXT", name: "@", value: `v=spf1 include:_spf.${domain} ~all` },
        dkim: { type: "TXT", name: "mail._domainkey", value: "pending-setup" },
        mx: { type: "MX", name: "@", value: `mail.${domain}`, priority: 10 },
      };
      const { error } = await supabase.from("email_domains" as any).insert({
        domain,
        status: "pending",
        dns_records: dnsRecords,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-domains"] });
      setAddDialog(false);
      setDomain("");
      toast({ title: "Domain added", description: "Configure the DNS records to verify your domain." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_domains" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-domains"] });
      toast({ title: "Domain removed" });
    },
  });

  const verifyDomainMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("email_domains" as any)
        .update({ status: "verified", verified_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-domains"] });
      toast({ title: "Domain verified" });
    },
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</Badge>;
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case "failed":
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" /> Email Domains
          </h3>
          <p className="text-sm text-muted-foreground">Manage custom email domains for sending notifications and communications</p>
        </div>
        <Button onClick={() => setAddDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Domain
        </Button>
      </div>

      {isLoading ? (
        <Card className="glass-card p-8 text-center text-muted-foreground">Loading...</Card>
      ) : domains.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <Globe className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h4 className="text-lg font-medium mb-2">No Email Domains Configured</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Add a custom email domain to send notifications from your own domain (e.g., noreply@yourdomain.com)
            </p>
            <Button onClick={() => setAddDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Your First Domain
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verified At</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.domain}</TableCell>
                  <TableCell>{statusBadge(d.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {d.verified_at ? new Date(d.verified_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(d.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {d.status !== "verified" && (
                      <Button variant="ghost" size="icon" onClick={() => verifyDomainMutation.mutate(d.id)} title="Verify DNS">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => deleteDomainMutation.mutate(d.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* DNS Records Info for pending domains */}
      {domains.filter(d => d.status === "pending").map((d) => (
        <Card key={d.id} className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">DNS Records Required for {d.domain}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {d.dns_records && Object.entries(d.dns_records).map(([key, record]: [string, any]) => (
              <div key={key} className="flex items-start gap-4 p-2 rounded bg-secondary/50">
                <Badge variant="outline" className="min-w-[40px] justify-center">{record.type}</Badge>
                <div className="flex-1">
                  <span className="text-muted-foreground">Name:</span> <code className="text-xs">{record.name}</code>
                  <br />
                  <span className="text-muted-foreground">Value:</span> <code className="text-xs break-all">{record.value}</code>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Add Domain Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Email Domain</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Domain Name</Label>
              <Input
                placeholder="yourdomain.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the domain you want to use for sending emails (e.g., yourdomain.com)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={() => addDomainMutation.mutate()} disabled={!domain.trim() || addDomainMutation.isPending}>
              Add Domain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

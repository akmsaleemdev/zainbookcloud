import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, MessageSquare, Send, Mail, MailOpen, Trash2 } from "lucide-react";
import { format } from "date-fns";

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-blue-500/20 text-blue-400",
  high: "bg-orange-500/20 text-orange-400",
  urgent: "bg-destructive/20 text-destructive",
};

const Messaging = () => {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ subject: "", body: "", recipient_id: "", priority: "normal", channel: "internal" });

  const orgId = currentOrg?.id;

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("organization_id", orgId)
        .is("parent_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("organization_members")
        .select("user_id, role")
        .eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-list"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data || [];
    },
  });

  // Realtime
  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel("messages-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orgId, queryClient]);

  const getProfileName = (userId: string) => {
    const p = profiles.find((pr: any) => pr.user_id === userId);
    return p?.full_name || "Unknown User";
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!orgId || !user) throw new Error("Missing context");
      const { error } = await supabase.from("messages").insert({
        organization_id: orgId,
        sender_id: user.id,
        recipient_id: form.recipient_id || null,
        subject: form.subject || null,
        body: form.body,
        priority: form.priority,
        channel: form.channel,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setComposeOpen(false);
      setForm({ subject: "", body: "", recipient_id: "", priority: "normal", channel: "internal" });
      toast({ title: "Message sent" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("messages").update({ is_read: true }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setSelectedMsg(null);
      toast({ title: "Message deleted" });
    },
  });

  const filtered = messages.filter((m: any) =>
    m.subject?.toLowerCase().includes(search.toLowerCase()) ||
    m.body?.toLowerCase().includes(search.toLowerCase())
  );

  if (!orgId) {
    return <AppLayout><div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Please select an organization first.</p></div></AppLayout>;
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header flex items-center gap-2"><MessageSquare className="w-6 h-6" /> Messaging</h1>
            <p className="text-sm text-muted-foreground mt-1">Internal messaging and communication</p>
          </div>
          <Button onClick={() => setComposeOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New Message
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search messages..." className="pl-10 bg-secondary/50 border-border/50" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Message List */}
          <div className="lg:col-span-1 glass-card overflow-hidden">
            <ScrollArea className="h-[600px]">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No messages.</div>
              ) : filtered.map((m: any) => (
                <div
                  key={m.id}
                  onClick={() => { setSelectedMsg(m); if (!m.is_read) markReadMutation.mutate(m.id); }}
                  className={`p-4 border-b border-border/30 cursor-pointer hover:bg-secondary/30 transition-colors ${selectedMsg?.id === m.id ? "bg-secondary/50" : ""} ${!m.is_read ? "border-l-2 border-l-primary" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {m.is_read ? <MailOpen className="w-3.5 h-3.5 text-muted-foreground" /> : <Mail className="w-3.5 h-3.5 text-primary" />}
                      <span className={`text-sm ${!m.is_read ? "font-semibold" : ""}`}>{m.subject || "(No Subject)"}</span>
                    </div>
                    <Badge className={`text-[10px] ${priorityColors[m.priority] || ""}`}>{m.priority}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{m.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{getProfileName(m.sender_id)} · {format(new Date(m.created_at), "dd MMM HH:mm")}</p>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2 glass-card p-6">
            {selectedMsg ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{selectedMsg.subject || "(No Subject)"}</h2>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(selectedMsg.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>From: <strong className="text-foreground">{getProfileName(selectedMsg.sender_id)}</strong></span>
                  <span>·</span>
                  <span>{format(new Date(selectedMsg.created_at), "dd MMM yyyy HH:mm")}</span>
                  <Badge className={priorityColors[selectedMsg.priority] || ""}>{selectedMsg.priority}</Badge>
                  <Badge variant="outline">{selectedMsg.channel}</Badge>
                </div>
                <div className="border-t border-border/30 pt-4">
                  <p className="text-sm whitespace-pre-wrap">{selectedMsg.body}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Select a message to read</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Send className="w-5 h-5" /> New Message</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>To (optional)</Label>
              <Select value={form.recipient_id} onValueChange={(v) => setForm({ ...form, recipient_id: v })}>
                <SelectTrigger><SelectValue placeholder="All members (broadcast)" /></SelectTrigger>
                <SelectContent>
                  {members.filter((m: any) => m.user_id !== user?.id).map((m: any) => (
                    <SelectItem key={m.user_id} value={m.user_id}>{getProfileName(m.user_id)} ({m.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={5} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button onClick={() => sendMutation.mutate()} disabled={!form.body} className="gap-2"><Send className="w-4 h-4" /> Send</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Messaging;

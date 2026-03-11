import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import {
  MessageSquare, Ticket, Plus, Send, Bot, User, Search,
  Clock, AlertTriangle, CheckCircle, Loader2, Headphones, Sparkles,
  BookOpen, HelpCircle, FileText
} from "lucide-react";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-support-chat`;

const KB_ARTICLES = [
  { title: "Getting Started with ZainBook", category: "guide", summary: "Learn how to set up your organization, add properties, and invite team members." },
  { title: "Understanding Ejari Registration", category: "uae", summary: "Step-by-step guide to registering tenancy contracts on the Ejari system in Dubai." },
  { title: "Setting Up ERP Integrations", category: "technical", summary: "Connect ZainBook with Oracle NetSuite, SAP, Dynamics 365, Odoo, or Zoho." },
  { title: "Managing Subscription Plans", category: "billing", summary: "Upgrade, downgrade, or cancel your subscription. Understand billing cycles." },
  { title: "Maintenance Request Workflow", category: "guide", summary: "How maintenance requests flow from tenant submission to resolution." },
  { title: "RERA Compliance Checklist", category: "uae", summary: "Ensure your properties comply with RERA regulations across all Emirates." },
  { title: "Cheque Tracking & PDC Management", category: "guide", summary: "Track post-dated cheques, manage deposits, and handle bounced cheques." },
  { title: "AI Insights & Rent Pricing", category: "technical", summary: "Use AI-powered tools for market rent analysis and financial forecasting." },
];

const SupportCenter = () => {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("chat");
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([
    { role: "assistant", content: "Hello! I'm your AI support assistant. How can I help you today? I can assist with:\n\n• **Sales** — pricing, plans, features\n• **Technical** — setup, integrations, bugs\n• **Billing** — invoices, payments, upgrades\n• **General** — anything else\n\nJust type your question!" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [ticketDialog, setTicketDialog] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: "", description: "", category: "general", priority: "medium" });
  const [kbSearch, setKbSearch] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["my-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role: "user", content: chatInput.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...chatMessages, userMsg].filter(m => m.role !== "system") }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          toast({ title: "Rate limit", description: "Too many requests. Please wait a moment.", variant: "destructive" });
        } else if (resp.status === 402) {
          toast({ title: "Credits exhausted", description: "AI credits need to be topped up.", variant: "destructive" });
        }
        throw new Error(errorData.error || "Failed to get response");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              assistantContent += content;
              setChatMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch { /* partial json, wait for more data */ }
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              assistantContent += content;
              setChatMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      if (!assistantContent) {
        setChatMessages(prev => [...prev, { role: "assistant", content: "I'm sorry, I'm having trouble connecting right now. Please try again or create a support ticket for human assistance." }]);
      }
    }
    setChatLoading(false);
  };

  const createTicketMutation = useMutation({
    mutationFn: async () => {
      const ticketNumber = `TK-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from("support_tickets").insert({
        ticket_number: ticketNumber,
        organization_id: currentOrg?.id || null,
        created_by: user?.id,
        ...ticketForm,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      setTicketDialog(false);
      setTicketForm({ subject: "", description: "", category: "general", priority: "medium" });
      toast({ title: "Ticket created successfully" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const priorityColors: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-blue-500/20 text-blue-400",
    high: "bg-amber-500/20 text-amber-400",
    critical: "bg-destructive/20 text-destructive",
  };

  const statusIcons: Record<string, any> = {
    open: AlertTriangle,
    in_progress: Loader2,
    waiting: Clock,
    resolved: CheckCircle,
    closed: CheckCircle,
  };

  const categoryColors: Record<string, string> = {
    guide: "bg-blue-500/20 text-blue-400",
    uae: "bg-amber-500/20 text-amber-400",
    technical: "bg-violet-500/20 text-violet-400",
    billing: "bg-emerald-500/20 text-emerald-400",
  };

  const filteredArticles = KB_ARTICLES.filter(a =>
    a.title.toLowerCase().includes(kbSearch.toLowerCase()) ||
    a.summary.toLowerCase().includes(kbSearch.toLowerCase())
  );

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header flex items-center gap-2"><Headphones className="w-6 h-6 text-primary" /> Support Center</h1>
            <p className="text-sm text-muted-foreground mt-1">AI-powered support, tickets, and knowledge base</p>
          </div>
          <Button onClick={() => setTicketDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New Ticket
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="chat" className="gap-2"><Bot className="w-4 h-4" /> AI Chat</TabsTrigger>
            <TabsTrigger value="tickets" className="gap-2"><Ticket className="w-4 h-4" /> My Tickets ({tickets.length})</TabsTrigger>
            <TabsTrigger value="kb" className="gap-2"><BookOpen className="w-4 h-4" /> Knowledge Base</TabsTrigger>
          </TabsList>

          {/* AI Chat */}
          <TabsContent value="chat">
            <Card className="glass-card">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> AI Support Assistant
                  <Badge variant="outline" className="ml-auto text-[10px]">Powered by AI</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] p-4">
                  <div className="space-y-4">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                        {msg.role === "assistant" && (
                          <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary/80"
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        {msg.role === "user" && (
                          <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    ))}
                    {chatLoading && !chatMessages[chatMessages.length - 1]?.content && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                        <div className="bg-secondary/80 rounded-2xl px-4 py-3">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-border/50">
                  <form onSubmit={(e) => { e.preventDefault(); sendChat(); }} className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your message..."
                      className="bg-secondary/50 border-border/50"
                      disabled={chatLoading}
                    />
                    <Button type="submit" disabled={!chatInput.trim() || chatLoading} size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets */}
          <TabsContent value="tickets">
            <div className="glass-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ticketsLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : tickets.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No tickets yet. Use AI Chat or create a ticket above.</TableCell></TableRow>
                  ) : tickets.map((t: any) => {
                    const StatusIcon = statusIcons[t.status] || Clock;
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.ticket_number}</TableCell>
                        <TableCell className="font-medium">{t.subject}</TableCell>
                        <TableCell><Badge variant="secondary">{t.category}</Badge></TableCell>
                        <TableCell><Badge className={priorityColors[t.priority]}>{t.priority}</Badge></TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <StatusIcon className={`w-3 h-3 ${t.status === "in_progress" ? "animate-spin" : ""}`} />
                            {t.status?.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Knowledge Base */}
          <TabsContent value="kb">
            <div className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search articles..." className="pl-10 bg-secondary/50 border-border/50" value={kbSearch} onChange={(e) => setKbSearch(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArticles.map((article, i) => (
                  <Card key={i} className="glass-card hover:border-primary/30 transition-colors cursor-pointer">
                    <CardContent className="pt-6 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <h3 className="font-medium text-sm">{article.title}</h3>
                        </div>
                        <Badge className={`text-[10px] ${categoryColors[article.category] || ""}`}>{article.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground pl-6">{article.summary}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* New Ticket Dialog */}
      <Dialog open={ticketDialog} onOpenChange={setTicketDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Support Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Subject</Label><Input value={ticketForm.subject} onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })} placeholder="Brief description" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={ticketForm.description} onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })} placeholder="Detailed description" rows={4} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={ticketForm.category} onValueChange={(v) => setTicketForm({ ...ticketForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["sales", "technical", "billing", "general"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={ticketForm.priority} onValueChange={(v) => setTicketForm({ ...ticketForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low", "medium", "high", "critical"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTicketDialog(false)}>Cancel</Button>
            <Button onClick={() => createTicketMutation.mutate()} disabled={!ticketForm.subject || createTicketMutation.isPending}>Create Ticket</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default SupportCenter;

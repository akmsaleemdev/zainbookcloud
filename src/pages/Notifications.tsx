import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Bell, BellOff, Check, CheckCheck, Trash2, Info, AlertTriangle, AlertCircle, CheckCircle, Send } from "lucide-react";
import { format } from "date-fns";
import { BulkNotificationSender } from "@/components/notifications/BulkNotificationSender";

const typeIcons: Record<string, any> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
};

const typeColors: Record<string, string> = {
  info: "text-blue-400",
  warning: "text-orange-400",
  error: "text-destructive",
  success: "text-emerald-400",
};

const Notifications = () => {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [bulkOpen, setBulkOpen] = useState(false);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({ title: "All notifications marked as read" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({ title: "Notification deleted" });
    },
  });

  const filtered = filter === "unread" ? notifications.filter((n: any) => !n.is_read) : notifications;
  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header flex items-center gap-2">
              <Bell className="w-6 h-6" /> Notifications
              {unreadCount > 0 && <Badge className="bg-primary text-primary-foreground">{unreadCount}</Badge>}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Stay updated with system events</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)} className="gap-1">
              <Send className="w-4 h-4" /> Bulk Send
            </Button>
            <Button variant="outline" size="sm" onClick={() => setFilter(filter === "all" ? "unread" : "all")}>
              {filter === "all" ? <BellOff className="w-4 h-4 mr-1" /> : <Bell className="w-4 h-4 mr-1" />}
              {filter === "all" ? "Unread Only" : "Show All"}
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => markAllReadMutation.mutate()} className="gap-1">
                <CheckCheck className="w-4 h-4" /> Mark All Read
              </Button>
            )}
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <ScrollArea className="h-[650px]">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                {filter === "unread" ? "No unread notifications." : "No notifications yet."}
              </div>
            ) : filtered.map((n: any) => {
              const Icon = typeIcons[n.type] || Info;
              return (
                <div
                  key={n.id}
                  className={`p-4 border-b border-border/30 flex items-start gap-4 transition-colors hover:bg-secondary/20 ${!n.is_read ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                >
                  <div className={`mt-0.5 ${typeColors[n.type] || "text-muted-foreground"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm ${!n.is_read ? "font-semibold" : ""}`}>{n.title}</h3>
                      <Badge variant="outline" className="text-[10px]">{n.category}</Badge>
                    </div>
                    {n.body && <p className="text-xs text-muted-foreground mt-1">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(n.created_at), "dd MMM yyyy HH:mm")}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!n.is_read && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markReadMutation.mutate(n.id)}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(n.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </ScrollArea>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Notifications;

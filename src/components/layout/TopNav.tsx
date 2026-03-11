import { useState, useEffect } from "react";
import { Search, Bell, LogOut, Sparkles, Sun, Moon, Menu, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/stores/useAppStore";

interface TopNavProps {
  onMenuToggle?: () => void;
}

export const TopNav = ({ onMenuToggle }: TopNavProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const { setRightDrawerOpen, openQuickCreate } = useAppStore();

  const { data: profile } = useQuery({
    queryKey: ["profile-nav", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-notifications", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      return count || 0;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("topnav-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "P";

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <header className="h-[72px] border-b border-border/40 flex items-center justify-between px-4 md:px-8 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="md:hidden w-10 h-10 rounded-xl" onClick={onMenuToggle}>
          <Menu className="w-5 h-5" />
        </Button>
        <div className="relative w-48 md:w-96 hidden sm:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search anything..."
            className="pl-12 h-12 text-[15px] bg-secondary/60 border-border/30 rounded-2xl focus:border-primary/40 placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Theme toggle */}
        <Button variant="ghost" size="icon" className="w-10 h-10 md:w-11 md:h-11 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        {/* Quick Create Trigger */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            openQuickCreate("Tenant");
            setRightDrawerOpen(true);
          }}
          className="w-10 h-10 md:w-11 md:h-11 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          <PlusCircle className="w-5 h-5" />
        </Button>

        {/* AI Insights Trigger */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            openQuickCreate(null); // Clear quick create string to show AI insights
            setRightDrawerOpen(true);
          }}
          className="w-10 h-10 md:w-11 md:h-11 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          <Sparkles className="w-5 h-5" />
        </Button>

        <Link to="/notifications">
          <Button variant="ghost" size="icon" className="relative w-10 h-10 md:w-11 md:h-11 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold ring-2 ring-background px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        </Link>
        <div className="w-px h-8 bg-border/40 mx-1 hidden md:block" />
        <Link to="/settings" className="flex items-center gap-3 cursor-pointer">
          <Avatar className="w-10 h-10 rounded-xl">
            <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold rounded-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:block">
            <p className="text-[15px] font-semibold text-foreground leading-tight">{displayName}</p>
            <p className="text-xs text-muted-foreground">{currentOrg?.name || "No Organization"}</p>
          </div>
        </Link>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="w-10 h-10 md:w-11 md:h-11 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
};

import { Search, Bell, LogOut, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const TopNav = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <header className="h-[72px] border-b border-border/40 flex items-center justify-between px-8 bg-background/80 backdrop-blur-xl">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search anything..."
          className="pl-12 h-12 text-[15px] bg-secondary/60 border-border/30 rounded-2xl focus:border-primary/40 placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="w-11 h-11 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10">
          <Sparkles className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="relative w-11 h-11 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-background" />
        </Button>
        <div className="w-px h-8 bg-border/40 mx-1" />
        <div className="flex items-center gap-3 cursor-pointer">
          <Avatar className="w-10 h-10 rounded-xl">
            <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold rounded-xl">
              ZB
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-[15px] font-semibold text-foreground leading-tight">Admin</p>
            <p className="text-xs text-muted-foreground">Super Admin</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="w-11 h-11 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
};

import { Search, Bell, Brain, LogOut, Sparkles } from "lucide-react";
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
    <header className="h-14 border-b border-border/50 flex items-center justify-between px-6 bg-background/60 backdrop-blur-xl">
      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search anything..."
          className="pl-9 h-8 text-xs bg-muted/40 border-border/30 rounded-lg focus:border-primary/40 placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-primary">
          <Sparkles className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="relative w-8 h-8 text-muted-foreground hover:text-foreground">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </Button>
        <div className="w-px h-6 bg-border/40 mx-1.5" />
        <Avatar className="w-7 h-7 cursor-pointer">
          <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-semibold">
            ZB
          </AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="w-8 h-8 text-muted-foreground hover:text-destructive">
          <LogOut className="w-3.5 h-3.5" />
        </Button>
      </div>
    </header>
  );
};

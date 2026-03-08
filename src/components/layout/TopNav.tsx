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
    <header className="h-16 border-b border-border/50 flex items-center justify-between px-6 bg-background/60 backdrop-blur-xl">
      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search anything..."
          className="pl-10 h-10 text-sm bg-muted/40 border-border/30 rounded-lg focus:border-primary/40 placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground hover:text-primary">
          <Sparkles className="w-4.5 h-4.5" />
        </Button>
        <Button variant="ghost" size="icon" className="relative w-9 h-9 text-muted-foreground hover:text-foreground">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </Button>
        <div className="w-px h-7 bg-border/40 mx-2" />
        <Avatar className="w-8 h-8 cursor-pointer">
          <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
            ZB
          </AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="w-9 h-9 text-muted-foreground hover:text-destructive">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

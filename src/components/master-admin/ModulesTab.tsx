import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Zap } from "lucide-react";

export const ModulesTab = () => {
  const { data: modules = [] } = useQuery({
    queryKey: ["master-modules"],
    queryFn: async () => {
      const { data } = await supabase.from("platform_modules").select("*").order("sort_order");
      return data || [];
    },
  });

  const categories = [...new Set(modules.map((m: any) => m.category))];

  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{cat || "General"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules
              .filter((m: any) => m.category === cat)
              .map((m: any) => (
                <Card key={m.id} className="glass-card">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${m.is_active ? "bg-primary/10" : "bg-muted"}`}>
                        <Zap className={`w-4 h-4 ${m.is_active ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{m.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                      </div>
                    </div>
                    <Badge variant={m.is_active ? "default" : "secondary"}>
                      {m.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

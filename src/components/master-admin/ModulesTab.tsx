import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Zap, ToggleLeft, ToggleRight } from "lucide-react";

export const ModulesTab = () => {
  const queryClient = useQueryClient();

  const { data: modules = [] } = useQuery({
    queryKey: ["master-modules"],
    queryFn: async () => {
      const { data } = await supabase.from("platform_modules").select("*").order("category, sort_order");
      return data || [];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("platform_modules").update({ is_active } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-modules"] });
      toast({ title: "Module updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const bulkToggleMutation = useMutation({
    mutationFn: async (enable: boolean) => {
      const ids = modules.map((m: any) => m.id);
      for (const id of ids) {
        const { error } = await supabase.from("platform_modules").update({ is_active: enable } as any).eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: (_, enable) => {
      queryClient.invalidateQueries({ queryKey: ["master-modules"] });
      toast({ title: enable ? "All modules enabled" : "All modules disabled" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const categories = [...new Set(modules.map((m: any) => m.category))];
  const allEnabled = modules.length > 0 && modules.every((m: any) => m.is_active !== false);
  const allDisabled = modules.length > 0 && modules.every((m: any) => m.is_active === false);
  const activeCount = modules.filter((m: any) => m.is_active !== false).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Toggle modules on/off platform-wide. Disabled modules won't appear in any subscription plan.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {activeCount} of {modules.length} modules active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={allEnabled || bulkToggleMutation.isPending}
            onClick={() => bulkToggleMutation.mutate(true)}
          >
            <ToggleRight className="w-4 h-4" /> Enable All
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={allDisabled || bulkToggleMutation.isPending}
            onClick={() => bulkToggleMutation.mutate(false)}
          >
            <ToggleLeft className="w-4 h-4" /> Disable All
          </Button>
        </div>
      </div>
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
                        <p className="text-xs text-muted-foreground mt-0.5">{m.description || m.slug}</p>
                      </div>
                    </div>
                    <Switch
                      checked={m.is_active !== false}
                      onCheckedChange={(v) => toggleMutation.mutate({ id: m.id, is_active: v })}
                    />
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface UpgradePromptProps {
  module: string;
  reason: "subscription" | "permission" | "limit";
  resourceName?: string;
}

export const UpgradePrompt = ({ module, reason, resourceName }: UpgradePromptProps) => {
  const navigate = useNavigate();

  const messages = {
    subscription: {
      icon: Crown,
      title: "Upgrade Required",
      description: `The "${module}" module is not included in your current plan. Upgrade to unlock this feature.`,
      action: "View Plans",
      onClick: () => navigate("/subscriptions"),
    },
    permission: {
      icon: Lock,
      title: "Access Restricted",
      description: "You don't have permission to access this feature. Contact your administrator for access.",
      action: "Go to Dashboard",
      onClick: () => navigate("/dashboard"),
    },
    limit: {
      icon: Crown,
      title: "Limit Reached",
      description: `You've reached the maximum number of ${resourceName || "records"} for your plan. Upgrade to add more.`,
      action: "Upgrade Plan",
      onClick: () => navigate("/subscriptions"),
    },
  };

  const msg = messages[reason];
  const Icon = msg.icon;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm max-w-lg mx-auto mt-12">
      <CardContent className="flex flex-col items-center text-center py-12 px-8 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground">{msg.title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
          {msg.description}
        </p>
        <Button onClick={msg.onClick} className="mt-2">
          {msg.action}
        </Button>
      </CardContent>
    </Card>
  );
};

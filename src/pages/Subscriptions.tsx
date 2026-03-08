import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Check, Star } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "For small landlords",
    features: ["Up to 5 units", "Basic reporting", "Email support", "1 user"],
    current: false,
  },
  {
    name: "Professional",
    price: "AED 299/mo",
    description: "For property managers",
    features: ["Up to 50 units", "Full reporting & analytics", "Priority support", "5 users", "Document storage", "Automation rules"],
    current: true,
  },
  {
    name: "Enterprise",
    price: "AED 999/mo",
    description: "For large portfolios",
    features: ["Unlimited units", "AI Insights", "Dedicated support", "Unlimited users", "API access", "Custom branding", "White-label option"],
    current: false,
  },
];

const Subscriptions = () => {
  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="page-header flex items-center gap-2"><BookOpen className="w-6 h-6" /> Subscriptions</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your subscription plan and billing</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={`glass-card relative ${plan.current ? "border-primary ring-1 ring-primary/30" : ""}`}>
              {plan.current && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Current Plan</Badge>
                </div>
              )}
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="text-3xl font-bold mt-2">{plan.price}</div>
                <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={plan.current ? "outline" : "default"} disabled={plan.current}>
                  {plan.current ? "Current Plan" : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Subscriptions;

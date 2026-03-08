import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, Bell, FileText, CreditCard, Mail } from "lucide-react";

const automationRules = [
  { icon: Clock, title: "Lease Expiry Reminder", description: "Auto-send reminder 30 days before lease expires", trigger: "30 days before end_date", status: "active", category: "Leases" },
  { icon: CreditCard, title: "Invoice Auto-Generation", description: "Generate monthly invoices for active leases on the 1st", trigger: "1st of each month", status: "active", category: "Finance" },
  { icon: Bell, title: "Payment Due Reminder", description: "Notify tenants 3 days before payment due date", trigger: "3 days before due_date", status: "active", category: "Finance" },
  { icon: FileText, title: "Visa Expiry Alert", description: "Alert when tenant visa expires within 30 days", trigger: "30 days before visa_expiry", status: "active", category: "Compliance" },
  { icon: Mail, title: "Maintenance Status Update", description: "Notify tenant when maintenance status changes", trigger: "On status change", status: "active", category: "Operations" },
  { icon: Bell, title: "Overdue Invoice Escalation", description: "Escalate to manager if invoice overdue by 7 days", trigger: "7 days after due_date", status: "inactive", category: "Finance" },
];

const Automation = () => {
  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="page-header flex items-center gap-2"><Zap className="w-6 h-6" /> Automation</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure automation rules and workflows</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {automationRules.map((rule, i) => (
            <Card key={i} className="glass-card hover:border-primary/30 transition-colors">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <rule.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{rule.title}</CardTitle>
                    <Badge variant="outline" className="text-[10px] mt-1">{rule.category}</Badge>
                  </div>
                </div>
                <Badge variant={rule.status === "active" ? "default" : "secondary"}>{rule.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">{rule.description}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Trigger: {rule.trigger}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Automation;

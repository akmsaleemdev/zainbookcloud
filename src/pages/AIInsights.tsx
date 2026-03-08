import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Brain, TrendingUp, AlertTriangle, Lightbulb, BarChart3 } from "lucide-react";

const insights = [
  { title: "Rent Optimization", desc: "Units in Marina Tower are 12% below market rate. Consider adjusting pricing.", icon: TrendingUp, type: "opportunity" },
  { title: "Tenant Risk Alert", desc: "3 tenants have overdue payments exceeding 30 days. Review collection strategy.", icon: AlertTriangle, type: "warning" },
  { title: "Occupancy Forecast", desc: "Predicted 5% vacancy increase in Q2. Plan marketing campaigns now.", icon: BarChart3, type: "info" },
  { title: "Maintenance Prediction", desc: "HVAC systems in Building 3 likely need servicing within 2 weeks.", icon: Lightbulb, type: "suggestion" },
];

const AIInsights = () => (
  <AppLayout>
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="page-header flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" /> AI Insights
        </h1>
        <p className="text-sm text-muted-foreground mt-1">AI-powered recommendations and predictions</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((ins, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5 cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                ins.type === "warning" ? "bg-warning/10 text-warning" :
                ins.type === "opportunity" ? "bg-success/10 text-success" :
                "bg-primary/10 text-primary"
              }`}>
                <ins.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{ins.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{ins.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  </AppLayout>
);

export default AIInsights;

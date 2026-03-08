import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Settings as SettingsIcon } from "lucide-react";

const SettingsPage = () => (
  <AppLayout>
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="page-header flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Configure system preferences</p>
      </div>
      <div className="glass-card p-8 text-center">
        <p className="text-muted-foreground">Settings configuration panel coming soon.</p>
      </div>
    </motion.div>
  </AppLayout>
);

export default SettingsPage;

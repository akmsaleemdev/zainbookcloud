import { ReactNode } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter } from "lucide-react";

interface ModulePageProps {
  title: string;
  description: string;
  children?: ReactNode;
  onAdd?: () => void;
  addLabel?: string;
}

export const ModulePage = ({ title, description, children, onAdd, addLabel = "Add New" }: ModulePageProps) => {
  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="space-y-7"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header text-4xl">{title}</h1>
            <p className="text-lg text-muted-foreground mt-2">{description}</p>
          </div>
          {onAdd && (
            <Button onClick={onAdd} className="gap-2 h-12 text-[15px] px-6 btn-premium rounded-xl font-semibold">
              <Plus className="w-5 h-5" /> {addLabel}
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder={`Search ${title.toLowerCase()}...`} className="pl-12 h-12 text-[15px] bg-secondary/50 border-border/40 rounded-xl" />
          </div>
          <Button variant="outline" className="gap-2 h-12 text-[15px] rounded-xl px-5">
            <Filter className="w-5 h-5" /> Filters
          </Button>
        </div>

        {/* Content */}
        {children || (
          <div className="floating-card p-16 text-center">
            <p className="text-lg text-muted-foreground">No data yet. Click "{addLabel}" to get started.</p>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
};

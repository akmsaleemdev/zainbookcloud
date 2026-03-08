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
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          {onAdd && (
            <Button onClick={onAdd} className="gap-2">
              <Plus className="w-4 h-4" /> {addLabel}
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={`Search ${title.toLowerCase()}...`} className="pl-10 bg-secondary/50 border-border/50" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" /> Filters
          </Button>
        </div>

        {/* Content */}
        {children || (
          <div className="glass-card p-12 text-center">
            <p className="text-muted-foreground">No data yet. Click "{addLabel}" to get started.</p>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
};

import { X, Sparkles, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/useAppStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

export const RightDrawer = () => {
    const { isRightDrawerOpen, setRightDrawerOpen, quickCreateType, closeQuickCreate } = useAppStore();

    const handleClose = () => {
        setRightDrawerOpen(false);
        closeQuickCreate();
    };

    return (
        <AnimatePresence>
            {isRightDrawerOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-all duration-300"
                    />

                    <motion.div
                        initial={{ x: "100%", opacity: 0.5 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "100%", opacity: 0.5 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-[400px] border-l border-border bg-card/95 backdrop-blur-xl shadow-2xl z-50 flex flex-col"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                {quickCreateType ? (
                                    <>
                                        <PlusCircle className="w-5 h-5 text-primary" />
                                        Quick Create: {quickCreateType}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 text-primary" />
                                        AI Insights & Actions
                                    </>
                                )}
                            </h2>
                            <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full hover:bg-secondary">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <ScrollArea className="flex-1 p-6">
                            {quickCreateType ? (
                                <div className="space-y-4">
                                    <p className="text-muted-foreground">Form for {quickCreateType} will be injected here.</p>
                                    {/* Form stub */}
                                    <div className="h-32 rounded-xl bg-secondary/50 border border-border/50 flex items-center justify-center">
                                        <span className="text-muted-foreground text-sm">Component Stub</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* AI Insights Stub */}
                                    <div className="glass-card p-5 space-y-3">
                                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-primary" />
                                            Occupancy Forecast
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Based on current trends, we predict a 12% increase in
                                            vacancies next month for premium units. Consider running a
                                            targeted campaign.
                                        </p>
                                        <Button variant="outline" className="w-full mt-2 rounded-xl border-primary/20 hover:bg-primary/10 text-primary">
                                            Generate Campaign
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </ScrollArea>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

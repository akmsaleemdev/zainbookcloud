import { FileText, ChevronRight, BookOpen, Settings, Zap, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Docs() {
    return (
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-100px)] gap-8 max-w-7xl mx-auto px-4 mt-8 pb-16 animate-fade-in">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 shrink-0 space-y-6">
                <div>
                    <h3 className="font-semibold text-foreground mb-3 px-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        Getting Started
                    </h3>
                    <ul className="space-y-1">
                        <li><button className="w-full text-left px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium text-sm">Introduction</button></li>
                        <li><button className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary/50 text-muted-foreground text-sm transition-colors">Quickstart Guide</button></li>
                        <li><button className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary/50 text-muted-foreground text-sm transition-colors">Platform Overview</button></li>
                    </ul>
                </div>

                <div>
                    <h3 className="font-semibold text-foreground mb-3 px-2 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-primary" />
                        Management
                    </h3>
                    <ul className="space-y-1">
                        <li><button className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary/50 text-muted-foreground text-sm transition-colors">Property Setup</button></li>
                        <li><button className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary/50 text-muted-foreground text-sm transition-colors">Tenant Onboarding</button></li>
                        <li><button className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary/50 text-muted-foreground text-sm transition-colors">Lease Lifecycle</button></li>
                    </ul>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 glass-card p-8 md:p-12 rounded-3xl border border-border/50">
                <div className="inline-flex items-center text-sm text-primary mb-6 gap-2">
                    Getting Started <ChevronRight className="w-4 h-4" /> Introduction
                </div>

                <h1 className="text-4xl font-bold text-foreground tracking-tight mb-4">
                    Welcome to ZainBook AI
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed mb-10">
                    The enterprise cloud platform for property, room, and bed-space management in the UAE & GCC.
                </p>

                <div className="prose prose-invert max-w-none">
                    <p className="text-muted-foreground leading-relaxed mb-8">
                        ZainBook AI is a comprehensive SaaS solution designed to streamline the complexities of multi-tenant real estate management. From digital leasing and automated Ejari integration to full HR/Payroll and Accounting compliance, ZainBook provides a single source of truth for your property operations.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
                        <Card className="bg-secondary/20 border-border/50">
                            <CardContent className="p-6">
                                <Shield className="w-8 h-8 text-primary mb-4" />
                                <h3 className="text-lg font-semibold text-foreground mb-2">Secure & Compliant</h3>
                                <p className="text-sm text-muted-foreground">Built with role-based access control and designed to meet local GCC VAT and WPS compliance standards natively.</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-secondary/20 border-border/50">
                            <CardContent className="p-6">
                                <Zap className="w-8 h-8 text-primary mb-4" />
                                <h3 className="text-lg font-semibold text-foreground mb-2">AI-Powered Insights</h3>
                                <p className="text-sm text-muted-foreground">Leverage predictive analytics for occupancy, automated tenant screening, and smart maintenance routing.</p>
                            </CardContent>
                        </Card>
                    </div>

                    <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4 border-b border-border/50 pb-2">
                        Core Modules
                    </h2>
                    <ul className="space-y-3 text-muted-foreground list-disc pl-5">
                        <li><strong className="text-foreground">Property Management:</strong> Buildings, floors, units, and granular bed-space tracking.</li>
                        <li><strong className="text-foreground">Finance & Accounting:</strong> Full double-entry ledger, automated invoicing, and integrated payment gateways.</li>
                        <li><strong className="text-foreground">HR & Payroll:</strong> Employee records, attendance tracking, and WPS standard SIF generation.</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}

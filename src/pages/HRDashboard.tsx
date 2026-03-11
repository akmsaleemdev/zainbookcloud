import { Users, AlertTriangle, Calendar, FileText, ArrowUpRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function HRDashboard() {
    return (
        <div className="space-y-6 animate-fade-in pb-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="page-header">HR & Payroll Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Overview of your workforce and payroll metrics</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="glass-input rounded-xl h-11">
                        <FileText className="w-4 h-4 mr-2" />
                        Download Reports
                    </Button>
                    <Button className="btn-premium rounded-xl h-11 px-6">
                        Run Payroll
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass-card stat-glow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Total Employees</p>
                                <p className="text-3xl font-bold text-foreground">142</p>
                            </div>
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className="text-success flex items-center">
                                <ArrowUpRight className="w-4 h-4 mr-1" />
                                +3%
                            </span>
                            <span className="text-muted-foreground ml-2">from last month</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card stat-glow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Pending Leaves</p>
                                <p className="text-3xl font-bold text-foreground">8</p>
                            </div>
                            <div className="w-12 h-12 bg-warning/10 rounded-2xl flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-warning" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className="text-warning flex items-center font-medium">
                                Requires Approval
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card stat-glow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Upcoming Payroll</p>
                                <p className="text-3xl font-bold text-foreground">AED 452K</p>
                            </div>
                            <div className="w-12 h-12 bg-info/10 rounded-2xl flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-info" />
                            </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
                                <span>Oct 31, 2026</span>
                                <span>80% calculated</span>
                            </div>
                            <Progress value={80} className="h-1.5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card stat-glow gradient-card">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between group">
                            <div>
                                <p className="text-sm font-medium text-primary-foreground/80 mb-1">Expiring Documents</p>
                                <p className="text-3xl font-bold text-primary-foreground group-hover:scale-105 transition-transform origin-left">12</p>
                            </div>
                            <div className="w-12 h-12 bg-black/20 rounded-2xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-primary-foreground/80 leading-relaxed font-medium">
                            Visas & Emirates IDs expiring within next 30 days
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="glass-card lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Headcount Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[300px]">
                        <p className="text-muted-foreground text-sm">Chart Component Placeholder</p>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Recent Hires
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                                            E{i}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">New Employee {i}</p>
                                            <p className="text-xs text-muted-foreground">Software Engineer</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                                        2d ago
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

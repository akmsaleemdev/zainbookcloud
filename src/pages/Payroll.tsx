import { useState } from "react";
import { Download, Search, CheckCircle, Clock, FileText, Settings, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DUMMY_PAYROLL = [
    { id: "PR-2026-10", period: "Oct 2026", employees: 142, total: "AED 958,450", status: "Processed", date: "2026-10-28" },
    { id: "PR-2026-09", period: "Sep 2026", employees: 140, total: "AED 945,210", status: "Paid", date: "2026-09-28" },
    { id: "PR-2026-08", period: "Aug 2026", employees: 138, total: "AED 930,100", status: "Paid", date: "2026-08-28" },
];

export default function Payroll() {
    const [searchQuery, setSearchQuery] = useState("");

    const filtered = DUMMY_PAYROLL.filter(p =>
        p.period.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in pb-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="page-header">Payroll Processing</h1>
                    <p className="text-muted-foreground mt-1">Manage salaries, WPS generation, and payslips</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="glass-input rounded-xl h-11">
                        <Settings className="w-4 h-4 mr-2" />
                        Payroll Settings
                    </Button>
                    <Button className="btn-premium rounded-xl h-11 px-6 shadow-lg shadow-primary/25">
                        <Play className="w-4 h-4 mr-2" />
                        Run Current Payroll
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="glass-card">
                        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row justify-between gap-4 items-center">
                            <h3 className="font-semibold text-foreground text-lg">Payroll History</h3>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search period..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-9 bg-secondary/50 border-border/50 text-sm"
                                />
                            </div>
                        </div>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-secondary/30 text-muted-foreground uppercase font-semibold text-xs border-b border-border/50">
                                        <tr>
                                            <th className="px-6 py-4">Batch ID</th>
                                            <th className="px-6 py-4">Period</th>
                                            <th className="px-6 py-4">Employees</th>
                                            <th className="px-6 py-4">Total Amount</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {filtered.map((batch) => (
                                            <tr key={batch.id} className="hover:bg-secondary/20 transition-colors">
                                                <td className="px-6 py-4 text-muted-foreground font-medium">{batch.id}</td>
                                                <td className="px-6 py-4 text-foreground font-semibold">{batch.period}</td>
                                                <td className="px-6 py-4 text-muted-foreground">{batch.employees}</td>
                                                <td className="px-6 py-4 text-foreground font-semibold">{batch.total}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className={
                                                        batch.status === 'Paid' ? 'border-success/30 text-success bg-success/10' :
                                                            'border-info/30 text-info bg-info/10'
                                                    }>
                                                        {batch.status === 'Paid' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                        {batch.status === 'Processed' && <Clock className="w-3 h-3 mr-1" />}
                                                        {batch.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10">
                                                        <Download className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">WPS/Payslips</span>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="glass-card stat-glow gradient-card border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-primary-foreground/90 font-medium text-sm flex items-center justify-between">
                                <span>Current Cycle</span>
                                <Badge variant="outline" className="text-xs bg-black/20 border-white/10 text-white hover:bg-black/30">
                                    DRAFT
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <h2 className="text-3xl font-bold text-white mb-2">Nov 2026</h2>
                            <div className="space-y-3 mt-6">
                                <div className="flex justify-between text-sm text-white/80 border-b border-white/10 pb-2">
                                    <span>Basic Salary</span>
                                    <span className="font-medium text-white">AED 412,000</span>
                                </div>
                                <div className="flex justify-between text-sm text-white/80 border-b border-white/10 pb-2">
                                    <span>Allowances</span>
                                    <span className="font-medium text-white">AED 515,000</span>
                                </div>
                                <div className="flex justify-between text-sm text-white/80 border-b border-white/10 pb-2">
                                    <span>Deductions</span>
                                    <span className="font-medium text-red-200">- AED 12,450</span>
                                </div>
                                <div className="flex justify-between text-lg text-white font-bold pt-2">
                                    <span>Estimated Total</span>
                                    <span>AED 914,550</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button variant="outline" className="w-full justify-start h-11 border-border/50 hover:bg-secondary/50">
                                <Download className="w-4 h-4 mr-3 text-muted-foreground" />
                                Download WPS Guide (MOHRE)
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-11 border-border/50 hover:bg-secondary/50">
                                <FileText className="w-4 h-4 mr-3 text-muted-foreground" />
                                Generate Sandbox SIF File
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-11 border-border/50 hover:bg-secondary/50">
                                <Settings className="w-4 h-4 mr-3 text-muted-foreground" />
                                Configure Salary Components
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

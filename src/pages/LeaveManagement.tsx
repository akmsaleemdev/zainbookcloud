import { useState } from "react";
import { Search, Filter, Plus, Calendar, CheckSquare, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const DUMMY_LEAVE = [
    { id: "LR-101", employee: "Ahmed Sha", type: "Annual Leave", start: "2026-11-01", end: "2026-11-15", days: 14, status: "Approved" },
    { id: "LR-102", employee: "Sarah Connor", type: "Sick Leave", start: "2026-10-28", end: "2026-10-29", days: 2, status: "Pending" },
    { id: "LR-103", employee: "Miguel O'Hara", type: "Unpaid Leave", start: "2026-12-01", end: "2026-12-05", days: 5, status: "Pending" },
    { id: "LR-104", employee: "Fatima Al Farsi", type: "Annual Leave", start: "2026-09-10", end: "2026-09-24", days: 14, status: "Rejected" },
];

export default function LeaveManagement() {
    const [searchQuery, setSearchQuery] = useState("");

    const filtered = DUMMY_LEAVE.filter(r =>
        r.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in pb-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="page-header">Leave Management</h1>
                    <p className="text-muted-foreground mt-1">Review, approve, and track employee time off</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="glass-input rounded-xl h-11">
                        <Calendar className="w-4 h-4 mr-2" />
                        Leave Calendar
                    </Button>
                    <Button className="btn-premium rounded-xl h-11 px-6">
                        <Plus className="w-4 h-4 mr-2" />
                        Apply Leave
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="glass-card stat-glow border-info/20">
                    <CardContent className="p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">Annual Leave Used (Avg)</p>
                            <Calendar className="w-5 h-5 text-info" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">18 / 30 Days</p>
                            <Progress value={60} className="h-1.5 mt-3 bg-info/20 [&>div]:bg-info" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card stat-glow border-warning/20">
                    <CardContent className="p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                            <Clock className="w-5 h-5 text-warning" />
                        </div>
                        <p className="text-3xl font-bold text-foreground mt-1">12</p>
                    </CardContent>
                </Card>
                <Card className="glass-card stat-glow border-success/20">
                    <CardContent className="p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">Approved This Month</p>
                            <CheckSquare className="w-5 h-5 text-success" />
                        </div>
                        <p className="text-3xl font-bold text-foreground mt-1">45</p>
                    </CardContent>
                </Card>
                <Card className="glass-card stat-glow border-destructive/20">
                    <CardContent className="p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                            <XCircle className="w-5 h-5 text-destructive" />
                        </div>
                        <p className="text-3xl font-bold text-foreground mt-1">3</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="glass-card">
                <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by employee or leave type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-secondary/50 border-border/50 focus:border-primary/50"
                        />
                    </div>
                    <Button variant="outline" className="gap-2">
                        <Filter className="w-4 h-4" />
                        Filters
                    </Button>
                </div>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-secondary/30 text-muted-foreground uppercase font-semibold text-xs border-b border-border/50">
                                <tr>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Leave Type</th>
                                    <th className="px-6 py-4">Duration</th>
                                    <th className="px-6 py-4">Days</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filtered.map((req) => (
                                    <tr key={req.id} className="hover:bg-secondary/20 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">{req.employee}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{req.type}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-xs text-muted-foreground">
                                                <span className="text-foreground text-sm">{req.start} to</span>
                                                <span>{req.end}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-foreground font-medium">{req.days}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={
                                                req.status === 'Approved' ? 'border-success/30 text-success bg-success/10' :
                                                    req.status === 'Pending' ? 'border-warning/30 text-warning bg-warning/10' :
                                                        'border-destructive/30 text-destructive bg-destructive/10'
                                            }>
                                                {req.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {req.status === 'Pending' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-success hover:bg-success/20 hover:text-success">
                                                        <CheckSquare className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/20 hover:text-destructive">
                                                        <XCircle className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Processed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

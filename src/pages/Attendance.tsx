import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Clock, Calendar as CalendarIcon, MapPin, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatTime(iso: string | null): string {
    if (!iso) return "—";
    try {
        const d = new Date(iso);
        return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
        return "—";
    }
}

function formatDate(iso: string): string {
    try {
        const d = new Date(iso);
        const today = new Date();
        if (d.toDateString() === today.toDateString()) return "Today";
        return d.toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" });
    } catch {
        return iso;
    }
}

export default function Attendance() {
    const { currentOrg } = useOrganization();
    const [dateFrom, setDateFrom] = useState(() => new Date().toISOString().slice(0, 10));
    const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

    const { data: logs = [], isLoading } = useQuery({
        queryKey: ["attendance-logs", currentOrg?.id, dateFrom, dateTo],
        queryFn: async () => {
            if (!currentOrg?.id) return [];
            const { data, error } = await supabase
                .from("attendance_logs")
                .select("id, attendance_date, check_in_time, check_out_time, status, is_late, check_in_location, employees(first_name, last_name)")
                .eq("organization_id", currentOrg.id)
                .gte("attendance_date", dateFrom)
                .lte("attendance_date", dateTo)
                .order("attendance_date", { ascending: false })
                .order("check_in_time", { ascending: false });
            if (error) throw error;
            return data || [];
        },
        enabled: !!currentOrg?.id,
    });

    const onTime = logs.filter((l: any) => l.status === "present" && !l.is_late).length;
    const late = logs.filter((l: any) => l.is_late).length;
    const absent = 0;

    const employeeName = (row: any) => {
        const e = row.employees;
        if (!e) return "—";
        return [e.first_name, e.last_name].filter(Boolean).join(" ") || "—";
    };

    const locationStr = (row: any) => {
        const loc = row.check_in_location;
        if (!loc || typeof loc !== "object") return "—";
        if (loc.address) return loc.address;
        if (loc.lat && loc.lng) return `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
        return "—";
    };

    return (
        <AppLayout>
            <div className="space-y-6 animate-fade-in pb-16">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="page-header">Attendance Logs</h1>
                        <p className="text-muted-foreground mt-1">Track employee check-ins and hours</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="h-11 rounded-xl border border-border/50 bg-secondary/50 px-3 text-sm"
                        />
                        <span className="text-muted-foreground">to</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="h-11 rounded-xl border border-border/50 bg-secondary/50 px-3 text-sm"
                        />
                        <Button variant="outline" className="glass-input rounded-xl h-11">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            Date range
                        </Button>
                        <Button className="btn-premium rounded-xl h-11 px-6">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="glass-card stat-glow border-success/20">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">On Time</p>
                                <p className="text-3xl font-bold text-success mt-1">{onTime}</p>
                            </div>
                            <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-success" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass-card stat-glow border-warning/20">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Late Arrivals</p>
                                <p className="text-3xl font-bold text-warning mt-1">{late}</p>
                            </div>
                            <div className="w-12 h-12 bg-warning/10 rounded-2xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-warning" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass-card stat-glow border-destructive/20">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Absent</p>
                                <p className="text-3xl font-bold text-destructive mt-1">{absent}</p>
                            </div>
                            <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-destructive" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="glass-card">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-secondary/30 text-muted-foreground uppercase font-semibold text-xs border-b border-border/50">
                                    <tr>
                                        <th className="px-6 py-4">Employee</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Check In</th>
                                        <th className="px-6 py-4">Check Out</th>
                                        <th className="px-6 py-4">Location</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                                Loading…
                                            </td>
                                        </tr>
                                    ) : logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                                No attendance logs in this date range
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((record: any) => (
                                            <tr key={record.id} className="hover:bg-secondary/20 transition-colors">
                                                <td className="px-6 py-4 font-medium text-foreground">{employeeName(record)}</td>
                                                <td className="px-6 py-4 text-muted-foreground">{formatDate(record.attendance_date)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-foreground">
                                                        <Clock className="w-3.5 h-3.5 text-success" />
                                                        {formatTime(record.check_in_time)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">{formatTime(record.check_out_time)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        {locationStr(record)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className={
                                                        record.status === "present" && !record.is_late
                                                            ? "border-success/30 text-success bg-success/10"
                                                            : record.is_late
                                                                ? "border-warning/30 text-warning bg-warning/10"
                                                                : "border-info/30 text-info bg-info/10"
                                                    }>
                                                        {record.status === "present" ? (record.is_late ? "Late" : "On Time") : record.status || "—"}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

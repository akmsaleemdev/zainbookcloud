import { useState } from "react";
import { Clock, Calendar as CalendarIcon, MapPin, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DUMMY_ATTENDANCE = [
    { id: 1, name: "Ahmed Sha", date: "Today", checkIn: "08:55 AM", checkOut: "--:--", status: "On Time", location: "HQ Office" },
    { id: 2, name: "Sarah Connor", date: "Today", checkIn: "09:15 AM", checkOut: "--:--", status: "Late", location: "HQ Office" },
    { id: 3, name: "Miguel O'Hara", date: "Today", checkIn: "07:30 AM", checkOut: "--:--", status: "Early", location: "Site A" },
];

export default function Attendance() {
    return (
        <div className="space-y-6 animate-fade-in pb-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="page-header">Attendance Logs</h1>
                    <p className="text-muted-foreground mt-1">Track employee check-ins and hours</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="glass-input rounded-xl h-11">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Pick Date Range
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
                            <p className="text-3xl font-bold text-success mt-1">112</p>
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
                            <p className="text-3xl font-bold text-warning mt-1">14</p>
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
                            <p className="text-3xl font-bold text-destructive mt-1">8</p>
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
                                {DUMMY_ATTENDANCE.map((record) => (
                                    <tr key={record.id} className="hover:bg-secondary/20 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">{record.name}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{record.date}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-foreground">
                                                <Clock className="w-3.5 h-3.5 text-success" />
                                                {record.checkIn}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">{record.checkOut}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {record.location}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={
                                                record.status === 'On Time' ? 'border-success/30 text-success bg-success/10' :
                                                    record.status === 'Late' ? 'border-warning/30 text-warning bg-warning/10' :
                                                        'border-info/30 text-info bg-info/10'
                                            }>
                                                {record.status}
                                            </Badge>
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

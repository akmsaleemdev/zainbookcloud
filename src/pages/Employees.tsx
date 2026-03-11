import { useState } from "react";
import { Users, Plus, Search, Filter, MoreVertical, FileText, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const DUMMY_EMPLOYEES = [
    { id: "EMP-001", name: "Ahmed Sha", role: "Property Manager", department: "Operations", status: "Active", joinDate: "2023-01-15" },
    { id: "EMP-002", name: "Sarah Connor", role: "Accountant", department: "Finance", status: "Active", joinDate: "2023-03-22" },
    { id: "EMP-003", name: "Miguel O'Hara", role: "Maintenance Tech", department: "Facilities", status: "On Leave", joinDate: "2024-05-10" },
    { id: "EMP-004", name: "Fatima Al Farsi", role: "HR Manager", department: "HR", status: "Active", joinDate: "2022-11-01" },
];

export default function Employees() {
    const [searchQuery, setSearchQuery] = useState("");

    const filtered = DUMMY_EMPLOYEES.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in pb-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="page-header">Employees</h1>
                    <p className="text-muted-foreground mt-1">Manage personnel, roles, and documents</p>
                </div>
                <div className="flex gap-3">
                    <Button className="btn-premium rounded-xl h-11 px-6">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Employee
                    </Button>
                </div>
            </div>

            <Card className="glass-card">
                <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search employees..."
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
                    <Table>
                        <TableHeader className="bg-secondary/30">
                            <TableRow className="hover:bg-transparent border-border/50">
                                <TableHead className="font-semibold text-foreground">Employee</TableHead>
                                <TableHead className="font-semibold text-foreground hidden md:table-cell">ID</TableHead>
                                <TableHead className="font-semibold text-foreground">Role</TableHead>
                                <TableHead className="font-semibold text-foreground hidden sm:table-cell">Department</TableHead>
                                <TableHead className="font-semibold text-foreground text-center">Status</TableHead>
                                <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((emp) => (
                                <TableRow key={emp.id} className="hover:bg-secondary/20 border-border/50">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                                                {emp.name.split(" ").map(n => n[0]).join("")}
                                            </div>
                                            {emp.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground hidden md:table-cell">{emp.id}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Briefcase className="w-3.5 h-3.5" />
                                            {emp.role}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell text-muted-foreground">{emp.department}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={emp.status === 'Active' ? 'default' : 'secondary'} className={emp.status === 'Active' ? 'bg-success/20 text-success hover:bg-success/30' : 'bg-warning/20 text-warning hover:bg-warning/30'}>
                                            {emp.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-secondary">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-xl border-border/50">
                                                <DropdownMenuItem className="cursor-pointer gap-2">
                                                    <Users className="w-4 h-4 text-muted-foreground" />
                                                    View Profile
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer gap-2">
                                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                                    Documents
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        No employees found matching your search.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

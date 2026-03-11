import { useState } from "react";
import { Home, FileText, CreditCard, MessageSquare, Wrench, AlertCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CustomerDashboard() {
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [requestOpen, setRequestOpen] = useState(false);

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Payment processed successfully!");
        setPaymentOpen(false);
    };

    const handleRequest = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Maintenance request submitted!");
        setRequestOpen(false);
    };
    return (
        <div className="space-y-6 animate-fade-in pb-16 max-w-5xl mx-auto mt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Welcome back, Ahmed
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage your tenancy, payments, and requests</p>
                </div>
                <div className="flex gap-3">
                    <Button className="btn-premium rounded-xl h-11 px-6 shadow-lg shadow-primary/25" onClick={() => setPaymentOpen(true)}>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Make a Payment
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Alerts & Info */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="glass-card stat-glow border-destructive/20 gradient-card overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-6 h-6 text-white shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Payment Due</h3>
                                    <p className="text-white/80 text-sm mt-1 leading-relaxed">
                                        Rent payment of AED 4,500 is due on Oct 1st for Unit 402.
                                    </p>
                                    <Button variant="secondary" size="sm" className="mt-4 w-full bg-white text-black hover:bg-white/90" onClick={() => setPaymentOpen(true)}>
                                        Pay Now
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader className="pb-3 border-b border-border/50">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Home className="w-4 h-4 text-primary" />
                                My Tenancy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Property</p>
                                <p className="font-medium">Marina Heights Tower, Unit 402</p>
                            </div>
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Contract Start</p>
                                    <p className="font-medium text-sm">Jan 1, 2026</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Contract End</p>
                                    <p className="font-medium text-sm">Dec 31, 2026</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Ejari Number</p>
                                <p className="font-medium font-mono text-sm">EJ-2026-987654</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Activity & Actions */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="glass-card">
                        <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-primary" />
                                Recent Requests
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="text-primary h-8 px-2" onClick={() => setRequestOpen(true)}>New Request</Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/50">
                                {[
                                    { id: "REQ-101", title: "AC Maintenance", date: "Sep 15", status: "Resolved", color: "success" },
                                    { id: "REQ-102", title: "Plumbing Issue", date: "Sep 22", status: "In Progress", color: "warning" },
                                ].map((req) => (
                                    <div key={req.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full bg-${req.color}/10 flex items-center justify-center`}>
                                                <Wrench className={`w-4 h-4 text-${req.color}`} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{req.title}</p>
                                                <p className="text-xs text-muted-foreground">{req.id} • {req.date}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={`border-${req.color}/30 text-${req.color} bg-${req.color}/10`}>
                                            {req.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader className="pb-3 border-b border-border/50">
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Latest Documents & Invoices
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/50">
                                {[
                                    { id: "INV-2026-09", title: "Monthly Rent Invoice - September", type: "Invoice", date: "Sep 1" },
                                    { id: "DOC-2026-01", title: "Tenancy Contract", type: "Contract", date: "Jan 1" },
                                ].map((doc) => (
                                    <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                                                <FileText className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{doc.title}</p>
                                                <p className="text-xs text-muted-foreground">{doc.type} • {doc.date}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm">Download</Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Payment Modal */}
            <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                <DialogContent className="bg-card glass-card border-border sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Make a Payment</DialogTitle>
                        <DialogDescription>Pay your outstanding rent or maintainence charges securely.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePayment} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Amount Due (AED)</Label>
                            <Input value="4500.00" disabled className="bg-secondary/50 font-mono text-lg font-bold text-primary" />
                        </div>
                        <div className="space-y-2">
                            <Label>Card Number</Label>
                            <Input placeholder="0000 0000 0000 0000" required className="bg-secondary/50 font-mono" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Expiry (MM/YY)</Label>
                                <Input placeholder="12/26" required className="bg-secondary/50" />
                            </div>
                            <div className="space-y-2">
                                <Label>CVC</Label>
                                <Input type="password" placeholder="***" required className="bg-secondary/50" />
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
                            <Button type="submit" className="btn-premium">Process Payment</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Maintenance Request Modal */}
            <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
                <DialogContent className="bg-card glass-card border-border sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>New Maintenance Request</DialogTitle>
                        <DialogDescription>Submit a new issue to our property operations team.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRequest} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Category *</Label>
                            <Select required>
                                <SelectTrigger className="bg-secondary/50">
                                    <SelectValue placeholder="Select issue type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="plumbing">Plumbing</SelectItem>
                                    <SelectItem value="electrical">Electrical</SelectItem>
                                    <SelectItem value="ac">Air Conditioning (HVAC)</SelectItem>
                                    <SelectItem value="appliances">Appliances</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input placeholder="Briefly describe the issue" required className="bg-secondary/50" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description *</Label>
                            <Textarea placeholder="Please provide exact details to help our technicians..." required rows={4} className="bg-secondary/50 resize-none" />
                        </div>
                        <div className="space-y-2">
                            <Label>Preferred Access Time</Label>
                            <Select>
                                <SelectTrigger className="bg-secondary/50">
                                    <SelectValue placeholder="When should we visit?" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="anytime">Anytime (I grant permission to enter)</SelectItem>
                                    <SelectItem value="morning">Morning (8AM - 12PM)</SelectItem>
                                    <SelectItem value="afternoon">Afternoon (12PM - 4PM)</SelectItem>
                                    <SelectItem value="call_first">Please call first</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-primary hover:bg-primary/90">Submit Request</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}

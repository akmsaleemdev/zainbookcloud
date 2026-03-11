import { useState } from "react";
import { DollarSign, FileText, ArrowUpRight, ArrowDownRight, Activity, Percent, BookOpen, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Accounting() {
    return (
        <div className="space-y-6 animate-fade-in pb-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="page-header">Accounting & VAT</h1>
                    <p className="text-muted-foreground mt-1">Manage finances, chart of accounts, and local tax compliance</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="glass-input rounded-xl h-11">
                        <Download className="w-4 h-4 mr-2" />
                        Export TB
                    </Button>
                    <Button className="btn-premium rounded-xl h-11 px-6">
                        <BookOpen className="w-4 h-4 mr-2" />
                        New Journal Entry
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass-card stat-glow border-success/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                                <p className="text-2xl font-bold text-foreground">AED 1.2M</p>
                            </div>
                            <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center">
                                <ArrowUpRight className="w-6 h-6 text-success" />
                            </div>
                        </div>
                        <p className="mt-4 text-xs font-medium text-success">YTD Collected</p>
                    </CardContent>
                </Card>

                <Card className="glass-card stat-glow border-destructive/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Total Expenses</p>
                                <p className="text-2xl font-bold text-foreground">AED 450K</p>
                            </div>
                            <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center">
                                <ArrowDownRight className="w-6 h-6 text-destructive" />
                            </div>
                        </div>
                        <p className="mt-4 text-xs font-medium text-destructive">YTD Incurred</p>
                    </CardContent>
                </Card>

                <Card className="glass-card stat-glow border-info/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Net Profit</p>
                                <p className="text-2xl font-bold text-foreground">AED 750K</p>
                            </div>
                            <div className="w-12 h-12 bg-info/10 rounded-2xl flex items-center justify-center">
                                <Activity className="w-6 h-6 text-info" />
                            </div>
                        </div>
                        <p className="mt-4 text-xs font-medium text-info">Margin: 62.5%</p>
                    </CardContent>
                </Card>

                <Card className="glass-card stat-glow gradient-card">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white/80 mb-1">VAT Payable (5%)</p>
                                <p className="text-2xl font-bold text-white">AED 37,500</p>
                            </div>
                            <div className="w-12 h-12 bg-black/20 rounded-2xl flex items-center justify-center">
                                <Percent className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <p className="mt-4 text-xs font-medium text-white/80">Current Period (Q4)</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="coa" className="w-full">
                <TabsList className="bg-secondary/50 border border-border/50 p-1 rounded-xl h-12">
                    <TabsTrigger value="coa" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg h-9 px-6 font-medium">Chart of Accounts</TabsTrigger>
                    <TabsTrigger value="journals" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg h-9 px-6 font-medium">Journals</TabsTrigger>
                    <TabsTrigger value="vat" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg h-9 px-6 font-medium">VAT (FTA)</TabsTrigger>
                </TabsList>

                <TabsContent value="coa" className="mt-6">
                    <Card className="glass-card">
                        <CardHeader className="border-b border-border/50 pb-4">
                            <CardTitle className="text-lg">Accounts List</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-12 text-center flex flex-col items-center justify-center border-b border-border/50">
                                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">No accounts configured yet</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                    Set up your chart of accounts or import a standard real estate template to get started with full double-entry accounting.
                                </p>
                                <div className="flex gap-4">
                                    <Button variant="outline" className="border-border">Import Template</Button>
                                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Add First Account</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="journals" className="mt-6">
                    <Card className="glass-card">
                        <CardContent className="p-12 text-center">
                            <p className="text-muted-foreground">General Journal entries will appear here.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="vat" className="mt-6">
                    <Card className="glass-card">
                        <CardContent className="p-12 text-center text-muted-foreground">
                            <Percent className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>FTA VAT 201 Reports module.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

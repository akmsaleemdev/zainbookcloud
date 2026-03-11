import { useState } from "react";
import { Receipt, Download, FileText, Filter, CheckCircle2, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrganization } from "@/contexts/OrganizationContext";

interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
  vatRate: number; // usually 5% in UAE
}

export const InvoiceTemplate = ({ invoiceId, onClose }: { invoiceId?: string, onClose?: () => void }) => {
  const { currentOrg } = useOrganization();
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "Monthly Rent - Unit 402", qty: 1, rate: 4500, vatRate: 5 },
    { id: "2", description: "Maintenance Service Charge", qty: 1, rate: 150, vatRate: 5 },
  ]);

  const [tenantName, setTenantName] = useState("Ahmed Sha");
  const [trnNumber, setTrnNumber] = useState("TRN-1234567890123");
  const [issueDate, setIssueDate] = useState("2026-10-01");
  const [dueDate, setDueDate] = useState("2026-10-05");

  const calculateSubtotal = () => items.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const calculateVat = () => items.reduce((acc, item) => acc + (item.qty * item.rate * (item.vatRate / 100)), 0);
  const calculateTotal = () => calculateSubtotal() + calculateVat();

  return (
    <Card className="glass-card shadow-2xl border-primary/20 w-full max-w-5xl mx-auto flex flex-col max-h-[90vh]">
      <CardHeader className="bg-secondary/30 border-b border-border/50 px-6 py-4 flex flex-row items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Tax Invoice (FTA Compliant)</CardTitle>
            <p className="text-sm text-muted-foreground">{invoiceId || 'INV-2026-001'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          )}
          <Button variant="outline" size="sm" className="border-border/50">
            <Filter className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button size="sm" className="btn-premium">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-y-auto bg-white/5">
        <div className="p-8 md:p-12 max-w-4xl mx-auto bg-white dark:bg-[#0f1522] shadow-2xl my-8 rounded-xl border border-border/50">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-12 border-b border-border/50 pb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">TAX INVOICE</h1>
              <p className="text-muted-foreground font-mono text-sm">#{invoiceId || 'INV-2026-001'}</p>
              
              <div className="mt-8 space-y-1">
                <p className="text-sm font-semibold text-foreground">Billed To:</p>
                <p className="text-sm text-muted-foreground">{tenantName}</p>
                <p className="text-sm text-muted-foreground">Unit 402, Marina Heights</p>
                <p className="text-sm text-muted-foreground">Dubai, UAE</p>
                {trnNumber && <p className="text-xs text-muted-foreground mt-2">TRN: <span className="font-mono">{trnNumber}</span></p>}
              </div>
            </div>

            <div className="text-right">
              <div className="w-12 h-12 bg-primary/10 rounded-xl ml-auto mb-4 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{currentOrg?.name || 'ZainBook Properties LLC'}</h2>
              <p className="text-sm text-muted-foreground mt-1">123 Business Bay Road</p>
              <p className="text-sm text-muted-foreground">Dubai, UAE</p>
              <p className="text-xs text-muted-foreground mt-2 font-mono">TRN: 100234567890123</p>
              
              <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <span className="text-muted-foreground">Issue Date:</span>
                <span className="font-medium text-foreground">{issueDate}</span>
                <span className="text-muted-foreground">Due Date:</span>
                <span className="font-medium text-foreground">{dueDate}</span>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-12 border border-border/50 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-secondary/30">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="w-[50%]">Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Rate (AED)</TableHead>
                  <TableHead className="text-right">VAT (%)</TableHead>
                  <TableHead className="text-right font-semibold">Amount (AED)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="border-border/50 hover:bg-secondary/10">
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{item.qty}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{item.rate.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{item.vatRate}%</TableCell>
                    <TableCell className="text-right font-medium text-foreground">
                      {((item.qty * item.rate) + (item.qty * item.rate * (item.vatRate / 100))).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="flex justify-between items-end">
            <div className="text-sm text-muted-foreground max-w-sm">
              <p className="font-semibold text-foreground mb-1">Notes:</p>
              <p>Please ensure payment is made by the due date. Late payments may incur a 5% penalty fee.</p>
              <p className="mt-4 text-xs">All amounts are in UAE Dirhams (AED).</p>
            </div>
            
            <div className="w-72 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal (Excl. VAT)</span>
                <span className="font-medium text-foreground">{calculateSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-border/50 pb-3">
                <span className="text-muted-foreground">VAT Amount (5%)</span>
                <span className="font-medium text-foreground">{calculateVat().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-base font-bold text-foreground">Total Due</span>
                <span className="text-xl font-bold text-primary">AED {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-16 text-center border-t border-border/50 pt-8">
            <p className="text-xs text-muted-foreground">This is a computer-generated document. No signature is required.</p>
            <p className="text-xs text-muted-foreground mt-1">Thank you for your business!</p>
          </div>

        </div>
      </CardContent>
    </Card>
  );
};

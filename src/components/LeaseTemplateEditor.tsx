import { useState } from "react";
import { PenTool, FileSignature, Save, X, PlusCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const MERGE_TAGS = [
  "{{tenant_name}}", "{{tenant_id}}", "{{unit_number}}", "{{building_name}}", 
  "{{start_date}}", "{{end_date}}", "{{monthly_rent}}", "{{security_deposit}}"
];

export const LeaseTemplateEditor = ({ leaseId, onClose }: { leaseId: string, onClose: () => void }) => {
  const [content, setContent] = useState(
    "TENANCY CONTRACT\n\nThis agreement is made on {{start_date}} between ZainBook Properties and {{tenant_name}} for the leasing of Unit {{unit_number}} in {{building_name}}.\n\n" +
    "1. TERM: The lease shall begin on {{start_date}} and end on {{end_date}}.\n" +
    "2. RENT: The Tenant agrees to pay AED {{monthly_rent}} per month.\n" +
    "3. DEPOSIT: A security deposit of AED {{security_deposit}} is required.\n\n" +
    "-----------------------------------\n" +
    "Landlord Signature: ZainBook Prov.\n" +
    "-----------------------------------\n\n"
  );
  
  const [signature, setSignature] = useState<string | null>(null);

  const insertTag = (tag: string) => {
    setContent(prev => prev + " " + tag);
  };

  return (
    <Card className="glass-card shadow-2xl border-primary/20 w-full max-w-4xl mx-auto flex flex-col h-[80vh]">
      <CardHeader className="bg-secondary/30 border-b border-border/50 px-6 py-4 flex flex-row items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <FileSignature className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Lease Agreement Generator</CardTitle>
            <p className="text-sm text-muted-foreground">Editing Template for {leaseId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="border-border/50">
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground">
            <Save className="w-4 h-4 mr-2" />
            Save & Publish
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Editor Area */}
        <div className="flex-1 p-6 flex flex-col gap-4 border-r border-border/50 overflow-y-auto">
          <div className="flex justify-between items-center">
            <Label className="text-foreground/80 font-semibold">Document Content</Label>
          </div>
          <Textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 bg-secondary/20 border-border/50 resize-none font-mono text-sm leading-relaxed p-4 focus-visible:ring-primary/30 min-h-[300px]"
            placeholder="Type your contract terms here..."
          />
          
          <div className="glass-card p-4 flex flex-col gap-3 rounded-xl border-dashed">
            <Label className="text-foreground/80 flex items-center gap-2">
              <PenTool className="w-4 h-4 text-primary" />
              Tenant Digital Signature
            </Label>
            {signature ? (
              <div className="h-24 bg-success/10 border border-success/30 rounded-xl flex items-center justify-center">
                <span className="font-['Noto_Naskh_Arabic'] text-2xl text-success italic tracking-widest">{signature}</span>
              </div>
            ) : (
              <div className="h-24 bg-secondary/50 border border-border/50 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-secondary transition-colors" onClick={() => setSignature("Ahmed Sha")}>
                <p className="text-sm text-muted-foreground">Click to simulate tenant signing</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Data Area */}
        <div className="w-full md:w-64 bg-secondary/10 p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-primary" />
              Merge Variables
            </h4>
            <p className="text-xs text-muted-foreground mb-4">
              Click a tag to insert it into the contract. These will be auto-filled upon generation.
            </p>
            <div className="flex flex-wrap gap-2">
              {MERGE_TAGS.map(tag => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="bg-background border-border/50 hover:border-primary/50 hover:bg-primary/10 cursor-pointer text-xs font-mono py-1 transition-colors"
                  onClick={() => insertTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <h4 className="text-sm font-semibold text-foreground mb-3">Preview Data</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-border/50 pb-1">
                <span className="text-muted-foreground">Tenant Name</span>
                <span className="font-medium">Ahmed Sha</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-1">
                <span className="text-muted-foreground">Monthly Rent</span>
                <span className="font-medium">AED 4,500</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-1">
                <span className="text-muted-foreground">Start Date</span>
                <span className="font-medium">2026-11-01</span>
              </div>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

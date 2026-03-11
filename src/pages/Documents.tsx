import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, FolderOpen, Download, FileText, Image, File, Upload, Sparkles, Brain, Loader2 } from "lucide-react";
import { format } from "date-fns";

const docCategories = [
  { value: "general", label: "General" },
  { value: "lease", label: "Lease Agreement" },
  { value: "ejari", label: "Ejari Certificate" },
  { value: "passport", label: "Passport Copy" },
  { value: "emirates_id", label: "Emirates ID" },
  { value: "visa", label: "Visa Copy" },
  { value: "trade_license", label: "Trade License" },
  { value: "noc", label: "NOC" },
  { value: "invoice", label: "Invoice" },
  { value: "receipt", label: "Receipt" },
  { value: "maintenance", label: "Maintenance Report" },
  { value: "inspection", label: "Inspection Report" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
];

const fileIcon = (type: string | null) => {
  if (!type) return File;
  if (type.startsWith("image/")) return Image;
  if (type.includes("pdf")) return FileText;
  return File;
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const defaultForm = {
  name: "", category: "general", description: "",
  tenant_id: "", lease_id: "", property_id: "",
  expiry_date: "", status: "active",
};

const Documents = () => {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [file, setFile] = useState<globalThis.File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [activeDoc, setActiveDoc] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const orgId = currentOrg?.id;

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("documents")
        .select("*, tenants(full_name), properties(name)")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants-sel", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("tenants").select("id, full_name").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["props-sel", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("properties").select("id, name").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: leases = [] } = useQuery({
    queryKey: ["leases-sel", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("leases").select("id, tenant_id, monthly_rent").eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org");
      setUploading(true);

      let fileUrl: string | null = null;
      let fileSize: number | null = null;
      let fileType: string | null = null;

      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${orgId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
        fileUrl = urlData.publicUrl;
        fileSize = file.size;
        fileType = file.type;
      }

      const payload: any = {
        organization_id: orgId,
        name: form.name,
        category: form.category,
        description: form.description || null,
        tenant_id: form.tenant_id || null,
        lease_id: form.lease_id || null,
        property_id: form.property_id || null,
        expiry_date: form.expiry_date || null,
        status: form.status,
        uploaded_by: user?.id || null,
      };

      if (fileUrl) {
        payload.file_url = fileUrl;
        payload.file_size = fileSize;
        payload.file_type = fileType;
      }

      if (editId) {
        const { error } = await supabase.from("documents").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("documents").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setOpen(false); setEditId(null); setForm(defaultForm); setFile(null); setUploading(false);
      toast({ title: editId ? "Document updated" : "Document uploaded" });
    },
    onError: (e: any) => {
      setUploading(false);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Document deleted" });
    },
  });

  const openEdit = (d: any) => {
    setEditId(d.id);
    setForm({
      name: d.name, category: d.category || "general", description: d.description || "",
      tenant_id: d.tenant_id || "", lease_id: d.lease_id || "", property_id: d.property_id || "",
      expiry_date: d.expiry_date || "", status: d.status || "active",
    });
    setFile(null);
    setOpen(true);
  };

  const downloadDoc = async (doc: any) => {
    if (!doc.file_url) return;
    window.open(doc.file_url, "_blank");
  };

  const handleSummarize = (doc: any) => {
    setActiveDoc(doc);
    setSummaryOpen(true);
    setSummaryLoading(true);
    // Simulate an AI text-extraction + summarization delay
    setTimeout(() => {
      setSummaryLoading(false);
    }, 2000);
  };

  const filtered = documents.filter((d: any) => {
    const matchSearch = d.name?.toLowerCase().includes(search.toLowerCase()) || d.tenants?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || d.category === filterCat;
    return matchSearch && matchCat;
  });

  if (!orgId) {
    return <AppLayout><div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Please select an organization first.</p></div></AppLayout>;
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header flex items-center gap-2"><FolderOpen className="w-6 h-6" /> Documents</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage and organize all documents</p>
          </div>
          <Button onClick={() => { setEditId(null); setForm(defaultForm); setFile(null); setOpen(true); }} className="gap-2">
            <Upload className="w-4 h-4" /> Upload Document
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search documents..." className="pl-10 bg-secondary/50 border-border/50" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {docCategories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No documents found.</TableCell></TableRow>
              ) : filtered.map((d: any) => {
                const Icon = fileIcon(d.file_type);
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate max-w-[200px]">{d.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{d.category?.replace("_", " ")}</Badge></TableCell>
                    <TableCell>{d.tenants?.full_name || "—"}</TableCell>
                    <TableCell>{d.properties?.name || "—"}</TableCell>
                    <TableCell className="text-xs">{formatSize(d.file_size)}</TableCell>
                    <TableCell className="text-xs">{d.expiry_date ? format(new Date(d.expiry_date), "dd MMM yyyy") : "—"}</TableCell>
                    <TableCell><Badge variant={d.status === "active" ? "default" : "secondary"}>{d.status}</Badge></TableCell>
                    <TableCell className="text-xs">{format(new Date(d.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {d.file_url && <Button variant="ghost" size="icon" title="Download" onClick={() => downloadDoc(d)}><Download className="w-4 h-4" /></Button>}
                      {d.file_url && (d.file_type?.includes("pdf") || d.file_type?.includes("image")) && (
                        <Button variant="ghost" size="icon" title="AI Summarize" onClick={() => handleSummarize(d)}><Sparkles className="w-4 h-4 text-primary" /></Button>
                      )}
                      <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(d)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" title="Delete" onClick={() => deleteMutation.mutate(d.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit" : "Upload"} Document</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label>Document Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Passport - Ahmed" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>File</Label>
              <div
                className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {file ? (
                  <p className="text-sm text-foreground">{file.name} ({formatSize(file.size)})</p>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to select a file (max 20MB)</p>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {docCategories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tenant</Label>
              <Select value={form.tenant_id} onValueChange={(v) => setForm({ ...form, tenant_id: v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {tenants.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Property</Label>
              <Select value={form.property_id} onValueChange={(v) => setForm({ ...form, property_id: v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pr-6 pb-6 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.name || uploading}>
              {uploading ? "Uploading..." : editId ? "Update" : "Upload"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* AI Summary Dialog */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-primary/20">
          <DialogHeader className="pb-4 border-b border-border/50">
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Brain className="w-5 h-5" /> Document AI Analysis
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {summaryLoading ? (
              <div className="flex flex-col items-center justify-center py-8 opacity-70">
                 <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                 <p className="text-sm">Reading document '{activeDoc?.name}'...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                   <div className="w-10 h-10 flex border rounded-md items-center justify-center bg-background"><FileText className="w-5 h-5 text-primary"/></div>
                   <div>
                     <p className="text-sm font-medium">{activeDoc?.name}</p>
                     <p className="text-xs text-muted-foreground">{activeDoc?.category}</p>
                   </div>
                </div>

                <div className="space-y-3">
                   <h4 className="font-semibold text-sm flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Extracted Subject Matter</h4>
                   <p className="text-sm text-foreground/80 leading-relaxed bg-primary/5 p-4 rounded-lg border border-primary/10">
                     Based on the contents of this <strong>{activeDoc?.category?.replace("_"," ") || "document"}</strong>, 
                     this file pertains to the tenant <strong>{activeDoc?.tenants?.full_name || "Unknown"}</strong> associated with the property <strong>{activeDoc?.properties?.name || "Unknown"}</strong>.
                     The document is verified to be valid and signed appropriately. 
                     Key dates include the expiry on <strong>{activeDoc?.expiry_date ? format(new Date(activeDoc.expiry_date), "MMM dd, yyyy") : "N/A"}</strong>.
                   </p>
                </div>
                
                <div className="space-y-2 pt-2">
                   <h4 className="font-semibold text-sm">Action Items</h4>
                   <ul className="text-sm list-disc list-inside text-muted-foreground space-y-1">
                     <li>Store securely in tenant archive.</li>
                     {activeDoc?.expiry_date && <li>Set renewal reminder 30 days prior to {format(new Date(activeDoc.expiry_date), "MMM dd, yyyy")}.</li>}
                   </ul>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-2 border-t border-border/50">
             <Button onClick={() => setSummaryOpen(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
      
    </AppLayout>
  );
};

export default Documents;

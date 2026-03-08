import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export interface PlanFormData {
  name: string;
  description: string;
  plan_type: string;
  price: number;
  max_users: number;
  max_units: number;
  max_properties: number;
  max_tenants: number;
  max_storage_gb: number;
  max_api_calls: number;
  ai_usage_limit: number;
  report_access: boolean;
  ai_features_access: boolean;
}

export const defaultPlanForm: PlanFormData = {
  name: "", description: "", plan_type: "monthly", price: 0,
  max_users: 5, max_units: 25, max_properties: 10, max_tenants: 50,
  max_storage_gb: 5, max_api_calls: 2000, ai_usage_limit: 200,
  report_access: true, ai_features_access: true,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: PlanFormData;
  setForm: (form: PlanFormData) => void;
  isEdit: boolean;
  onSave: () => void;
  isSaving?: boolean;
}

export const PlanDialog = ({ open, onOpenChange, form, setForm, isEdit, onSave, isSaving }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{isEdit ? "Edit Plan" : "Create Plan"}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-4 py-4">
        <div className="col-span-2 space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="col-span-2 space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={form.plan_type} onValueChange={(v) => setForm({ ...form, plan_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["trial", "monthly", "quarterly", "half_yearly", "yearly"].map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Price (AED)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></div>

        <div className="col-span-2 border-t border-border/30 pt-3 mt-1">
          <p className="text-sm font-medium mb-3">Limits & Controls</p>
        </div>
        <div className="space-y-2"><Label>Max Users</Label><Input type="number" value={form.max_users} onChange={(e) => setForm({ ...form, max_users: +e.target.value })} /></div>
        <div className="space-y-2"><Label>Max Units</Label><Input type="number" value={form.max_units} onChange={(e) => setForm({ ...form, max_units: +e.target.value })} /></div>
        <div className="space-y-2"><Label>Max Properties</Label><Input type="number" value={form.max_properties} onChange={(e) => setForm({ ...form, max_properties: +e.target.value })} /></div>
        <div className="space-y-2"><Label>Max Tenants</Label><Input type="number" value={form.max_tenants} onChange={(e) => setForm({ ...form, max_tenants: +e.target.value })} /></div>
        <div className="space-y-2"><Label>Storage (GB)</Label><Input type="number" value={form.max_storage_gb} onChange={(e) => setForm({ ...form, max_storage_gb: +e.target.value })} /></div>
        <div className="space-y-2"><Label>API Calls</Label><Input type="number" value={form.max_api_calls} onChange={(e) => setForm({ ...form, max_api_calls: +e.target.value })} /></div>
        <div className="space-y-2"><Label>AI Usage Limit</Label><Input type="number" value={form.ai_usage_limit} onChange={(e) => setForm({ ...form, ai_usage_limit: +e.target.value })} /></div>

        <div className="col-span-2 border-t border-border/30 pt-3 mt-1">
          <p className="text-sm font-medium mb-3">Feature Access</p>
        </div>
        <div className="flex items-center justify-between col-span-2">
          <Label>Report Generation Access</Label>
          <Switch checked={form.report_access} onCheckedChange={(v) => setForm({ ...form, report_access: v })} />
        </div>
        <div className="flex items-center justify-between col-span-2">
          <Label>AI Features Access</Label>
          <Switch checked={form.ai_features_access} onCheckedChange={(v) => setForm({ ...form, ai_features_access: v })} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={onSave} disabled={!form.name || isSaving}>{isEdit ? "Update" : "Create"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

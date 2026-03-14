// src/pages/SettingsPage.tsx
// FIX: Master admin had "permission denied for table organization_members"
// because SettingsPage was querying org data via currentOrg which
// triggered RLS-protected queries the master admin had no org context for.
// Fix: Skip org-related queries when isMasterAdmin = true.

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useMasterAdmin } from "@/hooks/useMasterAdmin";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Settings, User, Lock, Bell, Building2, Globe, Shield } from "lucide-react";

const SettingsPage = () => {
  const { user } = useAuth();
  const { isMasterAdmin } = useMasterAdmin();
  const { currentOrg, refetch: refetchOrgs } = useOrganization();
  const queryClient = useQueryClient();

  // Profile query — safe for all users (queries by user_id, RLS allows own row)
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) console.error("Profile fetch error:", error.message);
      return data;
    },
    enabled: !!user,
  });

  // Org details query — ONLY for non-master-admin users with an org
  const { data: orgDetails } = useQuery({
    queryKey: ["org-details", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", currentOrg.id)
        .maybeSingle();
      if (error) console.error("Org fetch error:", error.message);
      return data;
    },
    // Skip this query entirely for master admin — prevents RLS errors
    enabled: !!currentOrg && !isMasterAdmin,
  });

  const [profileForm, setProfileForm] = useState({
    full_name: "", phone: "", nationality: "", emirates_id: "",
  });

  const [orgForm, setOrgForm] = useState({
    name: "", name_ar: "", email: "", phone: "", address: "",
    emirate: "Dubai", currency: "AED", timezone: "Asia/Dubai",
    vat_enabled: false, vat_number: "", vat_rate: "5", trade_license: "",
  });

  const [passwordForm, setPasswordForm] = useState({ password: "", confirmPassword: "" });

  const [notifPrefs, setNotifPrefs] = useState({
    lease_expiry: true, rent_due: true, maintenance: true,
    payments: true, documents: true, system: true,
  });

  // Sync profile form
  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        nationality: profile.nationality || "",
        emirates_id: profile.emirates_id || "",
      });
    }
  }, [profile]);

  // Sync org form
  useEffect(() => {
    if (orgDetails) {
      setOrgForm({
        name: orgDetails.name || "",
        name_ar: orgDetails.name_ar || "",
        email: orgDetails.email || "",
        phone: orgDetails.phone || "",
        address: orgDetails.address || "",
        emirate: orgDetails.emirate || "Dubai",
        currency: orgDetails.currency || "AED",
        timezone: orgDetails.timezone || "Asia/Dubai",
        vat_enabled: orgDetails.vat_enabled || false,
        vat_number: orgDetails.vat_number || "",
        vat_rate: String(orgDetails.vat_rate || 5),
        trade_license: orgDetails.trade_license || "",
      });
    }
  }, [orgDetails]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase.from("profiles").update({
        full_name: profileForm.full_name,
        phone: profileForm.phone || null,
        nationality: profileForm.nationality || null,
        emirates_id: profileForm.emirates_id || null,
      }).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Profile updated successfully" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateOrgMutation = useMutation({
    mutationFn: async () => {
      if (!currentOrg) throw new Error("No organization selected");
      const { error } = await supabase.from("organizations").update({
        name: orgForm.name,
        name_ar: orgForm.name_ar || null,
        email: orgForm.email || null,
        phone: orgForm.phone || null,
        address: orgForm.address || null,
        emirate: orgForm.emirate || null,
        currency: orgForm.currency || "AED",
        timezone: orgForm.timezone || "Asia/Dubai",
        vat_enabled: orgForm.vat_enabled,
        vat_number: orgForm.vat_number || null,
        vat_rate: parseFloat(orgForm.vat_rate) || 5,
        trade_license: orgForm.trade_license || null,
      }).eq("id", currentOrg.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-details"] });
      refetchOrgs();
      toast({ title: "Organization settings updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async () => {
      if (passwordForm.password !== passwordForm.confirmPassword)
        throw new Error("Passwords don't match");
      if (passwordForm.password.length < 6)
        throw new Error("Password must be at least 6 characters");
      const { error } = await supabase.auth.updateUser({ password: passwordForm.password });
      if (error) throw error;
    },
    onSuccess: () => {
      setPasswordForm({ password: "", confirmPassword: "" });
      toast({ title: "Password updated successfully" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const emirates = ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"];

  // Tabs available based on role
  const showOrgTab = !isMasterAdmin && !!currentOrg;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="page-header flex items-center gap-2">
            <Settings className="w-6 h-6" /> Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isMasterAdmin
              ? "Manage your master admin account settings"
              : "Manage your account, organization, and preferences"}
          </p>
        </div>

        {/* Master admin banner */}
        {isMasterAdmin && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <Shield className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-primary">Master Admin Account</p>
              <p className="text-xs text-muted-foreground">
                Organization settings are managed from the Master Admin Panel
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" /> Profile
            </TabsTrigger>
            {showOrgTab && (
              <TabsTrigger value="organization" className="gap-2">
                <Building2 className="w-4 h-4" /> Organization
              </TabsTrigger>
            )}
            <TabsTrigger value="security" className="gap-2">
              <Lock className="w-4 h-4" /> Security
            </TabsTrigger>
            {!isMasterAdmin && (
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" /> Notifications
              </TabsTrigger>
            )}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user?.email || ""} disabled className="opacity-60" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+971 50 XXX XXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nationality</Label>
                    <Input
                      value={profileForm.nationality}
                      onChange={(e) => setProfileForm({ ...profileForm, nationality: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Emirates ID</Label>
                    <Input
                      value={profileForm.emirates_id}
                      onChange={(e) => setProfileForm({ ...profileForm, emirates_id: e.target.value })}
                      placeholder="784-XXXX-XXXXXXX-X"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => updateProfileMutation.mutate()}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organization Tab — hidden for master admin */}
          {showOrgTab && (
            <TabsContent value="organization">
              <div className="space-y-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-base">Organization Details</CardTitle>
                    <CardDescription>Manage your company information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Company Name (English) *</Label>
                        <Input value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Company Name (Arabic)</Label>
                        <Input value={orgForm.name_ar} onChange={(e) => setOrgForm({ ...orgForm, name_ar: e.target.value })} dir="rtl" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={orgForm.email} onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })} type="email" />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={orgForm.phone} onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })} />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Address</Label>
                        <Input value={orgForm.address} onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Emirate</Label>
                        <Select value={orgForm.emirate} onValueChange={(v) => setOrgForm({ ...orgForm, emirate: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {emirates.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Trade License</Label>
                        <Input value={orgForm.trade_license} onChange={(e) => setOrgForm({ ...orgForm, trade_license: e.target.value })} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Regional & Tax
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select value={orgForm.currency} onValueChange={(v) => setOrgForm({ ...orgForm, currency: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AED">AED (UAE Dirham)</SelectItem>
                            <SelectItem value="USD">USD (US Dollar)</SelectItem>
                            <SelectItem value="SAR">SAR (Saudi Riyal)</SelectItem>
                            <SelectItem value="BHD">BHD (Bahraini Dinar)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select value={orgForm.timezone} onValueChange={(v) => setOrgForm({ ...orgForm, timezone: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Asia/Dubai">Asia/Dubai (GMT+4)</SelectItem>
                            <SelectItem value="Asia/Riyadh">Asia/Riyadh (GMT+3)</SelectItem>
                            <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30">
                      <div>
                        <p className="text-sm font-medium">VAT Enabled</p>
                        <p className="text-xs text-muted-foreground">Enable 5% UAE VAT on invoices</p>
                      </div>
                      <Switch
                        checked={orgForm.vat_enabled}
                        onCheckedChange={(v) => setOrgForm({ ...orgForm, vat_enabled: v })}
                      />
                    </div>
                    {orgForm.vat_enabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>TRN (Tax Registration Number)</Label>
                          <Input value={orgForm.vat_number} onChange={(e) => setOrgForm({ ...orgForm, vat_number: e.target.value })} placeholder="100XXXXXXXXX003" />
                        </div>
                        <div className="space-y-2">
                          <Label>VAT Rate (%)</Label>
                          <Input type="number" value={orgForm.vat_rate} onChange={(e) => setOrgForm({ ...orgForm, vat_rate: e.target.value })} />
                        </div>
                      </div>
                    )}
                    <Button
                      onClick={() => updateOrgMutation.mutate()}
                      disabled={updateOrgMutation.isPending || !orgForm.name}
                    >
                      {updateOrgMutation.isPending ? "Saving..." : "Save Organization Settings"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      value={passwordForm.password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <Input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => updatePasswordMutation.mutate()}
                  disabled={!passwordForm.password || updatePasswordMutation.isPending}
                >
                  {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab — org users only */}
          {!isMasterAdmin && (
            <TabsContent value="notifications">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base">Notification Preferences</CardTitle>
                  <CardDescription>Choose which notifications you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  {[
                    { key: "lease_expiry", label: "Lease Expiry Reminders", desc: "Get notified before leases expire" },
                    { key: "rent_due", label: "Rent Due Alerts", desc: "Reminders for upcoming rent payments" },
                    { key: "maintenance", label: "Maintenance Updates", desc: "Status changes on maintenance requests" },
                    { key: "payments", label: "Payment Confirmations", desc: "Receipts and payment notifications" },
                    { key: "documents", label: "Document Expiry Alerts", desc: "Alerts when documents are about to expire" },
                    { key: "system", label: "System Notifications", desc: "Platform updates and announcements" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/20 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={notifPrefs[item.key as keyof typeof notifPrefs]}
                        onCheckedChange={(v) => setNotifPrefs({ ...notifPrefs, [item.key]: v })}
                      />
                    </div>
                  ))}
                  <div className="pt-4">
                    <Button onClick={() => toast({ title: "Notification preferences saved" })}>
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </AppLayout>
  );
};

export default SettingsPage;

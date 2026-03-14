// src/components/layout/Sidebar.tsx
// FIXED:
//   1. Master admin sees dedicated admin nav (not org user nav)
//   2. Org switcher hidden for master admin
//   3. "Platform Administrator" badge shown for master admin
//   4. Broken className template literal strings fixed
//   5. Sign out button added to footer

import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, Home, Layers, DoorOpen, BedDouble,
  Users, FileText, Receipt, CreditCard, Wrench, Wifi, FolderOpen,
  MessageSquare, Bell, BarChart3, Brain, Zap, Settings, UserCircle,
  Calculator, ChevronLeft, ChevronRight, BookOpen, Landmark, Shield,
  Headphones, Link2, Crown, Car, Lock, Banknote, UserCheck, Clock,
  CalendarSync, Globe, ShieldCheck, LogOut, Package, ScrollText, LifeBuoy,
} from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { useMasterAdmin } from "@/hooks/useMasterAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────────────────────
// MASTER ADMIN nav — platform management only
// ─────────────────────────────────────────────────────────────
const masterAdminGroups = [
  {
    label: "Platform",
    items: [
      { to: "/master-admin", icon: LayoutDashboard, label: "Admin Dashboard" },
    ],
  },
  {
    label: "Tenants",
    items: [
      { to: "/organizations", icon: Building2, label: "Organizations" },
      { to: "/user-management", icon: Users, label: "All Users" },
    ],
  },
  {
    label: "Billing",
    items: [
      { to: "/subscriptions", icon: Crown, label: "Subscriptions" },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { to: "/support", icon: LifeBuoy, label: "Support Tickets" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// ORG USER nav — property management
// ─────────────────────────────────────────────────────────────
const orgNavGroups = [
  {
    label: "Overview",
    items: [{ to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", slug: "dashboard" }],
  },
  {
    label: "Property",
    items: [
      { to: "/organizations", icon: Building2, label: "Organizations", slug: "organizations" },
      { to: "/properties", icon: Building2, label: "Properties", slug: "properties" },
      { to: "/buildings", icon: Home, label: "Buildings", slug: "buildings" },
      { to: "/floors", icon: Layers, label: "Floors", slug: "floors" },
      { to: "/units", icon: DoorOpen, label: "Units", slug: "units" },
      { to: "/rooms", icon: BedDouble, label: "Rooms", slug: "rooms" },
      { to: "/bed-spaces", icon: Users, label: "Bed Spaces", slug: "bed-spaces" },
    ],
  },
  {
    label: "Tenant & Lease",
    items: [
      { to: "/tenants", icon: Users, label: "Tenants", slug: "tenants" },
      { to: "/leases", icon: FileText, label: "Leases", slug: "leases" },
      { to: "/ejari", icon: FileText, label: "Ejari", slug: "ejari" },
      { to: "/rent-management", icon: Receipt, label: "Rent Control", slug: "rent-management" },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/invoices", icon: Receipt, label: "Invoices", slug: "invoices" },
      { to: "/payments", icon: CreditCard, label: "Payments", slug: "payments" },
      { to: "/cheque-tracking", icon: Banknote, label: "Cheques", slug: "cheque-tracking" },
      { to: "/accounting", icon: Calculator, label: "Accounting & VAT", slug: "accounting" },
    ],
  },
  {
    label: "HR & Payroll",
    items: [
      { to: "/hr", icon: LayoutDashboard, label: "HR Dashboard", slug: "hr-payroll" },
      { to: "/employees", icon: UserCheck, label: "Employees", slug: "hr-payroll" },
      { to: "/attendance", icon: Clock, label: "Attendance", slug: "hr-payroll" },
      { to: "/leave", icon: CalendarSync, label: "Leaves", slug: "hr-payroll" },
      { to: "/payroll", icon: CreditCard, label: "Payroll", slug: "hr-payroll" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/maintenance", icon: Wrench, label: "Maintenance", slug: "maintenance" },
      { to: "/amenities", icon: Wifi, label: "Amenities", slug: "amenities" },
      { to: "/utilities", icon: Landmark, label: "Utilities", slug: "utilities" },
      { to: "/documents", icon: FolderOpen, label: "Documents", slug: "documents" },
      { to: "/uae-management", icon: Car, label: "UAE Management", slug: "uae-management" },
    ],
  },
  {
    label: "Communication",
    items: [
      { to: "/messaging", icon: MessageSquare, label: "Messaging", slug: "messaging" },
      { to: "/notifications", icon: Bell, label: "Notifications", slug: "notifications" },
      { to: "/complaints", icon: MessageSquare, label: "Complaints", slug: "complaints" },
      { to: "/notices", icon: BookOpen, label: "Notices", slug: "notices" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/reports", icon: BarChart3, label: "Reports", slug: "reports" },
      { to: "/analytics", icon: BarChart3, label: "Analytics", slug: "analytics" },
      { to: "/ai-insights", icon: Brain, label: "AI Insights", slug: "ai-insights" },
      { to: "/automation", icon: Zap, label: "Automation", slug: "automation" },
    ],
  },
  {
    label: "Portals",
    items: [
      { to: "/owner-portal", icon: UserCircle, label: "Owner", slug: "owner-portal" },
      { to: "/tenant-portal", icon: Users, label: "Tenant", slug: "tenant-portal" },
      { to: "/public-booking", icon: Globe, label: "Booking", slug: "public-booking" },
    ],
  },
  {
    label: "Integrations",
    items: [
      { to: "/erp-integrations", icon: Link2, label: "ERP", slug: "erp-integrations" },
      { to: "/support", icon: Headphones, label: "Support", slug: "support" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/subscriptions", icon: Crown, label: "Plans", slug: "subscriptions" },
      { to: "/master-admin", icon: Shield, label: "Admin", slug: "master-admin" },
      { to: "/user-management", icon: ShieldCheck, label: "Users", slug: "user-management" },
      { to: "/settings", icon: Settings, label: "Settings", slug: "settings" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar-collapsed");
      return saved !== null ? JSON.parse(saved) : true;
    } catch { return true; }
  });

  const { user } = useAuth();
  const { isMasterAdmin } = useMasterAdmin();
  const { organizations, currentOrg, setCurrentOrg } = useOrganization();
  const { canAccessModule } = usePermissions();
  const { hasModuleAccess } = useSubscriptionAccess();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleCollapsed = () => {
    setCollapsed((prev: boolean) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", JSON.stringify(next));
      return next;
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  // Master admin: use admin nav, no filtering needed
  // Org user: filter by role permissions
  const displayGroups = isMasterAdmin
    ? masterAdminGroups
    : orgNavGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            canAccessModule((item as any).slug || item.to.replace("/", ""))
          ),
        }))
        .filter((group) => group.items.length > 0);

  return (
    <aside
      className={`glass-sidebar h-screen flex flex-col transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* ── Logo ─────────────────────────────────────────── */}
      <div
        className={`flex items-center ${
          collapsed ? "justify-center" : "gap-3 px-5"
        } h-[72px] border-b border-sidebar-border`}
      >
        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-base">Z</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-lg tracking-tight">ZainBook</span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">
              {isMasterAdmin ? "Master Admin" : "AI Platform"}
            </span>
          </div>
        )}
      </div>

      {/* ── Master Admin badge ────────────────────────────── */}
      {isMasterAdmin && !collapsed && (
        <div className="mx-3 my-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-xs text-primary font-semibold">Platform Administrator</span>
        </div>
      )}

      {/* ── Org Switcher (org users only) ────────────────── */}
      {!isMasterAdmin && !collapsed && organizations.length > 0 && (
        <div className="px-3 py-3 border-b border-sidebar-border">
          <Select
            value={currentOrg?.id || ""}
            onValueChange={(v) => {
              const org = organizations.find((o) => o.id === v);
              if (org) setCurrentOrg(org);
            }}
          >
            <SelectTrigger className="bg-sidebar-accent/60 border-sidebar-border/50 text-[15px] h-10 rounded-xl">
              <SelectValue placeholder="Select org" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((o) => (
                <SelectItem key={o.id} value={o.id} className="text-[15px]">
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Nav ──────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {displayGroups.map((group) => (
          <div key={group.label} className="mb-2">
            {!collapsed && (
              <div className="section-label mt-2">{group.label}</div>
            )}
            <div className={collapsed ? "flex flex-col items-center gap-1" : "space-y-0.5"}>
              {group.items.map((item) => {
                const slug = (item as any).slug;
                const planLocked = !isMasterAdmin && slug && !hasModuleAccess(slug);
                const isActive = location.pathname === item.to;

                if (planLocked) {
                  return collapsed ? (
                    <Tooltip key={item.to}>
                      <TooltipTrigger asChild>
                        <div className="sidebar-item opacity-40 cursor-not-allowed relative">
                          <item.icon className="w-5 h-5 shrink-0" />
                          <Lock className="w-3 h-3 absolute -top-0.5 -right-0.5 text-warning" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="text-xs">{item.label} — Upgrade to unlock</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div
                      key={item.to}
                      className="sidebar-item-expanded opacity-40 cursor-not-allowed flex items-center gap-2"
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      <Lock className="w-3.5 h-3.5 text-warning" />
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={
                      collapsed
                        ? `sidebar-item ${isActive ? "active" : ""}`
                        : `sidebar-item-expanded ${isActive ? "active" : ""}`
                    }
                    title={item.label}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User footer ───────────────────────────────────── */}
      <div className={`border-t border-sidebar-border ${collapsed ? "p-2" : "px-3 py-3"}`}>
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-primary text-xs font-bold">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user?.email}</p>
              <p className="text-[10px] text-muted-foreground">
                {isMasterAdmin ? "Master Admin" : currentOrg?.name || "No Organization"}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleSignOut}
                className="w-full flex justify-center p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* ── Collapse toggle ───────────────────────────────── */}
      <button
        onClick={toggleCollapsed}
        className="flex items-center justify-center h-10 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </aside>
  );
};

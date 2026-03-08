import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, Home, Layers, DoorOpen, BedDouble,
  Users, FileText, Receipt, CreditCard, Wrench, Wifi, FolderOpen,
  MessageSquare, BarChart3, Brain, Zap, UserCircle, Settings,
  ChevronLeft, ChevronRight, Building, Globe, BookOpen, Bell,
  Landmark, ShieldCheck, Shield, Headphones, Link2, Crown, Car, Banknote
} from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock } from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", slug: "dashboard" },
    ],
  },
  {
    label: "Property",
    items: [
      { to: "/organizations", icon: Building, label: "Organizations", slug: "organizations" },
      { to: "/properties", icon: Home, label: "Properties", slug: "properties" },
      { to: "/buildings", icon: Building2, label: "Buildings", slug: "buildings" },
      { to: "/floors", icon: Layers, label: "Floors", slug: "floors" },
      { to: "/units", icon: DoorOpen, label: "Units", slug: "units" },
      { to: "/rooms", icon: DoorOpen, label: "Rooms", slug: "rooms" },
      { to: "/bed-spaces", icon: BedDouble, label: "Bed Spaces", slug: "bed-spaces" },
    ],
  },
  {
    label: "Tenants",
    items: [
      { to: "/tenants", icon: Users, label: "Tenants", slug: "tenants" },
      { to: "/leases", icon: FileText, label: "Leases", slug: "leases" },
      { to: "/ejari", icon: ShieldCheck, label: "Ejari", slug: "ejari" },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/rent-management", icon: Banknote, label: "Rent Mgmt", slug: "rent-management" },
      { to: "/invoices", icon: Receipt, label: "Invoices", slug: "invoices" },
      { to: "/payments", icon: CreditCard, label: "Payments", slug: "payments" },
      { to: "/cheque-tracking", icon: Banknote, label: "Cheques", slug: "cheque-tracking" },
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

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const { organizations, currentOrg, setCurrentOrg } = useOrganization();
  const { canAccessModule, isSuperAdmin } = usePermissions();
  const { hasModuleAccess } = useSubscriptionAccess();
  const location = useLocation();

  const toggleCollapsed = () => {
    setCollapsed((prev: boolean) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", JSON.stringify(next));
      return next;
    });
  };

  // Filter nav items by role permissions AND subscription plan
  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const roleAccess = canAccessModule(item.slug);
        const planAccess = hasModuleAccess(item.slug);
        // Show item if role has access (even if plan doesn't — we'll show lock icon)
        return roleAccess;
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className={`glass-sidebar h-screen flex flex-col transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3 px-5"} h-[72px] border-b border-sidebar-border`}>
        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-base">Z</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-lg tracking-tight">ZainBook</span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">AI Platform</span>
          </div>
        )}
      </div>

      {/* Org Switcher */}
      {!collapsed && organizations.length > 0 && (
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
                <SelectItem key={o.id} value={o.id} className="text-[15px]">{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {filteredGroups.map((group) => (
          <div key={group.label} className="mb-2">
            {!collapsed && <div className="section-label mt-2">{group.label}</div>}
            <div className={`${collapsed ? "flex flex-col items-center gap-1" : "space-y-0.5"}`}>
              {group.items.map((item) => {
                const planLocked = !hasModuleAccess(item.slug);

                if (planLocked) {
                  // Show locked item with tooltip
                  return collapsed ? (
                    <Tooltip key={item.to}>
                      <TooltipTrigger asChild>
                        <div className="sidebar-item opacity-40 cursor-not-allowed relative" title={item.label}>
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
                      title="Upgrade to unlock"
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
                    className={collapsed
                      ? `sidebar-item ${location.pathname === item.to ? "active" : ""}`
                      : `sidebar-item-expanded ${location.pathname === item.to ? "active" : ""}`
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

      {/* Collapse toggle */}
      <button
        onClick={toggleCollapsed}
        className="flex items-center justify-center h-14 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </aside>
  );
};

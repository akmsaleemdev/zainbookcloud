import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, Home, Layers, DoorOpen, BedDouble,
  Users, FileText, Receipt, CreditCard, Wrench, Wifi, FolderOpen,
  MessageSquare, BarChart3, Brain, Zap, UserCircle, Settings,
  ChevronLeft, ChevronRight, Building, Globe, BookOpen, Bell,
  Landmark, ShieldCheck, Shield, Headphones, Link2, Crown
} from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const navGroups = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    label: "Property",
    items: [
      { to: "/organizations", icon: Building, label: "Organizations" },
      { to: "/properties", icon: Home, label: "Properties" },
      { to: "/buildings", icon: Building2, label: "Buildings" },
      { to: "/floors", icon: Layers, label: "Floors" },
      { to: "/units", icon: DoorOpen, label: "Units" },
      { to: "/rooms", icon: DoorOpen, label: "Rooms" },
      { to: "/bed-spaces", icon: BedDouble, label: "Bed Spaces" },
    ],
  },
  {
    label: "Tenants",
    items: [
      { to: "/tenants", icon: Users, label: "Tenants" },
      { to: "/leases", icon: FileText, label: "Leases" },
      { to: "/ejari", icon: ShieldCheck, label: "Ejari" },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/invoices", icon: Receipt, label: "Invoices" },
      { to: "/payments", icon: CreditCard, label: "Payments" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/maintenance", icon: Wrench, label: "Maintenance" },
      { to: "/amenities", icon: Wifi, label: "Amenities" },
      { to: "/utilities", icon: Landmark, label: "Utilities" },
      { to: "/documents", icon: FolderOpen, label: "Documents" },
    ],
  },
  {
    label: "Communication",
    items: [
      { to: "/messaging", icon: MessageSquare, label: "Messaging" },
      { to: "/notifications", icon: Bell, label: "Notifications" },
      { to: "/complaints", icon: MessageSquare, label: "Complaints" },
      { to: "/notices", icon: BookOpen, label: "Notices" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/reports", icon: BarChart3, label: "Reports" },
      { to: "/analytics", icon: BarChart3, label: "Analytics" },
      { to: "/ai-insights", icon: Brain, label: "AI Insights" },
      { to: "/automation", icon: Zap, label: "Automation" },
    ],
  },
  {
    label: "Portals",
    items: [
      { to: "/owner-portal", icon: UserCircle, label: "Owner" },
      { to: "/tenant-portal", icon: Users, label: "Tenant" },
      { to: "/public-booking", icon: Globe, label: "Booking" },
    ],
  },
  {
    label: "Integrations",
    items: [
      { to: "/erp-integrations", icon: Link2, label: "ERP" },
      { to: "/support", icon: Headphones, label: "Support" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/subscriptions", icon: Crown, label: "Plans" },
      { to: "/master-admin", icon: Shield, label: "Admin" },
      { to: "/user-management", icon: ShieldCheck, label: "Users" },
      { to: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const { organizations, currentOrg, setCurrentOrg } = useOrganization();
  const location = useLocation();

  const toggleCollapsed = () => {
    setCollapsed((prev: boolean) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", JSON.stringify(next));
      return next;
    });
  };

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
        {navGroups.map((group) => (
          <div key={group.label} className="mb-2">
            {!collapsed && <div className="section-label mt-2">{group.label}</div>}
            <div className={`${collapsed ? "flex flex-col items-center gap-1" : "space-y-0.5"}`}>
              {group.items.map((item) => (
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
              ))}
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

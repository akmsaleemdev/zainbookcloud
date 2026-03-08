import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, Home, Layers, DoorOpen, BedDouble,
  Users, FileText, Receipt, CreditCard, Wrench, Wifi, FolderOpen,
  MessageSquare, BarChart3, Brain, Zap, UserCircle, Settings,
  ChevronLeft, ChevronRight, Building, Globe, BookOpen, Bell,
  Landmark, ShieldCheck, ChevronsUpDown
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
    label: "Property Management",
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
    label: "Tenants & Leases",
    items: [
      { to: "/tenants", icon: Users, label: "Tenants" },
      { to: "/leases", icon: FileText, label: "Leases" },
      { to: "/ejari", icon: ShieldCheck, label: "Ejari Contracts" },
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
      { to: "/owner-portal", icon: UserCircle, label: "Owner Portal" },
      { to: "/tenant-portal", icon: Users, label: "Tenant Portal" },
      { to: "/public-booking", icon: Globe, label: "Public Booking" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/subscriptions", icon: BookOpen, label: "Subscriptions" },
      { to: "/user-management", icon: ShieldCheck, label: "User Management" },
      { to: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { organizations, currentOrg, setCurrentOrg } = useOrganization();
  const location = useLocation();

  return (
    <aside
      className={`glass-sidebar h-screen flex flex-col transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-sm">Z</span>
        </div>
        {!collapsed && (
          <span className="font-semibold text-foreground text-lg">ZainBook</span>
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
            <SelectTrigger className="bg-sidebar-accent/50 border-sidebar-border text-xs h-8">
              <SelectValue placeholder="Select org" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((o) => (
                <SelectItem key={o.id} value={o.id} className="text-xs">{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4 scrollbar-thin">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && <div className="section-label">{group.label}</div>}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`sidebar-item ${
                    location.pathname === item.to ? "active" : ""
                  }`}
                  title={item.label}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
};

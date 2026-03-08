import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ModuleGuard } from "@/components/access-control/ModuleGuard";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import AuthPage from "./pages/AuthPage";
import ResetPassword from "./pages/ResetPassword";
import HomePage from "./pages/website/HomePage";
import FeaturesPage from "./pages/website/FeaturesPage";
import PricingPage from "./pages/website/PricingPage";
import SolutionsPage from "./pages/website/SolutionsPage";
import AboutPage from "./pages/website/AboutPage";
import ContactPage from "./pages/website/ContactPage";
import PaymentGatewaysPage from "./pages/website/PaymentGatewaysPage";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Tenants from "./pages/Tenants";
import Leases from "./pages/Leases";
import Invoices from "./pages/Invoices";
import Payments from "./pages/Payments";
import Maintenance from "./pages/Maintenance";
import Organizations from "./pages/Organizations";
import Buildings from "./pages/Buildings";
import Floors from "./pages/Floors";
import Units from "./pages/Units";
import Rooms from "./pages/Rooms";
import BedSpaces from "./pages/BedSpaces";
import Ejari from "./pages/Ejari";
import Amenities from "./pages/Amenities";
import Utilities from "./pages/Utilities";
import Documents from "./pages/Documents";
import Messaging from "./pages/Messaging";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import AIInsights from "./pages/AIInsights";
import Automation from "./pages/Automation";
import OwnerPortal from "./pages/OwnerPortal";
import TenantPortal from "./pages/TenantPortal";
import PublicBooking from "./pages/PublicBooking";
import Subscriptions from "./pages/Subscriptions";
import MasterAdmin from "./pages/MasterAdmin";
import SupportCenter from "./pages/SupportCenter";
import ERPIntegrations from "./pages/ERPIntegrations";
import UserManagement from "./pages/UserManagement";
import SettingsPage from "./pages/SettingsPage";
import Complaints from "./pages/Complaints";
import Notices from "./pages/Notices";
import UAEApartmentManagement from "./pages/UAEApartmentManagement";
import ChequeTracking from "./pages/ChequeTracking";
import RentManagement from "./pages/RentManagement";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Protected + Module guard wrapper */
const PM = ({ module, children }: { module: string; children: React.ReactNode }) => (
  <ProtectedRoute>
    <ModuleGuard module={module}>{children}</ModuleGuard>
  </ProtectedRoute>
);

/** Protected only (no module guard — e.g. dashboard) */
const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <OrganizationProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/website" replace />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Public website */}
            <Route path="/website" element={<HomePage />} />
            <Route path="/website/features" element={<FeaturesPage />} />
            <Route path="/website/pricing" element={<PricingPage />} />
            <Route path="/website/solutions" element={<SolutionsPage />} />
            <Route path="/website/about" element={<AboutPage />} />
            <Route path="/website/contact" element={<ContactPage />} />
            <Route path="/website/payment-gateways" element={<PaymentGatewaysPage />} />
            {/* App routes with module-level access control */}
            <Route path="/dashboard" element={<P><Dashboard /></P>} />
            <Route path="/organizations" element={<PM module="organizations"><Organizations /></PM>} />
            <Route path="/properties" element={<PM module="properties"><Properties /></PM>} />
            <Route path="/buildings" element={<PM module="buildings"><Buildings /></PM>} />
            <Route path="/floors" element={<PM module="floors"><Floors /></PM>} />
            <Route path="/units" element={<PM module="units"><Units /></PM>} />
            <Route path="/rooms" element={<PM module="rooms"><Rooms /></PM>} />
            <Route path="/bed-spaces" element={<PM module="bed-spaces"><BedSpaces /></PM>} />
            <Route path="/tenants" element={<PM module="tenants"><Tenants /></PM>} />
            <Route path="/leases" element={<PM module="leases"><Leases /></PM>} />
            <Route path="/ejari" element={<PM module="ejari"><Ejari /></PM>} />
            <Route path="/rent-management" element={<PM module="rent-management"><RentManagement /></PM>} />
            <Route path="/invoices" element={<PM module="invoices"><Invoices /></PM>} />
            <Route path="/payments" element={<PM module="payments"><Payments /></PM>} />
            <Route path="/cheque-tracking" element={<PM module="cheque-tracking"><ChequeTracking /></PM>} />
            <Route path="/maintenance" element={<PM module="maintenance"><Maintenance /></PM>} />
            <Route path="/amenities" element={<PM module="amenities"><Amenities /></PM>} />
            <Route path="/utilities" element={<PM module="utilities"><Utilities /></PM>} />
            <Route path="/documents" element={<PM module="documents"><Documents /></PM>} />
            <Route path="/uae-management" element={<PM module="uae-management"><UAEApartmentManagement /></PM>} />
            <Route path="/messaging" element={<PM module="messaging"><Messaging /></PM>} />
            <Route path="/notifications" element={<PM module="notifications"><Notifications /></PM>} />
            <Route path="/complaints" element={<PM module="complaints"><Complaints /></PM>} />
            <Route path="/notices" element={<PM module="notices"><Notices /></PM>} />
            <Route path="/reports" element={<PM module="reports"><Reports /></PM>} />
            <Route path="/analytics" element={<PM module="analytics"><Analytics /></PM>} />
            <Route path="/ai-insights" element={<PM module="ai-insights"><AIInsights /></PM>} />
            <Route path="/automation" element={<PM module="automation"><Automation /></PM>} />
            <Route path="/owner-portal" element={<PM module="owner-portal"><OwnerPortal /></PM>} />
            <Route path="/tenant-portal" element={<PM module="tenant-portal"><TenantPortal /></PM>} />
            <Route path="/public-booking" element={<PM module="public-booking"><PublicBooking /></PM>} />
            <Route path="/subscriptions" element={<PM module="subscriptions"><Subscriptions /></PM>} />
            <Route path="/master-admin" element={<PM module="master-admin"><MasterAdmin /></PM>} />
            <Route path="/support" element={<PM module="support"><SupportCenter /></PM>} />
            <Route path="/erp-integrations" element={<PM module="erp-integrations"><ERPIntegrations /></PM>} />
            <Route path="/user-management" element={<PM module="user-management"><UserManagement /></PM>} />
            <Route path="/settings" element={<PM module="settings"><SettingsPage /></PM>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </OrganizationProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

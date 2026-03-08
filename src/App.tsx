import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Public website */}
            <Route path="/website" element={<HomePage />} />
            <Route path="/website/features" element={<FeaturesPage />} />
            <Route path="/website/pricing" element={<PricingPage />} />
            <Route path="/website/solutions" element={<SolutionsPage />} />
            <Route path="/website/about" element={<AboutPage />} />
            <Route path="/website/contact" element={<ContactPage />} />
            <Route path="/website/payment-gateways" element={<PaymentGatewaysPage />} />
            <Route path="/dashboard" element={<P><Dashboard /></P>} />
            <Route path="/organizations" element={<P><Organizations /></P>} />
            <Route path="/properties" element={<P><Properties /></P>} />
            <Route path="/buildings" element={<P><Buildings /></P>} />
            <Route path="/floors" element={<P><Floors /></P>} />
            <Route path="/units" element={<P><Units /></P>} />
            <Route path="/rooms" element={<P><Rooms /></P>} />
            <Route path="/bed-spaces" element={<P><BedSpaces /></P>} />
            <Route path="/tenants" element={<P><Tenants /></P>} />
            <Route path="/leases" element={<P><Leases /></P>} />
            <Route path="/ejari" element={<P><Ejari /></P>} />
            <Route path="/invoices" element={<P><Invoices /></P>} />
            <Route path="/payments" element={<P><Payments /></P>} />
            <Route path="/maintenance" element={<P><Maintenance /></P>} />
            <Route path="/amenities" element={<P><Amenities /></P>} />
            <Route path="/utilities" element={<P><Utilities /></P>} />
            <Route path="/documents" element={<P><Documents /></P>} />
            <Route path="/messaging" element={<P><Messaging /></P>} />
            <Route path="/notifications" element={<P><Notifications /></P>} />
            <Route path="/complaints" element={<P><Complaints /></P>} />
            <Route path="/notices" element={<P><Notices /></P>} />
            <Route path="/reports" element={<P><Reports /></P>} />
            <Route path="/analytics" element={<P><Analytics /></P>} />
            <Route path="/ai-insights" element={<P><AIInsights /></P>} />
            <Route path="/automation" element={<P><Automation /></P>} />
            <Route path="/owner-portal" element={<P><OwnerPortal /></P>} />
            <Route path="/tenant-portal" element={<P><TenantPortal /></P>} />
            <Route path="/public-booking" element={<P><PublicBooking /></P>} />
            <Route path="/subscriptions" element={<P><Subscriptions /></P>} />
            <Route path="/master-admin" element={<P><MasterAdmin /></P>} />
            <Route path="/support" element={<P><SupportCenter /></P>} />
            <Route path="/erp-integrations" element={<P><ERPIntegrations /></P>} />
            <Route path="/user-management" element={<P><UserManagement /></P>} />
            <Route path="/settings" element={<P><SettingsPage /></P>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </OrganizationProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

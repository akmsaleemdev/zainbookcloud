import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ModuleGuard } from "@/components/access-control/ModuleGuard";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LoadingSpinner from "@/components/LoadingSpinner";

// Eager: auth & website (first paint)
import AuthPage from "./pages/AuthPage";
import ResetPassword from "./pages/ResetPassword";
import HomePage from "./pages/website/HomePage";

// Lazy: everything else
const FeaturesPage = lazy(() => import("./pages/website/FeaturesPage"));
const PricingPage = lazy(() => import("./pages/website/PricingPage"));
const SolutionsPage = lazy(() => import("./pages/website/SolutionsPage"));
const AboutPage = lazy(() => import("./pages/website/AboutPage"));
const ContactPage = lazy(() => import("./pages/website/ContactPage"));
const PaymentGatewaysPage = lazy(() => import("./pages/website/PaymentGatewaysPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Properties = lazy(() => import("./pages/Properties"));
const Tenants = lazy(() => import("./pages/Tenants"));
const Leases = lazy(() => import("./pages/Leases"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Payments = lazy(() => import("./pages/Payments"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const Organizations = lazy(() => import("./pages/Organizations"));
const Buildings = lazy(() => import("./pages/Buildings"));
const Floors = lazy(() => import("./pages/Floors"));
const Units = lazy(() => import("./pages/Units"));
const Rooms = lazy(() => import("./pages/Rooms"));
const BedSpaces = lazy(() => import("./pages/BedSpaces"));
const Ejari = lazy(() => import("./pages/Ejari"));
const Amenities = lazy(() => import("./pages/Amenities"));
const Utilities = lazy(() => import("./pages/Utilities"));
const Documents = lazy(() => import("./pages/Documents"));
const Messaging = lazy(() => import("./pages/Messaging"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Reports = lazy(() => import("./pages/Reports"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AIInsights = lazy(() => import("./pages/AIInsights"));
const WorkflowBuilder = lazy(() => import("./pages/WorkflowBuilder"));
const OwnerPortal = lazy(() => import("./pages/OwnerPortal"));
const TenantPortal = lazy(() => import("./pages/TenantPortal"));
const PublicBooking = lazy(() => import("./pages/PublicBooking"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const MasterAdmin = lazy(() => import("./pages/MasterAdmin"));
const SupportCenter = lazy(() => import("./pages/SupportCenter"));
const ERPIntegrations = lazy(() => import("./pages/ERPIntegrations"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const Complaints = lazy(() => import("./pages/Complaints"));
const Notices = lazy(() => import("./pages/Notices"));
const UAEApartmentManagement = lazy(() => import("./pages/UAEApartmentManagement"));
const ChequeTracking = lazy(() => import("./pages/ChequeTracking"));
const RentManagement = lazy(() => import("./pages/RentManagement"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Phase 2 Modules
const HRDashboard = lazy(() => import("./pages/HRDashboard"));
const Employees = lazy(() => import("./pages/Employees"));
const Attendance = lazy(() => import("./pages/Attendance"));
const LeaveManagement = lazy(() => import("./pages/LeaveManagement"));
const Payroll = lazy(() => import("./pages/Payroll"));
const Accounting = lazy(() => import("./pages/Accounting"));

// Phase 3 Modules
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const Docs = lazy(() => import("./pages/Docs"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Register = lazy(() => import("./pages/Register"));

const queryClient = new QueryClient();

const PM = ({ module, children }: { module: string; children: React.ReactNode }) => (
  <ProtectedRoute><ModuleGuard module={module}>{children}</ModuleGuard></ProtectedRoute>
);
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
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Navigate to="/website" replace />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/register" element={<Register />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/admin/dashboard" element={<Navigate to="/master-admin" replace />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                {/* Public website */}
                <Route path="/website" element={<HomePage />} />
                <Route path="/website/features" element={<FeaturesPage />} />
                <Route path="/website/pricing" element={<PricingPage />} />
                <Route path="/website/solutions" element={<SolutionsPage />} />
                <Route path="/website/about" element={<AboutPage />} />
                <Route path="/website/contact" element={<ContactPage />} />
                <Route path="/website/payment-gateways" element={<PaymentGatewaysPage />} />
                {/* App routes */}
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
                <Route path="/automation" element={<PM module="automation"><WorkflowBuilder /></PM>} />
                <Route path="/owner-portal" element={<PM module="owner-portal"><OwnerPortal /></PM>} />
                <Route path="/tenant-portal" element={<PM module="tenant-portal"><TenantPortal /></PM>} />
                <Route path="/public-booking" element={<PM module="public-booking"><PublicBooking /></PM>} />
                <Route path="/subscriptions" element={<PM module="subscriptions"><Subscriptions /></PM>} />
                <Route path="/master-admin" element={<PM module="master-admin"><MasterAdmin /></PM>} />
                <Route path="/support" element={<PM module="support"><SupportCenter /></PM>} />
                <Route path="/erp-integrations" element={<PM module="erp-integrations"><ERPIntegrations /></PM>} />
                <Route path="/user-management" element={<PM module="user-management"><UserManagement /></PM>} />
                <Route path="/settings" element={<PM module="settings"><SettingsPage /></PM>} />

                {/* HR & Payroll */}
                <Route path="/hr" element={<PM module="hr-payroll"><HRDashboard /></PM>} />
                <Route path="/employees" element={<PM module="hr-payroll"><Employees /></PM>} />
                <Route path="/attendance" element={<PM module="hr-payroll"><Attendance /></PM>} />
                <Route path="/leave" element={<PM module="hr-payroll"><LeaveManagement /></PM>} />
                <Route path="/payroll" element={<PM module="hr-payroll"><Payroll /></PM>} />

                {/* Accounting */}
                <Route path="/accounting" element={<PM module="accounting"><Accounting /></PM>} />

                {/* Customer / Tenant Portal */}
                <Route path="/customer-dashboard" element={<CustomerDashboard />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </OrganizationProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

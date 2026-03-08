import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import {
  Building2, Users, FileText, Brain, Shield, BarChart3,
  CreditCard, Wrench, Bell, MapPin, Car, ClipboardCheck
} from "lucide-react";

const modules = [
  { icon: Building2, title: "Property Management", items: ["Property image gallery", "Google Maps integration", "Building & floor management", "Unit, room & bed space hierarchy", "Amenities checklist"] },
  { icon: Users, title: "Tenant Management", items: ["Emirates ID & passport upload", "Visa & nationality tracking", "Family member registration", "Emergency contacts", "Tenant history"] },
  { icon: FileText, title: "Lease & Ejari", items: ["Ejari contract registration", "Dubai REST API integration", "Lease renewal reminders", "Ejari document upload", "Agreement PDF download"] },
  { icon: CreditCard, title: "Rent & Payments", items: ["Automated rent calculation", "Late fee calculation", "Cheque & PDC tracking", "Security deposit tracking", "Multiple payment gateways"] },
  { icon: BarChart3, title: "VAT & Invoicing", items: ["5% UAE VAT calculation", "Invoice PDF generation", "Bulk & recurring invoices", "Payment receipts", "VAT compliance reports"] },
  { icon: Wrench, title: "Maintenance", items: ["Ticket management", "Priority detection", "Cost estimation", "Vendor assignment", "AI prediction"] },
  { icon: Car, title: "UAE Apartment Features", items: ["Parking allocation", "Visitor management", "Access card management", "Service charges", "Fire safety records"] },
  { icon: ClipboardCheck, title: "Complaints & Notices", items: ["Complaint forms", "Category selection", "Attachment upload", "Status tracking", "PDF generation"] },
  { icon: Bell, title: "Utilities Management", items: ["Meter tracking (DEWA/SEWA)", "Electricity & water readings", "Bill records & upload", "Tenant bill allocation", "Consumption reports"] },
  { icon: Brain, title: "AI Features", items: ["Rent pricing engine", "Occupancy forecasting", "Tenant risk scoring", "Maintenance prediction", "Property insights"] },
  { icon: Shield, title: "Security & Roles", items: ["Role-based access", "Audit logging", "Data encryption", "Multi-tenant isolation", "SSO support"] },
  { icon: MapPin, title: "ERP Integrations", items: ["Oracle NetSuite", "SAP Business One", "Microsoft Dynamics 365", "Odoo & Zoho", "Real-time data sync"] },
];

const FeaturesPage = () => (
  <WebsiteLayout>
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-foreground md:text-5xl">Platform Features</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          A comprehensive suite of tools designed for UAE property managers, landlords, and real estate companies.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <div key={m.title} className="rounded-2xl border border-border/50 bg-card p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <m.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-3">{m.title}</h3>
            <ul className="space-y-1.5">
              {m.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  </WebsiteLayout>
);

export default FeaturesPage;

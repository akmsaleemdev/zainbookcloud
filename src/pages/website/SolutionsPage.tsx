import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Home, Bed, Landmark, ArrowRight } from "lucide-react";

const solutions = [
  {
    icon: Building2,
    title: "Apartment Buildings",
    desc: "Full-stack management for high-rise apartments — from unit tracking and service charges to parking permits, visitor management, and fire safety compliance.",
    features: ["Move-in/out checklists", "Elevator maintenance logs", "Building service charges", "Access card management"],
  },
  {
    icon: Bed,
    title: "Bed Space & Shared Housing",
    desc: "Purpose-built for the UAE's shared accommodation sector with bed-level tracking, occupancy optimization, and per-bed billing.",
    features: ["Bed-level occupancy", "Per-bed invoicing", "Room sharing rules", "AI pricing per bed"],
  },
  {
    icon: Home,
    title: "Villa & Residential Communities",
    desc: "Manage gated communities and villa compounds with amenity tracking, community notices, and maintenance coordination.",
    features: ["Community amenities", "Landscape maintenance", "Security coordination", "Resident portals"],
  },
  {
    icon: Landmark,
    title: "Commercial & Mixed-Use",
    desc: "Handle commercial leases with custom payment terms, VAT-compliant invoicing, and ERP integrations for corporate tenants.",
    features: ["Commercial lease structures", "ERP sync (SAP, Oracle)", "Custom VAT rules", "Bulk invoicing"],
  },
];

const SolutionsPage = () => (
  <WebsiteLayout>
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-foreground md:text-5xl">Solutions for Every Property Type</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Whether you manage apartments, bed spaces, villas, or commercial properties — ZainBook AI adapts to your needs.
        </p>
      </div>

      <div className="space-y-8">
        {solutions.map((s, i) => (
          <div key={s.title} className={`flex flex-col gap-8 rounded-2xl border border-border/50 bg-card p-8 md:flex-row ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
            <div className="flex-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{s.title}</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">{s.desc}</p>
              <ul className="mt-4 grid grid-cols-2 gap-2">
                {s.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-1 w-1 rounded-full bg-primary" />{f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <div className="h-48 w-full rounded-xl bg-secondary/50 border border-border/30 flex items-center justify-center">
                <s.icon className="h-16 w-16 text-muted-foreground/20" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Link to="/auth">
          <Button size="lg" className="gap-2 text-base px-8">
            Start Your Free Trial <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  </WebsiteLayout>
);

export default SolutionsPage;

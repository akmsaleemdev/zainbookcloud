import { Link } from "react-router-dom";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Building2, Users, FileText, Brain, Shield, BarChart3,
  ArrowRight, CheckCircle2, Sparkles, Globe
} from "lucide-react";

const stats = [
  { value: "500+", label: "Properties Managed" },
  { value: "10K+", label: "Tenants Served" },
  { value: "98%", label: "Customer Satisfaction" },
  { value: "7", label: "Emirates Covered" },
];

const features = [
  { icon: Building2, title: "Property Management", desc: "Complete building, unit, room & bed space hierarchy" },
  { icon: Users, title: "Tenant Management", desc: "Emirates ID, visa tracking, family registration" },
  { icon: FileText, title: "Ejari Integration", desc: "Dubai REST API for contract registration & verification" },
  { icon: Brain, title: "AI Insights", desc: "Rent pricing engine, occupancy forecasting, risk scoring" },
  { icon: Shield, title: "Enterprise Security", desc: "Role-based access control, audit logs, data encryption" },
  { icon: BarChart3, title: "Financial Reports", desc: "VAT compliant invoicing, payment tracking, ERP sync" },
];

const trustedBy = [
  "Oracle NetSuite", "SAP", "Microsoft Dynamics", "Odoo", "Zoho"
];

const HomePage = () => (
  <WebsiteLayout>
    {/* Hero */}
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(153_54%_45%/0.08),transparent_60%)]" />
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-36 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs text-primary mb-6">
            <Sparkles className="h-3 w-3" />
            AI-Powered Property Management for UAE
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl leading-[1.1]">
            Manage Properties<br />
            <span className="text-primary">Smarter with AI</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            The enterprise SaaS platform built for UAE real estate — from apartments and bed spaces to Ejari compliance, VAT invoicing, and AI-driven rent optimization.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="gap-2 text-base px-8">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/website/pricing">
              <Button variant="outline" size="lg" className="text-base px-8">View Pricing</Button>
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> 14-day free trial</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> No credit card required</span>
          </div>
        </motion.div>
      </div>
    </section>

    {/* Stats */}
    <section className="border-y border-border/40 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-primary">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Features Grid */}
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-foreground md:text-4xl">Everything You Need to Manage Properties</h2>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Built specifically for the UAE real estate market with full regulatory compliance.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border border-border/50 bg-card p-6 transition-colors hover:border-primary/30">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ERP Integrations */}
    <section className="border-t border-border/40 bg-secondary/20">
      <div className="mx-auto max-w-7xl px-6 py-16 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Integrates with leading ERP systems</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {trustedBy.map((name) => (
            <span key={name} className="text-lg font-semibold text-muted-foreground/60">{name}</span>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="mx-auto max-w-7xl px-6 py-24 text-center">
      <div className="rounded-3xl border border-primary/20 bg-primary/5 p-12 md:p-16">
        <h2 className="text-3xl font-bold text-foreground md:text-4xl">Ready to Transform Your Property Management?</h2>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">Join hundreds of UAE property companies already using ZainBook AI.</p>
        <Link to="/auth">
          <Button size="lg" className="mt-8 gap-2 text-base px-8">
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  </WebsiteLayout>
);

export default HomePage;

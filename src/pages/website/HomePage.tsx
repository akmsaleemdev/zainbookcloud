import { Link } from "react-router-dom";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Building2, Users, FileText, Brain, Shield, BarChart3,
  ArrowRight, CheckCircle2, Sparkles, Globe, Star, Zap,
  Clock, Lock, CreditCard, Headphones
} from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const stats = [
  { value: "500+", label: "Properties Managed" },
  { value: "10K+", label: "Tenants Served" },
  { value: "98%", label: "Customer Satisfaction" },
  { value: "7", label: "Emirates Covered" },
];

const features = [
  { icon: Building2, title: "Property Management", desc: "Complete building, unit, room & bed space hierarchy with floor plans" },
  { icon: Users, title: "Tenant Management", desc: "Emirates ID, visa tracking, family registration with document expiry alerts" },
  { icon: FileText, title: "Ejari Integration", desc: "Dubai REST API for contract registration & automated compliance verification" },
  { icon: Brain, title: "AI Insights", desc: "Market rent pricing, occupancy forecasting, and tenant risk scoring" },
  { icon: Shield, title: "Enterprise Security", desc: "RBAC with 8 role types, audit logs, encrypted data, and SOC2-ready" },
  { icon: BarChart3, title: "Financial Reports", desc: "5% VAT invoicing, cheque tracking, payment receipts, and ERP sync" },
];

const benefits = [
  { icon: Clock, title: "Save 10+ Hours/Week", desc: "Automate rent reminders, invoice generation, and lease renewals" },
  { icon: Lock, title: "UAE Compliant", desc: "Built-in Ejari, RERA, and DLD compliance for all 7 emirates" },
  { icon: CreditCard, title: "Reduce Late Payments", desc: "Automated PDC tracking, payment reminders, and late fee calculation" },
  { icon: Headphones, title: "AI Support 24/7", desc: "Intelligent chatbot handles tenant queries and escalates when needed" },
];

const testimonials = [
  {
    quote: "PropAI reduced our property management overhead by 60%. The Ejari integration alone saves us 5 hours every week.",
    name: "Ahmed Al Rashid",
    role: "Property Director, Gulf Estates",
    rating: 5,
  },
  {
    quote: "Managing 200+ bed spaces across Dubai was a nightmare. Now it's fully automated — rent collection, maintenance, everything.",
    name: "Sarah Johnson",
    role: "Operations Manager, Metro Living",
    rating: 5,
  },
  {
    quote: "The AI rent pricing helped us optimize occupancy from 78% to 96% in just 3 months. Incredible ROI.",
    name: "Mohammad Al Maktoum",
    role: "CEO, Prime Properties LLC",
    rating: 5,
  },
];

const trustedBy = ["Oracle NetSuite", "SAP", "Microsoft Dynamics", "Odoo", "Zoho"];

const HomePage = () => (
  <WebsiteLayout>
    {/* Hero */}
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(153_54%_45%/0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(153_54%_45%/0.04),transparent_40%)]" />
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-36 relative">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs text-primary mb-6">
            <Sparkles className="h-3 w-3" />
            AI-Powered Property Management for UAE
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl leading-[1.1]">
            Manage Properties<br />
            <span className="text-primary">Smarter with AI</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            The enterprise SaaS platform built for UAE real estate — from apartments and bed spaces to Ejari compliance, VAT invoicing, and AI-driven rent optimization.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="gap-2 text-base px-8">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/website/pricing">
              <Button variant="outline" size="lg" className="text-base px-8">View Pricing</Button>
            </Link>
          </motion.div>
          <motion.div variants={fadeUp} className="mt-6 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> 14-day free trial</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> No credit card required</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Setup in 5 minutes</span>
          </motion.div>
        </motion.div>
      </div>
    </section>

    {/* Stats */}
    <section className="border-y border-border/40 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="text-center">
              <p className="text-3xl font-bold text-primary">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* Features Grid */}
    <section className="mx-auto max-w-7xl px-6 py-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
        <motion.h2 variants={fadeUp} className="text-3xl font-bold text-foreground md:text-4xl">Everything You Need to Manage Properties</motion.h2>
        <motion.p variants={fadeUp} className="mt-4 text-muted-foreground max-w-xl mx-auto">Built specifically for the UAE real estate market with full regulatory compliance.</motion.p>
      </motion.div>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <motion.div key={f.title} variants={fadeUp} className="group rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-[0_0_30px_-10px_hsl(153_54%_45%/0.15)]">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>

    {/* Benefits */}
    <section className="border-y border-border/40 bg-secondary/20">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs text-primary mb-4">
              <Zap className="h-3 w-3" /> Why PropAI?
            </div>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">Built for UAE Property Managers</h2>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => (
              <motion.div key={b.title} variants={fadeUp} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>

    {/* Testimonials */}
    <section className="mx-auto max-w-7xl px-6 py-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
        <motion.div variants={fadeUp} className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">Trusted by UAE Property Leaders</h2>
          <p className="mt-4 text-muted-foreground">See what our customers are saying</p>
        </motion.div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <motion.div key={t.name} variants={fadeUp} className="rounded-2xl border border-border/50 bg-card p-6">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.quote}"</p>
              <div className="mt-4 pt-4 border-t border-border/30">
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
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
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-3xl border border-primary/20 bg-primary/5 p-12 md:p-16">
        <h2 className="text-3xl font-bold text-foreground md:text-4xl">Ready to Transform Your Property Management?</h2>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">Join hundreds of UAE property companies already using PropAI.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link to="/auth">
            <Button size="lg" className="gap-2 text-base px-8">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/website/contact">
            <Button variant="outline" size="lg" className="text-base px-8">Talk to Sales</Button>
          </Link>
        </div>
      </motion.div>
    </section>
  </WebsiteLayout>
);

export default HomePage;

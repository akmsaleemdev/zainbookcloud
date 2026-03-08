import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { Shield, Brain, Globe, Users } from "lucide-react";

const values = [
  { icon: Shield, title: "Security First", desc: "Enterprise-grade encryption, role-based access control, and full data isolation for every tenant." },
  { icon: Brain, title: "AI-Powered", desc: "Built-in artificial intelligence for rent optimization, maintenance prediction, and tenant risk scoring." },
  { icon: Globe, title: "UAE-Native", desc: "Designed for the UAE market — Ejari integration, DEWA/SEWA utilities, Emirates ID, and VAT compliance." },
  { icon: Users, title: "Customer-Centric", desc: "24/7 AI support, dedicated account managers, and a platform that scales with your portfolio." },
];

const AboutPage = () => (
  <WebsiteLayout>
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-foreground md:text-5xl">About ZainBook AI</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          We're building the future of property management in the UAE — powered by artificial intelligence and designed for enterprise scale.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 mb-16">
        <div className="rounded-2xl border border-border/50 bg-card p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed">
            To empower every property management company in the UAE with intelligent, cloud-native tools that eliminate manual work, ensure regulatory compliance, and maximize portfolio performance through AI-driven insights.
          </p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Our Vision</h2>
          <p className="text-muted-foreground leading-relaxed">
            To become the default property management operating system for the Middle East — a platform where every landlord, property manager, and tenant interacts through a single, intelligent ecosystem.
          </p>
        </div>
      </div>

      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground">Our Values</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {values.map((v) => (
          <div key={v.title} className="rounded-2xl border border-border/50 bg-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <v.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground">{v.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
          </div>
        ))}
      </div>
    </section>
  </WebsiteLayout>
);

export default AboutPage;

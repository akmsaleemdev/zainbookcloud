import { useState } from "react";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CreditCard, Globe, Shield, Zap } from "lucide-react";

const gateways = [
  {
    id: "stripe",
    name: "Stripe",
    desc: "Global payment processing with support for cards, Apple Pay, Google Pay, and 135+ currencies.",
    region: "Global",
    features: ["Cards & wallets", "Recurring billing", "3D Secure", "Instant payouts"],
    status: "available" as const,
  },
  {
    id: "paytabs",
    name: "PayTabs",
    desc: "Leading MENA payment gateway with local acquiring and multi-currency support for the Gulf region.",
    region: "MENA",
    features: ["Local acquiring", "Tokenization", "Fraud detection", "Multi-currency"],
    status: "available" as const,
  },
  {
    id: "checkout",
    name: "Checkout.com",
    desc: "Enterprise-grade payment infrastructure used by major brands with high approval rates in the UAE.",
    region: "Global + MENA",
    features: ["High approval rates", "Local processing", "Real-time reporting", "Smart routing"],
    status: "available" as const,
  },
  {
    id: "telr",
    name: "Telr",
    desc: "UAE-based payment gateway designed specifically for Middle Eastern e-commerce and subscription businesses.",
    region: "UAE / GCC",
    features: ["UAE-focused", "Subscription billing", "Multi-language", "Social commerce"],
    status: "available" as const,
  },
  {
    id: "amazon",
    name: "Amazon Payment Services",
    desc: "Formerly Payfort — Amazon's MENA payment platform with extensive local payment method support.",
    region: "MENA",
    features: ["SADAD / KNET", "Installments", "Hosted checkout", "Tokenization"],
    status: "available" as const,
  },
  {
    id: "network",
    name: "Network International",
    desc: "The largest payment processor in the Middle East & Africa with deep UAE banking integrations.",
    region: "MEA",
    features: ["Direct bank integration", "POS & online", "Loyalty programs", "Settlement in AED"],
    status: "available" as const,
  },
];

const PaymentGatewaysPage = () => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <WebsiteLayout>
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs text-primary mb-6">
            <CreditCard className="h-3 w-3" /> Payment Infrastructure
          </div>
          <h1 className="text-4xl font-bold text-foreground md:text-5xl">Payment Gateways</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Accept payments through 6 leading gateways — optimized for the UAE and MENA region.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {gateways.map((gw) => (
            <Card
              key={gw.id}
              className={`cursor-pointer transition-all ${
                selected === gw.id
                  ? "border-primary ring-1 ring-primary/20"
                  : "border-border/50 hover:border-primary/30"
              }`}
              onClick={() => setSelected(gw.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-foreground">{gw.name}</h3>
                  <Badge variant="secondary" className="text-xs">{gw.region}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{gw.desc}</p>
                <ul className="space-y-1.5 mb-4">
                  {gw.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-2">
                  <Badge className="bg-success/10 text-success border-0 text-xs">
                    <Zap className="h-3 w-3 mr-1" /> Ready
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-16 grid gap-4 md:grid-cols-3 text-center">
          <div className="rounded-2xl border border-border/50 bg-card p-6">
            <Shield className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">PCI DSS Compliant</p>
            <p className="text-xs text-muted-foreground mt-1">All gateways meet Level 1 PCI compliance</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-6">
            <Globe className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Multi-Currency</p>
            <p className="text-xs text-muted-foreground mt-1">Accept AED, USD, EUR, GBP and 100+ currencies</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-6">
            <CreditCard className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">3D Secure</p>
            <p className="text-xs text-muted-foreground mt-1">Enhanced security with 3D Secure 2.0 support</p>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
};

export default PaymentGatewaysPage;

import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features", path: "/website/features" },
    { label: "Pricing", path: "/website/pricing" },
    { label: "Solutions", path: "/website/solutions" },
  ],
  Company: [
    { label: "About", path: "/website/about" },
    { label: "Contact", path: "/website/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", path: "#" },
    { label: "Terms of Service", path: "#" },
  ],
};

export const WebsiteFooter = forwardRef<HTMLElement>((_, ref) => (
  <footer ref={ref} className="border-t border-border/40 bg-background">
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">ZainBook AI</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AI-powered property management platform built for the UAE real estate market.
          </p>
        </div>
        {Object.entries(footerLinks).map(([group, links]) => (
          <div key={group}>
            <h4 className="mb-3 text-sm font-semibold text-foreground">{group}</h4>
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.label}>
                  <Link to={l.path} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-12 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ZainBook AI. All rights reserved.
      </div>
    </div>
  </footer>
));

WebsiteFooter.displayName = "WebsiteFooter";

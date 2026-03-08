import { useState, forwardRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";

const navLinks = [
  { label: "Home", path: "/website" },
  { label: "Features", path: "/website/features" },
  { label: "Pricing", path: "/website/pricing" },
  { label: "Solutions", path: "/website/solutions" },
  { label: "About", path: "/website/about" },
  { label: "Contact", path: "/website/contact" },
];

export const WebsiteNav = forwardRef<HTMLElement>((_, ref) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <nav ref={ref} className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/website" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">ZainBook AI</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.path}
              to={l.path}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                location.pathname === l.path
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/auth">
            <Button variant="ghost" size="sm">Log In</Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="gap-1.5">Get Started</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border/40 bg-background px-6 py-4 md:hidden">
          {navLinks.map((l) => (
            <Link
              key={l.path}
              to={l.path}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-2">
            <Link to="/auth"><Button variant="outline" className="w-full">Log In</Button></Link>
            <Link to="/auth"><Button className="w-full">Get Started</Button></Link>
          </div>
        </div>
      )}
    </nav>
  );
};

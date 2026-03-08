import { WebsiteNav } from "./WebsiteNav";
import { WebsiteFooter } from "./WebsiteFooter";

export const WebsiteLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <WebsiteNav />
    <main className="pt-16">{children}</main>
    <WebsiteFooter />
  </div>
);

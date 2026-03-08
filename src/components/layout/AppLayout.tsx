import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -right-[20%] w-[800px] h-[800px] bg-primary/[0.03] rounded-full blur-[120px]" />
        <div className="absolute -bottom-[30%] -left-[10%] w-[600px] h-[600px] bg-info/[0.02] rounded-full blur-[100px]" />
      </div>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

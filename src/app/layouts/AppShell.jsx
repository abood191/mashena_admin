import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="flex">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div className="flex-1 min-w-0">
          <Topbar onOpenMobile={() => setMobileOpen(true)} />

          <main className="p-4 lg:p-6">
            {/* Content container */}
            <div className="rounded-3xl border border-border-subtle bg-surface p-4 lg:p-6 transition-colors duration-300">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

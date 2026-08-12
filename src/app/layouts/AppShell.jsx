import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useIsFetching } from "@tanstack/react-query";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isFetching = useIsFetching();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    setNavigating(true);
    const timer = setTimeout(() => setNavigating(false), 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const isLoading = navigating || isFetching > 0;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 relative">
      {/* Top Route & Data Loading Indicator Bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-[100] h-1 transition-opacity duration-300 pointer-events-none ${
          isLoading ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-full bg-gradient-to-r from-[#4880FF] via-indigo-500 to-[#4880FF] animate-pulse w-full origin-left"></div>
      </div>

      <div className="flex">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div className="flex-1 min-w-0">
          <Topbar onOpenMobile={() => setMobileOpen(true)} isLoading={isLoading} />

          <main className="p-3 sm:p-4 lg:p-6 relative">
            {/* Content container */}
            <div className="rounded-3xl border border-border-subtle bg-surface p-3 sm:p-4 lg:p-6 transition-colors duration-300 relative overflow-hidden">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}


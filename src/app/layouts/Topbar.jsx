import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { Menu, Search, Globe, Moon, Sun, User, X, Loader2 } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";

const ACTIVE = "#4880FF";

export default function Topbar({ onOpenMobile, isLoading }) {
  const { i18n, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const isRtl = i18n.language === "ar";

  const toggleLanguage = () => {
    const nextLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(nextLang);
    localStorage.setItem("lang", nextLang);
    document.documentElement.dir = nextLang === "ar" ? "rtl" : "ltr";
  };

  return (
    <header className="h-16 bg-surface border-b border-border-subtle flex items-center justify-between px-3 sm:px-4 lg:px-6 transition-colors duration-300 gap-2 shrink-0">
      {/* Left side: Hamburger + Search */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Mobile menu toggle */}
        <button
          onClick={onOpenMobile}
          className="lg:hidden h-10 w-10 shrink-0 rounded-2xl border border-border-subtle bg-foreground/5 hover:bg-foreground/10 text-foreground flex items-center justify-center transition-all"
          title="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Search Bar - Desktop & Tablet */}
        <div className="hidden sm:block flex-1 max-w-[540px]">
          <div className="relative">
            <input
              type="text"
              placeholder={t("topbar.search")}
              className="w-full rounded-2xl border border-border-subtle bg-background px-4 py-2 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:border-[#4880FF]/70 focus:ring-4 focus:ring-[#4880FF]/10 transition"
            />
            <div className={`absolute top-1/2 -translate-y-1/2 h-7 w-7 rounded-xl bg-foreground/5 grid place-items-center text-foreground/50 ${isRtl ? 'left-2' : 'right-2'}`}>
              <Search size={15} />
            </div>
          </div>
        </div>

        {/* Mobile Search Button toggle */}
        <button
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          className="sm:hidden h-10 w-10 shrink-0 rounded-2xl border border-border-subtle bg-foreground/5 hover:bg-foreground/10 text-foreground flex items-center justify-center transition-all"
          title="Search"
        >
          {mobileSearchOpen ? <X size={18} /> : <Search size={18} />}
        </button>

        {/* Global Loading Badge Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#4880FF]/10 text-[#4880FF] border border-[#4880FF]/30 text-xs font-bold animate-pulse shrink-0">
            <Loader2 size={14} className="animate-spin" />
            <span className="hidden sm:inline">Loading...</span>
          </div>
        )}
      </div>

      {/* Mobile expandable search bar */}
      {mobileSearchOpen && (
        <div className="absolute top-16 left-0 right-0 p-3 bg-surface border-b border-border-subtle sm:hidden shadow-lg z-30 animate-in slide-in-from-top-2 duration-200">
          <div className="relative">
            <input
              type="text"
              autoFocus
              placeholder={t("topbar.search")}
              className="w-full rounded-2xl border border-border-subtle bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:border-[#4880FF]/70 focus:ring-4 focus:ring-[#4880FF]/10 transition"
            />
            <div className={`absolute top-1/2 -translate-y-1/2 h-7 w-7 rounded-xl bg-foreground/5 grid place-items-center text-foreground/50 ${isRtl ? 'left-3' : 'right-3'}`}>
              <Search size={15} />
            </div>
          </div>
        </div>
      )}

      {/* Right side: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Notifications */}
        <NotificationDropdown />

        {/* 🌐 Language switch */}
        <button
          onClick={toggleLanguage}
          className="h-10 px-2.5 sm:px-3 shrink-0 rounded-2xl border border-border-subtle bg-foreground/5 hover:bg-foreground/10 text-foreground flex items-center gap-1.5 transition-all"
          title="Change language"
        >
          <Globe size={16} />
          <span className="text-xs font-bold tracking-wider">
            {i18n.language === "en" ? "AR" : "EN"}
          </span>
        </button>

        {/* Theme switch */}
        <button
          onClick={toggleTheme}
          className="h-10 w-10 shrink-0 rounded-2xl border border-border-subtle bg-foreground/5 hover:bg-foreground/10 text-foreground flex items-center justify-center transition-all"
          title="Toggle theme"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-border-subtle mx-0.5 hidden sm:block" />

        {/* Profile */}
        <button className="flex items-center gap-2.5 rounded-2xl border border-border-subtle bg-foreground/5 hover:bg-foreground/10 px-2.5 py-1.5 sm:px-3 sm:py-2 transition-all">
          <div
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl grid place-items-center text-xs sm:text-sm font-bold shrink-0"
            style={{ background: `${ACTIVE}22`, color: ACTIVE }}
          >
            A
          </div>
          <div className="hidden md:block text-start">
            <div className="text-xs sm:text-sm font-semibold text-foreground leading-4">Admin</div>
            <div className="text-[10px] text-foreground/50">Manager</div>
          </div>
        </button>
      </div>
    </header>
  );
}

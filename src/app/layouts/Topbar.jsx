import { useTranslation } from "react-i18next";

const ACTIVE = "#4880FF";

export default function Topbar({ onOpenMobile }) {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === "en" ? "ar" : "en";

    i18n.changeLanguage(nextLang);
    localStorage.setItem("lang", nextLang);

    // RTL / LTR
    document.documentElement.dir = nextLang === "ar" ? "rtl" : "ltr";
  };

  return (
    <header className="h-16 bg-[#0b1220] border-b border-white/10 flex items-center px-4 lg:px-6">
      {/* Mobile menu */}
      <button
        onClick={onOpenMobile}
        className="lg:hidden h-10 w-10 rounded-2xl border border-white/10
        bg-white/[0.03] hover:bg-white/[0.06] text-white/80
        flex items-center justify-center"
        title="Open menu"
      >
        ☰
      </button>

      {/* Search */}
      <div className="ml-3 lg:ml-0 flex-1 max-w-[720px]">
        <div className="relative">
          <input
            type="text"
            placeholder={t("topbar.search")}
            className="
              w-full rounded-2xl border border-white/10
              bg-[#0f1a2f]/70 px-4 py-2.5 pr-12
              text-sm text-white placeholder:text-white/35
              outline-none focus:border-[#4880FF]/70
              focus:ring-4 focus:ring-[#4880FF]/10
            "
          />
          <div
            className="
              absolute right-2 top-1/2 -translate-y-1/2
              h-9 w-9 rounded-xl border border-white/10
              bg-white/[0.03] grid place-items-center
              text-white/60
            "
          >
            ⌕
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="ml-4 flex items-center gap-2">
        {/* Notifications */}
        <button
          className="
            relative h-10 w-10 rounded-2xl border border-white/10
            bg-white/[0.03] hover:bg-white/[0.06]
            text-white/70 flex items-center justify-center
          "
          title="Notifications"
        >
          🔔
          <span
            className="
              absolute -top-1 -right-1 h-4 w-4 rounded-full
              text-[10px] grid place-items-center
              bg-[#4880FF] text-white
            "
          >
            3
          </span>
        </button>

        {/* 🌐 Language switch */}
        <button
          onClick={toggleLanguage}
          className="
            h-10 px-3 rounded-2xl border border-white/10
            bg-white/[0.03] hover:bg-white/[0.06]
            text-white/70 flex items-center gap-2
          "
          title="Change language"
        >
          🌐
          <span className="text-xs font-medium">
            {i18n.language === "en" ? "AR" : "EN"}
          </span>
        </button>

        {/* Divider */}
        <div className="h-10 w-px bg-white/10 mx-1 hidden sm:block" />

        {/* Profile */}
        <button
          className="
            flex items-center gap-3 rounded-2xl
            border border-white/10 bg-white/[0.03]
            hover:bg-white/[0.06] px-3 py-2
          "
        >
          <div
            className="
              h-8 w-8 rounded-xl
              grid place-items-center text-sm font-semibold
            "
            style={{ background: `${ACTIVE}22`, color: ACTIVE }}
          >
            A
          </div>

          <div className="hidden sm:block text-left">
            <div className="text-sm text-white leading-4">Admin</div>
            <div className="text-xs text-white/45">Manager</div>
          </div>
        </button>
      </div>
    </header>
  );
}

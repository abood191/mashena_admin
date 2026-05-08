import { NavLink, useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "../config/nav";
import { useAuth } from "../auth/authContext";
import { useTranslation } from "react-i18next";

const ACTIVE = "#4880FF";

export default function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}) {
  const { logout } = useAuth();
  const nav = useNavigate();
  const { t } = useTranslation();

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onCloseMobile}
      />

      <aside
        className={[
          "fixed z-50 lg:z-auto lg:static inset-y-0 left-0",
          "bg-[#0b1220] border-r border-white/10",
          "transition-all duration-200",
          collapsed ? "w-[88px]" : "w-[280px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 rounded-2xl bg-white/[0.04] border border-white/10 grid place-items-center">
              <span className="text-white/80 font-semibold">M</span>
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <div className="text-white font-semibold leading-5 truncate">
                  {t("sidebar.brand")}
                </div>
                <div className="text-xs text-white/45 truncate">
                  {t("sidebar.subtitle")}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapsed}
            className="hidden lg:inline-flex h-9 w-9 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/70 items-center justify-center"
            title={t("sidebar.collapse")}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => ( 
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm",
                  "border",
                  isActive
                    ? "bg-white/[0.06] text-white border-white/10"
                    : "border-transparent text-white/70 hover:text-white hover:bg-white/[0.04]",
                ].join(" ")
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      borderColor: `${ACTIVE}55`,
                      boxShadow: `inset 0 0 0 1px ${ACTIVE}25`,
                    }
                  : undefined
              }
            >
              <span
                className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.03] grid place-items-center text-xs group-hover:scale-115 transition-transform
"
                style={{ color: ACTIVE }}
              >
              { item.icon && <item.icon className="h-4 w-4" /> }
              </span>

              {!collapsed && (
                <span className="flex-1 truncate">{t(item.labelKey)}</span>
              )}

              <span className="h-2 w-2 rounded-full" style={{ background: "transparent" }} />
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <button
            onClick={() => {
              logout();
              nav("/login", { replace: true });
            }}
            className="w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-white/70 hover:text-white hover:bg-white/[0.04]"
          >
            <span className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.03] grid place-items-center text-xs">
              ⎋
            </span>
            {!collapsed && <span>{t("sidebar.logout")}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

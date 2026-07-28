import { NavLink, useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "../config/nav";
import { useAuth } from "../auth/authContext";
import { useRBAC } from "../auth/rbac/useRBAC";
import { useTranslation } from "react-i18next";

const ACTIVE = "#4880FF";

export default function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}) {
  const { logout } = useAuth();
  const { hasAnyPermission } = useRBAC();
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
          "bg-surface border-r border-border-subtle",
          "transition-all duration-300",
          collapsed ? "w-[88px]" : "w-[280px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-border-subtle">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 rounded-2xl bg-foreground/5 border border-border-subtle grid place-items-center">
              <span className="text-muted font-semibold">M</span>
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <div className="text-foreground font-semibold leading-5 truncate">
                  {t("sidebar.brand")}
                </div>
                <div className="text-xs text-muted truncate">
                  {t("sidebar.subtitle")}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapsed}
            className="hidden lg:inline-flex h-9 w-9 rounded-xl border border-border-subtle bg-foreground/5 hover:bg-foreground/10 text-muted items-center justify-center"
            title={t("sidebar.collapse")}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4 space-y-1">
          {NAV_ITEMS.filter(item => !item.permissions || hasAnyPermission(item.permissions)).map((item) => ( 
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm",
                  "border",
                  isActive
                    ? "bg-foreground/10 text-foreground border-border-subtle"
                    : "border-transparent text-gray-500 hover:text-foreground hover:bg-foreground/5",
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
                className="h-9 w-9 rounded-xl  border border-border-subtle bg-foreground/5 grid place-items-center text-xs group-hover:scale-115 transition-transform"
                style={{ color: ACTIVE }}
              >
              { item.icon && <item.icon className="h-4 w-4" /> }
              </span>

              {!collapsed && (
                <span className="flex-1  truncate">{t(item.labelKey)}</span>
              )}

              <span className="h-2 w-2 rounded-full" style={{ background: "transparent" }} />
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="bottom-0 left-0 right-0 p-3 border-t border-border-subtle">
          <button
            onClick={() => {
              logout();
              nav("/login", { replace: true });
            }}
            className="w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-muted hover:text-foreground hover:bg-foreground/5"
          >
            <span className="h-9 w-9 rounded-xl border border-border-subtle bg-foreground/5 grid place-items-center text-xs">
              ⎋
            </span>
            {!collapsed && <span>{t("sidebar.logout")}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

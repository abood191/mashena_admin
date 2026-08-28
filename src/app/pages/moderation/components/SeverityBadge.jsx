/**
 * SeverityBadge
 * Displays violation/penalty severity: LOW | MEDIUM | HIGH | CRITICAL
 */

const SEVERITY_CONFIG = {
  LOW: {
    label: "Low",
    icon: "↓",
    className: "bg-foreground/5 text-foreground/60 border-border-subtle",
  },
  MEDIUM: {
    label: "Medium",
    icon: "⚠",
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
  },
  HIGH: {
    label: "High",
    icon: "▲",
    className: "bg-orange-500/10 text-orange-400 border-orange-500/25",
  },
  CRITICAL: {
    label: "Critical",
    icon: "🔴",
    className: "bg-red-500/15 text-red-400 border-red-500/30 animate-pulse",
  },
};

/**
 * @param {{ severity: string, size?: 'sm'|'md', showIcon?: boolean }} props
 */
export function SeverityBadge({ severity, size = "sm", showIcon = true }) {
  const cfg = SEVERITY_CONFIG[severity] ?? {
    label: severity,
    icon: "•",
    className: "bg-foreground/5 text-foreground/50 border-border-subtle",
  };

  const sizeClass =
    size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[10px]";

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-full border ${sizeClass} ${cfg.className}`}
    >
      {showIcon && <span className="text-[9px]">{cfg.icon}</span>}
      {cfg.label}
    </span>
  );
}

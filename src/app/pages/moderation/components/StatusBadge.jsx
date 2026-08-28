/**
 * StatusBadge
 * Unified badge for all moderation statuses:
 * Penalty: ACTIVE | EXPIRED | REVOKED | CANCELLED
 * Restriction: ACTIVE | EXPIRED | REVOKED
 * Appeal: PENDING | UNDER_REVIEW | APPROVED | REJECTED | CANCELLED
 * Account: ACTIVE | WARNING | RESTRICTED | SUSPENDED | BANNED
 * Violation: RECORDED | PROCESSED | DISMISSED
 */

const CONFIG = {
  // Penalty / Restriction statuses
  ACTIVE: {
    label: "Active",
    labelAr: "نشط",
    className:
      "bg-green-500/10 text-green-500 border-green-500/25 ring-green-500/10",
    dot: "bg-green-500",
    pulse: true,
  },
  EXPIRED: {
    label: "Expired",
    labelAr: "منتهية",
    className: "bg-foreground/5 text-foreground/50 border-border-subtle",
    dot: "bg-foreground/30",
    pulse: false,
  },
  REVOKED: {
    label: "Revoked",
    labelAr: "ملغاة",
    className:
      "bg-orange-500/10 text-orange-400 border-orange-500/25",
    dot: "bg-orange-400",
    pulse: false,
  },
  CANCELLED: {
    label: "Cancelled",
    labelAr: "ملغى",
    className: "bg-foreground/5 text-foreground/40 border-border-subtle",
    dot: "bg-foreground/20",
    pulse: false,
  },

  // Appeal statuses
  PENDING: {
    label: "Pending",
    labelAr: "قيد الانتظار",
    className:
      "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
    dot: "bg-yellow-400",
    pulse: true,
  },
  UNDER_REVIEW: {
    label: "Under Review",
    labelAr: "قيد المراجعة",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/25",
    dot: "bg-blue-400",
    pulse: true,
  },
  APPROVED: {
    label: "Approved",
    labelAr: "موافق عليه",
    className:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    dot: "bg-emerald-400",
    pulse: false,
  },
  REJECTED: {
    label: "Rejected",
    labelAr: "مرفوض",
    className: "bg-red-500/10 text-red-400 border-red-500/25",
    dot: "bg-red-400",
    pulse: false,
  },

  // Account statuses
  WARNING: {
    label: "Warning",
    labelAr: "تحذير",
    className:
      "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
    dot: "bg-yellow-400",
    pulse: false,
  },
  RESTRICTED: {
    label: "Restricted",
    labelAr: "مقيّد",
    className:
      "bg-orange-500/10 text-orange-400 border-orange-500/25",
    dot: "bg-orange-400",
    pulse: true,
  },
  SUSPENDED: {
    label: "Suspended",
    labelAr: "موقوف",
    className: "bg-red-500/10 text-red-500 border-red-500/25",
    dot: "bg-red-500",
    pulse: true,
  },
  BANNED: {
    label: "Banned",
    labelAr: "محظور",
    className:
      "bg-red-900/20 text-red-400 border-red-800/40",
    dot: "bg-red-400",
    pulse: false,
  },

  // Violation statuses
  RECORDED: {
    label: "Recorded",
    labelAr: "مسجّلة",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/25",
    dot: "bg-blue-400",
    pulse: false,
  },
  PROCESSED: {
    label: "Processed",
    labelAr: "معالجة",
    className:
      "bg-purple-500/10 text-purple-400 border-purple-500/25",
    dot: "bg-purple-400",
    pulse: false,
  },
  DISMISSED: {
    label: "Dismissed",
    labelAr: "مرفوضة",
    className: "bg-foreground/5 text-foreground/40 border-border-subtle",
    dot: "bg-foreground/20",
    pulse: false,
  },
};

/**
 * @param {{ status: string, size?: 'sm'|'md', showDot?: boolean, className?: string }} props
 */
export function StatusBadge({ status, size = "sm", showDot = true, className = "" }) {
  const cfg = CONFIG[status] ?? {
    label: status,
    labelAr: status,
    className: "bg-foreground/5 text-foreground/50 border-border-subtle",
    dot: "bg-foreground/30",
    pulse: false,
  };

  const sizeClass = size === "md"
    ? "px-3 py-1 text-xs"
    : "px-2.5 py-0.5 text-[10px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border ${sizeClass} ${cfg.className} ${className}`}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5">
          {cfg.pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg.dot}`} />
        </span>
      )}
      {cfg.label}
    </span>
  );
}

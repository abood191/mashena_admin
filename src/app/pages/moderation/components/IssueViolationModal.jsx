import { useState } from "react";
import { Loader2, X, AlertTriangle, FilePlus } from "lucide-react";
import { useTranslation } from "react-i18next";

const VIOLATION_TYPES = [
  "RIDER_TRIP_CANCELLATION",
  "DRIVER_TRIP_CANCELLATION",
  "NO_SHOW",
  "LATE_CANCELLATION",
  "SHARED_RIDE_MISUSE",
  "PASSENGER_POOL_MISUSE",
  "PAYMENT_ABUSE",
  "WALLET_ABUSE",
  "ABUSIVE_BEHAVIOR",
  "FRAUD",
  "MANUAL_ADMIN_VIOLATION",
];

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const TARGET_ROLES = ["RIDER", "DRIVER", "BOTH"];
const SOURCE_TYPES = ["TRIP", "PAYMENT", "APPEAL", "SUPPORT_TICKET", "OTHER"];

const SEVERITY_COLORS = {
  LOW: "border-foreground/20 text-foreground/60",
  MEDIUM: "border-yellow-500/40 text-yellow-400",
  HIGH: "border-orange-500/40 text-orange-400",
  CRITICAL: "border-red-500/40 text-red-400",
};

const INITIAL_FORM = {
  targetRole: "DRIVER",
  violationType: "DRIVER_TRIP_CANCELLATION",
  source: "ADMIN",
  severity: "MEDIUM",
  description: "",
  sourceType: "",
  sourceId: "",
};

/**
 * IssueViolationModal — record a manual violation.
 * userId is passed from the parent (User Detail context).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onSubmit: (data: object) => void,
 *   isPending: boolean,
 *   userId: number,
 *   defaultRole?: 'DRIVER' | 'RIDER',
 * }} props
 */
export function IssueViolationModal({
  open,
  onClose,
  onSubmit,
  isPending,
  userId,
  defaultRole = "DRIVER",
}) {
  const { t } = useTranslation("common");
  const [form, setForm] = useState({
    ...INITIAL_FORM,
    targetRole: defaultRole,
    violationType:
      defaultRole === "DRIVER"
        ? "DRIVER_TRIP_CANCELLATION"
        : "RIDER_TRIP_CANCELLATION",
  });

  if (!open) return null;

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    if (!form.description.trim()) return;
    const payload = {
      userId,
      targetRole: form.targetRole,
      violationType: form.violationType,
      source: "ADMIN",
      severity: form.severity,
      description: form.description.trim(),
      ...(form.sourceType && { sourceType: form.sourceType }),
      ...(form.sourceId && { sourceId: form.sourceId }),
    };
    onSubmit(payload);
  };

  const handleClose = () => {
    if (isPending) return;
    setForm({ ...INITIAL_FORM, targetRole: defaultRole });
    onClose();
  };

  const isValid = form.description.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[999]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="absolute inset-0 grid place-items-center p-4 pointer-events-none overflow-y-auto">
        <div className="w-full max-w-[560px] my-4 rounded-3xl border border-border-subtle bg-surface shadow-[0_24px_80px_-30px_rgba(0,0,0,0.75)] overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400">
                <FilePlus size={18} />
              </div>
              <div>
                <h3 className="text-foreground font-bold text-base">
                  {t("issueViolationModal.title")}
                </h3>
                <p className="text-xs text-foreground/50 mt-0.5">
                  {t("issueViolationModal.subtitle")}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isPending}
              className="p-2 rounded-xl hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-all disabled:opacity-30"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Notice */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-yellow-500/5 border border-yellow-500/15">
              <AlertTriangle
                size={15}
                className="text-yellow-400 mt-0.5 shrink-0"
              />
              <p className="text-xs text-foreground/60">
                {t("issueViolationModal.notice")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Target Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">
                  {t("issueViolationModal.targetRole")}
                </label>
                <select
                  value={form.targetRole}
                  onChange={(e) => set("targetRole", e.target.value)}
                  className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all cursor-pointer [&>option]:bg-white [&>option]:text-[#0f172a] dark:[&>option]:bg-[#0b1220] dark:[&>option]:text-white"
                >
                  {TARGET_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0) + r.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">
                  {t("issueViolationModal.severity")}
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set("severity", s)}
                      className={`py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
                        form.severity === s
                          ? `${SEVERITY_COLORS[s]} bg-foreground/10`
                          : "border-border-subtle text-foreground/30 bg-foreground/[0.03] hover:bg-foreground/5"
                      }`}
                    >
                      {s === "CRITICAL" ? t("issueViolationModal.crit") : s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Violation Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">
                {t("issueViolationModal.violationType")}
              </label>
              <select
                value={form.violationType}
                onChange={(e) => set("violationType", e.target.value)}
                className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all cursor-pointer [&>option]:bg-white [&>option]:text-[#0f172a] dark:[&>option]:bg-[#0b1220] dark:[&>option]:text-white"
              >
                {VIOLATION_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {v.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">
                {t("issueViolationModal.description")} <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder={t("issueViolationModal.descriptionPlaceholder")}
                className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all resize-none text-sm"
              />
            </div>

            {/* Source fields (optional) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">
                  {t("issueViolationModal.sourceType")}{" "}
                  <span className="text-foreground/20 font-normal normal-case">
                    {t("issueViolationModal.optional")}
                  </span>
                </label>
                <select
                  value={form.sourceType}
                  onChange={(e) => set("sourceType", e.target.value)}
                  className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all cursor-pointer [&>option]:bg-white [&>option]:text-[#0f172a] dark:[&>option]:bg-[#0b1220] dark:[&>option]:text-white"
                >
                  <option value="">{t("issueViolationModal.none")}</option>
                  {SOURCE_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">
                  {t("issueViolationModal.sourceId")}{" "}
                  <span className="text-foreground/20 font-normal normal-case">
                    {t("issueViolationModal.optional")}
                  </span>
                </label>
                <input
                  type="text"
                  value={form.sourceId}
                  onChange={(e) => set("sourceId", e.target.value)}
                  placeholder={t("issueViolationModal.sourceIdPlaceholder")}
                  className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-end gap-3 bg-foreground/[0.02]">
            <button
              onClick={handleClose}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground text-sm font-medium hover:bg-foreground/10 transition-all disabled:opacity-30"
            >
              {t("issueViolationModal.cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid || isPending}
              className="px-5 py-2.5 rounded-xl bg-yellow-500 text-black font-bold text-sm hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-yellow-500/20"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isPending ? t("issueViolationModal.recording") : t("issueViolationModal.recordViolation")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Loader2, X, ShieldAlert, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

const PENALTY_TYPES = [
  "WARNING",
  "TEMPORARY_SUSPENSION",
  "PERMANENT_BAN",
  "FEATURE_RESTRICTION",
  "ACCOUNT_RESTRICTION",
];

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const TARGET_ROLES = ["RIDER", "DRIVER", "BOTH"];

const RESTRICTION_TYPES = [
  "CREATE_TRIP",
  "ACCEPT_TRIP",
  "REQUEST_RIDE",
  "JOIN_SHARED_RIDE",
  "CREATE_SHARED_RIDE",
  "JOIN_PASSENGER_POOL",
  "CREATE_PASSENGER_POOL",
  "WALLET_TRANSFER",
  "PAYMENT",
  "FULL_ACCOUNT",
];

const SEVERITY_COLORS = {
  LOW: "border-foreground/20 text-foreground/60",
  MEDIUM: "border-yellow-500/40 text-yellow-400",
  HIGH: "border-orange-500/40 text-orange-400",
  CRITICAL: "border-red-500/40 text-red-400",
};

// Penalty types that support restrictions
const RESTRICTION_SUPPORTED_TYPES = new Set([
  "FEATURE_RESTRICTION",
  "TEMPORARY_SUSPENSION",
  "ACCOUNT_RESTRICTION",
]);

// Penalty types that need duration
const DURATION_SUPPORTED_TYPES = new Set([
  "TEMPORARY_SUSPENSION",
  "FEATURE_RESTRICTION",
  "ACCOUNT_RESTRICTION",
]);

const INITIAL_FORM = {
  targetRole: "DRIVER",
  penaltyType: "TEMPORARY_SUSPENSION",
  severity: "HIGH",
  reason: "",
  durationMinutes: 1440,
  restrictionTypes: ["ACCEPT_TRIP"],
  violationIds: "",
};

/**
 * IssuePenaltyModal — manually issue a penalty.
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
export function IssuePenaltyModal({
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
  });

  if (!open) return null;

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const toggleRestriction = (type) => {
    setForm((prev) => ({
      ...prev,
      restrictionTypes: prev.restrictionTypes.includes(type)
        ? prev.restrictionTypes.filter((r) => r !== type)
        : [...prev.restrictionTypes, type],
    }));
  };

  const showDuration = DURATION_SUPPORTED_TYPES.has(form.penaltyType);
  const showRestrictions = RESTRICTION_SUPPORTED_TYPES.has(form.penaltyType);

  const handleSubmit = () => {
    if (!form.reason.trim()) return;

    const violationIds = form.violationIds
      .split(",")
      .map((v) => Number(v.trim()))
      .filter(Boolean);

    const payload = {
      userId,
      targetRole: form.targetRole,
      penaltyType: form.penaltyType,
      severity: form.severity,
      reason: form.reason.trim(),
      ...(showDuration && form.durationMinutes > 0
        ? { durationMinutes: Number(form.durationMinutes) }
        : {}),
      ...(showRestrictions
        ? { restrictionTypes: form.restrictionTypes }
        : { restrictionTypes: [] }),
      ...(violationIds.length > 0 ? { violationIds } : {}),
    };

    onSubmit(payload);
  };

  const handleClose = () => {
    if (isPending) return;
    setForm({ ...INITIAL_FORM, targetRole: defaultRole });
    onClose();
  };

  const isValid =
    form.reason.trim().length >= 10 &&
    (!showRestrictions || form.restrictionTypes.length > 0 ||
      form.penaltyType === "TEMPORARY_SUSPENSION");

  return (
    <div className="fixed inset-0 z-[999]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="absolute inset-0 grid place-items-center p-4 pointer-events-none overflow-y-auto">
        <div className="w-full max-w-[580px] my-4 rounded-3xl border border-border-subtle bg-surface shadow-[0_24px_80px_-30px_rgba(0,0,0,0.75)] overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 className="text-foreground font-bold text-base">
                  {t("issuePenaltyModal.issuePenalty")}
                </h3>
                <p className="text-xs text-foreground/50 mt-0.5">
                  {t("issuePenaltyModal.subtitle")}
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
            {/* Warning for PERMANENT_BAN */}
            {form.penaltyType === "PERMANENT_BAN" && (
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-500/8 border border-red-500/25">
                <AlertTriangle
                  size={15}
                  className="text-red-400 mt-0.5 shrink-0"
                />
                <p className="text-xs text-red-300/80">
                  <strong>{t("issuePenaltyModal.permanentBan")}</strong> {t("issuePenaltyModal.banWarning")}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Target Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">
                  {t("issuePenaltyModal.targetRole")}
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

              {/* Penalty Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">
                  {t("issuePenaltyModal.penaltyType")}
                </label>
                <select
                  value={form.penaltyType}
                  onChange={(e) => set("penaltyType", e.target.value)}
                  className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all cursor-pointer [&>option]:bg-white [&>option]:text-[#0f172a] dark:[&>option]:bg-[#0b1220] dark:[&>option]:text-white"
                >
                  {PENALTY_TYPES.map((p) => (
                    <option key={p} value={p}>
                      {p.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Severity */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">
                {t("issuePenaltyModal.severity")}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {SEVERITIES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("severity", s)}
                    className={`py-3 rounded-2xl border text-xs font-bold uppercase tracking-wider transition-all ${
                      form.severity === s
                        ? `${SEVERITY_COLORS[s]} bg-foreground/10`
                        : "border-border-subtle text-foreground/30 bg-foreground/[0.03] hover:bg-foreground/5"
                    }`}
                  >
                    {s === "CRITICAL" ? t("issuePenaltyModal.critical") : s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration (conditional) */}
            {showDuration && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">
                  {t("issuePenaltyModal.durationMinutes")}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={form.durationMinutes}
                    onChange={(e) =>
                      set("durationMinutes", e.target.value)
                    }
                    className="flex-1 rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all"
                  />
                  <div className="flex gap-2">
                    {[60, 1440, 10080].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => set("durationMinutes", d)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          form.durationMinutes === d
                            ? "border-[#4880FF]/40 bg-[#4880FF]/10 text-[#4880FF]"
                            : "border-border-subtle bg-foreground/5 text-foreground/40 hover:bg-foreground/10"
                        }`}
                      >
                        {d === 60 ? "1h" : d === 1440 ? "24h" : "7d"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Restriction Types (conditional) */}
            {showRestrictions && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">
                  {t("issuePenaltyModal.restrictionTypes")}{" "}
                  <span className="text-foreground/20 font-normal normal-case">
                    {t("issuePenaltyModal.selectAllThatApply")}
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {RESTRICTION_TYPES.map((rt) => {
                    const selected = form.restrictionTypes.includes(rt);
                    return (
                      <button
                        key={rt}
                        type="button"
                        onClick={() => toggleRestriction(rt)}
                        className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
                          selected
                            ? "border-[#4880FF]/40 bg-[#4880FF]/10 text-[#4880FF]"
                            : "border-border-subtle bg-foreground/[0.03] text-foreground/30 hover:bg-foreground/5 hover:text-foreground/50"
                        }`}
                      >
                        {rt.replace(/_/g, " ")}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">
                {t("issuePenaltyModal.reason")}
              </label>
              <textarea
                rows={3}
                value={form.reason}
                onChange={(e) => set("reason", e.target.value)}
                placeholder={t("issuePenaltyModal.reasonPlaceholder")}
                className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all resize-none text-sm"
              />
            </div>

            {/* Linked violation IDs (optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">
                {t("issuePenaltyModal.linkedViolations")}{" "}
                <span className="text-foreground/20 font-normal normal-case">
                  {t("issuePenaltyModal.linkedViolationsDesc")}
                </span>
              </label>
              <input
                type="text"
                value={form.violationIds}
                onChange={(e) => set("violationIds", e.target.value)}
                placeholder={t("issuePenaltyModal.linkedViolationsPlaceholder")}
                className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all text-sm"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-end gap-3 bg-foreground/[0.02]">
            <button
              onClick={handleClose}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground text-sm font-medium hover:bg-foreground/10 transition-all disabled:opacity-30"
            >
              {t("issuePenaltyModal.cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid || isPending}
              className="px-5 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-red-500/20"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isPending ? t("issuePenaltyModal.issuing") : t("issuePenaltyModal.issuePenalty")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Loader2, X, Zap, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

const VIOLATION_TYPES = [
  "RIDER_TRIP_CANCELLATION", "DRIVER_TRIP_CANCELLATION", "NO_SHOW",
  "LATE_CANCELLATION", "SHARED_RIDE_MISUSE", "PASSENGER_POOL_MISUSE",
  "PAYMENT_ABUSE", "WALLET_ABUSE", "ABUSIVE_BEHAVIOR", "FRAUD", "MANUAL_ADMIN_VIOLATION",
];
const PENALTY_TYPES = ["WARNING", "TEMPORARY_SUSPENSION", "PERMANENT_BAN", "FEATURE_RESTRICTION", "ACCOUNT_RESTRICTION"];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const TARGET_ROLES = ["RIDER", "DRIVER", "BOTH"];
const RESTRICTION_TYPES = [
  "CREATE_TRIP", "ACCEPT_TRIP", "REQUEST_RIDE", "JOIN_SHARED_RIDE",
  "CREATE_SHARED_RIDE", "JOIN_PASSENGER_POOL", "CREATE_PASSENGER_POOL",
  "WALLET_TRANSFER", "PAYMENT", "FULL_ACCOUNT",
];

const DURATION_TYPES = new Set(["TEMPORARY_SUSPENSION", "FEATURE_RESTRICTION", "ACCOUNT_RESTRICTION"]);

const INITIAL = {
  name: "", description: "", violationType: "DRIVER_TRIP_CANCELLATION",
  targetRole: "DRIVER", thresholdCount: 3, windowMinutes: 1440,
  penaltyType: "TEMPORARY_SUSPENSION", severity: "MEDIUM", durationMinutes: 1440,
  restrictionTypes: ["ACCEPT_TRIP"], priority: 10, isActive: true,
};

/**
 * RuleFormModal — create or edit an automated penalty rule.
 */
export function RuleFormModal({ open, onClose, onSubmit, isPending, initialData = null }) {
  const { t } = useTranslation("common");
  const [form, setForm] = useState(initialData ?? INITIAL);

  if (!open) return null;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const toggleRestriction = (rt) =>
    setForm((p) => ({
      ...p,
      restrictionTypes: p.restrictionTypes.includes(rt)
        ? p.restrictionTypes.filter((r) => r !== rt)
        : [...p.restrictionTypes, rt],
    }));

  const showDuration = DURATION_TYPES.has(form.penaltyType);

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSubmit({
      ...form,
      thresholdCount: Number(form.thresholdCount),
      windowMinutes: Number(form.windowMinutes),
      priority: Number(form.priority),
      durationMinutes: showDuration ? Number(form.durationMinutes) : null,
    });
  };

  const handleClose = () => { if (!isPending) { setForm(initialData ?? INITIAL); onClose(); } };
  const isEdit = !!initialData;
  const isValid = form.name.trim().length >= 3;

  return (
    <div className="fixed inset-0 z-[999]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="absolute inset-0 grid place-items-center p-4 pointer-events-none overflow-y-auto">
        <div className="w-full max-w-[600px] my-4 rounded-3xl border border-border-subtle bg-surface shadow-[0_24px_80px_-30px_rgba(0,0,0,0.75)] overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><Zap size={18} /></div>
              <div>
                <h3 className="text-foreground font-bold">{isEdit ? t("ruleFormModal.editRule") : t("ruleFormModal.createRule")}</h3>
                <p className="text-xs text-foreground/50 mt-0.5">{t("ruleFormModal.subtitle")}</p>
              </div>
            </div>
            <button onClick={handleClose} disabled={isPending}
              className="p-2 rounded-xl hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-all disabled:opacity-30">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">{t("ruleFormModal.ruleName")}</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)}
                placeholder={t("ruleFormModal.namePlaceholder")}
                className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all text-sm" />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">{t("ruleFormModal.description")}</label>
              <textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)}
                placeholder={t("ruleFormModal.descPlaceholder")}
                className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all resize-none text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Target Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">{t("ruleFormModal.targetRole")}</label>
                <select value={form.targetRole} onChange={(e) => set("targetRole", e.target.value)}
                  className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all cursor-pointer [&>option]:bg-white [&>option]:text-[#0f172a] dark:[&>option]:bg-[#0b1220] dark:[&>option]:text-white">
                  {TARGET_ROLES.map((r) => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
              {/* Violation Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">{t("ruleFormModal.violationType")}</label>
                <select value={form.violationType} onChange={(e) => set("violationType", e.target.value)}
                  className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all cursor-pointer [&>option]:bg-white [&>option]:text-[#0f172a] dark:[&>option]:bg-[#0b1220] dark:[&>option]:text-white">
                  {VIOLATION_TYPES.map((v) => <option key={v} value={v}>{v.replace(/_/g, " ")}</option>)}
                </select>
              </div>
            </div>

            {/* Threshold & Window */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">{t("ruleFormModal.thresholdCount")}</label>
                <input type="number" min={1} value={form.thresholdCount} onChange={(e) => set("thresholdCount", e.target.value)}
                  className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">{t("ruleFormModal.windowMin")}</label>
                <input type="number" min={1} value={form.windowMinutes} onChange={(e) => set("windowMinutes", e.target.value)}
                  className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">{t("ruleFormModal.priority")}</label>
                <input type="number" min={1} value={form.priority} onChange={(e) => set("priority", e.target.value)}
                  className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Penalty Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">{t("ruleFormModal.penaltyType")}</label>
                <select value={form.penaltyType} onChange={(e) => set("penaltyType", e.target.value)}
                  className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all cursor-pointer [&>option]:bg-white [&>option]:text-[#0f172a] dark:[&>option]:bg-[#0b1220] dark:[&>option]:text-white">
                  {PENALTY_TYPES.map((p) => <option key={p} value={p}>{p.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              {/* Severity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">{t("ruleFormModal.severity")}</label>
                <select value={form.severity} onChange={(e) => set("severity", e.target.value)}
                  className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all cursor-pointer [&>option]:bg-white [&>option]:text-[#0f172a] dark:[&>option]:bg-[#0b1220] dark:[&>option]:text-white">
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Duration */}
            {showDuration && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">{t("ruleFormModal.durationMin")}</label>
                <div className="flex gap-3 items-center">
                  <input type="number" min={1} value={form.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)}
                    className="flex-1 rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all" />
                  {[60, 1440, 10080, 43200].map((d) => (
                    <button key={d} type="button" onClick={() => set("durationMinutes", d)}
                      className={`px-3 py-2.5 rounded-xl border text-[10px] font-bold transition-all ${form.durationMinutes === d ? "border-[#4880FF]/40 bg-[#4880FF]/10 text-[#4880FF]" : "border-border-subtle bg-foreground/5 text-foreground/40 hover:bg-foreground/10"}`}>
                      {d === 60 ? "1h" : d === 1440 ? "24h" : d === 10080 ? "7d" : "30d"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Restrictions */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">{t("ruleFormModal.restrictionTypes")}</label>
              <div className="flex flex-wrap gap-2">
                {RESTRICTION_TYPES.map((rt) => {
                  const selected = form.restrictionTypes.includes(rt);
                  return (
                    <button key={rt} type="button" onClick={() => toggleRestriction(rt)}
                      className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${selected ? "border-[#4880FF]/40 bg-[#4880FF]/10 text-[#4880FF]" : "border-border-subtle bg-foreground/[0.03] text-foreground/30 hover:bg-foreground/5 hover:text-foreground/50"}`}>
                      {rt.replace(/_/g, " ")}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-foreground/[0.03] border border-border-subtle">
              <div>
                <p className="text-sm font-medium text-foreground">{t("ruleFormModal.ruleActive")}</p>
                <p className="text-xs text-foreground/40">{t("ruleFormModal.ruleActiveDesc")}</p>
              </div>
              <button type="button" onClick={() => set("isActive", !form.isActive)}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? "bg-[#4880FF]" : "bg-foreground/20"}`}>
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${form.isActive ? "left-7" : "left-1"}`} />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-end gap-3 bg-foreground/[0.02]">
            <button onClick={handleClose} disabled={isPending}
              className="px-5 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground text-sm font-medium hover:bg-foreground/10 transition-all disabled:opacity-30">
              {t("ruleFormModal.cancel")}
            </button>
            <button onClick={handleSubmit} disabled={!isValid || isPending}
              className="px-5 py-2.5 rounded-xl bg-purple-500 text-white font-bold text-sm hover:bg-purple-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/20">
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isPending ? t("ruleFormModal.saving") : isEdit ? t("ruleFormModal.updateRule") : t("ruleFormModal.createRule")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

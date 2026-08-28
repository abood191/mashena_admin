import { useState } from "react";
import { Zap, Plus, Loader2, Pencil, Trash2, Clock, Users, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useModerationRules, useCreateModerationRule, useUpdateModerationRule, useDeleteModerationRule } from "@/app/hooks/api/useModeration";
import { SeverityBadge } from "./components/SeverityBadge";
import { RuleFormModal } from "./components/RuleFormModal";
import { useTranslation } from "react-i18next";

function RuleCard({ rule, onEdit, onToggle, onDelete, togglePending, deletePending }) {
  const { t } = useTranslation("common");
  return (
    <div className={`bg-surface border rounded-2xl p-5 space-y-4 transition-all ${
      rule.isActive ? "border-border-subtle" : "border-border-subtle opacity-50"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`h-2 w-2 rounded-full ${rule.isActive ? "bg-green-500 animate-pulse" : "bg-foreground/20"}`} />
            <h3 className="text-sm font-bold text-foreground truncate">{rule.name}</h3>
            <SeverityBadge severity={rule.severity} />
          </div>
          {rule.description && (
            <p className="text-xs text-foreground/50 leading-relaxed">{rule.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-bold text-foreground/30 px-2 py-1 rounded-lg bg-foreground/5 border border-border-subtle">
            {t("moderationRules.priority")} {rule.priority}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="px-3 py-2.5 rounded-xl bg-foreground/[0.03] border border-border-subtle text-center">
          <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-wider mb-1">{t("moderationRules.threshold")}</p>
          <p className="text-lg font-bold text-foreground">{rule.thresholdCount}</p>
          <p className="text-[10px] text-foreground/30">{t("moderationRules.violations")}</p>
        </div>
        <div className="px-3 py-2.5 rounded-xl bg-foreground/[0.03] border border-border-subtle text-center">
          <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-wider mb-1">{t("moderationRules.window")}</p>
          <p className="text-lg font-bold text-foreground">
            {rule.windowMinutes >= 1440 ? `${rule.windowMinutes / 1440}d` : `${rule.windowMinutes}m`}
          </p>
          <p className="text-[10px] text-foreground/30">{t("moderationRules.timeWindow")}</p>
        </div>
        <div className="px-3 py-2.5 rounded-xl bg-foreground/[0.03] border border-border-subtle text-center">
          <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-wider mb-1">{t("moderationRules.duration")}</p>
          <p className="text-lg font-bold text-foreground">
            {rule.durationMinutes
              ? rule.durationMinutes >= 1440
                ? `${rule.durationMinutes / 1440}d`
                : `${rule.durationMinutes}m`
              : "—"}
          </p>
          <p className="text-[10px] text-foreground/30">{t("moderationRules.penalty")}</p>
        </div>
      </div>

      {/* Trigger info */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/40">
            <Users size={11} /> {rule.targetRole}
          </span>
          <span className="text-foreground/20">·</span>
          <span className="text-[10px] text-foreground/40">{rule.violationType?.replace(/_/g, " ")}</span>
          <span className="text-foreground/20">→</span>
          <span className="text-[10px] font-bold text-foreground/60">{rule.penaltyType?.replace(/_/g, " ")}</span>
        </div>

        {rule.restrictionTypes?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {rule.restrictionTypes.map((rt) => (
              <span key={rt}
                className="px-2 py-0.5 rounded-lg bg-[#4880FF]/8 text-[#4880FF] border border-[#4880FF]/15 text-[9px] font-bold uppercase tracking-wider">
                {rt.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(rule)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground/50 text-[10px] font-bold hover:bg-foreground/10 hover:text-foreground transition-all">
            <Pencil size={11} /> {t("moderationRules.edit")}
          </button>
          <button onClick={() => onDelete(rule.id)} disabled={deletePending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400/60 text-[10px] font-bold hover:bg-red-500/10 hover:text-red-400 transition-all disabled:opacity-30">
            {deletePending ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
            {t("moderationRules.deactivate")}
          </button>
        </div>

        {/* Active toggle */}
        <button type="button" onClick={() => onToggle(rule)} disabled={togglePending}
          className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-40 ${rule.isActive ? "bg-[#4880FF]" : "bg-foreground/20"}`}>
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${rule.isActive ? "left-5" : "left-0.5"}`} />
        </button>
      </div>
    </div>
  );
}

export default function RulesPage() {
  const { t } = useTranslation("common");
  const [formModal, setFormModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const { data: rulesData, isLoading } = useModerationRules();
  const createRule = useCreateModerationRule();
  const updateRule = useUpdateModerationRule();
  const deleteRule = useDeleteModerationRule();

  const rules = Array.isArray(rulesData) ? rulesData : rulesData?.data ?? [];
  const activeRules = rules.filter((r) => r.isActive);
  const inactiveRules = rules.filter((r) => !r.isActive);

  const handleCreate = async (data) => {
    try {
      await createRule.mutateAsync(data);
      toast.success("Rule created successfully.");
      setFormModal(false);
    } catch (err) {
      toast.error(err?.message ?? "Failed to create rule.");
    }
  };

  const handleEdit = (rule) => { setEditTarget(rule); setFormModal(true); };

  const handleUpdate = async (data) => {
    try {
      await updateRule.mutateAsync({ id: editTarget.id, data });
      toast.success("Rule updated.");
      setFormModal(false);
      setEditTarget(null);
    } catch (err) {
      toast.error(err?.message ?? "Failed to update rule.");
    }
  };

  const handleToggle = async (rule) => {
    try {
      await updateRule.mutateAsync({ id: rule.id, data: { isActive: !rule.isActive } });
      toast.success(`Rule ${rule.isActive ? "deactivated" : "activated"}.`);
    } catch (err) {
      toast.error(err?.message ?? "Failed to toggle rule.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteRule.mutateAsync(id);
      toast.success("Rule deactivated (soft delete).");
    } catch (err) {
      toast.error(err?.message ?? "Failed to deactivate rule.");
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400"><Zap size={26} /></div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("moderationRules.title")}</h1>
          <p className="text-foreground/50 text-sm mt-0.5">{t("moderationRules.subtitle")}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-foreground/30">{activeRules.length} {t("moderationRules.active")}</p>
            <p className="text-xs text-foreground/20">{inactiveRules.length} {t("moderationRules.inactive")}</p>
          </div>
          <button onClick={() => { setEditTarget(null); setFormModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 text-white font-bold text-sm hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20">
            <Plus size={15} /> {t("moderationRules.createRule")}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-foreground/20" />
        </div>
      ) : rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Zap size={40} className="text-foreground/10 mb-3" />
          <p className="text-foreground/30 text-sm">{t("moderationRules.noRules")}</p>
          <button onClick={() => setFormModal(true)}
            className="mt-4 px-4 py-2.5 rounded-xl bg-purple-500 text-white font-bold text-sm hover:bg-purple-600 transition-all">
            {t("moderationRules.createFirstRule")}
          </button>
        </div>
      ) : (
        <>
          {activeRules.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/30">
                {t("moderationRules.activeRules")} ({activeRules.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeRules.map((rule) => (
                  <RuleCard key={rule.id} rule={rule}
                    onEdit={handleEdit} onToggle={handleToggle} onDelete={handleDelete}
                    togglePending={updateRule.isPending} deletePending={deleteRule.isPending} />
                ))}
              </div>
            </div>
          )}
          {inactiveRules.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/20">
                {t("moderationRules.inactiveRules")} ({inactiveRules.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {inactiveRules.map((rule) => (
                  <RuleCard key={rule.id} rule={rule}
                    onEdit={handleEdit} onToggle={handleToggle} onDelete={handleDelete}
                    togglePending={updateRule.isPending} deletePending={deleteRule.isPending} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <RuleFormModal
        open={formModal}
        onClose={() => { setFormModal(false); setEditTarget(null); }}
        onSubmit={editTarget ? handleUpdate : handleCreate}
        isPending={createRule.isPending || updateRule.isPending}
        initialData={editTarget}
      />
    </div>
  );
}

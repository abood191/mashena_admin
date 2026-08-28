import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  AlertTriangle, Search, Filter, ChevronDown, Loader2,
  Plus, ExternalLink, FilePlus,
} from "lucide-react";
import { toast } from "sonner";
import { useViolations, useCreateViolation } from "@/app/hooks/api/useModeration";
import { useDebounce } from "@/hooks/useDebounce";
import { StatusBadge } from "./components/StatusBadge";
import { SeverityBadge } from "./components/SeverityBadge";
import { IssueViolationModal } from "./components/IssueViolationModal";
import { useTranslation } from "react-i18next";

const VIOLATION_STATUSES = ["RECORDED", "PROCESSED", "DISMISSED"];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const TARGET_ROLES = ["RIDER", "DRIVER", "BOTH"];
const SOURCES = ["SYSTEM", "ADMIN", "AUTOMATED_RULE", "USER_REPORT"];

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ViolationsLogPage() {
  const { t } = useTranslation("common");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [violationModal, setViolationModal] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const debouncedSearch = useDebounce(searchInput, 400);

  const page = Number(searchParams.get("page") ?? 1);
  const userId = searchParams.get("userId") ?? "";
  const status = searchParams.get("status") ?? "";
  const severity = searchParams.get("severity") ?? "";
  const targetRole = searchParams.get("targetRole") ?? "";
  const source = searchParams.get("source") ?? "";

  const setParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) { next.set(key, val); } else { next.delete(key); }
    next.set("page", "1");
    setSearchParams(next);
  };

  const filters = {
    page, limit: 15,
    ...(userId ? { userId: Number(userId) } : {}),
    ...(status ? { status } : {}),
    ...(severity ? { severity } : {}),
    ...(targetRole ? { targetRole } : {}),
    ...(source ? { source } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const { data, isFetching } = useViolations(filters);
  const createViolation = useCreateViolation();

  const violations = data?.data ?? [];
  const meta = data?.meta ?? {};
  const totalPages = meta.totalPages ?? 1;

  const hasFilters = status || severity || targetRole || source || userId || searchInput;

  const clearFilters = () => {
    setSearchInput("");
    setSearchParams({ page: "1" });
  };

  const handleCreate = async (formData) => {
    try {
      await createViolation.mutateAsync(formData);
      toast.success("Violation recorded successfully.");
      setViolationModal(false);
    } catch (err) {
      toast.error(err?.message ?? "Failed to record violation.");
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-yellow-500/10 text-yellow-400">
          <AlertTriangle size={26} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("moderationViolations.title")}</h1>
          <p className="text-foreground/50 text-sm mt-0.5">{t("moderationViolations.subtitle")}</p>
        </div>
        <button
          onClick={() => setViolationModal(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500 text-black font-bold text-sm hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20"
        >
          <FilePlus size={15} />
          {t("moderationViolations.recordViolation")}
        </button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30" size={14} />
          <input
            type="text"
            placeholder={t("moderationViolations.searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground text-sm placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all w-64"
          />
        </div>

        {/* User ID */}
        <input
          type="number"
          placeholder={t("moderationViolations.userIdPlaceholder")}
          value={userId}
          onChange={(e) => setParam("userId", e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground text-sm placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all w-28"
        />

        {/* Severity */}
        <div className="relative">
          <select
            value={severity}
            onChange={(e) => setParam("severity", e.target.value)}
            className="pl-4 pr-8 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all appearance-none cursor-pointer [&>option]:bg-white [&>option]:text-[#0f172a] dark:[&>option]:bg-[#0b1220] dark:[&>option]:text-white"
          >
            <option value="">{t("moderationViolations.allSeverities")}</option>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none" />
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={status}
            onChange={(e) => setParam("status", e.target.value)}
            className="pl-4 pr-8 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all appearance-none cursor-pointer [&>option]:bg-white [&>option]:text-[#0f172a] dark:[&>option]:bg-[#0b1220] dark:[&>option]:text-white"
          >
            <option value="">{t("moderationViolations.allStatuses")}</option>
            {VIOLATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none" />
        </div>

        {/* Role */}
        <div className="relative">
          <select
            value={targetRole}
            onChange={(e) => setParam("targetRole", e.target.value)}
            className="pl-4 pr-8 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all appearance-none cursor-pointer [&>option]:bg-white [&>option]:text-[#0f172a] dark:[&>option]:bg-[#0b1220] dark:[&>option]:text-white"
          >
            <option value="">{t("moderationViolations.allRoles")}</option>
            {TARGET_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none" />
        </div>

        {hasFilters && (
          <button onClick={clearFilters}
            className="px-3.5 py-2.5 rounded-xl border border-border-subtle text-foreground/40 text-xs hover:bg-foreground/5 transition-all">
            {t("clear")}
          </button>
        )}
        <span className="ml-auto text-xs text-foreground/30">{meta.total ?? 0} {t("moderationViolations.violations")}</span>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-sm">
        {isFetching && violations.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-foreground/20" />
          </div>
        ) : violations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle size={36} className="text-foreground/10 mb-3" />
            <p className="text-foreground/30 text-sm">{t("moderationViolations.noViolationsFound")}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                {[
                  t("moderationViolations.table.id"),
                  t("moderationViolations.table.user"),
                  t("moderationViolations.table.type"),
                  t("moderationViolations.table.source"),
                  t("moderationViolations.table.severity"),
                  t("moderationViolations.table.status"),
                  t("moderationViolations.table.date"),
                  ""
                ].map((h, i) => (
                  <th key={i} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-foreground/30">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {violations.map((v) => (
                <tr key={v.id} className="hover:bg-foreground/[0.02] transition-colors">
                  <td className="px-4 py-3.5 text-xs font-mono text-foreground/40">#{v.id}</td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => navigate(`/profile/${v.targetRole === "DRIVER" ? "drivers" : "riders"}/${v.userId}?tab=moderation`)}
                      className="flex items-center gap-1 text-xs text-[#4880FF] hover:underline"
                    >
                      {t("moderationViolations.userId", { id: v.userId })}
                      <ExternalLink size={10} />
                    </button>
                    <span className="block text-[10px] text-foreground/30">{v.targetRole}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-medium text-foreground">
                      {v.violationType?.replace(/_/g, " ")}
                    </span>
                    {v.description && (
                      <p className="text-[10px] text-foreground/30 max-w-[180px] truncate mt-0.5">
                        {v.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[10px] font-bold uppercase text-foreground/40 px-2 py-0.5 rounded-lg bg-foreground/5 border border-border-subtle">
                      {v.source}
                    </span>
                  </td>
                  <td className="px-4 py-3.5"><SeverityBadge severity={v.severity} /></td>
                  <td className="px-4 py-3.5"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-3.5 text-[11px] text-foreground/30 font-mono">
                    {formatDate(v.occurredAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    {v.penaltyId && (
                      <span className="text-[10px] text-purple-400 font-bold px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        {t("moderationViolations.penaltyId", { id: v.penaltyId })}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────────────── */}
      {meta.total > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/30">{t("moderationViolations.pageOf", { page, totalPages })}</span>
          <div className="flex gap-2">
            <button onClick={() => setParam("page", String(Math.max(1, page - 1)))} disabled={page === 1}
              className="px-5 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground text-sm font-bold hover:bg-foreground/10 transition-all disabled:opacity-30">
              {t("prev")}
            </button>
            <button onClick={() => setParam("page", String(Math.min(totalPages, page + 1)))} disabled={page >= totalPages}
              className="px-5 py-2.5 rounded-xl bg-[#4880FF] text-white font-bold text-sm hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25 disabled:opacity-30">
              {t("next")}
            </button>
          </div>
        </div>
      )}

      <IssueViolationModal
        open={violationModal}
        onClose={() => setViolationModal(false)}
        onSubmit={handleCreate}
        isPending={createViolation.isPending}
        userId={userId ? Number(userId) : undefined}
        defaultRole="DRIVER"
      />
    </div>
  );
}

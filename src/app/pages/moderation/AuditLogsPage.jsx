import { useSearchParams, Link } from "react-router-dom";
import { ScrollText, Filter, ChevronDown, Loader2, User, ExternalLink } from "lucide-react";
import { useAuditLogs } from "@/app/hooks/api/useModeration";
import { useDebounce } from "@/hooks/useDebounce";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const ACTOR_TYPES = ["SYSTEM", "ADMIN", "USER"];
const ENTITY_TYPES = ["VIOLATION", "PENALTY", "RESTRICTION", "APPEAL", "RULE"];
const ACTIONS = [
  "VIOLATION_RECORDED", "PENALTY_ISSUED", "PENALTY_REVOKED",
  "RESTRICTION_REVOKED", "APPEAL_APPROVED", "APPEAL_REJECTED",
  "APPEAL_REVIEW_STARTED", "RULE_CREATED", "RULE_UPDATED", "RULE_DELETED",
];

const ACTOR_COLORS = {
  SYSTEM: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  ADMIN: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  USER: "bg-green-500/10 text-green-400 border-green-500/20",
};

const ACTION_COLORS = {
  PENALTY_ISSUED: "text-red-400",
  PENALTY_REVOKED: "text-orange-400",
  RESTRICTION_REVOKED: "text-yellow-400",
  APPEAL_APPROVED: "text-emerald-400",
  APPEAL_REJECTED: "text-red-400",
  VIOLATION_RECORDED: "text-yellow-400",
  RULE_CREATED: "text-purple-400",
  RULE_UPDATED: "text-blue-400",
  RULE_DELETED: "text-foreground/40",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function LogRow({ log }) {
  const { t } = useTranslation("common");
  const [expanded, setExpanded] = useState(false);
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

  return (
    <div
      className={`px-5 py-3.5 hover:bg-foreground/[0.02] transition-colors ${hasMetadata ? "cursor-pointer" : ""}`}
      onClick={() => hasMetadata && setExpanded((v) => !v)}
    >
      <div className="flex items-start gap-4">
        {/* Timeline dot */}
        <div className="mt-1 flex-col items-center hidden sm:flex">
          <div className="h-2.5 w-2.5 rounded-full bg-[#4880FF]/40 border border-[#4880FF]/20 shrink-0" />
          <div className="w-px flex-1 bg-border-subtle mt-1.5 min-h-[20px]" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${ACTOR_COLORS[log.actorType] ?? "bg-foreground/5 text-foreground/40 border-border-subtle"}`}>
              {log.actorType}
            </span>
            <span className={`text-xs font-bold ${ACTION_COLORS[log.action] ?? "text-foreground/60"}`}>
              {log.action?.replace(/_/g, " ")}
            </span>
            <span className="text-[10px] text-foreground/30">
              {log.entityType} #{log.entityId}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-foreground/30 flex-wrap">
            {log.actorUserId && (
              <span className="flex items-center gap-1">
                <User size={10} /> {t("moderationAuditLogs.adminId", { id: log.actorUserId })}
              </span>
            )}
            {log.targetUserId && (
              log.entityType === "RULE" ? (
                <span className="flex items-center gap-1">
                  → {t("moderationAuditLogs.adminId", { id: log.targetUserId })}
                </span>
              ) : (
                <Link 
                  to={`/profile/drivers/${log.targetUserId}?tab=moderation`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-[#4880FF] hover:underline"
                >
                  → {t("moderationAuditLogs.userId", { id: log.targetUserId })} <ExternalLink size={10} />
                </Link>
              )
            )}
            <span>{formatDate(log.occurredAt)}</span>
          </div>

          {log.reason && (
            <p className="text-xs text-foreground/40 italic">"{log.reason}"</p>
          )}

          {expanded && hasMetadata && (
            <pre className="mt-2 text-[10px] text-foreground/50 bg-foreground/[0.04] border border-border-subtle rounded-xl p-3 overflow-x-auto">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          )}
        </div>

        <span className="text-[10px] text-foreground/20 shrink-0 font-mono">#{log.id}</span>
      </div>
    </div>
  );
}

export default function AuditLogsPage() {
  const { t } = useTranslation("common");
  const [searchParams, setSearchParams] = useSearchParams();
  const [userIdInput, setUserIdInput] = useState(searchParams.get("targetUserId") ?? "");
  const debouncedUserId = useDebounce(userIdInput, 400);

  const page = Number(searchParams.get("page") ?? 1);
  const actorType = searchParams.get("actorType") ?? "";
  const action = searchParams.get("action") ?? "";
  const entityType = searchParams.get("entityType") ?? "";

  const setParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) { next.set(key, val); } else { next.delete(key); }
    next.set("page", "1");
    setSearchParams(next);
  };

  const filters = {
    page, limit: 20,
    ...(debouncedUserId ? { targetUserId: Number(debouncedUserId) } : {}),
    ...(actorType ? { actorType } : {}),
    ...(action ? { action } : {}),
    ...(entityType ? { entityType } : {}),
  };

  const { data, isFetching } = useAuditLogs(filters);
  const logs = data?.data ?? [];
  const meta = data?.meta ?? {};
  const totalPages = meta.totalPages ?? 1;

  const hasFilters = actorType || action || entityType || userIdInput;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-foreground/8 text-foreground/60">
          <ScrollText size={26} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("moderationAuditLogs.title")}</h1>
          <p className="text-foreground/50 text-sm mt-0.5">
            {t("moderationAuditLogs.subtitle")}
          </p>
        </div>
        <span className="ml-auto text-xs text-foreground/30 bg-foreground/5 px-3 py-1.5 rounded-full border border-border-subtle">
          {t("moderationAuditLogs.readOnly")}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* User ID */}
        <input type="number" placeholder={t("moderationAuditLogs.targetUserId")}
          value={userIdInput} onChange={(e) => setUserIdInput(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground text-sm placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all w-36" />

        {/* Actor Type */}
        <div className="relative">
          <select value={actorType} onChange={(e) => setParam("actorType", e.target.value)}
            className="pl-4 pr-8 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all appearance-none cursor-pointer [&>option]:bg-white [&>option]:text-[#0f172a] dark:[&>option]:bg-[#0b1220] dark:[&>option]:text-white">
            <option value="">{t("moderationAuditLogs.allActors")}</option>
            {ACTOR_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none" />
        </div>

        {/* Action */}
        <div className="relative">
          <select value={action} onChange={(e) => setParam("action", e.target.value)}
            className="pl-4 pr-8 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all appearance-none cursor-pointer [&>option]:bg-white [&>option]:text-[#0f172a] dark:[&>option]:bg-[#0b1220] dark:[&>option]:text-white">
            <option value="">{t("moderationAuditLogs.allActions")}</option>
            {ACTIONS.map((a) => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none" />
        </div>

        {/* Entity Type */}
        <div className="relative">
          <select value={entityType} onChange={(e) => setParam("entityType", e.target.value)}
            className="pl-4 pr-8 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all appearance-none cursor-pointer [&>option]:bg-white [&>option]:text-[#0f172a] dark:[&>option]:bg-[#0b1220] dark:[&>option]:text-white">
            <option value="">{t("moderationAuditLogs.allEntities")}</option>
            {ENTITY_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none" />
        </div>

        {hasFilters && (
          <button onClick={() => { setUserIdInput(""); setSearchParams({ page: "1" }); }}
            className="px-3.5 py-2.5 rounded-xl border border-border-subtle text-foreground/40 text-xs hover:bg-foreground/5 transition-all">
            {t("clear")}
          </button>
        )}

        <span className="ml-auto text-xs text-foreground/30">{meta.total ?? 0} {t("moderationAuditLogs.entries")}</span>
      </div>

      {/* Log Timeline */}
      <div className="bg-surface border border-border-subtle rounded-3xl overflow-hidden">
        {isFetching && logs.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-foreground/20" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ScrollText size={36} className="text-foreground/10 mb-3" />
            <p className="text-foreground/30 text-sm">{t("moderationAuditLogs.noEntriesFound")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {logs.map((log) => <LogRow key={log.id} log={log} />)}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.total > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/30">{t("moderationAuditLogs.pageOf", { page, totalPages })}</span>
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
    </div>
  );
}

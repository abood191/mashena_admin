import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  MessageSquareWarning, Search, Filter, ChevronDown, Loader2,
  User, ExternalLink, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useAppeals, useReviewAppeal, useApproveAppeal, useRejectAppeal } from "@/app/hooks/api/useModeration";
import { useDebounce } from "@/hooks/useDebounce";
import { StatusBadge } from "./components/StatusBadge";
import { AppealReviewModal } from "./components/AppealReviewModal";
import { useTranslation } from "react-i18next";

const APPEAL_STATUSES = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "CANCELLED"];

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function AppealCard({ appeal, onReview, onApprove, onReject, reviewPending }) {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const isActionable = ["PENDING", "UNDER_REVIEW"].includes(appeal.status);

  return (
    <div className={`bg-surface border rounded-2xl p-5 space-y-3.5 transition-all ${
      appeal.status === "PENDING"
        ? "border-yellow-500/25 shadow-[0_0_0_1px] shadow-yellow-500/10"
        : appeal.status === "UNDER_REVIEW"
        ? "border-blue-500/25 shadow-[0_0_0_1px] shadow-blue-500/10"
        : "border-border-subtle"
    }`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={appeal.status} size="md" />
            <span className="text-xs text-foreground/40 font-mono">
              {t("moderationAppeals.appealId", { id: appeal.id })} · {t("moderationAppeals.penaltyId", { id: appeal.penaltyId })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-foreground/40">
            <User size={12} />
            <span>{t("moderationAppeals.userId", { id: appeal.userId })}</span>
            <button
              onClick={() => navigate(`/profile/drivers/${appeal.userId}?tab=moderation`)}
              className="flex items-center gap-0.5 text-[#4880FF] hover:underline"
            >
              <ExternalLink size={10} />
              {t("moderationAppeals.viewProfile")}
            </button>
          </div>
        </div>
        <span className="text-[10px] text-foreground/30 shrink-0">{formatDate(appeal.submittedAt)}</span>
      </div>

      {/* Penalty info */}
      {appeal.penalty && (
        <div className="px-3 py-2.5 rounded-xl bg-foreground/[0.03] border border-border-subtle text-xs">
          <span className="text-foreground/40 font-bold uppercase tracking-wider text-[10px]">{t("moderationAppeals.penalty")}</span>
          <span className="text-foreground/70">{appeal.penalty.penaltyType?.replace(/_/g, " ")}</span>
          <span className="text-foreground/30 mx-1">·</span>
          <span className="text-foreground/50 italic line-clamp-1">{appeal.penalty.reason}</span>
        </div>
      )}

      {/* User reason */}
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/30">{t("moderationAppeals.usersReason")}</p>
        <p className="text-sm text-foreground/70 leading-relaxed line-clamp-3">{appeal.reason}</p>
        {appeal.evidence && (
          <a href={appeal.evidence} target="_blank" rel="noopener noreferrer"
            className="text-xs text-[#4880FF] hover:underline flex items-center gap-1">
            <Eye size={11} />
            {t("moderationAppeals.viewEvidence")}
          </a>
        )}
      </div>

      {/* Review info */}
      {appeal.reviewedByUserId && (
        <p className="text-[11px] text-foreground/30">
          {t("moderationAppeals.reviewedBy", { id: appeal.reviewedByUserId })}
          {appeal.reviewedAt && <span> · {formatDate(appeal.reviewedAt)}</span>}
        </p>
      )}

      {/* Admin decision */}
      {appeal.adminDecision && (
        <div className="px-3 py-2.5 rounded-xl bg-foreground/[0.03] border border-border-subtle">
          <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/30 mb-1">{t("moderationAppeals.decision")}</p>
          <p className="text-xs text-foreground/60 italic">"{appeal.adminDecision}"</p>
        </div>
      )}

      {/* Actions */}
      {isActionable && (
        <div className="flex items-center gap-2 pt-1 border-t border-border-subtle">
          {appeal.status === "PENDING" && (
            <button
              onClick={() => onReview(appeal)}
              disabled={reviewPending}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all disabled:opacity-40"
            >
              {reviewPending ? <Loader2 size={12} className="animate-spin" /> : null}
              {t("moderationAppeals.startReview")}
            </button>
          )}
          {appeal.status === "UNDER_REVIEW" && (
            <>
              <button
                onClick={() => onApprove(appeal)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all"
              >
                {t("moderationAppeals.approve")}
              </button>
              <button
                onClick={() => onReject(appeal)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all"
              >
                {t("moderationAppeals.reject")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AppealsQueuePage() {
  const { t } = useTranslation("common");
  const [searchParams, setSearchParams] = useSearchParams();
  const [appealAction, setAppealAction] = useState(null);
  const [userIdInput, setUserIdInput] = useState(searchParams.get("userId") ?? "");
  const debouncedUserId = useDebounce(userIdInput, 400);

  const page = Number(searchParams.get("page") ?? 1);
  const status = searchParams.get("status") ?? "";

  const setParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) { next.set(key, val); } else { next.delete(key); }
    next.set("page", "1");
    setSearchParams(next);
  };

  const filters = {
    page,
    limit: 10,
    ...(status ? { status } : {}),
    ...(debouncedUserId ? { userId: Number(debouncedUserId) } : {}),
  };

  const { data, isFetching } = useAppeals(filters);
  const reviewAppeal = useReviewAppeal();
  const approveAppeal = useApproveAppeal();
  const rejectAppeal = useRejectAppeal();

  const appeals = data?.data ?? [];
  const meta = data?.meta ?? {};
  const totalPages = meta.totalPages ?? 1;

  const pendingCount = appeals.filter((a) => a.status === "PENDING").length;
  const underReviewCount = appeals.filter((a) => a.status === "UNDER_REVIEW").length;

  const handleReview = async (appeal) => {
    try {
      await reviewAppeal.mutateAsync(appeal.id);
      toast.success("Appeal set to Under Review.");
    } catch (err) {
      toast.error(err?.message ?? "Failed to start review.");
    }
  };

  const handleDecision = async ({ adminDecision, adminNotes }) => {
    if (!appealAction) return;
    const { mode, appeal } = appealAction;
    try {
      if (mode === "approve") {
        await approveAppeal.mutateAsync({ id: appeal.id, data: { adminDecision, adminNotes } });
        toast.success("Appeal approved. Penalty and restrictions lifted.");
      } else {
        await rejectAppeal.mutateAsync({ id: appeal.id, data: { adminDecision, adminNotes } });
        toast.success("Appeal rejected.");
      }
      setAppealAction(null);
    } catch (err) {
      toast.error(err?.message ?? "Failed to process appeal.");
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* ── Page Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-[#4880FF]/10 text-[#4880FF]">
          <MessageSquareWarning size={26} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("moderationAppeals.title")}</h1>
          <p className="text-foreground/50 text-sm mt-0.5">{t("moderationAppeals.subtitle")}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 text-xs font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-ping" />
              {pendingCount} {t("moderationAppeals.pending")}
            </span>
          )}
          {underReviewCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-bold">
              {underReviewCount} {t("moderationAppeals.underReview")}
            </span>
          )}
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* User ID search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30" size={14} />
          <input
            type="number"
            placeholder={t("moderationAppeals.userIdPlaceholder")}
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground text-sm placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all w-36"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30" size={14} />
          <select
            value={status}
            onChange={(e) => setParam("status", e.target.value)}
            className="pl-9 pr-8 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all appearance-none cursor-pointer [&>option]:bg-white [&>option]:text-[#0f172a] dark:[&>option]:bg-[#0b1220] dark:[&>option]:text-white"
          >
            <option value="">{t("moderationAppeals.allStatuses")}</option>
            {APPEAL_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none" />
        </div>

        {(status || userIdInput) && (
          <button
            onClick={() => { setParam("status", ""); setUserIdInput(""); }}
            className="px-3.5 py-2.5 rounded-xl border border-border-subtle text-foreground/40 text-xs hover:bg-foreground/5 transition-all"
          >
            {t("clear")}
          </button>
        )}

        <span className="ml-auto text-xs text-foreground/30">
          {meta.total ?? 0} {t("moderationAppeals.total")}
        </span>
      </div>

      {/* ── Appeals List ─────────────────────────────────────────────────────────── */}
      {isFetching && appeals.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-foreground/20" />
        </div>
      ) : appeals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MessageSquareWarning size={40} className="text-foreground/10 mb-3" />
          <p className="text-foreground/30 text-sm">{t("moderationAppeals.noAppealsFound")}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appeals.map((appeal) => (
            <AppealCard
              key={appeal.id}
              appeal={appeal}
              onReview={handleReview}
              onApprove={(a) => setAppealAction({ mode: "approve", appeal: a })}
              onReject={(a) => setAppealAction({ mode: "reject", appeal: a })}
              reviewPending={reviewAppeal.isPending}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────────────── */}
      {meta.total > 0 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-foreground/30">
            {t("moderationAppeals.pageOfTotal", { page, totalPages, total: meta.total })}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setParam("page", String(Math.max(1, page - 1)))}
              disabled={page === 1}
              className="px-5 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground text-sm font-bold hover:bg-foreground/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {t("prev")}
            </button>
            <button
              onClick={() => setParam("page", String(Math.min(totalPages, page + 1)))}
              disabled={page >= totalPages}
              className="px-5 py-2.5 rounded-xl bg-[#4880FF] text-white font-bold text-sm hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {t("next")}
            </button>
          </div>
        </div>
      )}

      {/* ── Appeal Review Modal ─────────────────────────────────────────────────── */}
      <AppealReviewModal
        open={!!appealAction}
        onClose={() => setAppealAction(null)}
        onSubmit={handleDecision}
        isPending={approveAppeal.isPending || rejectAppeal.isPending}
        mode={appealAction?.mode}
        appeal={appealAction?.appeal}
      />
    </div>
  );
}

import { useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Lock,
  MessageSquareWarning,
  Plus,
  ChevronDown,
  ChevronRight,
  Loader2,
  Clock,
  Calendar,
  User,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useUserModerationOverview,
  useViolations,
  usePenalties,
  useRestrictions,
  useAppeals,
  useCreateViolation,
  useIssuePenalty,
  useRevokePenalty,
  useRevokeRestriction,
  useReviewAppeal,
  useApproveAppeal,
  useRejectAppeal,
} from "../../../hooks/api/useModeration";
import { StatusBadge } from "./StatusBadge";
import { SeverityBadge } from "./SeverityBadge";
import { RevokeModal } from "./RevokeModal";
import { IssueViolationModal } from "./IssueViolationModal";
import { IssuePenaltyModal } from "./IssuePenaltyModal";
import { AppealReviewModal } from "./AppealReviewModal";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeUntil(iso) {
  if (!iso) return null;
  const diff = new Date(iso) - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 24) return `${Math.floor(h / 24)}d remaining`;
  return `${h}h ${m}m remaining`;
}

/* ─── Account Status Header ────────────────────────────────────────────────── */
const ACCOUNT_STATUS_STYLES = {
  ACTIVE: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-500" },
  WARNING: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400" },
  RESTRICTED: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400" },
  SUSPENDED: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-500" },
  BANNED: { bg: "bg-red-900/20", border: "border-red-800/40", text: "text-red-400" },
};

function OverviewHeader({ overview, onIssueViolation, onIssuePenalty }) {
  const status = overview?.accountStatus ?? "ACTIVE";
  const style = ACCOUNT_STATUS_STYLES[status] ?? ACCOUNT_STATUS_STYLES.ACTIVE;

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-4 ${style.bg} ${style.border}`}
    >
      <div className="flex flex-wrap items-center gap-4">
        <StatusBadge status={status} size="md" />

        <div className="flex items-center gap-1.5 text-sm text-foreground/60">
          <AlertTriangle size={14} className="text-yellow-400" />
          <span className="font-bold text-foreground">
            {overview?.warningCount ?? 0}
          </span>
          <span>Warnings</span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-foreground/60">
          <ShieldAlert size={14} className="text-red-400" />
          <span className="font-bold text-foreground">
            {overview?.totalViolationsCount ?? 0}
          </span>
          <span>Total Violations</span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-foreground/60">
          <Lock size={14} className="text-orange-400" />
          <span className="font-bold text-foreground">
            {overview?.activePenalties?.length ?? 0}
          </span>
          <span>Active Penalties</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onIssueViolation}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-xs font-bold hover:bg-yellow-500/20 transition-all"
        >
          <Plus size={13} />
          Record Violation
        </button>
        <button
          onClick={onIssuePenalty}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all"
        >
          <Plus size={13} />
          Issue Penalty
        </button>
      </div>
    </div>
  );
}

/* ─── Section Shell ─────────────────────────────────────────────────────────── */
function Section({ icon: Icon, title, count, action, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-foreground/[0.02] transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={16} className="text-foreground/40" />}
          <span className="font-semibold text-foreground text-sm">{title}</span>
          {count !== undefined && (
            <span className="text-[10px] font-bold bg-foreground/8 text-foreground/50 px-2 py-0.5 rounded-full border border-border-subtle">
              {count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {action}
          {open ? (
            <ChevronDown size={15} className="text-foreground/30" />
          ) : (
            <ChevronRight size={15} className="text-foreground/30" />
          )}
        </div>
      </button>
      {open && <div className="border-t border-border-subtle">{children}</div>}
    </div>
  );
}

/* ─── Empty State ────────────────────────────────────────────────────────────── */
function EmptyState({ message }) {
  return (
    <div className="py-8 text-center text-foreground/30 text-sm italic">
      {message}
    </div>
  );
}

/* ─── Violations Section ─────────────────────────────────────────────────────── */
function ViolationsSection({ userId, onAddViolation }) {
  const [page, setPage] = useState(1);
  const { data, isFetching } = useViolations(
    { userId, page, limit: 5 },
    { enabled: !!userId }
  );

  const violations = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <Section
      icon={AlertTriangle}
      title="Violations"
      count={total}
      defaultOpen
      action={
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddViolation();
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-[10px] font-bold hover:bg-yellow-500/20 transition-all"
        >
          <Plus size={11} />
          Record
        </button>
      }
    >
      {isFetching && violations.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-foreground/30" />
        </div>
      ) : violations.length === 0 ? (
        <EmptyState message="No violations recorded." />
      ) : (
        <div className="divide-y divide-border-subtle">
          {violations.map((v) => (
            <div
              key={v.id}
              className="px-5 py-3.5 flex items-start justify-between gap-4 hover:bg-foreground/[0.02] transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-foreground">
                    {v.violationType?.replace(/_/g, " ")}
                  </span>
                  <SeverityBadge severity={v.severity} />
                  <StatusBadge status={v.status} />
                </div>
                <p className="text-xs text-foreground/50 truncate">{v.description}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-foreground/30">
                  <Calendar size={10} />
                  {formatDate(v.occurredAt)}
                  {v.sourceType && (
                    <>
                      <span>·</span>
                      <span>
                        {v.sourceType} #{v.sourceId}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-foreground/30 shrink-0 font-mono">
                #{v.id}
              </span>
            </div>
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="px-5 py-3 border-t border-border-subtle flex items-center justify-between">
          <span className="text-[10px] text-foreground/30">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs text-foreground/50 hover:bg-foreground/5 disabled:opacity-30 transition-all"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs text-foreground/50 hover:bg-foreground/5 disabled:opacity-30 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}

/* ─── Penalties Section ──────────────────────────────────────────────────────── */
function PenaltyRow({ penalty, onRevoke }) {
  const [expanded, setExpanded] = useState(false);
  const isActive = penalty.status === "ACTIVE";
  const remaining = isActive ? timeUntil(penalty.expiresAt) : null;

  return (
    <div className="border-b border-border-subtle last:border-0">
      <div
        className="px-5 py-3.5 flex items-start justify-between gap-4 hover:bg-foreground/[0.02] transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-foreground">
              {penalty.penaltyType?.replace(/_/g, " ")}
            </span>
            <SeverityBadge severity={penalty.severity} />
            <StatusBadge status={penalty.status} />
            {penalty.issuedByType === "AUTOMATED_RULE" && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Auto
              </span>
            )}
          </div>
          <p className="text-xs text-foreground/50 line-clamp-1">{penalty.reason}</p>
          <div className="flex items-center gap-2 text-[10px] text-foreground/30 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar size={10} /> {formatDate(penalty.issuedAt)}
            </span>
            {penalty.expiresAt && (
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {remaining ?? formatDate(penalty.expiresAt)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isActive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRevoke(penalty);
              }}
              className="px-2.5 py-1 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-400 text-[10px] font-bold hover:bg-orange-500/20 transition-all"
            >
              Revoke
            </button>
          )}
          {expanded ? (
            <ChevronDown size={13} className="text-foreground/30" />
          ) : (
            <ChevronRight size={13} className="text-foreground/30" />
          )}
        </div>
      </div>

      {/* Expanded: associated restrictions */}
      {expanded && penalty.restrictions?.length > 0 && (
        <div className="px-5 pb-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/30 mb-2">
            Associated Restrictions
          </p>
          <div className="flex flex-wrap gap-2">
            {penalty.restrictions.map((r) => (
              <span
                key={r.id}
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${
                  r.status === "ACTIVE"
                    ? "bg-orange-500/10 text-orange-400 border-orange-500/25"
                    : "bg-foreground/5 text-foreground/30 border-border-subtle"
                }`}
              >
                {r.restrictionType?.replace(/_/g, " ")}
              </span>
            ))}
          </div>
          {penalty.revocationReason && (
            <p className="text-xs text-foreground/40 mt-2">
              <strong>Revocation reason:</strong> {penalty.revocationReason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PenaltiesSection({ userId, userRole, onAddPenalty, onRevokePenalty }) {
  const [page, setPage] = useState(1);
  const { data, isFetching } = usePenalties(
    { userId, page, limit: 5 },
    { enabled: !!userId }
  );

  const penalties = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <Section
      icon={ShieldAlert}
      title="Penalties"
      count={total}
      defaultOpen
      action={
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddPenalty();
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-all"
        >
          <Plus size={11} />
          Issue
        </button>
      }
    >
      {isFetching && penalties.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-foreground/30" />
        </div>
      ) : penalties.length === 0 ? (
        <EmptyState message="No penalties issued." />
      ) : (
        <>
          <div>
            {penalties.map((p) => (
              <PenaltyRow key={p.id} penalty={p} onRevoke={onRevokePenalty} />
            ))}
          </div>
          {total > 0 && (
            <div className="px-5 py-3 border-t border-border-subtle flex items-center justify-between">
              <span className="text-[10px] text-foreground/30">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs text-foreground/50 hover:bg-foreground/5 disabled:opacity-30 transition-all"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs text-foreground/50 hover:bg-foreground/5 disabled:opacity-30 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Section>
  );
}

/* ─── Restrictions Section ───────────────────────────────────────────────────── */
function RestrictionsSection({ userId, onRevokeRestriction }) {
  const [page, setPage] = useState(1);
  const { data, isFetching } = useRestrictions(
    { userId, activeOnly: true, page, limit: 5 },
    { enabled: !!userId }
  );

  const restrictions = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <Section
      icon={Lock}
      title="Active Restrictions"
      count={total}
      defaultOpen={total > 0}
    >
      {isFetching && restrictions.length === 0 ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={18} className="animate-spin text-foreground/30" />
        </div>
      ) : restrictions.length === 0 ? (
        <EmptyState message="No active restrictions." />
      ) : (
        <div className="divide-y divide-border-subtle">
          {restrictions.map((r) => (
            <div
              key={r.id}
              className="px-5 py-3 flex items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground">
                  {r.restrictionType?.replace(/_/g, " ")}
                </span>
                <div className="flex items-center gap-1.5 text-[10px] text-foreground/30">
                  <Clock size={10} />
                  {r.expiresAt ? timeUntil(r.expiresAt) : "Permanent"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={r.status} />
                <button
                  onClick={() => onRevokeRestriction(r)}
                  className="px-2.5 py-1 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-400 text-[10px] font-bold hover:bg-orange-500/20 transition-all"
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="px-5 py-3 border-t border-border-subtle flex items-center justify-between">
          <span className="text-[10px] text-foreground/30">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs text-foreground/50 hover:bg-foreground/5 disabled:opacity-30 transition-all"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs text-foreground/50 hover:bg-foreground/5 disabled:opacity-30 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}

/* ─── Appeals Section ────────────────────────────────────────────────────────── */
function AppealsSection({ userId, onReview, onApprove, onReject }) {
  const [page, setPage] = useState(1);
  const { data, isFetching } = useAppeals(
    { userId, page, limit: 5 },
    { enabled: !!userId }
  );

  const appeals = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <Section
      icon={MessageSquareWarning}
      title="Appeals"
      count={total}
      defaultOpen={appeals.some((a) =>
        ["PENDING", "UNDER_REVIEW"].includes(a.status)
      )}
    >
      {isFetching && appeals.length === 0 ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={18} className="animate-spin text-foreground/30" />
        </div>
      ) : appeals.length === 0 ? (
        <EmptyState message="No appeals submitted." />
      ) : (
        <div className="divide-y divide-border-subtle">
          {appeals.map((appeal) => (
            <div key={appeal.id} className="px-5 py-3.5 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={appeal.status} />
                    <span className="text-[10px] text-foreground/30 font-mono">
                      Appeal #{appeal.id} · Penalty #{appeal.penaltyId}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/60 line-clamp-2">
                    {appeal.reason}
                  </p>
                  <p className="text-[10px] text-foreground/30">
                    Submitted {formatDate(appeal.submittedAt)}
                  </p>
                </div>
              </div>

              {/* Action buttons based on status */}
              {appeal.status === "PENDING" && (
                <button
                  onClick={() => onReview(appeal)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-bold hover:bg-blue-500/20 transition-all"
                >
                  Start Review
                </button>
              )}

              {appeal.status === "UNDER_REVIEW" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onApprove(appeal)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20 transition-all"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onReject(appeal)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-all"
                  >
                    Reject
                  </button>
                </div>
              )}

              {["APPROVED", "REJECTED"].includes(appeal.status) &&
                appeal.adminDecision && (
                  <p className="text-[11px] text-foreground/40 italic">
                    "{appeal.adminDecision}"
                  </p>
                )}
            </div>
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="px-5 py-3 border-t border-border-subtle flex items-center justify-between">
          <span className="text-[10px] text-foreground/30">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs text-foreground/50 hover:bg-foreground/5 disabled:opacity-30 transition-all"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs text-foreground/50 hover:bg-foreground/5 disabled:opacity-30 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   UserModerationTab — Main Command Center
═══════════════════════════════════════════════════════════════════════════════ */

/**
 * The full Moderation Command Center for a single user.
 * Drop this into any User Detail page as a tab content.
 *
 * @param {{ userId: number, userRole?: 'DRIVER' | 'RIDER' }} props
 */
export function UserModerationTab({ userId, userRole = "DRIVER" }) {
  const navigate = useNavigate();

  // Overview data
  const { data: overview, isLoading: overviewLoading } =
    useUserModerationOverview(userId);

  // Modals state
  const [violationModal, setViolationModal] = useState(false);
  const [penaltyModal, setPenaltyModal] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null); // { type: 'penalty'|'restriction', item }
  const [appealAction, setAppealAction] = useState(null); // { mode: 'approve'|'reject', appeal }

  // Mutations
  const createViolation = useCreateViolation();
  const issuePenalty = useIssuePenalty();
  const revokePenalty = useRevokePenalty();
  const revokeRestriction = useRevokeRestriction();
  const reviewAppeal = useReviewAppeal();
  const approveAppeal = useApproveAppeal();
  const rejectAppeal = useRejectAppeal();

  /* ── Handlers ────────────────────────────────────────────────────────────── */

  const handleCreateViolation = async (data) => {
    try {
      await createViolation.mutateAsync(data);
      toast.success("Violation recorded successfully.");
      setViolationModal(false);
    } catch (err) {
      toast.error(err?.message ?? "Failed to record violation.");
    }
  };

  const handleIssuePenalty = async (data) => {
    try {
      await issuePenalty.mutateAsync(data);
      toast.success("Penalty issued successfully.");
      setPenaltyModal(false);
    } catch (err) {
      toast.error(err?.message ?? "Failed to issue penalty.");
    }
  };

  const handleRevoke = async (reason) => {
    if (!revokeTarget) return;
    try {
      if (revokeTarget.type === "penalty") {
        await revokePenalty.mutateAsync({
          id: revokeTarget.item.id,
          data: { reason },
        });
        toast.success("Penalty revoked. All associated restrictions have been lifted.");
      } else {
        await revokeRestriction.mutateAsync({
          id: revokeTarget.item.id,
          data: { reason },
        });
        toast.success("Restriction revoked successfully.");
      }
      setRevokeTarget(null);
    } catch (err) {
      toast.error(err?.message ?? "Failed to revoke.");
    }
  };

  const handleReviewAppeal = async (appeal) => {
    try {
      await reviewAppeal.mutateAsync(appeal.id);
      toast.success("Appeal assigned for review.");
    } catch (err) {
      toast.error(err?.message ?? "Failed to start review.");
    }
  };

  const handleAppealDecision = async ({ adminDecision, adminNotes }) => {
    if (!appealAction) return;
    const { mode, appeal } = appealAction;
    try {
      if (mode === "approve") {
        await approveAppeal.mutateAsync({
          id: appeal.id,
          data: { adminDecision, adminNotes },
        });
        toast.success("Appeal approved. Penalty and restrictions have been lifted.");
      } else {
        await rejectAppeal.mutateAsync({
          id: appeal.id,
          data: { adminDecision, adminNotes },
        });
        toast.success("Appeal rejected. Penalty remains active.");
      }
      setAppealAction(null);
    } catch (err) {
      toast.error(err?.message ?? "Failed to process appeal.");
    }
  };

  /* ── Loading skeleton ────────────────────────────────────────────────────── */
  if (overviewLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 rounded-2xl bg-foreground/5" />
        <div className="h-40 rounded-2xl bg-foreground/5" />
        <div className="h-40 rounded-2xl bg-foreground/5" />
      </div>
    );
  }

  const revokeIsPending =
    revokePenalty.isPending || revokeRestriction.isPending;
  const appealIsPending =
    approveAppeal.isPending || rejectAppeal.isPending;

  return (
    <div className="space-y-4">
      {/* ── Header strip ─────────────────────────────────────────────────────── */}
      <OverviewHeader
        overview={overview}
        onIssueViolation={() => setViolationModal(true)}
        onIssuePenalty={() => setPenaltyModal(true)}
      />

      {/* ── Deep link to global moderation pages ─────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/30">
          Global views:
        </span>
        {[
          { label: "All Violations", path: `/moderation/violations?userId=${userId}` },
          { label: "All Penalties", path: `/moderation/penalties?userId=${userId}` },
          { label: "Audit Log", path: `/moderation/audit-logs?targetUserId=${userId}` },
        ].map((link) => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className="flex items-center gap-1 text-[10px] font-bold text-[#4880FF] hover:underline"
          >
            <ExternalLink size={10} />
            {link.label}
          </button>
        ))}
      </div>

      {/* ── Sections ─────────────────────────────────────────────────────────── */}
      <ViolationsSection
        userId={userId}
        onAddViolation={() => setViolationModal(true)}
      />

      <PenaltiesSection
        userId={userId}
        userRole={userRole}
        onAddPenalty={() => setPenaltyModal(true)}
        onRevokePenalty={(p) => setRevokeTarget({ type: "penalty", item: p })}
      />

      <RestrictionsSection
        userId={userId}
        onRevokeRestriction={(r) =>
          setRevokeTarget({ type: "restriction", item: r })
        }
      />

      <AppealsSection
        userId={userId}
        onReview={handleReviewAppeal}
        onApprove={(appeal) => setAppealAction({ mode: "approve", appeal })}
        onReject={(appeal) => setAppealAction({ mode: "reject", appeal })}
      />

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <IssueViolationModal
        open={violationModal}
        onClose={() => setViolationModal(false)}
        onSubmit={handleCreateViolation}
        isPending={createViolation.isPending}
        userId={userId}
        defaultRole={userRole}
      />

      <IssuePenaltyModal
        open={penaltyModal}
        onClose={() => setPenaltyModal(false)}
        onSubmit={handleIssuePenalty}
        isPending={issuePenalty.isPending}
        userId={userId}
        defaultRole={userRole}
      />

      <RevokeModal
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        isPending={revokeIsPending}
        entity={revokeTarget?.type}
        title={
          revokeTarget?.type === "penalty"
            ? `Revoke Penalty #${revokeTarget?.item?.id}`
            : `Revoke Restriction — ${revokeTarget?.item?.restrictionType?.replace(/_/g, " ")}`
        }
        description={
          revokeTarget?.type === "penalty"
            ? revokeTarget?.item?.penaltyType?.replace(/_/g, " ")
            : undefined
        }
      />

      <AppealReviewModal
        open={!!appealAction}
        onClose={() => setAppealAction(null)}
        onSubmit={handleAppealDecision}
        isPending={appealIsPending}
        mode={appealAction?.mode}
        appeal={appealAction?.appeal}
      />
    </div>
  );
}

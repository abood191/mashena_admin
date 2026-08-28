import { useState } from "react";
import { Loader2, X, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { useTranslation, Trans } from "react-i18next";

/**
 * AppealReviewModal — approve or reject an appeal.
 * Mode: 'approve' | 'reject'
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onSubmit: (data: { adminDecision: string, adminNotes?: string }) => void,
 *   isPending: boolean,
 *   mode: 'approve' | 'reject',
 *   appeal: object | null,
 * }} props
 */
export function AppealReviewModal({
  open,
  onClose,
  onSubmit,
  isPending,
  mode,
  appeal,
}) {
  const { t } = useTranslation("common");
  const [adminDecision, setAdminDecision] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  if (!open) return null;

  const isApprove = mode === "approve";

  const handleSubmit = () => {
    if (!adminDecision.trim()) return;
    onSubmit({
      adminDecision: adminDecision.trim(),
      ...(adminNotes.trim() ? { adminNotes: adminNotes.trim() } : {}),
    });
  };

  const handleClose = () => {
    if (isPending) return;
    setAdminDecision("");
    setAdminNotes("");
    onClose();
  };

  const isValid = adminDecision.trim().length >= 10;

  return (
    <div className="fixed inset-0 z-[999]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="absolute inset-0 grid place-items-center p-4 pointer-events-none overflow-y-auto">
        <div className="w-full max-w-[540px] my-4 rounded-3xl border border-border-subtle bg-surface shadow-[0_24px_80px_-30px_rgba(0,0,0,0.75)] overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  isApprove
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {isApprove ? (
                  <CheckCircle size={18} />
                ) : (
                  <XCircle size={18} />
                )}
              </div>
              <div>
                <h3 className="text-foreground font-bold text-base">
                  {isApprove ? t("appealReviewModal.approveAppeal") : t("appealReviewModal.rejectAppeal")}
                </h3>
                <p className="text-xs text-foreground/50 mt-0.5">
                  {t("appealReviewModal.appealUser", { appealId: appeal?.id, userId: appeal?.userId })}
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
            {/* Appeal context */}
            {appeal?.reason && (
              <div className="p-4 rounded-2xl bg-foreground/[0.03] border border-border-subtle space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground/30">
                  {t("appealReviewModal.usersReason")}
                </p>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  {appeal.reason}
                </p>
                {appeal.evidence && (
                  <a
                    href={appeal.evidence}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#4880FF] hover:underline flex items-center gap-1 mt-1"
                  >
                    <MessageSquare size={11} />
                    {t("appealReviewModal.viewEvidence")}
                  </a>
                )}
              </div>
            )}

            {/* Cascade warning for approve */}
            {isApprove && (
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
                <CheckCircle
                  size={15}
                  className="text-emerald-400 mt-0.5 shrink-0"
                />
                <p className="text-xs text-foreground/60">
                  <Trans i18nKey="appealReviewModal.approveWarning" t={t}>
                    Approving this appeal will automatically{" "}
                    <strong className="text-foreground/80">
                      revoke the associated penalty
                    </strong>{" "}
                    and lift all its feature restrictions.
                  </Trans>
                </p>
              </div>
            )}

            {/* Reject warning */}
            {!isApprove && (
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-500/5 border border-red-500/15">
                <XCircle
                  size={15}
                  className="text-red-400 mt-0.5 shrink-0"
                />
                <p className="text-xs text-foreground/60">
                  <Trans i18nKey="appealReviewModal.rejectWarning" t={t}>
                    Rejecting this appeal will keep the penalty{" "}
                    <strong className="text-foreground/80">ACTIVE</strong>.
                  </Trans>
                </p>
              </div>
            )}

            {/* Admin Decision (public) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">
                {t("appealReviewModal.adminDecision")}{" "}
                <span className="text-foreground/25 font-normal normal-case">
                  {t("appealReviewModal.shownToUser")}
                </span>{" "}
                <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                value={adminDecision}
                onChange={(e) => setAdminDecision(e.target.value)}
                placeholder={
                  isApprove
                    ? t("appealReviewModal.approvePlaceholder")
                    : t("appealReviewModal.rejectPlaceholder")
                }
                className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all resize-none text-sm"
              />
            </div>

            {/* Admin Notes (internal) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">
                {t("appealReviewModal.internalNotes")}{" "}
                <span className="text-foreground/25 font-normal normal-case">
                  {t("appealReviewModal.adminOnly")}
                </span>
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={t("appealReviewModal.notesPlaceholder")}
                className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all resize-none text-sm"
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
              {t("appealReviewModal.cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid || isPending}
              className={`px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg ${
                isApprove
                  ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                  : "bg-red-500 hover:bg-red-600 shadow-red-500/20"
              }`}
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isPending
                ? isApprove
                  ? t("appealReviewModal.approving")
                  : t("appealReviewModal.rejecting")
                : isApprove
                ? t("appealReviewModal.approveAppeal")
                : t("appealReviewModal.rejectAppeal")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

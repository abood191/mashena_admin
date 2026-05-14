import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ModalShell } from "@/components/ui/ModalShell";
import { XCircle } from "lucide-react";

/**
 * Non-blocking rejection reason modal.
 * Replaces the native prompt() call to prevent UI hanging.
 */
export function RejectReasonModal({ open, onClose, onConfirm, loading }) {
  const { t } = useTranslation("common");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
      setError("");
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError(t("requestDetails.rejectionReasonRequired", { defaultValue: "Rejection reason is required." }));
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <ModalShell
      open={open}
      title={t("requestDetails.rejectTitle", { defaultValue: "Reject Driver Request" })}
      subtitle={t("requestDetails.rejectSubtitle", { defaultValue: "Please provide a reason. This will be sent to the driver." })}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 px-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-sm text-white/80 disabled:opacity-60 transition"
          >
            {t("common.cancel", { defaultValue: "Cancel" })}
          </button>
          <button
            type="submit"
            form="reject-form"
            disabled={loading}
            className="h-10 px-5 rounded-2xl bg-red-500 hover:bg-red-600 text-sm font-bold text-white disabled:opacity-60 transition flex items-center gap-2 shadow-lg shadow-red-500/25"
          >
            {loading && <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />}
            <XCircle size={16} />
            {t("requestDetails.reject", { defaultValue: "Reject" })}
          </button>
        </>
      }
    >
      <form id="reject-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-white/70">
            {t("requestDetails.rejectionReason", { defaultValue: "Rejection Reason" })}
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError("");
            }}
            rows={4}
            placeholder={t("requestDetails.rejectionReasonPlaceholder", { defaultValue: "Explain why this request is being rejected..." })}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 transition-all resize-none shadow-inner shadow-black/20"
          />
          {error && <div className="mt-2 text-xs font-medium text-red-400">{error}</div>}
        </div>
      </form>
    </ModalShell>
  );
}

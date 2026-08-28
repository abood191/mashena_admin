import { useState } from "react";
import { Loader2, X, ShieldOff, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * RevokeModal — shared between penalty revoke and restriction revoke.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onConfirm: (reason: string) => void,
 *   isPending: boolean,
 *   title?: string,
 *   description?: string,
 *   entity?: 'penalty' | 'restriction',
 * }} props
 */
export function RevokeModal({
  open,
  onClose,
  onConfirm,
  isPending,
  title,
  description,
  entity = "penalty",
}) {
  const { t } = useTranslation("common");
  const [reason, setReason] = useState("");

  if (!open) return null;

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    if (isPending) return;
    setReason("");
    onClose();
  };

  const isRestriction = entity === "restriction";

  return (
    <div className="fixed inset-0 z-[999]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="absolute inset-0 grid place-items-center p-4 pointer-events-none">
        <div className="w-full max-w-[500px] rounded-3xl border border-border-subtle bg-surface shadow-[0_24px_80px_-30px_rgba(0,0,0,0.75)] overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                <ShieldOff size={18} />
              </div>
              <div>
                <h3 className="text-foreground font-bold text-base">{title || t("revokeModal.revoke")}</h3>
                {description && (
                  <p className="text-xs text-foreground/50 mt-0.5">{description}</p>
                )}
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
          <div className="p-6 space-y-4">
            {/* Warning notice */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/15">
              <AlertTriangle size={16} className="text-orange-400 mt-0.5 shrink-0" />
              <p className="text-sm text-foreground/70">
                {isRestriction
                  ? t("revokeModal.restrictionWarning")
                  : t("revokeModal.penaltyWarning")}
              </p>
            </div>

            {/* Reason field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">
                {t("revokeModal.revocationReason")}
              </label>
              <textarea
                id="revoke-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("revokeModal.reasonPlaceholder")}
                className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all resize-none text-sm"
              />
              <p className="text-xs text-foreground/30 ml-1">
                {reason.length} / 500 {t("revokeModal.characters")}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-end gap-3 bg-foreground/[0.02]">
            <button
              onClick={handleClose}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground text-sm font-medium hover:bg-foreground/10 transition-all disabled:opacity-30"
            >
              {t("revokeModal.cancel")}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!reason.trim() || isPending || reason.length > 500}
              className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-orange-500/20"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isPending ? t("revokeModal.revoking") : t("revokeModal.confirmRevoke")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

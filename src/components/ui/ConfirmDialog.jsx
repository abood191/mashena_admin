import { ModalShell } from "./ModalShell";

export function ConfirmDialog({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  dangerLabel,
  cancelLabel,
  loading,
}) {
  return (
    <ModalShell
      open={open}
      title={title}
      subtitle={message}
      onClose={onCancel}
      footer={
        <>
          <button
            onClick={onCancel}
            disabled={loading}
            className="h-10 px-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-sm text-white/80 disabled:opacity-60 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="h-10 px-4 rounded-2xl bg-red-500/90 hover:bg-red-500 text-sm text-white disabled:opacity-60 transition shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          >
            {loading ? "..." : dangerLabel}
          </button>
        </>
      }
    />
  );
}

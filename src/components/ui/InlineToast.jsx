export function InlineToast({ show, tone = "info", message, onClose }) {
  if (!show) return null;

  const base = "rounded-2xl border px-4 py-3 text-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300";
  const toneClass =
    tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
      : tone === "error"
      ? "border-red-500/30 bg-red-500/10 text-red-100"
      : "border-white/10 bg-white/[0.03] text-white/80";

  return (
    <div className={`${base} ${toneClass}`}>
      <span className="truncate">{message}</span>
      <button
        onClick={onClose}
        className="h-7 w-7 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] grid place-items-center text-xs transition"
        title="Close"
      >
        ×
      </button>
    </div>
  );
}

export function ModalShell({ open, title, subtitle, onClose, children, footer }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4 pointer-events-none">
        <div className="w-full max-w-[560px] rounded-3xl border border-border-subtle bg-surface shadow-[0_24px_80px_-30px_rgba(0,0,0,0.75)] overflow-hidden pointer-events-auto transform transition-all animate-in fade-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-border-subtle">
            <div className="text-foreground text-lg font-semibold">{title}</div>
            {subtitle ? (
              <div className="mt-1 text-sm text-muted">{subtitle}</div>
            ) : null}
          </div>

          <div className="p-6">{children}</div>

          <div className="p-4 border-t border-border-subtle flex items-center justify-end gap-2 bg-foreground/5">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}

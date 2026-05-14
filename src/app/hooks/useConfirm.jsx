import { useState, useCallback } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function useConfirm() {
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
    dangerLabel: "Confirm",
    cancelLabel: "Cancel",
    loading: false,
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmState({
        open: true,
        title: options.title || "Are you sure?",
        message: options.message || "This action cannot be undone.",
        dangerLabel: options.dangerLabel || "Confirm",
        cancelLabel: options.cancelLabel || "Cancel",
        onConfirm: () => {
          setConfirmState((prev) => ({ ...prev, loading: true }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmState((prev) => ({ ...prev, open: false }));
          resolve(false);
        },
        loading: false,
      });
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, open: false, loading: false }));
  }, []);

  const ConfirmComponent = (
    <ConfirmDialog
      open={confirmState.open}
      title={confirmState.title}
      message={confirmState.message}
      dangerLabel={confirmState.dangerLabel}
      cancelLabel={confirmState.cancelLabel}
      onConfirm={confirmState.onConfirm}
      onCancel={confirmState.onCancel}
      loading={confirmState.loading}
    />
  );

  return { confirm, closeConfirm, ConfirmComponent };
}

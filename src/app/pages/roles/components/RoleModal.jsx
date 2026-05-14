import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ModalShell } from "../../../../components/ui/ModalShell";

export function RoleModal({ open, mode, initialName = "", onClose, onSubmit, loading }) {
  const { t } = useTranslation("common");
  const [name, setName] = useState(initialName);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setName(initialName || "");
      setErr("");
    }
  }, [open, initialName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErr("");

    const cleaned = (name || "").trim().toUpperCase();
    if (!cleaned) {
      setErr(t("roles.modal.nameRequired", { defaultValue: "Role name is required" }));
      return;
    }
    onSubmit(cleaned);
  };

  return (
    <ModalShell
      open={open}
      title={mode === "create" ? t("roles.modal.createTitle", { defaultValue: "Create Role" }) : t("roles.modal.editTitle", { defaultValue: "Edit Role" })}
      subtitle={mode === "create" ? t("roles.modal.createSubtitle") : t("roles.modal.editSubtitle")}
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
            form="role-form"
            disabled={loading}
            className="h-10 px-4 rounded-2xl bg-[#4880FF] hover:brightness-110 text-sm text-white font-bold disabled:opacity-60 transition shadow-lg shadow-[#4880FF]/25 flex items-center justify-center gap-2"
          >
            {loading && <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>}
            {loading ? t("common.saving", { defaultValue: "Saving..." }) : t("common.save", { defaultValue: "Save" })}
          </button>
        </>
      }
    >
      <form id="role-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-white/70 font-semibold">{t("roles.modal.nameLabel", { defaultValue: "Role Name" })}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("roles.modal.namePlaceholder", { defaultValue: "e.g. SUPER_ADMIN" })}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#4880FF]/70 focus:ring-4 focus:ring-[#4880FF]/10 transition-all shadow-inner shadow-black/20 uppercase"
          />
          {err && <div className="mt-2 text-xs text-red-400 font-medium">{err}</div>}
        </div>

        <div className="text-xs text-white/40 italic"> {t("roles.modal.hint", { defaultValue: "Roles are usually uppercase and separated by underscores." })}</div>
      </form>
    </ModalShell>
  );
}

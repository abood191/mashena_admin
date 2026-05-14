import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAppSettings, useUpdateAppSetting } from "@/app/hooks/api/useAppSettings";
import { ModalShell } from "@/components/ui/ModalShell";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";

/* ----------------------------- UI Components ----------------------------- */

function EditSettingModal({ open, setting, onClose, onSubmit, loading }) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open && setting) {
      setValue(String(setting.value || ""));
      setErr("");
    }
  }, [open, setting]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErr("");

    const val = value.trim();
    if (!val) {
      setErr(t("settings.modal.valueRequired"));
      return;
    }
    
    if (isNaN(Number(val))) {
      setErr(t("settings.modal.numericRequired"));
      return;
    }

    onSubmit(setting.key, val);
  };

  if (!open || !setting) return null;

  return (
    <ModalShell
      open={open}
      title={t("settings.modal.editTitle")}
      subtitle={`${t("settings.modal.editSubtitle")} ${setting.key}`}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 px-4 rounded-2xl border border-white/10 bg-[var(--color-surface,#0b1220)] hover:bg-white/[0.06] text-sm text-white/80 disabled:opacity-60 transition"
          >
            {t("common.cancel")}
          </button>

          <button
            type="submit"
            form="setting-form"
            disabled={loading}
            className="h-10 px-4 rounded-2xl bg-[var(--color-primary,#4880FF)] hover:brightness-110 text-sm text-white disabled:opacity-60 transition"
          >
            {loading ? t("common.saving") : t("common.save")}
          </button>
        </>
      }
    >
      <form id="setting-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-white/70">{t("settings.modal.valueLabel")}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("settings.modal.valuePlaceholder")}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-[var(--color-primary)]/70 focus:ring-4 focus:ring-[var(--color-primary)]/10 transition"
          />
          {err && <div className="mt-2 text-xs text-red-200">{err}</div>}
        </div>
      </form>
    </ModalShell>
  );
}

/* ----------------------------- Page Component ----------------------------- */

export default function SettingsPage() {
  const { t } = useTranslation();
  
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const [editOpen, setEditOpen] = useState(false);
  const [editSetting, setEditSetting] = useState(null);

  // --- React Query for Data Fetching & Caching ---
  const { data, isLoading, isError, error } = useAppSettings({ skip, limit, search: debouncedSearch });

  const updateMutation = useUpdateAppSetting();

  const handleUpdate = async ({ key, value }) => {
    try {
      await updateMutation.mutateAsync({ key, value });
      toast.success(t("settings.toast.updated", { defaultValue: "Setting updated successfully" }));
      setEditOpen(false);
      setEditSetting(null);
    } catch (err) {
      toast.error(t("settings.toast.failed", { defaultValue: "Failed to update" }) + ": " + (err?.message || ""));
    }
  };

  const settings = data?.data || [];
  const settingsCount = data?.count || 0;

  const handleEdit = (setting) => {
    setEditSetting(setting);
    setEditOpen(true);
  };

  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(settingsCount / limit));
  const canPrev = skip > 0;
  const canNext = skip + limit < settingsCount;

  useEffect(() => {
    if (isError) {
      toast.error(t("settings.toast.failed", { defaultValue: "Failed" }) + ": " + (error?.message || ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError]);

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-white text-2xl font-bold">{t("settings.title")}</div>
          <div className="mt-1 text-white/50 text-sm">{t("settings.subtitle")}</div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-[var(--color-surface,#0b1220)] shadow-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4 bg-white/[0.01]">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSkip(0);
            }}
            placeholder={t("settings.search")}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-[var(--color-primary)]/70 focus:ring-4 focus:ring-[var(--color-primary)]/10 transition"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
             <div className="p-12 flex justify-center items-center">
                 <div className="h-8 w-8 rounded-full border-4 border-white/10 border-t-[var(--color-primary)] animate-spin"></div>
             </div>
          ) : (
            <table className="w-full text-left text-sm text-white/80">
              <thead className="bg-white/[0.02] text-xs uppercase text-white/50 font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">{t("settings.table.key")}</th>
                  <th className="px-6 py-4">{t("settings.table.value")}</th>
                  <th className="px-6 py-4">{t("settings.table.updatedAt")}</th>
                  <th className="px-6 py-4">{t("settings.table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {settings.map((item, i) => (
                  <tr key={item.key} className="hover:bg-white/[0.03] transition-colors duration-200" style={{ animationDelay: `${i * 30}ms` }}>
                    <td className="px-6 py-4 font-medium text-white">{item.key}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-sm text-white]">
                        {item.value}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/50">
                       {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-6 py-4">
                       <button
                         onClick={() => handleEdit(item)}
                         className="h-9 px-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] text-white/80 hover:text-white text-xs transition-all active:scale-95"
                       >
                         {t("settings.editValue")}
                       </button>
                    </td>
                  </tr>
                ))}

                {settings.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-white/50">
                      {search ? t("common.nodata") : t("common.nodata")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-white/10 bg-white/[0.01]">
          <div className="text-xs font-semibold tracking-wider text-white/40 uppercase">
            {settingsCount === 0
              ? "0"
              : `Page ${currentPage} / ${totalPages} — ${settingsCount} total`}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSkip((s) => Math.max(0, s - limit))}
              disabled={!canPrev || isLoading}
              className="h-8 px-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-xs font-semibold text-white/80 disabled:opacity-30 transition-all active:scale-95"
            >
              Prev
            </button>
            <button
              onClick={() => setSkip((s) => s + limit)}
              disabled={!canNext || isLoading}
              className="h-8 px-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-xs font-semibold text-white/80 disabled:opacity-30 transition-all active:scale-95"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <EditSettingModal
        open={editOpen}
        setting={editSetting}
        onClose={() => {
          setEditOpen(false);
          setEditSetting(null);
        }}
        onSubmit={(key, value) => handleUpdate({ key, value })}
        loading={updateMutation.isPending}
      />
    </div>
  );
}

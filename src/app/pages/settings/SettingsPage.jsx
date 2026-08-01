import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAppSettings, useUpdateAppSetting } from "@/app/hooks/api/useAppSettings";
import { ModalShell } from "@/components/ui/ModalShell";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { Search } from "lucide-react";

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
            className="h-10 px-4 rounded-2xl border border-border-subtle bg-surface hover:bg-foreground/10 text-sm text-foreground disabled:opacity-60 transition"
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
          <label className="text-sm text-foreground">{t("settings.modal.valueLabel")}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("settings.modal.valuePlaceholder")}
            className="mt-2 w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:border-[var(--color-primary)]/70 focus:ring-4 focus:ring-[var(--color-primary)]/10 transition"
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
  const settingsCount = data?.count ?? 0;

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
          <div className="text-foreground text-2xl font-bold">{t("settings.title")}</div>
          <div className="mt-1 text-foreground text-sm">{t("settings.subtitle")}</div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-border-subtle bg-surface shadow-xl overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between gap-4 bg-foreground/5">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none" size={16} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSkip(0);
              }}
              placeholder={t("settings.search")}
              className="w-full rounded-2xl border border-border-subtle bg-foreground/5 py-2.5 pl-11 pr-4 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:border-[var(--color-primary)]/70 focus:ring-4 focus:ring-[var(--color-primary)]/10 transition"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
             <div className="p-12 flex justify-center items-center">
                 <div className="h-8 w-8 rounded-full border-4 border-white/10 border-t-[var(--color-primary)] animate-spin"></div>
             </div>
          ) : (
            <table className="w-full text-left text-sm text-foreground">
              <thead className="bg-foreground/5 text-xs uppercase text-foreground font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">{t("settings.table.key")}</th>
                  <th className="px-6 py-4">{t("settings.table.value")}</th>
                  <th className="px-6 py-4">{t("settings.table.updatedAt")}</th>
                  <th className="px-6 py-4">{t("settings.table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {settings.map((item, i) => (
                  <tr key={item.key} className="hover:bg-foreground/5 transition-colors duration-200" style={{ animationDelay: `${i * 30}ms` }}>
                    <td className="px-6 py-4 font-medium text-foreground">{item.key}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-xl border border-border-subtle bg-foreground/5 px-3 py-1.5 font-mono text-sm text-foreground">
                        {item.value}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-foreground">
                       {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-6 py-4">
                       <button
                         onClick={() => handleEdit(item)}
                         className="h-9 px-4 rounded-xl border border-border-subtle bg-foreground/5 hover:bg-[#4880FF] hover:border-[#4880FF] text-foreground hover:text-white text-xs font-semibold transition-all active:scale-95"
                       >
                         {t("settings.editValue")}
                       </button>
                    </td>
                  </tr>
                ))}

                {settings.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-foreground">
                      {search ? t("common.nodata") : t("common.nodata")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border-subtle bg-foreground/5">
          <div className="text-xs font-semibold tracking-wider text-foreground uppercase">
            {settingsCount === 0
              ? "0"
              : `Page ${currentPage} of ${totalPages} (Total: ${settingsCount})`}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSkip((s) => Math.max(0, s - limit))}
              disabled={!canPrev || isLoading}
              className="h-9 px-4 rounded-xl border border-border-subtle bg-foreground/5 hover:bg-foreground/10 text-xs font-bold text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {t("common.prev")}
            </button>
            <button
              onClick={() => setSkip((s) => s + limit)}
              disabled={!canNext || isLoading}
              className="h-9 px-4 rounded-xl bg-[#4880FF] hover:bg-[#3d6edb] text-xs font-bold text-white shadow-lg shadow-[#4880FF]/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {t("common.next")}
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

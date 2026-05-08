import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appSettingsService } from "../../services/appSettings.service";
import { ModalShell } from "../../../components/ui/ModalShell";
import { InlineToast } from "../../../components/ui/InlineToast";

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
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editSetting, setEditSetting] = useState(null);
  
  const [toast, setToast] = useState({ show: false, tone: "info", message: "" });
  const showToast = (tone, message) => setToast({ show: true, tone, message });
  const closeToast = () => setToast((p) => ({ ...p, show: false }));

  // --- React Query for Data Fetching & Caching ---
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["settings"],
    queryFn: () => appSettingsService.list()
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }) => appSettingsService.updateSetting({ key, value }),
    onSuccess: () => {
      // Invalidate cache natively to refetch settings without manual code
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      showToast("success", t("settings.toast.updated"));
      setEditOpen(false);
      setEditSetting(null);
    },
    onError: (err) => {
      showToast("error", t("settings.toast.failed") + ": " + (err?.message || ""));
    }
  });

  const settings = Array.isArray(data) ? data : data?.data || [];

  const handleEdit = (setting) => {
    setEditSetting(setting);
    setEditOpen(true);
  };

  const filteredSettings = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return settings;
    return settings.filter((item) => item.key.toLowerCase().includes(s));
  }, [settings, search]);

  useEffect(() => {
    if (isError) {
      showToast("error", t("settings.toast.failed") + ": " + (error?.message || ""));
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

      {/* Toast */}
      <div className="mt-4">
        <InlineToast
          show={toast.show}
          tone={toast.tone}
          message={toast.message}
          onClose={closeToast}
        />
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-[var(--color-surface,#0b1220)] shadow-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4 bg-white/[0.01]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                {filteredSettings.map((item, i) => (
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

                {filteredSettings.length === 0 && !isLoading && (
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
      </div>

      <EditSettingModal
        open={editOpen}
        setting={editSetting}
        onClose={() => {
          setEditOpen(false);
          setEditSetting(null);
        }}
        onSubmit={(key, value) => updateMutation.mutate({ key, value })}
        loading={updateMutation.isPending}
      />
    </div>
  );
}

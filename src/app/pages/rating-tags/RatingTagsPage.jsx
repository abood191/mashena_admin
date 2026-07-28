import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import UsersTable from "@/components/users/UsersTable";
import {
  useRatingTags,
  useCreateRatingTag,
  useUpdateRatingTag,
  useDeleteRatingTag,
  useToggleRatingTagActive,
} from "@/app/hooks/api/useRatingTags";
import {
  Tag, Filter, Plus, Pencil, Trash2, Power,
  X, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ratingTagsService } from "@/app/services/ratingTags.service";

/* ───────── Modal Shell (same pattern as WalletPage) ───────── */
function Modal({ open, onClose, title, icon: Icon, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-border-subtle rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-[#4880FF]/10 text-[#4880FF]">
                <Icon size={18} />
              </div>
            )}
            <h3 className="text-foreground font-bold">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-all">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-5">{children}</div>
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="text-foreground/40 text-xs font-bold uppercase ml-1">{children}</label>;
}

function Input({ type = "text", ...props }) {
  return (
    <input
      type={type}
      className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3.5 text-foreground placeholder:text-foreground/10 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all"
      {...props}
    />
  );
}

function Select({ children, ...props }) {
  return (
    <select
      className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all appearance-none cursor-pointer"
      {...props}
    >
      {children}
    </select>
  );
}

function PrimaryBtn({ children, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full px-6 py-4 rounded-2xl bg-[#4880FF] text-white! font-bold hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25 disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {disabled && <Loader2 className="animate-spin" size={18} />}
      {children}
    </button>
  );
}

/* ───────── Main Page ───────── */
export default function RatingTagsPage() {
  const { t, i18n } = useTranslation("common");
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);

  // Filters
  const [targetType, setTargetType] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [isActive, setIsActive] = useState("");

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);

  // Form
  const emptyForm = { code: "", targetType: "DRIVER", sentiment: "POSITIVE", nameEn: "", nameAr: "" };
  const [form, setForm] = useState(emptyForm);

  const [fetchingId, setFetchingId] = useState(null);

  // Queries & Mutations
  const { data, isFetching, error } = useRatingTags({ skip, limit, targetType, sentiment, isActive, lang: i18n.language });
  const createMut = useCreateRatingTag();
  const updateMut = useUpdateRatingTag();
  const deleteMut = useDeleteRatingTag();
  const toggleMut = useToggleRatingTagActive();

  const tags = data?.data || [];
  const count = data?.meta?.total || 0;

  useEffect(() => {
    if (error) toast.error(error.message || t("ratingTags.toast.loadFailed", "Failed to load rating tags"));
  }, [error]);

  // Handlers
  const openCreate = () => {
    setForm(emptyForm);
    setCreateOpen(true);
  };

  const openEdit = async (tag) => {
    try {
      // Instantly open with table data while fetching full details
      const locsFallback = tag.localizations || [];
      const enLocFallback = locsFallback.find(l => l.languageCode === "en")?.name || "";
      const arLocFallback = locsFallback.find(l => l.languageCode === "ar")?.name || "";

      setEditingTag(tag);
      setForm({
        code: tag.code || "",
        targetType: tag.targetType || "DRIVER",
        sentiment: tag.sentiment || "POSITIVE",
        nameEn: enLocFallback,
        nameAr: arLocFallback,
      });
      setEditOpen(true);

      setFetchingId(tag.id);
      const res = await ratingTagsService.getById(tag.id);
      // Depending on apiClient, the data might be in res.data, or it might just be res
      const fullTag = res?.data?.id ? res.data : (res?.id ? res : (res?.data || res));
      
      const locs = fullTag.localizations || fullTag.translations || tag.localizations || [];
      const enLoc = locs.find(l => l.languageCode === "en")?.name || enLocFallback;
      const arLoc = locs.find(l => l.languageCode === "ar")?.name || arLocFallback;

      setEditingTag(fullTag);
      setForm({
        code: fullTag.code || tag.code || "",
        targetType: fullTag.targetType || tag.targetType || "DRIVER",
        sentiment: fullTag.sentiment || tag.sentiment || "POSITIVE",
        nameEn: enLoc,
        nameAr: arLoc,
      });
    } catch (e) {
      toast.error(e.message || t("ratingTags.toast.loadFailed", "Failed to load rating tags"));
    } finally {
      setFetchingId(null);
    }
  };

  const openDelete = (tag) => {
    setEditingTag(tag);
    setDeleteOpen(true);
  };

  const handleCreate = async () => {
    if (!form.code?.trim()) { toast.warning(t("ratingTags.toast.codeRequired", "Code is required")); return; }
    if (!form.nameEn?.trim()) { toast.warning(t("ratingTags.toast.nameEnRequired", "English name is required")); return; }
    if (!form.nameAr?.trim()) { toast.warning(t("ratingTags.toast.nameArRequired", "Arabic name is required")); return; }
    if (!form.targetType) { toast.warning(t("ratingTags.toast.targetTypeRequired", "Target type is required")); return; }
    if (!form.sentiment) { toast.warning(t("ratingTags.toast.sentimentRequired", "Sentiment is required")); return; }

    try {
      await createMut.mutateAsync({
        code: form.code.trim(),
        targetType: form.targetType,
        sentiment: form.sentiment,
        localizations: [
          { languageCode: "en", name: form.nameEn.trim() },
          { languageCode: "ar", name: form.nameAr.trim() }
        ]
      });
      toast.success(t("ratingTags.toast.created", "Rating tag created successfully"));
      setCreateOpen(false);
      setForm(emptyForm);
    } catch (e) { toast.error(e.message || t("ratingTags.toast.createFailed", "Failed to create rating tag")); }
  };

  const handleUpdate = async () => {
    if (!editingTag) return;

    if (!form.nameEn?.trim()) { toast.warning(t("ratingTags.toast.nameEnRequired", "English name is required")); return; }
    if (!form.nameAr?.trim()) { toast.warning(t("ratingTags.toast.nameArRequired", "Arabic name is required")); return; }
    if (!form.targetType) { toast.warning(t("ratingTags.toast.targetTypeRequired", "Target type is required")); return; }
    if (!form.sentiment) { toast.warning(t("ratingTags.toast.sentimentRequired", "Sentiment is required")); return; }

    try {
      await updateMut.mutateAsync({
        id: editingTag.id,
        body: {
          targetType: form.targetType,
          sentiment: form.sentiment,
          localizations: [
            { languageCode: "en", name: form.nameEn.trim() },
            { languageCode: "ar", name: form.nameAr.trim() }
          ]
        },
      });
      toast.success(t("ratingTags.toast.updated", "Rating tag updated successfully"));
      setEditOpen(false);
      setEditingTag(null);
    } catch (e) { toast.error(e.message || t("ratingTags.toast.updateFailed", "Failed to update rating tag")); }
  };

  const handleDelete = async () => {
    if (!editingTag) return;
    try {
      await deleteMut.mutateAsync(editingTag.id);
      toast.success(t("ratingTags.toast.deleted", "Rating tag deleted successfully"));
      setDeleteOpen(false);
      setEditingTag(null);
    } catch (e) { toast.error(e.message || t("ratingTags.toast.deleteFailed", "Failed to delete rating tag")); }
  };

  const handleToggle = async (tag) => {
    try {
      await toggleMut.mutateAsync(tag.id);
      toast.success(
        tag.isActive
          ? t("ratingTags.toast.deactivated", "Rating tag deactivated")
          : t("ratingTags.toast.activated", "Rating tag activated")
      );
    } catch (e) { toast.error(e.message || t("ratingTags.toast.toggleFailed", "Failed to toggle status")); }
  };

  // Columns
  const columns = [
    {
      header: t("ratingTags.table.code", "Code"),
      accessorKey: "code",
      cell: ({ row }) => (
        <span className="font-mono bg-foreground/5 px-2 py-1 rounded text-foreground text-xs">
          {row.original.code}
        </span>
      ),
    },
    {
      header: t("ratingTags.table.name", "Name"),
      cell: ({ row }) => (
        <span className="text-foreground font-semibold">{row.original.name || "—"}</span>
      ),
    },
    {
      header: t("ratingTags.table.targetType", "Target"),
      cell: ({ row }) => {
        const type = row.original.targetType;
        const colors = type === "DRIVER"
          ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
          : "bg-purple-500/10 text-purple-500 border-purple-500/20";
        return (
          <span className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${colors}`}>
            {t(`ratingTags.targetTypes.${type}`, type)}
          </span>
        );
      },
    },
    {
      header: t("ratingTags.table.sentiment", "Sentiment"),
      cell: ({ row }) => {
        const s = row.original.sentiment;
        const colors = s === "POSITIVE"
          ? "bg-green-500/10 text-green-500 border-green-500/20"
          : "bg-red-500/10 text-red-500 border-red-500/20";
        return (
          <span className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${colors}`}>
            {t(`ratingTags.sentiments.${s}`, s)}
          </span>
        );
      },
    },
    {
      header: t("ratingTags.table.status", "Status"),
      cell: ({ row }) => {
        const active = row.original.isActive;
        return (
          <span className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${
            active
              ? "bg-green-500/10 text-green-500 border-green-500/20"
              : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
          }`}>
            {active ? t("ratingTags.active", "Active") : t("ratingTags.inactive", "Inactive")}
          </span>
        );
      },
    },
    {
      header: t("ratingTags.table.actions", "Actions"),
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggle(row.original)}
            title={row.original.isActive ? t("ratingTags.deactivate", "Deactivate") : t("ratingTags.activate", "Activate")}
            className={`p-2 rounded-xl transition-colors ${
              row.original.isActive
                ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
            }`}
          >
            <Power size={14} />
          </button>
          <button
            onClick={() => openEdit(row.original)}
            disabled={fetchingId === row.original.id}
            title={t("common.edit", "Edit")}
            className="p-2 rounded-xl bg-foreground/5 hover:bg-[#4880FF]/10 text-[#4880FF] transition-colors disabled:opacity-50"
          >
            {fetchingId === row.original.id ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
          </button>
          <button
            onClick={() => openDelete(row.original)}
            title={t("common.delete", "Delete")}
            className="p-2 rounded-xl bg-foreground/5 hover:bg-red-500/10 text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(count / limit));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#4880FF]/10 text-[#4880FF]">
            <Tag size={28} />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-bold tracking-tight">{t("ratingTags.title", "Rating Tags")}</h1>
            <p className="text-foreground text-sm mt-0.5">{t("ratingTags.subtitle", "Manage rating tags for drivers and riders")}</p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#4880FF] text-white! font-bold hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25"
        >
          <Plus size={18} />
          {t("ratingTags.addTag", "Add Tag")}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-foreground font-semibold">
          <Filter size={18} />
          <span>{t("ratingTags.filters", "Filters")}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative w-full">
            <select
              value={targetType}
              onChange={(e) => { setTargetType(e.target.value); setSkip(0); }}
              className="w-full bg-surface border border-border-subtle rounded-2xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all appearance-none cursor-pointer"
            >
              <option value="">{t("ratingTags.allTargets", "All Targets")}</option>
              <option value="DRIVER">{t("ratingTags.targetTypes.DRIVER", "Driver")}</option>
              <option value="RIDER">{t("ratingTags.targetTypes.RIDER", "Rider")}</option>
            </select>
          </div>

          <div className="relative w-full">
            <select
              value={sentiment}
              onChange={(e) => { setSentiment(e.target.value); setSkip(0); }}
              className="w-full bg-surface border border-border-subtle rounded-2xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all appearance-none cursor-pointer"
            >
              <option value="">{t("ratingTags.allSentiments", "All Sentiments")}</option>
              <option value="POSITIVE">{t("ratingTags.sentiments.POSITIVE", "Positive")}</option>
              <option value="NEGATIVE">{t("ratingTags.sentiments.NEGATIVE", "Negative")}</option>
            </select>
          </div>

          <div className="relative w-full">
            <select
              value={isActive}
              onChange={(e) => { setIsActive(e.target.value); setSkip(0); }}
              className="w-full bg-surface border border-border-subtle rounded-2xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all appearance-none cursor-pointer"
            >
              <option value="">{t("ratingTags.allStatuses", "All Statuses")}</option>
              <option value="true">{t("ratingTags.active", "Active")}</option>
              <option value="false">{t("ratingTags.inactive", "Inactive")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-2xl">
        <UsersTable columns={columns} data={tags} loading={isFetching} />
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="text-foreground text-xs font-medium bg-foreground/5 px-4 py-2 rounded-full border border-border-subtle">
          {t("ratingTags.pageInfo", { current: currentPage, total: totalPages, count }, `Page ${currentPage} of ${totalPages} (Total: ${count})`)}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setSkip(Math.max(skip - limit, 0))}
            disabled={skip === 0}
            className="px-6 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground font-bold text-sm hover:bg-foreground/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t("common.prev")}
          </button>
          <button
            onClick={() => setSkip(skip + limit < count ? skip + limit : skip)}
            disabled={skip + limit >= count}
            className="px-6 py-2.5 rounded-xl bg-[#4880FF] text-white! font-bold text-sm hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t("common.next")}
          </button>
        </div>
      </div>

      {/* ═══════ CREATE MODAL ═══════ */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t("ratingTags.modal.createTitle", "Add Rating Tag")} icon={Plus}>
        <div className="space-y-2">
          <FieldLabel>{t("ratingTags.modal.code", "Code")}</FieldLabel>
          <Input placeholder="e.g. SAFE_DRIVING" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </div>
        <div className="space-y-2">
          <FieldLabel>{t("ratingTags.modal.nameEn", "Name (English)")}</FieldLabel>
          <Input placeholder="e.g. Safe Driving" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
        </div>
        <div className="space-y-2">
          <FieldLabel>{t("ratingTags.modal.nameAr", "Name (Arabic)")}</FieldLabel>
          <Input placeholder="مثال: قيادة آمنة" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <FieldLabel>{t("ratingTags.modal.targetType", "Target Type")}</FieldLabel>
            <Select value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })}>
              <option value="DRIVER">{t("ratingTags.targetTypes.DRIVER", "Driver")}</option>
              <option value="RIDER">{t("ratingTags.targetTypes.RIDER", "Rider")}</option>
            </Select>
          </div>
          <div className="space-y-2">
            <FieldLabel>{t("ratingTags.modal.sentiment", "Sentiment")}</FieldLabel>
            <Select value={form.sentiment} onChange={(e) => setForm({ ...form, sentiment: e.target.value })}>
              <option value="POSITIVE">{t("ratingTags.sentiments.POSITIVE", "Positive")}</option>
              <option value="NEGATIVE">{t("ratingTags.sentiments.NEGATIVE", "Negative")}</option>
            </Select>
          </div>
        </div>
        <PrimaryBtn disabled={createMut.isPending} onClick={handleCreate}>{t("ratingTags.modal.create", "Create Tag")}</PrimaryBtn>
      </Modal>

      {/* ═══════ EDIT MODAL ═══════ */}
      <Modal open={editOpen} onClose={() => { setEditOpen(false); setEditingTag(null); }} title={t("ratingTags.modal.editTitle", "Edit Rating Tag")} icon={Pencil}>
        <div className="space-y-2">
          <FieldLabel>{t("ratingTags.modal.code", "Code")}</FieldLabel>
          <Input value={form.code} disabled className="w-full rounded-2xl border border-border-subtle bg-foreground/10 px-4 py-3.5 text-foreground/50 focus:outline-none cursor-not-allowed" />
        </div>
        <div className="space-y-2">
          <FieldLabel>{t("ratingTags.modal.nameEn", "Name (English)")}</FieldLabel>
          <Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
        </div>
        <div className="space-y-2">
          <FieldLabel>{t("ratingTags.modal.nameAr", "Name (Arabic)")}</FieldLabel>
          <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <FieldLabel>{t("ratingTags.modal.targetType", "Target Type")}</FieldLabel>
            <Select value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })}>
              <option value="DRIVER">{t("ratingTags.targetTypes.DRIVER", "Driver")}</option>
              <option value="RIDER">{t("ratingTags.targetTypes.RIDER", "Rider")}</option>
            </Select>
          </div>
          <div className="space-y-2">
            <FieldLabel>{t("ratingTags.modal.sentiment", "Sentiment")}</FieldLabel>
            <Select value={form.sentiment} onChange={(e) => setForm({ ...form, sentiment: e.target.value })}>
              <option value="POSITIVE">{t("ratingTags.sentiments.POSITIVE", "Positive")}</option>
              <option value="NEGATIVE">{t("ratingTags.sentiments.NEGATIVE", "Negative")}</option>
            </Select>
          </div>
        </div>
        <PrimaryBtn disabled={updateMut.isPending} onClick={handleUpdate}>{t("ratingTags.modal.save", "Save Changes")}</PrimaryBtn>
      </Modal>

      {/* ═══════ DELETE CONFIRM MODAL ═══════ */}
      <Modal open={deleteOpen} onClose={() => { setDeleteOpen(false); setEditingTag(null); }} title={t("ratingTags.confirm.title", "Delete Rating Tag")} icon={Trash2}>
        <p className="text-foreground/80 text-sm">
          {t("ratingTags.confirm.message", { code: editingTag?.code }, `Are you sure you want to delete "${editingTag?.code}"? Existing ratings will be preserved.`)}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => { setDeleteOpen(false); setEditingTag(null); }}
            className="flex-1 px-6 py-3.5 rounded-2xl border border-border-subtle bg-foreground/5 text-foreground font-bold hover:bg-foreground/10 transition-all"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMut.isPending}
            className="flex-1 px-6 py-3.5 rounded-2xl bg-red-500 text-white! font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleteMut.isPending && <Loader2 className="animate-spin" size={18} />}
            {t("common.delete", "Delete")}
          </button>
        </div>
      </Modal>
    </div>
  );
}

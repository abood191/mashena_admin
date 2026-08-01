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
  X, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { ratingTagsService } from "@/app/services/ratingTags.service";

/* ═══════════════════════════════════════════════════════
   Shared UI Atoms
═══════════════════════════════════════════════════════ */

function Modal({ open, onClose, title, icon: Icon, maxWidth = "max-w-lg", children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} bg-surface border border-border-subtle rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-xl bg-[#4880FF]/10 text-[#4880FF]">
                <Icon size={18} />
              </div>
            )}
            <h3 className="text-foreground font-bold text-lg">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-all"
          >
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">{children}</div>
      </div>
    </div>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="text-foreground/60 text-xs font-bold uppercase tracking-wider ml-1 flex gap-1">
      {children}
      {required && <span className="text-red-400">*</span>}
    </label>
  );
}

function Input({ ...props }) {
  return (
    <input
      className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/40 transition-all"
      {...props}
    />
  );
}

function SelectInput({ children, className = "", ...props }) {
  return (
    <select
      className={`w-full rounded-2xl border border-border-subtle bg-surface px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-[#4880FF]/40 transition-all appearance-none cursor-pointer [&>option]:bg-white [&>option]:text-[#0f172a] dark:[&>option]:bg-[#0b1220] dark:[&>option]:text-white ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

function PrimaryBtn({ children, disabled, onClick, variant = "primary" }) {
  const base = "w-full px-6 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50";
  const variants = {
    primary: "bg-[#4880FF] text-white hover:bg-[#3d6edb] shadow-lg shadow-[#4880FF]/25",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]}`}>
      {disabled && <Loader2 className="animate-spin" size={16} />}
      {children}
    </button>
  );
}

function Badge({ label, color }) {
  const colors = {
    blue:   "bg-blue-500/10 text-blue-500 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    green:  "bg-green-500/10 text-green-500 border-green-500/20",
    red:    "bg-red-500/10 text-red-500 border-red-500/20",
    yellow: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    gray:   "bg-foreground/5 text-foreground/60 border-border-subtle",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${colors[color] ?? colors.gray}`}>
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Page
═══════════════════════════════════════════════════════ */

export default function RatingTagsPage() {
  const { t, i18n } = useTranslation("common");
  const [skip, setSkip] = useState(0);
  const LIMIT = 10;

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
  const { data, isFetching, error } = useRatingTags({ skip, limit: LIMIT, targetType, sentiment, isActive, lang: i18n.language });
  const createMut = useCreateRatingTag();
  const updateMut = useUpdateRatingTag();
  const deleteMut = useDeleteRatingTag();
  const toggleMut = useToggleRatingTagActive();

  const tags = data?.data || [];
  const count = data?.meta?.total ?? data?.count ?? 0;

  useEffect(() => {
    if (error) toast.error(error.message || t("ratingTags.toast.loadFailed"));
  }, [error]);

  const resetFilters = () => {
    setTargetType("");
    setSentiment("");
    setIsActive("");
    setSkip(0);
  };

  // Handlers
  const openCreate = () => {
    setForm(emptyForm);
    setCreateOpen(true);
  };

  const openEdit = async (tag) => {
    try {
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
      toast.error(e.message || t("ratingTags.toast.loadFailed"));
    } finally {
      setFetchingId(null);
    }
  };

  const openDelete = (tag) => {
    setEditingTag(tag);
    setDeleteOpen(true);
  };

  const handleCreate = async () => {
    if (!form.code?.trim()) return toast.warning(t("ratingTags.toast.codeRequired"));
    if (!form.nameEn?.trim()) return toast.warning(t("ratingTags.toast.nameEnRequired"));
    if (!form.nameAr?.trim()) return toast.warning(t("ratingTags.toast.nameArRequired"));

    try {
      await createMut.mutateAsync({
        code: form.code.trim().toUpperCase(),
        targetType: form.targetType,
        sentiment: form.sentiment,
        localizations: [
          { languageCode: "en", name: form.nameEn.trim() },
          { languageCode: "ar", name: form.nameAr.trim() }
        ]
      });
      toast.success(t("ratingTags.toast.created"));
      setCreateOpen(false);
      setForm(emptyForm);
    } catch (e) {
      toast.error(e.message || t("ratingTags.toast.createFailed"));
    }
  };

  const handleUpdate = async () => {
    if (!editingTag) return;
    if (!form.nameEn?.trim()) return toast.warning(t("ratingTags.toast.nameEnRequired"));
    if (!form.nameAr?.trim()) return toast.warning(t("ratingTags.toast.nameArRequired"));

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
      toast.success(t("ratingTags.toast.updated"));
      setEditOpen(false);
      setEditingTag(null);
    } catch (e) {
      toast.error(e.message || t("ratingTags.toast.updateFailed"));
    }
  };

  const handleDelete = async () => {
    if (!editingTag) return;
    try {
      await deleteMut.mutateAsync(editingTag.id);
      toast.success(t("ratingTags.toast.deleted"));
      setDeleteOpen(false);
      setEditingTag(null);
    } catch (e) {
      toast.error(e.message || t("ratingTags.toast.deleteFailed"));
    }
  };

  const handleToggle = async (tag) => {
    try {
      await toggleMut.mutateAsync(tag.id);
      toast.success(
        tag.isActive
          ? t("ratingTags.toast.deactivated")
          : t("ratingTags.toast.activated")
      );
    } catch (e) {
      toast.error(e.message || t("ratingTags.toast.toggleFailed"));
    }
  };

  // Columns
  const columns = [
    {
      header: t("ratingTags.table.code"),
      accessorKey: "code",
      cell: ({ row }) => (
        <span className="font-mono bg-foreground/5 border border-border-subtle px-2.5 py-1 rounded-lg text-foreground text-xs font-bold tracking-widest">
          {row.original.code}
        </span>
      ),
    },
    {
      header: t("ratingTags.table.name"),
      cell: ({ row }) => (
        <span className="text-foreground font-semibold text-sm">{row.original.name || "—"}</span>
      ),
    },
    {
      header: t("ratingTags.table.targetType"),
      cell: ({ row }) => {
        const type = row.original.targetType;
        return (
          <Badge
            label={t(`ratingTags.targetTypes.${type}`, type)}
            color={type === "DRIVER" ? "blue" : "purple"}
          />
        );
      },
    },
    {
      header: t("ratingTags.table.sentiment"),
      cell: ({ row }) => {
        const s = row.original.sentiment;
        return (
          <Badge
            label={t(`ratingTags.sentiments.${s}`, s)}
            color={s === "POSITIVE" ? "green" : "red"}
          />
        );
      },
    },
    {
      header: t("ratingTags.table.status"),
      cell: ({ row }) => {
        const active = row.original.isActive;
        return (
          <Badge
            label={active ? t("ratingTags.active") : t("ratingTags.inactive")}
            color={active ? "green" : "yellow"}
          />
        );
      },
    },
    {
      header: t("ratingTags.table.actions"),
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleToggle(row.original)}
            title={row.original.isActive ? t("ratingTags.deactivate") : t("ratingTags.activate")}
            className={`p-2 rounded-xl transition-colors ${
              row.original.isActive
                ? "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"
                : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
            }`}
          >
            <Power size={13} />
          </button>
          <button
            onClick={() => openEdit(row.original)}
            disabled={fetchingId === row.original.id}
            title={t("common.edit")}
            className="p-2 rounded-xl bg-foreground/5 hover:bg-[#4880FF]/10 text-foreground/40 hover:text-[#4880FF] transition-colors disabled:opacity-50"
          >
            {fetchingId === row.original.id ? <Loader2 size={13} className="animate-spin" /> : <Pencil size={13} />}
          </button>
          <button
            onClick={() => openDelete(row.original)}
            title={t("common.delete")}
            className="p-2 rounded-xl bg-foreground/5 hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  const currentPage = Math.floor(skip / LIMIT) + 1;
  const totalPages = Math.max(1, Math.ceil(count / LIMIT));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#4880FF]/10 text-[#4880FF]">
            <Tag size={26} />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-bold tracking-tight">{t("ratingTags.title")}</h1>
            <p className="text-foreground/50 text-sm mt-0.5">{t("ratingTags.subtitle")}</p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#4880FF] text-white font-bold hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25"
        >
          <Plus size={16} />
          {t("ratingTags.addTag")}
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Filter size={16} />
            <span>{t("ratingTags.filters")}</span>
          </div>
          <button onClick={resetFilters} className="text-xs text-foreground/40 hover:text-[#4880FF] transition-colors">
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SelectInput
            value={targetType}
            onChange={(e) => { setTargetType(e.target.value); setSkip(0); }}
          >
            <option value="">{t("ratingTags.allTargets")}</option>
            <option value="DRIVER">{t("ratingTags.targetTypes.DRIVER")}</option>
            <option value="RIDER">{t("ratingTags.targetTypes.RIDER")}</option>
          </SelectInput>

          <SelectInput
            value={sentiment}
            onChange={(e) => { setSentiment(e.target.value); setSkip(0); }}
          >
            <option value="">{t("ratingTags.allSentiments")}</option>
            <option value="POSITIVE">{t("ratingTags.sentiments.POSITIVE")}</option>
            <option value="NEGATIVE">{t("ratingTags.sentiments.NEGATIVE")}</option>
          </SelectInput>

          <SelectInput
            value={isActive}
            onChange={(e) => { setIsActive(e.target.value); setSkip(0); }}
          >
            <option value="">{t("ratingTags.allStatuses")}</option>
            <option value="true">{t("ratingTags.active")}</option>
            <option value="false">{t("ratingTags.inactive")}</option>
          </SelectInput>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-2xl">
        <UsersTable columns={columns} data={tags} loading={isFetching} />
      </div>

      {/* ── Pagination ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <p className="text-foreground/60 text-xs font-medium bg-foreground/5 px-4 py-2 rounded-full border border-border-subtle">
          {t("ratingTags.pageInfo", { current: currentPage, total: totalPages, count })}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setSkip(Math.max(skip - LIMIT, 0))}
            disabled={skip === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-border-subtle bg-foreground/5 text-foreground font-bold text-sm hover:bg-foreground/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} />
            {t("common.prev")}
          </button>
          <button
            onClick={() => setSkip(skip + LIMIT < count ? skip + LIMIT : skip)}
            disabled={skip + LIMIT >= count}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#4880FF] text-white font-bold text-sm hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t("common.next")}
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* Create */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t("ratingTags.modal.createTitle")} icon={Plus}>
        <div className="space-y-1.5">
          <FieldLabel required>{t("ratingTags.modal.code")}</FieldLabel>
          <Input placeholder="e.g. SAFE_DRIVING" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel required>{t("ratingTags.modal.nameEn")}</FieldLabel>
          <Input placeholder="e.g. Safe Driving" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel required>{t("ratingTags.modal.nameAr")}</FieldLabel>
          <Input placeholder="مثال: قيادة آمنة" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <FieldLabel required>{t("ratingTags.modal.targetType")}</FieldLabel>
            <SelectInput value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })}>
              <option value="DRIVER">{t("ratingTags.targetTypes.DRIVER")}</option>
              <option value="RIDER">{t("ratingTags.targetTypes.RIDER")}</option>
            </SelectInput>
          </div>
          <div className="space-y-1.5">
            <FieldLabel required>{t("ratingTags.modal.sentiment")}</FieldLabel>
            <SelectInput value={form.sentiment} onChange={(e) => setForm({ ...form, sentiment: e.target.value })}>
              <option value="POSITIVE">{t("ratingTags.sentiments.POSITIVE")}</option>
              <option value="NEGATIVE">{t("ratingTags.sentiments.NEGATIVE")}</option>
            </SelectInput>
          </div>
        </div>
        <PrimaryBtn disabled={createMut.isPending} onClick={handleCreate}>
          {t("ratingTags.modal.create")}
        </PrimaryBtn>
      </Modal>

      {/* Edit */}
      <Modal open={editOpen} onClose={() => { setEditOpen(false); setEditingTag(null); }} title={t("ratingTags.modal.editTitle")} icon={Pencil}>
        <div className="space-y-1.5">
          <FieldLabel>{t("ratingTags.modal.code")}</FieldLabel>
          <Input value={form.code} disabled className="opacity-50 cursor-not-allowed" />
        </div>
        <div className="space-y-1.5">
          <FieldLabel required>{t("ratingTags.modal.nameEn")}</FieldLabel>
          <Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel required>{t("ratingTags.modal.nameAr")}</FieldLabel>
          <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <FieldLabel required>{t("ratingTags.modal.targetType")}</FieldLabel>
            <SelectInput value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })}>
              <option value="DRIVER">{t("ratingTags.targetTypes.DRIVER")}</option>
              <option value="RIDER">{t("ratingTags.targetTypes.RIDER")}</option>
            </SelectInput>
          </div>
          <div className="space-y-1.5">
            <FieldLabel required>{t("ratingTags.modal.sentiment")}</FieldLabel>
            <SelectInput value={form.sentiment} onChange={(e) => setForm({ ...form, sentiment: e.target.value })}>
              <option value="POSITIVE">{t("ratingTags.sentiments.POSITIVE")}</option>
              <option value="NEGATIVE">{t("ratingTags.sentiments.NEGATIVE")}</option>
            </SelectInput>
          </div>
        </div>
        <PrimaryBtn disabled={updateMut.isPending} onClick={handleUpdate}>
          {t("ratingTags.modal.save")}
        </PrimaryBtn>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={deleteOpen} onClose={() => { setDeleteOpen(false); setEditingTag(null); }} title={t("ratingTags.confirm.title")} icon={Trash2} maxWidth="max-w-sm">
        <p className="text-foreground/70 text-sm leading-relaxed">
          {t("ratingTags.confirm.message", { code: editingTag?.code })}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => { setDeleteOpen(false); setEditingTag(null); }}
            className="flex-1 px-5 py-3.5 rounded-2xl border border-border-subtle bg-foreground/5 text-foreground font-bold hover:bg-foreground/10 transition-all"
          >
            {t("common.cancel")}
          </button>
          <PrimaryBtn variant="danger" disabled={deleteMut.isPending} onClick={handleDelete}>
            {t("common.delete")}
          </PrimaryBtn>
        </div>
      </Modal>
    </div>
  );
}

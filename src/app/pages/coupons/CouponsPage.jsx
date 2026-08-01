import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import UsersTable from "@/components/users/UsersTable";
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
  useGlobalCouponHistory,
  useCouponHistory,
} from "@/app/hooks/api/useCoupons";
import {
  Ticket, Filter, Plus, Pencil, Trash2, X,
  Loader2, History, ChevronLeft, ChevronRight,
  ToggleLeft, ToggleRight, Percent, DollarSign,
  Calendar, Users,
} from "lucide-react";
import { toast } from "sonner";

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
        {/* Body – scrollable */}
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

function Textarea({ ...props }) {
  return (
    <textarea
      rows={3}
      className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3 text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/40 transition-all resize-none"
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

/* ═══════════════════════════════════════════════════════
   Small reusable badge
═══════════════════════════════════════════════════════ */
function Badge({ label, color }) {
  const colors = {
    blue:   "bg-blue-500/10 text-blue-500 border-blue-500/20",
    green:  "bg-green-500/10 text-green-500 border-green-500/20",
    red:    "bg-red-500/10 text-red-500 border-red-500/20",
    yellow: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    gray:   "bg-foreground/5 text-foreground/60 border-border-subtle",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${colors[color] ?? colors.gray}`}>
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   Pagination Bar
═══════════════════════════════════════════════════════ */
function Pagination({ skip, limit, count, onSkipChange }) {
  const { t } = useTranslation("common");
  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(count / limit));

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
      <p className="text-foreground/60 text-xs font-medium bg-foreground/5 px-4 py-2 rounded-full border border-border-subtle">
        {t("coupons.pageInfo", { current: currentPage, total: totalPages, count })}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onSkipChange(Math.max(skip - limit, 0))}
          disabled={skip === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-xl border border-border-subtle bg-foreground/5 text-foreground font-bold text-sm hover:bg-foreground/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} />
          {t("common.prev")}
        </button>
        <button
          onClick={() => onSkipChange(skip + limit < count ? skip + limit : skip)}
          disabled={skip + limit >= count}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#4880FF] text-white font-bold text-sm hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {t("common.next")}
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Empty Form
═══════════════════════════════════════════════════════ */
const emptyForm = {
  code: "",
  name: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  maxDiscount: "",
  activationDurationDays: "",
  allowedUsages: "",
  globalUsageLimit: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
};

/* ═══════════════════════════════════════════════════════
   Coupon Form Modal (Create / Edit)
═══════════════════════════════════════════════════════ */
function CouponFormModal({ open, onClose, editing, onSubmit, isPending }) {
  const { t } = useTranslation("common");
  const [form, setForm] = useState(emptyForm);

  // Populate form when editing
  useEffect(() => {
    if (editing) {
      setForm({
        code: editing.code ?? "",
        name: editing.name ?? "",
        description: editing.description ?? "",
        discountType: editing.discountType ?? "PERCENTAGE",
        discountValue: editing.discountValue ?? "",
        maxDiscount: editing.maxDiscount ?? "",
        activationDurationDays: editing.activationDurationDays ?? "",
        allowedUsages: editing.allowedUsages ?? "",
        globalUsageLimit: editing.globalUsageLimit ?? "",
        startsAt: editing.startsAt ? editing.startsAt.slice(0, 16) : "",
        expiresAt: editing.expiresAt ? editing.expiresAt.slice(0, 16) : "",
        isActive: editing.isActive ?? true,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editing, open]);

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleSubmit = () => onSubmit(form);

  const isEdit = !!editing;
  const title = isEdit ? t("coupons.modal.editTitle") : t("coupons.modal.createTitle");

  return (
    <Modal open={open} onClose={onClose} title={title} icon={Ticket} maxWidth="max-w-2xl">
      {/* Row 1: Code + Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <FieldLabel required>{t("coupons.modal.code")}</FieldLabel>
          <Input
            placeholder={t("coupons.modal.codePlaceholder")}
            value={form.code}
            onChange={set("code")}
            disabled={isEdit}
            className={isEdit ? "opacity-50 cursor-not-allowed" : ""}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel required>{t("coupons.modal.name")}</FieldLabel>
          <Input placeholder={t("coupons.modal.namePlaceholder")} value={form.name} onChange={set("name")} />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <FieldLabel>{t("coupons.modal.description")}</FieldLabel>
        <Textarea placeholder={t("coupons.modal.descriptionPlaceholder")} value={form.description} onChange={set("description")} />
      </div>

      {/* Row 2: Type + Value + MaxDiscount */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <FieldLabel required>{t("coupons.modal.discountType")}</FieldLabel>
          <SelectInput value={form.discountType} onChange={set("discountType")}>
            <option value="PERCENTAGE">{t("coupons.discountTypes.PERCENTAGE")}</option>
            <option value="FIXED">{t("coupons.discountTypes.FIXED")}</option>
          </SelectInput>
        </div>
        <div className="space-y-1.5">
          <FieldLabel required>{t("coupons.modal.discountValue")}</FieldLabel>
          <Input
            type="number"
            min="0"
            placeholder={t("coupons.modal.discountValuePlaceholder")}
            value={form.discountValue}
            onChange={set("discountValue")}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>{t("coupons.modal.maxDiscount")}</FieldLabel>
          <Input
            type="number"
            min="0"
            placeholder={t("coupons.modal.maxDiscountPlaceholder")}
            value={form.maxDiscount}
            onChange={set("maxDiscount")}
          />
        </div>
      </div>

      {/* Row 3: Duration + Usages + Global Limit */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <FieldLabel>{t("coupons.modal.activationDurationDays")}</FieldLabel>
          <Input
            type="number"
            min="0"
            placeholder={t("coupons.modal.activationDurationDaysPlaceholder")}
            value={form.activationDurationDays}
            onChange={set("activationDurationDays")}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>{t("coupons.modal.allowedUsages")}</FieldLabel>
          <Input
            type="number"
            min="1"
            placeholder={t("coupons.modal.allowedUsagesPlaceholder")}
            value={form.allowedUsages}
            onChange={set("allowedUsages")}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>{t("coupons.modal.globalUsageLimit")}</FieldLabel>
          <Input
            type="number"
            min="1"
            placeholder={t("coupons.modal.globalUsageLimitPlaceholder")}
            value={form.globalUsageLimit}
            onChange={set("globalUsageLimit")}
          />
        </div>
      </div>

      {/* Row 4: Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <FieldLabel required>{t("coupons.modal.startsAt")}</FieldLabel>
          <Input type="datetime-local" value={form.startsAt} onChange={set("startsAt")} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel required>{t("coupons.modal.expiresAt")}</FieldLabel>
          <Input type="datetime-local" value={form.expiresAt} onChange={set("expiresAt")} />
        </div>
      </div>

      {/* isActive toggle */}
      <div className="flex items-center justify-between p-4 rounded-2xl border border-border-subtle bg-foreground/3">
        <span className="text-foreground font-medium text-sm">{t("coupons.modal.isActive")}</span>
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
          className="transition-colors"
        >
          {form.isActive
            ? <ToggleRight size={32} className="text-[#4880FF]" />
            : <ToggleLeft size={32} className="text-foreground/30" />
          }
        </button>
      </div>

      <PrimaryBtn disabled={isPending} onClick={handleSubmit}>
        {isEdit ? t("coupons.modal.save") : t("coupons.modal.create")}
      </PrimaryBtn>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════
   History Modal
═══════════════════════════════════════════════════════ */
function HistoryModal({ open, onClose, couponId, title }) {
  const { t } = useTranslation("common");
  const [skip, setSkip] = useState(0);
  const LIMIT = 10;

  const isGlobal = !couponId;

  const globalQ = useGlobalCouponHistory({ skip, limit: LIMIT }, { enabled: open && isGlobal });
  const specificQ = useCouponHistory(couponId, { skip, limit: LIMIT }, { enabled: open && !isGlobal });

  const q = isGlobal ? globalQ : specificQ;
  const rows = q.data?.data || [];
  const count = q.data?.count ?? 0;

  // Reset pagination when modal opens
  useEffect(() => { if (open) setSkip(0); }, [open]);

  const formatDate = (d) => d ? new Date(d).toLocaleString() : "—";

  return (
    <Modal open={open} onClose={onClose} title={title} icon={History} maxWidth="max-w-2xl">
      {q.isFetching && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-[#4880FF]" size={28} />
        </div>
      )}
      {!q.isFetching && rows.length === 0 && (
        <p className="text-center text-foreground/40 py-12 text-sm">{t("common.nodata")}</p>
      )}
      {!q.isFetching && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left py-3 px-2 text-foreground/60 font-semibold text-xs uppercase">{t("coupons.historyTable.coupon")}</th>
                <th className="text-left py-3 px-2 text-foreground/60 font-semibold text-xs uppercase">{t("coupons.historyTable.user")}</th>
                <th className="text-left py-3 px-2 text-foreground/60 font-semibold text-xs uppercase">{t("coupons.historyTable.discountAmount")}</th>
                <th className="text-left py-3 px-2 text-foreground/60 font-semibold text-xs uppercase">{t("coupons.historyTable.usedAt")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id ?? i} className="border-b border-border-subtle/50 hover:bg-foreground/3 transition-colors">
                  <td className="py-3 px-2">
                    <span className="font-mono bg-foreground/5 px-2 py-0.5 rounded text-xs text-foreground border border-border-subtle">
                      {row.coupon?.code ?? row.couponCode ?? "—"}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-foreground/70">{row.user?.fullName ?? row.userId ?? "—"}</td>
                  <td className="py-3 px-2">
                    <span className="text-green-500 font-bold">{row.discountAmount ?? "—"}</span>
                  </td>
                  <td className="py-3 px-2 text-foreground/50 text-xs">{formatDate(row.usedAt ?? row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {count > LIMIT && (
        <Pagination skip={skip} limit={LIMIT} count={count} onSkipChange={setSkip} />
      )}
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Page
═══════════════════════════════════════════════════════ */
export default function CouponsPage() {
  const { t } = useTranslation("common");

  /* Pagination */
  const [skip, setSkip] = useState(0);
  const LIMIT = 10;

  /* Filters */
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [isActive, setIsActive] = useState("");

  /* Modal state */
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [globalHistOpen, setGlobalHistOpen] = useState(false);
  const [couponHistOpen, setCouponHistOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  /* Queries & Mutations */
  const { data, isFetching, error } = useCoupons({ skip, limit: LIMIT, status, type, isActive });
  const createMut = useCreateCoupon();
  const updateMut = useUpdateCoupon();
  const deleteMut = useDeleteCoupon();

  const coupons = data?.data || [];
  const count = data?.count ?? 0;

  useEffect(() => {
    if (error) toast.error(error?.message || t("coupons.toast.loadFailed"));
  }, [error]);

  /* Helpers */
  const resetFilters = () => { setStatus(""); setType(""); setIsActive(""); setSkip(0); };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : t("coupons.noExpiry");

  /* Handlers */
  const handleCreate = async (form) => {
    if (!form.code?.trim()) return toast.warning(t("coupons.toast.codeRequired"));
    if (!form.name?.trim()) return toast.warning(t("coupons.toast.nameRequired"));
    if (!form.discountValue) return toast.warning(t("coupons.toast.discountValueRequired"));
    if (!form.startsAt || !form.expiresAt) return toast.warning(t("coupons.toast.datesRequired"));

    try {
      await createMut.mutateAsync({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        activationDurationDays: form.activationDurationDays ? Number(form.activationDurationDays) : undefined,
        allowedUsages: form.allowedUsages ? Number(form.allowedUsages) : undefined,
        globalUsageLimit: form.globalUsageLimit ? Number(form.globalUsageLimit) : undefined,
        startsAt: form.startsAt,
        expiresAt: form.expiresAt,
        isActive: form.isActive,
      });
      toast.success(t("coupons.toast.created"));
      setCreateOpen(false);
    } catch (e) {
      toast.error(e?.message || t("coupons.toast.createFailed"));
    }
  };

  const handleUpdate = async (form) => {
    if (!selected) return;
    if (!form.name?.trim()) return toast.warning(t("coupons.toast.nameRequired"));

    try {
      await updateMut.mutateAsync({
        id: selected.id,
        data: {
          name: form.name.trim(),
          description: form.description?.trim() || undefined,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
          activationDurationDays: form.activationDurationDays ? Number(form.activationDurationDays) : undefined,
          allowedUsages: form.allowedUsages ? Number(form.allowedUsages) : undefined,
          globalUsageLimit: form.globalUsageLimit ? Number(form.globalUsageLimit) : undefined,
          startsAt: form.startsAt,
          expiresAt: form.expiresAt,
          isActive: form.isActive,
        },
      });
      toast.success(t("coupons.toast.updated"));
      setEditOpen(false);
      setSelected(null);
    } catch (e) {
      toast.error(e?.message || t("coupons.toast.updateFailed"));
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteMut.mutateAsync(selected.id);
      toast.success(t("coupons.toast.deleted"));
      setDeleteOpen(false);
      setSelected(null);
    } catch (e) {
      toast.error(e?.message || t("coupons.toast.deleteFailed"));
    }
  };

  /* ─── Status badge mapping ─── */
  const statusColor = { ACTIVE: "green", USED: "blue", EXPIRED: "red", REVOKED: "yellow" };
  const discountIcon = (type) =>
    type === "PERCENTAGE"
      ? <Percent size={12} className="text-purple-500" />
      : <DollarSign size={12} className="text-yellow-600" />;

  /* ─── Table Columns ─── */
  const columns = [
    {
      header: t("coupons.table.code"),
      accessorKey: "code",
      cell: ({ row }) => (
        <span className="font-mono bg-foreground/5 border border-border-subtle px-2.5 py-1 rounded-lg text-foreground text-xs font-bold tracking-widest">
          {row.original.code}
        </span>
      ),
    },
    {
      header: t("coupons.table.name"),
      cell: ({ row }) => (
        <div>
          <div className="text-foreground font-semibold text-sm">{row.original.name}</div>
          {row.original.description && (
            <div className="text-foreground/40 text-xs truncate max-w-[180px]">{row.original.description}</div>
          )}
        </div>
      ),
    },
    {
      header: t("coupons.table.discount"),
      cell: ({ row }) => {
        const { discountType, discountValue, maxDiscount } = row.original;
        return (
          <div className="flex items-center gap-1.5">
            {discountIcon(discountType)}
            <span className="text-foreground font-bold text-sm">
              {discountValue}{discountType === "PERCENTAGE" ? "%" : ""}
            </span>
            {maxDiscount && (
              <span className="text-foreground/40 text-xs">(max {maxDiscount})</span>
            )}
          </div>
        );
      },
    },
    {
      header: t("coupons.table.usage"),
      cell: ({ row }) => {
        const { usedCount, globalUsageLimit, allowedUsages } = row.original;
        const pct = globalUsageLimit ? Math.min((usedCount / globalUsageLimit) * 100, 100) : 0;
        return (
          <div className="flex flex-col gap-1 min-w-[100px]">
            <div className="flex items-center gap-1">
              <Users size={11} className="text-foreground/40" />
              <span className="text-foreground/70 text-xs">
                {usedCount} / {globalUsageLimit ?? "∞"}
              </span>
            </div>
            {globalUsageLimit && (
              <div className="w-full h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#4880FF] transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
            {allowedUsages && (
              <span className="text-foreground/40 text-[10px]">{allowedUsages}x/user</span>
            )}
          </div>
        );
      },
    },
    {
      header: t("coupons.table.validity"),
      cell: ({ row }) => {
        const { startsAt, expiresAt } = row.original;
        return (
          <div className="flex flex-col gap-0.5 text-xs">
            <div className="flex items-center gap-1 text-foreground/60">
              <Calendar size={10} />
              <span>{formatDate(startsAt)}</span>
            </div>
            <div className="flex items-center gap-1 text-foreground/40">
              <span className="text-foreground/20">→</span>
              <span>{formatDate(expiresAt)}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: t("coupons.table.status"),
      cell: ({ row }) => {
        const { isActive: active } = row.original;
        return (
          <div className="flex flex-col gap-1">
            <Badge
              label={active ? t("coupons.active") : t("coupons.inactive")}
              color={active ? "green" : "gray"}
            />
          </div>
        );
      },
    },
    {
      header: t("coupons.table.actions"),
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          {/* View history */}
          <button
            onClick={() => { setSelected(row.original); setCouponHistOpen(true); }}
            title={t("coupons.couponHistory")}
            className="p-2 rounded-xl bg-foreground/5 hover:bg-purple-500/10 text-foreground/40 hover:text-purple-500 transition-colors"
          >
            <History size={13} />
          </button>
          {/* Edit */}
          <button
            onClick={() => { setSelected(row.original); setEditOpen(true); }}
            title={t("common.edit", "Edit")}
            className="p-2 rounded-xl bg-foreground/5 hover:bg-[#4880FF]/10 text-foreground/40 hover:text-[#4880FF] transition-colors"
          >
            <Pencil size={13} />
          </button>
          {/* Delete */}
          <button
            onClick={() => { setSelected(row.original); setDeleteOpen(true); }}
            title={t("common.delete", "Delete")}
            className="p-2 rounded-xl bg-foreground/5 hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  const currentPage = Math.floor(skip / LIMIT) + 1;
  const totalPages  = Math.max(1, Math.ceil(count / LIMIT));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#4880FF]/10 text-[#4880FF]">
            <Ticket size={26} />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-bold tracking-tight">{t("coupons.title")}</h1>
            <p className="text-foreground/50 text-sm mt-0.5">{t("coupons.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setGlobalHistOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-border-subtle bg-foreground/5 text-foreground/70 font-semibold text-sm hover:bg-foreground/10 transition-all"
          >
            <History size={16} />
            {t("coupons.globalHistory")}
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#4880FF] text-white font-bold hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25"
          >
            <Plus size={16} />
            {t("coupons.addCoupon")}
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Filter size={16} />
            {t("coupons.filters")}
          </div>
          <button onClick={resetFilters} className="text-xs text-foreground/40 hover:text-[#4880FF] transition-colors">
            Reset
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Status */}
          <SelectInput value={status} onChange={(e) => { setStatus(e.target.value); setSkip(0); }}>
            <option value="">{t("coupons.allStatuses")}</option>
            <option value="ACTIVE">{t("coupons.statuses.ACTIVE")}</option>
            <option value="USED">{t("coupons.statuses.USED")}</option>
            <option value="EXPIRED">{t("coupons.statuses.EXPIRED")}</option>
            <option value="REVOKED">{t("coupons.statuses.REVOKED")}</option>
          </SelectInput>
          {/* Type */}
          <SelectInput value={type} onChange={(e) => { setType(e.target.value); setSkip(0); }}>
            <option value="">{t("coupons.allTypes")}</option>
            <option value="PERCENTAGE">{t("coupons.discountTypes.PERCENTAGE")}</option>
            <option value="FIXED">{t("coupons.discountTypes.FIXED")}</option>
          </SelectInput>
          {/* Activity */}
          <SelectInput value={isActive} onChange={(e) => { setIsActive(e.target.value); setSkip(0); }}>
            <option value="">{t("coupons.allActivity")}</option>
            <option value="true">{t("coupons.active")}</option>
            <option value="false">{t("coupons.inactive")}</option>
          </SelectInput>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-2xl">
        <UsersTable columns={columns} data={coupons} loading={isFetching} />
      </div>

      {/* ── Pagination ── */}
      <Pagination skip={skip} limit={LIMIT} count={count} onSkipChange={setSkip} />

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* Create */}
      <CouponFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        editing={null}
        onSubmit={handleCreate}
        isPending={createMut.isPending}
      />

      {/* Edit */}
      <CouponFormModal
        open={editOpen}
        onClose={() => { setEditOpen(false); setSelected(null); }}
        editing={selected}
        onSubmit={handleUpdate}
        isPending={updateMut.isPending}
      />

      {/* Delete Confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setSelected(null); }}
        title={t("coupons.confirm.title")}
        icon={Trash2}
        maxWidth="max-w-sm"
      >
        <p className="text-foreground/70 text-sm leading-relaxed">
          {t("coupons.confirm.message", { code: selected?.code })}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => { setDeleteOpen(false); setSelected(null); }}
            className="flex-1 px-5 py-3.5 rounded-2xl border border-border-subtle bg-foreground/5 text-foreground font-bold hover:bg-foreground/10 transition-all"
          >
            {t("common.cancel")}
          </button>
          <PrimaryBtn variant="danger" disabled={deleteMut.isPending} onClick={handleDelete}>
            {t("common.delete", "Delete")}
          </PrimaryBtn>
        </div>
      </Modal>

      {/* Global History */}
      <HistoryModal
        open={globalHistOpen}
        onClose={() => setGlobalHistOpen(false)}
        couponId={null}
        title={t("coupons.globalHistory")}
      />

      {/* Specific Coupon History */}
      <HistoryModal
        open={couponHistOpen}
        onClose={() => { setCouponHistOpen(false); setSelected(null); }}
        couponId={selected?.id}
        title={`${t("coupons.couponHistory")} – ${selected?.code ?? ""}`}
      />
    </div>
  );
}

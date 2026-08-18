import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import UsersTable from "@/components/users/UsersTable";
import { useDriverRequests } from "@/app/hooks/api/useDriverRequests";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { Search, ClipboardList, Filter, Eye, ChevronLeft, ChevronRight } from "lucide-react";

/* ═══════════════════════════════════════════════════════
   Shared UI Atoms & Status Badge
═══════════════════════════════════════════════════════ */

function StatusBadge({ status, t }) {
  const s = status?.toLowerCase();
  const colors =
    s === "submitted"
      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
      : s === "under_review"
      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
      : s === "approved"
      ? "bg-green-500/10 text-green-500 border-green-500/20"
      : s === "rejected"
      ? "bg-red-500/10 text-red-500 border-red-500/20"
      : s === "blocked"
      ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
      : "bg-foreground/5 text-foreground/60 border-border-subtle";

  return (
    <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${colors}`}>
      {t(`requestDetails.statuses.${s}`, status)}
    </span>
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

/* ═══════════════════════════════════════════════════════
   Main Page
═══════════════════════════════════════════════════════ */

export default function DriverRequestsPage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();

  const [skip, setSkip] = useState(0);
  const LIMIT = 10;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // Reset to page 1 when search or status changes
  useEffect(() => {
    setSkip(0);
  }, [debouncedSearch, status]);

  const { data, isFetching, error } = useDriverRequests({
    skip,
    limit: LIMIT,
    search: debouncedSearch,
    status,
  });

  const requests = data?.data || [];
  const count = data?.count ?? data?.meta?.total ?? 0;

  useEffect(() => {
    if (error) toast.error(error.message || t("requestDetails.updateFailed"));
  }, [error]);

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setSkip(0);
  };

  const columns = [
    {
      header: t("requestDetails.refId"),
      accessorKey: "driverProfileId",
      cell: ({ row }) => (
        <span className="font-mono bg-foreground/5 border border-border-subtle px-2.5 py-1 rounded-lg text-foreground text-xs font-bold tracking-widest">
          #{row.original.driverProfileId}
        </span>
      ),
    },
    {
      header: t("requestDetails.fields.fullName", "Driver Name"),
      accessorKey: "driverName",
      cell: ({ row }) => <span className="font-semibold text-foreground text-sm">{row.original.driverName || "—"}</span>,
    },
    {
      header: t("requestDetails.fields.email", "Email"),
      accessorKey: "driverEmail",
      cell: ({ row }) => <span className="text-foreground text-sm">{row.original.driverEmail || "—"}</span>,
    },
    {
      header: t("requestDetails.fields.phone", "Phone"),
      accessorKey: "driverPhoneNumber",
      cell: ({ row }) => <span className="text-foreground/80 font-mono text-sm">{row.original.driverPhoneNumber || "—"}</span>,
    },
    {
      header: t("requestDetails.fields.plate"),
      accessorKey: "vehiclePlateNumber",
      cell: ({ row }) => (
        <span className="font-semibold text-foreground text-sm tracking-wider">
          {row.original.vehiclePlateNumber || "—"}
        </span>
      ),
    },
    {
      header: t("requestDetails.fields.model"),
      accessorKey: "vehicleModel",
      cell: ({ row }) => <span className="text-foreground text-sm">{row.original.vehicleModel || "—"}</span>,
    },
    {
      header: t("requestDetails.fields.year"),
      accessorKey: "vehicleYear",
      cell: ({ row }) => <span className="text-foreground/70 text-sm font-mono">{row.original.vehicleYear || "—"}</span>,
    },
    {
      header: t("requestDetails.fields.status"),
      cell: ({ row }) => <StatusBadge status={row.original.status} t={t} />,
    },
    {
      header: "",
      id: "actions",
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`/driver-requests/${row.original.id}`)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4880FF]/10 text-[#4880FF] hover:bg-[#4880FF] hover:text-white font-bold text-xs transition-all border border-[#4880FF]/20 hover:border-[#4880FF]"
        >
          <Eye size={14} />
          {t("requestDetails.review", "Review")}
        </button>
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
            <ClipboardList size={26} />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-bold tracking-tight">{t("requestDetails.title")}</h1>
            <p className="text-foreground/50 text-sm mt-0.5">{t("requestDetails.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Filter size={16} />
            <span>{t("ratingTags.filters", "Filters")}</span>
          </div>
          <button onClick={resetFilters} className="text-xs text-foreground/40 hover:text-[#4880FF] transition-colors">
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("common.search")}
              className="w-full bg-surface border border-border-subtle rounded-2xl py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all"
            />
          </div>

          {/* Status filter */}
          <SelectInput value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t("requestDetails.allStatuses")}</option>
            <option value="submitted">{t("requestDetails.statuses.submitted")}</option>
            <option value="under_review">{t("requestDetails.statuses.under_review")}</option>
            <option value="approved">{t("requestDetails.statuses.approved")}</option>
            <option value="rejected">{t("requestDetails.statuses.rejected")}</option>
            <option value="blocked">{t("requestDetails.statuses.blocked")}</option>
          </SelectInput>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-2xl">
        <UsersTable columns={columns} data={requests} loading={isFetching && requests.length === 0} />
      </div>

      {/* ── Pagination ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <p className="text-foreground/60 text-xs font-medium bg-foreground/5 px-4 py-2 rounded-full border border-border-subtle">
          {t("coupons.pageInfo", { current: currentPage, total: totalPages, count })}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setSkip(Math.max(skip - LIMIT, 0))}
            disabled={skip === 0 || isFetching}
            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-border-subtle bg-foreground/5 text-foreground font-bold text-sm hover:bg-foreground/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} />
            {t("common.prev")}
          </button>
          <button
            onClick={() => setSkip(skip + LIMIT < count ? skip + LIMIT : skip)}
            disabled={skip + LIMIT >= count || isFetching}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#4880FF] text-white font-bold text-sm hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t("common.next")}
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

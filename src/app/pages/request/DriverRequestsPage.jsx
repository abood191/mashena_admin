import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import UsersTable from "@/components/users/UsersTable";
import { useDriverRequests } from "@/app/hooks/api/useDriverRequests";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { Search, ClipboardList } from "lucide-react";

// Status badge helper
const StatusBadge = ({ status }) => {
  const s = status?.toLowerCase();
  const styles =
    s === "submitted" || s === "pending"
      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      : s === "approved"
        ? "bg-green-500/10 text-green-400 border-green-500/20"
        : "bg-red-500/10 text-red-400 border-red-500/20";
  return (
    <span className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${styles}`}>
      {status}
    </span>
  );
};

export default function DriverRequestsPage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();

  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // Reset to page 1 when search changes
  useEffect(() => {
    setSkip(0);
  }, [debouncedSearch]);

  const { data, isFetching, error } = useDriverRequests({
    skip,
    limit,
    search: debouncedSearch,
  });

  const requests = data?.data || [];
  const count = data?.count || 0;

  useEffect(() => {
    if (error) toast.error(error.message || "Failed to load requests");
  }, [error]);

  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(count / limit));
  const canPrev = skip > 0;
  const canNext = skip + limit < count;

  const columns = [
    {
      header: t("requestDetails.refId"),
      accessorKey: "driverProfileId",
      cell: ({ row }) => (
        <span className="font-mono text-white/60 text-xs">#{row.original.driverProfileId}</span>
      ),
    },
    {
      header: t("requestDetails.fields.plate"),
      accessorKey: "vehiclePlateNumber",
      cell: ({ row }) => (
        <span className="font-semibold text-white tracking-wider">{row.original.vehiclePlateNumber || "—"}</span>
      ),
    },
    {
      header: t("requestDetails.fields.model"),
      accessorKey: "vehicleModel",
      cell: ({ row }) => <span className="text-white/70">{row.original.vehicleModel || "—"}</span>,
    },
    {
      header: t("requestDetails.fields.year"),
      accessorKey: "vehicleYear",
      cell: ({ row }) => <span className="text-white/50">{row.original.vehicleYear || "—"}</span>,
    },
    {
      header: t("requestDetails.fields.status"),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: "",
      id: "actions",
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`/driver-requests/${row.original.id}`)}
          className="bg-[#4880FF]/10 text-[#4880FF] hover:bg-[#4880FF] hover:text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all border border-[#4880FF]/20 hover:border-[#4880FF]"
        >
          {t("roles.edit")}
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#4880FF]/10 text-[#4880FF]">
            <ClipboardList size={28} />
          </div>
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight">{t("sidebar.requests")}</h1>
            <p className="text-white/40 text-sm mt-0.5">Driver onboarding approval queue</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by plate, model..."
            className="w-full bg-[#0b1220] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0b1220] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <UsersTable columns={columns} data={requests} loading={isFetching} />
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="text-white/40 text-xs font-medium bg-white/5 px-4 py-2 rounded-full border border-white/5">
          {count === 0
            ? t("common.nodata")
            : t("drivers.pageInfo", { current: currentPage, total: totalPages, count })}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setSkip(Math.max(skip - limit, 0))}
            disabled={!canPrev || isFetching}
            className="px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/80 font-bold text-sm hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t("common.prev")}
          </button>
          <button
            onClick={() => setSkip(skip + limit)}
            disabled={!canNext || isFetching}
            className="px-6 py-2.5 rounded-xl bg-[#4880FF] text-white font-bold text-sm hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t("common.next")}
          </button>
        </div>
      </div>
    </div>
  );
}

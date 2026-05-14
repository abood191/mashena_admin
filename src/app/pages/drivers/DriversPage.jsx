import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import UsersTable from "@/components/users/UsersTable";
import { useDrivers } from "@/app/hooks/api/useUsers";
import { useDebounce } from "@/hooks/useDebounce";
import { Search,  Users, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function DriversPage() {
  const { t } = useTranslation("common");
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { data, isFetching, error } = useDrivers({
    skip,
    limit,
    search: debouncedSearch,
  });

  const drivers = data?.data || [];
  const count = data?.count || 0;

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to load drivers");
    }
  }, [error]);

  const columns = [
    { header: t("drivers.table.name"), accessorKey: "fullName" },
    { header: t("drivers.table.email"), accessorKey: "email" },
    { header: t("drivers.table.phone"), accessorKey: "phoneNumber" },
    {
      header: t("drivers.table.city"),
      cell: ({ row }) => <span className="text-white/60">{row.original.driverProfile?.city || "—"}</span>,
    },
    {
      header: t("drivers.table.status"),
      cell: ({ row }) => {
        const status = row.original.driverProfile?.approvalStatus?.toLowerCase() || "pending";
        const colors = {
          approved: 'bg-green-500/10 text-green-500 border-green-500/20',
          pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
          submitted: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
          rejected: 'bg-red-500/10 text-red-500 border-red-500/20'
        };
        return (
          <span className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${colors[status] || colors.pending}`}>
            {t(`drivers.statuses.${status}`) || status}
          </span>
        );
      },
    },
    {
      header: t("drivers.table.verified"),
      cell: ({ row }) => {
        const isVerified = row.original.driverProfile?.isVerified;
        return isVerified ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-white/20" />;
      },
    },
    { 
      header: t("drivers.table.createdAt"), 
      accessorKey: "createdAt",
      cell: ({ row }) => <span className="font-mono text-white/30 text-xs">{new Date(row.original.createdAt).toLocaleDateString()}</span>
    },
  ];

  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(count / limit));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#4880FF]/10 text-[#4880FF]">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight">{t("drivers.title")}</h1>
            <p className="text-white/40 text-sm mt-0.5">Manage and monitor all registered driver accounts</p>
          </div>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input
            placeholder={t("drivers.searchPlaceholder")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSkip(0);
            }}
            className="w-full bg-[#0b1220] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all shadow-inner shadow-black/20"
          />
        </div>
      </div>

      <div className="bg-[#0b1220] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <UsersTable columns={columns} data={drivers} loading={isFetching} />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="text-white/40 text-xs font-medium bg-white/5 px-4 py-2 rounded-full border border-white/5">
          {t("drivers.pageInfo", { 
            current: currentPage, 
            total: totalPages, 
            count 
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setSkip(Math.max(skip - limit, 0))}
            disabled={skip === 0}
            className="px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/80 font-bold text-sm hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t("common.prev")}
          </button>
          <button
            onClick={() => setSkip(skip + limit < count ? skip + limit : skip)}
            disabled={skip + limit >= count}
            className="px-6 py-2.5 rounded-xl bg-[#4880FF] text-white font-bold text-sm hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t("common.next")}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import UsersTable from "@/components/users/UsersTable";
import { userService } from "@/app/services/user.service";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, UserSquare, Star, CheckCircle2, XCircle } from "lucide-react";

export default function RidersPage() {
  const { t } = useTranslation("common");
  const [riders, setRiders] = useState([]);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const fetchRiders = async () => {
    setLoading(true);
    try {
      const res = await userService.getRiders({
        skip,
        limit,
        search: debouncedSearch,
      });

      setRiders(res.data || []);
      setCount(res.count || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, [skip, debouncedSearch]);

  const columns = [
    { header: t("riders.table.name"), accessorKey: "fullName" },
    { header: t("riders.table.email"), accessorKey: "email" },
    { header: t("riders.table.phone"), accessorKey: "phoneNumber" },
    {
      header: t("riders.table.verified"),
      cell: ({ row }) => {
        const isVerified = row.original.isVerified; // Adjust based on API structure
        return isVerified ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-white/20" />;
      },
    },
    {
      header: t("riders.table.ratingAvg"),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Star size={12} className="text-yellow-500 fill-yellow-500" />
          <span className="font-bold text-white/80">{Number(row.original.riderProfile?.ratingAvg || 0).toFixed(1)}</span>
        </div>
      ),
    },
    { 
      header: t("riders.table.cancelledTripCount"), 
      cell: ({ row }) => <span className="text-red-400/80 font-medium">{row.original.riderProfile?.canceledTripsCount || 0}</span>
    },
    { 
      header: t("riders.table.createdAt"), 
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
            <UserSquare size={28} />
          </div>
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight">{t("riders.title")}</h1>
            <p className="text-white/40 text-sm mt-0.5">Manage and monitor all registered rider accounts</p>
          </div>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input
            placeholder={t("riders.searchPlaceholder")}
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
        <UsersTable columns={columns} data={riders} loading={loading} />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="text-white/40 text-xs font-medium bg-white/5 px-4 py-2 rounded-full border border-white/5">
          {t("riders.pageInfo", { 
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
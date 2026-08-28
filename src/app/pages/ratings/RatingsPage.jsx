import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import DataTable from "@/components/users/UsersTable";
import { useRatings } from "@/app/hooks/api/useRatings";
import { Search, Star, Filter, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function RatingsPage() {
  const { t } = useTranslation("common");
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");        // debounced value sent to API
  const [tripId, setTripId] = useState("");
  const [score, setScore] = useState("");

  // Debounce: wait 400ms after the user stops typing before hitting the API
  const debounceRef = useRef(null);
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setSkip(0);
    }, 400);
  };

  const { data, isFetching, error } = useRatings({ skip, limit, search, tripId, score });

  const ratings = data?.data || [];
  const count   = data?.meta?.total ?? data?.count ?? 0;

  useEffect(() => {
    if (error) toast.error(error?.message || t("ratings.loadFailed", "Failed to load ratings"));
  }, [error]);

  const columns = [
    {
      header: t("ratings.table.tripId"),
      accessorKey: "tripId",
      cell: ({ row }) => (
        <span className="font-mono bg-foreground/5 border border-border-subtle px-2.5 py-1 rounded-lg text-foreground text-xs">
          {row.original.tripId}
        </span>
      ),
    },
    {
      header: t("ratings.table.fromUser"),
      cell: ({ row }) => (
        <div>
          <div className="text-foreground font-semibold text-sm">{row.original.fromUser?.fullName || "—"}</div>
          <div className="text-foreground/40 text-xs">ID: {row.original.fromUserId}</div>
        </div>
      ),
    },
    {
      header: t("ratings.table.toUser"),
      cell: ({ row }) => (
        <div>
          <div className="text-foreground font-semibold text-sm">{row.original.toUser?.fullName || "—"}</div>
          <div className="text-foreground/40 text-xs">ID: {row.original.toUserId}</div>
        </div>
      ),
    },
    {
      header: t("ratings.table.score"),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span className="text-foreground font-bold">{row.original.score}</span>
          <Star size={13} className="text-yellow-500 fill-yellow-500" />
        </div>
      ),
    },
    {
      header: t("ratings.table.commentAndTags"),
      cell: ({ row }) => {
        const comment = row.original.comment;
        const tags = row.original.tags || [];
        return (
          <div className="max-w-[220px]">
            {comment && (
              <p className="text-sm italic text-foreground/70 mb-1 truncate">"{comment}"</p>
            )}
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    tag.sentiment === "POSITIVE"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : tag.sentiment === "NEGATIVE"
                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                      : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  }`}
                >
                  {tag.code}
                </span>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      header: t("ratings.table.date"),
      accessorKey: "createdAt",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-foreground/50 text-xs font-mono">
          <Calendar size={11} />
          {new Date(row.original.createdAt).toLocaleDateString()}
        </div>
      ),
    },
  ];

  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages  = Math.max(1, Math.ceil(count / limit));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-[#4880FF]/10 text-[#4880FF]">
          <Star size={26} />
        </div>
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">{t("ratings.title")}</h1>
          <p className="text-foreground/50 text-sm mt-0.5">{t("ratings.subtitle")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-foreground font-semibold text-sm">
          <Filter size={16} />
          <span>{t("ratings.filters")}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search by name / phone / email */}
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none"
              size={16}
            />
            <input
              type="text"
              placeholder={t("common.search")}
              value={searchInput}
              onChange={handleSearchChange}
              className="w-full bg-surface border border-border-subtle rounded-2xl py-3 pl-11 pr-4 text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all"
            />
          </div>

          {/* Trip ID */}
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none"
              size={16}
            />
            <input
              type="number"
              placeholder={t("ratings.tripId")}
              value={tripId}
              onChange={(e) => { setTripId(e.target.value); setSkip(0); }}
              className="w-full bg-surface border border-border-subtle rounded-2xl py-3 pl-11 pr-4 text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all"
            />
          </div>

          {/* Score */}
          <div className="relative">
            <select
              value={score}
              onChange={(e) => { setScore(e.target.value); setSkip(0); }}
              className="w-full bg-surface border border-border-subtle rounded-2xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all appearance-none cursor-pointer [&>option]:bg-white [&>option]:text-[#0f172a] dark:[&>option]:bg-[#0b1220] dark:[&>option]:text-white"
            >
              <option value="">{t("ratings.allScores")}</option>
              <option value="5">{t("ratings.stars", { count: 5 })}</option>
              <option value="4">{t("ratings.stars", { count: 4 })}</option>
              <option value="3">{t("ratings.stars", { count: 3 })}</option>
              <option value="2">{t("ratings.stars", { count: 2 })}</option>
              <option value="1">{t("ratings.oneStar")}</option>
            </select>
            <Star
              className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none fill-foreground/30"
              size={14}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-2xl">
        <DataTable columns={columns} data={ratings} loading={isFetching} />
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <p className="text-foreground/60 text-xs font-medium bg-foreground/5 px-4 py-2 rounded-full border border-border-subtle">
          {t("ratings.pageInfo", { current: currentPage, total: totalPages, count })}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setSkip(Math.max(skip - limit, 0))}
            disabled={skip === 0}
            className="px-5 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground font-bold text-sm hover:bg-foreground/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t("common.prev")}
          </button>
          <button
            onClick={() => setSkip(skip + limit < count ? skip + limit : skip)}
            disabled={skip + limit >= count}
            className="px-5 py-2.5 rounded-xl bg-[#4880FF] text-white font-bold text-sm hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t("common.next")}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import DataTable from "@/components/users/UsersTable";
import { useRatings } from "@/app/hooks/api/useRatings";
import UserAutocomplete from "@/components/users/UserAutocomplete";
import { Search, Star, Filter, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function RatingsPage() {
  const { t } = useTranslation("common");
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  
  // Filters
  const [userId, setUserId] = useState("");
  const [tripId, setTripId] = useState("");
  const [score, setScore] = useState("");

  const { data, isFetching, error } = useRatings({
    skip,
    limit,
    userId,
    tripId,
    score
  });

  const ratings = data?.data || [];
  const count = data?.meta?.total || 0; // Meta from the API structure provided earlier

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to load ratings");
    }
  }, [error]);

  const columns = [
    { 
      header: "Trip ID", 
      accessorKey: "tripId",
      cell: ({ row }) => <span className="font-mono bg-foreground/5 px-2 py-1 rounded text-foreground">{row.original.tripId}</span>
    },
    { 
      header: "From User", 
      cell: ({ row }) => (
        <div>
          <div className="font-semibold">{row.original.fromUser?.fullName || "—"}</div>
          <div className="text-xs text-muted">ID: {row.original.fromUserId}</div>
        </div>
      )
    },
    { 
      header: "To User", 
      cell: ({ row }) => (
        <div>
          <div className="font-semibold">{row.original.toUser?.fullName || "—"}</div>
          <div className="text-xs text-muted">ID: {row.original.toUserId}</div>
        </div>
      )
    },
    { 
      header: "Score", 
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span className="font-bold">{row.original.score}</span>
          <Star size={14} className="text-yellow-500 fill-yellow-500" />
        </div>
      )
    },
    { 
      header: "Comment & Tags", 
      cell: ({ row }) => {
        const comment = row.original.comment;
        const tags = row.original.tags || [];
        return (
          <div className="max-w-xs">
            {comment && <p className="text-sm italic text-foreground/80 mb-1">"{comment}"</p>}
            <div className="flex flex-wrap gap-1 mt-1">
              {tags.map(tag => (
                <span key={tag.id} className={`text-[10px] px-2 py-0.5 rounded-full border ${tag.sentiment === 'POSITIVE' ? 'bg-green-500/10 text-green-500 border-green-500/20' : tag.sentiment === 'NEGATIVE' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                  {tag.code}
                </span>
              ))}
            </div>
          </div>
        )
      }
    },
    { 
      header: "Date", 
      accessorKey: "createdAt",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-xs text-muted font-mono">
          <Calendar size={12} />
          {new Date(row.original.createdAt).toLocaleDateString()}
        </div>
      )
    },
  ];

  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(count / limit));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#4880FF]/10 text-[#4880FF]">
            <Star size={28} />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-bold tracking-tight">Ratings</h1>
            <p className="text-foreground text-sm mt-0.5">Manage and filter all system ratings</p>
          </div>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-foreground font-semibold">
          <Filter size={18} />
          <span>Filters</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="z-20">
            <UserAutocomplete 
              value={userId}
              onChange={(id) => {
                setUserId(id);
                setSkip(0);
              }}
              placeholder="Search User..."
            />
          </div>

          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="number"
              placeholder="Trip ID"
              value={tripId}
              onChange={(e) => {
                setTripId(e.target.value);
                setSkip(0);
              }}
              className="w-full bg-surface border border-border-subtle rounded-2xl py-3 pl-12 pr-4 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all"
            />
          </div>

          <div className="relative w-full">
            <select
              value={score}
              onChange={(e) => {
                setScore(e.target.value);
                setSkip(0);
              }}
              className="w-full bg-surface border border-border-subtle rounded-2xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all appearance-none cursor-pointer"
            >
              <option value="">All Scores</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
              <Star size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-2xl">
        <DataTable columns={columns} data={ratings} loading={isFetching} />
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="text-foreground text-xs font-medium bg-foreground/5 px-4 py-2 rounded-full border border-border-subtle">
          Page {currentPage} of {totalPages} (Total: {count})
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
    </div>
  );
}

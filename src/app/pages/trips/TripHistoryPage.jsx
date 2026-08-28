import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTripsHistory } from "../../hooks/api/useTripsHistory";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Loader2, AlertTriangle, Search, Filter, History, Navigation, Calendar, RefreshCw
} from "lucide-react";

export default function TripHistoryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    skip: 0,
    limit: 10,
    status: "",
    fromDate: "",
    toDate: "",
    search: "",
  });

  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isFetching, error, refetch } = useTripsHistory(filters);
  const trips = data?.data || [];
  const total = data?.count || 0;

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchInput, skip: 0 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, skip: 0 }));
  };

  const handlePageChange = (newSkip) => {
    setFilters(prev => ({ ...prev, skip: newSkip }));
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-500";
      case "canceled":
        return "bg-red-500/10 border-red-500/20 text-red-500";
      case "assigned":
      case "en_route_to_pickup":
      case "arrived":
      case "started":
        return "bg-amber-500/10 border-amber-500/20 text-amber-500";
      default:
        return "bg-indigo-500/10 border-indigo-500/20 text-indigo-400";
    }
  };

  return (
    <div className="p-1 space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="bg-surface backdrop-blur-md px-6 py-5 rounded-3xl border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#4880FF]/10 border border-[#4880FF]/20 grid place-items-center text-lg text-[#4880FF]">
            <History size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground tracking-wide uppercase">
              {t("sidebar.trips")} {t("sidebar.tripHistory", { defaultValue: "History" })}
            </h1>
            <p className="text-[10px] text-foreground/40">
              {t("tripHistory.subtitle", { defaultValue: "Review all past and ongoing trips across the system" })}
            </p>
          </div>
        </div>
        {/* Refresh button */}
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-border-subtle bg-surface hover:bg-[#4880FF]/5 hover:border-[#4880FF]/30 text-foreground text-sm font-medium transition-all disabled:opacity-50"
          title="Refresh trips"
        >
          <RefreshCw size={16} className={isFetching ? "animate-spin text-[#4880FF]" : ""} />
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface rounded-3xl border border-border-subtle p-4 flex flex-wrap gap-4 items-end shadow-sm">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <label className="text-foreground/60 text-[10px] font-bold uppercase tracking-wider ml-1 mb-1 block">
            {t("tripHistory.search", "Search")}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
            <input
              type="text"
              placeholder={t("tripHistory.searchPlaceholder", "Trip ID, Rider, Driver...")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border-subtle bg-foreground/5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/40 "
            />
          </div>
        </form>

        <div className="w-full md:w-auto min-w-[150px]">
          <label className="text-[10px] uppercase font-bold text-foreground/50 tracking-wider mb-2 block">{t("tripHistory.status", "STATUS")}</label>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
            <select
              className="w-full bg-surface border-border-subtle text-foreground rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4880FF]/40 border appearance-none font-medium cursor-pointer [&>option]:bg-white [&>option]:text-[#0f172a] dark:[&>option]:bg-[#0b1220] dark:[&>option]:text-white"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, skip: 0 }))}
            >
              <option value="">{t("tripHistory.allStatuses", "All Statuses")}</option>
              <option value="assigned">{t("tripHistory.statusAssigned", "Assigned")}</option>
              <option value="en_route_to_pickup">{t("tripHistory.statusEnRoute", "En route to pickup")}</option>
              <option value="arrived">{t("tripHistory.statusArrived", "Arrived")}</option>
              <option value="started">{t("tripHistory.statusStarted", "Started")}</option>
              <option value="completed">{t("tripHistory.statusCompleted", "Completed")}</option>
              <option value="canceled">{t("tripHistory.statusCanceled", "Canceled")}</option>
            </select>
          </div>
        </div>

        <div className="w-full md:w-auto min-w-[150px]">
          <label className="text-[10px] uppercase font-bold text-foreground/50 tracking-wider mb-2 block">{t("tripHistory.fromDate", "FROM DATE")}</label>
          <input
            type="datetime-local"
            value={filters.fromDate}
            onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value, skip: 0 }))}
            className="w-full px-4 py-2.5 rounded-2xl border border-border-subtle bg-foreground/5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#4880FF]/40"
          />
        </div>

        <div className="w-full md:w-auto min-w-[150px]">
          <label className="text-[10px] uppercase font-bold text-foreground/50 tracking-wider mb-2 block">{t("tripHistory.toDate", "TO DATE")}</label>
          <input
            type="datetime-local"
            value={filters.toDate}
            onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value, skip: 0 }))}
            className="w-full px-4 py-2.5 rounded-2xl border border-border-subtle bg-foreground/5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#4880FF]/40"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-surface rounded-3xl border border-border-subtle shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-foreground/40">
            <Loader2 className="h-8 w-8 animate-spin text-[#4880FF] mb-4" />
            <span className="text-xs uppercase tracking-widest font-semibold">{t("tripHistory.loading", "Loading history...")}</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-red-500">
            <AlertTriangle className="h-9 w-9 mb-3 opacity-80" />
            <h3 className="text-sm font-bold uppercase tracking-wide">{t("tripHistory.error", "Error loading trips")}</h3>
            <p className="text-xs opacity-70 mt-1">{error.message}</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-foreground/40">
            <History className="h-10 w-10 mb-3 opacity-50" />
            <h3 className="text-sm font-bold uppercase tracking-wide">{t("tripHistory.noTrips", "No trips found")}</h3>
            <p className="text-xs opacity-70 mt-1">{t("tripHistory.noTripsSubtitle", "Try adjusting your search or filters.")}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-foreground/5 border-b border-border-subtle">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="w-[80px]">{t("tripHistory.table.id", "ID")}</TableHead>
                    <TableHead className="w-[120px]">{t("tripHistory.table.status", "STATUS")}</TableHead>
                    <TableHead>{t("tripHistory.table.rider", "RIDER")}</TableHead>
                    <TableHead>{t("tripHistory.table.driver", "DRIVER")}</TableHead>
                    <TableHead>{t("tripHistory.table.createdAt", "CREATED AT")}</TableHead>
                    <TableHead className="text-right">{t("tripHistory.table.fare", "FARE")}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map((trip) => (
                    <TableRow 
                      key={trip.id}
                      className="border-b border-border-subtle hover:bg-foreground/[0.02] cursor-pointer group transition-colors"
                      onClick={() => navigate(`/trip-history/${trip.id}`)}
                    >
                      <TableCell className="px-6 py-4 font-bold text-foreground/90">
                        #{trip.id}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase border tracking-wider ${getStatusBadgeClass(trip.status)}`}>
                          {trip.status.replace(/_/g, " ")}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="text-sm font-semibold text-foreground">{trip.riderFullName || "N/A"}</div>
                        <div className="text-xs text-foreground/50">{trip.riderPhoneNumber || "-"}</div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="text-sm font-semibold text-foreground">{trip.driver?.name || "Unassigned"}</div>
                        <div className="text-xs text-foreground/50">{trip.driver?.phone || "-"}</div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="text-sm text-foreground flex items-center gap-1.5">
                          <Calendar size={14} className="text-foreground/40" />
                          {trip.createdAt ? new Date(trip.createdAt).toLocaleString() : "-"}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-bold text-[#4880FF]">
                        {trip.fareTotal ? `${trip.fareTotal}` : "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <button className="text-foreground/40 group-hover:text-[#4880FF] transition-colors p-2 bg-foreground/5 group-hover:bg-[#4880FF]/10 rounded-xl">
                          <Navigation size={16} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="border-t border-border-subtle p-4 flex items-center justify-between bg-foreground/[0.01]">
              <span className="text-sm font-semibold text-foreground/60">
                {t("tripHistory.showing", "Showing")} <span className="text-foreground">{filters.skip + 1}</span> {t("tripHistory.to", "to")} <span className="text-foreground">{Math.min(filters.skip + filters.limit, total)}</span> {t("tripHistory.of", "of")} <span className="text-foreground">{total}</span> {t("tripHistory.trips", "trips")}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => handlePageChange(Math.max(0, filters.skip - filters.limit))}
                  disabled={filters.skip === 0}
                  className="px-5 py-2.5 rounded-xl border border-border-subtle bg-surface hover:bg-foreground/5 text-foreground font-bold text-xs transition-colors disabled:opacity-40 disabled:hover:bg-surface"
                >
                  {t("common.prev", "Prev")}
                </button>
                <button 
                  onClick={() => handlePageChange(filters.skip + filters.limit)}
                  disabled={filters.skip + filters.limit >= total}
                  className="px-5 py-2.5 rounded-xl border border-border-subtle bg-surface hover:bg-foreground/5 text-foreground font-bold text-xs transition-colors disabled:opacity-40 disabled:hover:bg-surface"
                >
                  {t("common.next", "Next")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

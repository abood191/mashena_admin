import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { usePassengerPools } from "../../hooks/api/usePassengerPools";
import { Loader2, Users, Eye, Search, Filter, RefreshCw } from "lucide-react";

export default function PassengerPoolsPage() {
  const { t } = useTranslation();
  
  // Filter states
  const [filters, setFilters] = useState({
    skip: 0,
    limit: 10,
    status: "",
    search: "",
    fromDate: "",
    toDate: "",
  });

  // Derived state to pass to API (removes empty strings)
  const queryParams = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== "")
  );

  const { data, isLoading, refetch, isFetching } = usePassengerPools(queryParams);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, skip: 0 })); // Reset pagination on filter change
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-[#4880FF]" />
            {t("sidebar.passengerPools", "Passenger Pools")}
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            {t("passengerPools.subtitle", "Manage and track passenger grouping rooms")}
          </p>
        </div>
        <button 
          onClick={() => refetch()} 
          disabled={isFetching}
          className="p-2 bg-surface border border-border-subtle rounded-xl hover:bg-foreground/5 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 text-[#4880FF] ${isFetching ? 'animate-spin' : ''}`} />
          {t("common.refresh", "Refresh")}
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs text-foreground/70 mb-1">{t("common.search", "Search")}</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder={t("passengerPools.searchPlaceholder", "Name, phone, address...")}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border-subtle bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-foreground/70 mb-1">{t("passengerPools.status", "Status")}</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 text-sm rounded-xl border border-border-subtle bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#4880FF]/50 cursor-pointer"
          >
            <option value="">{t("passengerPools.allStatuses", "All Statuses")}</option>
            <option value="OPEN">OPEN</option>
            <option value="READY_FOR_DRIVER">READY_FOR_DRIVER</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="CANCELED">CANCELED</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-foreground/70 mb-1">{t("passengerPools.fromDate", "From Date")}</label>
          <input
            type="date"
            name="fromDate"
            value={filters.fromDate}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 text-sm rounded-xl border border-border-subtle bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/50"
          />
        </div>

        <div>
          <label className="block text-xs text-foreground/70 mb-1">{t("passengerPools.toDate", "To Date")}</label>
          <input
            type="date"
            name="toDate"
            value={filters.toDate}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 text-sm rounded-xl border border-border-subtle bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/50"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-foreground/50">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>{t("common.loading", "Loading...")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-foreground/5 border-b border-border-subtle text-foreground/70 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-semibold">{t("passengerPools.table.roomId", "Room ID")}</th>
                  <th className="px-6 py-4 font-semibold">{t("passengerPools.table.status", "Status")}</th>
                  <th className="px-6 py-4 font-semibold">{t("passengerPools.table.meetingPoint", "Meeting Point")}</th>
                  <th className="px-6 py-4 font-semibold">{t("passengerPools.table.destination", "Destination")}</th>
                  <th className="px-6 py-4 font-semibold">{t("passengerPools.table.passengers", "Passengers")}</th>
                  <th className="px-6 py-4 font-semibold text-right">{t("passengerPools.table.actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {data?.data?.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-foreground/50">
                      {t("passengerPools.noData", "No passenger pools found matching the filters.")}
                    </td>
                  </tr>
                ) : (
                  data?.data?.map((pool) => (
                    <tr key={pool.id} className="hover:bg-foreground/5 transition-colors">
                      <td className="px-6 py-4">#{pool.id}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          {pool.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 truncate max-w-[200px]">{pool.meetingAddress}</td>
                      <td className="px-6 py-4 truncate max-w-[200px]">{pool.destinationAddress}</td>
                      <td className="px-6 py-4">
                        {pool.currentPassengers} / {pool.maxPassengers}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/passenger-pools/tracking/${pool.id}`}
                          className="inline-flex items-center justify-center p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground transition"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            <div className="p-4 border-t border-border-subtle flex items-center justify-between">
               <span className="text-xs text-foreground/60">
                 {t("common.showing", "Showing")} {data?.data?.length || 0} {t("common.of", "of")} {data?.count || 0}
               </span>
               <div className="flex gap-2">
                 <button 
                   disabled={filters.skip === 0}
                   onClick={() => setFilters(p => ({ ...p, skip: Math.max(0, p.skip - p.limit) }))}
                   className="px-3 py-1 text-xs rounded-lg border border-border-subtle hover:bg-foreground/5 disabled:opacity-50"
                 >
                   {t("common.prev", "Previous")}
                 </button>
                 <button 
                   disabled={!data?.data?.length || data.data.length < filters.limit}
                   onClick={() => setFilters(p => ({ ...p, skip: p.skip + p.limit }))}
                   className="px-3 py-1 text-xs rounded-lg border border-border-subtle hover:bg-foreground/5 disabled:opacity-50"
                 >
                   {t("common.next", "Next")}
                 </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

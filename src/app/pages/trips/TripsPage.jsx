import { useNavigate } from "react-router-dom";
import { useActiveTrips } from "../../hooks/api/useActiveTrips";
import { AlertTriangle, Loader2, Map, MapPin, Navigation, Radio, ShieldAlert, UserRound } from "lucide-react";

function formatTripId(tripId) {
  if (!tripId) return "Unknown";
  return tripId.length > 10 ? tripId.slice(-8) : tripId;
}

export default function TripsPage() {
  const { data: activeTrips = [], isLoading, error } = useActiveTrips();
  const navigate = useNavigate();

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 border-yellow-500/20 text-yellow-400";
      case "accepted":
        return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      case "driver_arrived":
        return "bg-cyan-500/10 border-cyan-500/20 text-cyan-400";
      case "started":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      default:
        return "bg-indigo-500/10 border-indigo-500/20 text-indigo-400";
    }
  };

  return (
    <div className="p-1 space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="bg-slate-900 backdrop-blur-md px-6 py-5 rounded-3xl border border-white/10 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 grid place-items-center text-lg shadow-inner">
            <Map className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide uppercase">
              Trips Dispatch Deck
            </h1>
            <p className="text-[10px] text-white/40">
              Manage operational ride transits and realtime dispatches
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-white/70">
              {activeTrips.length} Active Dispatches
            </span>
          </div>
        </div>
      </div>

      {/* Trips Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-white/40">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-4" />
          <span className="text-xs uppercase tracking-widest font-semibold">Loading operations deck...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-red-300 border border-red-500/20 rounded-3xl bg-red-500/10 min-h-[260px]">
          <AlertTriangle className="h-9 w-9 mb-3" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Trips unavailable</h3>
          <p className="text-xs text-red-200/70 mt-1 max-w-[360px] leading-relaxed">
            {error.message || "The operations deck could not load active trips."}
          </p>
        </div>
      ) : activeTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-white/30 border border-dashed border-white/10 rounded-3xl bg-slate-950/90 min-h-[300px]">
          <Radio className="h-10 w-10 animate-pulse mb-3 text-indigo-400/70" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Operational Deck Idle</h3>
          <p className="text-xs text-white/40 mt-1 max-w-[340px] leading-relaxed">
            No active rides found. New backend trips will appear here as soon as they are available.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTrips.map((trip) => {
            const isAssigned = !!trip.driverId;
            const tripNum = formatTripId(trip.id);
            
            return (
              <div 
                key={trip.id}
                className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/10 hover:border-indigo-500/30 p-5 flex flex-col gap-4 shadow-lg hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] transition-all duration-300 hover:-translate-y-0.5"
              >
                
                {/* Trip Card Header */}
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div className="min-w-0">
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Trip ID</span>
                    <h4 className="text-xs font-black text-white truncate">#{tripNum || trip.id}</h4>
                  </div>
                  <span className={`text-[9px] px-2.5 py-0.5 rounded-lg font-black uppercase border tracking-wider ${getStatusBadgeClass(trip.status)}`}>
                    {trip.status === "driver_arrived" ? "ARRIVED" : trip.status}
                  </span>
                </div>

                {/* Coordinate Details */}
                <div className="space-y-3 text-xs flex-1">
                  <div className="flex gap-2.5">
                    <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                      <div className="h-4 w-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 grid place-items-center">
                        <MapPin className="h-2.5 w-2.5 text-emerald-400" />
                      </div>
                      <div className="w-0.5 h-6 bg-dashed border-l border-white/10" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] text-white/40 font-semibold uppercase">Pickup Origin</span>
                      <p className="text-white/80 font-medium truncate mt-0.5">
                        {trip.pickup ? `${trip.pickup[0].toFixed(5)}, ${trip.pickup[1].toFixed(5)}` : "Unavailable"}
                      </p>
                    </div>
                  </div>

                  {trip.stops && trip.stops.length > 0 && trip.stops.map((stop, index) => (
                    <div key={`stop-${stop.id || index}`} className="flex gap-2.5">
                      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                        <div className="h-4 w-4 rounded-full bg-amber-500/10 border border-amber-500/30 grid place-items-center">
                          <MapPin className="h-2.5 w-2.5 text-amber-400" />
                        </div>
                        <div className="w-0.5 h-6 bg-dashed border-l border-white/10" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] text-white/40 font-semibold uppercase">Stop {stop.order || index + 1}</span>
                        <p className="text-white/80 font-medium truncate mt-0.5" title={stop.address}>
                          {stop.address || `${stop.lat.toFixed(5)}, ${stop.lng.toFixed(5)}`}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2.5">
                    <div className="flex flex-col items-center shrink-0 pt-0.5">
                      <div className="h-4 w-4 rounded-full bg-rose-500/10 border border-rose-500/30 grid place-items-center">
                        <MapPin className="h-2.5 w-2.5 text-rose-400" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] text-white/40 font-semibold uppercase">Destination</span>
                      <p className="text-white/80 font-medium truncate mt-0.5">
                        {trip.destination ? `${trip.destination[0].toFixed(5)}, ${trip.destination[1].toFixed(5)}` : "Unavailable"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Driver Info Area */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-xs">
                  {isAssigned ? (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="h-7.5 w-7.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 grid place-items-center text-xs">
                          <UserRound className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div>
                          <span className="text-[9px] text-white/30 font-semibold uppercase block">Assigned Driver</span>
                          <span className="text-white font-bold text-[11px] block leading-tight">
                            {trip.driver?.name || trip.driverId}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded font-bold border border-indigo-500/20 uppercase">
                        ACTIVE
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-white/40 py-1">
                      <ShieldAlert className="h-4 w-4 text-yellow-400 animate-pulse shrink-0" />
                      <div>
                        <span className="text-[10px] text-yellow-400 font-bold uppercase block leading-none">Unassigned</span>
                        <span className="text-[9px] text-white/30 mt-0.5 block leading-none">Awaiting vehicle dispatch</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Track CTA Action Button */}
                <button
                  onClick={() => navigate(`/live-tracking?tripId=${trip.id}`)}
                  className="w-full text-center py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-bold text-xs transition-all shadow-[0_4px_12px_rgba(99,102,241,0.2)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.35)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Navigation className="h-3.5 w-3.5 fill-current" />
                  Live Track Route
                </button>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

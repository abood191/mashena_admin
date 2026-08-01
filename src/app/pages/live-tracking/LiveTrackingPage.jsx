import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useRealtimeTracking } from "../../hooks/realtime/useRealtimeTracking";
import { useTripTracking } from "../../hooks/realtime/useTripTracking";
import { useActiveTrips, useTrip } from "../../hooks/api/useActiveTrips";
import TrackingMap from "./components/TrackingMap";
import { AlertTriangle, CarFront, MapPin, Navigation, Radio } from "lucide-react";

export default function LiveTrackingPage() {
  const { isConnected, activeDriverIds } = useRealtimeTracking();
  const { data: activeTrips = [], isLoading, error } = useActiveTrips();
  
  const [mapStyle, setMapStyle] = useState("google"); // Google Road default
  
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTripIdRaw = searchParams.get("tripId");
  const selectedTripId = selectedTripIdRaw != null ? Number(selectedTripIdRaw) : null;
  
  const { snapshot } = useTripTracking(selectedTripId);
  const { data: selectedTripDetails } = useTrip(selectedTripId);

  const handleSelectTrip = (id) => {
    if (id) {
      setSearchParams({ tripId: id }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const MAP_STYLES = [
    { id: "google", label: "Google Road" },
    { id: "satellite", label: "Google Sat" },
    { id: "dark", label: "Carto Dark" },
    { id: "light", label: "Carto Light" },
  ];

  // Operations Analytics Tally
  const pendingCount = activeTrips.filter((t) => t.status === "pending").length;
  const activeCount = activeTrips.filter((t) => t.status !== "pending").length;
  const selectedTrip = snapshot || selectedTripDetails || activeTrips.find((trip) => trip.id === selectedTripId);
  const mapTrips = selectedTrip
    ? activeTrips.map((trip) => (trip.id === selectedTrip.id ? { ...trip, ...selectedTrip } : trip))
    : activeTrips;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-112px)] w-full gap-5 p-1 animate-in fade-in duration-300">
      
      {/* 1. Main Map Visual Area */}
      <div className="flex-1 flex flex-col h-full gap-4 min-w-0">
        
        {/* Operations Dashboard Top Stats Bar */}
       <div className="bg-surface/80 backdrop-blur-md px-5 py-4 rounded-3xl border border-border-subtle flex flex-wrap items-center justify-between gap-4 shadow-md">
          
          {/* Logo & Headline */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 grid place-items-center text-lg shadow-inner">
              <CarFront className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-wide uppercase">
                Mashena Operations
              </h1>
              <p className="text-[10px] text-foreground/40">
                Real-time ride dispatch tracking deck
              </p>
            </div>
          </div>

          {/* Core Analytics Badges Grid */}
          <div className="flex items-center gap-3">
            {/* Live Drivers Badge */}
            <div className="bg-foreground/5 border border-border-subtle rounded-2xl px-3 py-1.5 flex flex-col items-center min-w-[70px]">
              <span className="text-[9px] text-foreground/40 font-semibold uppercase">Drivers</span>
              <span className="text-xs font-black text-indigo-400 mt-0.5">{activeDriverIds.length}</span>
            </div>

            {/* Unassigned Trips Badge */}
            <div className={`border rounded-2xl px-3 py-1.5 flex flex-col items-center min-w-[70px] transition-colors ${pendingCount > 0 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-foreground/5 border-border-subtle'}`}>
              <span className="text-[9px] text-foreground/40 font-semibold uppercase">Pending</span>
              <span className={`text-xs font-black mt-0.5 ${pendingCount > 0 ? 'text-yellow-400' : 'text-foreground'}`}>{pendingCount}</span>
            </div>

            {/* Active Transits Badge */}
            <div className={`border rounded-2xl px-3 py-1.5 flex flex-col items-center min-w-[70px] transition-colors ${activeCount > 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-foreground/5 border-border-subtle'}`}>
              <span className="text-[9px] text-foreground/40 font-semibold uppercase">Transit</span>
              <span className={`text-xs font-black mt-0.5 ${activeCount > 0 ? 'text-emerald-400' : 'text-foreground'}`}>{activeCount}</span>
            </div>
          </div>

          {/* Map Selector & Socket Status */}
          <div className="flex items-center gap-3.5">
            {/* Map Style Selector */}
            <div className="bg-black/40 border border-border-subtle p-1 rounded-xl flex gap-0.5 text-[9px] font-bold">
              {MAP_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setMapStyle(style.id)}
                  className={[
                    "px-2.5 py-1.5 rounded-lg transition-all",
                    mapStyle === style.id
                      ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                      : "text-foreground/50 border border-transparent hover:text-foreground",
                  ].join(" ")}
                >
                  {style.label}
                </button>
              ))}
            </div>

            {/* Connection Status Flag */}
            <div
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold shadow-inner",
                isConnected
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400",
              ].join(" ")}
            >
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-500 animate-ping",
                ].join(" ")}
              />
              {isConnected ? "CONNECTED" : "DISCONNECT"}
            </div>
          </div>

        </div>

        {/* Dynamic Map Area */}
        <div className="flex-10 min-h-[500px]">
          <TrackingMap
            activeDriverIds={activeDriverIds}
            mapStyle={mapStyle}
            activeTrips={mapTrips}
            selectedTripId={selectedTripId}
            onSelectTrip={handleSelectTrip}
          />
        </div>
      </div>

      {/* 2. Real-time Operations Sidebar Panel */}
      <div className="w-full lg:w-[320px] h-full flex flex-col shrink-0 min-w-0">
        <TripOperationsPanel
          activeTrips={activeTrips}
          selectedTrip={selectedTrip}
          selectedTripId={selectedTripId}
          onSelectTrip={handleSelectTrip}
          isLoading={isLoading}
          error={error}
          activeDriverIds={activeDriverIds}
        />
      </div>

    </div>
  );
}

function getStatusBadgeClass(status) {
  switch (status) {
    case "pending":
      return "bg-yellow-500/10 border-yellow-500/20 text-yellow-400";
    case "accepted":
      return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    case "driver_arrived":
      return "bg-cyan-500/10 border-cyan-500/20 text-cyan-400";
    case "started":
    case "in_progress":
      return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    default:
      return "bg-indigo-500/10 border-indigo-500/20 text-indigo-400";
  }
}

function formatTripId(tripId) {
  if (tripId == null) return "Unknown";
  const strId = String(tripId);
  return strId.length > 10 ? `#${strId.slice(-8)}` : `#${strId}`;
}

function TripOperationsPanel({
  activeTrips,
  selectedTrip,
  selectedTripId,
  onSelectTrip,
  isLoading,
  error,
  activeDriverIds,
}) {
  return (
    <div className="flex flex-col h-full gap-4 text-foreground">
      <div className="bg-surface/80 backdrop-blur-md p-4 rounded-3xl border border-border-subtle shadow-lg">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Tracking Room
        </h3>

        {selectedTrip ? (
          <div className="mt-3 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[9px] text-foreground/30 font-bold uppercase block">
                  Selected Trip
                </span>
                <h4 className="text-sm font-black text-indigo-400 truncate">
                  {formatTripId(selectedTrip.id)}
                </h4>
              </div>
              <span className={`text-[8px] px-2 py-0.5 rounded font-black border tracking-wider uppercase ${getStatusBadgeClass(selectedTrip.status)}`}>
                {selectedTrip.status === "driver_arrived" ? "ARRIVED" : selectedTrip.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-foreground/5 border border-border-subtle rounded-2xl p-3">
                <span className="text-[9px] text-foreground/30 font-bold uppercase block">Driver</span>
                <span className="text-xs font-black text-foreground mt-1 block truncate">
                  {selectedTrip.driver?.name || selectedTrip.driverId || "Unassigned"}
                </span>
              </div>
              <div className="bg-foreground/5 border border-border-subtle rounded-2xl p-3">
                <span className="text-[9px] text-foreground/30 font-bold uppercase block">Telemetry</span>
                <span className="text-xs font-black text-emerald-400 mt-1 block">
                  {activeDriverIds.length ? "LIVE" : "WAITING"}
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectTrip(null)}
              className="w-full py-2 rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-border-subtle text-foreground/70 font-bold text-xs transition-colors cursor-pointer"
            >
              Leave Tracking Room
            </button>
          </div>
        ) : (
          <div className="mt-3 flex flex-col items-center justify-center p-6 text-center text-foreground/30 border border-dashed border-border-subtle rounded-2xl min-h-[130px]">
            <Radio className="h-7 w-7 animate-pulse text-indigo-400/60" />
            <p className="text-xs mt-2 font-medium">Select a trip to join its room.</p>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 bg-surface/80 backdrop-blur-md p-4 rounded-3xl border border-border-subtle shadow-lg flex flex-col">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
          Active Trips ({activeTrips.length})
        </h3>

        {isLoading ? (
          <div className="flex-1 grid place-items-center text-xs text-foreground/40">Loading trips...</div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-red-300 p-4">
            <AlertTriangle className="h-7 w-7 mb-2" />
            <p className="text-xs">{error.message || "Could not load trips."}</p>
          </div>
        ) : activeTrips.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-foreground/30 border border-dashed border-border-subtle rounded-2xl min-h-[100px]">
            <Radio className="h-7 w-7 animate-pulse text-indigo-400/60" />
            <p className="text-xs mt-2 font-medium">No active trips.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {activeTrips.map((trip) => {
              const isSelected = selectedTripId === trip.id;

              return (
                <button
                  key={trip.id}
                  onClick={() => onSelectTrip(trip.id)}
                  className={[
                    "w-full border rounded-2xl p-3 text-left cursor-pointer transition-all",
                    isSelected
                      ? "bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                      : "bg-foreground/5 border-border-subtle hover:border-border-subtle",
                  ].join(" ")}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-foreground truncate">{formatTripId(trip.id)}</h4>
                      <p className="text-[9px] text-foreground/40 truncate mt-0.5">
                        {trip.driverId ? "Driver assigned" : "Awaiting driver"}
                      </p>
                    </div>
                    <span className={`text-[8px] px-2 py-0.5 rounded font-bold uppercase border shrink-0 ${getStatusBadgeClass(trip.status)}`}>
                      {trip.status === "driver_arrived" ? "ARRIVED" : trip.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] border-t border-border-subtle pt-2 mt-3 text-foreground/40">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-emerald-400" />
                      {trip.pickup ? `${trip.pickup[0].toFixed(4)}, ${trip.pickup[1].toFixed(4)}` : "Pickup unavailable"}
                    </span>
                    <Navigation className="h-3.5 w-3.5 text-indigo-400" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

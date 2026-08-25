import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useRealtimeTracking } from "../../hooks/realtime/useRealtimeTracking";
import { useTripTracking } from "../../hooks/realtime/useTripTracking";
import { useActiveTrips, useTrip } from "../../hooks/api/useActiveTrips";
import TrackingMap from "./components/TrackingMap";
import { tripsService } from "../../services/trips.service";
import { AlertTriangle, CarFront, MapPin, Navigation, Radio, XCircle, RefreshCw } from "lucide-react";

export default function LiveTrackingPage() {
  const { t } = useTranslation();
  const { isConnected, activeDriverIds } = useRealtimeTracking();
  const { data: activeTrips = [], isLoading, error, refetch: refetchTrips, isFetching: isFetchingTrips } = useActiveTrips();
  
  const [mapStyle, setMapStyle] = useState("google");
  
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
    { id: "google",    label: t("liveTracking.mapStyles.googleRoad") },
    { id: "satellite", label: t("liveTracking.mapStyles.googleSat") },
    { id: "dark",      label: t("liveTracking.mapStyles.cartoDark") },
    { id: "light",     label: t("liveTracking.mapStyles.cartoLight") },
  ];

  // Operations Analytics Tally
  const pendingCount = activeTrips.filter((t) => t.status === "pending").length;
  const activeCount  = activeTrips.filter((t) => t.status !== "pending").length;
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
                {t("liveTracking.title")}
              </h1>
              <p className="text-[10px] text-foreground/40">
                {t("liveTracking.subtitle")}
              </p>
            </div>
          </div>

          {/* Core Analytics Badges Grid */}
          <div className="flex items-center gap-3">
            {/* Live Drivers Badge */}
            <div className="bg-foreground/5 border border-border-subtle rounded-2xl px-3 py-1.5 flex flex-col items-center min-w-[70px]">
              <span className="text-[9px] text-foreground/40 font-semibold uppercase">{t("liveTracking.drivers")}</span>
              <span className="text-xs font-black text-indigo-400 mt-0.5">{activeDriverIds.length}</span>
            </div>

            {/* Unassigned Trips Badge */}
            <div className={`border rounded-2xl px-3 py-1.5 flex flex-col items-center min-w-[70px] transition-colors ${pendingCount > 0 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-foreground/5 border-border-subtle'}`}>
              <span className="text-[9px] text-foreground/40 font-semibold uppercase">{t("liveTracking.pending")}</span>
              <span className={`text-xs font-black mt-0.5 ${pendingCount > 0 ? 'text-yellow-400' : 'text-foreground'}`}>{pendingCount}</span>
            </div>

            {/* Active Transits Badge */}
            <div className={`border rounded-2xl px-3 py-1.5 flex flex-col items-center min-w-[70px] transition-colors ${activeCount > 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-foreground/5 border-border-subtle'}`}>
              <span className="text-[9px] text-foreground/40 font-semibold uppercase">{t("liveTracking.transit")}</span>
              <span className={`text-xs font-black mt-0.5 ${activeCount > 0 ? 'text-emerald-400' : 'text-foreground'}`}>{activeCount}</span>
            </div>
          </div>

          {/* Map Selector & Socket Status */}
          <div className="flex items-center gap-3.5">
            <button 
              onClick={() => refetchTrips()}
              disabled={isFetchingTrips}
              className="p-1.5 bg-foreground/5 border border-border-subtle rounded-xl hover:bg-foreground/10 transition-colors disabled:opacity-50"
              title={t("common.refresh", "Refresh")}
            >
              <RefreshCw className={`w-4 h-4 text-indigo-400 ${isFetchingTrips ? 'animate-spin' : ''}`} />
            </button>
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
              {isConnected ? t("liveTracking.connected") : t("liveTracking.disconnected")}
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
  const { t } = useTranslation();
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const handleCancelTrip = async () => {
    if (!cancelConfirm) {
      setCancelConfirm(true);
      setCancelError(null);
      return;
    }
    try {
      setIsCancelling(true);
      await tripsService.cancelTrip(selectedTripId);
      setCancelConfirm(false);
      onSelectTrip(null);
    } catch (err) {
      setCancelError(err?.message || t("liveTracking.cancelFailed"));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelAbort = () => {
    setCancelConfirm(false);
    setCancelError(null);
  };

  return (
    <div className="flex flex-col h-full gap-4 text-foreground">
      <div className="bg-surface/80 backdrop-blur-md p-4 rounded-3xl border border-border-subtle shadow-lg">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
          {t("liveTracking.trackingRoom")}
        </h3>

        {selectedTrip ? (
          <div className="mt-3 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[9px] text-foreground/30 font-bold uppercase block">
                  {t("liveTracking.selectedTrip")}
                </span>
                <h4 className="text-sm font-black text-indigo-400 truncate">
                  {formatTripId(selectedTrip.id)}
                </h4>
              </div>
              <span className={`text-[8px] px-2 py-0.5 rounded font-black border tracking-wider uppercase ${getStatusBadgeClass(selectedTrip.status)}`}>
                {selectedTrip.status === "driver_arrived" ? t("liveTracking.statusArrived") : selectedTrip.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-foreground/5 border border-border-subtle rounded-2xl p-3">
                <span className="text-[9px] text-foreground/30 font-bold uppercase block">{t("liveTracking.driver")}</span>
                <span className="text-xs font-black text-foreground mt-1 block truncate">
                  {selectedTrip.driver?.name || selectedTrip.driverId || "Unassigned"}
                </span>
              </div>
              <div className="bg-foreground/5 border border-border-subtle rounded-2xl p-3">
                <span className="text-[9px] text-foreground/30 font-bold uppercase block">{t("liveTracking.telemetry")}</span>
                <span className="text-xs font-black text-emerald-400 mt-1 block">
                  {activeDriverIds.length ? t("liveTracking.telemetryLive") : t("liveTracking.telemetryWaiting")}
                </span>
              </div>
            </div>

            {/* Cancel Trip Button */}
            {cancelError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl px-3 py-2 text-red-400 text-[10px] font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {cancelError}
              </div>
            )}

            {cancelConfirm ? (
              <div className="space-y-2">
                <p className="text-[10px] text-red-400 font-bold text-center uppercase tracking-wider">
                  {t("liveTracking.confirmCancel")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn-cancel-trip-abort"
                    onClick={handleCancelAbort}
                    disabled={isCancelling}
                    className="py-2 rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-border-subtle text-foreground/60 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {t("liveTracking.noKeep")}
                  </button>
                  <button
                    id="btn-cancel-trip-confirm"
                    onClick={handleCancelTrip}
                    disabled={isCancelling}
                    className="py-2 rounded-2xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isCancelling ? (
                      <span className="h-3 w-3 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    {isCancelling ? t("liveTracking.cancelling") : t("liveTracking.yesCancel")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="btn-cancel-trip"
                onClick={handleCancelTrip}
                className="w-full py-2 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <XCircle className="h-3.5 w-3.5" />
                {t("liveTracking.cancelTrip")}
              </button>
            )}

            <button
              onClick={() => { onSelectTrip(null); setCancelConfirm(false); setCancelError(null); }}
              className="w-full py-2 rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-border-subtle text-foreground/70 font-bold text-xs transition-colors cursor-pointer"
            >
              {t("liveTracking.leaveRoom")}
            </button>
          </div>
        ) : (
          <div className="mt-3 flex flex-col items-center justify-center p-6 text-center text-foreground/30 border border-dashed border-border-subtle rounded-2xl min-h-[130px]">
            <Radio className="h-7 w-7 animate-pulse text-indigo-400/60" />
            <p className="text-xs mt-2 font-medium">{t("liveTracking.selectTripHint")}</p>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 bg-surface/80 backdrop-blur-md p-4 rounded-3xl border border-border-subtle shadow-lg flex flex-col">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
          {t("liveTracking.activeTrips")} ({activeTrips.length})
        </h3>

        {isLoading ? (
          <div className="flex-1 grid place-items-center text-xs text-foreground/40">{t("liveTracking.loadingTrips")}</div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-red-300 p-4">
            <AlertTriangle className="h-7 w-7 mb-2" />
            <p className="text-xs">{error.message || "Could not load trips."}</p>
          </div>
        ) : activeTrips.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-foreground/30 border border-dashed border-border-subtle rounded-2xl min-h-[100px]">
            <Radio className="h-7 w-7 animate-pulse text-indigo-400/60" />
            <p className="text-xs mt-2 font-medium">{t("liveTracking.noActiveTrips")}</p>
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
                        {trip.driverId ? t("liveTracking.driverAssigned") : t("liveTracking.awaitingDriver")}
                      </p>
                    </div>
                    <span className={`text-[8px] px-2 py-0.5 rounded font-bold uppercase border shrink-0 ${getStatusBadgeClass(trip.status)}`}>
                      {trip.status === "driver_arrived" ? t("liveTracking.statusArrived") : trip.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] border-t border-border-subtle pt-2 mt-3 text-foreground/40">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-emerald-400" />
                      {trip.pickup ? `${trip.pickup[0].toFixed(4)}, ${trip.pickup[1].toFixed(4)}` : t("liveTracking.pickupUnavailable")}
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

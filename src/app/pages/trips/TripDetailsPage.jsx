import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTrip } from "../../hooks/api/useActiveTrips";
import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  ChevronLeft, Loader2, AlertTriangle, User, Car, Clock, MapPin, 
  DollarSign, CheckCircle2, Navigation, Route as RouteIcon, RefreshCw
} from "lucide-react";

// Pin Icons
const createIcon = (html) => L.divIcon({
  html,
  className: "custom-leaflet-icon",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const PICKUP_ICON = createIcon(`
  <div class="relative w-7 h-7 flex items-center justify-center">
    <div class="w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2.5 h-2.5 text-slate-950 font-bold">
        <path fill-rule="evenodd" d="M10 2a6 6 0 00-6 6c0 4.906 5.437 9.479 5.672 9.675a.5.5 0 00.656 0C10.563 17.479 16 12.906 16 8a6 6 0 00-6-6zm0 8a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
      </svg>
    </div>
  </div>
`);

const DEST_ICON = createIcon(`
  <div class="relative w-7 h-7 flex items-center justify-center">
    <div class="w-5 h-5 rounded-full bg-rose-500 border-2 border-slate-950 flex items-center justify-center shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2.5 h-2.5 text-white">
        <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm10 2.5a.5.5 0 00-.5-.5h-5a.5.5 0 000 1h5a.5.5 0 00.5-.5z" clip-rule="evenodd" />
      </svg>
    </div>
  </div>
`);

export default function TripDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: trip, isLoading, error, refetch, isFetching } = useTrip(id);
  const [mapStyle, setMapStyle] = useState("google");

  const TILE_LAYERS = {
    light: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    google: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    satellite: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-foreground/40">
        <Loader2 className="h-8 w-8 animate-spin text-[#4880FF] mb-4" />
        <span className="text-xs uppercase tracking-widest font-semibold">{t("tripDetails.loading", "Loading trip details...")}</span>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center text-red-500">
        <AlertTriangle className="h-12 w-12 mb-4 opacity-80" />
        <h3 className="text-lg font-bold uppercase tracking-wide">{t("tripDetails.notFound", "Trip Not Found")}</h3>
        <p className="text-sm opacity-70 mt-2">
          {error?.message || t("tripDetails.notFoundDesc", "The trip you are looking for does not exist.")}
        </p>
        <button onClick={() => navigate("/trip-history")} className="mt-6 px-6 py-2 bg-foreground/5 hover:bg-foreground/10 text-foreground font-bold rounded-xl transition-all">
          {t("tripDetails.goBack", "Go Back")}
        </button>
      </div>
    );
  }

  const mapCenter = trip.pickup ? trip.pickup : [33.510, 36.282]; // Default Damascus

  // Helper for timeline
  const formatTime = (isoString) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleString();
  };

  return (
    <div className="p-2 md:p-6 space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate("/trip-history")}
          className="p-2.5 rounded-xl bg-surface border border-border-subtle hover:bg-foreground/5 text-foreground transition-all shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{t("sidebar.trips")} #{trip.id || trip.tripId}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border border-foreground/10 bg-foreground/5 text-foreground/70">
              {trip.status?.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-foreground/50 font-medium">
              {formatTime(trip.createdAt)}
            </span>
          </div>
        </div>
        <div className="ml-auto">
          <button 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="p-2 bg-surface border border-border-subtle rounded-xl hover:bg-foreground/5 transition-colors disabled:opacity-50 flex items-center gap-2 text-xs font-bold shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 text-[#4880FF] ${isFetching ? 'animate-spin' : ''}`} />
            {t("common.refresh", "Refresh")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Timeline */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Timeline Card */}
          <div className="bg-surface rounded-3xl border border-border-subtle p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="text-[#4880FF]" size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">{t("tripDetails.timeline", "Trip Timeline")}</h3>
            </div>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border-subtle before:to-transparent">
              
              <TimelineItem label={t("tripDetails.events.matched", "Matched")} time={trip.matchedAt} active={!!trip.matchedAt} t={t} />
              <TimelineItem label={t("tripDetails.events.accepted", "Accepted")} time={trip.acceptedAt} active={!!trip.acceptedAt} t={t} />
              <TimelineItem label={t("tripDetails.events.started", "Started")} time={trip.startedAt} active={!!trip.startedAt} t={t} />
              <TimelineItem 
                label={trip.status === "canceled" ? t("tripDetails.events.canceled", "Canceled") : t("tripDetails.events.completed", "Completed")} 
                time={trip.status === "canceled" ? trip.canceledAt : trip.completedAt} 
                active={!!trip.completedAt || !!trip.canceledAt} 
                isLast
                isError={trip.status === "canceled"}
              />

            </div>
          </div>

          {/* Details Cards */}
          <InfoCard title={t("tripDetails.rider", "Rider")} icon={User} color="emerald">
            <InfoRow label={t("tripDetails.details.name", "Name")} value={trip.riderFullName || trip.rider?.name || "-"} />
            <InfoRow label={t("tripDetails.details.phone", "Phone")} value={trip.riderPhoneNumber || trip.rider?.phone || "-"} />
            <InfoRow label={t("tripDetails.details.email", "Email")} value={trip.riderEmail || "-"} />
          </InfoCard>

          <InfoCard title={t("tripDetails.driver", "Driver")} icon={User} color="indigo">
            <InfoRow label={t("tripDetails.details.name", "Name")} value={trip.driverFullName || trip.driver?.name || "-"} />
            <InfoRow label={t("tripDetails.details.phone", "Phone")} value={trip.driverPhoneNumber || trip.driver?.phone || "-"} />
            <InfoRow label={t("tripDetails.details.vehicle", "Vehicle")} value={`${trip.vehicleColor || ''} ${trip.vehicleModel || ''}`} />
            <InfoRow label={t("tripDetails.details.plate", "Plate")} value={trip.plateNumber || "-"} />
          </InfoCard>

          <InfoCard title={t("tripDetails.fareAndMetrics", "Fare & Metrics")} icon={DollarSign} color="amber">
            <InfoRow label={t("tripDetails.details.totalFare", "Total Fare")} value={trip.fareTotal ? `${trip.fareTotal}` : "-"} />
            <InfoRow label={t("tripDetails.details.estDistance", "Est. Distance")} value={trip.distanceKm ? `${trip.distanceKm.toFixed(2)} km` : "-"} />
            <InfoRow label={t("tripDetails.details.estDuration", "Est. Duration")} value={trip.durationSec ? `${Math.floor(trip.durationSec / 60)} min` : "-"} />
          </InfoCard>

        </div>

        {/* Right Column: Map */}
        <div className="lg:col-span-2 bg-surface rounded-3xl border border-border-subtle overflow-hidden shadow-sm flex flex-col h-[600px] lg:h-auto min-h-[600px]">
          <div className="p-4 border-b border-border-subtle bg-foreground/[0.02] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="text-[#4880FF]" size={18} />
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">{t("tripDetails.routeMap", "Route Map")}</h3>
              </div>
              
              <select
                value={mapStyle}
                onChange={(e) => setMapStyle(e.target.value)}
                className="bg-surface border border-border-subtle text-foreground text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/40 cursor-pointer"
              >
                <option value="google">{t("tripDetails.mapStyles.googleRoad", "Google Road")}</option>
                <option value="satellite">{t("tripDetails.mapStyles.satellite", "Satellite")}</option>
                <option value="light">{t("tripDetails.mapStyles.cartoLight", "Carto Light")}</option>
              </select>
            </div>
            
            <div className="flex gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-1 bg-[#4880FF] rounded-full"></div>
                <span className="text-foreground/70">{t("tripDetails.expectedRoute", "Expected Route")}</span>
              </div>
              {trip.actualRoute && trip.actualRoute.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-1 bg-emerald-500 rounded-full border-b-2 border-dashed border-emerald-500 bg-transparent"></div>
                  <span className="text-foreground/70">{t("tripDetails.actualRoute", "Actual Route")}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 w-full relative z-0">
            <MapContainer 
              center={mapCenter} 
              zoom={13} 
              className="w-full h-full absolute inset-0 z-0"
              zoomControl={false}
            >
              <TileLayer
                url={TILE_LAYERS[mapStyle] || TILE_LAYERS.google}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Expected Route */}
              {trip.route && trip.route.length > 0 && (
                <Polyline 
                  positions={trip.route} 
                  color="#4880FF" 
                  weight={5} 
                  opacity={0.7} 
                  lineJoin="round"
                />
              )}

              {/* Actual Route */}
              {trip.actualRoute && trip.actualRoute.length > 0 && (
                <Polyline 
                  positions={trip.actualRoute} 
                  color="#10b981" 
                  weight={5} 
                  opacity={0.9} 
                  dashArray="10, 10"
                  lineJoin="round"
                />
              )}

              {/* Markers */}
              {trip.pickup && (
                <Marker position={trip.pickup} icon={PICKUP_ICON} />
              )}
              {trip.destination && (
                <Marker position={trip.destination} icon={DEST_ICON} />
              )}
              
            </MapContainer>
          </div>
          
          <div className="p-4 border-t border-border-subtle bg-foreground/[0.02]">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
               <div className="flex gap-3 items-start min-w-0">
                 <div className="mt-0.5 shrink-0"><MapPin size={18} className="text-emerald-500" /></div>
                 <div className="min-w-0 flex-1">
                   <p className="text-[10px] uppercase font-bold text-foreground/40">{t("tripDetails.pickup", "Pickup")}</p>
                   <p className="text-xs font-medium text-foreground break-words">{trip.pickupAddress || (trip.pickup ? `${trip.pickup[0].toFixed(5)}, ${trip.pickup[1].toFixed(5)}` : "-")}</p>
                 </div>
               </div>
               <div className="flex gap-3 items-start min-w-0">
                 <div className="mt-0.5 shrink-0"><MapPin size={18} className="text-rose-500" /></div>
                 <div className="min-w-0 flex-1">
                   <p className="text-[10px] uppercase font-bold text-foreground/40">{t("tripDetails.destination", "Destination")}</p>
                   <p className="text-xs font-medium text-foreground break-words">{trip.destinationAddress || (trip.destination ? `${trip.destination[0].toFixed(5)}, ${trip.destination[1].toFixed(5)}` : "-")}</p>
                 </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// UI Helpers

function TimelineItem({ label, time, active, isLast, isError, t }) {
  const dotColor = active ? (isError ? "bg-red-500 ring-red-500/20" : "bg-[#4880FF] ring-[#4880FF]/20") : "bg-border-subtle ring-transparent";
  
  return (
    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
      <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 border-surface ${dotColor} ring-4 z-10 md:mx-auto shadow-sm transition-colors`}>
        {active && <CheckCircle2 size={12} className="text-white" />}
      </div>
      <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] bg-foreground/[0.02] border border-border-subtle p-3 rounded-2xl group-hover:bg-foreground/[0.04] transition-colors">
        <h4 className={`text-xs font-bold uppercase tracking-wider ${active ? (isError ? "text-red-500" : "text-foreground") : "text-foreground/40"}`}>
          {label}
        </h4>
        <p className="text-xs text-foreground/60 mt-1 font-medium">{time ? new Date(time).toLocaleString() : t ? t("tripDetails.pending", "Pending...") : "Pending..."}</p>
      </div>
    </div>
  );
}

function InfoCard({ title, icon: Icon, color, children }) {
  const colorMap = {
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    indigo: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  };

  return (
    <div className="bg-surface rounded-3xl border border-border-subtle p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl border ${colorMap[color]}`}>
          <Icon size={16} />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">{title}</h3>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-border-subtle/50 last:border-0">
      <span className="text-xs font-semibold text-foreground/50">{label}</span>
      <span className="text-xs font-bold text-foreground text-right">{value}</span>
    </div>
  );
}

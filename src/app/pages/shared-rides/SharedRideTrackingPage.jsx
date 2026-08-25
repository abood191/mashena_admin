import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSharedRideTracking } from "../../hooks/api/useSharedRides";
import { useSharedRideSocket } from "../../hooks/realtime/useSharedRideSocket";
import SharedRideMap from "./components/SharedRideMap";
import { Loader2, ArrowLeft, Car, RefreshCw } from "lucide-react";

export default function SharedRideTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch initial snapshot
  const { data: snapshot, isLoading, refetch, isFetching } = useSharedRideTracking(id);
  
  // Debug log for user to inspect API response
  console.log("== SHARED RIDE SNAPSHOT ==", snapshot);
  
  // Connect WebSocket for live updates
  useSharedRideSocket(id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-[#4880FF]" />
        <p className="text-foreground/60">Loading live tracking data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border-subtle bg-surface shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-foreground/5 text-foreground transition-colors border border-border-subtle"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-indigo-500">Shared Ride #{id}</h1>
          <p className="text-xs text-foreground/60">{snapshot?.origin?.address} ➔ {snapshot?.destination?.address}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="p-1.5 mr-2 bg-foreground/5 rounded-lg hover:bg-foreground/10 transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 text-indigo-500 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          {snapshot?.status === "READY" && <span className="px-3 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold">READY</span>}
          {snapshot?.status === "IN_PROGRESS" && <span className="px-3 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">IN_PROGRESS</span>}
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-2 border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            LIVE
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 bg-foreground/5 relative flex items-center justify-center">
          <SharedRideMap snapshot={snapshot} />
        </div>

        {/* Sidebar Info */}
        <div className="w-[350px] bg-surface border-l border-border-subtle flex flex-col shrink-0">
          <div className="p-4 border-b border-border-subtle">
            <h2 className="font-semibold mb-3 text-indigo-500">Driver & Vehicle</h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-foreground/60">Driver Name</span>
                <span className="font-medium">{snapshot?.driver?.fullName || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Phone</span>
                <span className="font-medium">{snapshot?.driver?.phoneNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Vehicle</span>
                <span className="font-medium">{snapshot?.vehicle?.model} - {snapshot?.vehicle?.color}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Plate</span>
                <span className="font-medium px-2 bg-foreground/10 rounded">{snapshot?.vehicle?.plateNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border-subtle">
                <span className="text-foreground/60">Departure Time</span>
                <span className="font-medium text-xs">
                  {snapshot?.departureTime ? new Date(snapshot.departureTime).toLocaleString() : "N/A"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Passengers</h2>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                {snapshot?.occupiedSeats || 0} / {snapshot?.maxPassengers || 0} Seats
              </span>
            </div>
            
            <div className="space-y-3">
              {snapshot?.passengers?.map((p, i) => (
                <div key={p.id || i} className="p-3 rounded-xl border border-border-subtle bg-foreground/5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm">{p.riderName || p.user?.fullName || `Passenger #${i+1}`}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700">{p.status}</span>
                  </div>
                  <div className="text-xs text-foreground/60">Seats: {p.seatsNeeded || 1}</div>
                </div>
              ))}
              {!snapshot?.passengers?.length && (
                <p className="text-sm text-foreground/50 text-center py-4">No passengers yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

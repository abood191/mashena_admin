import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePassengerPoolTracking } from "../../hooks/api/usePassengerPools";
import { usePoolSocket } from "../../hooks/realtime/usePoolSocket";
import PoolMap from "./components/PoolMap";
import { Loader2, ArrowLeft, Users, RefreshCw } from "lucide-react";

export default function PassengerPoolTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch initial snapshot
  const { data: snapshot, isLoading, refetch, isFetching } = usePassengerPoolTracking(id);
  
  // Debug log for user to inspect API response
  console.log("== POOL SNAPSHOT ==", snapshot);
  
  // Connect WebSocket for live updates. Pass sharedRideId to track driver if matched.
  usePoolSocket(id, snapshot?.sharedRideId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-purple-500" />
        <p className="text-foreground/60">Loading pool data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border border-border-subtle hover:bg-foreground/5 text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-500" />
            Pool Room #{id}
          </h1>
          <p className="text-sm text-foreground/60">{snapshot?.meetingPoint?.placeName || "Meeting Point"} ➔ {snapshot?.destination?.address || "Destination"}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="p-1.5 mr-2 bg-foreground/5 rounded-lg hover:bg-foreground/10 transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 text-purple-500 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-2 border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            ACTIVE LISTENER
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 border-b border-border-subtle pb-2">Room Details</h2>
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-foreground/60 block mb-1">Status</span>
              <span className="font-medium px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">{snapshot?.status || "OPEN"}</span>
            </div>
            <div>
              <span className="text-foreground/60 block mb-1">Meeting Address</span>
              <span className="font-medium">{snapshot?.meetingPoint?.address || "N/A"}</span>
            </div>
            <div>
              <span className="text-foreground/60 block mb-1">Destination</span>
              <span className="font-medium">{snapshot?.destination?.address || "N/A"}</span>
            </div>
            <div>
              <span className="text-foreground/60 block mb-1">Shared Ride Match</span>
              {snapshot?.sharedRideId ? (
                <button 
                  onClick={() => navigate(`/shared-rides/tracking/${snapshot.sharedRideId}`)}
                  className="text-blue-500 hover:underline font-medium"
                >
                  Ride #{snapshot.sharedRideId}
                </button>
              ) : (
                <span className="text-foreground/40 italic">Not matched yet</span>
              )}
            </div>
            <div className="pt-4 mt-4 border-t border-border-subtle">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-foreground">Pool Members</span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                  {snapshot?.currentPassengers || 0} / {snapshot?.maxPassengers || 0}
                </span>
              </div>
              <div className="space-y-2">
                {snapshot?.members?.map((m, i) => (
                  <div key={m.id || i} className="p-2 rounded border border-border-subtle bg-foreground/5 text-sm flex justify-between items-center">
                    <div>
                      <div className="font-medium">{m.riderName}</div>
                      <div className="text-xs text-foreground/60">{m.riderPhoneNumber}</div>
                    </div>
                    <div className="text-xs font-bold text-indigo-500">
                      {m.seatsNeeded} Seats
                    </div>
                  </div>
                ))}
                {!snapshot?.members?.length && <div className="text-xs text-foreground/50">No members yet.</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Map / Visualization Placeholder */}
        <div className="lg:col-span-2 bg-foreground/5 border border-border-subtle rounded-2xl min-h-[400px] flex relative overflow-hidden">
          <PoolMap snapshot={snapshot} />
        </div>
      </div>
    </div>
  );
}

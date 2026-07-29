import { useParams } from 'react-router-dom';
import { useTripSocket } from '../hooks/useTripSocket';
import MapComponent from '../components/MapComponent';
import { MapPin, Navigation, User, CarFront, CheckCircle2, Navigation2, MoreHorizontal } from 'lucide-react';

export default function TripTrackingPage() {
  const { token } = useParams();
  const { isConnected, tripData, driverLocation, status, error } = useTripSocket(token);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-gradient-to-br from-gray-50 to-gray-200 p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-red-100 max-w-sm w-full transform transition-all hover:scale-105">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-red-500 text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3" dir="rtl">تعذر التتبع</h2>
          <p className="text-gray-500 leading-relaxed" dir="rtl">{error}</p>
        </div>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-gray-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
        </div>
        <div className="mt-6 text-gray-500 font-medium animate-pulse" dir="rtl">جاري الاتصال بالرحلة...</div>
      </div>
    );
  }

  const stops = Array.isArray(tripData.stops) ? tripData.stops : [];
  
  return (
    <div className="relative w-screen h-screen bg-gray-100 overflow-hidden font-sans" dir="rtl">
      {/* Map Layer */}
      <div className="absolute inset-0">
        <MapComponent tripData={tripData} driverLocation={driverLocation} />
      </div>

      {/* Top Gradient Overlay for contrast */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-10"></div>

      {/* Status Badge */}
      <div className="absolute top-6 right-6 left-6 flex justify-between items-start pointer-events-none z-20">
        <div className="pointer-events-auto bg-white/80 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-lg border border-white/50 font-semibold text-sm flex items-center gap-3 transition-all">
          {isConnected ? (
            <>
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </div>
              <span className="text-gray-800 tracking-wide">تتبع مباشر</span>
            </>
          ) : (
            <>
              <div className="relative flex h-3 w-3">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </div>
              <span className="text-gray-600">جاري الاتصال...</span>
            </>
          )}
        </div>
      </div>

      {/* Bottom Sheet for Driver Info - Premium Design */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none z-20">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-2xl border border-white p-6 rounded-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] w-full max-w-md mx-auto transition-transform">
          
          {/* Driver Header */}
          <div className="flex items-center gap-5 border-b border-gray-100 pb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-50 p-1">
                <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                  {tripData.driver?.photoUrl ? (
                    <img src={tripData.driver.photoUrl} alt="Driver" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-blue-400" />
                  )}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white text-xs font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm flex items-center gap-1">
                <span className="text-[10px]">★</span> 4.9
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-lg truncate mb-1">
                {tripData.driver?.firstName || 'سائق'}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CarFront className="w-4 h-4 text-gray-400" />
                <span className="truncate">{tripData.vehicle?.color || ''} {tripData.vehicle?.type || 'سيارة'}</span>
                <span className="px-2 py-1 bg-gray-100/80 rounded-lg font-mono text-xs font-bold text-gray-700 tracking-widest border border-gray-200">
                  {tripData.vehicle?.plateMasked || '***'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Timeline Route */}
          <div className="mt-5 relative pl-2 pr-4">
            {/* Start Point */}
            <div className="flex items-start gap-4 mb-4 relative">
              <div className="mt-0.5 flex flex-col items-center absolute right-[-4px]">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] z-10"></div>
                <div className="w-0.5 h-8 bg-gray-200 mt-1"></div>
              </div>
              <div className="pr-6">
                <p className="text-xs font-semibold text-green-600 mb-0.5 uppercase tracking-wider">نقطة الانطلاق</p>
                <p className="text-sm font-medium text-gray-800 line-clamp-1">{tripData.pickup?.label || 'غير محدد'}</p>
              </div>
            </div>

            {/* Stops */}
            {stops.map((stop, index) => (
              <div key={index} className="flex items-start gap-4 mb-4 relative">
                <div className="mt-0.5 flex flex-col items-center absolute right-[-4px]">
                  <div className="w-3 h-3 rounded-full bg-yellow-400 border-2 border-white shadow-sm z-10"></div>
                  <div className="w-0.5 h-8 bg-gray-200 mt-1"></div>
                </div>
                <div className="pr-6">
                  <p className="text-xs font-semibold text-yellow-600 mb-0.5 uppercase tracking-wider">توقف {stop.order || index + 1}</p>
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{stop.label}</p>
                </div>
              </div>
            ))}

            {/* Destination */}
            <div className="flex items-start gap-4 relative">
              <div className="mt-0.5 flex flex-col items-center absolute right-[-4px]">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)] z-10"></div>
              </div>
              <div className="pr-6">
                <p className="text-xs font-semibold text-red-500 mb-0.5 uppercase tracking-wider">نقطة الوصول</p>
                <p className="text-sm font-medium text-gray-800 line-clamp-1">{tripData.destination?.label || 'غير محدد'}</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";

// Lazy-loaded components drastically improve initial bundle size loading.
const Dashboard = React.lazy(() => import("../pages/Dashboard"));
const PlaceholderPage = React.lazy(() => import("../pages/PlaceholderPage"));
const TripsPage = React.lazy(() => import("../pages/trips/TripsPage"));
const RoleManagementPage = React.lazy(() => import("../pages/RoleManagementPage"));
const DriversPage = React.lazy(() => import("../pages/drivers/DriversPage"));
const RidersPage = React.lazy(() => import("../pages/riders/RidersPage"));
const AdminsPage = React.lazy(() => import("../pages/admins/AdminsPage"));
const RequestsPage = React.lazy(() => import("../pages/request/DriverRequestsPage"));
const VehicleTypesPage = React.lazy(() => import("../pages/vehicle-types/VehicleTypesPage"));
const DriverRequestDetailsPage = React.lazy(() => import("../pages/request/RequestDetailsPage"));
const SettingsPage = React.lazy(() => import("../pages/settings/SettingsPage"));
const LiveTrackingPage = React.lazy(() => import("../pages/live-tracking/LiveTrackingPage"));
const WalletPage = React.lazy(() => import("../pages/wallet/WalletPage"));
const RatingsPage = React.lazy(() => import("../pages/ratings/RatingsPage"));
const RatingTagsPage = React.lazy(() => import("../pages/rating-tags/RatingTagsPage"));

// Global Loader applied when jumping between massive un-cached chunks
function SuspenseFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-12 opacity-70">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-[var(--color-primary,#4880FF)]"></div>
      <span className="mt-4 text-sm text-white/50 tracking-widest uppercase">Loading route...</span>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/riders" element={<RidersPage />} />
        <Route path="/admins" element={<AdminsPage />} />
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/vehicle-types" element={<VehicleTypesPage />} />
        <Route path="/driver-requests/:id" element={<DriverRequestDetailsPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/live-tracking" element={<LiveTrackingPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/pricing" element={<PlaceholderPage title="Pricing" />} />
        <Route path="/roles" element={<RoleManagementPage />} />
        <Route path="/ratings" element={<RatingsPage />} />
        <Route path="/rating-tags" element={<RatingTagsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Suspense>
  );
}

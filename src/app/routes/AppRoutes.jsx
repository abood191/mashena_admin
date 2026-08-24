import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";

function lazyWithPreload(factory) {
  const Component = React.lazy(factory);
  Component.preload = factory;
  return Component;
}

// Lazy-loaded components with preload support for instant hover navigation
export const routeComponents = {
  "/": lazyWithPreload(() => import("../pages/Dashboard")),
  "/drivers": lazyWithPreload(() => import("../pages/drivers/DriversPage")),
  "/riders": lazyWithPreload(() => import("../pages/riders/RidersPage")),
  "/admins": lazyWithPreload(() => import("../pages/admins/AdminsPage")),
  "/accredited": lazyWithPreload(() => import("../pages/accredited/AccreditedPage")),
  "/requests": lazyWithPreload(() => import("../pages/request/DriverRequestsPage")),
  "/driver-requests": lazyWithPreload(() => import("../pages/request/DriverRequestsPage")),
  "/vehicle-types": lazyWithPreload(() => import("../pages/vehicle-types/VehicleTypesPage")),
  "/trips": lazyWithPreload(() => import("../pages/trips/TripsPage")),
  "/live-tracking": lazyWithPreload(() => import("../pages/live-tracking/LiveTrackingPage")),
  "/wallet": lazyWithPreload(() => import("../pages/wallet/WalletPage")),
  "/roles": lazyWithPreload(() => import("../pages/RoleManagementPage")),
  "/ratings": lazyWithPreload(() => import("../pages/ratings/RatingsPage")),
  "/rating-tags": lazyWithPreload(() => import("../pages/rating-tags/RatingTagsPage")),
  "/coupons": lazyWithPreload(() => import("../pages/coupons/CouponsPage")),
  "/settings": lazyWithPreload(() => import("../pages/settings/SettingsPage")),
  "/pricing": lazyWithPreload(() => import("../pages/PlaceholderPage")),
  "/403": lazyWithPreload(() => import("../pages/errors/UnauthorizedPage")),
  "/profile": lazyWithPreload(() => import("../pages/profile/UserProfilePage")),
  "/details": lazyWithPreload(() => import("../pages/request/RequestDetailsPage")),
  "/trip-history": lazyWithPreload(() => import("../pages/trips/TripHistoryPage")),
  "/trip-history/:id": lazyWithPreload(() => import("../pages/trips/TripDetailsPage")),
  "/notifications": lazyWithPreload(() => import("../pages/notifications/NotificationsPage")),
  "/notifications/send": lazyWithPreload(() => import("../pages/notifications/SendNotificationPage")),
};

export function preloadRoute(path) {
  // Direct match or base path match
  const routeComp = routeComponents[path] || routeComponents[path.split('/')[1] ? `/${path.split('/')[1]}` : '/'];
  if (routeComp && routeComp.preload) {
    routeComp.preload();
  }
}

const Dashboard = routeComponents["/"];
const DriversPage = routeComponents["/drivers"];
const RidersPage = routeComponents["/riders"];
const AdminsPage = routeComponents["/admins"];
const AccreditedPage = routeComponents["/accredited"];
const RequestsPage = routeComponents["/requests"];
const VehicleTypesPage = routeComponents["/vehicle-types"];
const DriverRequestDetailsPage = routeComponents["/details"];
const TripsPage = routeComponents["/trips"];
const LiveTrackingPage = routeComponents["/live-tracking"];
const WalletPage = routeComponents["/wallet"];
const PlaceholderPage = routeComponents["/pricing"];
const RoleManagementPage = routeComponents["/roles"];
const RatingsPage = routeComponents["/ratings"];
const RatingTagsPage = routeComponents["/rating-tags"];
const CouponsPage = routeComponents["/coupons"];
const SettingsPage = routeComponents["/settings"];
const UserProfilePage = routeComponents["/profile"];
const UnauthorizedPage = routeComponents["/403"];
const NotificationsPage = routeComponents["/notifications"];
const SendNotificationPage = routeComponents["/notifications/send"];
const TripHistoryPage = routeComponents["/trip-history"];
const TripDetailsPage = routeComponents["/trip-history/:id"];

// Global Visible Loader applied when loading route chunks
function SuspenseFallback() {
  return (
    <div className="relative min-h-[350px] w-full flex flex-col items-center justify-center p-8">
      {/* Top progress indicator bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#4880FF]/10 overflow-hidden rounded-t-3xl">
        <div className="h-full bg-[#4880FF] animate-pulse w-full origin-left transform scale-x-75 transition-all"></div>
      </div>
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-border-subtle border-t-[#4880FF]"></div>
      <span className="mt-4 text-xs font-semibold text-foreground/70 tracking-widest uppercase">
        Loading page...
      </span>
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
        <Route path="/accredited" element={<AccreditedPage />} />
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/driver-requests" element={<RequestsPage />} />
        <Route path="/vehicle-types" element={<VehicleTypesPage />} />
        <Route path="/driver-requests/:id" element={<DriverRequestDetailsPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/live-tracking" element={<LiveTrackingPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/pricing" element={<PlaceholderPage title="Pricing" />} />
        <Route path="/roles" element={<RoleManagementPage />} />
        <Route path="/ratings" element={<RatingsPage />} />
        <Route path="/rating-tags" element={<RatingTagsPage />} />
        <Route path="/coupons" element={<CouponsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile/:type/:id" element={<UserProfilePage />} />
        <Route path="/trip-history" element={<TripHistoryPage />} />
        <Route path="/trip-history/:id" element={<TripDetailsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/notifications/send" element={<SendNotificationPage />} />
        <Route path="/403" element={<UnauthorizedPage />} />
      </Routes>
    </Suspense>
  );
}

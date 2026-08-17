import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AlertTriangle, RefreshCw } from "lucide-react";

function lazyWithPreload(factory) {
  const Component = React.lazy(factory);
  Component.preload = factory;
  return Component;
}

// ── Per-page Error Boundary ───────────────────────────────────
class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[PageErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-5 text-center p-8">
          <div className="h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/20 grid place-items-center">
            <AlertTriangle className="h-7 w-7 text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Something went wrong</h2>
            <p className="mt-1 text-sm text-foreground/50 max-w-sm">
              {this.state.error?.message || "An unexpected error occurred on this page."}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4880FF]/10 border border-[#4880FF]/30 text-[#4880FF] text-sm font-semibold hover:bg-[#4880FF]/20 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy-loaded components with preload support for instant hover navigation
export const routeComponents = {
  "/": lazyWithPreload(() => import("../pages/Dashboard")),
  "/drivers": lazyWithPreload(() => import("../pages/drivers/DriversPage")),
  "/riders": lazyWithPreload(() => import("../pages/riders/RidersPage")),
  "/admins": lazyWithPreload(() => import("../pages/admins/AdminsPage")),
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
};

export function preloadRoute(path) {
  const routeComp = routeComponents[path] || routeComponents[path.split('/')[1] ? `/${path.split('/')[1]}` : '/'];
  if (routeComp && routeComp.preload) {
    routeComp.preload();
  }
}

const Dashboard = routeComponents["/"];
const DriversPage = routeComponents["/drivers"];
const RidersPage = routeComponents["/riders"];
const AdminsPage = routeComponents["/admins"];
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

// Global Visible Loader applied when loading route chunks
function SuspenseFallback() {
  return (
    <div className="relative min-h-[350px] w-full flex flex-col items-center justify-center p-8">
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

// Helper: wrap a page element with the error boundary
function page(element) {
  return <PageErrorBoundary>{element}</PageErrorBoundary>;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route path="/"                    element={page(<Dashboard />)} />
        <Route path="/drivers"             element={page(<DriversPage />)} />
        <Route path="/riders"              element={page(<RidersPage />)} />
        <Route path="/admins"              element={page(<AdminsPage />)} />
        <Route path="/requests"            element={page(<RequestsPage />)} />
        <Route path="/driver-requests"     element={page(<RequestsPage />)} />
        <Route path="/vehicle-types"       element={page(<VehicleTypesPage />)} />
        <Route path="/driver-requests/:id" element={page(<DriverRequestDetailsPage />)} />
        <Route path="/trips"               element={page(<TripsPage />)} />
        <Route path="/live-tracking"       element={page(<LiveTrackingPage />)} />
        <Route path="/wallet"              element={page(<WalletPage />)} />
        <Route path="/pricing"             element={page(<PlaceholderPage title="Pricing" />)} />
        <Route path="/roles"               element={page(<RoleManagementPage />)} />
        <Route path="/ratings"             element={page(<RatingsPage />)} />
        <Route path="/rating-tags"         element={page(<RatingTagsPage />)} />
        <Route path="/coupons"             element={page(<CouponsPage />)} />
        <Route path="/settings"            element={page(<SettingsPage />)} />
        <Route path="/profile/:type/:id"   element={page(<UserProfilePage />)} />
        <Route path="/403"                 element={page(<UnauthorizedPage />)} />
      </Routes>
    </Suspense>
  );
}

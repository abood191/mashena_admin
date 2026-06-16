import {
  LayoutDashboard,
  Car,
  Users,
  Route,
  Settings,
  ShieldCheck,
  Map,
} from "lucide-react";

export const NAV_ITEMS = [
  {
    to: "/",
    labelKey: "sidebar.dashboard",
    icon: LayoutDashboard, // Dashboard
  },
  {
    to: "/requests",
    labelKey: "sidebar.requests",// requests
    icon: LayoutDashboard,
  },
  {
    to: "/drivers",
    labelKey: "sidebar.drivers",
    icon: Car, // Drivers
  },
  { to: "/vehicle-types", labelKey: "sidebar.vehicleTypes", icon: Car }, // Vehicle Types
  {
    to: "/riders",
    labelKey: "sidebar.riders",
    icon: Users, // Riders
  },
  {
    to: "/admins",
    labelKey: "sidebar.admins",
    icon: Users, // Admins
  },
  {
    to: "/trips",
    labelKey: "sidebar.trips",
    icon: Route, // Trips / routes
  },
  {
    to: "/live-tracking",
    labelKey: "sidebar.liveTracking",
    icon: Map, // Live Map tracking
  },
  {
    to: "/roles",

    labelKey: "sidebar.roles",
    icon: ShieldCheck, // Role & Permissions
  },
  {
    to: "/settings",
    labelKey: "sidebar.settings",
    icon: Settings, // Settings
  },
];

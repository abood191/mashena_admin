import {
  LayoutDashboard,
  Car,
  Users,
  Route,
  Settings,
  ShieldCheck,
  Map,
  Wallet,
  Star,
  Tag,
  Ticket,
  History,
  Bell,
  Send,
  MessageSquareWarning,
  AlertTriangle,
  Zap,
  ScrollText,
} from "lucide-react";

export const NAV_ITEMS = [
  {
    to: "/",
    labelKey: "sidebar.dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    to: "/requests",
    labelKey: "sidebar.requests",
    icon: LayoutDashboard,
  },
  {
    to: "/drivers",
    labelKey: "sidebar.drivers",
    icon: Car,
  },
  {
    to: "/vehicle-types",
    labelKey: "sidebar.vehicleTypes",
    icon: Car,
  },
  {
    to: "/riders",
    labelKey: "sidebar.riders",
    icon: Users,
  },
  {
    to: "/admins",
    labelKey: "sidebar.admins",
    icon: Users,
  },
  {
    to: "/accredited",
    labelKey: "sidebar.accredited",
    icon: ShieldCheck,
  },
  {
    to: "/trips",
    labelKey: "sidebar.trips",
    icon: Route,
  },
  {
    to: "/shared-rides",
    labelKey: "sidebar.sharedRides",
    icon: Route,
  },
  {
    to: "/passenger-pools",
    labelKey: "sidebar.passengerPools",
    icon: Users,
  },
  {
    to: "/trip-history",
    labelKey: "sidebar.tripHistory",
    icon: History,
  },
  {
    to: "/live-tracking",
    labelKey: "sidebar.liveTracking",
    icon: Map,
  },
  {
    to: "/wallet",
    labelKey: "sidebar.wallet",
    icon: Wallet,
  },
  {
    to: "/roles",
    labelKey: "sidebar.roles",
    icon: ShieldCheck,
  },
  {
    to: "/ratings",
    labelKey: "sidebar.ratings",
    icon: Star,
  },
  {
    to: "/rating-tags",
    labelKey: "sidebar.ratingTags",
    icon: Tag,
  },
  {
    to: "/coupons",
    labelKey: "sidebar.coupons",
    icon: Ticket,
  },
  {
    to: "/settings",
    labelKey: "sidebar.settings",
    icon: Settings,
  },
  {
    to: "/notifications",
    labelKey: "sidebar.notificationsList",
    icon: Bell,
    exact: true,
  },
  {
    to: "/notifications/send",
    labelKey: "sidebar.sendNotification",
    icon: Send,
  },
  {
    to: "/moderation/appeals",
    labelKey: "sidebar.moderationAppeals",
    icon: MessageSquareWarning,
  },
  {
    to: "/moderation/violations",
    labelKey: "sidebar.moderationViolations",
    icon: AlertTriangle,
  },
  {
    to: "/moderation/rules",
    labelKey: "sidebar.moderationRules",
    icon: Zap,
  },
  {
    to: "/moderation/audit-logs",
    labelKey: "sidebar.auditLogs",
    icon: ScrollText,
  },
];

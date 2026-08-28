import React, { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, User, Phone, Mail, Shield, Calendar, Activity, Star,
  Info, ShieldAlert, Trash2
} from "lucide-react";
import { useDriver, useRider, useAdmin, useAccreditedUser, useDeleteUser } from "../../hooks/api/useUsers";
import { useTranslation } from "react-i18next";
import { UserModerationTab } from "../moderation/components/UserModerationTab";
import { toast } from "sonner";

const TABS = [
  { id: "info", label: "Info", icon: Info },
  { id: "moderation", label: "Moderation", icon: ShieldAlert },
];

// Only drivers and riders have moderation (not admins)
const MODERATION_ROLES = new Set(["drivers", "riders"]);

export default function UserProfilePage() {
  const { type, id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  // Tab is preserved in URL: /profile/drivers/42?tab=moderation
  const activeTab = searchParams.get("tab") ?? "info";
  const setTab = (tabId) => setSearchParams({ tab: tabId }, { replace: true });

  // Dynamically select the hook based on the URL type
  const hookMap = {
    drivers: useDriver,
    riders: useRider,
    admins: useAdmin,
    accredited: useAccreditedUser,
  };

  const useQueryHook = hookMap[type];

  const { data, isLoading, isError, error } = useQueryHook
    ? useQueryHook(id)
    : { data: null, isLoading: false, isError: true, error: new Error("Invalid user type") };

  const user = data?.data || data;

  const showModerationTab = MODERATION_ROLES.has(type);
  const userRole = type === "drivers" ? "DRIVER" : "RIDER";

  const profile = user?.driverProfile || user?.riderProfile || user?.accreditedProfile;
  const ratingAvg = profile?.ratingAvg !== undefined && profile?.ratingAvg !== null 
    ? Number(profile.ratingAvg).toFixed(1) 
    : "--";
  const totalActivity = profile?.completedTripsCount ?? profile?.ratingCount ?? "--";

  const deleteUserMutation = useDeleteUser();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const confirmDelete = () => {
    // Determine the actual userId if the id in URL is the profile id.
    // If user.id exists, it means the API returned the base user object with its real ID.
    const actualUserId = user?.id || id;
    
    deleteUserMutation.mutate(actualUserId, {
      onSuccess: () => {
        toast.success(t("common.deleteSuccess", "User deleted successfully"));
        setShowDeleteModal(false);
        navigate(-1); // Go back to list
      },
      onError: (err) => {
        toast.error(err.message || t("common.deleteError", "Failed to delete user"));
        setShowDeleteModal(false);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4880FF]" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="p-8 text-center text-red-500">
        <h2 className="text-2xl font-bold mb-2">Error loading profile</h2>
        <p>{error?.message || "User not found"}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-[#4880FF] hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const visibleTabs = showModerationTab ? TABS : TABS.filter((t) => t.id !== "moderation");

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-surface border border-border-subtle text-foreground hover:bg-foreground/5 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground capitalize">
              {type.slice(0, -1)} Profile
            </h1>
            <p className="text-foreground/50 text-sm">
              {user.fullName || "—"} · ID #{id}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={deleteUserMutation.isPending}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors font-medium text-sm border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleteUserMutation.isPending ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500" />
          ) : (
            <Trash2 size={16} />
          )}
          {t("common.delete", "Delete")}
        </button>
      </div>

      {/* ── Tab Bar ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-foreground/5 rounded-2xl border border-border-subtle w-fit">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-surface text-foreground shadow-sm border border-border-subtle"
                  : "text-foreground/40 hover:text-foreground/70"
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {tab.id === "moderation" && isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#4880FF] animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Info Tab ──────────────────────────────────────────────────────────── */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-surface rounded-3xl border border-border-subtle p-6 flex flex-col items-center text-center shadow-sm">
              <div className="w-24 h-24 rounded-full bg-[#4880FF]/10 text-[#4880FF] flex items-center justify-center mb-4 border border-[#4880FF]/20">
                <User size={40} />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                {user.fullName || "N/A"}
              </h2>
              <p className="text-foreground text-sm mb-4">
                <span className="inline-block px-3 py-1 bg-green-500/10 text-green-500 rounded-lg text-xs font-bold uppercase tracking-wider">
                  Active
                </span>
              </p>

              <div className="w-full pt-4 border-t border-border-subtle space-y-3">
                <div className="flex items-center gap-3 text-foreground text-sm">
                  <Mail size={16} className="text-foreground/40" />
                  <span className="truncate">{user.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-3 text-foreground text-sm">
                  <Phone size={16} className="text-foreground/40" />
                  <span>{user.phoneNumber || "No phone"}</span>
                </div>
                <div className="flex items-center gap-3 text-foreground text-sm">
                  <Calendar size={16} className="text-foreground/40" />
                  <span>
                    Joined{" "}
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {type === "admins" && (
              <div className="bg-surface rounded-3xl border border-border-subtle p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Shield size={18} className="text-[#4880FF]" />
                    Role & Permissions
                  </h3>
                </div>
                <div className="p-4 bg-foreground/5 rounded-xl border border-border-subtle">
                  <p className="text-sm font-medium text-foreground mb-1">
                    Current Role ID: {user.roleId || "Unknown"}
                  </p>
                  <p className="text-xs text-foreground/50">
                    Role editing feature will be available soon.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface rounded-3xl border border-border-subtle p-6 shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={18} className="text-orange-500" />
                  <span className="text-sm font-bold text-foreground">
                    Total Activity
                  </span>
                </div>
                <span className="text-3xl font-bold text-foreground">{totalActivity}</span>
              </div>
              <div className="bg-surface rounded-3xl border border-border-subtle p-6 shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <Star size={18} className="text-yellow-500" />
                  <span className="text-sm font-bold text-foreground">Rating</span>
                </div>
                <span className="text-3xl font-bold text-foreground">{ratingAvg}</span>
              </div>
            </div>

            <div className="bg-surface rounded-3xl border border-border-subtle p-6 shadow-sm min-h-[300px]">
              <h3 className="font-bold text-foreground mb-4">Recent History</h3>
              <div className="flex items-center justify-center h-full text-foreground/30 text-sm italic py-12">
                No recent activity found.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Moderation Tab ────────────────────────────────────────────────────── */}
      {activeTab === "moderation" && showModerationTab && (
        <UserModerationTab userId={Number(user?.id || id)} userRole={userRole} />
      )}

      {/* Custom Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border-subtle rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 text-red-500 mb-4 mx-auto">
              <Trash2 size={24} />
            </div>
            <h2 className="text-xl font-bold text-foreground text-center mb-2">
              Delete User?
            </h2>
            <p className="text-foreground/60 text-center text-sm mb-6">
              Are you sure you want to delete <span className="font-bold text-foreground">{user.fullName || "this user"}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground font-medium text-sm hover:bg-foreground/10 transition-colors"
                disabled={deleteUserMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors flex justify-center items-center gap-2"
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

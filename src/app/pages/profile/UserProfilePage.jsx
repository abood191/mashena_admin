import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, Mail, Shield, Calendar, Activity, Star } from "lucide-react";
import { useDriver, useRider, useAdmin } from "../../hooks/api/useUsers";
import { useTranslation } from "react-i18next";

export default function UserProfilePage() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  // Dynamically select the hook based on the URL type
  const hookMap = {
    drivers: useDriver,
    riders: useRider,
    admins: useAdmin,
  };

  const useQueryHook = hookMap[type];

  // If the type is invalid, we could show an error, but react-router usually protects us
  const { data, isLoading, isError, error } = useQueryHook
    ? useQueryHook(id)
    : { data: null, isLoading: false, isError: true, error: new Error("Invalid user type") };

  const user = data?.data || data; // Handle depending on how backend wraps response

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4880FF]"></div>
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

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header section with back button */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl bg-surface border border-border-subtle text-foreground hover:bg-foreground/5 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground capitalize">{type.slice(0, -1)} Profile</h1>
          <p className="text-muted text-sm">Detailed information and statistics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Basic Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-surface rounded-3xl border border-border-subtle p-6 flex flex-col items-center text-center shadow-sm">
            <div className="w-24 h-24 rounded-full bg-[#4880FF]/10 text-[#4880FF] flex items-center justify-center mb-4 border border-[#4880FF]/20">
              <User size={40} />
            </div>
            <h2 className="text-xl font-bold text-foreground">{user.fullName || "N/A"}</h2>
            <p className="text-muted text-sm mb-4">
              <span className="inline-block px-3 py-1 bg-green-500/10 text-green-500 rounded-lg text-xs font-bold uppercase tracking-wider">
                Active
              </span>
            </p>
            
            <div className="w-full pt-4 border-t border-border-subtle space-y-3">
              <div className="flex items-center gap-3 text-foreground text-sm">
                <Mail size={16} className="text-muted" />
                <span className="truncate">{user.email || "No email"}</span>
              </div>
              <div className="flex items-center gap-3 text-foreground text-sm">
                <Phone size={16} className="text-muted" />
                <span>{user.phoneNumber || "No phone"}</span>
              </div>
              <div className="flex items-center gap-3 text-foreground text-sm">
                <Calendar size={16} className="text-muted" />
                <span>Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Role Section (Prepared for Edit in Admin) */}
          {type === "admins" && (
            <div className="bg-surface rounded-3xl border border-border-subtle p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Shield size={18} className="text-[#4880FF]" />
                  Role & Permissions
                </h3>
              </div>
              <div className="p-4 bg-foreground/5 rounded-xl border border-border-subtle">
                <p className="text-sm font-medium text-foreground mb-1">Current Role ID: {user.roleId || "Unknown"}</p>
                <p className="text-xs text-muted">Role editing feature will be available soon.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Stats and Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface rounded-3xl border border-border-subtle p-6 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={18} className="text-orange-500" />
                <span className="text-sm font-bold text-muted">Total Activity</span>
              </div>
              <span className="text-3xl font-bold text-foreground">--</span>
            </div>
            
            <div className="bg-surface rounded-3xl border border-border-subtle p-6 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Star size={18} className="text-yellow-500" />
                <span className="text-sm font-bold text-muted">Rating</span>
              </div>
              <span className="text-3xl font-bold text-foreground">--</span>
            </div>
          </div>

          <div className="bg-surface rounded-3xl border border-border-subtle p-6 shadow-sm min-h-[300px]">
             <h3 className="font-bold text-foreground mb-4">Recent History</h3>
             <div className="flex items-center justify-center h-full text-muted text-sm italic py-12">
               No recent activity found.
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

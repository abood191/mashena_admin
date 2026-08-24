import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, Image as ImageIcon, Users, Search, Loader2, X, User, Check } from "lucide-react";
import { useSendAdminNotification } from "../../hooks/api/useNotifications";
import { useDrivers, useRiders, useAdmins } from "../../hooks/api/useUsers";
import { useDebounce } from "../../../hooks/useDebounce";
import { toast } from "sonner";

export default function SendNotificationPage() {
  const { t } = useTranslation();
  const sendMutation = useSendAdminNotification();

  const [sendToAll, setSendToAll] = useState(false);
  const [userType, setUserType] = useState("rider");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    body: "",
    imageUrl: "",
    type: "ADMIN_BROADCAST",
    screen: "",
    updateId: ""
  });

  const { data: driversData, isFetching: fetchingDrivers } = useDrivers(
    { skip: 0, limit: 10, search: debouncedSearch },
    { enabled: userType === "driver" && debouncedSearch.length > 1 }
  );
  const { data: ridersData, isFetching: fetchingRiders } = useRiders(
    { skip: 0, limit: 10, search: debouncedSearch },
    { enabled: userType === "rider" && debouncedSearch.length > 1 }
  );
  const { data: adminsData, isFetching: fetchingAdmins } = useAdmins(
    { skip: 0, limit: 10, search: debouncedSearch },
    { enabled: userType === "admin" && debouncedSearch.length > 1 }
  );

  const isFetching = fetchingDrivers || fetchingRiders || fetchingAdmins;
  const searchResults =
    userType === "driver" ? driversData?.data || [] :
    userType === "rider"  ? ridersData?.data  || [] :
                            adminsData?.data  || [];

  const handleSelectUser = (user) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(prev => [...prev, user]);
    }
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.body) {
      toast.warning("Title and Body are required");
      return;
    }
    if (!sendToAll && selectedUsers.length === 0) {
      toast.warning("Select at least one user or choose Broadcast to All");
      return;
    }

    const payload = {
      sendToAll,
      title: formData.title,
      body: formData.body,
      type: formData.type,
    };
    if (formData.imageUrl) payload.imageUrl = formData.imageUrl;
    if (!sendToAll) payload.userIds = selectedUsers.map(u => u.id);
    const data = {};
    if (formData.screen) data.screen = formData.screen;
    if (formData.updateId) data.updateId = Number(formData.updateId);
    if (Object.keys(data).length > 0) payload.data = data;

    try {
      await sendMutation.mutateAsync(payload);
      setFormData({ title: "", body: "", imageUrl: "", type: "ADMIN_BROADCAST", screen: "", updateId: "" });
      setSelectedUsers([]);
      setSearchTerm("");
    } catch (_) {
      // toast is handled in the hook
    }
  };

  return (
    <div className="p-1 space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">

      {/* Page Header */}
      <div className="bg-surface backdrop-blur-md px-6 py-5 rounded-3xl border border-border-subtle flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#4880FF]/10 border border-[#4880FF]/20 grid place-items-center">
            <Send className="h-5 w-5 text-[#4880FF]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground tracking-wide uppercase">
              {t("notificationsManagement.send.title", { defaultValue: "Send Notification" })}
            </h1>
            <p className="text-[10px] text-foreground/40">
              Broadcast messages or target specific users
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-border-subtle rounded-3xl p-6 space-y-8 shadow-sm">

        {/* ── Audience ── */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground border-b border-border-subtle pb-2">
            {t("notificationsManagement.send.audience", { defaultValue: "Audience" })}
          </h3>

          <div className="flex gap-4">
            <label className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${sendToAll ? "border-[#4880FF] bg-[#4880FF]/5" : "border-border-subtle bg-foreground/5 hover:bg-foreground/10"}`}>
              <input type="radio" checked={sendToAll} onChange={() => setSendToAll(true)} className="hidden" />
              <Users size={22} className={sendToAll ? "text-[#4880FF]" : "text-foreground/40"} />
              <span className={`text-sm font-semibold ${sendToAll ? "text-[#4880FF]" : "text-foreground/70"}`}>
                {t("notificationsManagement.send.sendToAll", { defaultValue: "Broadcast to All" })}
              </span>
            </label>

            <label className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${!sendToAll ? "border-[#4880FF] bg-[#4880FF]/5" : "border-border-subtle bg-foreground/5 hover:bg-foreground/10"}`}>
              <input type="radio" checked={!sendToAll} onChange={() => setSendToAll(false)} className="hidden" />
              <User size={22} className={!sendToAll ? "text-[#4880FF]" : "text-foreground/40"} />
              <span className={`text-sm font-semibold ${!sendToAll ? "text-[#4880FF]" : "text-foreground/70"}`}>
                {t("notificationsManagement.send.sendToSpecific", { defaultValue: "Specific Users" })}
              </span>
            </label>
          </div>

          {!sendToAll && (
            <div className="space-y-4 bg-foreground/5 p-5 rounded-2xl border border-border-subtle">
              {/* User type selector */}
              <div className="flex gap-2 p-1 bg-surface rounded-xl border border-border-subtle w-fit">
                {["rider", "driver", "admin"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => { setUserType(type); setSearchTerm(""); setShowDropdown(false); }}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${userType === type ? "bg-[#4880FF] text-white shadow-md" : "text-foreground/60 hover:text-foreground"}`}
                  >
                    {t(`notificationsManagement.send.${type}`, { defaultValue: type.charAt(0).toUpperCase() + type.slice(1) })}
                  </button>
                ))}
              </div>

              {/* Search box */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
                <input
                  type="text"
                  placeholder={t("notificationsManagement.send.searchPlaceholder", { defaultValue: "Search by name, email, or phone..." })}
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#4880FF] transition-colors text-foreground"
                />
                {isFetching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#4880FF]" size={16} />}

                {/* Dropdown */}
                {showDropdown && searchTerm.length > 1 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-surface border border-border-subtle rounded-xl shadow-xl max-h-56 overflow-y-auto">
                    {isFetching ? (
                      <div className="p-4 text-center text-foreground/40 text-sm">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(user => (
                        <div
                          key={user.id}
                          onClick={() => handleSelectUser(user)}
                          className="px-4 py-3 hover:bg-[#4880FF]/5 cursor-pointer border-b border-border-subtle last:border-0 flex justify-between items-center"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{user.fullName || user.username || "—"}</p>
                            <p className="text-xs text-foreground/50">{user.email} • {user.phoneNumber}</p>
                          </div>
                          {selectedUsers.find(u => u.id === user.id) && <Check size={14} className="text-[#4880FF] shrink-0" />}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-foreground/40 text-sm">
                        {t("notificationsManagement.send.noUsersFound", { defaultValue: "No users found" })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected chips */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-[#4880FF]/30 text-[#4880FF] rounded-lg text-sm">
                      <span>{user.fullName || user.username}</span>
                      <button type="button" onClick={() => handleRemoveUser(user.id)} className="p-0.5 hover:bg-[#4880FF]/20 rounded-full">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setSelectedUsers([])} className="px-3 py-1.5 text-xs text-foreground/40 hover:text-red-400 transition-colors">
                    {t("notificationsManagement.send.clearSelection", { defaultValue: "Clear all" })}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground border-b border-border-subtle pb-2">
            {t("notificationsManagement.send.content", { defaultValue: "Notification Content" })}
          </h3>

          <div>
            <label className="text-foreground/60 text-xs font-bold uppercase ml-1 block mb-1">
              {t("notificationsManagement.send.notificationTitle", { defaultValue: "Title" })} *
            </label>
            <input
              type="text" name="title" value={formData.title} onChange={handleChange}
              placeholder="e.g. System Update"
              className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4880FF] text-foreground"
              required
            />
          </div>

          <div>
            <label className="text-foreground/60 text-xs font-bold uppercase ml-1 block mb-1">
              {t("notificationsManagement.send.notificationBody", { defaultValue: "Body" })} *
            </label>
            <textarea
              name="body" value={formData.body} onChange={handleChange} rows={3}
              placeholder="Enter the notification message..."
              className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4880FF] text-foreground resize-none"
              required
            />
          </div>

          <div>
            <label className="text-foreground/60 text-xs font-bold uppercase ml-1 block mb-1">
              {t("notificationsManagement.send.imageUrl", { defaultValue: "Image URL (Optional)" })}
            </label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
              <input
                type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange}
                placeholder="https://example.com/image.png"
                className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#4880FF] text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-foreground/60 text-xs font-bold uppercase ml-1 block mb-1">
                {t("notificationsManagement.send.type", { defaultValue: "Type" })}
              </label>
              <select
                name="type" value={formData.type} onChange={handleChange}
                className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4880FF] text-foreground"
              >
                <option value="ADMIN_BROADCAST">Admin Broadcast</option>
                <option value="ACCOUNT_UPDATE">Account Update</option>
                <option value="PROMOTION">Promotion</option>
                <option value="TRIP_UPDATE">Trip Update</option>
              </select>
            </div>
            <div>
              <label className="text-foreground/60 text-xs font-bold uppercase ml-1 block mb-1">
                {t("notificationsManagement.send.screen", { defaultValue: "Target Screen (Optional)" })}
              </label>
              <input
                type="text" name="screen" value={formData.screen} onChange={handleChange}
                placeholder="e.g. HOME, WALLET"
                className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4880FF] text-foreground"
              />
            </div>
            <div>
              <label className="text-foreground/60 text-xs font-bold uppercase ml-1 block mb-1">
                {t("notificationsManagement.send.updateId", { defaultValue: "Update ID (Optional)" })}
              </label>
              <input
                type="number" name="updateId" value={formData.updateId} onChange={handleChange}
                placeholder="e.g. 10"
                className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4880FF] text-foreground"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={sendMutation.isPending}
          className="w-full py-3.5 bg-[#4880FF] hover:bg-[#4880FF]/90 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {sendMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          {sendMutation.isPending
            ? t("notificationsManagement.send.sending", { defaultValue: "Sending..." })
            : t("notificationsManagement.send.sendButton", { defaultValue: "Send Notification" })
          }
        </button>
      </form>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "../hooks/api/useNotifications";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { t } = useTranslation();

  const { data, isLoading } = useNotifications();
  const markReadMutation = useMarkNotificationAsRead();
  const markAllReadMutation = useMarkAllNotificationsAsRead();

  // Based on standard response { count: 0, unreadCount: 0, data: [] }
  const count = data?.unreadCount || 0;
  const notifications = data?.data || [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await markReadMutation.mutateAsync(id);
    } catch (err) {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative h-10 w-10 shrink-0 rounded-2xl border border-border-subtle bg-foreground/5 hover:bg-foreground/10 text-foreground flex items-center justify-center transition-all"
        title="Notifications"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full text-[10px] font-bold grid place-items-center bg-[#4880FF] text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-14 right-0 w-80 sm:w-96 bg-surface border border-border-subtle shadow-2xl rounded-3xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-foreground/5">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {count > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                disabled={markAllReadMutation.isPending}
                className="text-xs text-[#4880FF] hover:underline font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-[#4880FF]" size={24} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-foreground/50 text-sm">
                No notifications yet.
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 border-b border-border-subtle last:border-0 hover:bg-foreground/5 transition-colors cursor-pointer flex gap-3 ${!notif.read ? 'bg-[#4880FF]/5' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.read ? 'font-bold text-foreground' : 'text-foreground/80'}`}>
                        {notif.title || "Notification"}
                      </p>
                      <p className="text-xs text-foreground/60 mt-1 line-clamp-2 leading-relaxed">
                        {notif.body || notif.message}
                      </p>
                      <p className="text-[10px] text-foreground/40 mt-2 font-mono">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notif.read && (
                      <button 
                        onClick={(e) => handleMarkAsRead(e, notif.id)}
                        className="h-6 w-6 rounded-full bg-foreground/10 hover:bg-[#4880FF] hover:text-white text-foreground flex items-center justify-center shrink-0 transition-all"
                        title="Mark as read"
                      >
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

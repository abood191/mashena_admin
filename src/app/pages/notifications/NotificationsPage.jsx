import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "../../hooks/api/useNotifications";
import { Bell, Check, Loader2, AlertTriangle, CalendarDays } from "lucide-react";

export default function NotificationsPage() {
  const { data, isLoading, error } = useNotifications();
  const markReadMutation = useMarkNotificationAsRead();
  const markAllReadMutation = useMarkAllNotificationsAsRead();

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  const handleMarkAsRead = (id) => {
    markReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllReadMutation.mutate();
  };

  return (
    <div className="p-1 space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div className="bg-slate-900 backdrop-blur-md px-6 py-5 rounded-3xl border border-white/10 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 grid place-items-center text-lg shadow-inner">
            <Bell className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide uppercase">
              Notifications Center
            </h1>
            <p className="text-[10px] text-white/40">
              Manage system alerts and administrative notifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-white/70">
              {unreadCount} Unread
            </span>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllReadMutation.isPending}
              className="text-xs bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {markAllReadMutation.isPending ? "Updating..." : "Mark All as Read"}
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-white/40">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-4" />
            <span className="text-xs uppercase tracking-widest font-semibold">Loading notifications...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-red-300 border-t border-white/5">
            <AlertTriangle className="h-9 w-9 mb-3 opacity-50" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Failed to load</h3>
            <p className="text-xs text-red-200/50 mt-1">Unable to fetch notifications at this time.</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center text-white/30">
            <Bell className="h-12 w-12 mb-4 text-white/10" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">All caught up!</h3>
            <p className="text-xs text-white/40 mt-1">You have no notifications right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map((notif) => (
              <div 
                key={notif.id}
                className={`p-5 flex items-start gap-4 transition-colors hover:bg-white/[0.02] ${!notif.isRead ? 'bg-indigo-500/[0.03]' : ''}`}
              >
                <div className={`h-2 w-2 mt-1.5 rounded-full shrink-0 ${!notif.isRead ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-transparent'}`} />
                
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-white' : 'font-medium text-white/70'}`}>
                    {notif.title || "System Alert"}
                  </h4>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">
                    {notif.body || notif.message}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-[10px] text-white/30 font-mono uppercase tracking-wider">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(notif.createdAt).toLocaleString()}
                  </div>
                </div>

                {!notif.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="h-8 w-8 rounded-full bg-white/5 hover:bg-indigo-500 hover:text-white text-white/40 flex items-center justify-center shrink-0 transition-all border border-white/5 hover:border-indigo-400"
                    title="Mark as read"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

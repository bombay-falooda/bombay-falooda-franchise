"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type NotificationItem = {
  id: string;
  recipientRole: string;
  outletId?: string;
  franchiseId?: string;
  title: string;
  message: string;
  type: "SUCCESS" | "INFO" | "WARNING" | "ALERT";
  readStatus: boolean;
  createdAt: string;
};

type Props = {
  role: "FRANCHISE_OWNER" | "SUPERADMIN";
  outletId?: string;
};

export function NotificationCenter({ role, outletId }: Props) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastCount, setLastCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (window.Notification.permission === "default") {
        void window.Notification.requestPermission();
      }
    }

    void fetchFeed();
    const interval = setInterval(() => void fetchFeed(), 5000);
    return () => clearInterval(interval);
  }, [role, outletId]);

  async function fetchFeed() {
    try {
      const query = new URLSearchParams();
      query.set("role", role);
      if (outletId) query.set("outletId", outletId);

      const items = await apiRequest<NotificationItem[]>(`/notifications/feed?${query.toString()}`);
      setNotifications(items);

      const unreadCount = items.filter((i) => !i.readStatus).length;

      if (unreadCount > lastCount && lastCount !== 0) {
        const latest = items[0];
        if (latest && typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
          new window.Notification(latest.title, {
            body: latest.message,
            icon: "/assets/bombay-logo.png",
          });
        }
      }
      setLastCount(unreadCount);
    } catch {
      // Ignore polling errors
    }
  }

  async function markAsRead(id: string) {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readStatus: true } : n))
      );
    } catch {
      // Ignore
    }
  }

  async function markAllAsRead() {
    try {
      const query = new URLSearchParams({ role });
      if (outletId) query.set("outletId", outletId);
      await apiRequest(`/notifications/read-all?${query.toString()}`, { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, readStatus: true })));
    } catch {
      // Ignore
    }
  }

  const unreadCount = notifications.filter((n) => !n.readStatus).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition flex items-center justify-center"
        title="Notifications"
      >
        <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-red-600 text-white font-bold text-[10px] flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col font-sans max-h-[500px]">
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="font-bold text-xs">Realtime Notifications Feed</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {unreadCount} New
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[10px] text-slate-300 hover:text-white transition flex items-center gap-1 font-semibold"
                >
                  Mark All Read
                </button>
              )}
              <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition">
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1 scrollbar-none">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-semibold">
                No notifications right now.
              </div>
            ) : (
              notifications.map((item) => {
                const colorClass =
                  item.type === "SUCCESS"
                    ? "bg-emerald-100 text-emerald-800"
                    : item.type === "WARNING"
                    ? "bg-amber-100 text-amber-800"
                    : item.type === "ALERT"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800";

                return (
                  <div
                    key={item.id}
                    onClick={() => !item.readStatus && markAsRead(item.id)}
                    className={`p-3 rounded-xl transition cursor-pointer flex items-start gap-3 ${
                      item.readStatus ? "bg-white opacity-70" : "bg-slate-50 border-l-4 border-l-blue-600"
                    }`}
                  >
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${colorClass}`}>
                      {item.type}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 truncate">{item.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{item.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

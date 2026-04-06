"use client"

import { useEffect } from "react"
import { motion } from "motion/react"
import { HiBell, HiCheckCircle } from "react-icons/hi2"
import { useAuthContext } from "@/context/AuthContext"
import { useNotificationsStore } from "@/store/notifications"
import PageTransition from "@/components/PageTransition"
import type { AppNotification } from "@/lib/types"

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const TYPE_STYLES: Record<AppNotification["type"], string> = {
  success: "bg-emerald-500",
  error:   "bg-red-500",
  warning: "bg-amber-500",
  info:    "bg-indigo-500",
}

export default function NotificationsPage() {
  const { userId } = useAuthContext()
  const { items, setItems, markRead, markAllRead, unreadCount } = useNotificationsStore()

  useEffect(() => {
    if (!userId) return
    fetch(`/api/notifications?user_id=${userId}`)
      .then((r) => r.json())
      .then(({ notifications }: { notifications: AppNotification[] }) => setItems(notifications))
      .catch(() => {})
  }, [userId, setItems])

  const unread = unreadCount()

  function handleClick(notif: AppNotification) {
    if (!notif.is_read) {
      markRead(notif.id)
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, id: notif.id }),
      }).catch(() => {})
    }
  }

  function handleMarkAllRead() {
    markAllRead()
    if (userId) {
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, all: true }),
      }).catch(() => {})
    }
  }

  return (
    <PageTransition>
      <main className="min-h-screen max-w-sm mx-auto px-4 pt-6 pb-10">
        {/* Header */}
        <motion.div
          className="mb-5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HiBell className="text-indigo-500 dark:text-indigo-400 text-xl" />
              <h1 className="text-xl font-extrabold text-zinc-800 dark:text-zinc-100 tracking-tight">
                Notifications
              </h1>
              {unread > 0 && (
                <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 dark:text-indigo-400 px-3 py-1.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
              >
                <HiCheckCircle className="text-sm" />
                Mark all read
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            {items.length === 0
              ? "You're all caught up"
              : `${items.length} notification${items.length !== 1 ? "s" : ""}${unread > 0 ? `, ${unread} unread` : ""}`}
          </p>
        </motion.div>

        {/* List */}
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col items-center gap-3 py-16 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <HiBell className="text-2xl text-zinc-300 dark:text-zinc-600" />
            </div>
            <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">No notifications yet</p>
            <p className="text-xs text-zinc-300 dark:text-zinc-600">
              You&apos;ll see updates about generated questions and app activity here
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="bg-white dark:bg-[#1a1828] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          >
            {items.map((notif, i) => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full text-left px-4 py-4 transition-colors ${
                  i < items.length - 1 ? "border-b border-zinc-100 dark:border-zinc-800/60" : ""
                } ${notif.is_read
                  ? "bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  : "bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Type dot */}
                  <span className={`mt-1 shrink-0 w-2 h-2 rounded-full ${TYPE_STYLES[notif.type]} ${notif.is_read ? "opacity-30" : ""}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-semibold leading-snug ${
                        notif.is_read ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-800 dark:text-zinc-100"
                      }`}>
                        {notif.title}
                      </p>
                      <span className="text-[9px] text-zinc-300 dark:text-zinc-600 whitespace-nowrap shrink-0 mt-0.5">
                        {timeAgo(notif.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-snug">
                      {notif.message}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </main>
    </PageTransition>
  )
}

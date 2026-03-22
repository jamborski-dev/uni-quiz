"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import {
  HiSun, HiMoon, HiUser, HiArrowRightOnRectangle,
  HiHome, HiChartBar, HiBell, HiCog6Tooth, HiXMark,
} from "react-icons/hi2"
import { useTheme } from "@/components/ThemeProvider"
import { useAuthContext } from "@/context/AuthContext"
import { useNotificationsStore } from "@/store/notifications"
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

export default function BottomNav() {
  const { theme, toggle } = useTheme()
  const { userId, profile, loading, signOut } = useAuthContext()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const pathname = usePathname()

  const { items, isOpen, setItems, markRead, markAllRead, toggleOpen, setOpen, unreadCount } =
    useNotificationsStore()

  // Seed notifications from server when user is known
  useEffect(() => {
    if (!userId) return
    fetch(`/api/notifications?user_id=${userId}`)
      .then((r) => r.json())
      .then(({ notifications }: { notifications: AppNotification[] }) => setItems(notifications))
      .catch(() => {})
  }, [userId, setItems])

  const initial = profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : null
  const unread = unreadCount()

  function handleNotifClick(notif: AppNotification) {
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
    <>
      {/* Overlays */}
      {showUserMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
      )}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Notifications panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed inset-x-0 bottom-20 z-50 mx-4 max-h-[60vh] bg-white dark:bg-[#1a1828] rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 flex flex-col overflow-hidden"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <HiBell className="text-indigo-500 dark:text-indigo-400 text-base" />
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Notifications</span>
                {unread > 0 && (
                  <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                    {unread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <HiXMark className="text-base" />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="overflow-y-auto flex-1">
              {items.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-8">No notifications yet</p>
              ) : (
                items.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={`w-full text-left px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 transition-colors ${
                      notif.is_read
                        ? "bg-transparent"
                        : "bg-indigo-50/50 dark:bg-indigo-950/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold leading-snug ${notif.is_read ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-800 dark:text-zinc-100"}`}>
                          {notif.title}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-snug">
                          {notif.message}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[9px] text-zinc-300 dark:text-zinc-600 whitespace-nowrap">
                          {timeAgo(notif.created_at)}
                        </span>
                        {!notif.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#0e0d16]/90 backdrop-blur-md px-6 pt-3 pb-5 flex items-center justify-between">

        {/* Theme toggle */}
        <motion.button
          onClick={toggle}
          className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-amber-400 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.88 }}
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ rotate: -60, opacity: 0, scale: 0.7 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 60, opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.18 }}
              className="block text-lg leading-none"
            >
              {theme === "dark" ? <HiSun /> : <HiMoon />}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        {/* Centre nav links */}
        <div className="flex items-center gap-1">
          {[
            { href: "/", icon: <HiHome className="text-lg" />, label: "Home" },
            { href: "/progress", icon: <HiChartBar className="text-lg" />, label: "Progress" },
          ].map(({ href, icon, label }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} aria-label={label}>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.88 }}
                  className={`p-2.5 rounded-full border transition-colors ${
                    active
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  {icon}
                </motion.div>
              </Link>
            )
          })}
        </div>

        {/* Right side: bell + user avatar */}
        <div className="flex items-center gap-2">
          {/* Bell */}
          {userId && (
            <div className="relative">
              <motion.button
                onClick={toggleOpen}
                className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.88 }}
                aria-label="Notifications"
              >
                <HiBell className="text-lg" />
              </motion.button>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center pointer-events-none">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </div>
          )}

          {/* User avatar + menu */}
          <div className="relative">
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute bottom-14 right-0 bg-white dark:bg-[#1a1828] rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-3 min-w-44"
                >
                  {profile ? (
                    <>
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 px-1 mb-0.5">
                        {profile.display_name}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 px-1 mb-3 capitalize">
                        {profile.role}
                      </p>
                      <Link
                        href="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 px-1 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors mb-1"
                      >
                        <HiCog6Tooth className="text-base" />
                        Settings
                      </Link>
                      <button
                        onClick={async () => {
                          setShowUserMenu(false)
                          await signOut()
                        }}
                        className="w-full flex items-center gap-2 text-sm text-red-500 hover:text-red-600 px-1 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <HiArrowRightOnRectangle className="text-base" />
                        Sign out
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 px-1">Not signed in</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              onClick={() => !loading && setShowUserMenu((v) => !v)}
              className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60 border-2 border-indigo-300 dark:border-indigo-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm"
              whileHover={loading ? {} : { scale: 1.08 }}
              whileTap={loading ? {} : { scale: 0.9 }}
              aria-label="User menu"
              disabled={loading}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                initial ?? <HiUser className="text-base" />
              )}
            </motion.button>
          </div>
        </div>
      </nav>
    </>
  )
}

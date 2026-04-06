"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import {
  HiSun, HiMoon, HiUser, HiArrowRightOnRectangle,
  HiHome, HiChartBar, HiBell, HiCog6Tooth, HiXMark,
  HiArrowsPointingOut,
} from "react-icons/hi2"
import { useTheme } from "@/components/ThemeProvider"
import { useAuthContext } from "@/context/AuthContext"
import { useNotificationsStore } from "@/store/notifications"
import type { AppNotification } from "@/lib/types"

const PREVIEW_COUNT = 3

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
  const router = useRouter()

  const { items, isOpen, setItems, markRead, markAllRead, toggleOpen, setOpen, unreadCount } =
    useNotificationsStore()

  useEffect(() => {
    if (!userId) return
    fetch(`/api/notifications?user_id=${userId}`)
      .then((r) => r.json())
      .then(({ notifications }: { notifications: AppNotification[] }) => setItems(notifications))
      .catch(() => {})
  }, [userId, setItems])

  // Close sheet when navigating away
  useEffect(() => { setOpen(false) }, [pathname, setOpen])

  const initial = profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : null
  const unread = unreadCount()
  const previewItems = items.slice(0, PREVIEW_COUNT)
  const hasMore = items.length > PREVIEW_COUNT

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

  function openFullPage() {
    setOpen(false)
    router.push("/notifications")
  }

  const navLinks = [
    { href: "/",         icon: HiHome,     label: "Home"     },
    { href: "/progress", icon: HiChartBar, label: "Progress" },
  ]

  const navHeight = "calc(4rem + env(safe-area-inset-bottom, 0px))"

  return (
    <>
      {/* Click-outside overlays */}
      {showUserMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
      )}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Notifications bottom sheet ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.9 }}
            className="fixed inset-x-0 z-50 bg-white dark:bg-[#13121f] rounded-t-3xl shadow-2xl border-t border-zinc-200 dark:border-zinc-800 flex flex-col"
            style={{ bottom: navHeight, maxHeight: "60vh" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <HiBell className="text-indigo-500 dark:text-indigo-400 text-base" />
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Notifications</span>
                {unread > 0 && (
                  <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                    {unread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={openFullPage}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  aria-label="Open full notifications page"
                >
                  <HiArrowsPointingOut className="text-base" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <HiXMark className="text-base" />
                </button>
              </div>
            </div>

            {/* Notification list — max 3 */}
            <div className="overflow-y-auto flex-1">
              {items.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-8">
                  No notifications yet
                </p>
              ) : (
                previewItems.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={`w-full text-left px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 transition-colors ${
                      notif.is_read ? "bg-transparent" : "bg-indigo-50/50 dark:bg-indigo-950/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold leading-snug ${
                          notif.is_read ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-800 dark:text-zinc-100"
                        }`}>
                          {notif.title}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-snug line-clamp-1">
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

            {/* "See all" footer */}
            {(hasMore || items.length > 0) && (
              <button
                onClick={openFullPage}
                className="shrink-0 w-full py-3 text-xs font-semibold text-indigo-500 dark:text-indigo-400 border-t border-zinc-100 dark:border-zinc-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors"
              >
                {hasMore
                  ? `See all ${items.length} notifications`
                  : "Open notifications page"}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Nav bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0e0d16]/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 flex items-stretch"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Nav links */}
        <div className="flex flex-1 items-start pt-2">
          {navLinks.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} className="flex-1" data-onboarding={href === "/progress" ? "nav-progress" : undefined}>
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className="flex flex-col items-center gap-0.5 py-1"
                >
                  <Icon
                    className={`text-[22px] transition-colors ${
                      active
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  />
                  <span className={`text-[10px] font-medium transition-colors leading-none ${
                    active ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500"
                  }`}>
                    {label}
                  </span>
                  {active && (
                    <motion.span
                      layoutId="nav-dot"
                      className="w-1 h-1 rounded-full bg-indigo-500 dark:bg-indigo-400 mt-0.5"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.div>
              </Link>
            )
          })}

          {/* Notifications bell */}
          {userId && (
            <button className="flex-1" onClick={toggleOpen} data-onboarding="nav-alerts">
              <motion.div
                whileTap={{ scale: 0.88 }}
                className="flex flex-col items-center gap-0.5 py-1 relative"
              >
                <div className="relative">
                  <HiBell className={`text-[22px] transition-colors ${
                    isOpen ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500"
                  }`} />
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium leading-none transition-colors ${
                  isOpen ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500"
                }`}>
                  Alerts
                </span>
                {isOpen && (
                  <motion.span
                    layoutId="nav-dot"
                    className="w-1 h-1 rounded-full bg-indigo-500 dark:bg-indigo-400 mt-0.5"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.div>
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="w-px my-2 bg-zinc-200 dark:bg-zinc-800" />

        {/* Profile tile */}
        <div className="relative flex items-start pt-2 px-4">
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute bottom-[calc(100%+0.5rem)] right-0 bg-white dark:bg-[#1a1828] rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-3 min-w-48 z-10"
              >
                {profile && (
                  <div className="px-1 mb-3">
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{profile.display_name}</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 capitalize">{profile.role}</p>
                  </div>
                )}

                {/* Theme toggle */}
                <button
                  onClick={toggle}
                  className="w-full flex items-center justify-between px-2 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors mb-1"
                >
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    {theme === "dark" ? "Light mode" : "Dark mode"}
                  </span>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={theme}
                      initial={{ rotate: -40, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 40, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-base text-amber-500 dark:text-amber-400"
                    >
                      {theme === "dark" ? <HiSun /> : <HiMoon />}
                    </motion.span>
                  </AnimatePresence>
                </button>

                <div className="h-px bg-zinc-100 dark:bg-zinc-800 mx-1 mb-1" />

                <Link
                  href="/notifications"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 px-2 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                >
                  <HiBell className="text-base shrink-0" />
                  Notifications
                  {unread > 0 && (
                    <span className="ml-auto text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                      {unread}
                    </span>
                  )}
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 px-2 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                >
                  <HiCog6Tooth className="text-base shrink-0" />
                  Settings
                </Link>

                {userId && (
                  <button
                    onClick={async () => { setShowUserMenu(false); await signOut() }}
                    className="w-full flex items-center gap-2 text-xs text-red-500 hover:text-red-600 px-2 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <HiArrowRightOnRectangle className="text-base shrink-0" />
                    Sign out
                  </button>
                )}

                {!userId && !loading && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 px-1">Not signed in</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={() => !loading && setShowUserMenu((v) => !v)}
            whileTap={loading ? {} : { scale: 0.9 }}
            disabled={loading}
            aria-label="Profile"
            data-onboarding="nav-profile"
            className="flex flex-col items-center gap-0.5"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
              showUserMenu
                ? "bg-indigo-600 dark:bg-indigo-500 border-indigo-500 dark:border-indigo-400 text-white"
                : "bg-indigo-100 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400"
            }`}>
              {loading
                ? <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                : (initial ?? <HiUser className="text-sm" />)
              }
            </div>
            <span className={`text-[10px] font-medium leading-none transition-colors ${
              showUserMenu
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-zinc-400 dark:text-zinc-500"
            }`}>
              {profile?.display_name?.split(" ")[0] ?? "Profile"}
            </span>
          </motion.button>
        </div>
      </nav>
    </>
  )
}

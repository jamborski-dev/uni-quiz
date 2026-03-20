"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { HiSun, HiMoon, HiUser, HiArrowRightOnRectangle, HiHome, HiChartBar } from "react-icons/hi2"
import { useTheme } from "@/components/ThemeProvider"
import { useAuthContext } from "@/context/AuthContext"

export default function BottomNav() {
  const { theme, toggle } = useTheme()
  const { profile, signOut } = useAuthContext()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const pathname = usePathname()

  const initial = profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : null

  return (
    <>
      {showUserMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
      )}

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
            onClick={() => setShowUserMenu((v) => !v)}
            className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60 border-2 border-indigo-300 dark:border-indigo-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            aria-label="User menu"
          >
            {initial ?? <HiUser className="text-base" />}
          </motion.button>
        </div>
      </nav>
    </>
  )
}

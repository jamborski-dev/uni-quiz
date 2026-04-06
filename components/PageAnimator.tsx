"use client"

import { useNotificationsStore } from "@/store/notifications"

/**
 * Wraps page content with bottom padding for the fixed nav, and
 * applies a subtle upward nudge when the notifications sheet is open.
 */
export default function PageAnimator({ children }: { children: React.ReactNode }) {
  const isOpen = useNotificationsStore((s) => s.isOpen)

  return (
    <div
      style={{
        paddingBottom: "calc(4rem + env(safe-area-inset-bottom, 0px))",
        transform: isOpen ? "translateY(-14px) scale(0.99)" : "translateY(0) scale(1)",
        transformOrigin: "top center",
        transition: "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  )
}

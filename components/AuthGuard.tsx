"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuthContext } from "@/context/AuthContext"

const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "false"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { userId, loading } = useAuthContext()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!AUTH_ENABLED) return
    if (!loading && !userId && pathname !== "/login" && pathname !== "/auth/callback") {
      router.replace("/login")
    }
  }, [loading, userId, pathname, router])

  if (!AUTH_ENABLED) return <>{children}</>

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-400/30 border-t-indigo-500 animate-spin" />
      </div>
    )
  }

  if (!userId && pathname !== "/login" && pathname !== "/auth/callback") return null

  return <>{children}</>
}

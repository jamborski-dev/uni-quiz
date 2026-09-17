"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

// Placeholder — Supabase magic-link auth removed.
// BetterAuth will be wired in here in a future session.
export default function LoginPage() {
  const { userId, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // Dev user is set — go straight home
      if (userId) router.replace("/")
    }
  }, [userId, loading, router])

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <p className="text-zinc-400 dark:text-zinc-600 text-sm">
        Auth not configured — running in local mode.
      </p>
    </main>
  )
}

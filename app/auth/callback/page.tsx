"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase-auth"

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-indigo-400/30 border-t-indigo-500 animate-spin" />
    </div>
  )
}

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const client = getSupabaseClient()
    if (!client) {
      router.replace("/")
      return
    }

    const code = searchParams.get("code")

    if (code) {
      // PKCE flow
      client.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error || !data.session) {
          router.replace("/login")
        } else {
          router.replace("/")
        }
      }).catch(() => {
        router.replace("/login")
      })
      return
    }

    // Implicit flow - tokens arrive in the URL hash (#access_token=...)
    // The Supabase browser client detects the hash automatically via onAuthStateChange
    const hash = typeof window !== "undefined" ? window.location.hash : ""
    if (hash.includes("access_token")) {
      // Wait for the Supabase client to process the hash fragment
      setTimeout(() => router.replace("/"), 1500)
    } else {
      router.replace("/")
    }
  }, [searchParams, router])

  return <Spinner />
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CallbackHandler />
    </Suspense>
  )
}

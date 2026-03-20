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
        router.replace(error || !data.session ? "/login" : "/")
      }).catch(() => router.replace("/login"))
      return
    }

    // Implicit flow: Supabase auto-processes the hash on client init and clears it.
    // The session is already stored - just check it exists and redirect.
    client.auth.getSession().then(({ data }) => {
      router.replace(data.session ? "/" : "/login")
    })
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

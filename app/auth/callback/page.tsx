"use client"

import { Suspense, useEffect, useState } from "react"
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
  const [status, setStatus] = useState("Processing...")

  useEffect(() => {
    const client = getSupabaseClient()
    if (!client) {
      setStatus("No Supabase client")
      setTimeout(() => router.replace("/"), 2000)
      return
    }

    const code = searchParams.get("code")
    const hash = typeof window !== "undefined" ? window.location.hash : ""

    setStatus(`code=${code ? "present" : "none"} hash=${hash ? "present" : "none"}`)

    if (code) {
      setStatus(`PKCE flow - exchanging code...`)
      client.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error || !data.session) {
          setStatus(`Error: ${error?.message ?? "no session"}`)
          setTimeout(() => router.replace("/login"), 2000)
        } else {
          setStatus(`Signed in as ${data.session.user.email}`)
          setTimeout(() => router.replace("/"), 1000)
        }
      }).catch((err) => {
        setStatus(`Threw: ${err?.message}`)
        setTimeout(() => router.replace("/login"), 2000)
      })
      return
    }

    if (hash.includes("access_token")) {
      setStatus("Implicit flow - waiting for Supabase to process hash...")
      setTimeout(() => router.replace("/"), 2000)
    } else {
      setStatus(`No code or hash found - redirecting`)
      setTimeout(() => router.replace("/"), 2000)
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-6 h-6 rounded-full border-2 border-indigo-400/30 border-t-indigo-500 animate-spin" />
      <p className="text-sm text-zinc-400 font-mono px-4 text-center">{status}</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CallbackHandler />
    </Suspense>
  )
}

"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase-auth"

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get("code")
    if (!code) {
      router.replace("/")
      return
    }

    const client = getSupabaseClient()
    if (!client) {
      router.replace("/")
      return
    }

    client.auth.exchangeCodeForSession(code).then(() => {
      router.replace("/")
    }).catch(() => {
      router.replace("/login")
    })
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-indigo-400/30 border-t-indigo-500 animate-spin" />
    </div>
  )
}

import { Suspense } from "react"

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-400/30 border-t-indigo-500 animate-spin" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}

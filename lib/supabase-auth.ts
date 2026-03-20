// Supabase Auth helpers for magic link sign-in.
// Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient | null {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || url.trim() === "") {
    console.warn("NEXT_PUBLIC_SUPABASE_URL is not set - auth is disabled")
    return null
  }
  _client = createClient(url, key!)
  return _client
}

export function getSupabaseClient(): SupabaseClient | null {
  return getClient()
}

export async function signInWithMagicLink(email: string): Promise<{ error: string | null }> {
  const client = getClient()
  if (!client) return { error: "Auth is not configured (NEXT_PUBLIC_SUPABASE_URL missing)" }

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined,
    },
  })
  return { error: error?.message ?? null }
}

export async function signOut(): Promise<void> {
  const client = getClient()
  if (!client) return
  await client.auth.signOut()
}

export async function getSession() {
  const client = getClient()
  if (!client) return null
  const { data } = await client.auth.getSession()
  return data.session
}

export function onAuthStateChange(callback: (userId: string | null) => void) {
  const client = getClient()
  if (!client) {
    // No client - immediately signal not loading with null user
    setTimeout(() => callback(null), 0)
    return { unsubscribe: () => {} }
  }
  const { data } = client.auth.onAuthStateChange((event, session) => {
    // INITIAL_SESSION fires once client finishes reading from localStorage
    // SIGNED_IN fires on new sign-in
    // SIGNED_OUT fires on sign-out
    if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
      callback(session?.user?.id ?? null)
    }
  })
  return { unsubscribe: () => data.subscription.unsubscribe() }
}

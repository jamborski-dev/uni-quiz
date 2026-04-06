"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { onAuthStateChange, signOut as authSignOut, getSupabaseClient } from "@/lib/supabase-auth"
import type { Profile } from "@/lib/types"

// When set in .env.local, skips Supabase auth entirely and uses this fixed user.
// NEXT_PUBLIC_DEV_USER_ID is never set in Vercel env vars, so this is always
// null in real production. The hostname guard is a belt-and-suspenders check.
const DEV_USER_ID = process.env.NEXT_PUBLIC_DEV_USER_ID ?? null

function isLocalHost(): boolean {
  if (typeof window === "undefined") return false
  const { hostname } = window.location
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    // LAN private ranges: 10.x, 172.16–31.x, 192.168.x
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^192\.168\./.test(hostname)
  )
}

interface AuthState {
  userId: string | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  userId: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function useAuthContext() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`/api/profile?user_id=${uid}`)
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile ?? null)
      }
    } catch {
      // Profile fetch failure is non-fatal
    }
  }, [])

  useEffect(() => {
    // Dev bypass — skip Supabase entirely and use the fixed dev user.
    // Active whenever NEXT_PUBLIC_DEV_USER_ID is set AND the app is running
    // on a local/LAN address (localhost, 127.x, 10.x, 172.16–31.x, 192.168.x).
    if (DEV_USER_ID && isLocalHost()) {
      setUserId(DEV_USER_ID)
      fetchProfile(DEV_USER_ID).then(() => setLoading(false))
      return
    }

    const client = getSupabaseClient()

    if (!client) {
      setLoading(false)
      return
    }

    // Subscribe first so we catch INITIAL_SESSION and SIGNED_IN before getUser() resolves
    const { unsubscribe } = onAuthStateChange((uid) => {
      setUserId(uid)
      if (uid) fetchProfile(uid)
      else setProfile(null)
    })

    // getUser() validates token against server and drives setLoading(false).
    // It awaits full client initialisation (including token refresh if needed),
    // so it is the reliable signal that auth state is settled.
    client.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        fetchProfile(user.id)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [fetchProfile])

  const handleSignOut = useCallback(async () => {
    await authSignOut()
    setUserId(null)
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (userId) await fetchProfile(userId)
  }, [userId, fetchProfile])

  return (
    <AuthContext.Provider value={{ userId, profile, loading, signOut: handleSignOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

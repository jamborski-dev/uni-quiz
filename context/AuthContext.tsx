"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { onAuthStateChange, signOut as authSignOut, getSupabaseClient } from "@/lib/supabase-auth"
import type { Profile } from "@/lib/types"

interface AuthState {
  userId: string | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  userId: null,
  profile: null,
  loading: true,
  signOut: async () => {},
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
    const client = getSupabaseClient()

    if (!client) {
      setLoading(false)
      return
    }

    // getUser() validates token against server - reliable regardless of timing
    client.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        fetchProfile(user.id)
      }
      setLoading(false)
    })

    // Subscribe to future auth changes (sign in/out)
    const { unsubscribe } = onAuthStateChange((uid) => {
      setUserId(uid)
      if (uid) fetchProfile(uid)
      else setProfile(null)
    })

    return unsubscribe
  }, [fetchProfile])

  const handleSignOut = useCallback(async () => {
    await authSignOut()
    setUserId(null)
    setProfile(null)
  }, [])

  return (
    <AuthContext.Provider value={{ userId, profile, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  )
}

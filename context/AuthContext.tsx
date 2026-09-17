"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { Profile } from "@/lib/types"

// Local dev: use the fixed dev user when NEXT_PUBLIC_DEV_USER_ID is set.
// Production auth (BetterAuth) will be wired in later.
const DEV_USER_ID = process.env.NEXT_PUBLIC_DEV_USER_ID ?? null

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
      // non-fatal
    }
  }, [])

  useEffect(() => {
    if (DEV_USER_ID) {
      setUserId(DEV_USER_ID)
      fetchProfile(DEV_USER_ID).then(() => setLoading(false))
      return
    }
    // No auth configured — BetterAuth will be wired in here later
    setLoading(false)
  }, [fetchProfile])

  const handleSignOut = useCallback(async () => {
    // BetterAuth sign-out will go here
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

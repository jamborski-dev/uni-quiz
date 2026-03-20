"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { onAuthStateChange, signOut as authSignOut, getSession } from "@/lib/supabase-auth"
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
    // Initialise from existing session
    getSession().then((session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      if (uid) fetchProfile(uid)
      setLoading(false)
    })

    // Listen for auth state changes
    const { unsubscribe } = onAuthStateChange((uid) => {
      setUserId(uid)
      if (uid) {
        fetchProfile(uid)
      } else {
        setProfile(null)
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

  return (
    <AuthContext.Provider value={{ userId, profile, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  )
}

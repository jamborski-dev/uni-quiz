"use client"

import { useAuthContext } from "@/context/AuthContext"

/**
 * Returns { userId, profile, loading, signOut }.
 * userId is null when not authenticated or when Supabase is not configured.
 */
export function useAuth() {
  return useAuthContext()
}

"use client"

import { usePWA } from "@/hooks/usePWA"

/**
 * Mounts the PWA lifecycle hook (install prompt, SW update detection).
 * Renders nothing — side-effects only.
 */
export default function PWAManager() {
  usePWA()
  return null
}

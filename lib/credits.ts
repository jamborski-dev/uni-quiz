const CACHE_KEY = "anthropic_credits_check"
const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

interface CreditCache {
  available: boolean
  checkedAt: number
}

export async function checkAnthropicCredits(): Promise<boolean> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const cache: CreditCache = JSON.parse(raw)
      if (Date.now() - cache.checkedAt < TTL_MS) {
        return cache.available
      }
    }
  } catch {
    // localStorage not available
  }

  try {
    const res = await fetch("/api/credits-check")
    const { available } = (await res.json()) as { available: boolean }
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ available, checkedAt: Date.now() }))
    } catch {
      // ignore storage errors
    }
    return available
  } catch {
    return false
  }
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { HiEnvelope, HiArrowRight, HiCheckCircle } from "react-icons/hi2"
import { signInWithMagicLink } from "@/lib/supabase-auth"
import { useAuth } from "@/hooks/useAuth"
import PageTransition from "@/components/PageTransition"

export default function LoginPage() {
  const { userId, loading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && userId) {
      router.replace("/")
    }
  }, [userId, loading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setError(null)

    // Check if email is registered before sending magic link
    const checkRes = await fetch("/api/auth/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    })
    const { allowed } = await checkRes.json()

    if (!allowed) {
      setSubmitting(false)
      setError("This email is not registered. Contact the app owner to request access.")
      return
    }

    const { error: authError } = await signInWithMagicLink(email.trim())
    setSubmitting(false)
    if (authError) {
      setError(authError)
    } else {
      setSent(true)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <motion.div
          className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      </main>
    )
  }

  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col items-center justify-center p-5">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-zinc-800 dark:text-zinc-100 tracking-tight">
              TM111 Quiz
            </h1>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">
              Sign in to track your progress
            </p>
          </div>

          <div className="bg-white dark:bg-[#1a1828] rounded-2xl shadow-sm border border-zinc-200 dark:border-[#2d2a40] p-6">
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="sent"
                  className="text-center py-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                >
                  <HiCheckCircle className="text-4xl text-emerald-500 dark:text-emerald-400 mx-auto mb-3" />
                  <p className="font-semibold text-zinc-800 dark:text-zinc-100 mb-1">
                    Check your email
                  </p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    A login link has been sent to{" "}
                    <span className="font-medium text-zinc-600 dark:text-zinc-300">{email}</span>
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <HiEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-base" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                        className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-100 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.p
                      className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.p>
                  )}

                  <motion.button
                    type="submit"
                    disabled={submitting || !email.trim()}
                    className="w-full bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    whileHover={!submitting ? { scale: 1.02 } : {}}
                    whileTap={!submitting ? { scale: 0.97 } : {}}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    {submitting ? (
                      <motion.div
                        className="w-4 h-4 rounded-full border-2 border-white/60 border-t-white"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <>
                        Send magic link
                        <HiArrowRight className="text-base" />
                      </>
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-4">
            Enter your registered email to receive a sign-in link
          </p>
        </motion.div>
      </main>
    </PageTransition>
  )
}

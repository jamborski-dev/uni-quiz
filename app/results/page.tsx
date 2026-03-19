"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import PageTransition from "@/components/PageTransition"
import ResultsScreen from "@/components/ResultsScreen"

function ResultsContent() {
  const params = useSearchParams()
  const score = Number(params.get("score") ?? 0)
  const total = Number(params.get("total") ?? 0)
  const block = params.get("block") ?? "all"

  return <ResultsScreen score={score} total={total} block={block} />
}

export default function ResultsPage() {
  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col items-center justify-center p-5 max-w-lg mx-auto">
        <Suspense fallback={<p className="text-zinc-400 text-sm">Loading results…</p>}>
          <ResultsContent />
        </Suspense>
      </main>
    </PageTransition>
  )
}

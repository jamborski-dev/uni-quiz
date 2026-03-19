import BlockSelector from "@/components/BlockSelector"
import PageTransition from "@/components/PageTransition"

export default function Home() {
  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col items-center justify-center p-5">
        <h1 className="text-3xl font-extrabold mb-1 text-zinc-800 dark:text-zinc-100 tracking-tight">
          TM111 Quiz
        </h1>
        <p className="text-zinc-400 dark:text-zinc-500 mb-10 text-sm tracking-wide">
          Introduction to Computing · Open University
        </p>
        <BlockSelector />
      </main>
    </PageTransition>
  )
}

import type { ReactNode } from "react"

// Supports: **bold**, `code`, <u>underline</u>
// Everything else renders as plain text.
// Intentionally lightweight - no external dependencies.

const pattern = /(\*\*[^*]+\*\*|`[^`]+`|<u>[^<]+<\/u>)/g

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let key = 0
  let match: RegExpExecArray | null

  pattern.lastIndex = 0
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    const chunk = match[0]
    if (chunk.startsWith("**")) {
      nodes.push(
        <strong key={key++} className="font-semibold text-zinc-800 dark:text-zinc-100">
          {chunk.slice(2, -2)}
        </strong>
      )
    } else if (chunk.startsWith("`")) {
      nodes.push(
        <code
          key={key++}
          className="bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono"
        >
          {chunk.slice(1, -1)}
        </code>
      )
    } else if (chunk.startsWith("<u>")) {
      nodes.push(
        <u key={key++} className="underline decoration-indigo-400 dark:decoration-indigo-500 underline-offset-2">
          {chunk.slice(3, -4)}
        </u>
      )
    }
    lastIndex = match.index + chunk.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

export default function MarkdownText({ children, className }: { children: string; className?: string }) {
  return <span className={className}>{parseInline(children)}</span>
}

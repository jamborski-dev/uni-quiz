import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Lightweight keep-alive endpoint.
 * Called by a Vercel Cron Job once a week to prevent Supabase
 * from pausing the project due to inactivity.
 *
 * SELECT 1 costs essentially nothing — no table scan, no index hit.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true, ts: new Date().toISOString() })
  } catch (err) {
    console.error("[ping] DB unreachable:", err)
    return NextResponse.json({ ok: false }, { status: 503 })
  }
}

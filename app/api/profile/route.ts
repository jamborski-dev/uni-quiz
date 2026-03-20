import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("user_id")
  if (!userId) return NextResponse.json({ profile: null })

  try {
    const profile = await prisma.profile.findUnique({ where: { id: userId } })
    return NextResponse.json({ profile })
  } catch {
    return NextResponse.json({ profile: null })
  }
}

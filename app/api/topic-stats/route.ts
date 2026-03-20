import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("user_id")

  if (!userId) {
    return NextResponse.json({ stats: [] })
  }

  try {
    const stats = await prisma.topicStats.findMany({
      where: { user_id: userId },
    })
    return NextResponse.json({ stats })
  } catch {
    return NextResponse.json({ stats: [] })
  }
}

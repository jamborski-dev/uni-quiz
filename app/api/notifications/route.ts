import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("user_id")
  if (!userId) return NextResponse.json({ notifications: [] })

  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 50,
    })
    return NextResponse.json({ notifications })
  } catch {
    return NextResponse.json({ notifications: [] })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, id, all } = body as {
      user_id: string
      id?: string
      all?: boolean
    }

    if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 })

    if (all) {
      await prisma.notification.updateMany({
        where: { user_id, is_read: false },
        data: { is_read: true },
      })
    } else if (id) {
      await prisma.notification.update({
        where: { id },
        data: { is_read: true },
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}

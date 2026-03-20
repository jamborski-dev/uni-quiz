import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  const { email } = await request.json()

  if (!email) return NextResponse.json({ allowed: false })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) return NextResponse.json({ allowed: false })

  try {
    const admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: { users } } = await admin.auth.admin.listUsers()
    const allowed = users.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )

    return NextResponse.json({ allowed })
  } catch {
    return NextResponse.json({ allowed: false })
  }
}

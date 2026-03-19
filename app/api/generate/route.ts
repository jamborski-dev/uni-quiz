import { NextRequest, NextResponse } from "next/server";

// Stub — AI generation will be implemented in Phase 2
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { message: "AI question generation not yet implemented." },
    { status: 501 }
  );
}

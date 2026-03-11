import { type NextRequest, NextResponse } from "next/server"
import { corsHeaders, withCors } from "../_lib/cors"

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders })
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || typeof email !== "string") {
      return withCors(NextResponse.json({ error: "Email is required" }, { status: 400 }))
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return withCors(NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 }))
    }
    // Stubbed auth
    const token = "fake-token-123"
    return withCors(NextResponse.json({ token }))
  } catch {
    return withCors(NextResponse.json({ error: "Invalid JSON" }, { status: 400 }))
  }
}

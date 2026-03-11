import { type NextRequest, NextResponse } from "next/server"
import { corsHeaders, withCors } from "../_lib/cors"

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders })
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const role = formData.get("role")
    const difficulty = formData.get("difficulty")
    const media =
      (formData.get("media") as File | null) ||
      (formData.get("audio") as File | null) ||
      (formData.get("video") as File | null)

    if (!role || !difficulty) {
      return withCors(NextResponse.json({ success: false, message: "Missing role or difficulty" }, { status: 400 }))
    }
    if (!media || !(media instanceof File) || media.size === 0) {
      return withCors(NextResponse.json({ success: false, message: "Missing media blob" }, { status: 400 }))
    }

    return withCors(NextResponse.json({ success: true, message: "Answer received." }))
  } catch {
    return withCors(NextResponse.json({ success: false, message: "Failed to parse request" }, { status: 400 }))
  }
}

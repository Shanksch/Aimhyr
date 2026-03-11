import { NextResponse } from "next/server"
import { corsHeaders, withCors } from "../_lib/cors"

const ROLES = [
  "Data Analyst",
  "AI/ML Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Cyber Security Engineer",
  "General Computer Science Engineer",
] as const

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders })
}

export async function GET() {
  return withCors(NextResponse.json({ roles: ROLES }))
}

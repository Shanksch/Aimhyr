import { type NextRequest, NextResponse } from "next/server"
import { getReport, getSession, saveSession } from "../../../_lib/store"

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const report = getReport(params.id)
    if (!report) {
      return NextResponse.json({ error: "report not found" }, { status: 404 })
    }
    const session = getSession(report.session_id)
    if (!session) {
      return NextResponse.json({ error: "session not found" }, { status: 404 })
    }
    session.downloaded_flag = true
    saveSession(session)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "unknown error" }, { status: 500 })
  }
}

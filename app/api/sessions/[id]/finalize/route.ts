import { type NextRequest, NextResponse } from "next/server"
import { finalizeSessionReport, getSession, saveSession } from "../../../_lib/store"

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getSession(params.id)
    if (!session) {
      return NextResponse.json({ error: "session not found" }, { status: 404 })
    }

    // force finalization
    session.status = "finalized"
    const report = finalizeSessionReport(session)
    saveSession(session)

    return NextResponse.json({ report_id: report.report_id })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "unknown error" }, { status: 500 })
  }
}

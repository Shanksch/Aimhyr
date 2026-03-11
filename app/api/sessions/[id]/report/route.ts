import { type NextRequest, NextResponse } from "next/server"
import { finalizeSessionReport, getReport, getSession } from "../../../_lib/store"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getSession(params.id)
    if (!session) {
      return NextResponse.json({ error: "session not found" }, { status: 404 })
    }

    // If a report is not saved, compute an ephemeral one
    if (!session.report_saved_flag) {
      const report = finalizeSessionReport(session)
      // note: finalizeSessionReport sets report_saved_flag = true to persist; but keep session.status as-is
      // For ephemeral behavior, you could clone without persisting; here we persist so subsequent GET is stable.
      return NextResponse.json(report)
    }

    if (!session.report_id) {
      return NextResponse.json({ error: "report unavailable" }, { status: 404 })
    }

    const report = getReport(session.report_id)
    if (!report) {
      return NextResponse.json({ error: "report not found" }, { status: 404 })
    }
    return NextResponse.json(report)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "unknown error" }, { status: 500 })
  }
}

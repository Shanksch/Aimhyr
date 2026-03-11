import type { Session, ReportSummary, ScoreRecord } from "../_lib/types"

const sessions = new Map<string, Session>()
const reports = new Map<string, ReportSummary>()

// naive quota tracker: counts per user_id or "anonymous"
const userSessionCount = new Map<string, number>()
const FREE_QUOTA = 9999 // adjust later; stubbed effectively unlimited

export function canStartSession(userId?: string | null): { allowed: boolean; remaining: number } {
  const key = userId ?? "anonymous"
  const used = userSessionCount.get(key) ?? 0
  const remaining = Math.max(FREE_QUOTA - used, 0)
  return { allowed: remaining > 0, remaining }
}

export function incrementUserSessions(userId?: string | null) {
  const key = userId ?? "anonymous"
  userSessionCount.set(key, (userSessionCount.get(key) ?? 0) + 1)
}

export function saveSession(session: Session) {
  sessions.set(session.session_id, session)
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id)
}

export function finalizeSessionReport(session: Session): ReportSummary {
  // compute averages
  const totals = session.scores.reduce(
    (acc, s: ScoreRecord) => {
      acc.clarity += s.scores.clarity
      acc.relevance += s.scores.relevance
      acc.correctness += s.scores.correctness
      acc.total += s.total
      acc.count += 1
      return acc
    },
    { clarity: 0, relevance: 0, correctness: 0, total: 0, count: 0 },
  )

  const avg = totals.count
    ? {
        clarity: +(totals.clarity / totals.count).toFixed(2),
        relevance: +(totals.relevance / totals.count).toFixed(2),
        correctness: +(totals.correctness / totals.count).toFixed(2),
        total: +(totals.total / totals.count).toFixed(2),
      }
    : { clarity: 0, relevance: 0, correctness: 0, total: 0 }

  const followupsAnswered = session.transcripts.filter((t) => {
    const q = session.questions.find((q) => q.id === t.question_id)
    return q?.kind === "followup"
  }).length

  const mainAnswered = session.transcripts.length - followupsAnswered

  const report_id = session.report_id ?? crypto.randomUUID()
  const report: ReportSummary = {
    report_id,
    session_id: session.session_id,
    role: session.role,
    difficulty: session.difficulty,
    total_questions_answered: session.transcripts.length,
    main_questions_answered: mainAnswered,
    followups_answered: followupsAnswered,
    average_scores: avg,
    created_at: new Date().toISOString(),
    finalized: session.status === "finalized",
  }

  reports.set(report_id, report)
  session.report_id = report_id
  session.report_saved_flag = true
  saveSession(session)
  return report
}

export function getReport(reportId: string): ReportSummary | undefined {
  return reports.get(reportId)
}

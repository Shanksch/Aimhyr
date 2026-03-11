import { type NextRequest, NextResponse } from "next/server"
import type { StartSessionBody, StartSessionResponse, Session } from "../../_lib/types"
import { canStartSession, incrementUserSessions, saveSession } from "../../_lib/store"
import { generateMainQuestions } from "../../_lib/questions"

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000"

async function getQuestionsFromPython(role: string, difficulty: string) {
  try {
    const response = await fetch(`${PYTHON_API_URL}/api/questions/main`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, difficulty }),
      timeout: 10000,
    })

    if (!response.ok) {
      console.warn("Python API question fetch failed, using fallback")
      return null
    }

    const data = await response.json()
    return data.questions?.map((q: any, index: number) => ({
      id: q.id,
      text: q.text,
      kind: "main" as const,
      index,
    })) ?? null
  } catch (err) {
    console.warn("Python API not available, using fallback questions:", err)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as StartSessionBody

    if (!body || !body.role || !body.difficulty) {
      return NextResponse.json({ error: "role and difficulty are required" }, { status: 400 })
    }

    const quota = canStartSession(body.user_id ?? null)
    if (!quota.allowed) {
      return NextResponse.json({ quota_exceeded: true }, { status: 403 })
    }

    // Try to get questions from Python API, fallback to local generation
    let questions = await getQuestionsFromPython(body.role, body.difficulty)
    if (!questions) {
      questions = generateMainQuestions(body.role, body.difficulty)
    }
    const session: Session = {
      session_id: crypto.randomUUID(),
      user_id: body.user_id ?? null,
      role: body.role,
      difficulty: body.difficulty,
      created_at: new Date().toISOString(),
      status: "active",
      current_question_index: 0,
      follow_up_count_for_current_question: 0,
      questions,
      transcripts: [],
      scores: [],
      video_metrics: [],
      report_saved_flag: false,
      downloaded_flag: false,
    }

    incrementUserSessions(session.user_id ?? null)
    saveSession(session)

    const first = questions[0]
    const resp: StartSessionResponse = {
      session_id: session.session_id,
      first_question: { id: first.id, text: first.text },
      quota_exceeded: false,
    }
    return NextResponse.json(resp)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "unknown error" }, { status: 500 })
  }
}

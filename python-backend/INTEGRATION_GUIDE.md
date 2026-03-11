"""
Integration utilities for connecting Next.js frontend with Python backend.
Add these to your Next.js API routes.
"""

# Example: app/api/sessions/[id]/answer/route.ts

"""
import { type NextRequest, NextResponse } from "next/server"
import { getSession, saveSession } from "../../../_lib/store"
import type { AnswerResponse, ScoreRecord, TranscriptRecord } from "../../../_lib/types"

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getSession(params.id)
    if (!session) {
      return NextResponse.json({ error: "session not found" }, { status: 404 })
    }

    const form = await req.formData()
    const question_id = String(form.get("question_id") ?? "")
    const transcript = String(form.get("transcript") ?? "")
    
    // Call Python API for scoring
    const scoreResponse = await fetch(`${PYTHON_API_URL}/api/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript,
        question: session.questions.find(q => q.id === question_id)?.text ?? "",
        role: session.role,
        difficulty: session.difficulty
      })
    })

    if (!scoreResponse.ok) {
      throw new Error("Failed to score answer")
    }

    const scoreData = await scoreResponse.json()

    // Save score record
    const scoreRecord: ScoreRecord = {
      question_id,
      scores: scoreData.scores,
      total: scoreData.total
    }
    session.scores.push(scoreRecord)

    // Generate follow-up if applicable
    let nextQuestion = null
    if (session.follow_up_count_for_current_question < 2) {
      const followupResponse = await fetch(
        `${PYTHON_API_URL}/api/questions/followup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            original_question: session.questions.find(q => q.id === question_id)?.text,
            answer_transcript: transcript,
            role: session.role,
            difficulty: session.difficulty,
            followup_count: session.follow_up_count_for_current_question + 1
          })
        }
      )

      if (followupResponse.ok) {
        const followupData = await followupResponse.json()
        nextQuestion = {
          question_id: followupData.question_id,
          question_text: followupData.question_text,
          parent_id: question_id,
          kind: "followup" as const
        }
        session.questions.push(nextQuestion)
        session.follow_up_count_for_current_question += 1
      }
    }

    saveSession(session)

    const resp: AnswerResponse = {
      transcript: { question_id, text: transcript },
      scores_partial: scoreRecord,
      next: nextQuestion
        ? { question_id: nextQuestion.question_id, question_text: nextQuestion.question_text }
        : { finalized: true, report_id: "temp-report-id" }
    }

    return NextResponse.json(resp)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "unknown error" }, { status: 500 })
  }
}
"""

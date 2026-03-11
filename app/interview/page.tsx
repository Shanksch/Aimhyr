"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Recorder } from "@/components/recorder"

type Props = {
  searchParams: { role?: string; difficulty?: string }
}

export default function InterviewPage({ searchParams }: Props) {
  const role = searchParams.role ?? "Unknown Role"
  const difficulty = searchParams.difficulty ?? "Medium"

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questionId, setQuestionId] = useState<string | null>(null)
  const [questionText, setQuestionText] = useState<string>("Loading question…")
  const [finalized, setFinalized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let aborted = false
    ;(async () => {
      try {
        setError(null)
        setFinalized(false)
        setQuestionText("Loading question…")
        const res = await fetch("/api/sessions/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, difficulty }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || "Failed to start session")
        if (aborted) return
        setSessionId(json.session_id)
        setQuestionId(json.first_question?.id ?? null)
        setQuestionText(json.first_question?.text ?? "Question is ready.")
      } catch (e: any) {
        if (!aborted) {
          setError(e?.message || "Failed to start interview session.")
          setQuestionText("Unable to load question.")
        }
      }
    })()
    return () => {
      aborted = true
    }
  }, [role, difficulty])

  const handleAnswered = (next: {
    question_id?: string
    question_text?: string
    finalized?: boolean
    report_id?: string
  }) => {
    if (next?.finalized) {
      setFinalized(true)
      setQuestionId(null)
      setQuestionText("Session complete. Thank you!")
    } else if (next?.question_id && next?.question_text) {
      setQuestionId(next.question_id)
      setQuestionText(next.question_text)
    }
  }

  return (
    <AuthGuard>
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-6 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Interview</CardTitle>
            <CardDescription>
              Role: <span className="font-medium">{role}</span> · Difficulty:{" "}
              <span className="font-medium">{difficulty}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <section className="grid gap-2">
              <h3 className="font-semibold">{finalized ? "Finished" : "Current Question"}</h3>
              <p className="text-pretty">{questionText}</p>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </section>

            {!finalized && sessionId && (
              <section className="grid gap-4">
                <Recorder sessionId={sessionId} questionId={questionId} onAnswered={handleAnswered} />
              </section>
            )}
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  )
}

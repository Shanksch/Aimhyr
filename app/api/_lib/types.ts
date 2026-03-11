export type SessionStatus = "active" | "finalized"

export type QuestionKind = "main" | "followup"

export interface QuestionRecord {
  id: string
  text: string
  kind: QuestionKind
  parent_id?: string // set for followups (main question id)
  index?: number // index within main questions (0..5 for main)
}

export interface TranscriptRecord {
  question_id: string
  text: string
  words?: number
  language?: string
}

export interface ScoreDetail {
  clarity: number
  relevance: number
  correctness: number
}

export interface ScoreRecord {
  question_id: string
  scores: ScoreDetail
  total: number
}

export interface VideoMetricRecord {
  question_id: string
  eye_contact: number // 0..1
  speaking_rate: number // words/min estimate
}

export interface Session {
  session_id: string
  user_id?: string | null
  role: string
  difficulty: string
  created_at: string
  status: SessionStatus
  current_question_index: number // points to current main question index
  follow_up_count_for_current_question: number // how many followups used for current main question
  questions: QuestionRecord[] // includes main and generated followups
  transcripts: TranscriptRecord[]
  scores: ScoreRecord[]
  video_metrics: VideoMetricRecord[]
  report_saved_flag: boolean
  downloaded_flag: boolean
  report_id?: string
}

export interface ReportSummary {
  report_id: string
  session_id: string
  role: string
  difficulty: string
  total_questions_answered: number
  main_questions_answered: number
  followups_answered: number
  average_scores: {
    clarity: number
    relevance: number
    correctness: number
    total: number
  }
  created_at: string
  finalized: boolean
}

export interface StartSessionBody {
  user_id?: string
  role: string
  difficulty: string
}

export interface StartSessionResponse {
  session_id: string
  first_question: { id: string; text: string }
  quota_exceeded?: boolean
}

export interface AnswerResponse {
  transcript: TranscriptRecord
  scores_partial: ScoreRecord
  next: { question_id: string; question_text: string } | { finalized: true; report_id: string }
}

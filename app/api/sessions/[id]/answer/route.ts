import { type NextRequest, NextResponse } from "next/server"
import { getSession, saveSession } from "../../../_lib/store"
import type { AnswerResponse, ScoreRecord, TranscriptRecord } from "../../../_lib/types"
import { generateFollowup } from "../../../_lib/questions"
import { getFFmpeg, fetchFile } from "../../../_lib/ffmpeg"
import { parseWavMeta } from "../../../_lib/wav-meta"
import { ensureDir, guessExtFromMime, relPath, sessionMediaDir, tsName, writeFileSafe } from "../../../_lib/fs-utils"

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000"

async function scoreAnswerWithPython(
  transcript: string,
  question: string,
  role: string,
  difficulty: string
): Promise<ScoreRecord | null> {
  try {
    const response = await fetch(`${PYTHON_API_URL}/api/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript,
        question,
        role,
        difficulty,
      }),
      timeout: 15000,
    })

    if (!response.ok) {
      console.warn("Python scoring API failed, using fallback")
      return null
    }

    const data = await response.json()
    return {
      question_id: "", // Will be set by caller
      scores: {
        clarity: data.scores?.clarity ?? 0.7,
        relevance: data.scores?.relevance ?? 0.7,
        correctness: data.scores?.correctness ?? 0.7,
      },
      total: data.total ?? 0.7,
    }
  } catch (err) {
    console.warn("Python API not available, using fallback scoring:", err)
    return null
  }
}

async function generateFollowupWithPython(
  originalQuestion: string,
  answerTranscript: string,
  role: string,
  difficulty: string,
  followupCount: number
): Promise<{ id: string; text: string } | null> {
  try {
    const response = await fetch(`${PYTHON_API_URL}/api/questions/followup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        original_question: originalQuestion,
        answer_transcript: answerTranscript,
        role,
        difficulty,
        followup_count: followupCount,
      }),
      timeout: 15000,
    })

    if (!response.ok) {
      console.warn("Python followup API failed, using fallback")
      return null
    }

    const data = await response.json()
    return {
      id: data.question_id,
      text: data.question_text,
    }
  } catch (err) {
    console.warn("Python followup API not available:", err)
    return null
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getSession(params.id)
    if (!session) {
      return NextResponse.json({ error: "session not found" }, { status: 404 })
    }
    if (session.status !== "active") {
      return NextResponse.json({ error: "session finalized" }, { status: 400 })
    }

    const form = await req.formData()
    const question_id = String(form.get("question_id") ?? "")
    if (!question_id) {
      return NextResponse.json({ error: "question_id is required" }, { status: 400 })
    }

    const audioBlob = (form.get("audio_blob") as File | null) ?? null
    const videoBlob = (form.get("video_blob") as File | null) ?? null
    const mediaFallback = (form.get("media") as File | null) ?? null
    const file: File | null = audioBlob || videoBlob || mediaFallback
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "audio or video file is required" }, { status: 400 })
    }

    const mediaDir = sessionMediaDir(session.session_id)
    await ensureDir(mediaDir)
    const stamp = tsName()
    const originalExt = guessExtFromMime(file.type, "bin")
    const originalName = `${stamp}.original.${originalExt}`
    const originalAbs = `${mediaDir}/${originalName}`

    const u8 = new Uint8Array(await file.arrayBuffer())
    await writeFileSafe(originalAbs, u8)

    const ffmpeg = await getFFmpeg()
    const inputName = `in.${originalExt}`
    ffmpeg.FS("writeFile", inputName, await fetchFile(u8))

    let normalizedWavU8: Uint8Array | null = null
    const normalizedWavName = `${stamp}.wav`
    const normalizedWavAbs = `${mediaDir}/${normalizedWavName}`
    let videoMp4U8: Uint8Array | null = null
    const videoMp4Name = `${stamp}.mp4`
    const videoMp4Abs = `${mediaDir}/${videoMp4Name}`
    let snapshotU8: Uint8Array | null = null
    const snapshotName = `${stamp}.jpg`
    const snapshotAbs = `${mediaDir}/${snapshotName}`

    try {
      if (videoBlob && !audioBlob) {
        await ffmpeg.run("-i", inputName, "-vn", "-ac", "1", "-ar", "16000", "-f", "wav", "out.wav")
        normalizedWavU8 = ffmpeg.FS("readFile", "out.wav")

        try {
          await ffmpeg.run(
            "-i",
            inputName,
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-movflags",
            "+faststart",
            "out.mp4",
          )
          videoMp4U8 = ffmpeg.FS("readFile", "out.mp4")
        } catch {
          videoMp4U8 = null
        }

        try {
          await ffmpeg.run("-i", inputName, "-ss", "00:00:00.500", "-frames:v", "1", "snap.jpg")
          snapshotU8 = ffmpeg.FS("readFile", "snap.jpg")
        } catch {
          snapshotU8 = null
        }
      } else {
        await ffmpeg.run("-i", inputName, "-ac", "1", "-ar", "16000", "-f", "wav", "out.wav")
        normalizedWavU8 = ffmpeg.FS("readFile", "out.wav")
      }
    } catch (err: any) {
      return NextResponse.json({ error: `Transcoding failed: ${err?.message ?? "unknown error"}` }, { status: 400 })
    }

    if (!normalizedWavU8) {
      return NextResponse.json({ error: "Failed to produce normalized audio" }, { status: 400 })
    }

    let wavMeta
    try {
      wavMeta = parseWavMeta(normalizedWavU8)
    } catch (err: any) {
      return NextResponse.json({ error: `Invalid WAV output: ${err?.message ?? "unknown error"}` }, { status: 400 })
    }

    if (wavMeta.duration > 60.0) {
      return NextResponse.json(
        {
          error: "Recording too long",
          message: "Each answer must be 60 seconds or less. Please keep it concise and try again.",
          duration: +wavMeta.duration.toFixed(2),
        },
        { status: 413 },
      )
    }

    await writeFileSafe(normalizedWavAbs, normalizedWavU8)
    if (videoMp4U8) await writeFileSafe(videoMp4Abs, videoMp4U8)
    if (snapshotU8) await writeFileSafe(snapshotAbs, snapshotU8)

    const meta = {
      session_id: session.session_id,
      question_id,
      original: {
        filename: (file as File).name ?? originalName,
        mime: (file as File).type ?? "application/octet-stream",
        size: (file as File).size,
        saved_path: relPath(originalAbs),
      },
      normalized_audio: {
        filename: normalizedWavName,
        saved_path: relPath(normalizedWavAbs),
        sample_rate: wavMeta.sampleRate,
        channels: wavMeta.channels,
        duration: +wavMeta.duration.toFixed(2),
      },
      video: videoMp4U8
        ? {
            filename: videoMp4Name,
            saved_path: relPath(videoMp4Abs),
          }
        : null,
      snapshot: snapshotU8
        ? {
            filename: snapshotName,
            saved_path: relPath(snapshotAbs),
          }
        : null,
      created_at: new Date().toISOString(),
    const metaAbs = `${mediaDir}/${stamp}.json`
    await writeFileSafe(metaAbs, Buffer.from(JSON.stringify(meta, null, 2)))

    const transcript: TranscriptRecord = {
      question_id,
      text: `Transcribed (stub) response for question ${question_id}`,
      words: 16,
      language: "en",
    }
    session.transcripts.push(transcript)

    // Get the question text for scoring
    const currentQuestion = session.questions.find((q) => q.id === question_id)
    const questionText = currentQuestion?.text ?? "Interview question"

    // Try to score with Python API, fallback to random
    let scores: ScoreRecord | null = await scoreAnswerWithPython(
      transcript.text,
      questionText,
      session.role,
      session.difficulty
    )

    if (!scores) {
      // Fallback: generate random scores
      scores = {
        question_id,
        scores: {
          clarity: +(0.7 + Math.random() * 0.3).toFixed(2),
          relevance: +(0.7 + Math.random() * 0.3).toFixed(2),
          correctness: +(0.7 + Math.random() * 0.3).toFixed(2),
        },
        total: +(0.7 + Math.random() * 0.3).toFixed(2),
      }
    }

    scores.question_id = question_id
    session.scores.push(scores)

    if (videoBlob) {
      session.video_metrics.push({
        question_id,
        eye_contact: +(0.6 + Math.random() * 0.4).toFixed(2) as unknown as number,
        speaking_rate: Math.round(120 + Math.random() * 40),
      })
    }

    const currentMain = session.questions.find((q) => q.kind === "main" && q.index === session.current_question_index)
    let next: AnswerResponse["next"]

    if (currentMain) {
      if (session.follow_up_count_for_current_question < 2) {
        // Try to generate follow-up with Python API, fallback to local
        let fu = await generateFollowupWithPython(
          questionText,
          transcript.text,
          session.role,
          session.difficulty,
          session.follow_up_count_for_current_question
        )

        if (!fu) {
          // Fallback to local generation
          const localFu = generateFollowup(currentMain.id, session.follow_up_count_for_current_question)
          fu = { id: localFu.id, text: localFu.text }
        }

        const followupRecord = {
          id: fu.id,
          text: fu.text,
          kind: "followup" as const,
          parent_id: currentMain.id,
        }
        session.questions.push(followupRecord)
        session.follow_up_count_for_current_question += 1
        next = { question_id: fu.id, question_text: fu.text }
      } else {
        session.current_question_index += 1
        session.follow_up_count_for_current_question = 0
        const nextMain = session.questions.find((q) => q.kind === "main" && q.index === session.current_question_index)
        if (nextMain) {
          next = { question_id: nextMain.id, question_text: nextMain.text }
        } else {
          session.status = "finalized"
          const report_id = crypto.randomUUID()
          session.report_saved_flag = false
          session.report_id = report_id
          next = { finalized: true, report_id }
        }
      }
    } else {
      session.status = "finalized"
      const report_id = crypto.randomUUID()
      session.report_saved_flag = false
      session.report_id = report_id
      next = { finalized: true, report_id }
    }

    saveSession(session)

    const resp: AnswerResponse = { transcript, scores_partial: scores, next }
    return NextResponse.json({
      ...resp,
      media: { duration: meta.normalized_audio.duration, sample_rate: wavMeta.sampleRate },
    } as any)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "unknown error" }, { status: 500 })
  }
}

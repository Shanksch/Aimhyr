"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { saveAudioToCache } from "@/lib/audio-cache"

type Mode = "audio" | "av"

type RecorderProps = {
  sessionId: string
  questionId: string | null
  onAnswered?: (next: { question_id?: string; question_text?: string; finalized?: boolean; report_id?: string }) => void
}

export function Recorder({ sessionId, questionId, onAnswered }: RecorderProps) {
  const [mode, setMode] = useState<Mode>("audio")
  const [recording, setRecording] = useState(false)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [status, setStatus] = useState<string>("")
  const [supported, setSupported] = useState(true)
  const [sending, setSending] = useState(false)
  const [duration, setDuration] = useState<number>(0)

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const playbackVideoRef = useRef<HTMLVideoElement>(null)
  const playbackAudioRef = useRef<HTMLAudioElement>(null)
  const recordingStartRef = useRef<number>(0)

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).MediaRecorder || !navigator.mediaDevices?.getUserMedia) {
      setSupported(false)
    }
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getConstraints = (): MediaStreamConstraints =>
    mode === "audio" ? { audio: true, video: false } : { audio: true, video: true }

  const startRecording = async () => {
    try {
      setStatus("")
      setBlob(null)
      setDuration(0)
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
        setBlobUrl(null)
      }
      const stream = await navigator.mediaDevices.getUserMedia(getConstraints())
      mediaStreamRef.current = stream

      const mimeType = mode === "audio" ? "audio/webm;codecs=opus" : "video/webm;codecs=vp9,opus"
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined })
      mediaRecorderRef.current = mr
      chunksRef.current = []
      recordingStartRef.current = Date.now()

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }

      mr.onstop = () => {
        const type = mode === "audio" ? "audio/webm" : "video/webm"
        const recordedBlob = new Blob(chunksRef.current, { type })
        const dur = (Date.now() - recordingStartRef.current) / 1000
        setDuration(dur)
        setBlob(recordedBlob)

        const url = URL.createObjectURL(recordedBlob)
        setBlobUrl(url)

        mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
        mediaStreamRef.current = null
      }

      if (mode === "av" && videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true
        videoRef.current.play().catch(() => {})
      }

      mr.start(100)
      setRecording(true)
    } catch (err) {
      console.error("[Recorder] start error", err)
      setStatus("Could not start recording. Please check microphone/camera permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const playBack = async () => {
    if (!blobUrl || !blob) return
    if (mode === "audio") {
      playbackAudioRef.current?.play().catch(() => {})
    } else {
      playbackVideoRef.current?.play().catch(() => {})
    }
  }

  const sendRecording = async () => {
    if (!blob || !questionId) return
    setSending(true)
    setStatus("Uploading…")
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

      const fd = new FormData()
      fd.append("question_id", questionId)
      fd.append("timestamp", timestamp)
      fd.append("duration", duration.toString())
      const filename = mode === "audio" ? "answer-audio.webm" : "answer-video.webm"
      fd.append(mode === "audio" ? "audio_blob" : "video_blob", blob, filename)

      const headers: HeadersInit = {}
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      if (token) headers["Authorization"] = `Bearer ${token}`

      const res = await fetch(`/api/sessions/${sessionId}/answer`, {
        method: "POST",
        body: fd,
        headers,
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.message || json?.error || "Upload failed")
      }

      await saveAudioToCache({
        sessionId,
        timestamp,
        duration: json?.media?.duration || duration,
        sampleRate: json?.media?.sample_rate || 16000,
        mode,
        blob,
      })

      const dur = json?.media?.duration
      const sr = json?.media?.sample_rate
      setStatus(
        `Answer received${dur ? ` · ${dur.toFixed ? dur.toFixed(2) : dur}s` : ""}${
          sr ? ` · ${sr} Hz` : ""
        }. ${json?.next?.finalized ? "Session finalized." : "Next question ready."}`,
      )
      onAnswered?.(json?.next ?? {})
      await new Promise((r) => setTimeout(r, 400))
    } catch (err: any) {
      console.error("[Recorder] send error:", err)
      setStatus(err?.message || "Failed to send recording")
    } finally {
      setSending(false)
    }
  }

  const onToggleMode = (checked: boolean) => {
    if (recording) stopRecording()
    setMode(checked ? "av" : "audio")
    setBlob(null)
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl)
      setBlobUrl(null)
    }
    setStatus("")
  }

  if (!supported) {
    return (
      <div className="rounded-lg border p-4 text-sm text-red-600">
        Your browser does not support MediaRecorder or getUserMedia. Please try a modern browser (Chrome, Edge,
        Firefox).
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="grid">
          <span className="font-medium">Recording Mode</span>
          <span className="text-sm text-muted-foreground">{mode === "audio" ? "Audio only" : "Audio + Video"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="mode">Audio</Label>
          <Switch id="mode" checked={mode === "av"} onCheckedChange={onToggleMode} />
          <Label htmlFor="mode">Audio + Video</Label>
        </div>
      </div>

      {mode === "av" && (
        <div className="rounded-lg border p-3">
          <video ref={videoRef} className="w-full aspect-video bg-black rounded" playsInline />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={startRecording} disabled={recording}>
          Start Recording
        </Button>
        <Button variant="secondary" onClick={stopRecording} disabled={!recording}>
          Stop Recording
        </Button>
        <Button variant="outline" onClick={playBack} disabled={!blobUrl}>
          Playback
        </Button>
        <Button variant="default" onClick={sendRecording} disabled={!blob || sending}>
          {sending ? "Sending…" : "Send"}
        </Button>
      </div>

      <div className="grid gap-2">
        {mode === "audio" ? (
          <audio ref={playbackAudioRef} controls className="w-full" src={blobUrl ?? undefined} key={blobUrl} />
        ) : (
          <video
            ref={playbackVideoRef}
            controls
            className="w-full aspect-video bg-black rounded"
            playsInline
            src={blobUrl ?? undefined}
            key={blobUrl}
          />
        )}
      </div>

      {status && <p className="text-sm text-emerald-600">{status}</p>}
    </div>
  )
}

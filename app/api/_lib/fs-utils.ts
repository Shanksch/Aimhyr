import { promises as fs } from "fs"
import path from "path"

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

export async function writeFileSafe(filePath: string, data: Uint8Array | Buffer) {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, data)
  return filePath
}

export function tsName(date = new Date()) {
  // e.g., 2025-09-03T12-30-45-123Z
  return date.toISOString().replace(/[:.]/g, "-")
}

export function sessionMediaDir(sessionId: string) {
  return path.join(process.cwd(), "data", "sessions", sessionId, "media")
}

export function relPath(absPath: string) {
  return absPath.replace(process.cwd(), "").replace(/\\/g, "/")
}

export function guessExtFromMime(mime: string | undefined, fallback: string) {
  if (!mime) return fallback
  if (mime.includes("webm")) return "webm"
  if (mime.includes("wav")) return "wav"
  if (mime.includes("mp4")) return "mp4"
  if (mime.includes("ogg")) return "ogg"
  if (mime.includes("mpeg")) return "mpg"
  if (mime.includes("x-matroska")) return "mkv"
  if (mime.includes("quicktime")) return "mov"
  if (mime.includes("x-msvideo")) return "avi"
  if (mime.includes("aac")) return "aac"
  return fallback
}

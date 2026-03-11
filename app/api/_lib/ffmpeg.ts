import { createFFmpeg, fetchFile, type FFmpeg } from "@ffmpeg/ffmpeg"

let ffmpegPromise: Promise<FFmpeg> | null = null

export async function getFFmpeg() {
  if (!ffmpegPromise) {
    const ffmpeg = createFFmpeg({ log: false })
    ffmpegPromise = (async () => {
      if (!ffmpeg.isLoaded()) {
        await ffmpeg.load()
      }
      return ffmpeg
    })()
  }
  return ffmpegPromise
}

export { fetchFile }

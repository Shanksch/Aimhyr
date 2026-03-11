export function parseWavMeta(wav: Uint8Array) {
  const dv = new DataView(wav.buffer, wav.byteOffset, wav.byteLength)

  const riff = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3))
  const wave = String.fromCharCode(dv.getUint8(8), dv.getUint8(9), dv.getUint8(10), dv.getUint8(11))
  if (riff !== "RIFF" || wave !== "WAVE") {
    throw new Error("Not a WAV file")
  }

  let offset = 12
  let sampleRate = 0
  let channels = 0
  let bitsPerSample = 16
  let dataSize = 0

  while (offset + 8 <= wav.byteLength) {
    const id = String.fromCharCode(
      dv.getUint8(offset + 0),
      dv.getUint8(offset + 1),
      dv.getUint8(offset + 2),
      dv.getUint8(offset + 3),
    )
    const size = dv.getUint32(offset + 4, true)
    const next = offset + 8 + size

    if (id === "fmt ") {
      const audioFormat = dv.getUint16(offset + 8, true)
      channels = dv.getUint16(offset + 10, true)
      sampleRate = dv.getUint32(offset + 12, true)
      bitsPerSample = dv.getUint16(offset + 22, true)
      if (audioFormat !== 1) throw new Error("Unsupported WAV format (expected PCM)")
    } else if (id === "data") {
      dataSize = size
      break
    }
    offset = next
  }

  if (!sampleRate || !dataSize || !channels) {
    throw new Error("Invalid WAV: missing metadata")
  }

  const bytesPerSample = bitsPerSample / 8
  const totalSamples = dataSize / (channels * bytesPerSample)
  const duration = totalSamples / sampleRate

  return { sampleRate, channels, bitsPerSample, duration }
}

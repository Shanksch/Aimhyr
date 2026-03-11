// Audio caching system using IndexedDB for persistent blob storage
const DB_NAME = "interview_audio_cache"
const STORE_NAME = "audio_recordings"
const DB_VERSION = 1

export interface CachedRecording {
  id: string // unique key: `${sessionId}_${timestamp}`
  sessionId: string
  timestamp: string
  duration: number
  sampleRate: number
  mode: "audio" | "av" // recording mode
  blob: Blob
  blobUrl?: string
  createdAt: Date
}

let db: IDBDatabase | null = null

async function initDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      db = req.result
      resolve(db)
    }

    req.onupgradeneeded = (e) => {
      const database = (e.target as IDBOpenDBRequest).result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" })
        store.createIndex("sessionId", "sessionId", { unique: false })
        store.createIndex("timestamp", "timestamp", { unique: false })
      }
    }
  })
}

export async function saveAudioToCache(recording: Omit<CachedRecording, "id" | "createdAt">): Promise<string> {
  const database = await initDB()
  const id = `${recording.sessionId}_${recording.timestamp}`

  const cached: CachedRecording = {
    ...recording,
    id,
    createdAt: new Date(),
    blobUrl: URL.createObjectURL(recording.blob),
  }

  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORE_NAME], "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const req = store.put(cached)

    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      console.log("[v0] Audio cached with ID:", id)
      resolve(id)
    }
  })
}

export async function getAudioFromCache(id: string): Promise<CachedRecording | null> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORE_NAME], "readonly")
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(id)

    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const record = req.result as CachedRecording | undefined
      if (record && !record.blobUrl) {
        record.blobUrl = URL.createObjectURL(record.blob)
      }
      resolve(record || null)
    }
  })
}

export async function getAllAudioForSession(sessionId: string): Promise<CachedRecording[]> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORE_NAME], "readonly")
    const store = tx.objectStore(STORE_NAME)
    const index = store.index("sessionId")
    const req = index.getAll(sessionId)

    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const records = (req.result as CachedRecording[]) || []
      records.forEach((r) => {
        if (!r.blobUrl) {
          r.blobUrl = URL.createObjectURL(r.blob)
        }
      })
      resolve(records)
    }
  })
}

export async function deleteAudioFromCache(id: string): Promise<void> {
  const database = await initDB()
  const record = await getAudioFromCache(id)
  if (record?.blobUrl) {
    URL.revokeObjectURL(record.blobUrl)
  }

  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORE_NAME], "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(id)

    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve()
  })
}

export async function clearSessionCache(sessionId: string): Promise<void> {
  const records = await getAllAudioForSession(sessionId)
  for (const record of records) {
    await deleteAudioFromCache(record.id)
  }
}

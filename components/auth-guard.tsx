"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true"
    if (!loggedIn) {
      router.replace("/login")
      return
    }
    setReady(true)
  }, [router])

  if (!ready) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-muted-foreground">Checking authentication…</p>
      </div>
    )
  }
  return <>{children}</>
}

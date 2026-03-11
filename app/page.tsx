"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    // if already logged in, go to role selection; else go to login
    const loggedIn = typeof window !== "undefined" && localStorage.getItem("loggedIn") === "true"
    router.replace(loggedIn ? "/select-role" : "/login")
  }, [router])

  return (
    <main className="min-h-dvh flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting…</p>
    </main>
  )
}

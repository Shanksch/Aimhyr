"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function AppHeader() {
  const router = useRouter()
  const onLogout = () => {
    localStorage.removeItem("loggedIn")
    router.replace("/login")
  }

  return (
    <header className="w-full border-b">
      <div className="mx-auto max-w-4xl px-4 h-14 flex items-center justify-between">
        <div className="font-semibold">AI Interview Simulator</div>
        <Button variant="outline" size="sm" onClick={onLogout} aria-label="Log out">
          Log out
        </Button>
      </div>
    </header>
  )
}

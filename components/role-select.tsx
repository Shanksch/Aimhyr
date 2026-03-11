"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const FALLBACK_ROLES = [
  "Data Analyst",
  "AI/ML Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Cyber Security Engineer",
  "General Computer Science Engineer",
] as const

const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function RoleSelect() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<string | null>(null)

  const { data, error, isLoading } = useSWR<{ roles: string[] }>("/api/roles", fetcher)
  const roles = data?.roles?.length ? data.roles : FALLBACK_ROLES

  const onContinue = () => {
    if (!role || !difficulty) return
    const params = new URLSearchParams({ role, difficulty })
    router.push(`/interview?${params.toString()}`)
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4">
        <h2 className="text-xl font-semibold text-balance">Choose your role</h2>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading roles…</p>
        ) : error ? (
          <p className="text-sm text-red-600">Failed to load roles. Showing defaults.</p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {roles.map((r) => {
            const active = role === r
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={[
                  "text-left rounded-lg border p-4 transition",
                  active ? "border-blue-600 ring-2 ring-blue-600" : "hover:bg-muted",
                ].join(" ")}
                aria-pressed={active}
                aria-label={`Select role ${r}`}
              >
                <div className="font-medium">{r}</div>
                <p className="text-sm text-muted-foreground mt-1">Practice tailored questions for the {r} track.</p>
              </button>
            )
          })}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold text-balance">Difficulty</h2>
        <RadioGroup
          className="grid sm:grid-cols-3 gap-3"
          value={difficulty ?? undefined}
          onValueChange={(v) => setDifficulty(v)}
        >
          {DIFFICULTIES.map((d) => (
            <div key={d} className="flex items-center gap-2 rounded-lg border p-3">
              <RadioGroupItem id={`diff-${d}`} value={d} />
              <Label htmlFor={`diff-${d}`}>{d}</Label>
            </div>
          ))}
        </RadioGroup>
      </section>

      <div className="flex items-center justify-end">
        <Button onClick={onContinue} disabled={!role || !difficulty}>
          Continue
        </Button>
      </div>
    </div>
  )
}

import type { QuestionRecord } from "./types"

export function generateMainQuestions(role: string, difficulty: string): QuestionRecord[] {
  // stub generator: 6 role/difficulty-targeted prompts
  const prompts = [
    `Describe your experience relevant to ${role} at a ${difficulty} level.`,
    `What is a challenging ${role} problem you solved, and how?`,
    `How do you approach collaboration and communication as a ${role}?`,
    `Walk me through a recent project as a ${role} and your key contributions.`,
    `How do you handle ambiguity and prioritization in ${role} responsibilities?`,
    `What does growth look like for you in a ${role} role over the next year?`,
  ]

  return prompts.map((text, i) => ({
    id: crypto.randomUUID(),
    text,
    kind: "main" as const,
    index: i,
  }))
}

export function generateFollowup(mainId: string, count: number): QuestionRecord {
  // count is 0-based follow-up number for a main question
  const nth = count + 1
  return {
    id: crypto.randomUUID(),
    text: `Follow-up ${nth}: Could you expand on your previous answer?`,
    kind: "followup",
    parent_id: mainId,
  }
}

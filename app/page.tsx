"use client"

import type { AppState, ChatState } from "@/lib/types"

const INITIAL_CHAT: ChatState = {
  messages: [],
  status: "idle",
}

const INITIAL_STATE: AppState = {
  step: "landing",
  mode: null,
  savedPolicies: [],
  currentPolicyId: null,
  policy_a: null,
  policy_b: null,
  result: null,
  error: null,
  chat: INITIAL_CHAT,
}

// Placeholder shell — real landing + branching UI is built in INS-17.
export default function Home() {
  void INITIAL_STATE
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold">Insurance Compare — v2 in progress</h1>
    </main>
  )
}

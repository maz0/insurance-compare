"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LandingScreen } from "@/components/landing/LandingScreen"
import { SavedPolicyList } from "@/components/policies/SavedPolicyList"
import { UploadStep } from "@/components/upload/UploadStep"
import { LoadingScreen } from "@/components/loading/LoadingScreen"
import { AnalysisView } from "@/components/analysis/AnalysisView"
import {
  LANDING,
  MANAGE_POLICIES,
  COMPOSE_ADHOC,
  COMPOSE_OFFER_PLACEHOLDER,
} from "@/lib/constants"
import { PRODUCT_LABELS } from "@/lib/products"
import type {
  AppState,
  AppStep,
  ChatState,
  PolicyInput,
  AnalysisResult,
  AppError,
  SavedPolicy,
} from "@/lib/types"

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

async function fileToBase64(file: File): Promise<{ base64: string; media_type: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const commaIndex = dataUrl.indexOf(",")
      const base64 = dataUrl.slice(commaIndex + 1)
      resolve({ base64, media_type: file.type })
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function serializePolicy(input: PolicyInput) {
  const files = await Promise.all(input.files.map(fileToBase64))
  return { name: input.name, text: input.text, files }
}

export default function Home() {
  const [state, setState] = useState<AppState>(INITIAL_STATE)

  // Load saved policies on mount via GET /api/policies
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/policies")
        if (!res.ok) return
        const data = (await res.json()) as SavedPolicy[] | { error?: unknown }
        if (Array.isArray(data)) {
          setState((prev) => ({ ...prev, savedPolicies: data }))
        }
      } catch {
        // Non-fatal: landing still renders with empty list
      }
    }
    void load()
  }, [])

  const goToLanding = useCallback(() => {
    setState((prev) => ({
      ...INITIAL_STATE,
      savedPolicies: prev.savedPolicies,
    }))
  }, [])

  function handleTransition(step: AppStep) {
    setState((prev) => ({ ...prev, step }))
  }

  async function handleAdhocCompare(policyA: PolicyInput, policyB: PolicyInput) {
    setState((prev) => ({
      ...prev,
      step: "analyzing",
      mode: "adhoc",
      policy_a: policyA,
      policy_b: policyB,
    }))

    try {
      const [serialA, serialB] = await Promise.all([
        serializePolicy(policyA),
        serializePolicy(policyB),
      ])

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "adhoc", policy_a: serialA, policy_b: serialB }),
      })

      const json = (await res.json()) as { result?: AnalysisResult; error?: AppError }

      if (json.error) {
        setState((prev) => ({ ...prev, step: "results", result: null, error: json.error ?? null }))
      } else {
        setState((prev) => ({ ...prev, step: "results", result: json.result ?? null, error: null }))
      }
    } catch {
      const err: AppError = { code: "analysis_failed", message: "Analysis failed. Please try again." }
      setState((prev) => ({ ...prev, step: "results", result: null, error: err }))
    }
  }

  const { step, savedPolicies, currentPolicyId, result, error } = state

  // Resolve current policy for compose_offer placeholder (AC3)
  const currentPolicy = currentPolicyId
    ? (savedPolicies.find((p) => p.id === currentPolicyId) ?? null)
    : null

  switch (step) {
    case "landing":
      return (
        <main className="mx-auto max-w-5xl px-6 py-10">
          <LandingScreen savedPolicies={savedPolicies} onTransition={handleTransition} />
        </main>
      )

    case "manage_policies":
      return (
        <main className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex flex-col gap-6">
            <Button type="button" variant="ghost" className="w-fit" onClick={goToLanding}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {MANAGE_POLICIES.backButton}
            </Button>
            <h2 className="text-xl font-bold">{MANAGE_POLICIES.heading}</h2>
            <SavedPolicyList />
          </div>
        </main>
      )

    case "compose_offer":
      // Minimal placeholder — OfferCompose (INS-18) does not yet exist.
      // No analyze POST wiring here — that is INS-18's job.
      return (
        <main className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex flex-col gap-6">
            <Button type="button" variant="ghost" className="w-fit" onClick={goToLanding}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {COMPOSE_OFFER_PLACEHOLDER.backButton}
            </Button>
            <h2 className="text-xl font-bold">{COMPOSE_OFFER_PLACEHOLDER.heading}</h2>
            {currentPolicy !== null && (
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm font-medium text-muted-foreground">
                  {COMPOSE_OFFER_PLACEHOLDER.currentPolicyLabel}
                </p>
                <p className="mt-1 font-semibold">{currentPolicy.name}</p>
                <p className="text-sm text-muted-foreground">{PRODUCT_LABELS[currentPolicy.product]}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{COMPOSE_OFFER_PLACEHOLDER.notice}</p>
          </div>
        </main>
      )

    case "compose_adhoc":
      return (
        <main className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex flex-col gap-6">
            <Button type="button" variant="ghost" className="w-fit" onClick={goToLanding}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {COMPOSE_ADHOC.backButton}
            </Button>
            <h2 className="text-xl font-bold">{COMPOSE_ADHOC.heading}</h2>
            <UploadStep onCompare={handleAdhocCompare} />
          </div>
        </main>
      )

    case "analyzing":
      return (
        <main className="mx-auto max-w-5xl px-6 py-10">
          <LoadingScreen />
        </main>
      )

    case "results":
      return (
        <main className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex flex-col gap-6">
            <Button type="button" variant="ghost" className="w-fit" onClick={goToLanding}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {LANDING.backToLanding}
            </Button>
            <AnalysisView result={result} error={error} />
          </div>
        </main>
      )
  }
}

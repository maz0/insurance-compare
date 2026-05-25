"use client"

import { useState } from "react"
import type { AppState, PolicyInput, AppError } from "@/lib/types"
import type { CategoryKey } from "@/lib/categories"
import { ERROR_MESSAGES } from "@/lib/constants"
import { UploadStep } from "@/components/upload/UploadStep"
import { PriorityStep } from "@/components/priorities/PriorityStep"
import { LoadingScreen } from "@/components/loading/LoadingScreen"
import { AnalysisView } from "@/components/analysis/AnalysisView"

const INITIAL_STATE: AppState = {
  step: "upload",
  policy_a: null,
  policy_b: null,
  priorities: [],
  result: null,
  error: null,
}

async function fileToBase64(file: File): Promise<{ base64: string; media_type: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      // dataUrl is "data:<media_type>;base64,<data>"
      const commaIndex = dataUrl.indexOf(",")
      const base64 = dataUrl.slice(commaIndex + 1)
      resolve({ base64, media_type: file.type })
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

async function convertPolicyFiles(
  policy: PolicyInput
): Promise<{ name: string; text: string; files: { base64: string; media_type: string }[] }> {
  const files = await Promise.all(policy.files.map(fileToBase64))
  return { name: policy.name, text: policy.text, files }
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE)

  function handleUploadDone(policyA: PolicyInput, policyB: PolicyInput) {
    setAppState((prev) => ({
      ...prev,
      step: "priorities",
      policy_a: policyA,
      policy_b: policyB,
    }))
  }

  async function handleCompare(priorities: CategoryKey[]) {
    if (!appState.policy_a || !appState.policy_b) return

    setAppState((prev) => ({ ...prev, step: "analyzing", priorities }))

    try {
      const [bodyA, bodyB] = await Promise.all([
        convertPolicyFiles(appState.policy_a),
        convertPolicyFiles(appState.policy_b),
      ])

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policy_a: bodyA,
          policy_b: bodyB,
          priorities,
        }),
      })

      const json = await response.json() as { result?: AppState["result"]; error?: AppError }

      if (!response.ok || json.error) {
        const error: AppError = json.error ?? {
          code: "analysis_failed",
          message: ERROR_MESSAGES.analysis_failed,
        }
        setAppState((prev) => ({ ...prev, step: "results", error }))
        return
      }

      setAppState((prev) => ({
        ...prev,
        step: "results",
        result: json.result ?? null,
        error: null,
      }))
    } catch {
      const error: AppError = {
        code: "analysis_failed",
        message: ERROR_MESSAGES.analysis_failed,
      }
      setAppState((prev) => ({ ...prev, step: "results", error }))
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-8 text-2xl font-bold">Insurance Compare</h1>

      {appState.step === "upload" && (
        <UploadStep onCompare={handleUploadDone} />
      )}

      {appState.step === "priorities" && (
        <PriorityStep onCompare={handleCompare} />
      )}

      {appState.step === "analyzing" && <LoadingScreen />}

      {appState.step === "results" && (
        <AnalysisView result={appState.result} error={appState.error} />
      )}
    </main>
  )
}

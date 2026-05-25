"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PolicyComposer } from "@/components/upload/PolicyComposer"
import type { PolicyInput } from "@/lib/types"

interface UploadStepProps {
  onCompare: (policyA: PolicyInput, policyB: PolicyInput) => void
}

function isProvided(input: { text: string; files: File[] }): boolean {
  return input.text !== "" || input.files.length > 0
}

export function UploadStep({ onCompare }: UploadStepProps) {
  const [nameA, setNameA] = useState("")
  const [textA, setTextA] = useState("")
  const [filesA, setFilesA] = useState<File[]>([])
  const [errorA, setErrorA] = useState<string | null>(null)

  const [nameB, setNameB] = useState("")
  const [textB, setTextB] = useState("")
  const [filesB, setFilesB] = useState<File[]>([])
  const [errorB, setErrorB] = useState<string | null>(null)

  const bothProvided = isProvided({ text: textA, files: filesA }) && isProvided({ text: textB, files: filesB })

  function handleCompare() {
    if (!bothProvided) return
    onCompare(
      { name: nameA, text: textA, files: filesA },
      { name: nameB, text: textB, files: filesB }
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="policy-a-name" className="mb-1 block text-sm font-medium">
              Policy A name
            </label>
            <Input
              id="policy-a-name"
              placeholder="e.g. Gjensidige Travel Plus"
              value={nameA}
              onChange={(e) => setNameA(e.target.value)}
            />
          </div>
          <PolicyComposer
            text={textA}
            files={filesA}
            error={errorA}
            onTextChange={setTextA}
            onFilesChange={setFilesA}
            onError={setErrorA}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="policy-b-name" className="mb-1 block text-sm font-medium">
              Policy B name
            </label>
            <Input
              id="policy-b-name"
              placeholder="e.g. If Travel Premium"
              value={nameB}
              onChange={(e) => setNameB(e.target.value)}
            />
          </div>
          <PolicyComposer
            text={textB}
            files={filesB}
            error={errorB}
            onTextChange={setTextB}
            onFilesChange={setFilesB}
            onError={setErrorB}
          />
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          type="button"
          disabled={!bothProvided}
          onClick={handleCompare}
        >
          Compare
        </Button>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CategoryKey, CATEGORY_LABELS } from "@/lib/categories"
import { PRIORITY_STEP } from "@/lib/constants"

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as CategoryKey[]

const MAX_SELECTIONS = 3

interface PriorityStepProps {
  onCompare: (priorities: CategoryKey[]) => void
}

export function PriorityStep({ onCompare }: PriorityStepProps) {
  const [selected, setSelected] = useState<CategoryKey[]>([])

  function toggle(key: CategoryKey) {
    if (selected.includes(key)) {
      setSelected(selected.filter((k) => k !== key))
    } else {
      if (selected.length >= MAX_SELECTIONS) return
      setSelected([...selected, key])
    }
  }

  function handleCompare() {
    if (selected.length !== MAX_SELECTIONS) return
    onCompare(selected)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">{PRIORITY_STEP.heading}</h2>
        <p className="mt-1 text-sm text-gray-500">{PRIORITY_STEP.subheading}</p>
      </div>

      <p className="text-sm font-medium text-gray-700">
        {PRIORITY_STEP.selectionCount(selected.length)}
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {ALL_CATEGORIES.map((key) => {
          const isSelected = selected.includes(key)
          const isDisabled = !isSelected && selected.length >= MAX_SELECTIONS

          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              disabled={isDisabled}
              className={[
                "rounded-md border px-3 py-2 text-left text-sm transition-colors",
                isSelected
                  ? "border-blue-600 bg-blue-50 text-blue-800 font-medium"
                  : isDisabled
                  ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50",
              ].join(" ")}
            >
              {CATEGORY_LABELS[key]}
            </button>
          )
        })}
      </div>

      <div className="flex justify-center">
        <Button
          type="button"
          disabled={selected.length !== MAX_SELECTIONS}
          onClick={handleCompare}
        >
          {PRIORITY_STEP.compareButton}
        </Button>
      </div>
    </div>
  )
}

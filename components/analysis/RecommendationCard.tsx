"use client"

import type { Recommendation, ComparisonRow } from "@/lib/types"
import type { CategoryKey } from "@/lib/categories"
import { RECOMMENDATION_CARD } from "@/lib/constants"

interface RecommendationCardProps {
  recommendation: Recommendation
  rows: ComparisonRow[]
}

interface VerdictConfig {
  label: string
  containerClass: string
  badgeClass: string
}

function getVerdictConfig(verdict: Recommendation["verdict"]): VerdictConfig {
  switch (verdict) {
    case "switch":
      return {
        label: RECOMMENDATION_CARD.verdictSwitch,
        containerClass: "border-green-200 bg-green-50",
        badgeClass: "bg-green-100 text-green-800 border border-green-300",
      }
    case "stay":
      return {
        label: RECOMMENDATION_CARD.verdictStay,
        containerClass: "border-slate-200 bg-slate-50",
        badgeClass: "bg-slate-100 text-slate-700 border border-slate-300",
      }
    case "too_close":
      return {
        label: RECOMMENDATION_CARD.verdictTooClose,
        containerClass: "border-amber-200 bg-amber-50",
        badgeClass: "bg-amber-100 text-amber-800 border border-amber-300",
      }
  }
}

function scrollToRow(categoryKey: CategoryKey): void {
  const el = document.getElementById(`row-${categoryKey}`)
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" })
  }
}

export function RecommendationCard({ recommendation, rows }: RecommendationCardProps) {
  const rowKeys = new Set(rows.map((r) => r.category_key))
  const { verdict, reasons, summary } = recommendation
  const verdictConfig = getVerdictConfig(verdict)
  const visibleReasons = reasons.slice(0, 3)

  return (
    <div className={`rounded-md border p-6 ${verdictConfig.containerClass}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {RECOMMENDATION_CARD.heading}
        </span>
        <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${verdictConfig.badgeClass}`}>
          {verdictConfig.label}
        </span>
      </div>

      {summary && (
        <p className="text-sm text-foreground mb-5 leading-relaxed">{summary}</p>
      )}

      {visibleReasons.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {RECOMMENDATION_CARD.reasonsHeading}
          </p>
          <ol className="flex flex-col gap-2">
            {visibleReasons.map((reason, index) => {
              const hasRow = rowKeys.has(reason.category_key)
              return (
                <li key={reason.category_key} className="flex items-start gap-3">
                  <span className="flex-shrink-0 text-xs font-semibold text-muted-foreground mt-0.5 w-4">
                    {index + 1}.
                  </span>
                  <span className="text-sm text-foreground flex-1">{reason.description}</span>
                  {hasRow && (
                    <button
                      type="button"
                      onClick={() => scrollToRow(reason.category_key)}
                      className="flex-shrink-0 text-xs text-blue-600 underline underline-offset-2 hover:text-blue-800 transition-colors mt-0.5"
                    >
                      {RECOMMENDATION_CARD.rowLinkLabel}
                    </button>
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}

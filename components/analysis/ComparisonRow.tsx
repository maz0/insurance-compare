"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { ComparisonRow as ComparisonRowData, PolicyEntry } from "@/lib/types"
import { CATEGORY_LABELS } from "@/lib/categories"
import { PresenceBadge } from "@/components/analysis/PresenceBadge"
import { ComparisonBadge } from "@/components/analysis/ComparisonBadge"
import { COMPARISON_TABLE } from "@/lib/constants"

interface ComparisonRowProps {
  row: ComparisonRowData
}

function renderValue(entry: PolicyEntry | null): React.ReactNode {
  if (entry === null) {
    return <span className="text-muted-foreground text-sm">—</span>
  }
  if (entry.uncertain) {
    return (
      <span className="text-muted-foreground text-sm">
        ~{entry.value}
      </span>
    )
  }
  return <span className="text-sm">{entry.value}</span>
}

function renderPage(page: number | null): string {
  if (page === null) return "—"
  return String(page)
}

export function ComparisonRow({ row }: ComparisonRowProps) {
  const [expanded, setExpanded] = useState(false)

  const categoryLabel = CATEGORY_LABELS[row.category_key]

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        className="w-full text-left grid grid-cols-[2fr_1fr_1fr_auto_auto_auto] items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        <span className="font-medium text-sm">{categoryLabel}</span>
        <span>{renderValue(row.policy_a)}</span>
        <span>{renderValue(row.policy_b)}</span>
        <PresenceBadge presence={row.presence} />
        <ComparisonBadge comparison={row.comparison} />
        <span className="text-muted-foreground">
          {expanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="grid grid-cols-2 gap-4 px-4 pb-4 bg-muted/30">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">
              {COMPARISON_TABLE.policyALabel}
            </p>
            {row.policy_a ? (
              <>
                <blockquote className="text-xs italic text-foreground border-l-2 border-border pl-3 mb-1">
                  {row.policy_a.quote}
                </blockquote>
                <p className="text-xs text-muted-foreground">
                  {COMPARISON_TABLE.pageLabel} {renderPage(row.policy_a.page)}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">{COMPARISON_TABLE.noEntry}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">
              {COMPARISON_TABLE.policyBLabel}
            </p>
            {row.policy_b ? (
              <>
                <blockquote className="text-xs italic text-foreground border-l-2 border-border pl-3 mb-1">
                  {row.policy_b.quote}
                </blockquote>
                <p className="text-xs text-muted-foreground">
                  {COMPARISON_TABLE.pageLabel} {renderPage(row.policy_b.page)}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">{COMPARISON_TABLE.noEntry}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

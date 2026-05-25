import type { ComparisonRow as ComparisonRowData } from "@/lib/types"
import { ComparisonRow } from "@/components/analysis/ComparisonRow"
import { COMPARISON_TABLE } from "@/lib/constants"

interface ComparisonTableProps {
  rows: ComparisonRowData[]
}

function hasConfidentEntry(row: ComparisonRowData): boolean {
  const aConfident = row.policy_a !== null && !row.policy_a.uncertain
  const bConfident = row.policy_b !== null && !row.policy_b.uncertain
  return aConfident || bConfident
}

function shouldShowEmptyState(rows: ComparisonRowData[]): boolean {
  if (rows.length === 0) return true
  return !rows.some(hasConfidentEntry)
}

export function ComparisonTable({ rows }: ComparisonTableProps) {
  if (shouldShowEmptyState(rows)) {
    return (
      <div className="rounded-md border border-border bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          {COMPARISON_TABLE.emptyState}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="grid grid-cols-[2fr_1fr_1fr_auto_auto_auto] gap-4 px-4 py-2 bg-muted border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {COMPARISON_TABLE.colCategory}
        </span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {COMPARISON_TABLE.colPolicyA}
        </span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {COMPARISON_TABLE.colPolicyB}
        </span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {COMPARISON_TABLE.colPresence}
        </span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {COMPARISON_TABLE.colComparison}
        </span>
        <span />
      </div>
      <div>
        {rows.map((row) => (
          <ComparisonRow key={row.category_key} row={row} />
        ))}
      </div>
    </div>
  )
}

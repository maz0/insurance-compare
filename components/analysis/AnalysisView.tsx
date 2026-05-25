import type { AnalysisResult, AppError } from "@/lib/types"
import { ComparisonTable } from "@/components/analysis/ComparisonTable"
import { RecommendationCard } from "@/components/analysis/RecommendationCard"

interface AnalysisViewProps {
  result: AnalysisResult | null
  error: AppError | null
}

export function AnalysisView({ result, error }: AnalysisViewProps) {
  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-6 text-red-800">
        <p className="font-semibold">Error</p>
        <p className="mt-1 text-sm">{error.message}</p>
        {/* INS-9: ErrorMessage component plugged in here */}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <ComparisonTable rows={result?.rows ?? []} />

      {result?.recommendation && (
        <RecommendationCard
          recommendation={result.recommendation}
          rows={result.rows}
        />
      )}
    </div>
  )
}

import type { AnalysisResult, AppError } from "@/lib/types"
import { ComparisonTable } from "@/components/analysis/ComparisonTable"
import { RecommendationCard } from "@/components/analysis/RecommendationCard"
import { ErrorMessage } from "@/components/shared/ErrorMessage"

interface AnalysisViewProps {
  result: AnalysisResult | null
  error: AppError | null
}

export function AnalysisView({ result, error }: AnalysisViewProps) {
  if (error) {
    return <ErrorMessage error={error} />
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

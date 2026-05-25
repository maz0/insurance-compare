import type { AnalysisResult, AppError } from "@/lib/types"
import { ComparisonTable } from "@/components/analysis/ComparisonTable"

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

      {/* INS-8: RecommendationCard plugged in here */}
      <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
        Recommendation (INS-8)
      </div>
    </div>
  )
}

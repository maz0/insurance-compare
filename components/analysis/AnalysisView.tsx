import type { AnalysisResult, AppError, ComparisonMode } from "@/lib/types"
import { ComparisonTable } from "@/components/analysis/ComparisonTable"
import { RecommendationCard } from "@/components/analysis/RecommendationCard"
import { ErrorMessage } from "@/components/shared/ErrorMessage"
import { ChatPanel } from "@/components/chat/ChatPanel"

interface FileInput {
  base64: string
  media_type: string
}

interface AnalysisViewProps {
  result: AnalysisResult | null
  error: AppError | null
  documents?: { a: FileInput[]; b: FileInput[] }
  policyNames?: { a: string; b: string }
  mode?: ComparisonMode
}

export function AnalysisView({ result, error, documents, policyNames, mode }: AnalysisViewProps) {
  if (error) {
    return <ErrorMessage error={error} />
  }

  const showChat = result !== null && documents !== undefined && policyNames !== undefined && mode !== undefined

  return (
    <div className="flex flex-col gap-8">
      <ComparisonTable rows={result?.rows ?? []} />

      {result?.recommendation && (
        <RecommendationCard
          recommendation={result.recommendation}
          rows={result.rows}
        />
      )}

      {showChat && (
        <ChatPanel
          result={result}
          documents={documents}
          policyNames={policyNames}
          mode={mode}
        />
      )}
    </div>
  )
}

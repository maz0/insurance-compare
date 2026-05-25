import type { CategoryKey } from "@/lib/categories"

export interface PolicyInput {
  name: string
  text: string
  files: File[]
}

export interface PolicyEntry {
  value: string
  conditions: string[]
  quote: string
  page: number | null
  uncertain: boolean
}

export interface ComparisonRow {
  category_key: CategoryKey
  policy_a: PolicyEntry | null
  policy_b: PolicyEntry | null
  presence: "both" | "a_only" | "b_only"
  comparison: "better" | "worse" | "equal" | null
}

export interface Recommendation {
  verdict: "switch" | "stay" | "too_close"
  reasons: Array<{
    category_key: CategoryKey
    description: string
  }>
  summary: string
}

export interface AnalysisResult {
  rows: ComparisonRow[]
  recommendation: Recommendation
}

export type AppErrorCode =
  | "file_too_large"
  | "wrong_file_type"
  | "analysis_failed"
  | "no_insurance_content"
  | "invalid_response"

export interface AppError {
  code: AppErrorCode
  message: string
}

export interface AppState {
  step: "upload" | "priorities" | "analyzing" | "results"
  policy_a: PolicyInput | null
  policy_b: PolicyInput | null
  priorities: CategoryKey[]
  result: AnalysisResult | null
  error: AppError | null
}

import type { CategoryKey } from "@/lib/categories"
import type { InsuranceProduct } from "@/lib/products"

export interface PolicyInput {
  name: string
  text: string
  files: File[]
}

export interface SavedFile {
  filename: string
  media_type: string   // "application/pdf" | "image/png" | …
  storedPath: string   // path within the local documents folder
}

export interface SavedPolicy {
  id: string
  product: InsuranceProduct
  name: string          // user-given, e.g. "Volvo XC60 — Folksam"
  files: SavedFile[]    // stored locally
  createdAt: string     // ISO timestamp
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

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ChatState {
  messages: ChatMessage[]
  status: "idle" | "sending" | "error"
}

export type AppErrorCode =
  | "wrong_file_type"
  | "file_too_large"        // uploaded documents exceed the analyzer limit (32MB / 600 pages total)
  | "input_too_large"       // the user's chat message exceeds the length bound
  | "analysis_failed"
  | "no_insurance_content"
  | "invalid_response"
  | "chat_failed"           // chat API error
  | "storage_error"         // local SQLite / filesystem read or write failed

export interface AppError {
  code: AppErrorCode
  message: string
}

export type ComparisonMode = "saved" | "adhoc"

export type AppStep =
  | "landing"
  | "manage_policies"
  | "compose_offer"   // saved mode: chosen current shown read-only + ONE composer for the offer
  | "compose_adhoc"   // ad-hoc mode: TWO composers (Policy A + Policy B), v1-style
  | "analyzing"
  | "results"

export interface AppState {
  step: AppStep
  mode: ComparisonMode | null
  savedPolicies: SavedPolicy[]    // loaded from the local store
  currentPolicyId: string | null  // saved mode: the chosen current policy (resolves to policy_a)
  policy_a: PolicyInput | null    // resolved current (saved) or Policy A (ad-hoc)
  policy_b: PolicyInput | null    // the offer (saved) or Policy B (ad-hoc)
  result: AnalysisResult | null
  error: AppError | null
  chat: ChatState
}

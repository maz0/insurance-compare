import type { AppErrorCode } from "@/lib/types"

export const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  file_too_large:        "This file is too large. Maximum size is 20MB.",
  wrong_file_type:       "Word documents aren't supported directly — please export to PDF and upload that. Supported formats: PDF, JPG, PNG, or paste text directly.",
  analysis_failed:       "Analysis failed. Please try again.",
  no_insurance_content:  "One or more inputs don't appear to be insurance policies. Please check your files.",
  invalid_response:      "Analysis failed. Please try again.",
}

export const ACCEPTED_FILE_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".gif"] as const

export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const

export const ACCEPTED_FILE_TYPES = {
  extensions: ACCEPTED_FILE_EXTENSIONS,
  mimeTypes: ACCEPTED_MIME_TYPES,
} as const

export const LOADING_MESSAGES = [
  "Reading both documents\u2026",
  "Comparing coverage\u2026",
  "Building recommendation\u2026",
] as const

export const PRIORITY_STEP = {
  heading: "What matters most to you?",
  subheading: "Select exactly 3 coverage categories to prioritise in the comparison.",
  selectionCount: (n: number) => `${n} of 3 selected`,
  compareButton: "Compare",
} as const

export const PRESENCE_LABELS = {
  a_only: "Only in A",
  b_only: "Only in B",
} as const

export const COMPARISON_LABELS = {
  better: "B wins",
  worse: "A wins",
  equal: "Equal",
} as const

export const RECOMMENDATION_CARD = {
  heading: "Recommendation",
  verdictSwitch: "Switch to Policy B",
  verdictStay: "Stay with Policy A",
  verdictTooClose: "Too close to call",
  reasonsHeading: "Top reasons",
  rowLinkLabel: "See row",
} as const

export const COMPARISON_TABLE = {
  emptyState:
    "The analysis couldn't extract comparable coverage dimensions from these documents. Check that both inputs contain text-based insurance policy content.",
  colCategory: "Coverage",
  colPolicyA: "Policy A",
  colPolicyB: "Policy B",
  colPresence: "Presence",
  colComparison: "Comparison",
  policyALabel: "Policy A",
  policyBLabel: "Policy B",
  pageLabel: "Page:",
  noEntry: "Not found in this document",
} as const

import type { AppErrorCode } from "@/lib/types"

export const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  wrong_file_type:       "Word documents aren't supported directly — please export to PDF and upload that. Supported formats: PDF, JPG, PNG, or paste text directly.",
  file_too_large:        "These documents are too large to analyse in one go (limit ~32 MB or 600 pages total). Try fewer or smaller files, or split the policy.",
  input_too_large:       "Your message is too long — please shorten it.",
  analysis_failed:       "Analysis failed. Please try again.",
  no_insurance_content:  "One or more inputs don't appear to be insurance policies. Please check your files.",
  invalid_response:      "Analysis failed. Please try again.",
  chat_failed:           "Couldn't answer that just now. Please try again.",
  storage_error:         "Couldn't save or load your policies. Please try again.",
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

export const POLICY_LIST = {
  heading: "My current policies",
  addButton: "Add policy",
  addDialogTitle: "Add policy",
  editDialogTitle: "Edit policy",
  emptyState: "No saved policies yet. Add your current insurance to get started.",
  loading: "Loading…",
} as const

export const POLICY_CARD = {
  fileCountSingular: "1 file",
  fileCountPlural: (n: number) => `${n} files`,
  editAriaLabel: (name: string) => `Edit ${name}`,
  deleteAriaLabel: (name: string) => `Delete ${name}`,
} as const

export const POLICY_FORM = {
  nameLabel: "Policy name",
  namePlaceholder: "e.g. Volvo XC60 — Folksam",
  productLabel: "Insurance type",
  productPlaceholder: "Select a product…",
  filesLabel: "Policy documents (optional)",
  saveButton: "Save",
  savingButton: "Saving…",
  cancelButton: "Cancel",
  errorNameRequired: "Please enter a name for this policy.",
  errorProductRequired: "Please select an insurance type.",
  errorSaveFailed: "Couldn't save your policy. Please try again.",
} as const

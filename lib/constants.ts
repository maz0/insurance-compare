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

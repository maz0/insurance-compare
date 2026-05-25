"use client"

import { useRef, useState } from "react"
import { Paperclip, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ACCEPTED_FILE_TYPES, ERROR_MESSAGES } from "@/lib/constants"

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20MB

interface PolicyComposerProps {
  text: string
  files: File[]
  error: string | null
  onTextChange: (text: string) => void
  onFilesChange: (files: File[]) => void
  onError: (error: string | null) => void
}

export function PolicyComposer({
  text,
  files,
  error,
  onTextChange,
  onFilesChange,
  onError,
}: PolicyComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function validateFile(file: File): string | null {
    const nameLower = file.name.toLowerCase()
    const wordExtensions = [".doc", ".docx", ".docm"]
    if (wordExtensions.some((ext) => nameLower.endsWith(ext))) {
      return ERROR_MESSAGES.wrong_file_type
    }

    const mimeAccepted = (ACCEPTED_FILE_TYPES.mimeTypes as readonly string[]).includes(file.type)
    const extAccepted = (ACCEPTED_FILE_TYPES.extensions as readonly string[]).some((ext) =>
      nameLower.endsWith(ext)
    )
    if (!mimeAccepted && !extAccepted) {
      return ERROR_MESSAGES.wrong_file_type
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return ERROR_MESSAGES.file_too_large
    }

    return null
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files
    if (!selected || selected.length === 0) return

    const incoming = Array.from(selected)
    const validFiles: File[] = []
    let firstError: string | null = null

    for (const file of incoming) {
      const validationError = validateFile(file)
      if (validationError) {
        if (!firstError) firstError = validationError
      } else {
        validFiles.push(file)
      }
    }

    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles])
    }
    onError(firstError)

    // Reset input so the same file can be re-attached after removal
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function handleRemoveFile(index: number) {
    const updated = files.filter((_, i) => i !== index)
    onFilesChange(updated)
    if (updated.length === 0) {
      onError(null)
    }
  }

  const acceptAttr = [
    ...(ACCEPTED_FILE_TYPES.mimeTypes as readonly string[]),
    ...(ACCEPTED_FILE_TYPES.extensions as readonly string[]),
  ].join(",")

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        placeholder="Paste policy text here…"
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        rows={8}
        className="resize-y"
      />

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="mr-2 h-4 w-4" />
          Attach file
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptAttr}
          onChange={handleFileChange}
          className="hidden"
          aria-label="Attach files"
        />
      </div>

      {files.length > 0 && (
        <ul className="flex flex-col gap-1">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-sm"
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="ml-2 shrink-0 text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

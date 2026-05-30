"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProductPicker } from "@/components/policies/ProductPicker"
import { PolicyComposer } from "@/components/upload/PolicyComposer"
import { POLICY_FORM } from "@/lib/constants"
import type { InsuranceProduct } from "@/lib/products"
import type { SavedPolicy } from "@/lib/types"

interface PolicyFormProps {
  /** When provided, the form is in edit mode (name + product only — no file re-upload in edit). */
  existing?: SavedPolicy
  onSave: () => void
  onCancel: () => void
}

export function PolicyForm({ existing, onSave, onCancel }: PolicyFormProps) {
  const isEdit = existing !== undefined

  const [name, setName] = useState(existing?.name ?? "")
  const [product, setProduct] = useState<InsuranceProduct | "">(existing?.product ?? "")
  const [composerText, setComposerText] = useState("")
  const [composerFiles, setComposerFiles] = useState<File[]>([])
  const [composerError, setComposerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      setFormError(POLICY_FORM.errorNameRequired)
      return
    }
    if (!product) {
      setFormError(POLICY_FORM.errorProductRequired)
      return
    }
    if (composerError) {
      return
    }

    setSubmitting(true)
    setFormError(null)

    try {
      if (isEdit) {
        const res = await fetch(`/api/policies/${existing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), product }),
        })
        if (!res.ok) {
          const body = (await res.json()) as { error?: { message?: string } }
          setFormError(body?.error?.message ?? POLICY_FORM.errorSaveFailed)
          setSubmitting(false)
          return
        }
      } else {
        const formData = new FormData()
        formData.append("name", name.trim())
        formData.append("product", product)
        if (composerText.trim()) {
          // Wrap pasted text as a plain-text blob so the API receives it as a file
          formData.append(
            "files",
            new Blob([composerText], { type: "text/plain" }),
            "pasted-text.txt"
          )
        }
        for (const file of composerFiles) {
          formData.append("files", file)
        }
        const res = await fetch("/api/policies", {
          method: "POST",
          body: formData,
        })
        if (!res.ok) {
          const body = (await res.json()) as { error?: { message?: string } }
          setFormError(body?.error?.message ?? POLICY_FORM.errorSaveFailed)
          setSubmitting(false)
          return
        }
      }

      onSave()
    } catch {
      setFormError(POLICY_FORM.errorSaveFailed)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* AC2: name first */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="policy-name">{POLICY_FORM.nameLabel}</Label>
        <Input
          id="policy-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={POLICY_FORM.namePlaceholder}
        />
      </div>

      {/* AC2: product second */}
      <ProductPicker value={product} onChange={setProduct} />

      {/* AC2 + AC7: file attach — only shown when creating; edit updates metadata only */}
      {!isEdit && (
        <div className="flex flex-col gap-1.5">
          <Label>{POLICY_FORM.filesLabel}</Label>
          <PolicyComposer
            text={composerText}
            files={composerFiles}
            error={composerError}
            onTextChange={setComposerText}
            onFilesChange={setComposerFiles}
            onError={setComposerError}
          />
        </div>
      )}

      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          {POLICY_FORM.cancelButton}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? POLICY_FORM.savingButton : POLICY_FORM.saveButton}
        </Button>
      </div>
    </form>
  )
}

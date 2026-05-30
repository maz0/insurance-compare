"use client"

import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PRODUCT_LABELS } from "@/lib/products"
import { POLICY_CARD } from "@/lib/constants"
import type { SavedPolicy } from "@/lib/types"

interface SavedPolicyCardProps {
  policy: SavedPolicy
  onEdit: (policy: SavedPolicy) => void
  onDelete: (id: string) => void
}

export function SavedPolicyCard({ policy, onEdit, onDelete }: SavedPolicyCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-sm">{policy.name}</span>
        <span className="text-xs text-muted-foreground">
          {PRODUCT_LABELS[policy.product]}
        </span>
        <span className="text-xs text-muted-foreground">
          {policy.files.length === 1
            ? POLICY_CARD.fileCountSingular
            : POLICY_CARD.fileCountPlural(policy.files.length)}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEdit(policy)}
          aria-label={POLICY_CARD.editAriaLabel(policy.name)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(policy.id)}
          aria-label={POLICY_CARD.deleteAriaLabel(policy.name)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

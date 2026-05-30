"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SavedPolicyCard } from "@/components/policies/SavedPolicyCard"
import { PolicyForm } from "@/components/policies/PolicyForm"
import { ErrorMessage } from "@/components/shared/ErrorMessage"
import { POLICY_LIST, ERROR_MESSAGES } from "@/lib/constants"
import type { AppError, SavedPolicy } from "@/lib/types"

interface SavedPolicyListProps {
  savedPolicies?: SavedPolicy[]
  onCompareOffer?: (policyId: string) => void
}

export function SavedPolicyList({ savedPolicies: propPolicies, onCompareOffer }: SavedPolicyListProps = {}) {
  const [policies, setPolicies] = useState<SavedPolicy[]>(propPolicies ?? [])
  const [loading, setLoading] = useState(propPolicies === undefined)
  const [error, setError] = useState<AppError | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<SavedPolicy | undefined>(undefined)

  const loadPolicies = useCallback(async () => {
    if (propPolicies !== undefined) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/policies")
      if (!res.ok) {
        setError({ code: "storage_error", message: ERROR_MESSAGES.storage_error })
        return
      }
      const data = (await res.json()) as SavedPolicy[] | { error?: { code: string; message: string } }
      if (!Array.isArray(data)) {
        setError({ code: "storage_error", message: ERROR_MESSAGES.storage_error })
        return
      }
      setPolicies(data)
    } catch {
      setError({ code: "storage_error", message: ERROR_MESSAGES.storage_error })
    } finally {
      setLoading(false)
    }
  }, [propPolicies])

  useEffect(() => {
    if (propPolicies !== undefined) {
      setPolicies(propPolicies)
      setLoading(false)
      return
    }
    void loadPolicies()
  }, [loadPolicies, propPolicies])

  function handleAdd() {
    setEditingPolicy(undefined)
    setDialogOpen(true)
  }

  function handleEdit(policy: SavedPolicy) {
    setEditingPolicy(policy)
    setDialogOpen(true)
  }

  async function handleDelete(id: string) {
    setError(null)
    try {
      const res = await fetch(`/api/policies/${id}`, { method: "DELETE" })
      if (!res.ok) {
        setError({ code: "storage_error", message: ERROR_MESSAGES.storage_error })
        return
      }
      await loadPolicies()
    } catch {
      setError({ code: "storage_error", message: ERROR_MESSAGES.storage_error })
    }
  }

  function handleFormSave() {
    setDialogOpen(false)
    void loadPolicies()
  }

  function handleFormCancel() {
    setDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{POLICY_LIST.heading}</h2>
        <Button type="button" onClick={handleAdd} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          {POLICY_LIST.addButton}
        </Button>
      </div>

      {error && <ErrorMessage error={error} />}

      {loading ? (
        <p className="text-sm text-muted-foreground">{POLICY_LIST.loading}</p>
      ) : policies.length === 0 ? (
        <p className="text-sm text-muted-foreground">{POLICY_LIST.emptyState}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {policies.map((policy) => (
            <li key={policy.id}>
              <SavedPolicyCard
                policy={policy}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCompareOffer={onCompareOffer}
              />
            </li>
          ))}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPolicy ? POLICY_LIST.editDialogTitle : POLICY_LIST.addDialogTitle}
            </DialogTitle>
          </DialogHeader>
          <PolicyForm
            existing={editingPolicy}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

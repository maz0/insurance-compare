"use client"

import { Button } from "@/components/ui/button"
import { SavedPolicyList } from "@/components/policies/SavedPolicyList"
import { LANDING } from "@/lib/constants"
import type { AppStep, SavedPolicy } from "@/lib/types"

interface LandingScreenProps {
  savedPolicies: SavedPolicy[]
  onTransition: (step: AppStep) => void
  onCompareOffer: (policyId: string) => void
}

export function LandingScreen({ savedPolicies, onTransition, onCompareOffer }: LandingScreenProps) {
  const hasPolicies = savedPolicies.length > 0

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">{LANDING.heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{LANDING.subheading}</p>
      </div>

      {hasPolicies ? (
        <>
          <SavedPolicyList savedPolicies={savedPolicies} onCompareOffer={onCompareOffer} />
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => onTransition("manage_policies")}>
              {LANDING.managePoliciesButton}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex gap-3">
          <Button type="button" onClick={() => onTransition("manage_policies")}>
            {LANDING.addFirstButton}
          </Button>
          <Button type="button" variant="outline" onClick={() => onTransition("compose_adhoc")}>
            {LANDING.adhocButton}
          </Button>
        </div>
      )}
    </div>
  )
}

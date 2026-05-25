import { Badge } from "@/components/ui/badge"
import { PRESENCE_LABELS } from "@/lib/constants"

interface PresenceBadgeProps {
  presence: "both" | "a_only" | "b_only"
}

export function PresenceBadge({ presence }: PresenceBadgeProps) {
  if (presence === "both") return null

  if (presence === "a_only") {
    return (
      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
        {PRESENCE_LABELS.a_only}
      </Badge>
    )
  }

  return (
    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
      {PRESENCE_LABELS.b_only}
    </Badge>
  )
}

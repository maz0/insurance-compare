import { Badge } from "@/components/ui/badge"
import { COMPARISON_LABELS } from "@/lib/constants"

interface ComparisonBadgeProps {
  comparison: "better" | "worse" | "equal" | null
}

export function ComparisonBadge({ comparison }: ComparisonBadgeProps) {
  if (comparison === null) return null

  if (comparison === "better") {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        {COMPARISON_LABELS.better}
      </Badge>
    )
  }

  if (comparison === "worse") {
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        {COMPARISON_LABELS.worse}
      </Badge>
    )
  }

  return (
    <Badge className="bg-gray-100 text-gray-700 border-gray-200">
      {COMPARISON_LABELS.equal}
    </Badge>
  )
}

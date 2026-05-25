import type { AppError } from "@/lib/types"

interface ErrorMessageProps {
  error: AppError
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="rounded-md border border-red-300 bg-red-50 p-6 text-red-800"
    >
      <p className="font-semibold">Error</p>
      <p className="mt-1 text-sm">{error.message}</p>
    </div>
  )
}

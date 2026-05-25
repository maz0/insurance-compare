"use client"

import { useEffect, useState } from "react"
import { LOADING_MESSAGES } from "@/lib/constants"

const MESSAGE_INTERVAL_MS = 20000

export function LoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    if (messageIndex >= LOADING_MESSAGES.length - 1) return

    const timer = setTimeout(() => {
      setMessageIndex((prev) => Math.min(prev + 1, LOADING_MESSAGES.length - 1))
    }, MESSAGE_INTERVAL_MS)

    return () => clearTimeout(timer)
  }, [messageIndex])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <div className="flex gap-2">
        <span className="inline-block h-3 w-3 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
        <span className="inline-block h-3 w-3 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
        <span className="inline-block h-3 w-3 animate-bounce rounded-full bg-gray-400" />
      </div>
      <p className="text-base font-medium text-gray-700">{LOADING_MESSAGES[messageIndex]}</p>
    </div>
  )
}

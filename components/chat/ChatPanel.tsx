"use client"

import { useReducer, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react"
import type { AnalysisResult, ChatMessage, ChatState, AppError, ComparisonMode } from "@/lib/types"
import { ChatMessageItem } from "@/components/chat/ChatMessageItem"
import { Button } from "@/components/ui/button"
import { CHAT_PANEL, ERROR_MESSAGES } from "@/lib/constants"

interface FileInput {
  base64: string
  media_type: string
}

interface ChatPanelDocuments {
  a: FileInput[]
  b: FileInput[]
}

interface ChatPanelProps {
  result: AnalysisResult
  documents: ChatPanelDocuments
  policyNames: { a: string; b: string }
  mode: ComparisonMode
}

const MAX_HISTORY_TURNS = 15

type ChatAction =
  | { type: "SEND_START"; question: string }
  | { type: "SEND_SUCCESS"; answer: string }
  | { type: "SEND_ERROR"; error: AppError }
  | { type: "CLEAR_ERROR" }

interface LocalChatState extends ChatState {
  inlineError: AppError | null
}

function chatReducer(state: LocalChatState, action: ChatAction): LocalChatState {
  switch (action.type) {
    case "SEND_START":
      return {
        ...state,
        messages: [
          ...state.messages,
          { role: "user" as const, content: action.question },
        ],
        status: "sending",
        inlineError: null,
      }
    case "SEND_SUCCESS":
      return {
        ...state,
        messages: [
          ...state.messages,
          { role: "assistant" as const, content: action.answer },
        ],
        status: "idle",
        inlineError: null,
      }
    case "SEND_ERROR":
      return {
        ...state,
        status: "idle",
        inlineError: action.error,
      }
    case "CLEAR_ERROR":
      return { ...state, inlineError: null }
    default:
      return state
  }
}

const INITIAL_STATE: LocalChatState = {
  messages: [],
  status: "idle",
  inlineError: null,
}

export function ChatPanel({ result, documents, policyNames, mode }: ChatPanelProps) {
  const [state, dispatch] = useReducer(chatReducer, INITIAL_STATE)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [state.messages])

  function cappedHistory(messages: ChatMessage[]): ChatMessage[] {
    return messages.slice(-MAX_HISTORY_TURNS)
  }

  async function sendQuestion(question: string) {
    const trimmed = question.trim()
    if (!trimmed || state.status === "sending") return

    dispatch({ type: "SEND_START", question: trimmed })

    const history = cappedHistory(state.messages)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documents,
          result,
          policyNames,
          mode,
          history,
          question: trimmed,
        }),
      })

      const json = (await res.json()) as { answer?: string; error?: AppError }

      if (json.error) {
        dispatch({ type: "SEND_ERROR", error: json.error })
        return
      }

      if (!json.answer) {
        const fallbackError: AppError = {
          code: "chat_failed",
          message: ERROR_MESSAGES.chat_failed,
        }
        dispatch({ type: "SEND_ERROR", error: fallbackError })
        return
      }

      dispatch({ type: "SEND_SUCCESS", answer: json.answer })
    } catch {
      const networkError: AppError = {
        code: "chat_failed",
        message: ERROR_MESSAGES.chat_failed,
      }
      dispatch({ type: "SEND_ERROR", error: networkError })
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const input = inputRef.current
    if (!input) return
    const value = input.value
    input.value = ""
    void sendQuestion(value)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const input = inputRef.current
      if (!input) return
      const value = input.value
      input.value = ""
      void sendQuestion(value)
    }
  }

  const isSending = state.status === "sending"

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-base font-semibold text-gray-900">{CHAT_PANEL.heading}</h2>

      <div className="flex max-h-96 min-h-[6rem] flex-col gap-3 overflow-y-auto">
        {state.messages.length === 0 ? (
          <p className="text-sm text-gray-400">{CHAT_PANEL.emptyState}</p>
        ) : (
          state.messages.map((msg, i) => (
            <ChatMessageItem key={i} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {state.inlineError && (
        <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800">
          {state.inlineError.message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder={CHAT_PANEL.inputPlaceholder}
          disabled={isSending}
          onKeyDown={handleKeyDown}
          className="h-9 flex-1 rounded-md border border-gray-300 px-3 py-1 text-sm outline-none transition-[color,box-shadow] placeholder:text-gray-400 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button type="submit" disabled={isSending} size="sm">
          {isSending ? CHAT_PANEL.sendingButton : CHAT_PANEL.sendButton}
        </Button>
      </form>
    </section>
  )
}

import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import type {
  ContentBlockParam,
  DocumentBlockParam,
  TextBlockParam,
  MessageParam,
} from "@anthropic-ai/sdk/resources/messages/messages"
import { CHAT_SYSTEM_PROMPT, buildChatUserPrompt } from "@/lib/prompt"
import { ERROR_MESSAGES } from "@/lib/constants"
import type { AnalysisResult, AppError, ChatMessage, ComparisonMode } from "@/lib/types"

const MODEL = "claude-sonnet-4-6"

/**
 * Maximum length (characters) for the user's question.
 * Enforced before any Claude call — over-limit returns input_too_large.
 * 4000 chars is well within a typical paragraph while blocking abusive pastes.
 */
const MAX_QUESTION_LENGTH = 4000

/**
 * Maximum number of history turns to include.
 * When history exceeds this, the oldest turns are dropped first.
 * Documents are never dropped.
 */
const MAX_HISTORY_TURNS = 15

interface FileInput {
  base64: string
  media_type: string
}

interface RequestBody {
  documents: {
    a: FileInput[]
    b: FileInput[]
  }
  result: AnalysisResult
  policyNames: { a: string; b: string }
  mode: ComparisonMode
  history: ChatMessage[]
  question: string
}

function errorResponse(error: AppError, status = 200) {
  return NextResponse.json({ error }, { status })
}

/**
 * Build a PDF document block with prompt caching applied.
 * cache_control type "ephemeral" instructs Anthropic's API to cache this block
 * for ~5 minutes (the TTL for ephemeral prompt caching as of 2026-05-29).
 * The field is named `cache_control` and sits alongside `type`/`source` on the
 * content block — confirmed against Anthropic docs 2026-05-29.
 */
function buildCachedDocumentBlock(file: FileInput): DocumentBlockParam {
  if (file.media_type !== "application/pdf") {
    // Non-PDF files (images) are included as document blocks too when applicable.
    // For image media types the source type should be base64 with the image media_type.
    // The cache_control field is the same regardless of media_type.
  }

  return {
    type: "document",
    source: {
      type: "base64",
      media_type: "application/pdf",
      data: file.base64,
    },
    cache_control: { type: "ephemeral" },
  } as DocumentBlockParam
}

/**
 * Build a cached image block for non-PDF files in the document set.
 * Images cannot use the document block type; they use image blocks with cache_control.
 */
function buildCachedContentBlock(file: FileInput): ContentBlockParam {
  if (file.media_type === "application/pdf") {
    return {
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: file.base64,
      },
      cache_control: { type: "ephemeral" },
    } as DocumentBlockParam
  }

  // Image types — cache_control is supported on image blocks the same way
  const validImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const
  type ValidImageType = typeof validImageTypes[number]

  const mediaType = file.media_type as ValidImageType
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: mediaType,
      data: file.base64,
    },
    cache_control: { type: "ephemeral" },
  } as ContentBlockParam
}

export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    const appError: AppError = {
      code: "chat_failed",
      message: ERROR_MESSAGES.chat_failed,
    }
    return errorResponse(appError)
  }

  // [AC6] Enforce question length bound before any API call
  if (body.question.length > MAX_QUESTION_LENGTH) {
    const appError: AppError = {
      code: "input_too_large",
      message: ERROR_MESSAGES.input_too_large,
    }
    return errorResponse(appError)
  }

  // [AC7] Cap history at MAX_HISTORY_TURNS, dropping oldest turns first.
  // Never drop the documents — they are grounding, not context.
  const cappedHistory: ChatMessage[] = body.history.slice(-MAX_HISTORY_TURNS)

  // Build the first user message: both policy documents (prompt-cached) +
  // the AnalysisResult as reference context + a framing text block.
  // [AC3] / [AC8] Documents are sent every turn with cache_control: ephemeral.
  const policyABlocks: ContentBlockParam[] = body.documents.a.map(buildCachedContentBlock)
  const policyBBlocks: ContentBlockParam[] = body.documents.b.map(buildCachedContentBlock)

  const analysisResultBlock: TextBlockParam = {
    type: "text",
    text: `## AnalysisResult (structured comparison — use as reference context)

The following is the structured comparison result produced by the insurance analyzer. Use it as reference context alongside the full policy documents above. It is not the sole grounding — always prefer the full documents for detail.

\`\`\`json
${JSON.stringify(body.result, null, 2)}
\`\`\``,
  }

  // Build the messages array: history turns + the current question.
  // History is interleaved user/assistant. The documents and AnalysisResult
  // are included in every user turn via a wrapper approach:
  // We embed the documents in the FIRST user message of the conversation
  // and rely on the prompt cache to avoid re-tokenising them on subsequent turns.
  //
  // Architecture:
  //   messages[0]: { role: "user", content: [policyA blocks, policyB blocks, analysisResult, questionText] }
  //   messages[1..n-1]: history (alternating user/assistant)
  //   messages[n]: { role: "user", content: [questionText] }  ← current question
  //
  // If there is no history, the documents + question go in a single user turn.
  // If there is history, the documents go in the first synthetic user turn with
  // a framing note, history follows, then the current question is the final turn.

  const questionText = buildChatUserPrompt(body.policyNames.a, body.policyNames.b, body.question)

  let messages: MessageParam[]

  if (cappedHistory.length === 0) {
    // No history — single user turn: documents + analysis + question
    const userContent: ContentBlockParam[] = [
      { type: "text", text: `## Policy A — ${body.policyNames.a}` } as TextBlockParam,
      ...policyABlocks,
      { type: "text", text: `## Policy B — ${body.policyNames.b}` } as TextBlockParam,
      ...policyBBlocks,
      analysisResultBlock,
      { type: "text", text: questionText } as TextBlockParam,
    ]
    messages = [{ role: "user", content: userContent }]
  } else {
    // With history — documents go in a synthetic first user turn;
    // history follows; current question is the final turn.
    const firstUserContent: ContentBlockParam[] = [
      { type: "text", text: `## Policy A — ${body.policyNames.a}` } as TextBlockParam,
      ...policyABlocks,
      { type: "text", text: `## Policy B — ${body.policyNames.b}` } as TextBlockParam,
      ...policyBBlocks,
      analysisResultBlock,
      {
        type: "text",
        text: "The policy documents and comparison result are provided above. I will answer questions about them below.",
      } as TextBlockParam,
    ]

    // Build history message params (alternating user/assistant)
    const historyMessages: MessageParam[] = cappedHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    // Current question as the final user turn
    const currentQuestionMessage: MessageParam = {
      role: "user",
      content: questionText,
    }

    // The first turn must be user, then assistant, alternating.
    // Insert a synthetic assistant acknowledgement after the documents turn
    // to keep the alternation valid when history starts with a user message.
    const syntheticAck: MessageParam = {
      role: "assistant",
      content: "Understood. I have the policy documents and comparison result. Please ask your question.",
    }

    messages = [
      { role: "user", content: firstUserContent },
      syntheticAck,
      ...historyMessages,
      currentQuestionMessage,
    ]
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  // [AC9] ANTHROPIC_API_KEY from process.env only — never logged.
  // Document contents and user questions are never logged.
  let answerText: string
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: CHAT_SYSTEM_PROMPT,
      messages,
    })

    const firstBlock = response.content[0]
    if (!firstBlock || firstBlock.type !== "text") {
      const appError: AppError = {
        code: "chat_failed",
        message: ERROR_MESSAGES.chat_failed,
      }
      return errorResponse(appError)
    }
    answerText = firstBlock.text
  } catch {
    // [AC1] API exception → chat_failed error code
    const appError: AppError = {
      code: "chat_failed",
      message: ERROR_MESSAGES.chat_failed,
    }
    return errorResponse(appError)
  }

  return NextResponse.json({ answer: answerText })
}

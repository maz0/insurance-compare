import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import type {
  ContentBlockParam,
  TextBlockParam,
  ImageBlockParam,
  DocumentBlockParam,
} from "@anthropic-ai/sdk/resources/messages/messages"
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompt"
import { ERROR_MESSAGES, ACCEPTED_FILE_TYPES } from "@/lib/constants"
import type { AnalysisResult, AppError } from "@/lib/types"
import type { CategoryKey } from "@/lib/categories"

const MODEL = "claude-sonnet-4-6"

const IMAGE_MIME_TYPES = ACCEPTED_FILE_TYPES.mimeTypes.filter(
  (t) => t !== "application/pdf",
) as Array<"image/jpeg" | "image/png" | "image/webp" | "image/gif">

interface FileInput {
  base64: string
  media_type: string
}

interface PolicyBody {
  name: string
  text: string
  files: FileInput[]
}

interface RequestBody {
  policy_a: PolicyBody
  policy_b: PolicyBody
  priorities: CategoryKey[]
}

function buildContentBlocks(policy: PolicyBody): ContentBlockParam[] {
  const blocks: ContentBlockParam[] = []

  if (policy.text.trim().length > 0) {
    const textBlock: TextBlockParam = { type: "text", text: policy.text }
    blocks.push(textBlock)
  }

  for (const file of policy.files) {
    if (file.media_type === "application/pdf") {
      const docBlock: DocumentBlockParam = {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: file.base64,
        },
      }
      blocks.push(docBlock)
    } else if (
      (IMAGE_MIME_TYPES as string[]).includes(file.media_type)
    ) {
      const imgBlock: ImageBlockParam = {
        type: "image",
        source: {
          type: "base64",
          media_type: file.media_type as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          data: file.base64,
        },
      }
      blocks.push(imgBlock)
    }
  }

  return blocks
}

function errorResponse(error: AppError, status = 200) {
  return NextResponse.json({ error }, { status })
}

export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    const appError: AppError = {
      code: "invalid_response",
      message: ERROR_MESSAGES.invalid_response,
    }
    return errorResponse(appError)
  }

  const policyABlocks = buildContentBlocks(body.policy_a)
  const policyBBlocks = buildContentBlocks(body.policy_b)

  const userPromptText = buildUserPrompt(body.policy_a.name, body.policy_b.name)

  const userContent: ContentBlockParam[] = [
    { type: "text", text: userPromptText },
    { type: "text", text: `\n\n## Policy A — ${body.policy_a.name}` },
    ...policyABlocks,
    { type: "text", text: `\n\n## Policy B — ${body.policy_b.name}` },
    ...policyBBlocks,
  ]

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  let rawText: string
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    })

    const firstBlock = message.content[0]
    if (!firstBlock || firstBlock.type !== "text") {
      const appError: AppError = {
        code: "invalid_response",
        message: ERROR_MESSAGES.invalid_response,
      }
      return errorResponse(appError)
    }
    rawText = firstBlock.text
  } catch {
    const appError: AppError = {
      code: "analysis_failed",
      message: ERROR_MESSAGES.analysis_failed,
    }
    return errorResponse(appError)
  }

  let parsed: AnalysisResult
  try {
    parsed = JSON.parse(rawText) as AnalysisResult
  } catch {
    const appError: AppError = {
      code: "invalid_response",
      message: ERROR_MESSAGES.invalid_response,
    }
    return errorResponse(appError)
  }

  if (!Array.isArray(parsed.rows) || parsed.rows.length === 0) {
    const appError: AppError = {
      code: "no_insurance_content",
      message: ERROR_MESSAGES.no_insurance_content,
    }
    return errorResponse(appError)
  }

  return NextResponse.json({ result: parsed })
}

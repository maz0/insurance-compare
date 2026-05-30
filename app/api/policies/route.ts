import { NextResponse } from "next/server"
import { listPolicies, createPolicy } from "@/lib/db"
import { ERROR_MESSAGES } from "@/lib/constants"

export async function GET() {
  try {
    const policies = listPolicies()
    return NextResponse.json(policies)
  } catch {
    return NextResponse.json(
      { error: { code: "storage_error", message: ERROR_MESSAGES.storage_error } },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const product = formData.get("product")
    const name = formData.get("name")

    if (typeof product !== "string" || typeof name !== "string") {
      return NextResponse.json(
        { error: { code: "storage_error", message: ERROR_MESSAGES.storage_error } },
        { status: 400 }
      )
    }

    const fileEntries = formData.getAll("files") as File[]

    const fileBuffers = await Promise.all(
      fileEntries.map(async (f) => ({
        filename: f.name,
        media_type: f.type,
        data: Buffer.from(await f.arrayBuffer()),
      }))
    )

    const policy = createPolicy({
      product: product as Parameters<typeof createPolicy>[0]["product"],
      name,
      files: fileBuffers,
    })

    return NextResponse.json(policy, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: { code: "storage_error", message: ERROR_MESSAGES.storage_error } },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { getPolicy, updatePolicy, deletePolicy } from "@/lib/db"
import { ERROR_MESSAGES } from "@/lib/constants"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const policy = getPolicy(id)
    if (!policy) {
      return NextResponse.json(
        { error: { code: "storage_error", message: ERROR_MESSAGES.storage_error } },
        { status: 404 }
      )
    }
    return NextResponse.json(policy)
  } catch {
    return NextResponse.json(
      { error: { code: "storage_error", message: ERROR_MESSAGES.storage_error } },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as { product?: string; name?: string }

    const policy = updatePolicy(id, {
      product: body.product as Parameters<typeof updatePolicy>[1]["product"],
      name: body.name,
    })

    return NextResponse.json(policy)
  } catch {
    return NextResponse.json(
      { error: { code: "storage_error", message: ERROR_MESSAGES.storage_error } },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  return PUT(request, context)
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    deletePolicy(id)
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json(
      { error: { code: "storage_error", message: ERROR_MESSAGES.storage_error } },
      { status: 500 }
    )
  }
}

import fs from "fs"
import path from "path"
import { randomUUID } from "crypto"
import { getDb, DOCUMENTS_DIR } from "./schema"
import type { SavedPolicy, SavedFile } from "@/lib/types"

// ---------------------------------------------------------------------------
// Row shapes returned by SQLite (all fields are TEXT)
// ---------------------------------------------------------------------------

interface PolicyRow {
  id: string
  product: string
  name: string
  created_at: string
}

interface FileRow {
  id: string
  policy_id: string
  filename: string
  media_type: string
  stored_path: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assemblePolicy(policyRow: PolicyRow, fileRows: FileRow[]): SavedPolicy {
  return {
    id: policyRow.id,
    product: policyRow.product as SavedPolicy["product"],
    name: policyRow.name,
    createdAt: policyRow.created_at,
    files: fileRows.map((f) => ({
      filename: f.filename,
      media_type: f.media_type,
      storedPath: f.stored_path,
    })),
  }
}

function fetchFilesForPolicy(policyId: string): FileRow[] {
  const db = getDb()
  return db
    .prepare("SELECT * FROM saved_file WHERE policy_id = ? ORDER BY rowid")
    .all(policyId) as FileRow[]
}

// ---------------------------------------------------------------------------
// Public data-access functions
// ---------------------------------------------------------------------------

export function listPolicies(): SavedPolicy[] {
  const db = getDb()
  const policyRows = db
    .prepare("SELECT * FROM saved_policy ORDER BY created_at DESC")
    .all() as PolicyRow[]
  return policyRows.map((p) => assemblePolicy(p, fetchFilesForPolicy(p.id)))
}

export function getPolicy(id: string): SavedPolicy | null {
  const db = getDb()
  const policyRow = db
    .prepare("SELECT * FROM saved_policy WHERE id = ?")
    .get(id) as PolicyRow | undefined
  if (!policyRow) return null
  return assemblePolicy(policyRow, fetchFilesForPolicy(id))
}

export interface CreatePolicyInput {
  product: SavedPolicy["product"]
  name: string
  // Each file entry carries the binary blob so we can persist it to disk
  files: Array<{
    filename: string
    media_type: string
    data: Buffer
  }>
}

export function createPolicy(input: CreatePolicyInput): SavedPolicy {
  const db = getDb()
  const id = randomUUID()
  const createdAt = new Date().toISOString()

  const policyDir = path.join(DOCUMENTS_DIR, id)
  fs.mkdirSync(policyDir, { recursive: true })

  const insertPolicy = db.prepare(
    "INSERT INTO saved_policy (id, product, name, created_at) VALUES (?, ?, ?, ?)"
  )
  const insertFile = db.prepare(
    "INSERT INTO saved_file (id, policy_id, filename, media_type, stored_path) VALUES (?, ?, ?, ?, ?)"
  )

  const savedFiles: SavedFile[] = []

  const run = db.transaction(() => {
    insertPolicy.run(id, input.product, input.name, createdAt)

    for (const f of input.files) {
      const fileId = randomUUID()
      const storedName = `${fileId}-${f.filename}`
      const storedPath = path.join(id, storedName)
      const absolutePath = path.join(DOCUMENTS_DIR, storedPath)

      fs.writeFileSync(absolutePath, f.data)

      insertFile.run(fileId, id, f.filename, f.media_type, storedPath)

      savedFiles.push({
        filename: f.filename,
        media_type: f.media_type,
        storedPath,
      })
    }
  })

  run()

  return { id, product: input.product, name: input.name, createdAt, files: savedFiles }
}

export interface UpdatePolicyInput {
  product?: SavedPolicy["product"]
  name?: string
}

export function updatePolicy(id: string, input: UpdatePolicyInput): SavedPolicy {
  const db = getDb()

  const existing = db
    .prepare("SELECT * FROM saved_policy WHERE id = ?")
    .get(id) as PolicyRow | undefined
  if (!existing) throw new Error(`Policy ${id} not found`)

  const newProduct = input.product ?? existing.product
  const newName = input.name ?? existing.name

  db.prepare("UPDATE saved_policy SET product = ?, name = ? WHERE id = ?").run(
    newProduct,
    newName,
    id
  )

  return assemblePolicy(
    { ...existing, product: newProduct, name: newName },
    fetchFilesForPolicy(id)
  )
}

export function deletePolicy(id: string): void {
  const db = getDb()

  // Collect stored file paths before deletion so we can remove blobs
  const fileRows = fetchFilesForPolicy(id)

  db.prepare("DELETE FROM saved_policy WHERE id = ?").run(id)

  // Remove blobs from disk (best-effort — DB row already gone)
  for (const f of fileRows) {
    const absolutePath = path.join(DOCUMENTS_DIR, f.stored_path)
    try {
      fs.unlinkSync(absolutePath)
    } catch {
      // File already gone — nothing to do
    }
  }

  // Remove the policy's directory if empty
  const policyDir = path.join(DOCUMENTS_DIR, id)
  try {
    fs.rmdirSync(policyDir)
  } catch {
    // Directory may not be empty or may not exist
  }
}

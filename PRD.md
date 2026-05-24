# PRD — Insurance Compare
**Version:** 0.5  
**Date:** 2026-05-24  
**Status:** Ready for development

---

## 1. Problem

Insurance documents in Norway and Sweden are long, dense, and deliberately hard to compare. The market is competitive — people switch insurers regularly to get better deals — but doing so requires reading 15–20 pages of fine-print policy text per document. Most people either skip this entirely (and switch blind) or stay with their current insurer out of friction.

The result: people make financial decisions worth thousands of kroner per year without understanding what they're actually buying.

---

## 2. Goal

A personal tool that lets you provide two insurance documents (in any supported format), reads them both with AI, and gives you a clear side-by-side comparison — with every claim anchored to the exact source text where available. You decide whether to switch.

---

## 3. Success criteria

The tool is successful if, after running a comparison, you can answer all of these without opening either document:

- What does Policy A cover that Policy B doesn't (and vice versa)?
- Where are the limits different, and by how much?
- Which policy has harder conditions or more gotchas?
- Based on what matters to me, should I switch?

---

## 4. Users

**Primary:** One person, personal use. Used 1–4 times per year. No accounts, no sharing, no multi-user scenarios.

This is a household tool, not a product. Design for yourself first.

---

## 5. Core concept

Always a head-to-head comparison between **two policies**. Never one document against a market benchmark. Every output is grounded in a direct quote from one or both sources where the source is paginated or structured. For pasted text and image-based sources, quotes are best-effort and `page` will be `null`.

---

## 6. Language

**UI:** English only. No i18n library. Static English strings throughout.

**AI output:** Auto-detects the primary language of the uploaded documents and responds in that language. Expected to be Norwegian ~95% of the time.

| Output type | Language |
|---|---|
| UI labels, headings, buttons | English (static) |
| `category_key` | Stable slug from closed enum — language-agnostic |
| Category display strings | English — resolved from `CATEGORY_LABELS` constants |
| Extracted values and conditions | Document language (auto-detected) |
| Verbatim source quotes | Verbatim — whatever the document says |
| Recommendation summary | Document language |

**Intentional mixed-language result:** A Norwegian user will see English chrome and category headers alongside Norwegian values, conditions, and summary. This is by design — category names function as structural labels (like column headers), not content. A QA agent must not file this as a bug.

---

## 7. Category key enum

This is the single source of truth. The model prompt lists these exact keys. The `CATEGORY_LABELS` constants map each key to a display string. Neither the model nor the frontend may emit or render a key not in this list. If no key fits a coverage dimension, use `"other"`.

```typescript
// lib/categories.ts — imported by lib/prompt.ts and used directly in components

export type CategoryKey =
  // Medical
  | "medical_treatment"
  | "dental_emergency"
  | "mental_health"
  | "rehabilitation"
  | "personal_accident"
  | "accidental_death"
  | "disability"

  // Travel
  | "trip_cancellation"
  | "trip_interruption"
  | "trip_shortening"
  | "travel_delay"
  | "baggage_loss"
  | "baggage_delay"
  | "rescue_service"

  // Property & Belongings
  | "personal_belongings"
  | "valuables"
  | "cash_and_documents"
  | "purchase_protection"
  | "return_guarantee"

  // Home
  | "fire_damage"
  | "water_damage"
  | "natural_disaster"
  | "theft_burglary"
  | "vandalism"
  | "glass_damage"

  // Vehicle
  | "car_rental"
  | "collision_damage"
  | "comprehensive_damage"
  | "vehicle_theft"
  | "roadside_assistance"
  | "vehicle_glass"

  // Liability & Legal
  | "personal_liability"
  | "legal_assistance"
  | "legal_protection"

  // Policy conditions
  | "deductible"
  | "coverage_area"
  | "coverage_duration"
  | "eligibility_conditions"

  // Fallback
  | "other"

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  medical_treatment:      "Medical treatment",
  dental_emergency:       "Dental emergency",
  mental_health:          "Mental health",
  rehabilitation:         "Rehabilitation",
  personal_accident:      "Personal accident",
  accidental_death:       "Accidental death",
  disability:             "Disability",
  trip_cancellation:      "Trip cancellation",
  trip_interruption:      "Trip interruption",
  trip_shortening:        "Trip shortening",
  travel_delay:           "Travel delay",
  baggage_loss:           "Baggage loss",
  baggage_delay:          "Baggage delay",
  rescue_service:         "Rescue service",
  personal_belongings:    "Personal belongings",
  valuables:              "Valuables",
  cash_and_documents:     "Cash and documents",
  purchase_protection:    "Purchase protection",
  return_guarantee:       "Return guarantee",
  fire_damage:            "Fire damage",
  water_damage:           "Water damage",
  natural_disaster:       "Natural disaster",
  theft_burglary:         "Theft and burglary",
  vandalism:              "Vandalism",
  glass_damage:           "Glass damage",
  car_rental:             "Car rental coverage",
  collision_damage:       "Collision damage",
  comprehensive_damage:   "Comprehensive damage",
  vehicle_theft:          "Vehicle theft",
  roadside_assistance:    "Roadside assistance",
  vehicle_glass:          "Vehicle glass",
  personal_liability:     "Personal liability",
  legal_assistance:       "Legal assistance",
  legal_protection:       "Legal protection",
  deductible:             "Deductible",
  coverage_area:          "Coverage area",
  coverage_duration:      "Coverage duration",
  eligibility_conditions: "Eligibility conditions",
  other:                  "Other",
}
```

---

## 8. Supported input types

Each policy is provided via a composer-style input that accepts **any combination** of the following:

| Type | How it's sent to Claude | Page numbers |
|---|---|---|
| Text-based PDF | Document content block (base64) | Available |
| Scanned / image PDF | Document content block (base64) — Claude OCRs natively | Available |
| JPG / PNG / WEBP / GIF | Image content block (base64) | `null` |
| Pasted text | Text content block | `null` |

**Not supported: `.docx` and other Word formats.** Word documents are structured documents — coverage tables, columns, and fine print depend on layout that text extraction handles poorly. Extracting text from a `.docx` produces unlabeled cell values with lost structure, which would degrade the analysis silently. Instead: export to PDF (one menu click in Word) and upload that. The PDF preserves layout, structure, and pagination, giving the model the full picture.

When a `.docx` is attached, reject it at upload time with a specific, actionable message — see section 13.

A policy is considered "provided" if it has non-empty pasted text **or** at least one attached file. Both policies must be provided before analysis can run.

---

## 9. Scope

### 9.1 In scope — MVP

| # | Feature | Description |
|---|---|---|
| F1 | Composer input × 2 | One composer per policy: paste text and/or attach files (PDF, JPG, PNG, WEBP, GIF). Name each policy. |
| F2 | Input validation | Validate file types and sizes at attach time. Block `.docx` with actionable message. |
| F3 | Priority weighting | User selects top 3 coverage categories that matter most. Used to weight the recommendation. |
| F4 | AI analysis | Single API call. Both policies passed as mixed content arrays. Server awaits complete response, parses JSON, returns to client. |
| F5 | Loading screen | Shown while analysis runs (~60–90 s). Static progress messages on a timer. Results render all at once when fetch completes. |
| F6 | Comparison table | Side-by-side table of every coverage dimension found across both policies. |
| F7 | Grounded quotes | Every row shows verbatim source text with page reference where available (`null` for images and pasted text). Collapsed by default, expandable. |
| F8 | Flags | Each row shows `presence` and `comparison` as independent axes (see data model). |
| F9 | Recommendation | Summary verdict with top 3 reasons, each linked to a table row. Rendered with the table when results arrive. |

### 9.2 Out of scope — MVP

- Streaming or progressive table rendering
- `.docx` support (rejected at attach time)
- Multiple policies or multi-way comparison
- Market benchmarking
- Price input or cost-per-coverage calculation
- Saving, exporting, or sharing results
- User accounts or history
- Mobile layout (desktop-first)
- Dark mode
- Sorting or filtering the comparison table
- Deployment — runs locally via `npm run dev`

### 9.3 Explicitly never in scope

- Regulated financial advice
- Recommending specific insurers
- Crawling insurer websites for live data

---

## 10. User flow

```
1. Land on tool (localhost:3000)
        ↓
2. Policy A composer: paste text and/or attach files. Name it.
   Policy B composer: paste text and/or attach files. Name it.
   (Files validated at attach time — wrong type or size blocked immediately)
        ↓
3. Select top 3 priority categories
        ↓
4. Click "Compare"
   Loading screen: "Reading both documents..." →
                   "Comparing coverage..." →
                   "Building recommendation..."
   (Static messages on a timer — fetch typically takes 60–90 s)
        ↓
5. Results render all at once:
   Comparison table + recommendation card
        ↓
6. Explore table — click any row to expand verbatim quotes and page refs
```

---

## 11. Data model

### 11.1 Input shape

```typescript
// lib/types.ts

interface PolicyInput {
  name: string
  text: string     // "" if only files were attached
  files: File[]    // [] if only text was pasted
}
// "Provided" = text !== "" OR files.length > 0
```

The API route converts `PolicyInput` into a Claude content array:
- If `text` is non-empty → one `text` content block
- For each file → one `document` block (PDF) or `image` block (JPG/PNG/WEBP/GIF)

Mixing types within one policy is the default behavior, not a special case.

### 11.2 AI response schema

```typescript
// lib/types.ts

interface AnalysisResult {
  rows: ComparisonRow[]
  recommendation: Recommendation
}

interface ComparisonRow {
  category_key: CategoryKey    // From closed enum — also the unique row identity
  policy_a: PolicyEntry | null // null = not found in this document
  policy_b: PolicyEntry | null
  presence: "both" | "a_only" | "b_only"
  comparison: "better" | "worse" | "equal" | null
  // comparison is null when presence is "a_only" or "b_only"
  // "better" = B is better on this dimension (reason to switch)
  // "worse"  = B is worse on this dimension (reason to stay)
}

interface PolicyEntry {
  value: string          // Plain language. e.g. "10 000 000 kr" or "Unlimited"
  conditions: string[]   // Key conditions, max 10 words each
  quote: string          // Verbatim source text
  page: number | null    // null for images, pasted text, or unpaginated sources
  uncertain: boolean     // true = model could not clearly determine this value
}

interface Recommendation {
  verdict: "switch" | "stay" | "too_close"
  reasons: Array<{
    category_key: CategoryKey  // Must match a category_key present in rows
    description: string        // In document language
  }>
  summary: string              // One paragraph. In document language.
}
```

**Rendering logic:**

| presence | comparison | Render as |
|---|---|---|
| `both` | `better` | B wins — green |
| `both` | `worse` | A wins — red |
| `both` | `equal` | Equal — neutral |
| `a_only` | `null` | Gap — lose this by switching — orange |
| `b_only` | `null` | Gap — gain this by switching — blue |

**Uncertain rows:** When `uncertain: true` on a `PolicyEntry`, render the value with a visual indicator (e.g. "~" prefix or muted styling). Do not render as a confident gap or comparison.

**Empty state:** If `rows` is empty or every entry has `uncertain: true` on both sides, show: *"The analysis couldn't extract comparable coverage dimensions from these documents. Check that both inputs contain text-based insurance policy content."*

### 11.3 Error type

```typescript
// lib/types.ts

type AppErrorCode =
  | "file_too_large"
  | "wrong_file_type"
  | "analysis_failed"
  | "no_insurance_content"
  | "invalid_response"

interface AppError {
  code: AppErrorCode
  message: string  // User-facing — defined in lib/constants.ts
}
```

### 11.4 Client state

```typescript
// lib/types.ts

interface AppState {
  step: "upload" | "priorities" | "analyzing" | "results"
  policy_a: PolicyInput | null
  policy_b: PolicyInput | null
  priorities: CategoryKey[]
  result: AnalysisResult | null
  error: AppError | null
}
```

---

## 12. AI behavior rules

Defined in `lib/prompt.ts`. Must not be inlined in the API route.

1. **No claim without a quote.** Every extracted value must cite verbatim source text and page number (or `null` when not available). If ambiguous, set `uncertain: true` — do not guess.

2. **No market knowledge.** Reads only the two provided inputs. Must not draw on prior knowledge of what insurers typically offer.

3. **Closed category keys only.** Must use keys from the enum in `lib/categories.ts`. Must not invent new keys. If no key fits, use `"other"`.

4. **Gaps are explicit.** If a coverage area exists in one input and the other is silent, this is `a_only` or `b_only` — never assumed.

5. **Document language for content.** All values, conditions, and recommendation text in the detected document language. Category keys are always language-agnostic slugs.

6. **Output is a single JSON object** matching `AnalysisResult`. No markdown, no prose, no code fences. The server rejects any response that does not parse as valid JSON.

7. **Conditions are short.** Each condition string max 10 words.

8. **Non-numeric values.** When a coverage limit is not a number ("Unlimited", "Full replacement value", "Market value"), use the plain-language term as it appears in the document. Do not force it into a numeric format.

9. **Recommendation reasons must reference rows.** Every `category_key` in `recommendation.reasons` must be a key that appears in `rows`. Do not cite a category in the recommendation that was not extracted as a comparison row.

---

## 13. Request architecture

```
Client converts PolicyInput to base64 for each file
        ↓
POST /api/analyze
  Body: {
    policy_a: { name, text, files: [{ base64, media_type }] },
    policy_b: { name, text, files: [{ base64, media_type }] },
    priorities: CategoryKey[]
  }
        ↓
Route handler builds Claude content arrays:
  For each policy:
    - If text non-empty → text block
    - For each file → document block (PDF) or image block (JPG/PNG/WEBP/GIF)
        ↓
Single Claude API call
  Model: claude-sonnet-4-6  ← verify string is current before IC-3
  Input: system prompt (lib/prompt.ts) + content arrays for both policies
  Awaits complete response
        ↓
Server parses response as JSON
  Parse fails       → return { error: "invalid_response" }
  rows.length === 0 → return { error: "no_insurance_content" }
        ↓
Returns { result: AnalysisResult } to client
        ↓
Client renders table + recommendation card together
```

**Request size:** PDFs up to 20MB each as base64 (~27MB). Multiple files per policy are allowed. Running locally — no serverless body size limits apply.

**Timeout:** No serverless constraint when running locally. Client must not time out the request. Show loading screen for as long as needed.

---

## 14. Error states

| Code | Cause | User-facing message |
|---|---|---|
| `file_too_large` | File exceeds 20MB | "This file is too large. Maximum size is 20MB." |
| `wrong_file_type` | Unsupported file type attached | "Word documents aren't supported directly — please export to PDF and upload that. Supported formats: PDF, JPG, PNG, or paste text directly." |
| `analysis_failed` | Claude API error | "Analysis failed. Please try again." |
| `no_insurance_content` | Documents do not appear to be insurance policies | "One or more inputs don't appear to be insurance policies. Please check your files." |
| `invalid_response` | Model returned malformed JSON | "Analysis failed. Please try again." |

All messages defined as constants in `lib/constants.ts`, keyed by `AppErrorCode`.

**Note:** `.docx` files fall under `wrong_file_type` and must show the specific message above — not a generic "unsupported format" message. The user needs to know exactly what to do.

---

## 15. Component map

```
app/
  page.tsx                      # Root — renders current step from AppState
  api/
    analyze/
      route.ts                  # POST — builds content arrays, calls Claude, returns JSON

components/
  upload/
    UploadStep.tsx               # F1 — two PolicyComposers + naming
    PolicyComposer.tsx           # Single composer: paste textarea + file attach button
                                 # Used twice (once per policy)

  priorities/
    PriorityStep.tsx             # F3 — select top 3 from CategoryKey enum

  loading/
    LoadingScreen.tsx            # F5 — static progress messages on timer

  analysis/
    AnalysisView.tsx             # F6 + F9 — table + recommendation, rendered together
    ComparisonTable.tsx          # F6 — renders all rows
    ComparisonRow.tsx            # F7 + F8 — single row, badges, expandable quotes
    PresenceBadge.tsx            # "Gap A" / "Gap B" badge
    ComparisonBadge.tsx          # "Better" / "Worse" / "Equal" badge
    RecommendationCard.tsx       # F9 — verdict + reasons with row links

  shared/
    ErrorMessage.tsx             # Reusable error display

lib/
  categories.ts                  # CategoryKey enum + CATEGORY_LABELS — source of truth
  types.ts                       # All interfaces: PolicyInput, ComparisonRow, PolicyEntry,
                                 #   Recommendation, AnalysisResult, AppError, AppState
  prompt.ts                      # System prompt + user prompt builder
  constants.ts                   # UI strings keyed by AppErrorCode + other static text
```

---

## 16. Ticket map

Run locally: `npm run dev` — no deployment configuration.  
Linear project: **Insurance Compare**, prefix: **INS**  
Branch naming: `feature/INS-[N]-short-description`

### Dependency order

```
INS-1 (project setup)
  → INS-2 (types, categories, prompt)
    → INS-3 (API route)
    → INS-4 (upload step — composer input)
      → INS-5 (priority step)
        → INS-6 (loading screen + analysis view shell)
          → INS-7 (comparison table + row)
            → INS-8 (recommendation card)
              → INS-9 (error states)
                → INS-10 (QA pass)
```

### Ticket summaries

| Ticket | Title | Depends on |
|---|---|---|
| INS-1 | Project setup — Next.js 15, Tailwind v4, shadcn/ui, CLAUDE.md, .env.local | — |
| INS-2 | Core types, category enum, system prompt | INS-1 |
| INS-3 | API route — POST /api/analyze, mixed content blocks, JSON response | INS-2 |
| INS-4 | Upload step — PolicyComposer × 2, file validation, naming | INS-1 |
| INS-5 | Priority step — select top 3 from category enum | INS-4 |
| INS-6 | Loading screen + analysis view shell | INS-3, INS-5 |
| INS-7 | Comparison table — rows, badges, expandable quotes, empty + uncertain states | INS-6 |
| INS-8 | Recommendation card — verdict, reasons, row links (graceful if key missing) | INS-7 |
| INS-9 | Error states — all cases from section 14 | INS-7 |
| INS-10 | QA pass — test PDF, scanned PDF, image, pasted text, and at least one mixed pair | INS-9 |

---

## 17. Definition of done

A ticket is complete when:

1. `npx tsc --noEmit` passes with zero errors
2. Feature works in the browser with real inputs (not mocked data)
3. No `any` types, no `@ts-ignore`
4. All error states relevant to the ticket are handled
5. PR opened with ticket ID in title
6. Ticket moved to In Review in Linear

---

## 18. Tech stack

| | |
|---|---|
| Framework | Next.js 15, App Router, TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (new-york style) |
| Icons | lucide-react |
| AI | Claude API — claude-sonnet-4-6 (verify string before IC-3) |
| PDF + image input | Native Claude document/image content blocks (base64) |
| State | React useState / useReducer — no external state library |
| Deployment | None — local only, `npm run dev` |
| API key | `ANTHROPIC_API_KEY` in `.env.local` — must be in `.gitignore` |

---

## 19. Decisions log

| # | Decision | Choice | Reason |
|---|---|---|---|
| D1 | Priority weighting | Pick top 3 | Simpler than numeric scoring |
| D2 | Scanned PDFs | **Supported** — Claude OCRs natively | No OCR library needed; handled as document blocks |
| D3 | Category language | `category_key` + English constants | One named place beats scattered literals; swap-in i18n later for free |
| D4 | Flag model | Two axes: `presence` + `comparison` | Atomic — presence and quality are independent facts |
| D5 | Streaming | None — load then render all at once | Used 1–4 times/year; 90-second wait + loading screen is fine |
| D6 | Deployment | Local only | Personal tool; no serverless constraints; insurance docs stay on your machine |
| D7 | `id` field | Dropped — `category_key` is row identity | Closed enum guarantees uniqueness; no model consistency risk |
| D8 | Input types | PDF + images (JPG/PNG/WEBP/GIF) + pasted text; mixing allowed | Native Claude support; covers all realistic input scenarios |
| D9 | `.docx` support | Rejected at attach time | Insurance policies are structured documents; text extraction loses layout and produces silent degradation; PDF export is one click and gives better results |

---

*End of PRD v0.5*

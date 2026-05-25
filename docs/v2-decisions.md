# v2 Decisions

These decisions answer the open product questions raised at the end of the v1 epic (INS-1..INS-12). They are the inputs the PM agent must read **before** rewriting `PRD.md` for v2 or generating the v2 ticket map.

Source: PM/human discussion after Checkpoint C sign-off, refined with an outside review.

---

## 1. Persistence — real backend, not localStorage

The v2 premise ("your current insurance is already loaded when you open the site") *requires* real persistence. localStorage caps at ~5MB which doesn't fit even one or two PDFs; defaulting to it would deliver a half-feature that forgets the documents between sessions.

**Decision:** a lightweight managed backend (Supabase or equivalent) — the honest answer for a personal tool that needs to remember uploaded PDFs across sessions.

PRD implication: §18 (tech stack) adds a backend. `.env.local` gains backend credentials. A new ticket adds the schema and a thin data-access layer; document storage is a separate concern from the analyzer.

---

## 2. Two taxonomies — keep both, model saved policies as a list

Two genuinely different axes:

- **`CategoryKey`** (39 values) — coverage *dimensions within* a policy (`medical_treatment`, `fire_damage`, `roadside_assistance`, …). **Unchanged from v1.** Owned by `lib/categories.ts`.
- **`InsuranceProduct`** (new) — top-level *grouping* (`car`, `home`, `pet`, `travel`, `personal_liability`, …). Owned by a new `lib/products.ts` (parallel to categories.ts).

Do not merge them.

**Nuance — model saved policies as a list, not a fixed slot per product:** a person can have two car policies from different companies (`car 1 / Folksam`, `car 2 / If`). The saved unit is therefore **a list of policies, each tagged with an `InsuranceProduct`** — never "one policy per product."

Sketch:
```
SavedPolicy {
  id: string
  product: InsuranceProduct
  name: string          // user-given, e.g. "Volvo XC60 — Folksam"
  files: SavedFile[]    // PDFs the user uploaded
  extractedAt: Date     // when the analyzer last summarised it
}
```

PRD implication: §11 (data model) adds `InsuranceProduct` and `SavedPolicy`. §15 (component map) adds saved-set UI.

---

## 3. Chat scope — document-grounded only, both policies in current comparison

**Decision:** the chat box on the summary screen defaults to knowing both policies in the current comparison.

Keep the v1 "no market knowledge" rule (analyzer RULE-2) intact for chat. The moment the chat freelances on what other insurers typically offer, we lose the grounding guarantee that's the entire point of the tool.

PRD implication: §12 (AI behavior rules) gains a chat-specific subsection. Identical RULE-2 phrasing applies; new rule mandates: "answer only from the two policy documents in the current comparison and the previously-extracted comparison result; if the answer is not in those, say so plainly."

---

## 4. Chat model and history — Haiku-class, capped, session-only

**Decision:**

- **Model:** Haiku-class — meaningfully cheaper. Chat Q&A over already-extracted content is not the hard reasoning task the original analysis is.
- **History:** cap at 10–15 turns. Beyond that, summarise older turns into a system message.
- **Persistence:** session-only. We do not save chat threads.

PRD implication: §18 (tech stack) lists a second model string. The chat route in §13 is separate from `/api/analyze` and uses the cheaper model.

---

## 5. Onboarding — offer both, don't force

**Decision:** on first run, the user can either (a) add their current set or (b) jump straight into a v1-style ad-hoc two-policy compare.

Forcing the walkthrough is friction for someone who just wants one quick comparison. The "saved current insurances" feature is opt-in. Users who add a saved set get the "current vs offer" defaults automatically thereafter.

PRD implication: §10 (user flow) gains a branching first-screen. §3 (success criteria) adds: "a returning user with a saved set lands directly in compare mode with their current insurance pre-loaded."

---

## 6. Dropping the priorities step — reframes the recommendation, not just a deleted screen

In v1, the "pick 3 priorities" step fed the recommendation weighting. Removing the screen also removes that weighting input.

**Decision:** with "current vs offer" as the implicit frame, the recommendation reframes around *current-vs-offer, dimension by dimension* — is the offer better than what you have, per category, with no user-supplied ranking.

**Implications for the next PM session:**

- The system-prompt ticket (v1's INS-2 equivalent) changes — RULE-9 (recommendation reasons reference rows) stays, but the *verdict logic* shifts from priority-weighted to current-vs-offer comparative.
- Verdict values (`switch | stay | too_close`) still fit the new frame — they fit it *better*, in fact — but the prompt must state the new framing explicitly so the model knows it's not weighting by user priorities.
- The API request body drops `priorities` from `/api/analyze`. Update `lib/types.ts` and the route accordingly.
- v1's `lib/prompt.ts` RULE-1 through RULE-10 mostly carry over; the changes are concentrated in RULE-9 and a new framing statement before the rules.

**Credit:** this point was flagged by an outside reviewer after the initial PM pass; the v1 PM (me) treated dropping step 2 as a UI-only change and missed the prompt impact. Noting it explicitly so the v2 PM session catches it.

---

## What the next PM session must read first

1. `PRD.md` — the v1 source of truth
2. This file
3. The v1 ticket map and file ownership (`INS-1` through `INS-12`) — to understand what already exists and which file-ownership rules carry over

Only after reading those three, the PM rewrites the relevant `PRD.md` sections and generates the v2 ticket map (`INS-13` onward).

## What stays unchanged from v1

- The orchestration process (`orchestration.md`) — same checkpoint gates, same autonomous loop, same code-QA workflow.
- `CLAUDE.md` agent contract and rules — including the `lib/constants.ts` shared-infrastructure carve-out added during the v1 run.
- The GitHub Actions pipeline (`build`, `code-qa`, `post-merge`, branch protection).
- All v1-shipped UI primitives that still apply: `ErrorMessage`, `LoadingScreen`, `ComparisonTable`, `RecommendationCard`. They may be edited under v2 tickets but their ownership structure remains.

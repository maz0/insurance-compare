# CLAUDE.md — Insurance Compare

---

## Agent operating contract (applies to every agent, every ticket)

- **If a decision is not in your ticket, the PRD, or this file — stop.** Move the ticket to Blocked, post the question as a comment, and wait. Do not guess.
- **Do not edit `PRD.md`.** If you believe it is wrong, raise it as a comment to the human — even if you are not currently holding a ticket.
- **Never merge your own PR.** Open it, move the ticket to In Review, and wait for code-QA and human review.
- **Implement the ticket, nothing more.** No refactoring, no cleanup, no "while I'm here" changes to files the ticket does not own.

---

## Project

- **Name:** Insurance Compare
- **Linear prefix:** `INS`
- **Branch naming:** `feature/INS-[N]-short-description`
- **Run locally:** `npm run dev` — no deployment configuration

---

## Tech stack

| | |
|---|---|
| Framework | Next.js 15, App Router, TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (new-york style) |
| Icons | lucide-react |
| AI (in-app) | `claude-sonnet-4-6` — confirmed current; INS-3 agent should sanity-check the exact ID against platform.claude.com/docs before hardcoding |
| State | React useState / useReducer only |

---

## Code rules

- No inline styles — Tailwind classes only, zero exceptions
- No `any`, no `@ts-ignore` — fix the type properly
- No hardcoded UI strings — use `lib/constants.ts`
- `npx tsc --noEmit` must pass with zero errors before opening a PR
- Secrets live in `.env.local` — never commit them, never log document contents or extracted quotes

## File ownership rules

- `CategoryKey` enum and `CATEGORY_LABELS` live in `lib/categories.ts` — do not redefine or duplicate elsewhere
- All TypeScript interfaces (`ComparisonRow`, `PolicyEntry`, `Recommendation`, `AnalysisResult`, `AppError`, `AppState`, `PolicyInput`) live in `lib/types.ts`
- System prompt lives in `lib/prompt.ts` — do not inline prompt logic in the API route
- Error message strings and accepted file-type constants live in `lib/constants.ts`, keyed by `AppErrorCode` — this is the single owner of what file types are accepted and rejected; do not define accepted types elsewhere
- File validation logic (type checking, size checking, .docx rejection) lives in `components/upload/PolicyComposer.tsx` — no other component implements it
- shadcn/ui primitives live in `components/ui/` — do not edit them manually. INS-1 installs the set known to be needed at scaffold time. A later UI ticket may install additional shadcn primitives (and their transitive Radix dependencies) when its acceptance criteria demonstrably require them, **provided the PR description explicitly lists each primitive added and the criterion it serves.** This is the only carve-out to "no new npm dependencies without a ticket that explicitly authorizes them" — non-shadcn dependencies still require a separately-authorizing ticket.

## Scope rules

- A ticket owns the files listed in its ticket. It touches no others.
- No deployment configuration — this project runs locally only
- No new npm dependencies without a ticket that explicitly authorizes them

### `lib/constants.ts` is shared infrastructure (additive carve-out)

`lib/constants.ts` is the single home for user-facing strings, accepted file types, and similar small constants. To satisfy both this rule and the "no hardcoded UI strings" code rule, **any ticket may add new exported constants to `lib/constants.ts` without it being a scope violation**, under these conditions:

- The edit is **purely additive** — new exports only. No modification or reordering of existing exports. No restructuring of the file.
- The new constants are limited to what the ticket actually consumes. No speculative additions.
- Existing rules still apply: `ERROR_MESSAGES` is keyed by `AppErrorCode` and shall not be edited outside that contract; `ACCEPTED_FILE_TYPES` is the single source of accepted file types and is owned by the original ticket.
- The PR description must briefly mention the additions (one line is enough).

This is the only file with this carve-out. All other "Files owned" rules remain strict.

---

## Linear hygiene — labels

When you file **or update** a ticket in Linear, apply the label that matches its nature. Labels are what makes the board readable at a glance — an unlabelled ticket is harder to triage and easier to lose.

Canonical labels for this project:

| Label | Apply to |
|---|---|
| `checkpoint` | Tickets that are Checkpoint A, B, or C. The PM agent applies this at ticket-generation time; nobody else adds or removes it. |
| `bug` | Any ticket filed in response to a defect — QA-caught failures, code-bug sub-loop tickets, regression reports, or anything that fixes broken behavior rather than building new behavior. **Every bug ticket must carry this label**, including bugs the dev agent or QA agent files mid-loop. |

If you need a label that doesn't exist yet, **stop and propose it as a comment on the ticket.** Do not invent new labels unilaterally — that defeats the point of a small, meaningful taxonomy.

---

## If you are blocked

1. Move the Linear ticket to **Blocked**
2. Post a comment stating: what is unclear, which PRD section or ticket field, and the options you see — without picking one
3. Stop. Do not proceed on an assumption.

---

*Implementing agents: your full spec is `PRD.md`. The build process is in `orchestration.md` — that is the human's reference, not yours.*

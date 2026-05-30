# orchestration.md — Agent Build Process (Reusable Template)

**Version:** 2.0
**Status:** Reusable — copy this file unchanged into any new project.
**Companion to:** `PRD.md` (the product source of truth)

---

## 0. What this document is

The PRD says **what** to build. This document says **how the build runs** when the
builders are agents and the human is in the loop at specific points.

It is process, not product, and it is **project-agnostic**. It contains no project
names, no ticket numbers, no feature lists. Everything project-specific is read
from `PRD.md` at the start of the run. To reuse it: copy this file unchanged into
a new project folder, add a `PRD.md`, and run (see Part 1).

It changes on a different clock than the PRD: the PRD is per-project; this file is
stable across projects and tweaked only as the process itself improves.

**Reference direction is one-way.** This document points *into* the PRD. The PRD
must never point back here — the PRD stays self-contained and readable on its own.
The only sanctioned bridge between process and product is `CLAUDE.md`, which
carries the short always-on rules every agent needs (see Part 7).

Audience: the human running the build, and the PM agent. Implementing agents read
their ticket, the PRD, and `CLAUDE.md` — not this document.

---

## 1. Inputs to this process — and how to "run" it

This process expects exactly one project-specific file alongside it:

- **`PRD.md`** — what to build. The single source of truth. Everything
  project-specific is derived from it.

**Running the process:** drop `orchestration.md` and `PRD.md` into a project
folder. The entry point is a single instruction to the PM agent: *"Read
orchestration.md, then read PRD.md, then begin."* The PM agent validates the PRD
against the prerequisites below, derives the project specifics, generates the
tickets, and stops at Checkpoint 0 for the human.

### PRD prerequisites (the PM agent checks these first)

This process is reusable **only if the PRD contains the following**, in a findable
form. The PM agent's first action is to confirm each is present. If any is
missing, the PM agent **halts and reports** — it does not improvise the missing
piece. (Strict by design: a silently-filled gap is the failure mode no one sees.)

| The PRD must define | Used for |
|---|---|
| Project name | Linear project name, labels |
| Ticket prefix (e.g. `IC`, `ABC`) | Ticket IDs, branch names |
| A ticket map with dependency order | The build sequence |
| A component / file map | What files each ticket owns |
| A data model / type contract | Checkpoint A verification |
| AI-behavior rules (or equivalent spec) | Prompt verification, if the project uses a model |
| A defined set of error states | QA matrix, error handling |
| A stated scope (in / out) | QA matrix, scope discipline |

Wherever this document refers to *the project name*, *the ticket prefix*, *the
ticket list*, or *the QA matrix*, those values come from the PRD — they are never
written into this file.

---

## 2. The build pipeline

```
PRD.md  (source of truth — approved before the run begins)
   │
   ▼
PM agent  ── validates PRD prerequisites, then splits PRD into tickets ──▶  Linear
   │
   ▼
★ CHECKPOINT 0 — human reviews generated tickets against the PRD
   │
   ▼
Implementing agent picks up a ticket
   │  reads: the ticket + the PRD sections it cites + CLAUDE.md
   ▼
Branch in GitHub:  feature/{PREFIX}-[N]-short-description
   │
   ▼
Agent implements the ticket — nothing more
   │
   ▼
Opens PR (ticket ID in title) ──▶ moves ticket to "In Review"
   │
   ▼
★ Code-QA agent reviews the PR diff  →  ★ human reviews the PR
   │
   ▼
Human merges  (agents never self-merge — see Part 5)
   │
   ▼
Next ticket in dependency order
```

Two stores, one role each:
- **Linear** — the ticket store. Holds every ticket, its state, its dependencies,
  and any agent questions raised against it.
- **GitHub** — the code store. One branch per ticket, one PR per ticket.

**Linear and GitHub are the shared state.** Agents are split across environments
(Part 3) and are never in the same context. Linear and GitHub are how a PM agent,
a coder agent, and a code-QA agent stay synchronized without meeting. This makes
the ticket-quality contract (Part 6) and the ticket-state table (Part 4) the
literal interface between environments — they matter more here, not less.

---

## 3. Which agent runs where, and on which model

Agents are placed by *what the work needs*: code work where the code lives,
document and review work outside it. Models are assigned by *where a mistake is
expensive and propagates* — capability where errors are costly and hard to see,
economy where the task is mechanical and immediately verifiable.

| Agent | Environment | Model tier | Why |
|---|---|---|---|
| PM agent | Claude | Top tier (e.g. Opus-class) | Runs once; produces the tickets everything is built from; a misread propagates everywhere. Highest-stakes task. |
| Coder agents | Cursor | Mid–strong tier (e.g. Sonnet-class) | Cursor indexes the repo, runs the editor and terminal — the right home for building. Strong model: subtly wrong code costs more than the model premium. |
| Code-QA agent | Claude | Top tier (e.g. Opus-class) | Reviews PR diffs. A reviewer must be at least as capable as the coder, ideally one tier up — a peer-model reviewer shares the coder's blind spots. Carries the security checklist. |
| Functional UI QA | Human | — | Running the app and judging the experience needs human judgment; no model does this well. |
| Ticket lane moves | None — automatic | — | A state transition, not a decision. Done as a side effect by whichever agent/human triggers the underlying event. Not an agent. |

Model tiers are written as *tiers*, not version strings, because specific model
names and pricing change. Before a run, confirm the current Claude lineup and
pricing, and the model options in Cursor (its pricing/bundling differs from the
raw API). A PRD may override these defaults for a given project.

**Current top tier (as of orchestration.md v2.0):** Claude Opus 4.7 — the newest
Opus has its largest capability gains in agentic coding, which makes it especially
well-suited for the PM and code-QA roles. **Use standard Opus 4.7, not the "Fast"
variant** — the Fast variant is priced at approximately 6× standard and the PM/
code-QA use cases gain nothing from the speed premium. The coder agents run in
Cursor — confirm Cursor exposes Sonnet 4.6 and how it bills, as Cursor's pricing
is separate from the raw API.

---

## 4. Linear ticket states

State transitions are how the human and agents stay synchronized without a
meeting.

| State | Meaning | Who moves it here |
|---|---|---|
| Backlog | Written by PM agent, not yet approved | PM agent |
| Todo | Passed Checkpoint 0, ready to pick up | Human (at Checkpoint 0) |
| In Progress | An agent is implementing it | Implementing agent |
| Blocked | Agent hit ambiguity — question posted on the ticket | Implementing agent |
| In Review | PR open, awaiting code-QA + human review | Implementing agent |
| Done | PR merged by human | Human |

Rules:
- An agent may only pick up a ticket in **Todo** whose dependencies are all
  **Done**.
- An agent that cannot proceed moves the ticket to **Blocked** and posts the
  specific question as a comment (see Part 7). It does not guess.
- Only the human moves a ticket to **Todo** or **Done**.

---

## 5. Human checkpoints

"Human in the loop somewhere" is not a plan. There are **four** named gates. Three
are specific points; one (PR review) is every ticket.

### Checkpoint 0 — Ticket fidelity (the most important one)

**When:** immediately after the PM agent writes tickets into Linear, before any
implementing agent starts.

**Why this is critical:** agents do not build from the PRD — they build from the
tickets the PM agent generated. If the PM agent drops a detail or writes a vague
ticket where the PRD was precise, every downstream agent inherits that error and
the PRD's correctness no longer protects the build. The PRD is the source of
truth; the tickets are what actually gets built. This gate confirms the two match.

**The human checks:**
- Every PRD feature maps to at least one ticket.
- The ticket dependency order matches the PRD's ticket map.
- Each ticket meets the ticket-quality contract (Part 6).
- No ticket invents scope the PRD does not contain.
- No ticket is vaguer than the PRD section it implements — especially the data
  model and the AI-behavior rules.

**Outcome:** approve, or send back to the PM agent with specific corrections. No
implementing agent starts until this passes.

### Checkpoint A — The contract ticket

**When:** after the PR for the ticket that produces the type contract, shared
enums, and the system prompt is opened — before downstream tickets proceed.

**Why:** this ticket produces the type definitions and prompt that *every*
downstream ticket depends on. A mistake here is the most expensive in the project:
it propagates into the API layer, every component, and QA. Cheapest place to catch
it.

**The human checks:** the types match the PRD data model exactly; shared enums
match the PRD exactly; the prompt encodes every AI-behavior rule from the PRD.

### Checkpoint B — First model integration

**When:** after the PR for the ticket that first calls the AI model / external
API and parses a real response.

**Why:** this is where the contract meets reality — response parsing, error
handling, content blocks. Verifying it against real input here prevents later UI
tickets from building on a broken data source.

**The human checks:** the integration handles a real input end to end; malformed
responses produce the correct error state; empty results produce the correct error
state.

### Checkpoint C — Pre sign-off

**When:** after the final QA ticket, before the project is called done.

**Why:** final human acceptance against the PRD's success criteria.

**The human checks:** the PRD success criteria are met on a real run; the QA
matrix (Part 8) passed; all error states behave.

### Every PR

Beyond the gates above, **every PR is reviewed before merge** — first by the
code-QA agent (static), then by the human. The human PR review is where the
human-in-the-loop guarantee actually lives. See Part 5 / Part 8.

---

## 6. Ticket-quality contract (instructions to the PM agent)

Because tickets — not the PRD — are what implementing agents build from, every
ticket must be complete enough to build from without guessing. Each ticket must
contain:

1. **Title** — `{PREFIX}-[N] — short description`, matching the PRD ticket map.
2. **PRD references** — the exact PRD section(s) this ticket implements. The agent
   reads those sections in full before starting.
3. **Files owned** — the exact files this ticket creates or edits, from the PRD
   component map. No ticket touches files outside its list.
4. **Dependencies** — the upstream tickets, matching the PRD order.
5. **Acceptance criteria** — the PRD Definition of Done, made specific to this
   ticket.
6. **Out of scope** — what this ticket must NOT touch. Explicit. This is what
   keeps an agent from "improving" files another ticket owns.

A ticket missing any of these six is sent back to the PM agent at Checkpoint 0.

The PM agent itself follows the operating contract (Part 7): it splits the PRD as
written and does not invent features, reorder dependencies, or resolve PRD open
questions on its own. If the PRD is ambiguous or missing a prerequisite (Part 1),
the PM agent halts and flags it to the human rather than deciding.

---

## 7. Agent operating contract

This is the rule that makes the human-in-the-loop actually work. Its short form
lives in `CLAUDE.md` so every agent sees it on every ticket; the full statement is
here.

**The core rule: do not improvise. If a decision is not already made in the
ticket, the PRD, or `CLAUDE.md`, stop and surface it to the human.**

The failure mode of agent-built software is not bad code — it is an agent meeting
an ambiguity and confidently inventing an answer instead of stopping. An invented
answer looks like progress and is discovered late. A surfaced question costs
minutes.

When an agent encounters something undefined or contradictory:
1. It moves the ticket to **Blocked**.
2. It posts a comment stating: what is ambiguous, where (PRD section or ticket
   field), and the options it sees — without picking one.
3. It stops and waits for the human. It does not guess, and it does not silently
   edit the PRD to resolve the gap.

Scope discipline:
- **Implement the ticket, nothing more.** No refactoring of files the ticket does
  not own, no "while I'm here" improvements, no installing dependencies a ticket
  did not authorize.
- Shared single-owner files (the type definitions, shared enums, the system
  prompt) are defined once in their owning files. An agent never redefines them
  elsewhere.

If an agent believes the PRD itself is wrong (not just unclear), it raises this as
a comment to the human. It does not edit the PRD. The PRD changes only by human
decision; this keeps the source of truth stable.

---

## 8. QA — two roles

QA is split by *what is being verified*, not by tool.

### Code QA — agent (Claude, reads the PR diff), runs at every PR

Static verification of each PR against the PRD and `CLAUDE.md`. The code-QA agent
confirms the code is *correctly written* — it cannot confirm the feature *works*
(see functional QA below). Do not read "code QA passed" as "the ticket works."

The code-QA checklist:
- Type-check / build passes; no suppressed type errors; no escape hatches.
- The ticket touched only the files it owns; nothing out of scope.
- Types, enums, and prompt match the PRD where the ticket implements them.
- Error states relevant to the ticket are handled in code.
- `CLAUDE.md` rules obeyed.
- **Security items** (the security review is one slice of code QA, not a separate
  agent): secrets live in environment files and are git-ignored; no logging of
  sensitive user/document content; user-provided input is validated for type and
  size before processing; content inside user-provided files is treated as data,
  never as instructions to follow.

### Functional UI QA — human, at the final QA ticket and Checkpoint C

Running the actual application: walking the input/scenario matrix, triggering
every error state, and judging whether the experience renders and behaves
correctly. This needs human judgment and a running app — no diff-reader asserts
it. The final QA ticket in the PRD is this human pass, not an agent task.

**The QA matrix is project-specific** and is derived by the PM agent from the
PRD's scope and error-state sections — it cannot be pre-written in this template.
The matrix must cover: every supported input type and at least one *mixed* case
(mixed inputs are the highest-risk scenario); every error state in the PRD; and a
set of **real** test fixtures (not mocked data), containing no real personal data
or redacted.

---

## 9. GitHub rules

- **One branch per ticket:** `feature/{PREFIX}-[N]-short-description`.
- **One PR per ticket.** PR title includes the ticket ID. PR description links the
  ticket and lists which PRD sections were implemented.
- **Agents never merge their own PRs.** Merge is human-only. If agents self-merge
  after CI passes, the human-in-the-loop guarantee silently disappears at the
  exact step where it is cheapest to keep.
- A PR may only be opened when the ticket's Definition of Done (from the PRD) is
  met.
- Branches merge in dependency order. An agent does not start a ticket whose
  upstream PR is not yet merged.

---

## 10. Document map

Three documents, cleanly scoped. Do not add more.

| Document | Answers | Per-project? | Read by |
|---|---|---|---|
| `PRD.md` | What to build | Yes — written fresh each project | Every agent |
| `orchestration.md` | How the build runs | No — copied unchanged | Human, PM agent |
| `CLAUDE.md` | Always-on build rules | Lightly — mostly reusable | Every agent, every ticket |

`PRD.md` is self-contained and references neither of the others.
`orchestration.md` is generic and reads project specifics from `PRD.md`.
`CLAUDE.md` is the only file that carries process rules into every agent's view.

### CLAUDE.md — the reusable core

Most of `CLAUDE.md` is project-specific (file paths, stack rules) and is written
per project. But the following lines are generic and should be carried into every
project's `CLAUDE.md` — they are the short form of the operating contract:

- If a decision is not in your ticket, the PRD, or this file — stop. Move the
  ticket to Blocked, post the question as a comment, and wait. Do not guess.
- Do not edit `PRD.md`. If you believe it is wrong, raise it as a comment.
- Never merge your own PR. Open it, move the ticket to In Review, and wait for
  code-QA and human review.
- Implement the ticket, nothing more.

---

## 11. Reuse checklist

To start a new project with this process:

1. Create a project folder. Copy `orchestration.md` into it **unchanged**.
2. Write `PRD.md` for the new project. Ensure it satisfies every PRD prerequisite
   in Part 1.
3. Write the project's `CLAUDE.md`, including the reusable core lines from
   Part 10.
4. Confirm current model tiers and pricing (Part 3); set any PRD override if
   wanted.
5. Instruct the PM agent: *"Read orchestration.md, then read PRD.md, then begin."*
6. The PM agent validates the PRD, generates tickets, and stops at Checkpoint 0.
7. Review at Checkpoint 0, then let the build run through the checkpoints.

---

## 12. Autonomous Epic Mode

### 12.0 What this mode is, and when it is allowed

The standard process (Parts 1–11) gates every PR on a human review before merge.
**Autonomous Epic Mode** lets the build run unattended between a small number of
human checkpoints — the orchestrator builds, verifies, and merges mechanical
tickets on its own, and parks itself at checkpoint tickets for human review.

This mode trades a measure of safety for unattended progress. It is **only
appropriate when the cost of a bad run is low and bounded**:

- The work is in version control; every change is an isolated, revertable PR.
- The project is internal / low-stakes — no external users, no production data,
  no irreversible side effects.
- A worst-case unattended run produces *wrong code on a branch*, not damage.

If those conditions do not hold, do not use this mode — use the standard process.
The decision to enable this mode is the **human's**, made per epic, and recorded
in the PRD decisions log.

### 12.1 The orchestrator loop

Autonomous mode requires an **orchestrator** — a script or scheduled process that
drives the build. It is not an agent that makes judgments; it is a sequencer. Its
loop:

```
LOOP:
  1. Find the next ticket in state Todo whose dependencies are all Done.
       - none found → STOP (epic complete, or all remaining work is blocked)
  2. If that ticket is a CHECKPOINT ticket (see 12.3):
       → do not start it. Post "Checkpoint reached — awaiting human." HALT.
  3. Hand the ticket to a dev agent with the standard dev-agent prompt.
  4. Wait for the dev agent to open a PR (ticket → In Review),
     or to move the ticket to Blocked.
       - ticket went Blocked → HALT (see 12.5)
  5. Run the merge gate (see 12.2) on the PR.
       - gate PASS → merge PR, ticket → Done. Go to 1.
       - gate FAIL → run the code-bug sub-loop (see 12.4).
```

The orchestrator never merges a checkpoint ticket and never merges on a failed
gate. It only ever does two things on its own: merge a green non-checkpoint PR,
and advance to the next ticket.

### 12.2 The merge gate (replaces live human merge for non-checkpoint tickets)

In the standard process, a human reviews and merges every PR. In autonomous mode,
for **non-checkpoint tickets only**, that human merge is replaced by an automated
gate. A PR merges only if **all** of these pass:

1. **Build & type-check** — the project builds; `tsc --noEmit` is clean.
2. **Automated checks** — lint and any automated tests/assertions pass.
3. **Code-QA agent approval** — the code-QA agent (Part 8) has reviewed the PR
   diff and posted explicit approval as a PR comment.

If any fails, the PR does **not** merge — the orchestrator runs the code-bug
sub-loop (12.4).

**The code-QA agent is the only quality gate on unattended tickets.** On every
ticket the human does not personally review, "build green + code-QA approved" is
the entire bar. This has two consequences that are not optional:

- The code-QA agent runs on a **strong model** (Part 3 — top tier). Under
  autonomy this matters more, not less: it is standing in for the human reviewer.
- The code-QA checklist (Part 8) must explicitly cover the things a human would
  otherwise catch by eye on a mechanical ticket:
  - **Scope adherence** — the PR touched only the files the ticket owns; nothing
    out of scope.
  - **CLAUDE.md compliance** — no `any`/`@ts-ignore`, no inline strings, no
    hand-edited `components/ui/` files, secrets handling correct.
  - **Single-owner rules** — shared types/enums/prompt not redefined.
  - **PR-callout requirement** — if the PR adds a shadcn primitive, the PR
    description lists each primitive and the criterion it serves (per CLAUDE.md).
  - **Acceptance criteria** — every criterion in the ticket is actually met.

A shallow code-QA agent does not make autonomous mode faster — it removes the
gate and replaces it with nothing.

### 12.3 Checkpoint tickets — hard stops + verification artifact

Some tickets carry decisions an agent cannot safely self-certify. These are
**checkpoint tickets**. The pattern at each checkpoint:

1. The dev sub-agent builds the ticket and opens a PR (auto-merge enabled, same
   as a non-checkpoint ticket).
2. The build and code-QA gates run. **For checkpoint tickets, code-QA additionally
   posts a structured verification comment on the PR** — criterion-by-criterion,
   each criterion getting ✅/❌, a literal quoted code/config excerpt, and one
   sentence of plain English. For tickets that modify a prompt file
   (`lib/prompt.ts`), the comment quotes the **entire file** before/after side
   by side — **not** a single named export. Prompt logic can live in helper
   functions (e.g. user-prompt builders) as well as in the `SYSTEM_PROMPT`
   constant, and a narrower artifact masks those changes. The principle
   generalises: **a checkpoint verification artifact must match the scope of
   where the change can live, not the scope the reviewer assumed it would.**
   (Rule earned the hard way during INS-15, where a narrow `SYSTEM_PROMPT`-only
   artifact almost cost a wrong revert.)
3. The human reviews the **verification comment** as the checkpoint pass — not
   the raw diff. The artifact is what makes the gate honest about what a
   non-developer can actually verify. Reading this comment IS Checkpoint A / B / C.
4. The orchestrator HALTS at the checkpoint. To release the loop, the human
   moves the next eligible ticket(s) to **Todo** in the ticket tracker. The
   move is the signal; there is no other "approve" action.

The earlier phrasing "the orchestrator does not start it, build it, or merge
anything" was too strict — the verification artifact is more useful than gating
the build, and a non-developer cannot judge a raw diff anyway. The hard-stop is
on **what fires next**, not on building the checkpoint ticket itself.

Which tickets are checkpoints is **derived from the PRD's checkpoints** (Part 5)
and tagged in the ticket tracker before the run. For a typical build:

| Checkpoint ticket | Why it is a hard stop |
|---|---|
| The type/prompt-contract ticket (Checkpoint A) | Highest-leverage artifact; everything downstream consumes it. The prompt's rule-traceability table needs a human read. |
| The first model-integration ticket (Checkpoint B) | First time the contract meets a real model response. **Higher stakes when the prompt is being *changed* rather than newly built** — surviving prose can silently corrupt behaviour. |
| The final QA ticket (Checkpoint C) | This is the human functional pass — see 12.6. It is a human task, not an agent task. |

This yields roughly **3–4 human reviews across an entire epic** instead of one
per ticket. The human reviews where judgment is required and nowhere else; the
mechanical tickets between checkpoints run unattended.

### 12.3a Mid-build functional QA milestone (soft checkpoint)

Pick the first ticket in the dependency chain whose merge makes the user flow
**clickable end-to-end**, even if half the surface is missing. After it merges,
the orchestrator HALTS for a **soft checkpoint**: the human runs the half-built
app, exercises the flow, and either posts feedback (new tickets / PR comments)
or releases the loop.

This catches drift between the ticket map and what the app actually does, far
earlier than waiting for the final Checkpoint C QA pass. The verification comment
pattern is text-level; the soft checkpoint is behaviour-level. They cover
different failure modes.

The milestone ticket is identified at **Checkpoint 0** (alongside the hard
checkpoints) and tagged in the ticket tracker (`mid-build-qa` or equivalent).
The human always performs it; the orchestrator never auto-releases past it.

### 12.4 Code-bug sub-loop (automated fixing — code bugs only)

When the merge gate fails on a non-checkpoint PR, the failure is — by
construction — a **code bug**: a build break, a type error, a lint failure, a
failed automated assertion. These are machine-detectable and unambiguous, so an
agent may fix them unattended:

```
CODE-BUG SUB-LOOP:
  1. File a bug ticket capturing the exact failure (the failing check + output).
  2. Hand the bug ticket to a dev agent.
  3. Dev agent fixes on the same branch / a fix branch; re-runs the merge gate.
  4. Gate PASS → merge, ticket → Done, return to main loop.
     Gate FAIL again → retry up to N times (recommend N = 2).
  5. After N failed attempts → HALT. Leave the ticket Blocked with the full
     failure history for the human.
```

**Scope limit — this sub-loop is for code bugs only.** It handles failures that
an automated check can *detect*. It does **not** handle anything requiring
judgment about whether the product is correct or behaves well — that is functional
QA (12.6) and stays human. An agent must never be put in a position of deciding
whether a feature "works" — only whether a check passes.

The retry cap exists so a ticket the agent cannot fix does not loop forever
burning tokens. Two attempts, then a human looks.

### 12.5 Halt conditions

The orchestrator stops the run — and waits for a human — on any of:

- **Checkpoint reached** — a checkpoint ticket is next, or has just merged with
  the verification comment posted (12.3).
- **Mid-build QA milestone reached** — the soft-checkpoint ticket just merged;
  the half-built app is now clickable and waiting on the human's hands-on pass (12.3a).
- **Ticket Blocked** — a dev agent hit ambiguity and moved its ticket to Blocked.
  The whole loop halts, not just that agent: a blocked ticket usually has
  dependents, and skipping ahead would build on an unfinished foundation.
- **Code-bug retry cap exceeded** — the sub-loop could not fix a failure in N
  attempts (12.4).
- **No eligible ticket** — nothing in Todo has all dependencies Done. Either the
  epic is complete, or everything remaining is waiting on a halted ticket.

On any halt, the orchestrator posts a clear status: which ticket, why it halted,
and what the human needs to do. The morning review starts from that message.

### 12.6 What stays human — non-negotiable

Autonomous mode does **not** automate these. They remain human, exactly as in the
standard process:

- **Checkpoint reviews** (A, B, C, plus the mid-build QA milestone in 12.3a) — reading the verification comment for each hard checkpoint and running the app for the soft one.
- **Functional QA** — running the actual application and judging whether it
  behaves and looks correct. No agent does this. The final QA ticket is a human
  ticket. Automated checks (build, types, assertions) are not functional QA and
  must not be presented as if they were.
- **PRD changes** — the PRD is still changed only by human decision.
- **Releasing the loop after a halt** — the orchestrator never restarts itself
  past a checkpoint or a Blocked ticket. A human releases it.

### 12.7 Enabling autonomous mode for an epic — checklist

Before starting an unattended run:

1. Confirm the low-stakes conditions in 12.0 hold for this epic. Record the
   decision in the PRD decisions log.
2. Confirm **Checkpoint 0 has passed** — autonomous mode runs *after* the human
   has reviewed the generated tickets. It does not automate Checkpoint 0.
3. Tag the checkpoint tickets (12.3) in the ticket tracker.
4. Confirm the code-QA agent is on a strong model and its checklist includes the
   12.2 additions.
5. Confirm the merge gate (CI + code-QA approval) is actually wired — a gate that
   is not enforced is not a gate.
6. Confirm "Blocked" halts the orchestrator, not just the dev agent.
7. Set the code-bug retry cap (recommend N = 2).
8. Start the orchestrator. Let it run to the first halt.

---

*End of Part 12 — Autonomous Epic Mode*
*End of orchestration.md v2.0 — reusable template*

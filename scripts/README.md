# scripts/

Infrastructure for Autonomous Epic Mode (orchestration.md §12). These are
**not** application code — they run in GitHub Actions and gate PRs.

| File | Purpose |
|---|---|
| `code-qa.sh` | The sole quality gate on unattended PRs. Reads PR diff + Linear ticket, calls Claude with the §12.2 expanded checklist, posts `code-qa: success` / `code-qa: failure` status. On REJECT: moves the Linear ticket to Blocked so the orchestrator halts. |
| `code-qa-guard.sh` | Finalizer that posts an explicit `code-qa: failure` status if the main script fails to complete (internal error, timeout, OOM). Prevents the "no status posted, PR stuck forever" failure mode. |

## Required secrets (set in repo Settings → Secrets and variables → Actions)

- `ANTHROPIC_API_KEY` — used by `code-qa.sh` to call Claude. **Use a separate key from your local `.env.local`** and set a usage cap in the Anthropic console.
- `LINEAR_API_KEY` — used by `code-qa.sh` to fetch the ticket and to move it to Blocked on rejection.
- `GITHUB_TOKEN` — auto-provided by Actions; used to post commit statuses and PR comments.

## Required branch protection on `main`

- Require PR before merge
- Required status checks (strict): `build`, `code-qa`
- Disallow direct pushes / force-push / branch deletion
- Allow auto-merge (repo Settings → General → Pull Requests)

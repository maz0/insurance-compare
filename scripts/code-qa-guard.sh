#!/usr/bin/env bash
# code-qa-guard.sh — finalizer that posts an explicit failure status when the
# main code-qa step couldn't complete (internal error, timeout, OOM, etc).
#
# Without this, a stalled code-qa Action leaves the PR with no code-qa status —
# branch protection blocks merge identically to a failure, and the orchestrator
# never advances. This script guarantees a status is always posted.

set -euo pipefail

REASON="${1:-unknown}"

: "${GITHUB_TOKEN:?missing GITHUB_TOKEN}"
: "${PR_HEAD_SHA:?missing PR_HEAD_SHA}"
: "${PR_NUMBER:?missing PR_NUMBER}"
: "${PR_TITLE:?missing PR_TITLE}"
: "${REPO:?missing REPO}"

DESC="code-qa Action did not complete: $REASON"

# Check if a code-qa status was already posted on this SHA — if so, do nothing.
EXISTING=$(curl -sS \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$REPO/commits/$PR_HEAD_SHA/statuses" \
  | jq -r '.[] | select(.context == "code-qa") | .state' | head -1 || true)

if [ -n "$EXISTING" ]; then
  echo "code-qa status already posted ($EXISTING) — guard not needed"
  exit 0
fi

curl -sS -X POST "https://api.github.com/repos/$REPO/statuses/$PR_HEAD_SHA" \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -d "$(jq -n --arg d "$DESC" '{state: "failure", context: "code-qa", description: $d}')" > /dev/null

# Best-effort comment; don't fail the guard if the comment fails
curl -sS -X POST "https://api.github.com/repos/$REPO/issues/$PR_NUMBER/comments" \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -d "$(jq -n --arg b "**code-qa: FAILURE (infrastructure)**

The code-qa Action did not complete: \`$REASON\`. Inspect the workflow log. Merge is blocked by branch protection until \`code-qa\` is green." '{body: $b}')" > /dev/null || true

# Best-effort: also move the Linear ticket to Blocked so the orchestrator halts.
if [ -n "${LINEAR_API_KEY:-}" ]; then
  TICKET_ID=$(echo "$PR_TITLE" | grep -oE 'INS-[0-9]+' | head -1 || true)
  if [ -n "$TICKET_ID" ]; then
    BLOCKED_STATE=$(curl -sS -X POST https://api.linear.app/graphql \
      -H "Authorization: $LINEAR_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"query":"query { workflowStates(filter: {team: {key: {eq: \"INS\"}}, name: {eq: \"Blocked\"}}) { nodes { id } } }"}' \
      | jq -r '.data.workflowStates.nodes[0].id // empty')

    if [ -n "$BLOCKED_STATE" ]; then
      ISSUE_UUID=$(curl -sS -X POST https://api.linear.app/graphql \
        -H "Authorization: $LINEAR_API_KEY" \
        -H "Content-Type: application/json" \
        -d "$(jq -n --arg id "$TICKET_ID" '{
          query: "query($id: String!) { issue(id: $id) { id } }",
          variables: { id: $id }
        }')" | jq -r '.data.issue.id')

      if [ -n "$ISSUE_UUID" ]; then
        curl -sS -X POST https://api.linear.app/graphql \
          -H "Authorization: $LINEAR_API_KEY" \
          -H "Content-Type: application/json" \
          -d "$(jq -n --arg id "$ISSUE_UUID" --arg s "$BLOCKED_STATE" '{
            query: "mutation($id: String!, $s: String!) { issueUpdate(id: $id, input: { stateId: $s }) { success } }",
            variables: { id: $id, s: $s }
          }')" > /dev/null
      fi
    fi
  fi
fi

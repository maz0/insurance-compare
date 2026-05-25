#!/usr/bin/env bash
# move-to-done.sh — on PR merge, move the Linear ticket referenced in the PR
# title from "In Review" to "Done". Best-effort; never fails the workflow.
#
# Only moves tickets that are currently in "In Review". Tickets in other
# states (Blocked, Done, Cancelled) are left alone — those states are
# intentional and shouldn't be overwritten by a merge that probably
# shouldn't have happened from that state anyway.

set -uo pipefail  # deliberately no -e: every failure is non-fatal

: "${LINEAR_API_KEY:?missing LINEAR_API_KEY}"
: "${PR_TITLE:?missing PR_TITLE}"

TICKET_ID=$(echo "$PR_TITLE" | grep -oE 'INS-[0-9]+' | head -1 || true)
if [ -z "$TICKET_ID" ]; then
  echo "PR title contains no INS-N ticket id — nothing to do"
  exit 0
fi
echo "Ticket: $TICKET_ID"

# Resolve the "Done" state on the INS team
DONE_STATE_ID=$(curl -sS -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"query { workflowStates(filter: {team: {key: {eq: \"INS\"}}, name: {eq: \"Done\"}}) { nodes { id } } }"}' \
  | jq -r '.data.workflowStates.nodes[0].id // empty')

if [ -z "$DONE_STATE_ID" ]; then
  echo "::warning::No 'Done' state found on INS team — leaving $TICKET_ID as-is"
  exit 0
fi

# Fetch the issue + its current state
ISSUE_JSON=$(curl -sS -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg id "$TICKET_ID" '{
    query: "query($id: String!) { issue(id: $id) { id state { name } } }",
    variables: { id: $id }
  }')")

ISSUE_UUID=$(echo "$ISSUE_JSON"   | jq -r '.data.issue.id         // empty')
CURRENT_STATE=$(echo "$ISSUE_JSON" | jq -r '.data.issue.state.name // empty')

if [ -z "$ISSUE_UUID" ]; then
  echo "::warning::Could not fetch Linear issue $TICKET_ID"
  exit 0
fi

# Only move from "In Review". Anything else is left alone.
if [ "$CURRENT_STATE" != "In Review" ]; then
  echo "Ticket $TICKET_ID is in '$CURRENT_STATE' — leaving as-is (only move from 'In Review')"
  exit 0
fi

# Move to Done
RESULT=$(curl -sS -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg id "$ISSUE_UUID" --arg s "$DONE_STATE_ID" '{
    query: "mutation($id: String!, $s: String!) { issueUpdate(id: $id, input: { stateId: $s }) { success } }",
    variables: { id: $id, s: $s }
  }')")

SUCCESS=$(echo "$RESULT" | jq -r '.data.issueUpdate.success // false')
if [ "$SUCCESS" = "true" ]; then
  echo "✓ Moved $TICKET_ID: In Review → Done"
else
  echo "::warning::Failed to move $TICKET_ID to Done: $(echo "$RESULT" | jq -c '.')"
fi

# Five reproducible workflow scenarios

Use only disposable demo claims. These steps call the real API, with no SQL edits,
seeding endpoint, or fake results. No extra tooling beyond Node and curl is needed.
All command IDs below are generated fresh except deliberate idempotency replays.

## Prerequisites and safe isolation

Use a Node runtime compatible with the installed native SQLite binding (verified
with 22.15.1; newer installed tooling declares ^22.22.3 or compatible newer major).
Install backend and frontend dependencies with that same Node runtime on PATH.

In terminal A, from `backend/`, create a NEW disposable directory and start the API
on an unused port. This never touches `backend/data/claims.sqlite`:

```sh
npm ci
export CWO_DEMO_DIR="$(mktemp -d "${TMPDIR:-/tmp}/claims-demo.XXXXXX")"
export SQLITE_DATABASE_PATH="$CWO_DEMO_DIR/claims.sqlite"
export PORT=3109
export NODE_ENV=development
export DEMO_IDENTITY_ENABLED=true
npm run start:dev
```

In terminal B, from `frontend/`:

```sh
npm ci
API_PROXY_TARGET=http://127.0.0.1:3109 npm run dev
```

Open the URL Vite prints. `/api` requests go through Vite's same-origin proxy; no
backend CORS change is needed. API_PROXY_TARGET is server-side configuration,
not a client-exposed VITE variable. Match it to the backend's actual origin/PORT.
The example origins are local run instructions, not hardcoded application URLs.

The selector supports claimant-1, claimant-2, and adjuster-1 only. It clears prior
actor data when switched. This is development impersonation, not authentication.
Production bundles show an unavailable notice and contain no actor selector;
the backend also independently rejects production/disabled-demo requests.

To reset: stop the disposable backend, create a NEW mktemp directory, change
SQLITE_DATABASE_PATH, and restart. Refresh the UI. Retain old directories for
review; do not delete/reset a database containing user data. There is no UI or
API reset/delete route. Never edit applied migrations or stored checksums.

## Curl helpers (terminal C)

Set the origin matching terminal A. Helpers use only the documented API and
allowlisted demo identities. Use the exact controlled JSON inputs shown below.

```sh
export CWO_API_BASE_URL=http://127.0.0.1:3109

create_demo_claim() {
  curl -sS -i "$CWO_API_BASE_URL/api/claims" \
    -H 'Content-Type: application/json' -H 'X-Demo-Actor-Id: claimant-1' \
    --data '{"title":"Disposable workflow scenario","description":"Created intentionally for a local demo."}'
}

transition_demo_claim() {
  local cwo_actor="$1" cwo_transition="$2" cwo_revision="$3" cwo_input="$4"
  local cwo_command_id="${5:-$(node -p 'crypto.randomUUID()')}"
  curl -sS -i "$CWO_API_BASE_URL/api/claims/$CWO_CLAIM_ID/transitions" \
    -H 'Content-Type: application/json' -H "X-Demo-Actor-Id: $cwo_actor" \
    --data "{\"transitionId\":\"$cwo_transition\",\"expectedRevision\":$cwo_revision,\"commandId\":\"$cwo_command_id\",\"input\":$cwo_input}"
}
```

For EACH scenario run `create_demo_claim`, expect 201, and copy its returned `id`:

```sh
export CWO_CLAIM_ID='paste-the-real-returned-UUID-here'
```

Use a fresh claim for each scenario. Do not substitute an existing user claim.

## Workflow versions and local payment records

New claims use immutable workflow version 2. Version 1 remains unchanged; existing
claims retain their pinned definition, including its terminal approval/rejection.
Use fresh claims for these scenarios. IDs use lowercase snake_case, corresponding
to the challenge's uppercase state names. Draft creation precedes SUBMITTED.
Migration 005 adds only an immutable local payment-initiation record linked to its
success audit event. No money is transferred and no payment provider is called.

The UI discovers all actions and input forms from the API. Select the owner for
Submit/Provide information and the adjuster for all other transitions. Confirm
one action at a time; state, revision, cycle count, actions and audit refresh.

## 1. Approval, payment initiation and closure

For a fresh claim:

```sh
transition_demo_claim claimant-1 submit 0 '{}'
transition_demo_claim adjuster-1 verify_documents 1 '{}'
transition_demo_claim adjuster-1 start_assessment 2 '{}'
transition_demo_claim adjuster-1 approve 3 '{}'
transition_demo_claim adjuster-1 initiate_payment 4 '{}'
transition_demo_claim adjuster-1 close_paid 5 '{}'
```

All return 200. Audit destinations are submitted, documents_verified,
under_assessment, approved, payment_initiated, closed. Final revision 6, count 0,
six events, one approval notification and one local payment record. CLOSED has
no discovered outgoing actions. The payment record is persisted server-side;
notificationIds contains notification IDs only.

## 2. Role and ownership denial

For a fresh draft:

```sh
transition_demo_claim adjuster-1 submit 0 '{}'
curl -sS -i "$CWO_API_BASE_URL/api/claims/$CWO_CLAIM_ID" -H 'X-Demo-Actor-Id: claimant-2'
```

Expect 403 TRANSITION_FORBIDDEN and 404 CLAIM_NOT_FOUND. Claim remains revision 0.
On an approved claim, claimant-1 attempting initiate_payment also receives 403;
only adjusters can initiate payment or close a claim. The UI disables actions
based on discovery; the backend independently enforces access.

## 3. Information loop, lifetime limit and completion

For a fresh claim:

```sh
transition_demo_claim claimant-1 submit 0 '{}'
transition_demo_claim adjuster-1 verify_documents 1 '{}'
transition_demo_claim adjuster-1 start_assessment 2 '{}'
transition_demo_claim adjuster-1 request_information 3 '{"message":"Receipt?"}'
transition_demo_claim claimant-1 provide_information 4 '{"response":"Receipt supplied."}'
transition_demo_claim adjuster-1 start_assessment 5 '{}'
transition_demo_claim adjuster-1 request_information 6 '{"message":"More details?"}'
transition_demo_claim claimant-1 provide_information 7 '{"response":"Details supplied."}'
transition_demo_claim adjuster-1 start_assessment 8 '{}'
transition_demo_claim adjuster-1 request_information 9 '{"message":"Final clarification?"}'
transition_demo_claim claimant-1 provide_information 10 '{"response":"Clarification supplied."}'
transition_demo_claim adjuster-1 start_assessment 11 '{}'
transition_demo_claim adjuster-1 request_information 12 '{"message":"Fourth request must fail."}'
transition_demo_claim adjuster-1 approve 12 '{}'
transition_demo_claim adjuster-1 initiate_payment 13 '{}'
transition_demo_claim adjuster-1 close_paid 14 '{}'
```

Only the fourth request fails: 422 CYCLE_LIMIT_REACHED, without changing revision,
audit, receipts or side effects. Each response goes to documents_verified and
requires another start_assessment. Final state closed, revision 15, lifetime
count 3. A single loop followed by approval follows the same sequence with the
two additional loops omitted (closed revision 9).

## 4. Invalid direct approval, required reason and rejection closure

For a fresh claim:

```sh
transition_demo_claim claimant-1 submit 0 '{}'
transition_demo_claim adjuster-1 approve 1 '{}'
transition_demo_claim adjuster-1 verify_documents 1 '{}'
transition_demo_claim adjuster-1 start_assessment 2 '{}'
transition_demo_claim adjuster-1 reject 3 '{}'
transition_demo_claim adjuster-1 reject 3 '{"reason":"Not covered in this demo."}'
transition_demo_claim adjuster-1 close_rejected 4 '{}'
```

Direct SUBMITTED → APPROVED returns 409 STATE_CONFLICT. Missing rejection reason
returns 400 INVALID_REQUEST. Other commands return 200. Final closed/revision 5,
one rejection notification and no payment-initiation record or event.

## 5. Idempotent payment/closure retry and stale revision

On a fresh claim perform scenario 1 through approve (revision 4), then:

```sh
export CWO_PAYMENT_ID="$(node -p 'crypto.randomUUID()')"
transition_demo_claim adjuster-1 initiate_payment 4 '{}' "$CWO_PAYMENT_ID"
transition_demo_claim adjuster-1 initiate_payment 4 '{}' "$CWO_PAYMENT_ID"
export CWO_CLOSE_ID="$(node -p 'crypto.randomUUID()')"
transition_demo_claim adjuster-1 close_paid 5 '{}' "$CWO_CLOSE_ID"
transition_demo_claim adjuster-1 close_paid 5 '{}' "$CWO_CLOSE_ID"
transition_demo_claim adjuster-1 initiate_payment 4 '{}' "$CWO_PAYMENT_ID"
transition_demo_claim adjuster-1 initiate_payment 6 '{}' "$CWO_PAYMENT_ID"
transition_demo_claim adjuster-1 close_paid 5 '{}'
transition_demo_claim adjuster-1 approve 6 '{}'
curl -sS -i "$CWO_API_BASE_URL/api/claims/$CWO_CLAIM_ID/audit" -H 'X-Demo-Actor-Id: claimant-1'
```

Exact retries return their original result (even the payment retry after closure),
with identical audit IDs and no duplicate local records. Changed payload with the
same payment ID returns 409 COMMAND_ID_REUSED; a new ID at stale revision returns
409 REVISION_CONFLICT; approval from closed returns 409 STATE_CONFLICT. Final
revision 6, six audit events/receipts and one payment record.

For UI stale revision testing, open a claim in two tabs and act in one before
confirming the other's old form. Refresh after REVISION_CONFLICT. For uncertain
network outcomes, keep the page open and use Retry same command after restoring
connectivity. The UI preserves ID, input and expected revision and locks actor/
navigation while unresolved. Retry context is in memory; reload discards it.

## Verification

```sh
# frontend/
npm test
npm run build
npm run lint
npm run typecheck
# backend/
npm test
npm run test:e2e
npm run build
npm run lint
npx tsc -p tsconfig.json --noEmit --incremental false
```

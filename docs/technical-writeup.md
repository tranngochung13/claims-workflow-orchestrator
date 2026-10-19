# Claims Workflow Orchestrator — Technical Writeup

## Overview

Claims Workflow Orchestrator manages insurance claim lifecycles using validated
JSON workflow definitions. States and transitions can be added through a new
configuration version without changing the core engine when their conditions and
side effects use existing handlers. New handler capabilities require explicit
schema, type, implementation, and test changes; configuration cannot execute code.

## Architecture

- **Frontend:** React, TypeScript, Vite, and Tailwind CSS provide claim lists,
  creation, details, discovered actions, validation errors, cycle counts, and audit
  history. Components consume backend eligibility and input metadata; the server
  revalidates every command.
- **Backend:** NestJS controllers handle HTTP and identity; claim, transition,
  and read services enforce ownership, workflow rules, and persistence behavior.
- **Persistence:** SQLite stores claims, immutable workflow versions, successful
  transition events, local notifications, payment-initiation records, and command
  receipts. Startup applies pending migrations after checking historical IDs and
  SQL checksums.
- **Configuration:** JSON defines states, transitions, roles, input fields,
  preconditions, side effects, and the information-request limit.

## Key Design Decisions

### Configuration validation and version pinning

Startup validates configuration structure and graph semantics before opening the
application database. Definitions reject unknown properties and unsupported
handlers; runtime definitions are defensive, deeply frozen copies. The registry
stores canonical JSON and its SHA-256 digest under an immutable workflow ID/version.

New claims use version 2. Existing claims retain their original pinned definition,
so introducing a new configuration does not reinterpret their past or current
states. Version 1 remains unchanged, including its terminal approval/rejection.
Changes to an already registered version are rejected.

Version 2 adds document verification and assessment, routes information responses
back through document verification, and completes approval through payment
initiation and closure. Rejected claims can also close. Only `closed` is terminal
in version 2; creation starts in `draft` before submission.

The configured paths after submission are:

- Approval: `submitted → documents_verified → under_assessment → approved → payment_initiated → closed`.
- Rejection: `submitted → documents_verified → under_assessment → rejected → closed`.
- Information loop: `under_assessment → pending_info → documents_verified → under_assessment` before a decision.

These paths come from [the version 2 configuration](../backend/config/claims.v2.json),
not frontend transition definitions.

### Authorization and ownership

The backend owns the allowlist mapping `claimant-1`, `claimant-2`, and `adjuster-1`
to roles. Claimants create claims and access their own records; adjusters can read
all claims and execute configured adjuster actions, but cannot create claims.
Cross-owner reads and commands return the same not-found error as missing claims.
Roles and ownership cannot be supplied through request bodies.

This identity mechanism is development impersonation, not production
authentication. It requires both `NODE_ENV=development` and
`DEMO_IDENTITY_ENABLED=true`. Production claim APIs fail closed, and production
frontend builds exclude the demo workspace. A production identity adapter remains
future work.

### Transactions, concurrency, and idempotency

Transition execution uses a SQLite immediate transaction. After claim access and
receipt lookup, the engine validates the configured transition, role, expected
revision, source state, input, preconditions, and cycle constraints. A conditional
update checks the observed revision/state/counter and advances the revision once.

The claim update, counter increment, success event, configured local side effects,
and command receipt commit together. Failure in any write rolls back the whole
transition. SQLite serializes writers; expected revisions and conditional updates
prevent stale commands from silently overwriting newer state. Writer contention
has a retryable storage error.

Successful command IDs are retained globally. A retry with the same actor, claim,
and normalized command fingerprint returns the original stored response, even
after later transitions. Conflicting reuse is rejected. Exact retries add no
audit events or side effects. Claim creation does not have command deduplication.

### Local side effects and payment initiation

Registered effects create local notification records or a payment-initiation
record linked to the success event. Payment initiation is a workflow action and
an immutable local record, **not a transfer of money**. No payment provider,
email delivery, or external insurance integration is called. Payment records have
a unique claim reference; command receipts prevent duplicate effects on retries.
Migration 005 adds this table without editing migrations 001–004.

### Information-request limits

The configured limit is between one and three; execution also caps it at three.
A successful transition marked `information_request` increments a claim's lifetime
counter in the same transaction. Responses do not increment or reset it. Failed
requests and successful-command replays consume no additional cycle. A fourth
request at the default limit is rejected without writes.

### Auditability

Successful transitions persist actor, transition, source/destination states,
previous/resulting revisions, input, and timestamp. Authorized, paginated audit
reads expose event metadata without exposing stored input or command receipts.
Replays and rejected attempts do not create successful-transition events;
rejected-attempt logging is not implemented.

Database triggers reject updates and deletes of successful events, notifications,
receipts, and payment-initiation records. These safeguards do not make records
tamper-proof against database administrators. No audit mutation API is exposed.

## Testing

Backend unit and HTTP E2E tests cover configuration validation, version pinning,
owner isolation, roles, atomic rollback, cycle limits, receipt replay, stale
revisions, local payment records, terminal closure, and migration compatibility.
Frontend tests cover API errors, discovered action forms, actor changes, stale
state, and retaining the original command for uncertain retries.

Run the commands in the [backend guide](../backend/README.md) and
[frontend guide](../frontend/README.md). Test counts and outcomes must be taken
from actual runner output for the submitted checkout; this document is not a
committed test-results artifact. The [five scenarios](demo-scenarios.md) describe
reproducible workflow demonstrations and their expected outcomes.

## Running the Project

Use the [repository README](../README.md) to find platform-specific backend setup,
frontend setup, and scenarios. The backend guide covers environment variables,
safe database selection, automatic migrations, startup, API verification, and tests.
The frontend uses a Vite development proxy for API requests. Backend environment
variables must be supplied to its process; it does not automatically load `.env`.

## Limitations and Future Improvements

Production authentication, deployment automation, and external integrations are
not implemented. The existing Observe scaffold has placeholder credentials; it
should not be described as a completed operational observability setup.
Additional workflow definitions can reuse the registered handler vocabulary.

Frontend uncertain-command retry context is held in memory and is lost on page
reload. Rejected-attempt audit logging and idempotent claim creation are possible
future improvements. SQLite is a deliberate small-challenge persistence choice;
production capacity and operational requirements would need separate assessment.

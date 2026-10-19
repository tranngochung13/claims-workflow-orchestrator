<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observer](https://observer.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## SQLite persistence and workflow registry (Task 04)

The backend uses `better-sqlite3` for short synchronous transactions and explicit
SQL, without an ORM. `@types/better-sqlite3` supplies development declarations.
Only `schema_migrations` and `workflow_versions` are created in this task.

### Runtime and database path

Use the same supported Node version for dependency installation, build, and run.
The native addon was verified on Node 22.15.1. Existing Angular Devkit dependencies
require ^22.22.3 (or a compatible newer major), so prefer a runtime satisfying that
requirement for clean setup. Existing tsconfck/TypeScript 6 peer warnings remain.
If switching Node versions, run `npm rebuild better-sqlite3` with the intended
Node executable first on PATH; native addon ABIs differ between Node versions.
Prebuilt addons may be downloaded during installation; if none is available,
installation requires the platform's native build toolchain.

Default: `backend/data/claims.sqlite`, resolved relative to the module URL in both
source and compiled layouts. Override with `SQLITE_DATABASE_PATH`:

```sh
SQLITE_DATABASE_PATH=/absolute/writable/path/claims.sqlite npm run start:dev
```

An explicit relative path is resolved from the process working directory. Parent
directories are created. Empty overrides are rejected. `:memory:` is supported.
With NODE_ENV=test and no override, the default is :memory:; tests needing restart
coverage explicitly use isolated temporary files and clean up their sidecars.
The HTTP E2E suite overrides the path with :memory:, regardless of local settings.

Every connection enables foreign keys, a 5000 ms busy timeout, WAL for file
storage, and synchronous=FULL. In-memory SQLite uses its supported memory journal
mode. The database closes on module/application close; main enables signal
shutdown hooks. Abrupt process termination cannot run lifecycle hooks.

### Startup order and migrations

AppModule imports WorkflowRegistryModule. DatabaseModule imports the pure
WorkflowModule and explicitly injects WorkflowConfigService before opening the
database. WorkflowModule itself does not depend on the database or registry, so
there is no circular dependency:

1. Load and validate Task 03 JSON configuration.
2. Open SQLite and configure connection pragmas.
3. Check history and apply pending migrations.
4. Register the configured workflow in the registry provider factory.
5. Finish application initialization and begin listening.

Initialization failures propagate and prevent startup. Failed database setup
closes its connection; a registration failure also closes the connection.
Successful schema migrations remain committed if the later registration fails.

Migrations are SQL strings embedded in `src/database/migrations.ts`, compiled into
dist, with ordered stable IDs and SHA-256 checksums of exact SQL text.
`schema_migrations` stores id (primary key), checksum, and applied_at.
Applied history must be a matching prefix of this application's migration list.
Changed checksums, unknown IDs, ordering errors, and incompatible histories fail
explicitly. Never edit an applied migration, including whitespace; append a new
migration instead. The history setup and all pending migrations run in one
immediate transaction. Failure rolls back the entire pending batch.
No down migrations or migration CLI are provided.

Migration 001 creates a STRICT workflow_versions table with:

- Composite primary key (workflow_id, version), also serving exact lookup queries.
- Positive safe-integer version, schema_version=1, bounded nonempty workflow ID.
- Complete valid JSON in definition_json.
- Lowercase 64-character hexadecimal definition_sha256.
- registered_at in UTC ISO 8601 form, generated by Date.toISOString().

No additional indexes are needed for current identity-based access. Audit,
claim, receipt, and notification tables are deferred. JSON graph validity and
column/content identity consistency are enforced by registry validation rather
than duplicating the Task 03 schema in SQL.

### Immutable workflow versions

Inject WorkflowRegistryService and use register(definition) or
get(workflowId, version). Startup passes the already validated configuration;
registration reuses Task 03 validation for any later caller as well.

Canonical JSON recursively sorts object keys and preserves array order. SHA-256
is computed over its UTF-8 bytes. This is a deliberately small canonicalizer for
our validated JSON vocabulary, not a claim of general RFC 8785 compliance.

Registration uses an immediate transaction. New identity: insert complete
canonical definition, digest, and timestamp. Existing identical identity/content:
return the original row without updates. Changed content: fail with
WORKFLOW_VERSION_CONFLICT; use a new version. Different workflow IDs can share
version numbers. Older records are retained.

Reads validate JSON with Task 03, then verify requested/column/definition
identities, schema version, canonical serialization, digest, and timestamp.
Invalid persisted data fails with INVALID_PERSISTED_WORKFLOW. Missing identity
uses WORKFLOW_VERSION_NOT_FOUND; operational failures use WORKFLOW_STORAGE_FAILED.
Database initialization/migration errors also have stable codes and safe messages.
No raw SQL errors, definitions, or database paths are returned in these errors.
No public endpoints are added.

There are no registry update/delete methods. This is application-level
immutability: database administrators can alter records and recompute hashes;
it is not tamper-proof storage. Integrity is checked when a version is read or
re-registered, not by a full-database scan on every startup. Migration checksums
check history, not every sqlite_master object for manual edits.

### Packaging, local files, and verification

Ship dist/, config/, package files, and installed production dependencies,
including the platform-compatible better-sqlite3 native binding. Config remains
beside dist as documented in config/README.md; no raw migration assets need
copying. The database directory must be writable and persist between restarts.
Backend .gitignore excludes data/, *.sqlite, *.db, and their SQLite sidecars.
Do not commit local databases or backups; place external-path databases outside
version-controlled directories too.

From backend:

```sh
npm test
npm run test:e2e
npm run build
npm run lint
npm test -- src/database/database.spec.ts
```

Database tests include temporary-file reopen persistence, migration rollback and
drift, real foreign-key rejection, canonical hashing, conflicts, tampering,
startup registration/failure, and shutdown. The existing workflow tests remain.
SQLite remains a local single-writer store; distributed deployment, backup and
restore tooling, workflow-version migration, production authentication, and
external side effects remain deferred. Later sections describe claim pinning
and transition execution added after Task 04.

## Claim persistence and pinned workflows (Task 05)

Migration `002_claims` appends the claims table without changing migration 001.
It stores server-generated UUIDs, workflow_id/version, state, title, description,
revision (default zero), and created/updated UTC ISO 8601 timestamps. NOT NULL,
STRICT typing, length/range checks, and a composite foreign key protect data.
The foreign key rejects unregistered workflow references and prevents deleting
referenced versions. A trigger rejects changes to either workflow identity field
on existing claims, even when the proposed version exists. General claim-edit
APIs remain deferred; Task 07 adds the transition command API.

The `(created_at DESC, id DESC)` index supports ordered page reads. The workflow
reference index supports foreign-key lookups. Previously registered versions are
preserved during upgrade. Migration checksum validation remains active.

ClaimService uses the startup-configured workflow identity/version, resolves it
through WorkflowRegistryService inside the creation transaction, and takes that
version's initial state. It never automatically selects the latest stored
version. Existing claims retain their original reference, and resolveWorkflow(id, actor)
retrieves exactly that version, irrespective of later registrations or startup
configuration changes. Creation does not accept workflow selection overrides.

### Minimal API and development boundary

All claim routes require both NODE_ENV=development and
DEMO_IDENTITY_ENABLED=true, plus X-Demo-Actor-Id equal to claimant-1, claimant-2, or adjuster-1.
IDs and roles are backend-owned; client role/actor payload properties are rejected.
Unknown/missing actors return 401 IDENTITY_REQUIRED. Disabled/misconfigured or
production mode returns 403 DEMO_IDENTITY_DISABLED, including for reads.
A production flag never enables the demo mechanism. NODE_ENV=test also denies
these routes unless the isolated HTTP test explicitly selects development mode.

This actor selection is **not production authentication**. Task 06 enforces
claim ownership: claimants create/read their own claims, and adjusters read all
claims but cannot create. Use only local, non-sensitive demo data. A production
authentication adapter is deferred; claim routes remain inaccessible in production. For local use, bind the process to
loopback externally if needed; this task does not change the existing listener.

Start from backend:

```sh
NODE_ENV=development DEMO_IDENTITY_ENABLED=true npm run start:dev
```

POST /api/claims accepts exactly title and description. Both must be strings,
nonempty after trimming; title is limited to 120 UTF-16 code units and description
to 2000, measured before trimming. Unknown/protected fields are rejected rather
than removed. DTO pipes and the service share the same validation functions;
service callers cannot bypass business-field checks.

```sh
curl -X POST http://localhost:3000/api/claims \
  -H 'Content-Type: application/json' \
  -H 'X-Demo-Actor-Id: claimant-1' \
  -d '{"title":"Laptop damage","description":"Screen damaged during transport."}'
```

201 response (illustrative ID/timestamps):

```json
{
  "id": "d6721ff3-9ae4-41f6-8dc4-1bb2effe5dbc",
  "ownerActorId": "claimant-1",
  "workflowId": "claims",
  "workflowVersion": 1,
  "state": "draft",
  "title": "Laptop damage",
  "description": "Screen damaged during transport.",
  "revision": 0,
  "informationRequestCount": 0,
  "createdAt": "2026-10-19T10:00:00.000Z",
  "updatedAt": "2026-10-19T10:00:00.000Z"
}
```

GET /api/claims/:id returns that shape with 200, or 404 CLAIM_NOT_FOUND.
GET /api/claims?limit=50&offset=0 returns:

```json
{ "items": [], "limit": 50, "offset": 0 }
```

The items array contains claim objects. Default limit is 50; valid limits are
1–100 and offset is a nonnegative safe integer. Repeated/unknown query parameters,
fractional values, and out-of-range values return 400 INVALID_REQUEST. Ordering
is newest createdAt first, then descending ID to resolve ties. Offset pagination
is deterministic for unchanged data; concurrent inserts can shift page offsets.
No total-count query is performed.

Invalid business input returns 400 INVALID_REQUEST. Storage failures return
500 CLAIM_STORAGE_FAILED. Unavailable/invalid selected or pinned workflows return
500 CLAIM_WORKFLOW_UNAVAILABLE. Domain errors use:

```json
{ "error": { "code": "CLAIM_NOT_FOUND", "message": "Claim not found." } }
```

Raw SQLite errors, paths, digests, and stored definitions are not exposed.
Malformed JSON is rejected by the existing HTTP body parser. Creation is not
idempotent: retrying a successful POST can create another claim.

### Tests and deferred work

```sh
npm test
npm test -- src/claims/claim.service.spec.ts
npm run test:e2e
npm run build
npm run lint
```

Service tests use isolated temporary files with cleanup and include a database
close/reopen test, upgrade from migration 001, immutable-reference checks, and
version-specific initial states. HTTP tests override SQLite with :memory: and
restore development environment overrides after each test. Existing tests remain.

Task 06 provides claim ownership and create/read access rules. Task 07 adds
transaction execution, transition RBAC, cycle limits, local notifications, audits,
and receipts. Production authentication and frontend features remain deferred.


## Claim ownership and RBAC (Task 06)

The backend-owned allowlist contains claimant-1 and claimant-2 (claimant role),
and adjuster-1 (adjuster role). Client headers select only one of these demo
identities; role, owner, and actor values in request payloads cannot grant access.

| Actor | Create | Detail / pinned workflow resolution | List |
|---|---|---|---|
| Claimant | Own claim only | Own claims; other/legacy claims return 404 | Own claims |
| Adjuster | 403 CLAIM_CREATION_FORBIDDEN | Any claim, including legacy | All claims |
| Missing/unknown actor | 401 IDENTITY_REQUIRED | 401 | 401 |
| Demo disabled / outside development | 403 DEMO_IDENTITY_DISABLED | 403 | 403 |

ClaimsDemoGuard validates the header and associates a backend-issued frozen actor
with the request in a private WeakMap. CurrentActor retrieves that identity;
controllers do not parse headers or decide permissions. claim-access.ts owns
identity validation and create/read policy. ClaimService requires verified actor
references for every operation (including workflow resolution). Structurally
similar or copied actor objects are rejected even in direct service calls.
Internal backend callers use resolveDemoActor, never body-supplied identity data.
These references are in-process capabilities, not authentication credentials.

Creation assigns ownerActorId from the verified claimant and accepts only title
and description. ownerActorId is returned as a read-only demo actor ID, or null
for legacy claims. Ownership cannot be overridden or reassigned through any API.
POST and detail routes reject query parameters; list accepts only limit/offset.
Owner, role, and other unknown payload/query properties return 400 INVALID_REQUEST.
No owner lookup, reassignment, or actor-management endpoints are provided.

Both detail and list apply the claimant ownership predicate in SQL. Filtering
occurs before LIMIT/OFFSET, preserving the existing stable createdAt/ID ordering.
Denied detail lookups have exactly the same 404 CLAIM_NOT_FOUND envelope as
unknown claims; they do not disclose whether another actor owns the ID.
Adjusters use the unrestricted read query. Database errors remain sanitized.

### Migration and legacy claims

Append-only migration 003_claim_ownership adds nullable owner_actor_id with a
bounded nonblank-text constraint, an owner/createdAt/ID index for claimant pages,
and an ownership-immutability trigger. Migration 001/002 SQL and checksums are
unchanged. All existing fields, the composite workflow foreign key, and the
workflow-pinning immutability trigger are preserved.

Previously created claims receive NULL owner. No ownership is guessed, inferred,
or assigned to a default actor. Only adjusters can read these legacy records.
The schema deliberately permits NULL for legacy compatibility, so direct SQL
can still insert unowned rows; ClaimService always inserts a verified claimant
owner. The database trigger prevents ownership changes, including adoption of
an unowned row. There is no reassignment mechanism in this task.

### Verification and limitations

From backend with the intended Node runtime on PATH:

```sh
npm test -- src/claims/claim-access.spec.ts
npm test
npm run test:e2e
npm run build
npm run lint
git diff --check
```

Ownership tests cover interleaved owners with pagination, adjuster read/create
rules, forged service identities, legacy migration upgrade, unchanged checksums,
restart/version pinning, and sanitized failures. HTTP tests retain missing and
unknown identity, disabled/production configuration, input validation, and add
cross-owner non-disclosure, role/owner spoofing, and legacy visibility. Temporary
databases are isolated and HTTP environment overrides are restored after tests.

Local callers can still select any allowlisted demo actor: these permissions
are a demonstration, not proof of a real user's identity. Production claim
routes remain disabled until a real authentication adapter is implemented.
Task 07 now adds transactional transitions, transition RBAC, preconditions,
local side effects, cycle counting, successful audit events, and command receipts.
Production authentication and frontend work remain deferred. No dependencies
were added for ownership or transition execution.


## Transactional workflow transitions (Task 07)

POST /api/claims/:id/transitions uses the same verified development actor and
production fail-closed guard as claim creation/reads. It accepts exactly:

```json
{
  "transitionId": "request_information",
  "expectedRevision": 2,
  "commandId": "5d459684-4a08-4c82-b610-cebde7153b76",
  "input": { "message": "Please provide the purchase date." }
}
```

commandId is a UUID v4. expectedRevision is a nonnegative safe integer below the
maximum safe integer, so incrementing remains safe. input is required (use {} for
transitions without fields), contains only configured text fields, and cannot
supply actor/role/state/revision/owner/version/counter/audit/notification overrides.
Query parameters are rejected. Text is trimmed, bounded to 2000 code units before
normalization, then checked against each configured field's required/min/max
constraints. Required text cannot be whitespace-only. Unknown fields fail with
400 INVALID_REQUEST. No workflow configuration extension was needed.

Successful execution returns 200:

```json
{
  "claim": {
    "id": "d6721ff3-9ae4-41f6-8dc4-1bb2effe5dbc",
    "ownerActorId": "claimant-1",
    "workflowId": "claims",
    "workflowVersion": 1,
    "state": "awaiting_information",
    "title": "Laptop damage",
    "description": "Screen damaged during transport.",
    "revision": 3,
    "informationRequestCount": 1,
    "createdAt": "2026-10-19T10:00:00.000Z",
    "updatedAt": "2026-10-19T10:10:00.000Z"
  },
  "auditEventId": "22f6b5ac-2c5b-4ffd-bb27-1955ab6578eb",
  "notificationIds": ["b16dd5bd-197c-44c5-a989-e02e8d99c679"]
}
```

### Authorization, workflow rules and transaction

The service verifies actor reference membership, validates the command envelope,
then starts a short synchronous BEGIN IMMEDIATE transaction. It checks claim
access before looking up receipts: another claimant's claim remains a 404 even
when a command ID is known. It resolves the claim's exact pinned registered
workflow rather than the startup default/latest version.

A new command must name a configured transition, have an allowed configured role,
match the current revision/source state, satisfy all configured preconditions
(AND), and provide all configured input. claimFieldsPresent checks each configured
claim text field. Every information_request-kind transition uses the same pinned
root limit, capped at three; other transitions never increment or reset the count.
Missing notification ownership on legacy-unowned claims returns 422 rather than
inventing a recipient. Their read access remains unchanged.

The conditional state update checks ID, expected revision, source state, and
observed cycle count, and must affect exactly one row. It increments revision once.
State/counter/updatedAt, successful audit, configured local notifications, and
receipt commit together. Any error rolls the whole transaction back, including
failed inserts after the state update. No success receipt remains for a failure.

### Idempotency and concurrency

Command IDs are globally unique for successful transition requests, as required
by Task 07 (a stricter scope than the early actor-scoped proposal). A deterministic
SHA-256 fingerprint covers claim ID, transition ID, expected revision, and
key-sorted normalized input. Object key order and trimmed whitespace do not cause
false conflicts. UUID command IDs are normalized to lowercase.

An identical request by the original actor returns the stored original response,
even after later transitions or a restart, without repeating effects. Current
claim access and pinned-workflow integrity are checked before replay. Changing a
well-formed request, its target claim, or its actor returns 409 COMMAND_ID_REUSED
when the caller has access to the target claim. Cross-owner denial takes priority.
Receipts are retained indefinitely in this challenge. Creation POST remains
non-idempotent; these receipts cover transition commands only.

BEGIN IMMEDIATE serializes writers; conditional revision updates prevent silent
lost writes. Two distinct commands with the same expected revision cannot both
commit. SQLite lock exhaustion returns 503 STORAGE_BUSY: retry with the same
command ID. Synchronous driver calls and the existing five-second busy timeout
are suitable for this small local application, not a high-throughput deployment.

### Migration, events and local notifications

Migration 004_workflow_transitions appends:

- claims.information_request_count, default zero, constrained to 0–3. Claims remain
  authoritative for current state, revision, and request count.
- transition_events: claim FK, verified actor ID/role, transition ID, from/to state,
  previous/resulting revision, validated input JSON, and UTC timestamp. Unique
  (claim_id, resulting_revision) supports per-claim history in revision order.
- notifications: event FK, effect position, claimant recipient, backend-owned
  template/rendered message, and timestamp; unique (event_id, effect_index).
- command_receipts: global command-ID primary key, unique event FK, fingerprint,
  and complete original response JSON.

Event -> claim -> pinned workflow and notification/receipt -> event relationships
avoid duplicating authoritative workflow identities and association fields.
The existing claim workflow-reference trigger prevents repinning those links.
Audit before/after state and revision are intentional historical snapshots;
receipt response JSON is intentionally denormalized to replay the exact result,
never used as current claim state. Timestamps use Date.toISOString().

Update/delete triggers make successful events, notifications, and receipts
append-only for ordinary SQL/application operations. Database administrators can
still drop triggers or edit files; these records are not tamper-proof. No APIs
edit/delete them. Notification templates are backend-owned and only create local
records; no email, external provider, workers, or network effects are involved.
Failed attempts are not persisted in this task because the existing schema has
no rejected-attempt facility; they never appear as successful events.

Legacy claims/ownership/workflow references survive upgrade; the new counter is
zero because no transition execution existed before migration 004. Migration
001–003 SQL/checksums remain unchanged. New foreign keys prevent orphan records.

### Stable errors

Errors retain the existing {error: {code, message}} envelope:

| Status | Code |
|---|---|
| 400 | INVALID_REQUEST |
| 401 | IDENTITY_REQUIRED |
| 403 | DEMO_IDENTITY_DISABLED, TRANSITION_FORBIDDEN |
| 404 | CLAIM_NOT_FOUND, TRANSITION_NOT_FOUND |
| 409 | REVISION_CONFLICT, STATE_CONFLICT, COMMAND_ID_REUSED |
| 422 | PRECONDITION_FAILED, CYCLE_LIMIT_REACHED, NOTIFICATION_RECIPIENT_UNAVAILABLE |
| 500 | CLAIM_WORKFLOW_UNAVAILABLE, CLAIM_STORAGE_FAILED, TRANSITION_STORAGE_FAILED |
| 503 | STORAGE_BUSY |

No raw database exception, SQL text, or filesystem path is exposed. A successful
third information request is allowed; a fourth fails without state/counter/audit/
notification/receipt changes. Approval/rejection can still proceed after the limit.

### Verification and next work

```sh
npm test -- src/claims/transition.service.spec.ts
npm test
npm run test:e2e
npm run build
npm run lint
./node_modules/.bin/tsc --noEmit --incremental false
git diff --check
```

Tests cover config-only extensions, pinned versions, cross-owner access, roles,
conditions/inputs, cycles, replay, competing commands over independent connections,
held writer locks, append-only records, restart persistence, legacy upgrade, and
fault injection at state/audit/notification/receipt writes. Concurrency tests use
no sleeps; in-process synchronous calls are serialized, with an independent
connection lock test exercising SQLite writer contention.

Task 08 adds authorized action discovery and successful audit history reads.
Notification read APIs, rejected-attempt logging, frontend UI, production
authentication, external side effects, and workflow editing remain deferred.


## Authorized action discovery and audit history (Task 08)

Both APIs use the existing verified actor context. Enable NODE_ENV=development
and DEMO_IDENTITY_ENABLED=true, then send X-Demo-Actor-Id: claimant-1, claimant-2,
or adjuster-1. Claimants can read only their own claims; adjusters can read any
claim, including legacy-unowned claims. Missing and cross-owner claims produce
identical 404 CLAIM_NOT_FOUND bodies. Unknown/missing actors return 401 and
production/disabled demo identity returns 403. Demo selection is not production
authentication, and the production fail-closed behavior is unchanged.

### Available transitions

GET /api/claims/:id/available-transitions accepts no query parameters. Example:

```sh
curl http://localhost:3000/api/claims/CLAIM_ID/available-transitions \
  -H 'X-Demo-Actor-Id: claimant-1'
```

For an owned draft, the 200 response is:

```json
{
  "claimId": "d6721ff3-9ae4-41f6-8dc4-1bb2effe5dbc",
  "workflowId": "claims",
  "workflowVersion": 1,
  "state": "draft",
  "revision": 0,
  "informationRequestCount": 0,
  "informationRequestLimit": 3,
  "transitions": [
    {
      "id": "submit",
      "label": "Submit",
      "from": "draft",
      "to": "submitted",
      "eligible": true,
      "reasonCode": null,
      "inputFields": []
    }
  ]
}
```

Only transitions originating from the persisted current state are included, in
configuration order. Both eligible and blocked transitions are returned. Each
inputFields entry contains the actual configured name, label, required,
minLength, and maxLength. For example, request_information exposes the required
message field (1–2000 characters); reject exposes reason. No claim input values
or executable handlers are returned.

Eligibility uses the exact registered workflow version pinned to the claim,
never the latest or startup default. Role rejection takes precedence; otherwise,
the service uses the same read-only constraint helper as execution. Possible
reasonCode values are:

- null: allowed to attempt with valid transition-specific input.
- TRANSITION_FORBIDDEN: current actor role is not allowed by configuration.
- PRECONDITION_FAILED: at least one configured claimFieldsPresent condition fails.
- CYCLE_LIMIT_REACHED: an information_request transition would exceed the shared
  pinned limit (never greater than three).
- NOTIFICATION_RECIPIENT_UNAVAILABLE: a configured notification has no known
  claimant recipient, as can occur on legacy-unowned claims.

The current schema only supports claimFieldsPresent, which can be evaluated
fully from the claim snapshot. Required form input is metadata, not an unmet
claim precondition: eligible=true does not mean an empty input submission will
succeed. There is no unknown status because all currently supported preconditions
are safely evaluable; future handler/schema extensions must define their
read-time eligibility behavior explicitly. Terminal states return transitions: [].

Discovery is advisory. Submit commands through POST /api/claims/:id/transitions
using expectedRevision from the discovery response and a new commandId. Execution
still independently checks identity, access, role, state, revision, inputs,
preconditions, cycle limit, and recipients inside its transaction. Discovery
never grants a capability to bypass those checks. Task 07 validation order,
errors, effects, and idempotency semantics remain unchanged.

### Successful audit history

GET /api/claims/:id/audit?limit=50&offset=0 returns actual persisted successful
transition_events for that claim:

```sh
curl 'http://localhost:3000/api/claims/CLAIM_ID/audit?limit=50&offset=0' \
  -H 'X-Demo-Actor-Id: claimant-1'
```

Example 200 response after submit:

```json
{
  "claimId": "d6721ff3-9ae4-41f6-8dc4-1bb2effe5dbc",
  "workflowId": "claims",
  "workflowVersion": 1,
  "items": [
    {
      "id": "22f6b5ac-2c5b-4ffd-bb27-1955ab6578eb",
      "transitionId": "submit",
      "actor": { "id": "claimant-1", "role": "claimant" },
      "fromState": "draft",
      "toState": "submitted",
      "previousRevision": 0,
      "resultingRevision": 1,
      "createdAt": "2026-10-19T10:00:00.000Z"
    }
  ],
  "limit": 50,
  "offset": 0
}
```

Ordering is createdAt ascending, then resultingRevision ascending, then event ID
ascending. Equal timestamps are deterministic. If server clock time goes
backwards, timestamp order can differ from revision order; resultingRevision is
retained so clients can identify the actual transition sequence.

Pagination matches claim-list conventions: default limit 50, valid range 1–100,
nonnegative safe-integer offset, no total-count query. Unknown/repeated parameters,
fractional values, and excessive limits return 400 INVALID_REQUEST. Empty histories
or pages beyond the end return items: []. Offset pages are stable for unchanged
data; appending events can affect pages if timestamps are out of chronological
order.

Audit history is read from events, not reconstructed from current state, receipt
snapshots, or notifications. Failed commands are absent; successful replays do
not duplicate events. Persisted actor ID/role, transition ID, states, revisions,
and timestamp are returned. Transition input JSON, receipt fingerprints, stored
workflow JSON, notification messages, and raw SQL details are not exposed.
Pinned identity metadata comes from the authorized claim row; audit retrieval
does not need to reinterpret the historical event using a workflow definition.

### Read safety, verification and deferred work

Each service operation uses a deferred SQLite read transaction so authorization
and result queries share one snapshot. They run SELECTs only: no state/revision/
counter changes, no notifications, events, or receipts, and no migration/history
writes. Existing update/delete protections remain intact; no mutation endpoints
are added. Audit append-only triggers are application safeguards, not protection
against database administrators who can alter the database or drop triggers.

Errors retain {error: {code, message}}. Inaccessible/missing claims remain 404;
unavailable pinned definitions during discovery use CLAIM_WORKFLOW_UNAVAILABLE.
Unexpected storage failures use a sanitized 500 CLAIM_STORAGE_FAILED response.
No dependencies, schema extensions, or migrations were added. Migration 001–004
SQL/checksums, including the restored original migration 004, are unchanged.

```sh
npm test -- src/claims/claim-workflow-read.service.spec.ts
npm test
npm run test:e2e
npm run build
npm run lint
./node_modules/.bin/tsc --noEmit --incremental false
git diff --check
```

Tests cover authorization, configuration-only actions, pinned versions, form
metadata, shared execution constraints, cycle limits, stale discovery, ordering
with equal timestamps, pagination, append-only protections, failed/replayed
commands, sanitized failures, and database snapshots in SQLite query-only mode.
HTTP tests use isolated in-memory databases and restore environment overrides.
No tests use the development database.

Task 09 adds the React workflow demo; see ../frontend/README.md for setup and
../docs/demo-scenarios.md for five reproducible scenarios with a disposable
database. Notification read APIs, rejected-attempt logging, production
authentication, external side effects, and workflow editing remain deferred.

## Complete lifecycle (workflow version 2)

New claims use `config/claims.v2.json`: draft → submitted → documents_verified →
under_assessment → approved → payment_initiated → closed. Rejection closes via
rejected → closed. Information responses return pending_info → documents_verified,
then require assessment again. Only closed is terminal in version 2.

Existing claims stay pinned to their original immutable version; version 1 is
retained without rewriting claims, receipts or audit history. Migration 005 adds
`payment_initiations` (event_id primary/foreign key, unique claim_id foreign key,
created_at) with update/delete rejection triggers. The record is a local workflow
side effect, atomically committed with state/revision, audit and command receipt.
It does not represent a transfer of money. `notificationIds` still contains only
notification IDs; the payment event is visible through the existing audit API.
No new HTTP routes or production identity mechanisms are introduced.

See [the five updated scenarios](../docs/demo-scenarios.md) for command IDs, roles,
revisions, information-request limits and exact retries.

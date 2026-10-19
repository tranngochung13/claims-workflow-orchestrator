# Analyze claims workflow requirements

> # Task 01: Analyze Requirements for Claims Workflow Orchestrator
>
> You are acting as a senior software engineer helping implement a take-home challenge for a Senior Full Stack Engineer position.
>
> ## Project context
>
> The repository already has a basic frontend and backend scaffold:
>
> - Frontend: React, TypeScript, Vite, Tailwind CSS
> - Backend: NestJS, TypeScript
>
> Inspect the existing repository before making recommendations. Preserve the current setup unless there is a clear technical reason to change it.
>
> ## Challenge requirements
>
> Build a configurable claims workflow orchestrator with the following capabilities:
>
> 1. A JSON or YAML configuration defines workflow states and transitions.
> 2. Transitions support preconditions and side effects.
> 3. Role-based access control (RBAC) determines who can execute each transition.
> 4. An audit trail records workflow actions and state changes.
> 5. The workflow limits information-request cycles to a maximum of three.
> 6. The workflow should allow new states and transitions to be added through configuration without changing the core workflow engine.
> 7. The implementation must include at least 15 meaningful automated tests.
> 8. Provide at least five reproducible workflow scenarios.
> 9. The project must include clear setup instructions and technical documentation.
>
> ## Your tasks
>
> Do not write implementation code yet.
>
> 1. Inspect the existing frontend and backend structure, package scripts, dependencies, and configuration.
> 2. Convert the challenge requirements into explicit functional requirements and non-functional requirements.
> 3. Identify ambiguities and propose minimal assumptions. Clearly label assumptions that require confirmation.
> 4. Define the core domain entities and their responsibilities.
> 5. Define the workflow transition contract, including success and failure behavior.
> 6. Explain how RBAC, preconditions, side effects, cycle limits, and audit logging should work together.
> 7. Identify data-integrity risks, failure scenarios, and security concerns.
> 8. Propose a phased implementation plan that fits a small take-home challenge.
> 9. Create a requirement-to-test matrix with at least 15 test cases.
> 10. Identify which features are mandatory and which should be deferred if time is limited.
>
> ## Constraints
>
> - Do not implement code or modify files in this task.
> - Do not add dependencies.
> - Do not introduce an LLM-based fraud detection feature; it is outside the stated workflow-orchestrator scope.
> - Prefer a small, understandable design over unnecessary abstractions.
> - Distinguish confirmed requirements from your own assumptions.
> - Do not claim that any requirement has been implemented or tested.
>
> ## Expected output
>
> Return:
>
> 1. Repository assessment.
> 2. Requirements and assumptions.
> 3. Proposed architecture.
> 4. Domain model.
> 5. Failure-handling and security considerations.
> 6. Test matrix.
> 7. Prioritized implementation plan.
> 8. Open questions that must be resolved before implementation.

<details><summary>2 previous messages</summary>

> I’ll inspect the scaffold and repository guidance, then map the requirements into a small design and test plan. I won’t modify files or add dependencies.
>
> The repository contains starter UI and API code, plus two starter backend tests. It has no workflow logic, persistence, authentication, or frontend/API integration yet. I’ll preserve the existing stack and make the key assumptions explicit: how cycles are counted, whether data must survive restarts, and what happens when a side effect fails.
</details>

**1. Repository assessment**

The existing stack is suitable for this challenge. Preserve React, Vite, Tailwind, NestJS, TypeScript, and the backend’s Vitest setup.

| Area | Observed setup | Implication |
|---|---|---|
| Frontend | React 19, TypeScript 6, Vite 8, Tailwind 4 | Adequate for a small claims dashboard |
| Frontend UI | Starter counter and template styles | No claims functionality yet |
| Frontend scripts | `dev`, `build`, `lint`, `preview` | No frontend test script or test framework configured |
| Frontend integration | React and Tailwind Vite plugins; no API proxy | API connection still needs defining |
| Backend | NestJS 12, Express, TypeScript 6, ESM/NodeNext | Preserve existing conventions, including `.js` import suffixes |
| Backend API | `GET /` returning `Hello World!` | No domain endpoints yet |
| Backend scripts | Build, start/watch/debug, lint, format, Vitest unit/E2E/coverage | Existing testing tools can support the required tests |
| Existing tests | One controller test and one HTTP E2E test | Neither tests workflow behavior |
| Storage/authentication | No application persistence or authentication configured | Both require explicit scope decisions |
| Observability | Nest Observe initialized with placeholder credentials | Decide whether to disable or configure it; telemetry is not the workflow audit trail |
| Documentation | Framework starter READMEs | Challenge-specific setup and technical documentation are missing |
| Repository organization | Separate packages and npm lockfiles; no root package | Keep two packages; a monorepo migration is unnecessary |

Additional findings:

- Backend TypeScript enables `strict`; frontend application TypeScript does not explicitly enable it.
- No `AGENTS.md` was found in the repository.
- Git currently reports `backend/` and `frontend/` as untracked. Repository hygiene should be addressed before submission, particularly backend dependencies and generated output.

Assessment sources: [frontend package](./frontend/package.json), [Vite configuration](./frontend/vite.config.ts), [backend package](./backend/package.json), [backend bootstrap](./backend/src/main.ts), and [backend module](./backend/src/app.module.ts).

No files were modified, dependencies added, or builds/tests run. Existing test files were inspected only.

**2. Requirements and assumptions**

The following functional requirements come directly from the challenge:

| ID | Confirmed requirement | Acceptance interpretation |
|---|---|---|
| FR1 | JSON or YAML defines states and transitions | A configuration describes the workflow graph |
| FR2 | Transitions support preconditions | An unmet condition prevents execution |
| FR3 | Transitions support side effects | Configured effects run under documented failure semantics |
| FR4 | RBAC controls transition execution | The backend rejects actors without an allowed role |
| FR5 | Audit trail records actions and state changes | Successful changes are attributable and reconstructable |
| FR6 | Maximum three information-request cycles | A fourth cycle cannot start |
| FR7 | States/transitions can be added without changing the core engine | A configuration-only extension is demonstrated |
| FR8 | At least 15 meaningful automated tests | Tests verify domain behavior, including failures |
| FR9 | At least five reproducible workflow scenarios | Each has inputs, steps, and expected outcomes |
| FR10 | Clear setup and technical documentation | A reviewer can run, test, and understand the project |

Proposed non-functional acceptance criteria—not additional confirmed challenge requirements:

| ID | Proposed requirement |
|---|---|
| NFR1 | **Integrity:** claim state, cycle count, successful audit event, and local effects commit together |
| NFR2 | **Concurrency:** competing commands cannot silently overwrite one another |
| NFR3 | **Security:** actors, roles, state changes, and counters are controlled by the backend |
| NFR4 | **Determinism:** the same valid command and starting state produce predictable results |
| NFR5 | **Maintainability:** small modules, explicit types, bounded configuration vocabulary |
| NFR6 | **Reproducibility:** documented runtime, locked dependencies, deterministic seed/reset instructions |
| NFR7 | **Usability:** clear current state, available actions, validation errors, and audit history |
| NFR8 | **Operational clarity:** predictable error responses and documented persistence limitations |

Minimal proposed assumptions:

| ID | Assumption | Confirmation |
|---|---|---|
| A1 | Support **JSON only** initially; configuration loads at startup | Recommended default; JSON satisfies “JSON or YAML” |
| A2 | One workflow definition initially, with an immutable version pinned to each claim | Recommended default |
| A3 | Demo states: `draft`, `submitted`, `under_review`, `awaiting_information`, `approved`, `rejected` | **Required:** business states are unspecified |
| A4 | Demo roles: `claimant` and `adjuster`; claimants act only on their own claims | **Required:** roles and resource permissions are unspecified |
| A5 | A cycle is counted when an information request succeeds; three requests are allowed per claim lifetime | **Required:** “cycle” is ambiguous |
| A6 | At the limit, another information request is rejected; review, approval, and rejection remain possible | **Required:** exhaustion behavior is unspecified |
| A7 | Side effects initially mean local notification records and claim updates; no actual email or payment integration | **Required:** expected integrations are unspecified |
| A8 | A clearly labeled local demo identity mechanism is acceptable | **Required:** authentication expectations are unspecified |
| A9 | Single-process, in-memory storage is acceptable for the demonstration, with restart data loss disclosed | **Required:** durable persistence may be expected |
| A10 | Configuration changes may reuse existing condition/effect handlers; new executable capabilities require application code | **Required:** clarify the intended extensibility boundary |

If durable audit history is expected, A9 must be rejected and transactional persistent storage included.

**3. Proposed architecture**

Use one NestJS application and one React application. Avoid microservices, a workflow framework, a generic scripting language, or a configuration editor.

Backend responsibilities:

- **Configuration loader:** parse and validate the workflow before accepting requests.
- **Claims service:** create/read claims and enforce resource access.
- **Workflow service:** resolve commands, enforce policies, evaluate conditions, and prepare changes.
- **Condition/effect handlers:** a small allowlist of named operations with validated parameters.
- **Store:** own the atomic commit boundary for claim updates, audit events, and local effects.
- **Controllers:** translate HTTP requests and domain errors.

Keep interfaces only where they serve a concrete purpose, especially the store boundary. Do not create an abstraction for every entity.

Suggested API surface:

| Operation | Proposed endpoint |
|---|---|
| Create/list/read claims | `POST /claims`, `GET /claims`, `GET /claims/:id` |
| Read permitted action candidates | `GET /claims/:id/transitions` |
| Execute transition | `POST /claims/:id/transitions/:transitionId` |
| Read audit history | `GET /claims/:id/audit` |

Transition discovery is advisory. Execution must recheck every rule because claim state or permissions may have changed.

The React UI should provide a claim list, claim details, transition forms, cycle count, audit timeline, and a demo actor selector if A8 is approved. React state and `fetch` are sufficient initially.

Configuration should describe:

- Workflow ID, version, initial state, states, and terminal states.
- Transition ID, source, target, allowed roles, preconditions, and effects.
- Information-request semantics and its limit, capped at three.

Validate duplicate IDs, missing state references, unknown handlers/roles, invalid parameters, and inconsistent terminal-state definitions. Never execute JavaScript expressions from configuration.

**4. Domain model and transition contract**

| Entity/value | Responsibilities |
|---|---|
| `WorkflowDefinition` | Immutable, validated graph and policy configuration |
| `StateDefinition` | Stable state ID, display label, terminal status |
| `TransitionDefinition` | Source/target, role policy, conditions, effects, cycle behavior |
| `Claim` | Business data, owner ID, state, workflow version, cycle count, revision, timestamps |
| `Actor` | Backend-resolved user ID and roles |
| `TransitionCommand` | Claim ID, transition ID, expected revision, validated input, command ID |
| `AuditEvent` | Actor, action, outcome, before/after state, revisions, workflow version, server timestamp |
| `NotificationRecord` | Local side-effect output linked to the successful command |

Use a small typed input shape—for example, a request message, response text, or decision reason. File uploads and broad document management are unnecessary unless requested.

The transition contract should be:

| Aspect | Proposed behavior |
|---|---|
| Actor | Resolved by backend authentication/demo identity adapter; never accepted as arbitrary request roles |
| Input | Transition-specific payload, expected claim revision, unique command ID |
| Success | `200`: updated claim, committed audit event ID, and effect results |
| Invalid payload | `400`, stable error code and field details |
| Missing identity | `401` |
| Forbidden operation | `403`; inaccessible resources may use `404` to avoid disclosure |
| Missing claim/transition | `404`, subject to access policy |
| Wrong source state/stale revision | `409` |
| Failed condition/cycle exhaustion | `422` with a stable reason code |
| Commit/local-effect failure | `500`; no successful transition is persisted |

All rejected commands leave claim state, cycle count, revision, and successful effects unchanged.

For retry safety, reuse of the same command ID and payload returns the original committed result after access checks. Reusing the ID with different content returns `409`. Scope command IDs to the actor and claim.

Execution order:

1. Resolve actor, validate input, and check claim access.
2. Check for a previously committed matching command.
3. Load the claim’s pinned workflow definition.
4. Resolve the transition; check source state and allowed role.
5. Check expected revision, preconditions, and cycle limit.
6. Prepare the next claim state and local effects without mutating stored data.
7. Atomically recheck revision and commit claim, effects, audit event, and command receipt.
8. Return the committed result.

Preconditions are read-only and combined with **AND** initially. RBAC and resource access apply independently of conditions: satisfying a business condition never grants permission.

Cycle enforcement is an engine invariant, applied to transitions marked as information requests. It must not depend on a particular state name or a UI-disabled button. Increment only on successful commit; responses and failed requests do not increment it.

**5. Failure-handling and security considerations**

| Risk | Required handling |
|---|---|
| Concurrent transitions | Atomic revision comparison; one winner, stale commands rejected |
| Fourth request through another transition | Apply one shared per-claim counter to every information-request transition |
| Partial state/audit update | Commit both together; audit failure prevents successful mutation |
| Effect failure | For local effects, discard the entire prepared change |
| Response lost after commit | Command deduplication prevents duplicate transitions/effects |
| Configuration changed mid-claim | Retain immutable workflow versions; no silent migration |
| Invalid configuration | Fail startup with actionable validation errors |
| Role spoofing | Resolve roles server-side; reject request-supplied role overrides |
| Claim ID guessing | Enforce access on reads, transitions, and audit endpoints |
| Mass assignment | Allowlist fields; never accept client state, owner, counters, or revisions as updates |
| Sensitive audit content | Store necessary metadata and sanitized reasons; avoid tokens and complete claim payloads |
| Audit tampering | No public update/delete endpoint; describe this as application-level append-only history |
| Restart with in-memory storage | Disclose loss of claims, audit, and deduplication receipts |
| Telemetry leakage | Review Observe configuration and avoid sending sensitive claim data |

Record rejected attempts separately from successful state-change events where the actor and claim are safely identifiable. Use sanitized reason codes. A failed attempt-log write must not turn rejection into success.

Real external effects introduce a different contract: an email cannot be rolled back after sending. If external integrations become mandatory, commit an outbox record with the state change, then deliver with retries and deduplication. Do not promise exactly-once external delivery. Defer this mechanism while effects remain local.

The workflow must not evaluate arbitrary code, fetch arbitrary effect URLs, or dynamically import handlers selected by untrusted configuration.

**6. Requirement-to-test matrix**

All cases below are **planned**, not implemented or executed.

| # | Requirement | Test | Expected result | Level |
|---|---|---|---|---|
| 1 | FR1 | Load valid JSON workflow | Definition accepted | Unit |
| 2 | FR1 | Duplicate IDs or missing state reference | Configuration rejected | Unit |
| 3 | FR2/FR3 | Unknown condition/effect handler | Configuration rejected | Unit |
| 4 | FR7 | Add a state and transition using existing handlers | New transition executes without engine changes | Integration |
| 5 | FR1 | Execute valid transition | Correct target and revision increment | Unit |
| 6 | FR1 | Execute from wrong source state | Conflict; claim unchanged | Unit |
| 7 | FR4 | Allowed role executes transition | Success | Unit |
| 8 | FR4 | Disallowed role attempts transition | Forbidden; no effects | API |
| 9 | NFR3 | Missing identity or spoofed role payload | Authentication/validation rejection | API |
| 10 | NFR3 | Claimant accesses another owner’s claim/audit | Access denied | API |
| 11 | FR2 | Required data absent | Condition failure; no mutation | Unit |
| 12 | FR2 | Multiple conditions, one fails | Entire transition rejected | Unit |
| 13 | FR3 | Successful local effect | One notification linked to command | Integration |
| 14 | FR3/NFR1 | Local effect preparation fails | State, count, and audit success unchanged | Integration |
| 15 | FR5 | Successful transition | Audit has actor, before/after, version, timestamp | Integration |
| 16 | FR5/NFR1 | Audit commit fails | No claim/effect commit | Integration |
| 17 | FR6 | First three information requests | All succeed; count reaches three | Unit |
| 18 | FR6 | Fourth information request | Rejected; count remains three | Unit |
| 19 | FR6 | Failed request or information response | Counter does not increment | Unit |
| 20 | FR6/FR7 | Alternate configured request transition at limit | Same limit enforced | Integration |
| 21 | NFR2 | Two commands use the same revision | Exactly one commits | Integration |
| 22 | NFR4 | Retry identical successful command | Original result; no duplicate audit/effect | Integration |
| 23 | NFR4 | Reuse command ID with different payload | Conflict | API |
| 24 | FR1 | Transition from terminal state | Rejected unless definition explicitly permits it | Unit |
| 25 | NFR3 | Submit state/counter/owner overrides | Rejected; protected fields unchanged | API |
| 26 | A2 | New workflow version loaded | Existing claim retains original behavior | Integration |

Tests 9 and other multi-input cases should be independently executable cases, rather than one assertion covering several unrelated outcomes.

Five reproducible scenarios should accompany the tests:

| Scenario | Steps | Expected outcome |
|---|---|---|
| Approval | Claimant submits; adjuster starts review and approves | Approved claim with ordered audit history |
| Rejection | Submit; review; reject with reason | Rejected claim and recorded reason |
| Information round trip | Review; request information; claimant responds; approve | Count is one; response returns to review |
| Cycle exhaustion | Complete three request/response rounds; request again | Fourth request rejected; claim remains reviewable |
| Unauthorized action | Claimant attempts approval | Forbidden; no state change or notification |

Each scenario needs deterministic fixtures, actor identities, exact requests, expected responses, and a reset procedure. Automated scenario tests are preferable to screenshots alone.

**7. Prioritized implementation plan**

| Phase | Deliverable | Completion criterion |
|---|---|---|
| 1. Resolve scope | Confirm workflow, roles, cycle semantics, storage, effects | Short agreed specification |
| 2. Establish domain | Validated JSON definition, entities, deterministic engine | Configuration and transition tests pass |
| 3. Enforce integrity | Store commit boundary, revisions, RBAC, audit, local effects | Failure/concurrency tests pass |
| 4. Expose API | Claim endpoints, transition contract, errors, access checks | Meaningful API tests pass |
| 5. Build UI | Claims list/details, actions, errors, cycle count, audit | All five scenarios can be demonstrated |
| 6. Package submission | Fixtures, scenario runner, documentation, final checks | At least 15 domain/API tests pass and setup is reproducible |

Mandatory challenge scope:

- Configuration-driven states and transitions.
- Preconditions, side effects, backend RBAC.
- Audit trail and three-cycle limit.
- Demonstrated configuration-only extension.
- At least 15 meaningful automated tests.
- Five reproducible scenarios.
- Setup instructions and technical documentation.

Recommended minimum engineering scope:

- Runtime configuration/input validation.
- Atomic state/effect/audit commits.
- Concurrent-update protection and retry deduplication.
- Explicit storage and authentication limitations.
- A focused working frontend.

Defer if time is limited:

- YAML alongside JSON.
- Visual workflow/configuration editor.
- Hot reload and claim migration between workflow versions.
- Real email, payments, queues, and external-effect delivery.
- Production identity-provider integration, if demo identity is approved.
- Attachments, dashboards, search, pagination, deployment automation.
- Multi-tenancy, distributed execution, and complex expression languages.

LLM-based fraud detection is outside scope and should not be added.

Documentation should cover installation/start commands for both packages, runtime versions, configuration schema, domain rules, API/errors, test commands, scenario reproduction/reset, side-effect semantics, and known limitations.

**8. Open questions before implementation**

The first six questions materially affect implementation scope:

1. **What are the intended states, transitions, roles, and claim ownership rules?**
   Proposed default: the six states and two roles in A3–A4.

2. **What counts as an information-request cycle?**
   Proposed default: increment when a request successfully commits; cap at three over the claim’s lifetime.

3. **What happens after the third cycle?**
   Proposed default: block further requests while permitting review and a final decision.

4. **Must claims and audit records survive restarts?**
   Proposed default for the smallest demo: in-memory storage with an explicit limitation; use transactional persistence if durability is expected.

5. **Is demo identity acceptable, or is real authentication required?**
   Proposed default: seeded actors resolved by a local-only backend adapter.

6. **Which side effects must be demonstrated?**
   Proposed default: local notification records; no real outbound integrations.

7. **Does configuration-only extensibility mean composing existing conditions/effects?**
   Proposed default: yes. Adding new business capabilities may require a handler, but never rewriting the engine.

8. **Is startup-loaded JSON sufficient?**
   Proposed default: yes; no YAML support, hot reload, or configuration UI.

9. **Are failed attempts part of the required audit trail?**
   Proposed default: record sanitized, attributable failures separately from committed state changes.

> # Task 02: Finalize Architecture and Resolve Implementation Decisions
>
> Continue from the repository assessment and requirements analysis in Task 01.
>
> Act as the senior engineer responsible for finalizing the technical design before implementation.
>
> ## Decisions for this challenge
>
> Use the following proposed defaults unless the existing repository or a concrete technical constraint makes one infeasible:
>
> 1. Keep the existing React + TypeScript + Vite + Tailwind CSS frontend and NestJS + TypeScript backend.
> 2. Use JSON workflow configuration loaded and validated at application startup.
> 3. Use SQLite for persistent claims, audit events, workflow version references, local notification records, and command receipts.
> 4. Use two demo roles: `claimant` and `adjuster`.
> 5. Enable demo identity only in development. Resolve the selected actor through a backend-owned allowlist; never accept arbitrary roles from request payloads. Clearly document that this is not production authentication.
> 6. Count an information-request cycle when a request-information transition successfully commits. Allow at most three successful requests per claim lifetime. Reject a fourth request without changing the claim or counter.
> 7. Implement only local side effects, such as notification records. Do not send emails, initiate payments, or call external services.
> 8. Commit a successful claim transition, cycle-counter update, local side effects, command receipt, and success audit event atomically.
> 9. Use optimistic concurrency control so competing transitions cannot silently overwrite each other.
> 10. Pin each claim to an immutable workflow configuration version.
> 11. Record rejected transition attempts separately from successful state-change events when the actor and claim can be identified safely.
> 12. Keep the frontend focused on claim listing, claim details, permitted actions, validation errors, cycle count, and audit history.
>
> ## Your tasks
>
> Do not implement features or modify files in this task.
>
> 1. Reconcile these decisions with the findings from Task 01.
> 2. Inspect the existing NestJS and frontend conventions again where needed.
> 3. Define the final module boundaries and dependency direction.
> 4. Define the SQLite schema and required indexes.
> 5. Define the workflow JSON schema, including state definitions, transitions, preconditions, side effects, role restrictions, and cycle-limit behavior.
> 6. Define the API request and response contracts, stable error codes, and status codes.
> 7. Specify the transaction boundary, optimistic-locking strategy, command deduplication behavior, and audit-write failure behavior.
> 8. Explain how development demo identity is isolated from production mode.
> 9. Map every mandatory challenge requirement to an implementation module and a planned test.
> 10. Identify the minimum dependencies required. Do not install them yet.
> 11. Provide a phased implementation order that minimizes rework.
> 12. List remaining risks and any decision that genuinely blocks implementation.
>
> ## Design constraints
>
> - Do not introduce microservices, a message broker, an external identity provider, or real insurance integrations.
> - Do not use arbitrary code execution or dynamic imports from workflow configuration.
> - Do not put business logic in React components or HTTP controllers.
> - Do not claim that audit records are tamper-proof against database administrators.
> - Do not claim any feature or test is implemented.
> - Keep the design small enough for a take-home challenge.
>
> ## Expected output
>
> Return:
>
> 1. Final architecture and module responsibilities.
> 2. Proposed folder structure that fits the existing repository.
> 3. Workflow configuration example and validation rules.
> 4. SQLite data model and transaction strategy.
> 5. API contract and error model.
> 6. Security and failure-handling decisions.
> 7. Requirement-to-module-to-test traceability matrix.
> 8. Minimal dependency changes.
> 9. Prioritized implementation sequence.
> 10. Remaining blockers, if any.
>
> Wait for design review before implementing code.

<details><summary>2 previous messages</summary>

> I’ll recheck the scaffold and runtime constraints, then finalize the design around SQLite and your decisions. I’ll leave files unchanged and stop at the design review.
>
> <details><summary>Ran 2 commands, called a tool</summary>
>
> - Ran `cat backend/package.json backend/src/app.module.ts backend/src/main.ts backend/tsconfig.json backend/vitest.config.ts frontend/package.json frontend/vite.config.ts frontend/tsconfig.app.json; node --version; git status --short`
>
> - Ran `rg --files --hidden -g 'AGENTS.md' -g '!node_modules' -g '!.git'; rg --files backend/src backend/test frontend/src; command -v node; ls /Users/tranngochung/.nvm/versions/node`
>
> MCP tool call
>
> codex_apps.search_service.web_run
>
> ```json
> {
>   "system2_search_query": [
>     {
>       "q": "site.sqlite.org lang_transaction BEGIN IMMEDIATE SQLITE_BUSY"
>     },
>     {
>       "q": "site.sqlite.org foreignkeys PRAGMA foreign_keys"
>     },
>     {
>       "q": "site.github.com/WiseLibs/better-sqlite3 transaction"
>     },
>     {
>       "q": "site.ajv.js.org strict mode JSON schema validation"
>     }
>   ],
>   "response_length": "short"
> }
> ```
>
> ```text
> {"content":[{"type":"text","text":"Strict mode | Ajv JSON schema validator (https://ajv.js.org/strict-mode.html)\n【turn0search0】 [wordlim: 200] Crawled: 5 months ago; Standard JSON Schema formats are provided in ajv-formats (opens new window) package - see Formats section. ... In strict mode Ajv fails schema compilation if such defaults are used in the schema.\n\n--------------------------------------------------------------------------------\nAjv options | Ajv JSON schema validator (https://ajv.js.org/options)\n【turn0search1】 [wordlim: 200] Crawled: 5 months ago; In strict mode unknown formats will throw exception during schema compilation (and fail validation in case format keyword value is $data reference). ... By default Ajv uses unicode flag \"u\" with \"pattern\" and \"patternProperties\", as per JSON Schema spec. ... Validate added/compiled schemas against meta-schema (true by default). `$schema` property in the schema can be http://json-schema.org/draft-07/schema or absent (draft-07 meta-schema will be used) or can be a reference to the schema previously added with `addMetaSchema` method.\n\n--------------------------------------------------------------------------------\nPragma statements supported by SQLite (https://www.sqlite.org/pragma.html)\n【turn0search2】 [wordlim: 200] Crawled: last month; The PRAGMA statement is an SQL extension specific to SQLite and used to modify the operation of the SQLite library or to query the SQLite library for internal (non-table) data. ... The default setting for foreign key enforcement can be specified at compile-time using the SQLITE_DEFAULT_FOREIGN_KEYS preprocessor macro.\n\n--------------------------------------------------------------------------------\nSQLite Foreign Key Support (https://www.sqlite.org/foreignkeys.html)\n【turn0search3】 [wordlim: 200] Crawled: 2 days ago; Tip: If the command \"PRAGMA foreign_keys\" returns no data instead of a single row containing \"0\" or \"1\", then the version of SQLite you are using does not support foreign keys (either because it is older than 3.6.19 or because it was compiled with SQLITE_OMIT_FOREIGN_KEY or SQLITE_OMIT_TRIGGER defined).\n\n--------------------------------------------------------------------------------\nSQLite Foreign Key Support (https://sqlite.org/foreignkeys.html)\n【turn0search4】 [wordlim: 200] Published: 7 months ago; Crawled: 2 days ago; Tip: If the command \"PRAGMA foreign_keys\" returns no data instead of a single row containing \"0\" or \"1\", then the version of SQLite you are using does not support foreign keys (either because it is older than 3.6.19 or because it was compiled with SQLITE_OMIT_FOREIGN_KEY or SQLITE_OMIT_TRIGGER defined).\n\n--------------------------------------------------------------------------------\nSQLite Query Language: BEGIN TRANSACTION (https://system.data.sqlite.org/home/doc/0a3d6229a7425242/Doc/Extra/Core/lang_transaction.html)\n【turn0search5】 [wordlim: 200] Crawled: today; The BEGIN IMMEDIATE might fail with SQLITE_BUSY if another write transaction is already active on another database connection.\n\n--------------------------------------------------------------------------------\nTransaction (https://www.sqlite.org/lang_transaction.html)\n【turn0search6】 [wordlim: 200] Crawled: 2 days ago; The BEGIN IMMEDIATE might fail with SQLITE_BUSY if another write transaction is already active on another database connection.\n\n--------------------------------------------------------------------------------\nPragma statements supported by SQLite (https://system.data.sqlite.org/home/doc/0a3d6229a7425242/Doc/Extra/Core/pragma.html)\n【turn0search7】 [wordlim: 200] Crawled: 6 days ago; PRAGMA foreign_keys ... The default setting for foreign key enforcement can be specified at compile-time using the SQLITE_DEFAULT_FOREIGN_KEYS preprocessor macro.\n\n--------------------------------------------------------------------------------\nPragma statements supported by SQLite (https://www.sqlite.org/pragma.html?skip_cache=true)\n【turn0search8】 [wordlim: 200] Crawled: 2 days ago; When the defer_foreign_keys PRAGMA is on, enforcement of all foreign key constraints is delayed until the outermost transaction is committed. ... The default setting for foreign key enforcement can be specified at compile-time using the SQLITE_DEFAULT_FOREIGN_KEYS preprocessor macro.\n\n--------------------------------------------------------------------------------\nPragma statements supported by SQLite (https://system.data.sqlite.org/home/doc/c221f9714da980e6/Doc/Extra/Core/pragma.html)\n【turn0search9】 [wordlim: 200] Crawled: last week; PRAGMA foreign_keys; ... The default setting for foreign key enforcement can be specified at compile-time using the SQLITE_DEFAULT_FOREIGN_KEYS preprocessor macro.\n\n--------------------------------------------------------------------------------\nPragma statements supported by SQLite (https://system.data.sqlite.org/home/doc/4deb290d232e5850/Doc/Extra/Core/pragma.html)\n【turn0search10】 [wordlim: 200] Crawled: today; PRAGMA foreign_keys ... The default setting for foreign key enforcement can be specified at compile-time using the SQLITE_DEFAULT_FOREIGN_KEYS preprocessor macro.\n\n--------------------------------------------------------------------------------\nAjv JSON schema validator (https://ajv.js.org/packages/ajv-cli.html)\n【turn0search11】 [wordlim: 200] Crawled: 5 months ago; If multiple schemas are compiled with this option the module will have multiple exports named as schema $id's or as file names, otherwise the module will export validation function as default export.    `ajv compile -s \"schema.json\" -o \"validate_schema.js\" ... Strict mode  |\n\n--------------------------------------------------------------------------------\nPragma statements supported by SQLite (https://www3.sqlite.org/matrix/pragma.html)\n【turn0search12】 [wordlim: 200] Crawled: 1.9 years ago; The PRAGMA statement is an SQL extension specific to SQLite and used to modify the operation of the SQLite library or to query the SQLite library for internal (non-table) data. ... The default setting for foreign key enforcement can be specified at compile-time using the SQLITE_DEFAULT_FOREIGN_KEYS preprocessor macro.\n\n--------------------------------------------------------------------------------\nSQLite Frequently Asked Questions (https://sqlite.org/faq.html)\n【turn0search13】 [wordlim: 200] Crawled: 2 days ago; (22) Does SQLite support foreign keys? ... To enable foreign key constraint enforcement, run PRAGMA foreign_keys=ON or compile with -DSQLITE_DEFAULT_FOREIGN_KEYS=1.\n\n--------------------------------------------------------------------------------\nSQLite Query Language: BEGIN TRANSACTION (https://system.data.sqlite.org/home/doc/c221f9714da980e6/Doc/Extra/Core/lang_transaction.html)\n【turn0search14】 [wordlim: 200] Crawled: today; If the transaction is immediate, then RESERVED locks are acquired on all databases as soon as the BEGIN command is executed, without waiting for the database to be used. ... An attempt to execute COMMIT might also result in an SQLITE_BUSY return code if an another thread or process has a shared lock on the database that prevented the database from being updated. ... For all of these errors, SQLite attempts to undo just the one statement it was working on and leave changes from prior statements within the same transaction intact and continue with the transaction.\n\n--------------------------------------------------------------------------------\nChoosing schema language | Ajv JSON schema validator (https://ajv.js.org/guide/schema-language)\n【turn0search15】 [wordlim: 200] Crawled: 5 months ago; Ajv supports most widely used drafts of JSON Schema specification.Please see the informal reference of available JSON Schema validation keywords and specification drafts (opens new window). ...   * Complex and error prone for the new users (Ajv has strict mode enabled by default to compensate for it, but it is not cross-platform).\n\n--------------------------------------------------------------------------------\nGitHub - WiseLibs/better-sqlite3: The fastest and simplest library for SQLite3 in Node.js. · GitHub (https://github.com/WiseLibs/better-sqlite3)\n【turn0search16】 [wordlim: 200] Crawled: today; WiseLibs  2. better-sqlite3 ... .github  | .github  |    | ...   * Full transaction support ...   * `node-sqlite3` exposes low-level (C language) memory management functions. `better-sqlite3` does it the JavaScript way, allowing the garbage collector to worry about memory management.\n\n--------------------------------------------------------------------------------\nbetter-sqlite3/docs/api.md at master · WiseLibs/better-sqlite3 · GitHub (https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md?plain=1)\n【turn0search17】 [wordlim: 200] Crawled: 6 days ago; If you get an error that looks like [this](https://github.com/JoshuaWise/better-sqlite3/issues/534#issuecomment-757907190), you can solve it by using this option to provide the file path of `better_sqlite3.node` (relative to the current working directory). ... When doing so, the inner transaction becomes a [savepoint](https://www.sqlite.org/lang_savepoint.html). ... |`INTEGER`|`number` [or `BigInt`](https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/integer.md#the-bigint-primitive-type)|\n\n--------------------------------------------------------------------------------\nJSON Schema | Ajv JSON schema validator (https://ajv.js.org/json-schema.html)\n【turn0search18】 [wordlim: 200] Crawled: 5 months ago; In a simple way, JSON Schema is an object with validation keywords. ... In v7 Ajv introduced Strict types mode that makes these mistakes less likely by requiring that types are constrained with type keyword whenever another keyword that applies to specific type is used.\n\n--------------------------------------------------------------------------------\nALTER TABLE (https://sqlite.org/lang_altertable.html)\n【turn0search19】 [wordlim: 200] Crawled: 2 days ago; Prior to version 3.26.0 (2018-12-01), FOREIGN KEY references to a table that is renamed were only edited with PRAGMA foreign_keys=ON, or in other words if foreign key constraints were being enforced. ... > PRAGMA foreign_keys  | PRAGMA legacy_alter_table  | Parent Table references are updated  | SQLite version\n\n--------------------------------------------------------------------------------\nPragma statements supported by SQLite (https://system.data.sqlite.org/home/raw/d0618b63a6185128f8ec70a065cddd2544773f3f)\n【turn0search20】 [wordlim: 200] Crawled: today; PRAGMA foreign_key_check; ... Any existing statements prepared using the legacy sqlite3_prepare() interface may fail with an SQLITE_SCHEMA error after the foreign_keys setting is changed.\n\n--------------------------------------------------------------------------------\nSQLite Query Language: BEGIN TRANSACTION (https://system.data.sqlite.org/home/doc/4deb290d232e5850/Doc/Extra/Core/lang_transaction.html)\n【turn0search21】 [wordlim: 200] Crawled: yesterday; If the transaction is immediate, then RESERVED locks are acquired on all databases as soon as the BEGIN command is executed, without waiting for the database to be used. ... An attempt to execute COMMIT might also result in an SQLITE_BUSY return code if an another thread or process has a shared lock on the database that prevented the database from being updated. ... For all of these errors, SQLite attempts to undo just the one statement it was working on and leave changes from prior statements within the same transaction intact and continue with the transaction.\n\n--------------------------------------------------------------------------------\nTransaction (https://www3.sqlite.org/matrix/lang_transaction.html)\n【turn0search22】 [wordlim: 200] Crawled: 1.9 years ago; ] The BEGIN IMMEDIATE might fail with SQLITE_BUSY if another write transaction is already active on another database connection.\n\n--------------------------------------------------------------------------------\nSQLite Query Language: ALTER TABLE (https://system.data.sqlite.org/home/doc/0a3d6229a7425242/Doc/Extra/Core/lang_altertable.html)\n【turn0search23】 [wordlim: 200] Crawled: today; Prior to version 3.26.0 (2018-12-01), FOREIGN KEY references to a table that is renamed were only edited if the PRAGMA foreign_keys=ON, or in other words if foreign key constraints were begin enforced. ... > PRAGMA foreign_keys  | PRAGMA legacy_alter_table  | Parent Table references are updated  | SQLite version\n\n--------------------------------------------------------------------------------\nModifying data during validation | Ajv JSON schema validator (https://ajv.js.org/guide/modifying-data.html)\n【turn0search24】 [wordlim: 200] Crawled: 5 months ago; Ajv has several options that allow to modify data during validation: ... This functionality is non-standard - this is likely to be unsupported in other JSON Schema validator implementations. ...     const validate = ajv.compile(schema) ... The strict mode option can change the behaviour for these unsupported defaults (`strict: false` to ignore them, `\"log\"` to log a warning).\n\n--------------------------------------------------------------------------------\nFrequently Asked Questions | Ajv JSON schema validator (https://ajv.js.org/faq.html)\n【turn0search25】 [wordlim: 200] Crawled: 5 months ago;     * Why the validation fails when I use option removeAdditional with the keyword anyOf/etc.? ... Ajv implements JSON schema specification. ... Strict types mode introduced in v7 requires presence of \"type\" when \"properties\" are used, so the mistakes are less likely.\n\n--------------------------------------------------------------------------------\nSQLite User Forum: Clarification on when I will get SQLITE_BUSY from beginning write transaction (https://sqlite.org/forum/forumpost/ac1418dacc)\n【turn0search26】 [wordlim: 200] Published: 1.5 years ago; Crawled: 3 days ago; Clarification on when I will get SQLITE_BUSY from beginning write transaction ... When these threads try to simultaneously start write transactions with \"BEGIN IMMEDIATE;\", will these attempts to start transactions return SQLITE_BUSY?\n\n--------------------------------------------------------------------------------\nResult and Error Codes (https://www.sqlite.org/rescode.html)\n【turn0search27】 [wordlim: 200] Crawled: 2 days ago; To avoid encountering SQLITE_BUSY errors in the middle of a transaction, the application can use BEGIN IMMEDIATE instead of just BEGIN to start a transaction.\n\n--------------------------------------------------------------------------------\nbetter-sqlite3/README.md at master · WiseLibs/better-sqlite3 · GitHub (https://github.com/WiseLibs/better-sqlite3/blob/master/README.md)\n【turn0search28】 [wordlim: 200] Crawled: today; # better-sqlite3 ...   * Full transaction support ... better-sqlite3  | 1x  | 1x  | 1x  | 1x  | 1x\n\n--------------------------------------------------------------------------------\ndb.transaction() not working? · Issue #190 · WiseLibs/better-sqlite3 · GitHub (https://github.com/WiseLibs/better-sqlite3/issues/190)\n【turn0search29】 [wordlim: 200] Published: 8.0 years ago; Crawled: last week; WiseLibs  2. better-sqlite3 ... # db.transaction() not working?\n\n--------------------------------------------------------------------------------\nSQLite Requirement Matrix: lang_transaction.html (https://www3.sqlite.org/matrix/matrix_dlang_transaction.html)\n【turn0search30】 [wordlim: 200] Crawled: 1.9 years ago; EXCLUSIVE is similar to IMMEDIATE in that a write transaction is started immediately. ... An attempt to execute COMMIT might also result in an SQLITE_BUSY return code if an another thread or process has an open read connection.\n\n--------------------------------------------------------------------------------\nbetter-sqlite3/docs/api.md at master · WiseLibs/better-sqlite3 · GitHub (https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)\n【turn0search31】 [wordlim: 200] Crawled: 2 weeks ago;   * Database#transaction() ... If you get an error that looks like this, you can solve it by using this option to provide the file path of `better_sqlite3.node` (relative to the current working directory).\n\n--------------------------------------------------------------------------------\nSQLite User Forum: Help understanding the effect of BEGIN IMMEDIATE (https://sqlite.org/forum/forumpost/04ed1d235b)\n【turn0search32】 [wordlim: 200] Crawled: today; > This is why you should start your transactions with BEGIN IMMEDIATE instead of only BEGIN. ... I've been trying and failing to write Python code that can trigger a \"database is locked\" / SQLITE_BUSY error which stops being an error when I switch to a BEGIN IMMEDIATELY transaction.\n\n--------------------------------------------------------------------------------\nSQLite User Forum: Simultaneous read and write transactions: when they can commit? (https://sqlite.org/forum/info/3932875f018d4eb60b0441a5d6fd60cefc31b569328282deed041488a7c33594?t=c)\n【turn0search33】 [wordlim: 200] Published: 4.1 years ago; Crawled: 4 weeks ago; When `BEGIN IMMEDIATE` is issued, the database connection attempts to create a RESERVED lock on the database? ... Also, I am trying to wrap my head around this passage from (https://www.sqlite.org/lang_transaction.html). ... write operations, the COMMIT command will fail with an error code SQLITE_BUSY.\"\n\n--------------------------------------------------------------------------------\nTRANSACTIONS (https://system.data.sqlite.org/home/raw/419906d4a0043afe2290c2be186556295c25c724)\n【turn0search34】 [wordlim: 200] Crawled: today; If the transaction is immediate, then RESERVED locks are acquired on all databases as soon as the BEGIN command is executed, without waiting for the database to be used. ... The default behavior for SQLite version 3.0.8 is a deferred transaction. ... An attempt to execute COMMIT might result in an SQLITE_BUSY return code.\n"}],"isError":false,"_meta":{"raw_messages":[{"id":"eacad491-887d-4606-b0c5-e6d5c75ff8b6","author":{"role":"tool","name":"web.run","metadata":{"real_author":"tool:web.run"}},"create_time":null,"update_time":null,"content":{"content_type":"sonic_webpage","url":"https://ajv.js.org/strict-mode.html","domain":"ajv.js.org","title":"Strict mode | Ajv JSON schema validator","text":"【turn0search0】 [wordlim: 200] Crawled: 5 months ago; Standard JSON Schema formats are provided in ajv-formats (opens new window) package - see Formats section. ... In strict mode Ajv fails schema compilation if such defaults are used in the schema.\n","snippet":"Standard JSON Schema formats are provided in ajv-formats (opens new window) package - see Formats section. ... In strict mode Ajv fails schema compilation if such defaults are used in the schema.","pub_date":null,"crawl_date":null,"pub_timestamp":null,"crawl_timestamp":1777016498.0,"ref_id":"turn0search0"},"status":"finished_successfully","end_turn":null,"weight":1.0,"metadata":{"__internal":{"sonic_browser_tool":{"turn_index":1,"successful_turn_index":1,"execution_mode":"stateless","content":{"turn0search0":{"url":"https://ajv.js.org/strict-mode.html","title":"Strict mode | Ajv JSON schema validator","ref_type":"search","content_type":null,"anchor":"Standard JSON Schema formats are provided in ajv-formats (opens new window) package - see Formats section. ... In strict mode Ajv fails schema compilation if such defaults are used in the schema.","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search1":{"url":"https://ajv.js.org/options","title":"Ajv options | Ajv JSON schema validator","ref_type":"search","content_type":null,"anchor":"In strict mode unknown formats will throw exception during schema compilation (and fail validation in case format keyword value is $data reference). ... By default Ajv uses unicode flag \"u\" with \"pattern\" and \"patternProperties\", as per JSON Schema spec. ... Validate added/compiled schemas against meta-schema (true by default). `$schema` property in the schema can be http://json-schema.org/draft-07/schema or absent (draft-07 meta-schema will be used) or can be a reference to the schema previously added with `addMetaSchema` method.","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search2":{"url":"https://www.sqlite.org/pragma.html","title":"Pragma statements supported by SQLite","ref_type":"search","content_type":null,"anchor":"The PRAGMA statement is an SQL extension specific to SQLite and used to modify the operation of the SQLite library or to query the SQLite library for internal (non-table) data. ... The default setting for foreign key enforcement can be specified at compile-time using the SQLITE_DEFAULT_FOREIGN_KEYS preprocessor macro.","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search3":{"url":"https://www.sqlite.org/foreignkeys.html","title":"SQLite Foreign Key Support","ref_type":"search","content_type":null,"anchor":"Tip: If the command \"PRAGMA foreign_keys\" returns no data instead of a single row containing \"0\" or \"1\", then the version of SQLite you are using does not support foreign keys (either because it is older than 3.6.19 or because it was compiled with SQLITE_OMIT_FOREIGN_KEY or SQLITE_OMIT_TRIGGER defined).","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search4":{"url":"https://sqlite.org/foreignkeys.html","title":"SQLite Foreign Key Support","ref_type":"search","content_type":null,"anchor":"Tip: If the command \"PRAGMA foreign_keys\" returns no data instead of a single row containing \"0\" or \"1\", then the version of SQLite you are using does not support foreign keys (either because it is older than 3.6.19 or because it was compiled with SQLITE_OMIT_FOREIGN_KEY or SQLITE_OMIT_TRIGGER defined).","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search5":{"url":"https://system.data.sqlite.org/home/doc/0a3d6229a7425242/Doc/Extra/Core/lang_transaction.html","title":"SQLite Query Language: BEGIN TRANSACTION","ref_type":"search","content_type":null,"anchor":"The BEGIN IMMEDIATE might fail with SQLITE_BUSY if another write transaction is already active on another database connection.","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search6":{"url":"https://www.sqlite.org/lang_transaction.html","title":"Transaction","ref_type":"search","content_type":null,"anchor":"The BEGIN IMMEDIATE might fail with SQLITE_BUSY if another write transaction is already active on another database connection.","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search7":{"url":"https://system.data.sqlite.org/home/doc/0a3d6229a7425242/Doc/Extra/Core/pragma.html","title":"Pragma statements supported by SQLite","ref_type":"search","content_type":null,"anchor":"PRAGMA foreign_keys ... The default setting for foreign key enforcement can be specified at compile-time using the SQLITE_DEFAULT_FOREIGN_KEYS preprocessor macro.","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search8":{"url":"https://www.sqlite.org/pragma.html?skip_cache=true","title":"Pragma statements supported by SQLite","ref_type":"search","content_type":null,"anchor":"When the defer_foreign_keys PRAGMA is on, enforcement of all foreign key constraints is delayed until the outermost transaction is committed. ... The default setting for foreign key enforcement can be specified at compile-time using the SQLITE_DEFAULT_FOREIGN_KEYS preprocessor macro.","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search9":{"url":"https://system.data.sqlite.org/home/doc/c221f9714da980e6/Doc/Extra/Core/pragma.html","title":"Pragma statements supported by SQLite","ref_type":"search","content_type":null,"anchor":"PRAGMA foreign_keys; ... The default setting for foreign key enforcement can be specified at compile-time using the SQLITE_DEFAULT_FOREIGN_KEYS preprocessor macro.","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search10":{"url":"https://system.data.sqlite.org/home/doc/4deb290d232e5850/Doc/Extra/Core/pragma.html","title":"Pragma statements supported by SQLite","ref_type":"search","content_type":null,"anchor":"PRAGMA foreign_keys ... The default setting for foreign key enforcement can be specified at compile-time using the SQLITE_DEFAULT_FOREIGN_KEYS preprocessor macro.","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search11":{"url":"https://ajv.js.org/packages/ajv-cli.html","title":"Ajv JSON schema validator","ref_type":"search","content_type":null,"anchor":"If multiple schemas are compiled with this option the module will have multiple exports named as schema $id's or as file names, otherwise the module will export validation function as default export.    `ajv compile -s \"schema.json\" -o \"validate_schema.js\" ... Strict mode  |","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search12":{"url":"https://www3.sqlite.org/matrix/pragma.html","title":"Pragma statements supported by SQLite","ref_type":"search","content_type":null,"anchor":"The PRAGMA statement is an SQL extension specific to SQLite and used to modify the operation of the SQLite library or to query the SQLite library for internal (non-table) data. ... The default setting for foreign key enforcement can be specified at compile-time using the SQLITE_DEFAULT_FOREIGN_KEYS preprocessor macro.","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search13":{"url":"https://sqlite.org/faq.html","title":"SQLite Frequently Asked Questions","ref_type":"search","content_type":null,"anchor":"(22) Does SQLite support foreign keys? ... To enable foreign key constraint enforcement, run PRAGMA foreign_keys=ON or compile with -DSQLITE_DEFAULT_FOREIGN_KEYS=1.","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search14":{"url":"https://system.data.sqlite.org/home/doc/c221f9714da980e6/Doc/Extra/Core/lang_transaction.html","title":"SQLite Query Language: BEGIN TRANSACTION","ref_type":"search","content_type":null,"anchor":"If the transaction is immediate, then RESERVED locks are acquired on all databases as soon as the BEGIN command is executed, without waiting for the database to be used. ... An attempt to execute COMMIT might also result in an SQLITE_BUSY return code if an another thread or process has a shared lock on the database that prevented the database from being updated. ... For all of these errors, SQLite attempts to undo just the one statement it was working on and leave changes from prior statements within the same transaction intact and continue with the transaction.","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search15":{"url":"https://ajv.js.org/guide/schema-language","title":"Choosing schema language | Ajv JSON schema validator","ref_type":"search","content_type":null,"anchor":"Ajv supports most widely used drafts of JSON Schema specification.Please see the informal reference of available JSON Schema validation keywords and specification drafts (opens new window). ...   * Complex and error prone for the new users (Ajv has strict mode enabled by default to compensate for it, but it is not cross-platform).","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search16":{"url":"https://github.com/WiseLibs/better-sqlite3","title":"GitHub - WiseLibs/better-sqlite3: The fastest and simplest library for SQLite3 in Node.js. · GitHub","ref_type":"search","content_type":null,"anchor":"WiseLibs  2. better-sqlite3 ... .github  | .github  |    | ...   * Full transaction support ...   * `node-sqlite3` exposes low-level (C language) memory management functions. `better-sqlite3` does it the JavaScript way, allowing the garbage collector to worry about memory management.","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search17":{"url":"https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md?plain=1","title":"better-sqlite3/docs/api.md at master · WiseLibs/better-sqlite3 · GitHub","ref_type":"search","content_type":null,"anchor":"If you get an error that looks like [this](https://github.com/JoshuaWise/better-sqlite3/issues/534#issuecomment-757907190), you can solve it by using this option to provide the file path of `better_sqlite3.node` (relative to the current working directory). ... When doing so, the inner transaction becomes a [savepoint](https://www.sqlite.org/lang_savepoint.html). ... |`INTEGER`|`number` [or `BigInt`](https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/integer.md#the-bigint-primitive-type)|","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search18":{"url":"https://ajv.js.org/json-schema.html","title":"JSON Schema | Ajv JSON schema validator","ref_type":"search","content_type":null,"anchor":"In a simple way, JSON Schema is an object with validation keywords. ... In v7 Ajv introduced Strict types mode that makes these mistakes less likely by requiring that types are constrained with type keyword whenever another keyword that applies to specific type is used.","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search19":{"url":"https://sqlite.org/lang_altertable.html","title":"ALTER TABLE","ref_type":"search","content_type":null,"anchor":"Prior to version 3.26.0 (2018-12-01), FOREIGN KEY references to a table that is renamed were only edited with PRAGMA foreign_keys=ON, or in other words if foreign key constraints were being enforced. ... > PRAGMA foreign_keys  | PRAGMA legacy_alter_table  | Parent Table references are updated  | SQLite version","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search20":{"url":"https://system.data.sqlite.org/home/raw/d0618b63a6185128f8ec70a065cddd2544773f3f","title":"Pragma statements supported by SQLite","ref_type":"search","content_type":null,"anchor":"PRAGMA foreign_key_check; ... Any existing statements prepared using the legacy sqlite3_prepare() interface may fail with an SQLITE_SCHEMA error after the foreign_keys setting is changed.","anchor_type":"optional","lineno":null,"pageno":null,"height":null,"offset":null},"turn0search21":{"url":"https://system.data.sqlite.org/home/doc/4deb290d232e5850/Doc/Extra/Core/lang_transaction.html","title":"SQLite Query Language: BEGIN TRANSACTION","ref_type":"search","content_type":null,"anchor":"If the tran…60171 chars truncated…nt_type":"sonic_webpage","url":"https://ajv.js.org/json-schema.html","domain":"ajv.js.org","title":"JSON Schema | Ajv JSON schema validator","text":"【turn0search18】 [wordlim: 200] Crawled: 5 months ago; In a simple way, JSON Schema is an object with validation keywords. ... In v7 Ajv introduced Strict types mode that makes these mistakes less likely by requiring that types are constrained with type keyword whenever another keyword that applies to specific type is used.\n","snippet":"In a simple way, JSON Schema is an object with validation keywords. ... In v7 Ajv introduced Strict types mode that makes these mistakes less likely by requiring that types are constrained with type keyword whenever another keyword that applies to specific type is used.","pub_date":null,"crawl_date":null,"pub_timestamp":null,"crawl_timestamp":1777016498.0,"ref_id":"turn0search18"},"status":"finished_successfully","end_turn":null,"weight":1.0,"metadata":{"debug_sonic_thread_id":null,"search_engine":"system2-web","result_source":"labrador","ref_id":"turn0search18","minimal_str":"JSON Schema | Ajv JSON schema validator (https://ajv.js.org/json-schema.html)\n【turn0search18】 [wordlim: 200] Crawled: 5 months ago; ","fetch_request":"{\"q\":\"site.ajv.js.org strict mode json schema validation\",\"recency\":null,\"domains\":null,\"ignore_domains\":null,\"caller\":null,\"per_engine_overrides\":null}","n_tokens":101,"upsert_skip_copy":true,"__internal":{"cot_search_result_score":6.99995493888855,"cot_search_result_score_cutoff":6.817807197570801}},"recipient":"all","channel":"analysis"},{"id":"ad37372d-55a9-452d-861d-72cf79c160c8","author":{"role":"tool","name":"web.run","metadata":{"real_author":"tool:web.run"}},"create_time":null,"update_time":null,"content":{"content_type":"sonic_webpage","url":"https://sqlite.org/lang_altertable.html","domain":"sqlite.org","title":"ALTER TABLE","text":"【turn0search19】 [wordlim: 200] Crawled: 2 days ago; Prior to version 3.26.0 (2018-12-01), FOREIGN KEY references to a table that is renamed were only edited with PRAGMA foreign_keys=ON, or in other words if foreign key constraints were being enforced. ... > PRAGMA foreign_keys  | PRAGMA legacy_alter_table  | Parent Table references are updated  | SQLite version\n","snippet":"Prior to version 3.26.0 (2018-12-01), FOREIGN KEY references to a table that is renamed were only edited with PRAGMA foreign_keys=ON, or in other words if foreign key constraints were being enforced. ... > PRAGMA foreign_keys  | PRAGMA legacy_alter_table  | Parent Table references are updated  | SQLite version","pub_date":null,"crawl_date":null,"pub_timestamp":null,"crawl_timestamp":1792172716.0,"ref_id":"turn0search19"},"status":"finished_successfully","end_turn":null,"weight":1.0,"metadata":{"debug_sonic_thread_id":null,"search_engine":"system2-web","result_source":"labrador","ref_id":"turn0search19","minimal_str":"ALTER TABLE (https://sqlite.org/lang_altertable.html)\n【turn0search19】 [wordlim: 200] Crawled: 2 days ago; ","fetch_request":"{\"q\":\"site.sqlite.org foreignkeys pragma foreign_keys\",\"recency\":null,\"domains\":null,\"ignore_domains\":null,\"caller\":null,\"per_engine_overrides\":null}","n_tokens":120,"upsert_skip_copy":true,"__internal":{"cot_search_result_score":6.999952077865601,"cot_search_result_score_cutoff":6.817807197570801}},"recipient":"all","channel":"analysis"},{"id":"cc12ed66-d9ef-4f04-8beb-f2e3cb4e18c8","author":{"role":"tool","name":"web.run","metadata":{"real_author":"tool:web.run"}},"create_time":null,"update_time":null,"content":{"content_type":"sonic_webpage","url":"https://system.data.sqlite.org/home/raw/d0618b63a6185128f8ec70a065cddd2544773f3f","domain":"system.data.sqlite.org","title":"Pragma statements supported by SQLite","text":"【turn0search20】 [wordlim: 200] Crawled: today; PRAGMA foreign_key_check; ... Any existing statements prepared using the legacy sqlite3_prepare() interface may fail with an SQLITE_SCHEMA error after the foreign_keys setting is changed.\n","snippet":"PRAGMA foreign_key_check; ... Any existing statements prepared using the legacy sqlite3_prepare() interface may fail with an SQLITE_SCHEMA error after the foreign_keys setting is changed.","pub_date":null,"crawl_date":null,"pub_timestamp":null,"crawl_timestamp":1792333356.0,"ref_id":"turn0search20"},"status":"finished_successfully","end_turn":null,"weight":1.0,"metadata":{"debug_sonic_thread_id":null,"search_engine":"system2-web","result_source":"labrador","ref_id":"turn0search20","minimal_str":"Pragma statements supported by SQLite (https://system.data.sqlite.org/home/raw/d0618b63a6185128f8ec70a065cddd2544773f3f)\n【turn0search20】 [wordlim: 200] Crawled: today; ","fetch_request":"{\"q\":\"site.sqlite.org foreignkeys pragma foreign_keys\",\"recency\":null,\"domains\":null,\"ignore_domains\":null,\"caller\":null,\"per_engine_overrides\":null}","n_tokens":102,"upsert_skip_copy":true,"__internal":{"cot_search_result_score":6.999948501586914,"cot_search_result_score_cutoff":6.817807197570801}},"recipient":"all","channel":"analysis"},{"id":"37ae695a-1139-4005-b67c-9f3d9d86df17","author":{"role":"tool","name":"web.run","metadata":{"real_author":"tool:web.run"}},"create_time":null,"update_time":null,"content":{"content_type":"sonic_webpage","url":"https://system.data.sqlite.org/home/doc/4deb290d232e5850/Doc/Extra/Core/lang_transaction.html","domain":"system.data.sqlite.org","title":"SQLite Query Language: BEGIN TRANSACTION","text":"【turn0search21】 [wordlim: 200] Crawled: yesterday; If the transaction is immediate, then RESERVED locks are acquired on all databases as soon as the BEGIN command is executed, without waiting for the database to be used. ... An attempt to execute COMMIT might also result in an SQLITE_BUSY return code if an another thread or process has a shared lock on the database that prevented the database from being updated. ... For all of these errors, SQLite attempts to undo just the one statement it was working on and leave changes from prior statements within the same transaction intact and continue with the transaction.\n","snippet":"If the transaction is immediate, then RESERVED locks are acquired on all databases as soon as the BEGIN command is executed, without waiting for the database to be used. ... An attempt to execute COMMIT might also result in an SQLITE_BUSY return code if an another thread or process has a shared lock on the database that prevented the database from being updated. ... For all of these errors, SQLite attempts to undo just the one statement it was working on and leave changes from prior statements within the same transaction intact and continue with the transaction.","pub_date":null,"crawl_date":null,"pub_timestamp":null,"crawl_timestamp":1792236521.0,"ref_id":"turn0search21"},"status":"finished_successfully","end_turn":null,"weight":1.0,"metadata":{"debug_sonic_thread_id":null,"search_engine":"system2-web","result_source":"labrador","ref_id":"turn0search21","minimal_str":"SQLite Query Language: BEGIN TRANSACTION (https://system.data.sqlite.org/home/doc/4deb290d232e5850/Doc/Extra/Core/lang_transaction.html)\n【turn0search21】 [wordlim: 200] Crawled: yesterday; ","fetch_request":"{\"q\":\"site.sqlite.org lang_transaction begin immediate sqlite_busy\",\"recency\":null,\"domains\":null,\"ignore_domains\":null,\"caller\":null,\"per_engine_overrides\":null}","n_tokens":168,"upsert_skip_copy":true,"__internal":{"cot_search_result_score":6.9999470710754395,"cot_search_result_score_cutoff":6.817807197570801}},"recipient":"all","channel":"analysis"},{"id":"7e3f9538-455e-4ddb-a860-5e3bd5e624de","author":{"role":"tool","name":"web.run","metadata":{"real_author":"tool:web.run"}},"create_time":null,"update_time":null,"content":{"content_type":"sonic_webpage","url":"https://www3.sqlite.org/matrix/lang_transaction.html","domain":"www3.sqlite.org","title":"Transaction","text":"【turn0search22】 [wordlim: 200] Crawled: 1.9 years ago; ] The BEGIN IMMEDIATE might fail with SQLITE_BUSY if another write transaction is already active on another database connection.\n","snippet":"] The BEGIN IMMEDIATE might fail with SQLITE_BUSY if another write transaction is already active on another database connection.","pub_date":null,"crawl_date":null,"pub_timestamp":null,"crawl_timestamp":1733606910.0,"ref_id":"turn0search22"},"status":"finished_successfully","end_turn":null,"weight":1.0,"metadata":{"debug_sonic_thread_id":null,"search_engine":"system2-web","result_source":"labrador","ref_id":"turn0search22","minimal_str":"Transaction (https://www3.sqlite.org/matrix/lang_transaction.html)\n【turn0search22】 [wordlim: 200] Crawled: 1.9 years ago; ","fetch_request":"{\"q\":\"site.sqlite.org lang_transaction begin immediate sqlite_busy\",\"recency\":null,\"domains\":null,\"ignore_domains\":null,\"caller\":null,\"per_engine_overrides\":null}","n_tokens":70,"upsert_skip_copy":true,"__internal":{"cot_search_result_score":6.999946355819702,"cot_search_result_score_cutoff":6.817807197570801}},"recipient":"all","channel":"analysis"},{"id":"48beffd5-8243-44f0-81bd-d5e29d9bf915","author":{"role":"tool","name":"web.run","metadata":{"real_author":"tool:web.run"}},"create_time":null,"update_time":null,"content":{"content_type":"sonic_webpage","url":"https://system.data.sqlite.org/home/doc/0a3d6229a7425242/Doc/Extra/Core/lang_altertable.html","domain":"system.data.sqlite.org","title":"SQLite Query Language: ALTER TABLE","text":"【turn0search23】 [wordlim: 200] Crawled: today; Prior to version 3.26.0 (2018-12-01), FOREIGN KEY references to a table that is renamed were only edited if the PRAGMA foreign_keys=ON, or in other words if foreign key constraints were begin enforced. ... > PRAGMA foreign_keys  | PRAGMA legacy_alter_table  | Parent Table references are updated  | SQLite version\n","snippet":"Prior to version 3.26.0 (2018-12-01), FOREIGN KEY references to a table that is renamed were only edited if the PRAGMA foreign_keys=ON, or in other words if foreign key constraints were begin enforced. ... > PRAGMA foreign_keys  | PRAGMA legacy_alter_table  | Parent Table references are updated  | SQLite version","pub_date":null,"crawl_date":null,"pub_timestamp":null,"crawl_timestamp":1792326451.0,"ref_id":"turn0search23"},"status":"finished_successfully","end_turn":null,"weight":1.0,"metadata":{"debug_sonic_thread_id":null,"search_engine":"system2-web","result_source":"labrador","ref_id":"turn0search23","minimal_str":"SQLite Query Language: ALTER TABLE (https://system.data.sqlite.org/home/doc/0a3d6229a7425242/Doc/Extra/Core/lang_altertable.html)\n【turn0search23】 [wordlim: 200] Crawled: today; ","fetch_request":"{\"q\":\"site.sqlite.org foreignkeys pragma foreign_keys\",\"recency\":null,\"domains\":null,\"ignore_domains\":null,\"caller\":null,\"per_engine_overrides\":null}","n_tokens":142,"upsert_skip_copy":true,"__internal":{"cot_search_result_score":6.999945640563965,"cot_search_result_score_cutoff":6.817807197570801}},"recipient":"all","channel":"analysis"},{"id":"48f8a694-cd4b-4210-a741-f3e2c6d85746","author":{"role":"tool","name":"web.run","metadata":{"real_author":"tool:web.run"}},"create_time":null,"update_time":null,"content":{"content_type":"sonic_webpage","url":"https://ajv.js.org/guide/modifying-data.html","domain":"ajv.js.org","title":"Modifying data during validation | Ajv JSON schema validator","text":"【turn0search24】 [wordlim: 200] Crawled: 5 months ago; Ajv has several options that allow to modify data during validation: ... This functionality is non-standard - this is likely to be unsupported in other JSON Schema validator implementations. ...     const validate = ajv.compile(schema) ... The strict mode option can change the behaviour for these unsupported defaults (`strict: false` to ignore them, `\"log\"` to log a warning).\n","snippet":"Ajv has several options that allow to modify data during validation: ... This functionality is non-standard - this is likely to be unsupported in other JSON Schema validator implementations. ...     const validate = ajv.compile(schema) ... The strict mode option can change the behaviour for these unsupported defaults (`strict: false` to ignore them, `\"log\"` to log a warning).","pub_date":null,"crawl_date":null,"pub_timestamp":null,"crawl_timestamp":1777016498.0,"ref_id":"turn0search24"},"status":"finished_successfully","end_turn":null,"weight":1.0,"metadata":{"debug_sonic_thread_id":null,"search_engine":"system2-web","result_source":"labrador","ref_id":"turn0search24","minimal_str":"Modifying data during validation | Ajv JSON schema validator (https://ajv.js.org/guide/modifying-data.html)\n【turn0search24】 [wordlim: 200] Crawled: 5 months ago; ","fetch_request":"{\"q\":\"site.ajv.js.org strict mode json schema validation\",\"recency\":null,\"domains\":null,\"ignore_domains\":null,\"caller\":null,\"per_engine_overrides\":null}","n_tokens":130,"upsert_skip_copy":true,"__internal":{"cot_search_result_score":6.999934196472168,"cot_search_result_score_cutoff":6.817807197570801}},"recipient":"all","channel":"analysis"},{"id":"0c70d0e6-85ad-4ce6-b46a-50b027ac4325","author":{"role":"tool","name":"web.run","metadata":{"real_author":"tool:web.run"}},"create_time":null,"update_time":null,"content":{"content_type":"sonic_webpage","url":"https://ajv.js.org/faq.html","domain":"ajv.js.org","title":"Frequently Asked Questions | Ajv JSON schema validator","text":"【turn0search25】 [wordlim: 200] Crawled: 5 months ago;     * Why the validation fails when I use option removeAdditional with the keyword anyOf/etc.? ... Ajv implements JSON schema specification. ... Strict types mode introduced in v7 requires presence of \"type\" when \"properties\" are used, so the mistakes are less likely.\n","snippet":"    * Why the validation fails when I use option removeAdditional with the keyword anyOf/etc.? ... Ajv implements JSON schema specification. ... Strict types mode introduced in v7 requires presence of \"type\" when \"properties\" are used, so the mistakes are less likely.","pub_date":null,"crawl_date":null,"pub_timestamp":null,"crawl_timestamp":1777016499.0,"ref_id":"turn0search25"},"status":"finished_successfully","end_turn":null,"weight":1.0,"metadata":{"debug_sonic_thread_id":null,"search_engine":"system2-web","result_source":"labrador","ref_id":"turn0search25","minimal_str":"Frequently Asked Questions | Ajv JSON schema validator (https://ajv.js.org/faq.html)\n【turn0search25】 [wordlim: 200] Crawled: 5 months ago; ","fetch_request":"{\"q\":\"site.ajv.js.org strict mode json schema validation\",\"recency\":null,\"domains\":null,\"ignore_domains\":null,\"caller\":null,\"per_engine_overrides\":null}","n_tokens":107,"upsert_skip_copy":true,"__internal":{"cot_search_result_score":6.999889850616455,"cot_search_result_score_cutoff":6.817807197570801}},"recipient":"all","channel":"analysis"},{"id":"a20c7d96-90ff-4053-9f9d-26a77e24801a","author":{"role":"tool","name":"web.run","metadata":{"real_author":"tool:web.run"}},"create_time":null,"update_time":null,"content":{"content_type":"sonic_webpage","url":"https://sqlite.org/forum/forumpost/ac1418dacc","domain":"sqlite.org","title":"SQLite User Forum: Clarification on when I will get SQLITE_BUSY from beginning write transaction","text":"【turn0search26】 [wordlim: 200] Published: 1.5 years ago; Crawled: 3 days ago; Clarification on when I will get SQLITE_BUSY from beginning write transaction ... When these threads try to simultaneously start write transactions with \"BEGIN IMMEDIATE;\", will these attempts to start transactions return SQLITE_BUSY?\n","snippet":"Clarification on when I will get SQLITE_BUSY from beginning write transaction ... When these threads try to simultaneously start write transactions with \"BEGIN IMMEDIATE;\", will these attempts to start transactions return SQLITE_BUSY?","pub_date":null,"crawl_date":null,"pub_timestamp":1743811200.0,"crawl_timestamp":1792098058.0,"ref_id":"turn0search26"},"status":"finished_successfully","end_turn":null,"weight":1.0,"metadata":{"debug_sonic_thread_id":null,"search_engine":"system2-web","result_source":"labrador","ref_id":"turn0search26","minimal_str":"SQLite User Forum: Clarification on when I will get SQLITE_BUSY from beginning write transaction (https://sqlite.org/forum/forumpost/ac1418dacc)\n【turn0search26】 [wordlim: 200] Published: 1.5 years ago; Crawled: 3 days ago; ","fetch_request":"{\"q\":\"site.sqlite.org lang_transaction begin immediate sqlite_busy\",\"recency\":null,\"domains\":null,\"ignore_domains\":null,\"caller\":null,\"per_engine_overrides\":null}","n_tokens":113,"upsert_skip_copy":true,"__internal":{"cot_search_result_score":6.999801158905029,"cot_search_result_score_cutoff":6.817807197570801}},"recipient":"all","channel":"analysis"},{"id":"2823e415-9280-4bac-9b19-f3f1ddc3d48a","author":{"role":"tool","name":"web.run","metadata":{"real_author":"tool:web.run"}},"create_time":null,"update_time":null,"content":{"content_type":"sonic_webpage","url":"https://www.sqlite.org/rescode.html","domain":"www.sqlite.org","title":"Result and Error Codes","text":"【turn0search27】 [wordlim: 200] Crawled: 2 days ago; To avoid encountering SQLITE_BUSY errors in the middle of a transaction, the application can use BEGIN IMMEDIATE instead of just BEGIN to start a transaction.\n","snippet":"To avoid encountering SQLITE_BUSY errors in the middle of a transaction, the application can use BEGIN IMMEDIATE instead of just BEGIN to start a transaction.","pub_date":null,"crawl_date":null,"pub_timestamp":null,"crawl_timestamp":1792172716.0,"ref_id":"turn0search27"},"status":"finished_successfully","end_turn":null,"weight":1.0,"metadata":{"debug_sonic_thread_id":null,"search_engine":"system2-web","result_source":"labrador","ref_id":"turn0search27","minimal_str":"Result and Error Codes (https://www.sqlite.org/rescode.html)\n【turn0search27】 [wordlim: 200] Crawled: 2 days ago; ","fetch_request":"{\"q\":\"site.sqlite.org lang_transaction begin immediate sqlite_busy\",\"recency\":null,\"domains\":null,\"ignore_domains\":null,\"caller\":null,\"per_engine_overrides\":null}","n_tokens":75,"upsert_skip_copy":true,"__internal":{"cot_search_result_score":6.999786853790283,"cot_search_result_score_cutoff":6.817807197570801}},"recipient":"all","channel":"analysis"},{"id":"ab8c0bd9-b121-4830-bebb-c6566e174a34","author":{"role":"tool","name":"web.run","metadata":{"real_author":"tool:web.run"}},"create_time":null,"update_time":null,"content":{"content_type":"sonic_webpage","url":"https://github.com/WiseLibs/better-sqlite3/blob/master/README.md","domain":"github.com","title":"better-sqlite3/README.md at master · WiseLibs/better-sqlite3 · GitHub","text":"【turn0search28】 [wordlim: 200] Crawled: today; # better-sqlite3 ...   * Full transaction support ... better-sqlite3  | 1x  | 1x  | 1x  | 1x  | 1x\n","snippet":"# better-sqlite3 ...   * Full transaction support ... better-sqlite3  | 1x  | 1x  | 1x  | 1x  | 1x","pub_date":null,"crawl_date":null,"pub_timestamp":null,"crawl_timestamp":1792392459.0,"ref_id":"turn0search28"},"status":"finished_successfully","end_turn":null,"weight":1.0,"metadata":{"debug_sonic_thread_id":null,"search_engine":"system2-web","result_source":"labrador","ref_id":"turn0search28","minimal_str":"better-sqlite3/README.md at master · WiseLibs/better-sqlite3 · GitHub (https://github.com/WiseLibs/better-sqlite3/blob/master/README.md)\n【turn0search28】 [wordlim: 200] Crawled: today; ","fetch_request":"{\"q\":\"site.github.com/wiselibs/better-sqlite3 transaction\",\"recency\":null,\"domains\":null,\"ignore_domains\":null,\"caller\":null,\"per_engine_overrides\":null}","n_tokens":117,"upsert_skip_copy":true,"__internal":{"cot_search_result_score":6.999678134918213,"cot_search_result_score_cutoff":6.817807197570801}},"recipient":"all","channel":"analysis"},{"id":"7fc6ec5c-6097-4e57-8a53-8e3c7dc2b135","author":{"role":"tool","name":"web.run","metadata":{"real_author":"tool:web.run"}},"create_time":null,"update_time":null,"content":{"content_type":"sonic_webpage","url":"https://github.com/WiseLibs/better-sqlite3/issues/190","domain":"github.com","title":"db.transaction() not working? · Issue #190 · WiseLibs/better-sqlite3 · GitHub","text":"【turn0search29】 [wordlim: 200] Published: 8.0 years ago; Crawled: last week; WiseLibs  2. better-sqlite3 ... # db.transaction() not working?\n","snippet":"WiseLibs  2. better-sqlite3 ... # db.transaction() not working?","pub_date":null,"crawl_date":null,"pub_timestamp":1539907200.0,"crawl_timestamp":1791790232.0,"ref_id":"turn0search29"},"status":"finished_successfully","end_turn":null,"weight":1.0,"metadata":{"debug_sonic_thread_id":null,"search_engine":"system2-web","result_source":"labrador","ref_id":"turn0search29","minimal_str":"db.transaction() not working? · Issue #190 · WiseLibs/better-sqlite3 · GitHub (https://github.com/WiseLibs/better-sqlite3/issues/190)\n【turn0search29】 [wordlim: 200] Published: 8.0 years ago; Crawled: last week; ","fetch_request":"{\"q\":\"site.github.com/wiselibs/better-sqlite3 transaction\",\"recency\":null,\"domains\":null,\"ignore_domains\":null,\"caller\":null,\"per_engine_overrides\":null}","n_tokens":101,"upsert_skip_copy":true,"__internal":{"cot_search_result_score":6.999618053436279,"cot_search_result_score_cutoff":6.817807197570801}},"recipient":"all","channel":"analysis"},{"id":"90677f49-ee21-4b30-a498-4930346ff1f8","author":{"role":"tool","name":"web.run","metadata":{"real_author":"tool:web.run"}},"create_time":null,"update_time":null,"content":{"content_type":"sonic_webpage","url":"https://www3.sqlite.org/matrix/matrix_dlang_transaction.html","domain":"www3.sqlite.org","title":"SQLite Requirement Matrix: lang_transaction.html","text":"【turn0search30】 [wordlim: 200] Crawled: 1.9 years ago; EXCLUSIVE is similar to IMMEDIATE in that a write transaction is started immediately. ... An attempt to execute COMMIT might also result in an SQLITE_BUSY return code if an another thread or process has an open read connection.\n","snippet":"EXCLUSIVE is similar to IMMEDIATE in that a write transaction is started immediately. ... An attempt to execute COMMIT might also result in an SQLITE_BUSY return code if an another thread or process has an open read connection.","pub_date":null,"crawl_date":null,"pub_timestamp":null,"crawl_timestamp":1733606910.0,"ref_id":"turn0search30"},"status":"finished_successfully","end_turn":null,"weight":1.0,"metadata":{"debug_sonic_thread_id":null,"search_engine":"system2-web","result_source":"labrador","ref_id":"turn0search30","minimal_str":"SQLite Requirement Matrix: lang_transaction.html (https://www3.sqlite.org/matrix/matrix_dlang_transaction.html)\n【turn0search30】 [wordlim: 200] Crawled: 1.9 years ago; ","fetch_request":"{\"q\":\"site.sqlite.org lang_transaction begin immediate sqlite_busy\",\"recency\":null,\"domains\":null,\"ignore_domains\":null,\"caller\":null,\"per_engine_overrides\":null}","n_tokens":101,"upsert_skip_copy":true,"__internal":{"cot_search_result_score":6.999594449996948,"cot_search_result_score_cutoff":6.817807197570801}},"recipient":"all","channel":"analysis"},{"id":"c98277b1-3660-42b8-94a4-36230a68b165","author":{"role":"tool","name":"web.run","metadata":{"real_author":"tool:web.run"}},"create_time":null,"update_time":null,"content":{"content_type":"sonic_webpage","url":"https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md","domain":"github.com","title":"better-sqlite3/docs/api.md at master · WiseLibs/better-sqlite3 · GitHub","text":"【turn0search31】 [wordlim: 200] Crawled: 2 weeks ago;   * Database#transaction() ... If you get an error that looks like this, you can solve it by using this option to provide the file path of `better_sqlite3.node` (relative to the current working directory).\n","snippet":"  * Database#transaction() ... If you get an error that looks like this, you can solve it by using this option to provide the file path of `better_sqlite3.node` (relative to the current working directory).","pub_date":null,"crawl_date":null,"pub_timestamp":null,"crawl_timestamp":1790837078.0,"ref_id":"turn0search31"},"status":"finished_successfully","end_turn":null,"weight":1.0,"metadata":{"debug_sonic_thread_id":null,"search_engine":"system2-web","result_source":"labrador","ref_id":"turn0search31","minimal_str":"better-sqlite3/docs/api.md at master · WiseLibs/better-sqlite3 · GitHub (https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)\n【turn0search31】 [wordlim: 200] Crawled: 2 weeks ago; ","fetch_request":"{\"q\":\"site.github.com/wiselibs/better-sqlite3 transaction\",\"recency\":null,\"domains\":null,\"ignore_domains\":null,\"caller\":null,\"per_engine_overrides\":null}","n_tokens":122,"upsert_skip_copy":true,"__internal":{"cot_search_result_score":6.999537944793701,"cot_search_result_score_cutoff":6.817807197570801}},"recipient":"all","channel":"analysis"},{"id":"2a4a1031-bde8-4373-a6e3-f700e90b3521","author":{"role":"tool","name":"web.run","metadata":{"real_author":"tool:web.run"}},"create_time":null,"update_time":null,"content":{"content_type":"sonic_webpage","url":"https://sqlite.org/forum/forumpost/04ed1d235b","domain":"sqlite.org","title":"SQLite User Forum: Help understanding the effect of BEGIN IMMEDIATE","text":"【turn0search32】 [wordlim: 200] Crawled: today; > This is why you should start your transactions with BEGIN IMMEDIATE instead of only BEGIN. ... I've been trying and failing to write Python code that can trigger a \"database is locked\" / SQLITE_BUSY error which stops being an error when I switch to a BEGIN IMMEDIATELY transaction.\n","snippet":"> This is why you should start your transactions with BEGIN IMMEDIATE instead of only BEGIN. ... I've been trying and failing to write Python code that can trigger a \"database is locked\" / SQLITE_BUSY error which stops being an error when I switch to a BEGIN IMMEDIATELY transaction.","pub_date":null,"crawl_date":null,"pub_timestamp":null,"crawl_timestamp":1792348843.0,"ref_id":"turn0search32"},"status":"finished_successfully","end_turn":null,"weight":1.0,"metadata":{"debug_sonic_thread_id":null,"search_engine":"system2-web","result_source":"labrador","ref_id":"turn0search32","minimal_str":"SQLite User Forum: Help understanding the effect of BEGIN IMMEDIATE (https://sqlite.org/forum/forumpost/04ed1d235b)\n【turn0search32】 [wordlim: 200] Crawled: today; ","fetch_request":"{\"q\":\"site.sqlite.org lang_transaction begin immediate sqlite_busy\",\"recency\":null,\"domains\":null,\"ignore_domains\":null,\"caller\":null,\"per_engine_overrides\":null}","n_tokens":118,"upsert_skip_copy":true,"__internal":{"cot_search_result_score":6.999419927597046,"cot_search_result_score_cutoff":6.817807197570801}},"recipient":"all","channel":"analysis"},{"id":"0451361c-3e2d-4360-9b57-5382a1496aef","author":{"role":"tool","name":"web.run","metadata":{"real_author":"tool:web.run"}},"create_time":null,"update_time":null,"content":{"content_type":"sonic_webpage","url":"https://sqlite.org/forum/info/3932875f018d4eb60b0441a5d6fd60cefc31b569328282deed041488a7c33594?t=c","domain":"sqlite.org","title":"SQLite User Forum: Simultaneous read and write transactions: when they can commit?","text":"【turn0search33】 [wordlim: 200] Published: 4.1 years ago; Crawled: 4 weeks ago; When `BEGIN IMMEDIATE` is issued, the database connection attempts to create a RESERVED lock on the database? ... Also, I am trying to wrap my head around this passage from (https://www.sqlite.org/lang_transaction.html). ... write operations, the COMMIT command will fail with an error code SQLITE_BUSY.\"\n","snippet":"When `BEGIN IMMEDIATE` is issued, the database connection attempts to create a RESERVED lock on the database? ... Also, I am trying to wrap my head around this passage from (https://www.sqlite.org/lang_transaction.html). ... write operations, the COMMIT command will fail with an error code SQLITE_BUSY.\"","pub_date":null,"crawl_date":null,"pub_timestamp":1662249600.0,"crawl_timestamp":1789896090.0,"ref_id":"turn0search33"},"status":"finished_successfully","end_turn":null,"weight":1.0,"metadata":{"debug_sonic_thread_id":null,"search_engine":"system2-web","result_source":"labrador","ref_id":"turn0search33","minimal_str":"SQLite User Forum: Simultaneous read and write transactions: when they can commit? (https://sqlite.org/forum/info/3932875f018d4eb60b0441a5d6fd60cefc31b569328282deed041488a7c33594?t=c)\n【turn0search33】 [wordlim: 200] Published: 4.1 years ago; Crawled: 4 weeks ago; ","fetch_request":"{\"q\":\"site.sqlite.org lang_transaction begin immediate sqlite_busy\",\"recency\":null,\"domains\":null,\"ignore_domains\":null,\"caller\":null,\"per_engine_overrides\":null}","n_tokens":166,"upsert_skip_copy":true,"__internal":{"cot_search_result_score":6.999378442764282,"cot_search_result_score_cutoff":6.817807197570801}},"recipient":"all","channel":"analysis"},{"id":"4b057bf3-8a42-4ef2-9748-6dd0609fa3f8","author":{"role":"tool","name":"web.run","metadata":{"real_author":"tool:web.run"}},"create_time":null,"update_time":null,"content":{"content_type":"sonic_webpage","url":"https://system.data.sqlite.org/home/raw/419906d4a0043afe2290c2be186556295c25c724","domain":"system.data.sqlite.org","title":"TRANSACTIONS","text":"【turn0search34】 [wordlim: 200] Crawled: today; If the transaction is immediate, then RESERVED locks are acquired on all databases as soon as the BEGIN command is executed, without waiting for the database to be used. ... The default behavior for SQLite version 3.0.8 is a deferred transaction. ... An attempt to execute COMMIT might result in an SQLITE_BUSY return code.\n","snippet":"If the transaction is immediate, then RESERVED locks are acquired on all databases as soon as the BEGIN command is executed, without waiting for the database to be used. ... The default behavior for SQLite version 3.0.8 is a deferred transaction. ... An attempt to execute COMMIT might result in an SQLITE_BUSY return code.","pub_date":null,"crawl_date":null,"pub_timestamp":null,"crawl_timestamp":1792322756.0,"ref_id":"turn0search34"},"status":"finished_successfully","end_turn":null,"weight":1.0,"metadata":{"debug_sonic_thread_id":null,"search_engine":"system2-web","result_source":"labrador","ref_id":"turn0search34","minimal_str":"TRANSACTIONS (https://system.data.sqlite.org/home/raw/419906d4a0043afe2290c2be186556295c25c724)\n【turn0search34】 [wordlim: 200] Crawled: today; ","fetch_request":"{\"q\":\"site.sqlite.org lang_transaction begin immediate sqlite_busy\",\"recency\":null,\"domains\":null,\"ignore_domains\":null,\"caller\":null,\"per_engine_overrides\":null}","n_tokens":129,"upsert_skip_copy":true,"__internal":{"cot_search_result_score":6.999310493469238,"cot_search_result_score_cutoff":6.817807197570801}},"recipient":"all","channel":"analysis"}],"error":null,"_codex_apps":{"resource_uri":"/connector_openai_search_service/implicit_link::connector_openai_search_service/web_run"}}}
> ```
>
> </details>
</details>

**1. Final architecture and responsibilities**

Your decisions are feasible and supersede Task 01’s tentative in-memory storage assumption. The design will use persistent SQLite storage and local side effects.

The reinspection confirms the existing scaffold remains unchanged:

- Backend: NestJS, ESM/NodeNext, strict TypeScript, Vitest, Supertest.
- Frontend: React, Vite, Tailwind; no routing, API client, or testing library.
- Runtime currently available: Node `22.15.1`.
- Nest Observe still contains placeholder credentials.
- No workflow implementation or repository `AGENTS.md` was found.

Keep the two existing packages. No monorepo migration is needed.

| Module | Responsibility | Dependencies |
|---|---|---|
| `DatabaseModule` | SQLite connection, migrations, transaction helper, shutdown | SQLite driver |
| `IdentityModule` | Development actor directory, identity guard, actor context | Environment configuration |
| `WorkflowModule` | Configuration validation, immutable definitions, pure transition evaluation | Database for definition registration |
| `ClaimsModule` | Claim access, creation, queries, transition orchestration, persistence | Database, Identity, Workflow |
| `AppModule` | Compose modules; retain a simple health endpoint | Modules above |

Within `ClaimsModule`, use small repositories for claims, audit records, notifications, and receipts. They share the same transaction connection; they do not start independent transactions.

Dependency direction:

```text
HTTP controllers → application services → workflow evaluator
                              ↓
                      SQLite repositories

React → API client → HTTP API
```

The workflow evaluator receives a definition, claim snapshot, actor, and validated input. It returns either a domain rejection or a proposed mutation/effect plan. It does not perform SQL or HTTP operations.

Controllers handle transport concerns. React renders server-provided actions and errors. Neither owns workflow rules.

**Final domain decisions**

- States: `draft`, `submitted`, `under_review`, `awaiting_information`, `approved`, `rejected`.
- Claimants create claims and access only their own claims.
- Adjusters access all demo claims and perform review decisions.
- Approval and rejection are terminal.
- Information responses return to `under_review`.
- After three requests, approval and rejection remain available.
- No assignment, escalation, reopening, attachments, or production authentication in this challenge.

These resolve the remaining business defaults from Task 01.

**2. Proposed folder structure**

```text
backend/
  config/
    claims.v1.json
    workflow.schema.json
  src/
    main.ts
    app.module.ts
    app.controller.ts
    database/
      database.module.ts
      database.service.ts
      migrations/
    identity/
      identity.module.ts
      actor.ts
      demo-actors.ts
      identity.guard.ts
      identity.controller.ts
    workflow/
      workflow.module.ts
      workflow.types.ts
      workflow-config.service.ts
      workflow-config.validator.ts
      workflow-engine.ts
      conditions.ts
      effects.ts
    claims/
      claims.module.ts
      claims.controller.ts
      claims.service.ts
      transition.service.ts
      claims.repository.ts
      audit.repository.ts
      notifications.repository.ts
      receipts.repository.ts
      request-schemas.ts
    common/
      api-error.ts
      api-exception.filter.ts
  test/
    fixtures/
    scenarios/
    *.e2e-spec.ts
  data/                        # ignored SQLite files

frontend/
  src/
    api/
      client.ts
      contracts.ts
    components/
      ActorSelector.tsx
      ClaimList.tsx
      ClaimDetails.tsx
      TransitionForm.tsx
      AuditHistory.tsx
    hooks/
      useClaims.ts
      useClaim.ts
    App.tsx
    index.css

docs/
  architecture.md
  api.md
  scenarios.md
README.md
```

Unit tests remain colocated as `*.spec.ts`, matching the existing Vitest configuration. Backend imports retain the existing `.js` suffix convention.

**3. Workflow configuration and validation**

A representative complete configuration:

```json
{
  "schemaVersion": 1,
  "workflowId": "claims",
  "version": 1,
  "initialState": "draft",
  "limits": {
    "informationRequests": 3
  },
  "states": [
    { "id": "draft", "label": "Draft", "terminal": false },
    { "id": "submitted", "label": "Submitted", "terminal": false },
    { "id": "under_review", "label": "Under review", "terminal": false },
    {
      "id": "awaiting_information",
      "label": "Awaiting information",
      "terminal": false
    },
    { "id": "approved", "label": "Approved", "terminal": true },
    { "id": "rejected", "label": "Rejected", "terminal": true }
  ],
  "transitions": [
    {
      "id": "submit",
      "label": "Submit claim",
      "from": "draft",
      "to": "submitted",
      "roles": ["claimant"],
      "inputFields": [],
      "preconditions": [
        { "type": "claimFieldsPresent", "fields": ["title", "description"] }
      ],
      "sideEffects": []
    },
    {
      "id": "start_review",
      "label": "Start review",
      "from": "submitted",
      "to": "under_review",
      "roles": ["adjuster"],
      "inputFields": [],
      "preconditions": [],
      "sideEffects": []
    },
    {
      "id": "request_information",
      "label": "Request information",
      "from": "under_review",
      "to": "awaiting_information",
      "roles": ["adjuster"],
      "kind": "information_request",
      "inputFields": [
        { "name": "message", "label": "Information requested", "required": true }
      ],
      "preconditions": [],
      "sideEffects": [
        {
          "type": "createNotification",
          "recipient": "claimant",
          "template": "information_requested"
        }
      ]
    },
    {
      "id": "provide_information",
      "label": "Provide information",
      "from": "awaiting_information",
      "to": "under_review",
      "roles": ["claimant"],
      "inputFields": [
        { "name": "response", "label": "Response", "required": true }
      ],
      "preconditions": [],
      "sideEffects": []
    },
    {
      "id": "approve",
      "label": "Approve",
      "from": "under_review",
      "to": "approved",
      "roles": ["adjuster"],
      "inputFields": [],
      "preconditions": [],
      "sideEffects": [
        {
          "type": "createNotification",
          "recipient": "claimant",
          "template": "claim_approved"
        }
      ]
    },
    {
      "id": "reject",
      "label": "Reject",
      "from": "under_review",
      "to": "rejected",
      "roles": ["adjuster"],
      "inputFields": [
        { "name": "reason", "label": "Rejection reason", "required": true }
      ],
      "preconditions": [],
      "sideEffects": [
        {
          "type": "createNotification",
          "recipient": "claimant",
          "template": "claim_rejected"
        }
      ]
    }
  ]
}
```

The JSON Schema contract will use Draft 7:

| Field | Constraint |
|---|---|
| Root | Required fields shown above; additional properties rejected |
| IDs | Lowercase identifier pattern; bounded length |
| `schemaVersion` | Exactly `1` |
| `version` | Positive integer |
| `informationRequests` | Integer from `1` to `3`; current definition uses `3` |
| States | Nonempty array; required ID, label, terminal flag |
| Transitions | Unique ID; one source and target; nonempty allowed-role array |
| Roles | Only `claimant` and `adjuster` |
| `kind` | Optional; only `information_request` initially |
| Input fields | Unique names; string values; bounded labels and values |
| Preconditions | Discriminated allowlist of supported condition shapes |
| Side effects | Discriminated allowlist of supported effect shapes |

Semantic validation follows structural validation:

- State and transition IDs must be unique.
- Initial/source/target states must exist.
- Initial state must not be terminal.
- Terminal states have no outgoing transitions.
- All states must be reachable from the initial state.
- Condition fields, effect templates, and recipients must be supported.
- Duplicate roles/input names are rejected.
- All preconditions use AND semantics.
- Every `information_request` transition uses the shared lifetime counter.
- The engine increments that counter; effects cannot modify it.
- No expressions, arbitrary URLs, imports, or executable code are accepted.

Use Ajv in strict mode, without coercion, default insertion, or property removal. Ajv documents strict schema checking and optional data-mutating behavior separately. [Ajv strict mode](https://ajv.js.org/strict-mode.html), [validation options](https://ajv.js.org/options).

Adding a state and transitions that compose existing handlers requires only configuration. A new condition or effect capability requires a handler, but no engine change.

**Version preservation**

Persist each validated definition and its canonical JSON hash:

- Identical workflow ID/version/hash: reuse.
- Same workflow ID/version with different content: fail startup.
- New version: register it and use it for new claims.
- Existing claims continue using their persisted definition.
- Validate historical persisted definitions at startup too; fail if the application no longer supports a required handler.

No runtime editing or automatic migration of existing claims.

**4. SQLite model and transaction strategy**

Use explicit SQL migrations and prepared statements, without an ORM.

| Table | Main columns and constraints |
|---|---|
| `schema_migrations` | `version` primary key, `applied_at` |
| `workflow_versions` | Composite primary key `(workflow_id, version)`; canonical JSON, SHA-256 hash, creation timestamp |
| `claims` | UUID primary key; owner ID; workflow ID/version foreign key; state; title; description; `information_request_count CHECK 0..3`; `revision CHECK >=0`; timestamps |
| `audit_events` | Integer sequence primary key; unique event UUID; claim FK; actor ID and role snapshot; action; before/after state and revision; workflow reference; sanitized action data; timestamp |
| `rejected_transition_attempts` | Integer sequence primary key; claim FK; actor ID; transition ID; command ID; stable rejection code; observed revision; timestamp |
| `notifications` | UUID primary key; claim FK; success event FK; effect position; recipient ID; template; bounded rendered content; timestamp |
| `command_receipts` | Actor ID, command ID, operation fingerprint, resource ID, response status/JSON, timestamp; composite primary key `(actor_id, command_id)` |

Owner/actor IDs reference the backend-owned demo directory logically. A user-management database is unnecessary; IDs must remain stable and must never be reassigned.

Claims hold current state. Required messages, responses, and decision reasons are preserved in validated success-event action data. Audit records exclude the complete request and claim snapshot.

Required indexes:

- `claims(owner_id, created_at, id)` for claimant lists.
- `claims(created_at, id)` for adjuster lists.
- `audit_events(claim_id, sequence)` for ordered history.
- Unique success-event index on `(claim_id, to_revision)`.
- `rejected_transition_attempts(claim_id, sequence)`.
- `notifications(claim_id, created_at, id)`.
- Unique `(success_event_id, effect_position)` for notification identity.
- `command_receipts(resource_id)` for resource lookup.
- Index on the claims workflow foreign-key columns.

State membership is validated against the pinned definition by the application. The database independently protects the absolute three-request ceiling.

Enable foreign keys on every connection; SQLite requires explicitly enabling enforcement rather than assuming it. [SQLite foreign keys](https://www.sqlite.org/foreignkeys.html).

Use a file-backed database, WAL mode, `synchronous=FULL`, and a bounded busy timeout. Keep transactions synchronous and short; no network calls or `await` inside them.

**Successful transition transaction**

1. Validate transport input, resolve identity, and check resource access.
2. Start an immediate transaction.
3. Recheck access and look up the command receipt.
4. Return an existing matching receipt before checking the current revision.
5. Load the claim and its pinned definition.
6. Check expected revision, source state, role, preconditions, and cycle limit.
7. Prepare the mutation and local effects.
8. Update the claim using `WHERE id = ? AND revision = ?`.
9. Require exactly one updated row; increment revision once.
10. Insert the success audit event, notifications, and exact response receipt.
11. Commit, then return the response.

An information request increments the counter in the conditional update. Other transitions preserve it.

`BEGIN IMMEDIATE` reserves the write transaction early; SQLite can still return `SQLITE_BUSY`, which must be handled. [SQLite transaction behavior](https://www.sqlite.org/lang_transaction.html).

**Concurrency and deduplication**

- Clients send `expectedRevision`.
- Every successful transition increments revision by one.
- Two distinct commands with the same revision cannot both succeed.
- Command fingerprints include operation, claim, transition, expected revision, and canonical input.
- Same actor/key/fingerprint: return the original committed status/body.
- Same actor/key, different fingerprint: `409 COMMAND_ID_REUSED`.
- Replays still require current resource access.
- Receipts survive restart and are retained for this challenge.
- Failed commands do not receive success receipts.
- Claim creation also requires a command ID and atomically creates the claim, creation audit event, and receipt.

**Failure semantics**

- Success audit, notification, or receipt insertion failure rolls back everything.
- Failed commit produces no success response.
- A lost response is recovered by replaying the same command.
- Known domain rejection: roll back, then insert a separate rejection record.
- Record rejection only after a valid actor and authorized claim access are established.
- Rejection-record failure preserves the original rejection response and emits a sanitized operational error; it never permits mutation.
- Exhausted lock timeout returns `503 STORAGE_BUSY`, with no partial result.

**5. API contract and error model**

All endpoints use `/api`. Claim endpoints require resolved identity.

| Method/path | Contract |
|---|---|
| `GET /health` | Minimal health response |
| `GET /api/demo/actors` | Development-only allowlisted actor IDs/names/roles |
| `GET /api/me` | Resolved actor |
| `POST /api/claims` | Claimant creates a draft |
| `GET /api/claims` | Accessible claims, newest first |
| `GET /api/claims/:id` | Claim details |
| `GET /api/claims/:id/transitions` | Permitted action descriptors for the current revision |
| `POST /api/claims/:id/transitions/:transitionId` | Execute a command |
| `GET /api/claims/:id/audit` | Ordered successful actions/state changes |

Rejected attempts remain separate operational records; they are not mixed into the success timeline.

Creation request:

```json
{
  "commandId": "UUID",
  "title": "Damaged laptop",
  "description": "Screen damaged during transport."
}
```

Transition request:

```json
{
  "commandId": "UUID",
  "expectedRevision": 2,
  "input": {
    "message": "Please provide the purchase date."
  }
}
```

No actor, role, state, cycle count, workflow version, or owner overrides are accepted.

Claim response:

```json
{
  "id": "UUID",
  "ownerId": "claimant-1",
  "workflow": { "id": "claims", "version": 1 },
  "state": "awaiting_information",
  "title": "Damaged laptop",
  "description": "Screen damaged during transport.",
  "informationRequestCount": 1,
  "informationRequestLimit": 3,
  "revision": 3,
  "createdAt": "UTC timestamp",
  "updatedAt": "UTC timestamp"
}
```

Transition success is `200`:

```json
{
  "claim": {},
  "auditEventId": "UUID",
  "notificationIds": ["UUID"]
}
```

Here, `claim` contains the complete claim shape above. Creation uses `201` and returns the claim and creation audit ID.

Action discovery returns:

```json
{
  "claimId": "UUID",
  "revision": 2,
  "actions": [
    {
      "id": "request_information",
      "label": "Request information",
      "inputFields": [
        {
          "name": "message",
          "label": "Information requested",
          "required": true,
          "maxLength": 2000
        }
      ]
    }
  ]
}
```

Discovery filters by state, access, role, cycle limit, and conditions evaluable without new input. Execution always rechecks. After count three, request-information actions disappear, but direct execution still returns the domain rejection.

Errors use one envelope:

```json
{
  "error": {
    "code": "REVISION_CONFLICT",
    "message": "The claim changed. Refresh and retry.",
    "requestId": "UUID",
    "details": {
      "expectedRevision": 2,
      "currentRevision": 3
    }
  }
}
```

| HTTP | Stable codes |
|---|---|
| `400` | `INVALID_REQUEST` |
| `401` | `IDENTITY_REQUIRED`, `UNKNOWN_ACTOR` |
| `403` | `TRANSITION_FORBIDDEN`, `CLAIM_CREATION_FORBIDDEN` |
| `404` | `CLAIM_NOT_FOUND`, `TRANSITION_NOT_FOUND` |
| `409` | `REVISION_CONFLICT`, `STATE_CONFLICT`, `COMMAND_ID_REUSED` |
| `422` | `PRECONDITION_FAILED`, `CYCLE_LIMIT_REACHED` |
| `503` | `STORAGE_BUSY` |
| `500` | `INTERNAL_ERROR` |

Inaccessible claims return `404`, including audit/action endpoints. Error details must not disclose hidden claim information.

List endpoints accept bounded `limit`/`offset`; defaults are 50 and 0, with maximum limit 100. Audit ordering uses sequence numbers, not timestamp uniqueness.

**6. Security and operational decisions**

Development identity requires **both**:

- `NODE_ENV=development`
- `DEMO_IDENTITY_ENABLED=true`

The `X-Demo-Actor-Id` header selects an ID from a fixed backend allowlist. It grants no ability to supply roles or ownership.

Additional rules:

- Demo routes and the frontend selector are enabled only in development.
- Backend enforcement is authoritative; hiding the selector is insufficient.
- Enabling demo identity outside development causes startup failure.
- Production mode without a production identity adapter also fails closed with an explicit configuration error.
- Tests inject a fixed actor resolver; no test identity bypass is exposed through HTTP.
- Development API binds to loopback by default.
- Vite proxies `/api` to Nest; no permissive CORS configuration is necessary.
- Actor changes clear frontend claim/action caches.
- Prepared SQL parameters, payload limits, string bounds, and rejected unknown properties protect inputs.
- Notifications are local records only; templates are backend-owned.
- Audit/receipt data has no public edit/delete endpoint.
- Database files and backups contain sensitive data and stay outside version control.
- Audit history is application-level append-only, not tamper-proof against database administrators.
- Nest Observe is disabled unless deliberately configured; business audit does not depend on telemetry.

**7. Requirement-to-module-to-test traceability**

All tests below are planned.

| Requirement | Owner | Planned meaningful tests |
|---|---|---|
| JSON configuration | Workflow | T01 valid definition accepted; T02 malformed schema rejected; T03 dangling references/unknown handlers rejected |
| Preconditions | Workflow | T04 missing claim data rejected; T05 one failed condition blocks an AND group |
| Side effects | Workflow + Claims repositories | T06 notification created; T07 notification failure rolls back claim/audit/receipt |
| RBAC | Identity + Claims | T08 permitted role succeeds; T09 forbidden role rejected; T10 cross-owner access hidden |
| Audit trail | Claims repositories | T11 complete success event; T12 audit-write failure rolls back; T13 safe rejection stored separately |
| Three-cycle limit | Workflow + Database | T14 requests one–three succeed; T15 fourth rejected; T16 response/failure does not increment |
| Config-only extensibility | Workflow | T17 new state/transition executes without engine edits; T18 alternate request transition shares counter |
| Persistent integrity | Database | T19 restart preserves claims/audit/receipts; T20 competing commands yield one success |
| Command deduplication | Transition service | T21 replay returns original response; T22 changed payload with same key conflicts |
| Immutable versions | Workflow + Database | T23 old claim retains old definition; T24 version-content mismatch fails startup |
| Development identity isolation | Identity/bootstrap | T25 unknown actor rejected; T26 production/demo combination rejected; T27 payload role spoof rejected |
| At least 15 tests | Backend test suites | Implement the above with independent assertions and failure fixtures |
| Five scenarios | E2E/scenario fixtures | T28 approval; T29 rejection; T30 information round trip; T31 exhaustion; T32 unauthorized approval |
| Documentation | README + docs | Clean setup walkthrough, documented commands, deterministic fixture/reset verification |

The concurrency test must use two database connections or competing requests with the same revision; two sequential happy paths would not verify concurrency protection.

Each scenario will include seeded identities, starting data, exact API steps, expected state/counter/audit results, and a local reset procedure.

**8. Minimal dependency changes**

Backend additions:

- `better-sqlite3`: direct SQLite access and synchronous transaction handling.
- `ajv`: workflow and request schema validation.
- Development types: `@types/better-sqlite3`, unless the selected driver release includes suitable declarations.

The driver’s documented transaction API fits the short synchronous transaction boundary. [better-sqlite3 API](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md).

No frontend dependency additions are necessary. Retain Vitest and Supertest.

Do not add an ORM, YAML parser, authentication framework, routing library, state-management library, or schema-form framework.

Exact compatible versions and native-binary availability for the documented Node runtime should be verified during implementation, then locked. No dependencies have been installed.

**9. Prioritized implementation sequence**

1. Establish environment rules, schema migration mechanism, SQLite connection, and temporary-database test fixtures.
2. Implement configuration schema/semantic validation and immutable version registration.
3. Implement the pure workflow evaluator with RBAC, conditions, and cycle-limit tests.
4. Implement repositories and atomic transition/create operations, including receipts and rollback tests.
5. Add development identity, access policies, API validation, and stable error mapping.
6. Add API/E2E tests, including restart, concurrency, replay, and five scenarios.
7. Build the focused React screens using server-provided action descriptors.
8. Write setup/API/architecture/scenario documentation; address ignore rules and Observe configuration.
9. Run backend tests, both builds, lint, and a clean setup/scenario walkthrough.

**10. Remaining blockers**

No technical blocker was identified. Native SQLite installation compatibility is an implementation risk to verify early; SQLite’s single-writer model is acceptable for this take-home’s short transactions.

The design deliberately has no usable production authentication mode, workflow hot reload, claim-version migration, or external integrations.

**Design review is the remaining gate. No features were implemented, files modified, dependencies installed, or tests executed in this task.**

> User context
>
> Attachments:
> - # Task 03: Implement Workflow Configuration Schema, Loader, and Validator Conti…: `~/.codex/attachments/da830b73-49f3-458a-8b5e-d1f6ee13dece/Pasted text.txt`

<details><summary>8 previous messages</summary>

> I’ll read the attached Task 03 instructions and check the relevant files before implementing the requested scope.
>
> <details><summary>Explored a file, ran 2 commands</summary>
>
> <details><summary>Explored a file</summary>
>
> - Read `~/.codex/attachments/da830b73-49f3-458a-8b5e-d1f6ee13dece/Pasted text.txt`
>
> </details>
>
> - Ran `cat backend/package.json backend/tsconfig.json backend/tsconfig.build.json backend/vitest.config.ts backend/src/app.module.ts backend/nest-cli.json; npm ls ajv --depth=0; rg --files --hidden -g AGENTS.md -g '!node_modules' -g '!.git'`
>
> - Ran `npm ls ajv; cat node_modules/ajv/package.json`
>
> </details>
>
> Ajv 8.20.0 is already installed through Nest tooling. I’ll declare it as a direct runtime dependency so the application doesn’t rely on a development dependency. The schema will allow only known condition and effect shapes; the `information_request` kind will identify transitions that use the shared counter when execution is added later.
>
> <details><summary>Ran 5 commands</summary>
>
> - Ran `npm install ajv@8.20.0 --save --offline --ignore-scripts --no-audit --no-fund`
> - Ran `npm install ajv@8.20.0 --save --ignore-scripts --no-audit --no-fund`
> - Ran ``mkdir -p backend/config backend/src/workflow
> python3 - <<'PY'
> import json
> from pathlib import Path
> p=Path('backend')
> def write(name,text): (p/name).write_text(text)
> write('src/workflow/workflow.types.ts', '''export type ActorRole = 'claimant' | 'adjuster';
> export type ClaimField = 'title' | 'description';
> export type NotificationTemplate = 'information_requested' | 'claim_approved' | 'claim_rejected';
> export interface StateDefinition { readonly id: string; readonly label: string; readonly terminal: boolean }
> export interface InputFieldDefinition {
>   readonly name: string; readonly label: string; readonly required: boolean;
>   readonly minLength: number; readonly maxLength: number;
> }
> export interface ClaimFieldsPresentCondition { readonly type: 'claimFieldsPresent'; readonly fields: readonly ClaimField[] }
> export type PreconditionDefinition = ClaimFieldsPresentCondition;
> export interface CreateNotificationEffect {
>   readonly type: 'createNotification'; readonly recipient: 'claimant'; readonly template: NotificationTemplate;
> }
> export type SideEffectDefinition = CreateNotificationEffect;
> export interface TransitionDefinition {
>   readonly id: string; readonly label: string; readonly from: string; readonly to: string;
>   readonly roles: readonly ActorRole[]; readonly kind?: 'information_request';
>   readonly inputFields: readonly InputFieldDefinition[];
>   readonly preconditions: readonly PreconditionDefinition[];
>   readonly sideEffects: readonly SideEffectDefinition[];
> }
> export interface WorkflowDefinition {
>   readonly schemaVersion: 1; readonly workflowId: string; readonly version: number;
>   readonly initialState: string; readonly limits: { readonly informationRequests: number };
>   readonly states: readonly StateDefinition[]; readonly transitions: readonly TransitionDefinition[];
> }
> ''')
> def obj(props,required=None): return {'type':'object','additionalProperties':False,'required':required if required is not None else list(props),'properties':props}
> identifier={'type':'string','pattern':'^[a-z][a-z0-9_]{0,63}$'}
> label={'type':'string','minLength':1,'maxLength':120,'pattern':r'\S'}
> field=obj({'name':identifier,'label':label,'required':{'type':'boolean'},'minLength':{'type':'integer','minimum':0,'maximum':2000},'maxLength':{'type':'integer','minimum':1,'maximum':2000}})
> condition=obj({'type':{'const':'claimFieldsPresent'},'fields':{'type':'array','minItems':1,'uniqueItems':True,'items':{'enum':['title','description']}}})
> effect=obj({'type':{'const':'createNotification'},'recipient':{'const':'claimant'},'template':{'enum':['information_requested','claim_approved','claim_rejected']}})
> transition=obj({'id':identifier,'label':label,'from':identifier,'to':identifier,'roles':{'type':'array','minItems':1,'uniqueItems':True,'items':{'enum':['claimant','adjuster']}},'kind':{'const':'information_request'},'inputFields':{'type':'array','maxItems':20,'items':field},'preconditions':{'type':'array','maxItems':20,'items':condition},'sideEffects':{'type':'array','maxItems':20,'items':effect}},['id','label','from','to','roles','inputFields','preconditions','sideEffects'])
> schema=obj({'schemaVersion':{'const':1},'workflowId':identifier,'version':{'type':'integer','minimum':1,'maximum':9007199254740991},'initialState':identifier,'limits':obj({'informationRequests':{'type':'integer','minimum':1,'maximum':3}}),'states':{'type':'array','minItems':1,'maxItems':200,'items':obj({'id':identifier,'label':label,'terminal':{'type':'boolean'}})},'transitions':{'type':'array','minItems':1,'maxItems':1000,'items':transition}})
> schema['$schema']='http://json-schema.org/draft-07/schema#'
> write('config/workflow.schema.json',json.dumps(schema,indent=2)+'\n')
> states=['draft','submitted','under_review','awaiting_information','approved','rejected']
> def trans(id,src,dst,role,inputs=[],effects=[],conditions=[],kind=None):
>  d={'id':id,'label':id.replace('_',' ').capitalize(),'from':src,'to':dst,'roles':[role],'inputFields':[{'name':x,'label':x.capitalize(),'required':True,'minLength':1,'maxLength':2000} for x in inputs],'preconditions':conditions,'sideEffects':[{'type':'createNotification','recipient':'claimant','template':x} for x in effects]}
>  if kind: d['kind']=kind
>  return d
> config={'schemaVersion':1,'workflowId':'claims','version':1,'initialState':'draft','limits':{'informationRequests':3},'states':[{'id':x,'label':x.replace('_',' ').capitalize(),'terminal':x in ['approved','rejected']} for x in states],'transitions':[trans('submit','draft','submitted','claimant',conditions=[{'type':'claimFieldsPresent','fields':['title','description']}]),trans('start_review','submitted','under_review','adjuster'),trans('request_information','under_review','awaiting_information','adjuster',['message'],['information_requested'],kind='information_request'),trans('provide_information','awaiting_information','under_review','claimant',['response']),trans('approve','under_review','approved','adjuster',effects=['claim_approved']),trans('reject','under_review','rejected','adjuster',['reason'],['claim_rejected'])]}
> write('config/claims.v1.json',json.dumps(config,indent=2)+'\n')
> write('src/workflow/workflow-config.validator.ts', '''import { readFileSync } from 'node:fs';
> import { Ajv } from 'ajv';
> import type { WorkflowDefinition } from './workflow.types.js';
>
> export class WorkflowConfigurationError extends Error {
>   constructor(readonly issues: readonly string[]) {
>     super(`Workflow configuration invalid: ${issues.slice(0, 20).join('; ')}`);
>     this.name = 'WorkflowConfigurationError';
>   }
> }
>
> // Relative to this module in both src/workflow and dist/workflow.
> const schema: unknown = JSON.parse(readFileSync(new URL('../../config/workflow.schema.json', import.meta.url), 'utf8'));
> const ajv = new Ajv({ strict: true, allErrors: true, coerceTypes: false, useDefaults: false, removeAdditional: false });
> if (typeof schema !== 'object' || schema === null) throw new Error('Workflow schema must be an object');
> const validate = ajv.compile<WorkflowDefinition>(schema);
>
> function freezeDeep(value: unknown): void {
>   if (typeof value !== 'object' || value === null) return;
>   for (const child of Object.values(value)) freezeDeep(child);
>   Object.freeze(value);
> }
>
> export function validateWorkflowDefinition(value: unknown): WorkflowDefinition {
>   if (!validate(value)) {
>     throw new WorkflowConfigurationError((validate.errors ?? []).slice(0, 20).map(error => {
>       const missing: unknown = error.params.missingProperty;
>       const path = `${error.instancePath}${typeof missing === 'string' ? `/${missing}` : ''}`;
>       return `${path || '/'}: ${error.message ?? 'invalid value'}`;
>     }));
>   }
>   const issues: string[] = [];
>   const states = new Map(value.states.map(state => [state.id, state]));
>   function unique(ids: readonly string[], path: string): void {
>     const seen = new Set<string>();
>     ids.forEach((id, index) => {
>       if (seen.has(id)) issues.push(`${path}/${index}/id: duplicate identifier`);
>       seen.add(id);
>     });
>   }
>   unique(value.states.map(state => state.id), '/states');
>   unique(value.transitions.map(transition => transition.id), '/transitions');
>   if (!states.has(value.initialState)) issues.push('/initialState: unknown state');
>   if (states.get(value.initialState)?.terminal) issues.push('/initialState: must not be terminal');
>   value.transitions.forEach((transition, index) => {
>     const path = `/transitions/${index}`;
>     if (!states.has(transition.from)) issues.push(`${path}/from: unknown state`);
>     if (!states.has(transition.to)) issues.push(`${path}/to: unknown state`);
>     if (states.get(transition.from)?.terminal) issues.push(`${path}/from: terminal state has outgoing transition`);
>     unique(transition.inputFields.map(field => field.name), `${path}/inputFields`);
>     transition.inputFields.forEach((field, fieldIndex) => {
>       if (field.minLength > field.maxLength) issues.push(`${path}/inputFields/${fieldIndex}: minLength exceeds maxLength`);
>       if (field.required && field.minLength < 1) issues.push(`${path}/inputFields/${fieldIndex}/minLength: required input must be nonempty`);
>     });
>   });
>   const reached = new Set<string>([value.initialState]);
>   const pending = [value.initialState];
>   while (pending.length) {
>     const current = pending.pop();
>     for (const transition of value.transitions) {
>       if (transition.from === current && !reached.has(transition.to)) {
>         reached.add(transition.to); pending.push(transition.to);
>       }
>     }
>   }
>   value.states.forEach((state, index) => {
>     if (!reached.has(state.id)) issues.push(`/states/${index}: unreachable from initialState`);
>   });
>   if (issues.length) throw new WorkflowConfigurationError(issues.slice(0, 20));
>   // Copy before freezing so callers retain ownership of their input objects.
>   const definition = structuredClone(value);
>   freezeDeep(definition);
>   return definition;
> }
> ''')
> write('src/workflow/workflow-config.service.ts', '''import { readFileSync } from 'node:fs';
> import type { WorkflowDefinition } from './workflow.types.js';
> import { validateWorkflowDefinition, WorkflowConfigurationError } from './workflow-config.validator.js';
>
> export const DEFAULT_WORKFLOW_PATH = new URL('../../config/claims.v1.json', import.meta.url);
> const MAX_CONFIG_BYTES = 1024 * 1024;
>
> export function parseWorkflowJson(text: string): WorkflowDefinition {
>   if (Buffer.byteLength(text, 'utf8') > MAX_CONFIG_BYTES) {
>     throw new WorkflowConfigurationError(['/: configuration exceeds 1 MiB']);
>   }
>   let value: unknown;
>   try { value = JSON.parse(text); }
>   catch { throw new WorkflowConfigurationError(['/: malformed JSON']); }
>   return validateWorkflowDefinition(value);
> }
>
> export function loadWorkflowDefinition(path: string | URL = DEFAULT_WORKFLOW_PATH): WorkflowDefinition {
>   let contents: string;
>   try { contents = readFileSync(path, 'utf8'); }
>   catch { throw new WorkflowConfigurationError(['/: unable to read workflow file; ensure backend/config/claims.v1.json exists and is readable (or check the supplied path)']); }
>   return parseWorkflowJson(contents);
> }
>
> export class WorkflowConfigService {
>   readonly definition: WorkflowDefinition;
>   constructor() { this.definition = loadWorkflowDefinition(); Object.freeze(this); }
> }
> ''')
> write('src/workflow/workflow.module.ts', '''import { Module } from '@nestjs/common';
> import { WorkflowConfigService } from './workflow-config.service.js';
>
> @Module({
>   providers: [{ provide: WorkflowConfigService, useFactory: () => new WorkflowConfigService() }],
>   exports: [WorkflowConfigService],
> })
> export class WorkflowModule {}
> ''')
> file=p/'src/app.module.ts'
> s=file.read_text().replace("import { AppService } from './app.service.js';", "import { AppService } from './app.service.js';\nimport { WorkflowModule } from './workflow/workflow.module.js';").replace('  imports: [','  imports: [\n    WorkflowModule,')
> file.write_text(s)
> PY``
> - Ran ``cat > backend/src/workflow/workflow-config.spec.ts <<'EOF'
> import { readFileSync } from 'node:fs';
> import { Test } from '@nestjs/testing';
> import { WorkflowModule } from './workflow.module.js';
> import { WorkflowConfigService, DEFAULT_WORKFLOW_PATH, loadWorkflowDefinition, parseWorkflowJson } from './workflow-config.service.js';
> import { validateWorkflowDefinition } from './workflow-config.validator.js';
>
> function fixture() {
>   return structuredClone(loadWorkflowDefinition());
> }
> // JSON fixtures deliberately allow invalid data without weakening production types.
> function raw(): Record<string, unknown> {
>   return JSON.parse(readFileSync(DEFAULT_WORKFLOW_PATH, 'utf8')) as Record<string, unknown>;
> }
>
> describe('workflow configuration', () => {
>   it('accepts the complete initial workflow', () => {
>     const definition = loadWorkflowDefinition();
>     expect(definition.workflowId).toBe('claims');
>     expect(definition.states).toHaveLength(6);
>     expect(definition.transitions).toHaveLength(6);
>     expect(definition.limits.informationRequests).toBe(3);
>     expect(definition.transitions[2].kind).toBe('information_request');
>     expect(definition.transitions[2].inputFields[0]).toMatchObject({ name: 'message', required: true, minLength: 1 });
>     expect(definition.transitions[2].sideEffects[0]).toMatchObject({ recipient: 'claimant', template: 'information_requested' });
>   });
>   it('rejects malformed JSON without echoing content', () => {
>     expect(() => parseWorkflowJson('{"secret":')).toThrow('malformed JSON');
>   });
>   it('rejects a missing required property with its path', () => {
>     const value = raw(); delete value.initialState;
>     expect(() => validateWorkflowDefinition(value)).toThrow('/initialState');
>   });
>   it('rejects unknown root properties', () => {
>     expect(() => validateWorkflowDefinition({ ...raw(), execute: 'bad' })).toThrow('additional properties');
>   });
>   it('rejects nested unknown properties and per-transition counter overrides', () => {
>     const value = fixture();
>     const transitions = [{ ...value.transitions[2], informationRequestLimit: 99 }];
>     expect(() => validateWorkflowDefinition({ ...value, transitions })).toThrow('additional properties');
>   });
>   it('rejects duplicate state identifiers', () => {
>     const value = fixture();
>     expect(() => validateWorkflowDefinition({ ...value, states: [...value.states, value.states[0]] })).toThrow('duplicate identifier');
>   });
>   it('rejects duplicate transition identifiers', () => {
>     const value = fixture();
>     expect(() => validateWorkflowDefinition({ ...value, transitions: [...value.transitions, value.transitions[0]] })).toThrow('duplicate identifier');
>   });
>   it.each(['from', 'to'] as const)('rejects unknown %s state', field => {
>     const value = fixture();
>     expect(() => validateWorkflowDefinition({ ...value, transitions: [{ ...value.transitions[0], [field]: 'missing' }] })).toThrow(`/${field}: unknown state`);
>   });
>   it('rejects an unknown initial state', () => {
>     expect(() => validateWorkflowDefinition({ ...fixture(), initialState: 'missing' })).toThrow('/initialState: unknown state');
>   });
>   it('rejects a terminal initial state', () => {
>     expect(() => validateWorkflowDefinition({ ...fixture(), initialState: 'approved' })).toThrow('must not be terminal');
>   });
>   it('rejects outgoing transitions from terminal states', () => {
>     const value = fixture();
>     expect(() => validateWorkflowDefinition({ ...value, transitions: [...value.transitions, { ...value.transitions[0], id: 'reopen', from: 'approved' }] })).toThrow('terminal state has outgoing');
>   });
>   it('rejects unreachable states', () => {
>     const value = fixture();
>     expect(() => validateWorkflowDefinition({ ...value, states: [...value.states, { id: 'orphan', label: 'Orphan', terminal: false }] })).toThrow('unreachable');
>   });
>   it.each([
>     ['role', { roles: ['admin'] }],
>     ['empty roles', { roles: [] }],
>     ['condition', { preconditions: [{ type: 'eval', expression: 'anything' }] }],
>     ['claim field', { preconditions: [{ type: 'claimFieldsPresent', fields: ['password'] }] }],
>     ['effect', { sideEffects: [{ type: 'sendEmail' }] }],
>     ['template', { sideEffects: [{ type: 'createNotification', recipient: 'claimant', template: 'unknown' }] }],
>     ['recipient', { sideEffects: [{ type: 'createNotification', recipient: 'https://example.com', template: 'claim_approved' }] }],
>     ['missing effect properties', { sideEffects: [{ type: 'createNotification' }] }],
>     ['kind', { kind: 'custom_counter' }],
>   ])('rejects unsupported %s', (_name, change) => {
>     const value = fixture();
>     expect(() => validateWorkflowDefinition({ ...value, transitions: [{ ...value.transitions[0], ...change }] })).toThrow('Workflow configuration invalid');
>   });
>   it.each([0, 4, 1.5, '3'])('rejects invalid cycle limit %s without coercion', limit => {
>     expect(() => validateWorkflowDefinition({ ...fixture(), limits: { informationRequests: limit } })).toThrow('/limits/informationRequests');
>   });
>   it('accepts a configuration-only added state and transition', () => {
>     const value = fixture();
>     const extended = validateWorkflowDefinition({ ...value,
>       states: [...value.states, { id: 'escalated', label: 'Escalated', terminal: false }],
>       transitions: [...value.transitions, { ...value.transitions[1], id: 'escalate', from: 'under_review', to: 'escalated' }],
>     });
>     expect(extended.states.at(-1)?.id).toBe('escalated');
>     expect(extended.transitions.at(-1)?.to).toBe('escalated');
>   });
>   it('deeply freezes loaded definitions', () => {
>     const value = loadWorkflowDefinition();
>     expect(Object.isFrozen(value)).toBe(true);
>     expect(Object.isFrozen(value.transitions[2].sideEffects[0])).toBe(true);
>     expect(() => Reflect.set(value.limits, 'informationRequests', 9)).not.toThrow();
>     expect(Reflect.set(value.limits, 'informationRequests', 9)).toBe(false);
>     expect(() => Array.prototype.push.call(value.states, {})).toThrow(TypeError);
>     expect(value.limits.informationRequests).toBe(3);
>   });
>   it('does not freeze or retain the caller-owned input', () => {
>     const value = raw(); const result = validateWorkflowDefinition(value);
>     value.workflowId = 'changed';
>     expect(result.workflowId).toBe('claims');
>     expect(Object.isFrozen(value)).toBe(false);
>   });
>   it('reports a missing configuration file', () => {
>     expect(() => loadWorkflowDefinition(new URL('../../config/nonexistent.json', import.meta.url))).toThrow('unable to read workflow file');
>   });
>   it('loads the provider during Nest module startup', async () => {
>     const module = await Test.createTestingModule({ imports: [WorkflowModule] }).compile();
>     expect(module.get(WorkflowConfigService).definition.workflowId).toBe('claims');
>     await module.close();
>   });
>   it('fails Nest startup when configuration loading fails', async () => {
>     const module = Test.createTestingModule({ imports: [WorkflowModule] })
>       .overrideProvider(WorkflowConfigService)
>       .useFactory({ factory: () => loadWorkflowDefinition('/missing/workflow.json') });
>     await expect(module.compile()).rejects.toThrow('unable to read workflow file');
>   });
>   it('rejects duplicate input field names', () => {
>     const value = fixture(); const field = value.transitions[2].inputFields[0];
>     expect(() => validateWorkflowDefinition({ ...value, transitions: [{ ...value.transitions[2], inputFields: [field, field] }] })).toThrow('duplicate identifier');
>   });
>   it.each([
>     { minLength: 20, maxLength: 10 },
>     { minLength: 0, maxLength: 20 },
>     { minLength: 1, maxLength: 2001 },
>     { label: '' },
>   ])('rejects invalid input bounds %j', change => {
>     const value = fixture();
>     expect(() => validateWorkflowDefinition({ ...value, transitions: [{ ...value.transitions[2], inputFields: [{ ...value.transitions[2].inputFields[0], ...change }] }] })).toThrow('Workflow configuration invalid');
>   });
>   it.each([{ schemaVersion: 2 }, { version: 0 }, { workflowId: 'Invalid-ID' }, { states: [] }, { transitions: [] }])('rejects invalid root shape %j', change => {
>     expect(() => validateWorkflowDefinition({ ...fixture(), ...change })).toThrow('Workflow configuration invalid');
>   });
>   it('rejects oversized JSON', () => {
>     expect(() => parseWorkflowJson(' '.repeat(1024 * 1024 + 1))).toThrow('exceeds 1 MiB');
>   });
> });
> EOF
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- --reporter=dot``
> - Ran ``cat > src/workflow/workflow-config.spec.ts <<'EOF'
> import { readFileSync } from 'node:fs';
> import { Test } from '@nestjs/testing';
> import { WorkflowModule } from './workflow.module.js';
> import { WorkflowConfigService, DEFAULT_WORKFLOW_PATH, loadWorkflowDefinition, parseWorkflowJson } from './workflow-config.service.js';
> import { validateWorkflowDefinition } from './workflow-config.validator.js';
> const fixture = () => structuredClone(loadWorkflowDefinition());
> function raw(): Record<string, unknown> { return JSON.parse(readFileSync(DEFAULT_WORKFLOW_PATH, 'utf8')) as Record<string, unknown>; }
> describe('workflow configuration', () => {
>   it('accepts the complete initial workflow', () => {
>     const value = loadWorkflowDefinition();
>     expect(value.workflowId).toBe('claims');
>     expect(value.states).toHaveLength(6);
>     expect(value.transitions).toHaveLength(6);
>     expect(value.limits.informationRequests).toBe(3);
>     expect(value.transitions[2].kind).toBe('information_request');
>     expect(value.transitions[2].inputFields[0]).toMatchObject({ name: 'message', required: true, minLength: 1 });
>     expect(value.transitions[2].sideEffects[0]).toMatchObject({ recipient: 'claimant', template: 'information_requested' });
>   });
>   it('rejects malformed JSON', () => { expect(() => parseWorkflowJson('{"secret":')).toThrow('malformed JSON'); });
>   it('rejects missing required properties with a path', () => {
>     const value = raw(); delete value.initialState;
>     expect(() => validateWorkflowDefinition(value)).toThrow('/initialState');
>   });
>   it('rejects unknown root properties', () => { expect(() => validateWorkflowDefinition({ ...raw(), execute: 'bad' })).toThrow('additional properties'); });
>   it('rejects counter overrides in transitions', () => {
>     const value = fixture();
>     expect(() => validateWorkflowDefinition({ ...value, transitions: [{ ...value.transitions[2], informationRequestLimit: 99 }] })).toThrow('additional properties');
>   });
>   it('rejects duplicate states', () => {
>     const value = fixture();
>     expect(() => validateWorkflowDefinition({ ...value, states: [...value.states, value.states[0]] })).toThrow('duplicate identifier');
>   });
>   it('rejects duplicate transitions', () => {
>     const value = fixture();
>     expect(() => validateWorkflowDefinition({ ...value, transitions: [...value.transitions, value.transitions[0]] })).toThrow('duplicate identifier');
>   });
>   it.each(['from', 'to'] as const)('rejects unknown %s', field => {
>     const value = fixture();
>     expect(() => validateWorkflowDefinition({ ...value, transitions: [{ ...value.transitions[0], [field]: 'missing' }] })).toThrow(`/${field}: unknown state`);
>   });
>   it('rejects unknown initial state', () => { expect(() => validateWorkflowDefinition({ ...fixture(), initialState: 'missing' })).toThrow('/initialState: unknown state'); });
>   it('rejects terminal initial state', () => { expect(() => validateWorkflowDefinition({ ...fixture(), initialState: 'approved' })).toThrow('must not be terminal'); });
>   it('rejects terminal outgoing transitions', () => {
>     const value = fixture();
>     expect(() => validateWorkflowDefinition({ ...value, transitions: [...value.transitions, { ...value.transitions[0], id: 'reopen', from: 'approved' }] })).toThrow('terminal state has outgoing');
>   });
>   it('rejects unreachable states', () => {
>     const value = fixture();
>     expect(() => validateWorkflowDefinition({ ...value, states: [...value.states, { id: 'orphan', label: 'Orphan', terminal: false }] })).toThrow('unreachable');
>   });
>   it.each([
>     ['role', { roles: ['admin'] }], ['empty roles', { roles: [] }],
>     ['condition', { preconditions: [{ type: 'eval', expression: 'anything' }] }],
>     ['claim field', { preconditions: [{ type: 'claimFieldsPresent', fields: ['password'] }] }],
>     ['effect', { sideEffects: [{ type: 'sendEmail' }] }],
>     ['template', { sideEffects: [{ type: 'createNotification', recipient: 'claimant', template: 'unknown' }] }],
>     ['recipient', { sideEffects: [{ type: 'createNotification', recipient: 'https://example.com', template: 'claim_approved' }] }],
>     ['missing effect properties', { sideEffects: [{ type: 'createNotification' }] }],
>     ['kind', { kind: 'custom_counter' }],
>   ])('rejects unsupported %s', (_name, change) => {
>     const value = fixture();
>     expect(() => validateWorkflowDefinition({ ...value, transitions: [{ ...value.transitions[0], ...change }] })).toThrow('Workflow configuration invalid');
>   });
>   it.each([0, 4, 1.5, '3'])('rejects limit %s without coercion', limit => {
>     expect(() => validateWorkflowDefinition({ ...fixture(), limits: { informationRequests: limit } })).toThrow('/limits/informationRequests');
>   });
>   it('accepts configuration-only extension', () => {
>     const value = fixture();
>     const result = validateWorkflowDefinition({ ...value,
>       states: [...value.states, { id: 'escalated', label: 'Escalated', terminal: false }],
>       transitions: [...value.transitions, { ...value.transitions[1], id: 'escalate', from: 'under_review', to: 'escalated' }],
>     });
>     expect(result.states.at(-1)?.id).toBe('escalated');
>     expect(result.transitions.at(-1)?.to).toBe('escalated');
>   });
>   it('deeply freezes loaded definitions', () => {
>     const value = loadWorkflowDefinition();
>     expect(Object.isFrozen(value.transitions[2].sideEffects[0])).toBe(true);
>     expect(Reflect.set(value.limits, 'informationRequests', 9)).toBe(false);
>     expect(() => Array.prototype.push.call(value.states, {})).toThrow(TypeError);
>     expect(value.limits.informationRequests).toBe(3);
>   });
>   it('copies rather than freezing caller input', () => {
>     const value = raw(); const result = validateWorkflowDefinition(value); value.workflowId = 'changed';
>     expect(result.workflowId).toBe('claims'); expect(Object.isFrozen(value)).toBe(false);
>   });
>   it('reports missing file', () => { expect(() => loadWorkflowDefinition('/missing/workflow.json')).toThrow('unable to read workflow file'); });
>   it('loads configuration during Nest provider startup', async () => {
>     const module = await Test.createTestingModule({ imports: [WorkflowModule] }).compile();
>     expect(module.get(WorkflowConfigService).definition.workflowId).toBe('claims'); await module.close();
>   });
>   it('rejects duplicate input names', () => {
>     const value = fixture(); const field = value.transitions[2].inputFields[0];
>     expect(() => validateWorkflowDefinition({ ...value, transitions: [{ ...value.transitions[2], inputFields: [field, field] }] })).toThrow('duplicate identifier');
>   });
>   it.each([{ minLength: 20, maxLength: 10 }, { minLength: 0 }, { maxLength: 2001 }, { label: '' }])('rejects input bounds %j', change => {
>     const value = fixture();
>     expect(() => validateWorkflowDefinition({ ...value, transitions: [{ ...value.transitions[2], inputFields: [{ ...value.transitions[2].inputFields[0], ...change }] }] })).toThrow('Workflow configuration invalid');
>   });
>   it.each([{ schemaVersion: 2 }, { version: 0 }, { workflowId: 'Invalid-ID' }, { states: [] }, { transitions: [] }])('rejects root %j', change => {
>     expect(() => validateWorkflowDefinition({ ...fixture(), ...change })).toThrow('Workflow configuration invalid');
>   });
>   it('rejects oversized input', () => { expect(() => parseWorkflowJson(' '.repeat(1024 * 1024 + 1))).toThrow('exceeds 1 MiB'); });
> });
> EOF
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- --reporter=dot``
>
> </details>
>
> The loader and validator are in place. All 43 unit tests pass, including 42 new configuration tests covering invalid references, unsupported handlers, cycle limits, configuration-only extension, and deep immutability. I’ll now check the backend build, compiled-file loading, and lint, then document the configuration rules and runtime limitations.
>
> <details><summary>Ran 9 commands</summary>
>
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run build`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run lint`
> - Ran ````python3 - <<'PY'
> from pathlib import Path
> p=Path('src/workflow/workflow-config.validator.ts')
> s=p.read_text().replace('path: string): void', "path: string, key = 'id'): void").replace('${path}/${index}/id: duplicate identifier','${path}/${index}/${key}: duplicate identifier').replace('`${path}/inputFields`);', "`${path}/inputFields`, 'name');").replace("`${path || '/'}: ${error.message ?? 'invalid value'}`", "`${(path || '/').slice(0, 200)}: ${error.message ?? 'invalid value'}`")
> p.write_text(s)
> p=Path('src/workflow/workflow-config.spec.ts')
> s=p.read_text().replace("  it('rejects oversized input'", """  it('never inserts missing defaults or strips unknown properties', () => {
>     const value = raw(); delete value.limits; value.extra = true;
>     expect(() => validateWorkflowDefinition(value)).toThrow('Workflow configuration invalid');
>     expect(value).not.toHaveProperty('limits'); expect(value.extra).toBe(true);
>   });
>   it('rejects oversized input'""")
> p.write_text(s)
> PY
> cat > config/README.md <<'EOF'
> # Workflow configuration (Task 03)
>
> `claims.v1.json` is the startup definition; `workflow.schema.json` is its
> Draft 7 JSON Schema. The backend loads the file eagerly through WorkflowModule.
> Missing, malformed, structurally invalid, or semantically invalid definitions
> prevent provider creation and therefore application startup. No fallback exists.
>
> Paths are resolved relative to the module URL, not the working directory. Source
> and compiled layouts both resolve to `backend/config/`. Ship that directory
> alongside `dist/`; `nest build` does not copy it into `dist`. Editing JSON requires
> an application restart. No environment-controlled config path is exposed.
>
> Consumers inject WorkflowConfigService and read its `definition`. The definition
> is a defensive copy, recursively frozen, and readonly in TypeScript. The service
> itself is frozen. Validation errors report at most 20 issues, bounded paths, and
> reasons without echoing JSON values. JSON text is limited to 1 MiB.
>
> ## Configuration rules
>
> - Identifiers match `^[a-z][a-z0-9_]{0,63}$` (1–64 lowercase ASCII characters,
>   beginning with a letter). State and transition IDs are unique in their arrays.
> - Schema version is 1. Workflow version is a positive safe integer.
> - States (1–200) and transitions (1–1000) are required; labels are nonblank and
>   limited to 120 characters. Unknown properties are rejected at every level.
> - Initial/source/target references must exist. Initial state cannot be terminal;
>   terminal states have no outgoing transitions. Every state must be reachable.
> - Roles are the nonempty unique subset of claimant and adjuster.
> - Input fields have unique names per transition, bounded labels, explicit
>   required/minLength/maxLength properties, and a maximum length of 2000.
>   Required fields need minLength >= 1; minLength cannot exceed maxLength.
>   Runtime submission validation, including whitespace-only rejection for required
>   text, belongs to transition execution in a later task.
> - Preconditions use AND semantics. The only supported condition is
>   claimFieldsPresent with a nonempty unique list from title and description.
> - The only effect is createNotification, recipient claimant, and template
>   information_requested, claim_approved, or claim_rejected. These identifiers
>   describe future backend-owned handlers; no handler executes in this task.
> - Optional kind information_request is the sole marker for shared cycle behavior.
>   Every such transition uses root limits.informationRequests (1–3). No local
>   counter, override, or alternative request behavior can be configured. Later
>   runtime code must enforce/count this marker atomically; this loader does not
>   infer intent from transition IDs or state names.
> - Adding states/transitions using this vocabulary requires only JSON edits.
>   New condition/effect capabilities need explicit schema/types/backend code.
>   No code expressions, dynamic imports, URLs, or arbitrary handlers are allowed.
>
> The initial definition includes submit, start_review, request_information,
> provide_information, approve, and reject. Required message, response, and reason
> fields have minLength 1 and maxLength 2000. Submit requires title and description.
>
> ## Verification
>
> From backend, with a compatible Node runtime on PATH:
>
> ```sh
> npm test
> npm run build
> npm run lint
> ```
>
> The current local Node 22.15.1 runs these checks. Dependency installation reported
> existing tooling engine requirements above that version (including Angular
> Devkit's ^22.22.3 requirement) and a tsconfck/TypeScript 6 peer mismatch. Prefer a
> runtime satisfying installed package engine requirements for clean setup; this
> task does not upgrade the scaffold or claim those warnings are resolved.
>
> SQLite persistence, version registration/pinning, actor authentication,
> transition execution, input submission checks, and notification creation are
> not implemented here. Recommended next step: SQLite migrations and immutable
> workflow-version registration, followed by transition execution.
> EOF
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH ./node_modules/.bin/prettier --write src/workflow config/ src/app.module.ts````
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run lint`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- --reporter=dot`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run test:e2e`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run build`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run test:e2e`
> - Ran `/Users/tranngochung/.nvm/versions/node/v22.15.1/bin/node --input-type=module -e 'const { loadWorkflowDefinition } = await import("./dist/workflow/workflow-config.service.js"); console.log(loadWorkflowDefinition().workflowId);'`
>
> </details>
>
> Build, lint, and compiled-file loading passed. The existing E2E test also passed after a rerun outside the sandbox allowed its local port to bind. The scaffold’s Observe worker logged an error during that run; I’ve left that unrelated setup unchanged and documented the existing dependency engine warnings.
>
> <details><summary>Ran a command</summary>
>
> - Ran `git status --short; cat backend/package.json; rg -n 'ajv|"dev"' backend/package-lock.json -m 6; sed -n '1,160p' backend/src/workflow/workflow-config.validator.ts`
>
> </details>
</details>

Implemented Task 03 only: strict workflow types, JSON Schema, semantic validation, startup loading, and deeply immutable definitions.

Changed files under `backend/`:

| File | Responsibility |
|---|---|
| [workflow.types.ts](backend/src/workflow/workflow.types.ts) | Readonly domain/configuration types |
| [workflow.schema.json](backend/config/workflow.schema.json) | Strict structural validation and supported vocabulary |
| [claims.v1.json](backend/config/claims.v1.json) | Approved six-state, six-transition workflow |
| [workflow-config.validator.ts](backend/src/workflow/workflow-config.validator.ts) | Reference, uniqueness, reachability, terminal-state, and input-bound checks |
| [workflow-config.service.ts](backend/src/workflow/workflow-config.service.ts) | Safe JSON loading, bounded errors, defensive copying and freezing |
| [workflow.module.ts](backend/src/workflow/workflow.module.ts) | Exported startup configuration provider |
| [app.module.ts](backend/src/app.module.ts) | Registers the workflow module |
| [workflow-config.spec.ts](backend/src/workflow/workflow-config.spec.ts) | 43 new configuration tests |
| [config/README.md](backend/config/README.md) | Configuration rules, packaging instructions, limitations |
| `package.json`, `package-lock.json` | Declare existing Ajv 8.20.0 as a direct runtime dependency |

Unknown properties and unsupported roles, conditions, effects, recipients, and templates are rejected. Information-request transitions use the shared root limit; transition-specific overrides are prohibited.

Verification ran from `backend/`, with this prefix selecting Node 22.15.1:

```sh
PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH
```

| Command | Actual result |
|---|---|
| `npm test -- --reporter=dot` | **44 passed**, including the existing starter test |
| `npm run build` | Passed |
| `npm run lint` | Passed |
| `npm run test:e2e` | **1 passed** after rerunning outside the sandbox to permit local port binding |
| Compiled-loader smoke check | Loaded workflow `claims` successfully |

Existing tooling engine/peer warnings remain documented. The pre-existing Observe worker also logged an error during the passing E2E run.

SQLite, transition execution, authentication, notifications, and frontend features remain outside this implementation. Deployments must include `backend/config/` alongside `dist/`. Recommended next task: SQLite migrations and immutable workflow-version registration.

> User context
>
> Attachments:
> - # Task 04 — SQLite Migrations & Immutable Workflow Version Registry ## Context …: `~/.codex/attachments/ff6cb8a7-fe00-42f0-937a-f94d5f4722b7/Pasted text.txt`

<details><summary>8 previous messages</summary>

> I’ll read Task 04 and inspect the current workflow foundation before adding the SQLite migration and version registry scope.
>
> <details><summary>Explored a file, ran a command, called a tool</summary>
>
> <details><summary>Explored a file</summary>
>
> - Read `~/.codex/attachments/ff6cb8a7-fe00-42f0-937a-f94d5f4722b7/Pasted text.txt`
>
> </details>
>
> - Ran `cat backend/package.json backend/tsconfig.json backend/nest-cli.json backend/vitest.config.ts backend/vitest.config.e2e.ts backend/src/workflow/workflow.module.ts backend/src/workflow/workflow-config.service.ts backend/src/main.ts backend/test/app.e2e-spec.ts; rg --files backend/src; node --version; git status --short`
>
> MCP tool call
>
> codex_apps.search_service.web_run
>
> ```json
> {
>   "open": [
>     {
>       "ref_id": "https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md"
>     },
>     {
>       "ref_id": "https://www.sqlite.org/lang_transaction.html"
>     }
>   ],
>   "response_length": "short"
> }
> ```
>
> ```text
> better-sqlite3/docs/api.md at master · WiseLibs/better-sqlite3 · GitHub (https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)
> 【turn1view0】 [wordlim: 200] Crawled: 2 months ago; Content type: text/html; Source: open({"ref_id":"https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md","lineno":null}); Total lines: 730
> L0: 【0†Skip to content】
> L1: ## Navigation Menu
> L2: 
> L3: 【1†Sign in】Appearance settings
> L4: 
> L5:   * Platform
> L6: 
> L7:     * AI CODE CREATION
> L8:       * 【2†GitHub CopilotWrite better code with AI】
> L9:       * 【3†GitHub Copilot appDirect agents from issue to merge】
> L10:       * 【4†MCP RegistryIntegrate external tools】
> L11: 
> L12:     * DEVELOPER WORKFLOWS
> L13:       * 【5†ActionsAutomate any workflow】
> L14:       * 【6†CodespacesInstant dev environments】
> L15:       * 【7†IssuesPlan and track work】
> L16:       * 【8†Code ReviewManage code changes】
> L17:       * 【9†Code QualityEnforce quality at merge】
> L18:     * APPLICATION SECURITY
> L19:       * 【10†GitHub Advanced SecurityFind and fix vulnerabilities】
> L20:       * 【11†Code securitySecure your code as you build】
> L21:       * 【12†Secret protectionStop leaks before they start】
> L22: 
> L23:     * EXPLORE
> L24:       * 【13†Why GitHub】
> L25:       * 【14†Documentation†docs.github.com】
> L26:       * 【15†Blog†github.blog】
> L27:       * 【16†Changelog†github.blog】
> L28:       * 【17†Marketplace】
> L29: 
> L30: 【18†View all features】
> L31: 
> L32:   * Solutions
> L33:     * BY COMPANY SIZE
> L34:       * 【19†Enterprises】
> L35:       * 【20†Small and medium teams】
> L36:       * 【21†Startups】
> L37:       * 【22†Nonprofits】
> L38: 
> L39:     * BY USE CASE
> L40:       * 【23†App Modernization】
> L41:       * 【24†DevSecOps】
> L42:       * 【25†DevOps】
> L43:       * 【26†CI/CD】
> L44:       * 【27†View all use cases】
> L45: 
> L46:     * BY INDUSTRY
> L47:       * 【28†Healthcare】
> L48:       * 【29†Financial services】
> L49:       * 【30†Manufacturing】
> L50:       * 【31†Government】
> L51:       * 【32†View all industries】
> L52: 
> L53: 【33†View all solutions】
> L54: 
> L55:   * Resources
> L56:     * EXPLORE BY TOPIC
> L57:       * 【34†AI】
> L58:       * 【35†Software Development】
> L59:       * 【36†DevOps】
> L60:       * 【37†Security】
> L61:       * 【38†View all topics】
> L62: 
> L63:     * EXPLORE BY TYPE
> L64:       * 【39†Customer stories】
> L65:       * 【40†Events & webinars】
> L66:       * 【41†Ebooks & reports】
> L67:       * 【42†Business insights】
> L68:       * 【43†GitHub Skills†skills.github.com】
> L69:     * SUPPORT & SERVICES
> L70:       * 【14†Documentation†docs.github.com】
> L71:       * 【44†Customer support†support.github.com】
> L72:       * 【45†Community forum】
> L73:       * 【46†Trust center】
> L74:       * 【47†Partners】
> L75: 
> L76: 【48†View all resources】
> L77: 
> L78:   * Open Source
> L79: 
> L80:     * COMMUNITY
> L81:       * 【49†GitHub SponsorsFund open source developers】
> L82:     * PROGRAMS
> L83:       * 【50†Security Lab†securitylab.github.com】
> L84:       * 【51†Maintainer Community†maintainers.github.com】
> L85:       * 【52†Accelerator】
> L86:       * 【53†GitHub Stars†stars.github.com】
> L87:       * 【54†Archive Program†archiveprogram.github.com】
> L88: 
> L89:     * REPOSITORIES
> L90:       * 【55†Topics】
> L91:       * 【56†Trending】
> L92:       * 【57†Collections】
> L93: 
> L94:   * Enterprise
> L95: 
> L96:     * ENTERPRISE SOLUTIONS
> L97:       * 【19†Enterprise platformAI-powered developer platform】
> L98:     * AVAILABLE ADD-ONS
> L99:       * 【10†GitHub Advanced SecurityEnterprise-grade security features】
> L100:       * 【58†Copilot for BusinessEnterprise-grade AI features】
> L101:       * 【59†Premium SupportEnterprise-grade 24/7 support】
> L102: 
> L103:   * 【60†Pricing】
> L104: 
> L105: Type `/` to search
> L106: 
> L107: 【1†Sign in】
> L108: 
> L109: 【61†Sign up】Appearance settings
> L110: You signed in with another tab or window. Reload to refresh your session. You signed out in another tab or window. Reload to refresh your session. You switched accounts on another tab or window. Reload to refresh your session. Dismiss alert
> L111: ### Uh oh!
> L112: 
> L113: There was an error while loading. Please reload this page.
> L114: 
> L115: 【62†WiseLibs】 / 【63†better-sqlite3】 Public
> L116: 
> L117:   * ### Uh oh!
> L118: 
> L119: There was an error while loading. Please reload this page.
> L120: 
> L121:   * 【64†Notifications】 You must be signed in to change notification settings
> L122:   * 【64†Fork 473】
> L123:   * 【64†Star】
> L124: 
> L125:   * 【63†Code】
> L126:   * 【65†Issues 53】
> L127:   * 【66†Pull requests 14】
> L128:   * 【67†Discussions】
> L129:   * 【68†Actions】
> L130:   * 【69†Security and quality 0】
> L131:   * 【70†Insights】
> L132: 
> L133: Additional navigation options
> L134: ## Files Expand file tree
> L135: 
> L136: master
> L137: 
> L138: ## Breadcrumbs
> L139: 
> L140:   1. 【71†better-sqlite3】
> L141:   2. /【72†docs】
> L142: 
> L143: /
> L144: 
> L145: # api.md
> L146: 
> L147: Copy path
> L148: 
> L149: [Input: Go to file]
> L150: 
> L151: Blame More file actions
> L152: 
> L153: Blame More file actions
> L154: 
> L155: ## Latest commit
> L156: 
> L157: 
> L158: 
> L159: ## History
> L160: 
> L161: History
> L162: 
> L163: master
> L164: 
> L165: ## Breadcrumbs
> L166: 
> L167:   1. 【71†better-sqlite3】
> L168:   2. /【72†docs】
> L169: 
> L170: /
> L171: 
> L172: # api.md
> L173: 
> L174: Copy path
> L175: 
> L176: Top
> L177: 
> L178: ## File metadata and controls
> L179: 
> L180:   * Preview
> L181: 
> L182:   * Code
> L183: 
> L184:   * Blame
> L185: 
> L186: 695 lines (479 loc) · 36.2 KB
> L187: 
> L188: 【73†Raw】
> L189: 
> L190: Copy raw file
> L191: 
> L192: Download raw file
> L193: 
> L194: Outline
> L195: 
> L196: Edit and raw actions
> L197: # API
> L198: 
> L199:   * 【74†class `Database`】
> L200:   * 【75†class `Statement`】
> L201:   * 【76†class `SqliteError`】
> L202:   * 【77†Binding Parameters】
> L203: # class Database
> L204: 
> L205:   * 【78†new Database()】
> L206:   * 【79†Database#prepare()】 (see 【75†`Statement`】)
> L207:   * 【80†Database#transaction()】
> L208:   * 【81†Database#pragma()】
> L209:   * 【82†Database#explain()】
> L210:   * 【83†Database#backup()】
> L211:   * 【84†Database#serialize()】
> L212:   * 【85†Database#function()】
> L213:   * 【86†Database#aggregate()】
> L214:   * 【87†Database#table()】
> L215:   * 【88†Database#loadExtension()】
> L216:   * 【89†Database#exec()】
> L217:   * 【90†Database#close()】
> L218:   * 【91†Properties】
> L219: ### new Database(path, [options])
> L220: 
> L221: Creates a new database connection. If the database file does not exist, it is created. This happens synchronously, which means you can start executing queries right away. You can create an 【92†in-memory database†www.sqlite.org】 by passing `":memory:"` as the first argument. You can create a temporary database by passing an empty string (or by omitting all arguments).
> L222: > In-memory databases can also be created by passing a buffer returned by 【84†`.serialize()`】, instead of passing a string as the first argument.
> L223: 
> L224: Various options are accepted:
> L225: 
> L226:   * `options.readonly`: open the database connection in readonly mode (default: `false`).
> L227: 
> L228:   * `options.fileMustExist`: if the database does not exist, an `Error` will be thrown instead of creating a new file. This option is ignored for in-memory, temporary, or readonly database connections (default: `false`).
> L229:   * `options.timeout`: the number of milliseconds to wait when executing queries on a locked database, before throwing a `SQLITE_BUSY` error (default: `5000`).
> L230: 
> L231:   * `options.verbose`: provide a function that gets called with every SQL string executed by the database connection (default: `null`).
> L232:   * `options.nativeBinding`: if you're using a complicated build system that moves, transforms, or concatenates your JS files, `better-sqlite3` might have trouble locating its native C++ addon (`better_sqlite3.node`). If you get an error that looks like 【93†this】, you can solve it by using this option to provide the file path of `better_sqlite3.node` (relative to the current working directory).
> L233: 
> L234:     const Database = require('better-sqlite3');
> L235:     const db = new Database('foobar.db', { verbose: console.log });
> L236: ### .prepare(string) -> Statement
> L237: 
> L238: Creates a new prepared 【75†`Statement`】 from the given SQL string.
> L239: 
> L240:     const stmt = db.prepare('SELECT name, age FROM cats');
> L241: ### .transaction(function) -> function
> L242: Creates a function that always runs inside a 【94†transaction†sqlite.org】. When the function is invoked, it will begin a new transaction. When the function returns, the transaction will be committed. If an exception is thrown, the transaction will be rolled back (and the exception will propagate as usual).
> L243: 
> L244:     const insert = db.prepare('INSERT INTO cats (name, age) VALUES (@name, @age)');
> L245: 
> L246:     const insertMany = db.transaction((cats) => {
> L247:       for (const cat of cats) insert.run(cat);
> L248:     });
> L249:     insertMany([
> L250:       { name: 'Joey', age: 2 },
> L251:       { name: 'Sally', age: 4 },
> L252:       { name: 'Junior', age: 1 },
> L253:     ]);
> L254: Transaction functions can be called from inside other transaction functions. When doing so, the inner transaction becomes a 【95†savepoint†www.sqlite.org】.
> L255: If an error is thrown inside of a nested transaction function, the nested transaction function will roll back to the state just before the savepoint and rethrow the error. If the error is not caught in the outer transaction function, this will cause the outer transaction function to roll back as well.
> L256: 
> L257:     const newExpense = db.prepare('INSERT INTO expenses (note, dollars) VALUES (?, ?)');
> L258: 
> L259:     const adopt = db.transaction((cats) => {
> L260:       newExpense.run('adoption fees', 20);
> L261:       insertMany(cats); // nested transaction
> L262:     });
> L263: Transactions also come with `deferred`, `immediate`, and `exclusive` versions.
> L264: 
> L265:     insertMany(cats); // uses "BEGIN"
> L266:     insertMany.deferred(cats); // uses "BEGIN DEFERRED"
> L267:     insertMany.immediate(cats); // uses "BEGIN IMMEDIATE"
> L268:     insertMany.exclusive(cats); // uses "BEGIN EXCLUSIVE"
> L269: Any arguments passed to the transaction function will be forwarded to the wrapped function, and any values returned from the wrapped function will be returned from the transaction function. The wrapped function will also have access to the same 【96†`this`†developer.mozilla.org】 binding as the transaction function.
> L270: #### Caveats
> L271: 
> L272: If you'd like to manage transactions manually, you're free to do so with regular 【79†prepared statements】 (using `BEGIN`, `COMMIT`, etc.). However, manually managed transactions should not be mixed with transactions managed by this `.transaction()` method. In other words, using raw `COMMIT` or `ROLLBACK` statements inside a transaction function is not supported.
> L273: Transaction functions do not work with async functions. Technically speaking, async functions always return after the first `await`, which means the transaction will already be committed before any async code executes. Also, because SQLite serializes all transactions, it's generally a very bad idea to keep a transaction open across event loop ticks anyways.
> L274: It's important to know that SQLite may sometimes rollback a transaction without us asking it to. This can happen either because of an 【97†`ON CONFLICT`†sqlite.org】 clause, the 【98†`RAISE()`†www.sqlite.org】 trigger function, or certain errors such as `SQLITE_FULL` or `SQLITE_BUSY`. In other words, if you catch an SQLite error within a transaction, you must be aware that any further SQL that you execute might not be within the same transaction.
> L275: Usually, the best course of action for such cases is to simply re-throw the error, exiting the transaction function.
> L276: 
> L277:     try {
> L278:       ...
> L279:     } catch (err) {
> L280:       if (!db.inTransaction) throw err; // (transaction was forcefully rolled back)
> L281:       ...
> L282:     }
> L283: ### .pragma(string, [options]) -> results
> L284: 
> L285: Executes the given PRAGMA and returns its result. By default, the return value will be an array of result rows. Each row is represented by an object whose keys correspond to column names.
> L286: Since most PRAGMA statements return a single value, the `simple` option is provided to make things easier. When `simple` is `true`, only the first column of the first row will be returned.
> L287: 
> L288:     db.pragma('cache_size = 32000');
> L289:     console.log(db.pragma('cache_size', { simple: true })); // => 32000
> L290: 
> L291: If execution of the PRAGMA fails, an `Error` is thrown.
> L292: It's better to use this method instead of normal 【79†prepared statements】 when executing PRAGMA, because this method normalizes some odd behavior that may otherwise be experienced. The documentation on SQLite PRAGMA can be found 【99†here†www.sqlite.org】.
> L293: ### .explain(string) -> array of rows
> L294: 
> L295: Runs 【100†`EXPLAIN`†www.sqlite.org】 on the given SQL string and returns the result. By default this returns the low-level 【101†bytecode†www.sqlite.org】 program that SQLite would use to execute the statement (one row per virtual machine instruction). To get the higher-level 【100†query plan†www.sqlite.org】 instead, prefix your SQL with `QUERY PLAN`.
> L296: 
> L297:     db.explain('SELECT * FROM cats WHERE name = ?');
> L298:     db.explain('QUERY PLAN SELECT * FROM cats WHERE name = ?');
> L299: Unlike normal 【79†prepared statements】, the SQL passed to this method may contain 【77†parameters】 that are left unbound. Since `EXPLAIN` only inspects the statement rather than executing it, no parameter values are needed.
> L300: 
> L301: If the given SQL is invalid, an `Error` is thrown.
> L302: ### .backup(destination, [options]) -> promise
>
> --------------------------------------------------------------------------------
> Transaction (https://www.sqlite.org/lang_transaction.html)
> 【turn1view1】 [wordlim: 200] Crawled: 2 months ago; Content type: text/html; Source: open({"ref_id":"https://www.sqlite.org/lang_transaction.html","lineno":null}); Total lines: 75
> ```
>
> </details>
>
> I’ll embed migration SQL in TypeScript so it is included in the compiled build. Migration history will track ordered IDs and SQL checksums. The registry will compare both canonical JSON and its SHA-256 digest, then reuse Task 03 validation when reading persisted definitions. The database provider will depend on validated configuration so invalid configuration cannot open the database.
>
> <details><summary>Ran 5 commands</summary>
>
> - Ran `/Users/tranngochung/.nvm/versions/node/v22.15.1/bin/node /Users/tranngochung/.nvm/versions/node/v22.15.1/lib/node_modules/npm/bin/npm-cli.js install better-sqlite3@12 --save --no-audit --no-fund`
> - Ran ``mkdir -p src/database
> cat > src/database/migrations.ts <<'EOF'
> import { createHash } from 'node:crypto';
> import type Database from 'better-sqlite3';
>
> export interface Migration { readonly id: string; readonly sql: string }
> export const MIGRATIONS: readonly Migration[] = Object.freeze([
>   Object.freeze({
>     id: '001_workflow_versions',
>     sql: `CREATE TABLE workflow_versions (
>       workflow_id TEXT NOT NULL CHECK(length(workflow_id) BETWEEN 1 AND 64),
>       version INTEGER NOT NULL CHECK(version BETWEEN 1 AND 9007199254740991),
>       schema_version INTEGER NOT NULL CHECK(schema_version = 1),
>       definition_json TEXT NOT NULL CHECK(json_valid(definition_json)),
>       definition_sha256 TEXT NOT NULL CHECK(length(definition_sha256) = 64 AND definition_sha256 NOT GLOB '*[^0-9a-f]*'),
>       registered_at TEXT NOT NULL,
>       PRIMARY KEY (workflow_id, version)
>     ) STRICT;`,
>   }),
> ]);
>
> export class DatabaseError extends Error {
>   constructor(readonly code: 'DATABASE_INITIALIZATION_FAILED' | 'MIGRATION_FAILED' | 'MIGRATION_DRIFT' | 'DATABASE_OPERATION_FAILED', message: string) {
>     super(message); this.name = 'DatabaseError';
>   }
> }
> export function migrationChecksum(migration: Migration): string {
>   return createHash('sha256').update(migration.sql, 'utf8').digest('hex');
> }
> export function runMigrations(db: Database.Database, migrations: readonly Migration[] = MIGRATIONS): void {
>   try {
>     db.transaction(() => {
>       db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
>         id TEXT PRIMARY KEY NOT NULL,
>         checksum TEXT NOT NULL CHECK(length(checksum) = 64),
>         applied_at TEXT NOT NULL
>       ) STRICT`);
>       const ids = migrations.map(migration => migration.id);
>       if (new Set(ids).size !== ids.length || ids.some((id, index) => !/^[0-9]{3}_[a-z0-9_]+$/.test(id) || (index > 0 && id <= ids[index - 1]))) {
>         throw new DatabaseError('MIGRATION_DRIFT', 'Migration identifiers must be unique and ordered.');
>       }
>       const applied = db.prepare('SELECT id, checksum FROM schema_migrations ORDER BY id').all();
>       applied.forEach((row, index) => {
>         if (typeof row !== 'object' || row === null || !('id' in row) || !('checksum' in row)) {
>           throw new DatabaseError('MIGRATION_DRIFT', 'Invalid migration history.');
>         }
>         const expected = migrations[index];
>         if (!expected || row.id !== expected.id || row.checksum !== migrationChecksum(expected)) {
>           throw new DatabaseError('MIGRATION_DRIFT', 'Applied migration history does not match this application. Restore the matching migration set.');
>         }
>       });
>       const insert = db.prepare('INSERT INTO schema_migrations (id, checksum, applied_at) VALUES (?, ?, ?)');
>       for (const migration of migrations.slice(applied.length)) {
>         db.exec(migration.sql);
>         insert.run(migration.id, migrationChecksum(migration), new Date().toISOString());
>       }
>     }).immediate();
>   } catch (error) {
>     if (error instanceof DatabaseError) throw error;
>     throw new DatabaseError('MIGRATION_FAILED', 'Database migration failed; no pending migrations were committed.');
>   }
> }
> EOF
> cat > src/database/database.service.ts <<'EOF'
> import { mkdirSync } from 'node:fs';
> import { dirname } from 'node:path';
> import { fileURLToPath } from 'node:url';
> import Database from 'better-sqlite3';
> import type { OnModuleDestroy } from '@nestjs/common';
> import { DatabaseError, runMigrations } from './migrations.js';
>
> export const DATABASE_PATH = Symbol('DATABASE_PATH');
> export const DEFAULT_DATABASE_PATH = fileURLToPath(new URL('../../data/claims.sqlite', import.meta.url));
> export function configuredDatabasePath(): string {
>   const path = process.env.SQLITE_DATABASE_PATH;
>   if (path !== undefined && !path.trim()) throw new DatabaseError('DATABASE_INITIALIZATION_FAILED', 'SQLITE_DATABASE_PATH must not be empty.');
>   // Tests must never silently use the development file.
>   if (path === undefined && process.env.NODE_ENV === 'test') return ':memory:';
>   return path ?? DEFAULT_DATABASE_PATH;
> }
> export class DatabaseService implements OnModuleDestroy {
>   readonly connection: Database.Database;
>   constructor(path: string) {
>     let connection: Database.Database | undefined;
>     try {
>       if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
>       connection = new Database(path, { timeout: 5000 });
>       connection.pragma('foreign_keys = ON');
>       connection.pragma('journal_mode = WAL');
>       connection.pragma('synchronous = FULL');
>       runMigrations(connection);
>       this.connection = connection;
>     } catch (error) {
>       connection?.close();
>       if (error instanceof DatabaseError) throw error;
>       throw new DatabaseError('DATABASE_INITIALIZATION_FAILED', 'Unable to initialize SQLite database. Check the database path and permissions.');
>     }
>   }
>   close(): void { if (this.connection.open) this.connection.close(); }
>   onModuleDestroy(): void { this.close(); }
> }
> EOF
> cat > src/database/database.module.ts <<'EOF'
> import { Module } from '@nestjs/common';
> import { WorkflowModule } from '../workflow/workflow.module.js';
> import { WorkflowConfigService } from '../workflow/workflow-config.service.js';
> import { DatabaseService, DATABASE_PATH, configuredDatabasePath } from './database.service.js';
>
> @Module({
>   imports: [WorkflowModule],
>   providers: [
>     { provide: DATABASE_PATH, useFactory: configuredDatabasePath },
>     {
>       provide: DatabaseService,
>       inject: [WorkflowConfigService, DATABASE_PATH],
>       // Explicit dependency ensures config validation precedes opening SQLite.
>       useFactory: (_config: WorkflowConfigService, path: string) => new DatabaseService(path),
>     },
>   ],
>   exports: [DatabaseService],
> })
> export class DatabaseModule {}
> EOF
> cat > src/workflow/workflow-registry.service.ts <<'EOF'
> import { createHash } from 'node:crypto';
> import type { WorkflowDefinition } from './workflow.types.js';
> import { parseWorkflowJson } from './workflow-config.service.js';
> import { validateWorkflowDefinition } from './workflow-config.validator.js';
> import { DatabaseService } from '../database/database.service.js';
>
> export class WorkflowRegistryError extends Error {
>   constructor(readonly code: 'WORKFLOW_VERSION_CONFLICT' | 'WORKFLOW_VERSION_NOT_FOUND' | 'INVALID_PERSISTED_WORKFLOW' | 'WORKFLOW_STORAGE_FAILED', message: string) {
>     super(message); this.name = 'WorkflowRegistryError';
>   }
> }
> function canonical(value: unknown): string {
>   if (value === null || typeof value !== 'object') {
>     const text = JSON.stringify(value);
>     if (text === undefined) throw new Error('Unsupported JSON value');
>     return text;
>   }
>   if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
>   const record = value as Record<string, unknown>;
>   return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonical(record[key])}`).join(',')}}`;
> }
> export function canonicalWorkflowJson(definition: WorkflowDefinition): string { return canonical(definition); }
> export function workflowDigest(json: string): string { return createHash('sha256').update(json, 'utf8').digest('hex'); }
>
> export interface RegisteredWorkflowVersion {
>   readonly definition: WorkflowDefinition;
>   readonly sha256: string;
>   readonly registeredAt: string;
> }
> export class WorkflowRegistryService {
>   constructor(private readonly database: DatabaseService) {}
>   private decode(row: unknown, workflowId: string, version: number): RegisteredWorkflowVersion {
>     try {
>       if (typeof row !== 'object' || row === null || !('definition_json' in row) || typeof row.definition_json !== 'string' ||
>           !('definition_sha256' in row) || typeof row.definition_sha256 !== 'string' || !('schema_version' in row) ||
>           !('workflow_id' in row) || !('version' in row) || !('registered_at' in row) || typeof row.registered_at !== 'string') throw new Error();
>       const definition = parseWorkflowJson(row.definition_json);
>       const json = canonicalWorkflowJson(definition);
>       if (row.workflow_id !== workflowId || row.version !== version || definition.workflowId !== workflowId || definition.version !== version ||
>           row.schema_version !== definition.schemaVersion || json !== row.definition_json || workflowDigest(json) !== row.definition_sha256 ||
>           !Number.isFinite(Date.parse(row.registered_at)) || new Date(row.registered_at).toISOString() !== row.registered_at) throw new Error();
>       return Object.freeze({ definition, sha256: row.definition_sha256, registeredAt: row.registered_at });
>     } catch { throw new WorkflowRegistryError('INVALID_PERSISTED_WORKFLOW', 'Stored workflow version failed integrity validation.'); }
>   }
>   get(workflowId: string, version: number): RegisteredWorkflowVersion {
>     try {
>       const row = this.database.connection.prepare('SELECT * FROM workflow_versions WHERE workflow_id = ? AND version = ?').get(workflowId, version);
>       if (!row) throw new WorkflowRegistryError('WORKFLOW_VERSION_NOT_FOUND', 'Requested workflow version is not registered.');
>       return this.decode(row, workflowId, version);
>     } catch (error) {
>       if (error instanceof WorkflowRegistryError) throw error;
>       throw new WorkflowRegistryError('WORKFLOW_STORAGE_FAILED', 'Unable to read workflow version.');
>     }
>   }
>   register(definition: WorkflowDefinition): RegisteredWorkflowVersion {
>     // Reuse the exact Task 03 validator, including for future non-startup callers.
>     const validated = validateWorkflowDefinition(definition);
>     const json = canonicalWorkflowJson(validated);
>     const digest = workflowDigest(json);
>     try {
>       return this.database.connection.transaction(() => {
>         const row = this.database.connection.prepare('SELECT * FROM workflow_versions WHERE workflow_id = ? AND version = ?').get(validated.workflowId, validated.version);
>         if (row) {
>           const stored = this.decode(row, validated.workflowId, validated.version);
>           if (stored.sha256 !== digest || canonicalWorkflowJson(stored.definition) !== json) {
>             throw new WorkflowRegistryError('WORKFLOW_VERSION_CONFLICT', 'Workflow identity already exists with different content. Increment the workflow version.');
>           }
>           return stored;
>         }
>         const registeredAt = new Date().toISOString();
>         this.database.connection.prepare('INSERT INTO workflow_versions (workflow_id, version, schema_version, definition_json, definition_sha256, registered_at) VALUES (?, ?, ?, ?, ?, ?)')
>           .run(validated.workflowId, validated.version, validated.schemaVersion, json, digest, registeredAt);
>         return Object.freeze({ definition: validated, sha256: digest, registeredAt });
>       }).immediate();
>     } catch (error) {
>       if (error instanceof WorkflowRegistryError) throw error;
>       throw new WorkflowRegistryError('WORKFLOW_STORAGE_FAILED', 'Unable to register workflow version.');
>     }
>   }
> }
> EOF
> cat > src/workflow/workflow-registry.module.ts <<'EOF'
> import { Module } from '@nestjs/common';
> import { DatabaseModule } from '../database/database.module.js';
> import { DatabaseService } from '../database/database.service.js';
> import { WorkflowModule } from './workflow.module.js';
> import { WorkflowConfigService } from './workflow-config.service.js';
> import { WorkflowRegistryService } from './workflow-registry.service.js';
>
> @Module({
>   imports: [WorkflowModule, DatabaseModule],
>   providers: [{
>     provide: WorkflowRegistryService,
>     inject: [DatabaseService, WorkflowConfigService],
>     useFactory: (database: DatabaseService, config: WorkflowConfigService) => {
>       try {
>         const registry = new WorkflowRegistryService(database);
>         registry.register(config.definition);
>         return registry;
>       } catch (error) {
>         database.close();
>         throw error;
>       }
>     },
>   }],
>   exports: [WorkflowRegistryService],
> })
> export class WorkflowRegistryModule {}
> EOF
> python3 - <<'PY'
> from pathlib import Path
> p=Path('src/app.module.ts'); s=p.read_text().replace("import { WorkflowModule } from './workflow/workflow.module.js';", "import { WorkflowRegistryModule } from './workflow/workflow-registry.module.js';").replace('    WorkflowModule,','    WorkflowRegistryModule,'); p.write_text(s)
> p=Path('src/main.ts');s=p.read_text().replace('  await app.listen', '  app.enableShutdownHooks();\n  await app.listen');p.write_text(s)
> p=Path('.gitignore');s=p.read_text();p.write_text(s+'\n# Local SQLite databases and sidecars\n/data/\n*.sqlite\n*.sqlite-*\n*.db\n*.db-*\n')
> PY``
> - Ran `/Users/tranngochung/.nvm/versions/node/v22.15.1/bin/node /Users/tranngochung/.nvm/versions/node/v22.15.1/lib/node_modules/npm/bin/npm-cli.js install -D @types/better-sqlite3 --no-audit --no-fund`
> - Ran ``cat > src/database/database.spec.ts <<'EOF'
> import { mkdtempSync, rmSync } from 'node:fs';
> import { join } from 'node:path';
> import { tmpdir } from 'node:os';
> import { Test } from '@nestjs/testing';
> import { DatabaseService, DATABASE_PATH, configuredDatabasePath } from './database.service.js';
> import { MIGRATIONS, runMigrations } from './migrations.js';
> import { WorkflowRegistryService, canonicalWorkflowJson, workflowDigest } from '../workflow/workflow-registry.service.js';
> import { WorkflowRegistryModule } from '../workflow/workflow-registry.module.js';
> import { WorkflowConfigService, loadWorkflowDefinition } from '../workflow/workflow-config.service.js';
> import { validateWorkflowDefinition } from '../workflow/workflow-config.validator.js';
>
> let directory: string;
> let database: DatabaseService;
> let registry: WorkflowRegistryService;
> beforeEach(() => {
>   directory = mkdtempSync(join(tmpdir(), 'claims-db-'));
>   database = new DatabaseService(join(directory, 'nested', 'test.sqlite'));
>   registry = new WorkflowRegistryService(database);
> });
> afterEach(() => {
>   database.close();
>   vi.unstubAllEnvs();
>   rmSync(directory, { recursive: true, force: true });
> });
> const definition = () => loadWorkflowDefinition();
> const count = (db: DatabaseService, table: 'workflow_versions' | 'schema_migrations') => db.connection.prepare(`SELECT count(*) AS count FROM ${table}`).get();
>
> describe('SQLite initialization and migrations', () => {
>   it('creates parent directories and expected tables', () => {
>     const tables = database.connection.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
>     expect(tables).toEqual([{ name: 'schema_migrations' }, { name: 'workflow_versions' }]);
>     expect(count(database, 'schema_migrations')).toEqual({ count: 1 });
>   });
>   it('enforces primary key and check constraints', () => {
>     registry.register(definition());
>     expect(() => database.connection.exec('INSERT INTO workflow_versions SELECT * FROM workflow_versions')).toThrow();
>     expect(() => database.connection.exec('UPDATE workflow_versions SET version=0')).toThrow();
>     expect(() => database.connection.exec('UPDATE workflow_versions SET schema_version=2')).toThrow();
>     expect(() => database.connection.exec("UPDATE workflow_versions SET definition_json='bad'")).toThrow();
>     expect(() => database.connection.exec("UPDATE workflow_versions SET definition_sha256='bad'")).toThrow();
>   });
>   it('migrations are idempotent', () => {
>     runMigrations(database.connection); runMigrations(database.connection);
>     expect(count(database, 'schema_migrations')).toEqual({ count: 1 });
>     registry.register(definition()); expect(count(database, 'workflow_versions')).toEqual({ count: 1 });
>   });
>   it('rolls back every pending migration on failure', () => {
>     expect(() => runMigrations(database.connection, [...MIGRATIONS,
>       { id: '002_probe', sql: 'CREATE TABLE probe (id INTEGER)' },
>       { id: '003_fail', sql: 'INVALID SQL' },
>     ])).toThrow('no pending migrations were committed');
>     expect(database.connection.prepare("SELECT name FROM sqlite_master WHERE name='probe'").get()).toBeUndefined();
>     expect(count(database, 'schema_migrations')).toEqual({ count: 1 });
>   });
>   it('detects changed migration SQL', () => {
>     expect(() => runMigrations(database.connection, [{ ...MIGRATIONS[0], sql: MIGRATIONS[0].sql + ' ' }])).toThrow('history does not match');
>   });
>   it('detects an unexpected stored checksum', () => {
>     database.connection.prepare('UPDATE schema_migrations SET checksum=?').run('0'.repeat(64));
>     expect(() => runMigrations(database.connection)).toThrow('history does not match');
>   });
>   it('rejects unknown applied migration history', () => {
>     database.connection.prepare('INSERT INTO schema_migrations VALUES (?, ?, ?)').run('999_unknown', '0'.repeat(64), new Date().toISOString());
>     expect(() => runMigrations(database.connection)).toThrow('history does not match');
>   });
>   it('enforces foreign keys on every new connection', () => {
>     expect(database.connection.pragma('foreign_keys', { simple: true })).toBe(1);
>     database.connection.exec('CREATE TABLE parent(id INTEGER PRIMARY KEY); CREATE TABLE child(parent_id INTEGER REFERENCES parent(id))');
>     expect(() => database.connection.exec('INSERT INTO child VALUES (99)')).toThrow('FOREIGN KEY');
>   });
>   it('closes cleanly and close is idempotent', () => {
>     database.onModuleDestroy(); database.close();
>     expect(database.connection.open).toBe(false);
>   });
>   it('reports database initialization failures without exposing paths', () => {
>     expect(() => new DatabaseService(join(directory, 'nested', 'test.sqlite', 'impossible.sqlite'))).toThrow('Unable to initialize SQLite database');
>   });
>   it('uses in-memory isolation in test mode without an explicit path', () => {
>     vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('SQLITE_DATABASE_PATH', undefined);
>     expect(configuredDatabasePath()).toBe(':memory:');
>   });
>   it('supports explicit paths and rejects empty overrides', () => {
>     vi.stubEnv('SQLITE_DATABASE_PATH', join(directory, 'custom.sqlite'));
>     expect(configuredDatabasePath()).toBe(join(directory, 'custom.sqlite'));
>     vi.stubEnv('SQLITE_DATABASE_PATH', ''); expect(configuredDatabasePath).toThrow('must not be empty');
>   });
> });
>
> describe('immutable workflow registry', () => {
>   it('persists complete canonical definition and expected digest', () => {
>     const value = definition(); const result = registry.register(value);
>     const json = canonicalWorkflowJson(value);
>     expect(result.definition).toEqual(value);
>     expect(result.sha256).toBe(workflowDigest(json));
>     expect(database.connection.prepare('SELECT definition_json, definition_sha256 FROM workflow_versions').get()).toEqual({ definition_json: json, definition_sha256: result.sha256 });
>     expect(new Date(result.registeredAt).toISOString()).toBe(result.registeredAt);
>   });
>   it('identical registration is idempotent and preserves timestamp', () => {
>     const first = registry.register(definition()); const second = registry.register(definition());
>     expect(second).toEqual(first); expect(count(database, 'workflow_versions')).toEqual({ count: 1 });
>   });
>   it('object key ordering does not create conflicts', () => {
>     const original = definition(); registry.register(original);
>     const reordered: unknown = JSON.parse(JSON.stringify(original), (_key: string, value: unknown): unknown => {
>       if (value && typeof value === 'object' && !Array.isArray(value)) return Object.fromEntries(Object.entries(value).reverse());
>       return value;
>     });
>     const result = registry.register(validateWorkflowDefinition(reordered));
>     expect(result.definition).toEqual(original); expect(count(database, 'workflow_versions')).toEqual({ count: 1 });
>   });
>   it('rejects changed content and leaves original record untouched', () => {
>     const value = definition(); const first = registry.register(value);
>     const before = database.connection.prepare('SELECT * FROM workflow_versions').get();
>     expect(() => registry.register({ ...value, limits: { informationRequests: 2 } })).toThrow('Increment the workflow version');
>     expect(database.connection.prepare('SELECT * FROM workflow_versions').get()).toEqual(before);
>     expect(registry.get('claims', 1)).toEqual(first);
>   });
>   it('array order is preserved and affects version identity', () => {
>     const value = definition(); registry.register(value);
>     expect(() => registry.register({ ...value, states: [...value.states].reverse() })).toThrow('different content');
>   });
>   it('higher versions preserve older definitions', () => {
>     const value = definition(); const first = registry.register(value);
>     registry.register({ ...value, version: 2 });
>     expect(registry.get('claims', 1)).toEqual(first); expect(registry.get('claims', 2).definition.version).toBe(2);
>   });
>   it('different workflow IDs can share version numbers', () => {
>     registry.register(definition()); registry.register({ ...definition(), workflowId: 'other' });
>     expect(registry.get('other', 1).definition.workflowId).toBe('other'); expect(count(database, 'workflow_versions')).toEqual({ count: 2 });
>   });
>   it('retrieves full immutable validated definitions', () => {
>     registry.register(definition()); const result = registry.get('claims', 1);
>     expect(result.definition).toEqual(definition());
>     expect(Object.isFrozen(result.definition.transitions[0].preconditions)).toBe(true);
>   });
>   it('reports missing versions', () => { expect(() => registry.get('claims', 99)).toThrow('not registered'); });
>   it.each([
>     ['digest', "UPDATE workflow_versions SET definition_sha256='" + '0'.repeat(64) + "'"],
>     ['content', "UPDATE workflow_versions SET definition_json='{}'"],
>     ['identity', "UPDATE workflow_versions SET workflow_id='other'"],
>     ['timestamp', "UPDATE workflow_versions SET registered_at='bad'"],
>   ])('detects tampered %s', (kind, sql) => {
>     registry.register(definition()); database.connection.exec(sql);
>     expect(() => registry.get(kind === 'identity' ? 'other' : 'claims', 1)).toThrow('integrity validation');
>   });
>   it('rejects a conflicting stored hash even when incoming content matches', () => {
>     registry.register(definition()); database.connection.prepare('UPDATE workflow_versions SET definition_sha256=?').run('0'.repeat(64));
>     expect(() => registry.register(definition())).toThrow('integrity validation');
>   });
>   it('sanitizes database failures', () => {
>     database.close();
>     expect(() => registry.get('claims', 1)).toThrow('Unable to read workflow version');
>     expect(() => registry.register(definition())).toThrow('Unable to register workflow version');
>   });
>   it('persists across database close and reopen', () => {
>     const first = registry.register(definition()); database.close();
>     database = new DatabaseService(join(directory, 'nested', 'test.sqlite'));
>     registry = new WorkflowRegistryService(database);
>     expect(registry.get('claims', 1)).toEqual(first);
>     expect(registry.register(definition())).toEqual(first);
>   });
> });
>
> describe('Nest startup integration', () => {
>   it('registers configuration automatically and closes on shutdown', async () => {
>     const module = await Test.createTestingModule({ imports: [WorkflowRegistryModule] })
>       .overrideProvider(DATABASE_PATH).useValue(join(directory, 'application.sqlite')).compile();
>     try {
>       expect(module.get(WorkflowRegistryService).get('claims', 1).definition).toEqual(definition());
>       expect(module.get(DatabaseService).connection.open).toBe(true);
>     } finally { await module.close(); }
>     expect(module.get(DatabaseService).connection.open).toBe(false);
>   });
>   it('registration conflict prevents startup and closes the opened connection', async () => {
>     registry.register(definition());
>     const module = Test.createTestingModule({ imports: [WorkflowRegistryModule] })
>       .overrideProvider(DatabaseService).useValue(database)
>       .overrideProvider(WorkflowConfigService).useValue({ definition: { ...definition(), limits: { informationRequests: 2 } } });
>     await expect(module.compile()).rejects.toThrow('different content');
>     expect(database.connection.open).toBe(false);
>   });
>   it('invalid configuration prevents opening the database', async () => {
>     const factory = vi.fn(() => database);
>     const module = Test.createTestingModule({ imports: [WorkflowRegistryModule] })
>       .overrideProvider(WorkflowConfigService).useFactory({ factory: () => ({ definition: validateWorkflowDefinition({}) }) })
>       .overrideProvider(DatabaseService).useFactory({ factory, inject: [WorkflowConfigService] });
>     await expect(module.compile()).rejects.toThrow('Workflow configuration invalid');
>     expect(factory).not.toHaveBeenCalled();
>   });
> });
> EOF
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- --reporter=dot``
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm rebuild better-sqlite3`
>
> </details>
>
> The first database test run found a native-binding mismatch: npm’s install script picked up the login shell’s Node 16, while the tests use Node 22. I rebuilt `better-sqlite3` with Node 22 explicitly on `PATH` and will rerun the suite. No driver or architecture change was needed.
>
> <details><summary>Ran 4 commands</summary>
>
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- --reporter=dot`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run build`
> - Ran `python3 - <<'PY'
> from pathlib import Path
> p=Path('src/database/database.module.ts');s=p.read_text().replace("import { DatabaseService", "import { WorkflowConfigurationError } from '../workflow/workflow-config.validator.js';\nimport { DatabaseService").replace('useFactory: (_config: WorkflowConfigService, path: string) => new DatabaseService(path),', """useFactory: (config: WorkflowConfigService, path: string) => {
>         // Nest can resolve a failed dependency as null while unwinding startup.
>         if (!config?.definition) throw new WorkflowConfigurationError(['/: validated workflow configuration is required before database initialization']);
>         return new DatabaseService(path);
>       },""");p.write_text(s)
> p=Path('src/database/database.spec.ts');s=p.read_text().replace("import { mkdtempSync, rmSync }", "import { existsSync, mkdtempSync, rmSync }").replace('  database.close();\n  vi.unstubAllEnvs();', '  database?.close();\n  vi.unstubAllEnvs();');s=s.replace("    const factory = vi.fn(() => database);", "    const path = join(directory, 'invalid-config.sqlite');").replace(".overrideProvider(DatabaseService).useFactory({ factory, inject: [WorkflowConfigService] });", ".overrideProvider(DATABASE_PATH).useValue(path);").replace('    expect(factory).not.toHaveBeenCalled();','    expect(existsSync(path)).toBe(false);');p.write_text(s)
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- --reporter=dot`
> - Ran ````python3 - <<'PY'
> from pathlib import Path
> p=Path('src/workflow/workflow-registry.module.ts');s=p.read_text().replace('        database.close();','        database?.close();');p.write_text(s)
> p=Path('test/app.e2e-spec.ts');s=p.read_text().replace("import { AppModule } from './../src/app.module.js';", "import { AppModule } from './../src/app.module.js';\nimport { DATABASE_PATH } from '../src/database/database.service.js';").replace('    }).compile();', "    }).overrideProvider(DATABASE_PATH).useValue(':memory:').compile();");p.write_text(s)
> p=Path('src/database/database.spec.ts');s=p.read_text().replace("import { join } from 'node:path';", "import { join } from 'node:path';\nimport { createHash } from 'node:crypto';").replace('WorkflowRegistryService, canonicalWorkflowJson, workflowDigest','WorkflowRegistryService, canonicalWorkflowJson').replace('expect(result.sha256).toBe(workflowDigest(json));', "expect(result.sha256).toBe(createHash('sha256').update(json, 'utf8').digest('hex'));\n    expect(json).toMatch(/^\\{\"initialState\":/);")
> p.write_text(s)
> PY
> cat >> README.md <<'EOF'
>
> ## SQLite persistence and workflow registry (Task 04)
>
> The backend uses `better-sqlite3` for short synchronous transactions and explicit
> SQL, without an ORM. `@types/better-sqlite3` supplies development declarations.
> Only `schema_migrations` and `workflow_versions` are created in this task.
>
> ### Runtime and database path
>
> Use the same supported Node version for dependency installation, build, and run.
> The native addon was verified on Node 22.15.1. Existing Angular Devkit dependencies
> require ^22.22.3 (or a compatible newer major), so prefer a runtime satisfying that
> requirement for clean setup. Existing tsconfck/TypeScript 6 peer warnings remain.
> If switching Node versions, run `npm rebuild better-sqlite3` with the intended
> Node executable first on PATH; native addon ABIs differ between Node versions.
> Prebuilt addons may be downloaded during installation; if none is available,
> installation requires the platform's native build toolchain.
>
> Default: `backend/data/claims.sqlite`, resolved relative to the module URL in both
> source and compiled layouts. Override with `SQLITE_DATABASE_PATH`:
>
> ```sh
> SQLITE_DATABASE_PATH=/absolute/writable/path/claims.sqlite npm run start:dev
> ```
>
> An explicit relative path is resolved from the process working directory. Parent
> directories are created. Empty overrides are rejected. `:memory:` is supported.
> With NODE_ENV=test and no override, the default is :memory:; tests needing restart
> coverage explicitly use isolated temporary files and clean up their sidecars.
> The HTTP E2E suite overrides the path with :memory:, regardless of local settings.
>
> Every connection enables foreign keys, a 5000 ms busy timeout, WAL for file
> storage, and synchronous=FULL. In-memory SQLite uses its supported memory journal
> mode. The database closes on module/application close; main enables signal
> shutdown hooks. Abrupt process termination cannot run lifecycle hooks.
>
> ### Startup order and migrations
>
> AppModule imports WorkflowRegistryModule. DatabaseModule imports the pure
> WorkflowModule and explicitly injects WorkflowConfigService before opening the
> database. WorkflowModule itself does not depend on the database or registry, so
> there is no circular dependency:
>
> 1. Load and validate Task 03 JSON configuration.
> 2. Open SQLite and configure connection pragmas.
> 3. Check history and apply pending migrations.
> 4. Register the configured workflow in the registry provider factory.
> 5. Finish application initialization and begin listening.
>
> Initialization failures propagate and prevent startup. Failed database setup
> closes its connection; a registration failure also closes the connection.
> Successful schema migrations remain committed if the later registration fails.
>
> Migrations are SQL strings embedded in `src/database/migrations.ts`, compiled into
> dist, with ordered stable IDs and SHA-256 checksums of exact SQL text.
> `schema_migrations` stores id (primary key), checksum, and applied_at.
> Applied history must be a matching prefix of this application's migration list.
> Changed checksums, unknown IDs, ordering errors, and incompatible histories fail
> explicitly. Never edit an applied migration, including whitespace; append a new
> migration instead. The history setup and all pending migrations run in one
> immediate transaction. Failure rolls back the entire pending batch.
> No down migrations or migration CLI are provided.
>
> Migration 001 creates a STRICT workflow_versions table with:
>
> - Composite primary key (workflow_id, version), also serving exact lookup queries.
> - Positive safe-integer version, schema_version=1, bounded nonempty workflow ID.
> - Complete valid JSON in definition_json.
> - Lowercase 64-character hexadecimal definition_sha256.
> - registered_at in UTC ISO 8601 form, generated by Date.toISOString().
>
> No additional indexes are needed for current identity-based access. Audit,
> claim, receipt, and notification tables are deferred. JSON graph validity and
> column/content identity consistency are enforced by registry validation rather
> than duplicating the Task 03 schema in SQL.
>
> ### Immutable workflow versions
>
> Inject WorkflowRegistryService and use register(definition) or
> get(workflowId, version). Startup passes the already validated configuration;
> registration reuses Task 03 validation for any later caller as well.
>
> Canonical JSON recursively sorts object keys and preserves array order. SHA-256
> is computed over its UTF-8 bytes. This is a deliberately small canonicalizer for
> our validated JSON vocabulary, not a claim of general RFC 8785 compliance.
>
> Registration uses an immediate transaction. New identity: insert complete
> canonical definition, digest, and timestamp. Existing identical identity/content:
> return the original row without updates. Changed content: fail with
> WORKFLOW_VERSION_CONFLICT; use a new version. Different workflow IDs can share
> version numbers. Older records are retained.
>
> Reads validate JSON with Task 03, then verify requested/column/definition
> identities, schema version, canonical serialization, digest, and timestamp.
> Invalid persisted data fails with INVALID_PERSISTED_WORKFLOW. Missing identity
> uses WORKFLOW_VERSION_NOT_FOUND; operational failures use WORKFLOW_STORAGE_FAILED.
> Database initialization/migration errors also have stable codes and safe messages.
> No raw SQL errors, definitions, or database paths are returned in these errors.
> No public endpoints are added.
>
> There are no registry update/delete methods. This is application-level
> immutability: database administrators can alter records and recompute hashes;
> it is not tamper-proof storage. Integrity is checked when a version is read or
> re-registered, not by a full-database scan on every startup. Migration checksums
> check history, not every sqlite_master object for manual edits.
>
> ### Packaging, local files, and verification
>
> Ship dist/, config/, package files, and installed production dependencies,
> including the platform-compatible better-sqlite3 native binding. Config remains
> beside dist as documented in config/README.md; no raw migration assets need
> copying. The database directory must be writable and persist between restarts.
> Backend .gitignore excludes data/, *.sqlite, *.db, and their SQLite sidecars.
> Do not commit local databases or backups; place external-path databases outside
> version-controlled directories too.
>
> From backend:
>
> ```sh
> npm test
> npm run test:e2e
> npm run build
> npm run lint
> npm test -- src/database/database.spec.ts
> ```
>
> Database tests include temporary-file reopen persistence, migration rollback and
> drift, real foreign-key rejection, canonical hashing, conflicts, tampering,
> startup registration/failure, and shutdown. The existing workflow tests remain.
> SQLite remains a local single-writer store; distributed deployment, backup and
> restore tooling, workflow version selection/migration, claim pinning, transition
> execution, authentication, and real side effects are not implemented here.
> EOF
> python3 - <<'PY'
> from pathlib import Path
> p=Path('config/README.md');s=p.read_text().replace('SQLite persistence, version registration/pinning, actor authentication,\ntransition execution, input submission checks, and notification creation are\nnot implemented here. Recommended next step: SQLite migrations and immutable\nworkflow-version registration, followed by transition execution.', 'Task 04 adds SQLite migrations and immutable workflow-version registration; see\n../README.md for persistence and startup details. Claim-version pinning, actor\nauthentication, transition execution, input submission checks, and notification\ncreation remain deferred.')
> p.write_text(s)
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH ./node_modules/.bin/prettier --write src/database/ src/workflow/workflow-registry.service.ts src/workflow/workflow-registry.module.ts src/app.module.ts src/main.ts test/app.e2e-spec.ts````
>
> </details>
>
> All 75 unit and integration tests now pass, including 31 new database/registry tests. They cover rollback, migration drift, content conflicts, persisted-data validation, shutdown, and persistence across a close/reopen. A startup test also exposed Nest invoking a dependent factory with `null` while handling a failed provider; I added a guard and verified that invalid configuration creates no database file.
>
> <details><summary>Ran 7 commands</summary>
>
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run lint`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- --reporter=dot`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- src/database/database.spec.ts`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run build`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run test:e2e`
> - Ran `git diff --stat; git diff -- backend/src backend/test backend/.gitignore backend/package.json; git ls-files --others --exclude-standard; cat backend/node_modules/better-sqlite3/package.json | head -35; git diff --numstat backend/package-lock.json; git diff --check; rg -n 'SQLite persistence|not implemented|Task 04' backend/config/README.md backend/README.md`
> - Ran `/Users/tranngochung/.nvm/versions/node/v22.15.1/bin/node --input-type=module <<'EOF'
> import { mkdtempSync, rmSync } from 'node:fs';
> import { tmpdir } from 'node:os';
> import { join } from 'node:path';
> import { DatabaseService } from './dist/database/database.service.js';
> import { WorkflowRegistryService } from './dist/workflow/workflow-registry.service.js';
> import { loadWorkflowDefinition } from './dist/workflow/workflow-config.service.js';
> const directory = mkdtempSync(join(tmpdir(), 'claims-compiled-'));
> let database;
> try {
>   database = new DatabaseService(join(directory, 'workflow.sqlite'));
>   const first = new WorkflowRegistryService(database).register(loadWorkflowDefinition());
>   database.close();
>   database = new DatabaseService(join(directory, 'workflow.sqlite'));
>   const second = new WorkflowRegistryService(database).get('claims', 1);
>   if (first.sha256 !== second.sha256) throw new Error('Persistence mismatch');
>   console.log('Compiled migration + config assets + SQLite restart: PASS');
> } finally {
>   database?.close();
>   rmSync(directory, { recursive: true, force: true });
> }
> EOF
> python3 - <<'PY'
> import subprocess
> from pathlib import Path
> # Discard only this task's generated compiler cache, preserving the user's staged baseline.
> path=Path('tsconfig.build.tsbuildinfo')
> path.write_bytes(subprocess.check_output(['git','show',':backend/tsconfig.build.tsbuildinfo']))
> PY
> git diff --check; git diff --stat; git status --short src/database src/workflow`
>
> </details>
</details>

Implemented Task 04 completely: SQLite initialization, transactional migrations, and an immutable workflow-version registry.

**1. Implementation and database design**

- Added `better-sqlite3` **12.11.1** and development declarations.
- Default database: `backend/data/claims.sqlite`; override with `SQLITE_DATABASE_PATH`.
- Connections enable foreign keys, WAL, full synchronization, and a bounded busy timeout.
- Shutdown closes the connection.
- Only two tables are created:
  - `schema_migrations`: migration ID primary key, checksum, applied timestamp.
  - `workflow_versions`: composite primary key `(workflow_id, version)`, schema version, complete canonical JSON, SHA-256 digest, registration timestamp.
- Constraints enforce valid JSON, positive versions, and digest format. The composite primary key supports current lookups without additional indexes.
- Embedded TypeScript migrations compile into `dist`; no SQL assets require copying.
- Applied history must match the migration list and checksums. Pending migrations execute atomically.

**2. Immutability and startup**

Canonicalization sorts object keys recursively and preserves array order.

- Identical registration returns the original record and timestamp.
- Changed content under an existing identity fails without updating it.
- New versions and different workflow IDs coexist.
- Retrieval reuses Task 03 validation and verifies identity, schema version, canonical content, digest, and timestamp.
- Returned definitions remain deeply frozen.

Startup is ordered: **validate configuration → open SQLite → run migrations → register workflow → finish initialization**. Failures prevent successful startup; initialization and registration failures close opened connections.

**3. Changed files**

All paths below are under `backend/`.

| File | Purpose |
|---|---|
| [database.service.ts](./backend/src/database/database.service.ts) | Path selection, connection setup, lifecycle |
| [database.module.ts](./backend/src/database/database.module.ts) | Providers and configuration dependency |
| [migrations.ts](./backend/src/database/migrations.ts) | Schema, checksums, transactional migration runner |
| [database.spec.ts](./backend/src/database/database.spec.ts) | 31 new database/registry tests |
| [workflow-registry.service.ts](./backend/src/workflow/workflow-registry.service.ts) | Canonical hashing, registration, integrity-checked retrieval |
| [workflow-registry.module.ts](./backend/src/workflow/workflow-registry.module.ts) | Startup registration |
| `src/app.module.ts` | Imports registry module |
| `src/main.ts` | Enables shutdown hooks |
| `test/app.e2e-spec.ts` | Isolates E2E storage in memory |
| `package.json`, `package-lock.json` | SQLite dependencies |
| `.gitignore` | Excludes databases and sidecars |
| `README.md`, `config/README.md` | Setup, migration, registry, packaging, and limitation documentation |

**4. Verification**

Commands ran from `backend/` with Node **22.15.1** explicitly selected through:

```sh
PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH
```

| Command/check | Actual result |
|---|---|
| `npm test -- --reporter=dot` | **75 passed**, including all 44 prior tests |
| `npm test -- src/database/database.spec.ts` | **31 passed**, including restart persistence |
| `npm run test:e2e` | **1 passed**, with local-port permission |
| `npm run build` | Passed |
| `npm run lint` | Passed |
| Compiled migration/config/restart smoke test | Passed |
| `git diff --check` | Passed |

Initial failures exposed a Node 16/22 native-addon mismatch and a startup dependency edge case. Both were corrected before the successful checks above. The final diff was reviewed; generated compiler-cache changes were discarded.

**5. Limitations and deferred work**

Existing tooling engine/peer warnings remain. The pre-existing Observe worker logged an error during the passing E2E test.

Registry immutability is enforced through application behavior; database administrators can alter records and recompute hashes. Integrity checks occur on retrieval/registration, rather than scanning every stored version at startup.

Deployments must retain `config/` beside `dist/` and install a compatible native SQLite binding.

No claims, transitions, authentication, cycle counting, notifications, audit records, receipts, endpoints, or frontend features were implemented. Recommended next task: claim persistence with workflow-version pinning, followed by transactional transition execution.

> User context
>
> Attachments:
> - # Task 05 — Claim Persistence & Immutable Workflow Version Pinning ## Context W…: `~/.codex/attachments/e9c721cd-68fc-453c-84a2-cdd307643393/Pasted text.txt`

<details><summary>8 previous messages</summary>

> I’ll read Task 05 and inspect the database and registry code before implementing claim persistence and workflow version pinning.
>
> <details><summary>Explored a file, ran a command</summary>
>
> <details><summary>Explored a file</summary>
>
> - Read `~/.codex/attachments/e9c721cd-68fc-453c-84a2-cdd307643393/Pasted text.txt`
>
> </details>
>
> - Ran `cat backend/src/database/migrations.ts backend/src/database/database.module.ts backend/src/workflow/workflow-registry.module.ts backend/src/app.module.ts backend/src/app.controller.ts backend/src/database/database.service.ts backend/package.json; rg -n 'count: 1|schema_migrations|expected tables|toEqual\(\[' backend/src/database/database.spec.ts; cat backend/test/app.e2e-spec.ts; git status --short`
>
> </details>
>
> There’s no identity adapter yet. I’ll protect all claim routes with a small development-only guard: it will require both environment flags and an actor ID from a backend allowlist, and deny access in production. Creation will use the configured workflow version, not the newest database version. I’ll also add a database trigger to prevent later changes to a claim’s pinned workflow identity.
>
> <details><summary>Ran 3 commands</summary>
>
> - Ran ``mkdir -p src/claims
> python3 - <<'PY'
> from pathlib import Path
> p=Path('src/database/migrations.ts');s=p.read_text();needle='  }),\n]);';replacement='''  }),
>   Object.freeze({
>     id: '002_claims',
>     sql: `CREATE TABLE claims (
>       id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),
>       workflow_id TEXT NOT NULL,
>       workflow_version INTEGER NOT NULL CHECK(workflow_version BETWEEN 1 AND 9007199254740991),
>       state TEXT NOT NULL CHECK(length(trim(state)) BETWEEN 1 AND 64),
>       title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 120),
>       description TEXT NOT NULL CHECK(length(trim(description)) BETWEEN 1 AND 2000),
>       revision INTEGER NOT NULL DEFAULT 0 CHECK(revision BETWEEN 0 AND 9007199254740991),
>       created_at TEXT NOT NULL CHECK(length(created_at) = 24),
>       updated_at TEXT NOT NULL CHECK(length(updated_at) = 24),
>       FOREIGN KEY (workflow_id, workflow_version) REFERENCES workflow_versions(workflow_id, version)
>     ) STRICT;
>     CREATE INDEX claims_created_at_id ON claims(created_at DESC, id DESC);
>     CREATE INDEX claims_workflow_reference ON claims(workflow_id, workflow_version);
>     CREATE TRIGGER claims_workflow_immutable
>     BEFORE UPDATE OF workflow_id, workflow_version ON claims
>     WHEN OLD.workflow_id != NEW.workflow_id OR OLD.workflow_version != NEW.workflow_version
>     BEGIN SELECT RAISE(ABORT, 'Claim workflow reference is immutable'); END;`,
>   }),
> ]);'''; assert needle in s;s=s.replace(needle,replacement);p.write_text(s)
> p=Path('src/database/database.spec.ts');s=p.read_text().replace("expect(tables).toEqual([", "expect(tables).toEqual([\n      { name: 'claims' },").replace("count(database, 'schema_migrations')).toEqual({ count: 1 })", "count(database, 'schema_migrations')).toEqual({ count: 2 })").replace("id: '002_probe'", "id: '003_probe'").replace("id: '003_fail'", "id: '004_fail'");p.write_text(s)
> p=Path('src/app.module.ts');s=p.read_text().replace("import { WorkflowRegistryModule }", "import { ClaimsModule } from './claims/claims.module.js';\nimport { WorkflowRegistryModule }").replace('    WorkflowRegistryModule,','    WorkflowRegistryModule,\n    ClaimsModule,');p.write_text(s)
> PY
> cat > src/claims/claim.types.ts <<'EOF'
> export interface Claim {
>   readonly id: string;
>   readonly workflowId: string;
>   readonly workflowVersion: number;
>   readonly state: string;
>   readonly title: string;
>   readonly description: string;
>   readonly revision: number;
>   readonly createdAt: string;
>   readonly updatedAt: string;
> }
> export interface CreateClaimDto { readonly title: string; readonly description: string }
> export interface ClaimPage { readonly items: readonly Claim[]; readonly limit: number; readonly offset: number }
> export class ClaimError extends Error {
>   constructor(readonly code: 'INVALID_REQUEST' | 'CLAIM_NOT_FOUND' | 'CLAIM_STORAGE_FAILED' | 'CLAIM_WORKFLOW_UNAVAILABLE', readonly status: 400 | 404 | 500, message: string) {
>     super(message); this.name = 'ClaimError';
>   }
> }
> function invalid(message: string): never { throw new ClaimError('INVALID_REQUEST', 400, message); }
> export function validateCreateClaim(value: unknown): CreateClaimDto {
>   if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid('Expected a title and description object.');
>   const record = value as Record<string, unknown>;
>   if (Object.keys(record).some(key => key !== 'title' && key !== 'description')) return invalid('Only title and description are accepted.');
>   const text = (field: string, maximum: number): string => {
>     const input = record[field];
>     if (typeof input !== 'string' || !input.trim() || input.length > maximum) return invalid(`${field} must be nonempty text of at most ${maximum} characters.`);
>     return input.trim();
>   };
>   return { title: text('title', 120), description: text('description', 2000) };
> }
> export function validatePagination(limit: number = 50, offset: number = 0): { limit: number; offset: number } {
>   if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(offset) || offset < 0) return invalid('limit must be 1–100 and offset must be a nonnegative safe integer.');
>   return { limit, offset };
> }
> export function parseClaimQuery(value: unknown): { limit: number; offset: number } {
>   if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid('Invalid pagination query.');
>   const query = value as Record<string, unknown>;
>   if (Object.keys(query).some(key => key !== 'limit' && key !== 'offset')) return invalid('Only limit and offset query parameters are accepted.');
>   const number = (key: string, fallback: number): number => {
>     const input = query[key];
>     if (input === undefined) return fallback;
>     if (typeof input !== 'string' || !/^(0|[1-9][0-9]{0,15})$/.test(input)) return invalid(`Invalid ${key}.`);
>     return Number(input);
>   };
>   return validatePagination(number('limit', 50), number('offset', 0));
> }
> EOF
> cat > src/claims/claim.service.ts <<'EOF'
> import { randomUUID } from 'node:crypto';
> import { DatabaseService } from '../database/database.service.js';
> import { WorkflowConfigService } from '../workflow/workflow-config.service.js';
> import { WorkflowRegistryService } from '../workflow/workflow-registry.service.js';
> import type { RegisteredWorkflowVersion } from '../workflow/workflow-registry.service.js';
> import { ClaimError, validateCreateClaim, validatePagination } from './claim.types.js';
> import type { Claim, ClaimPage } from './claim.types.js';
>
> const SELECT = `SELECT id, workflow_id AS workflowId, workflow_version AS workflowVersion,
>   state, title, description, revision, created_at AS createdAt, updated_at AS updatedAt FROM claims`;
> export class ClaimService {
>   constructor(private readonly database: DatabaseService, private readonly registry: WorkflowRegistryService, private readonly config: WorkflowConfigService) {}
>   create(input: unknown): Claim {
>     const dto = validateCreateClaim(input);
>     try {
>       return this.database.connection.transaction(() => {
>         const workflow = this.registry.get(this.config.definition.workflowId, this.config.definition.version).definition;
>         const timestamp = new Date().toISOString();
>         const claim: Claim = {
>           id: randomUUID(), workflowId: workflow.workflowId, workflowVersion: workflow.version,
>           state: workflow.initialState, title: dto.title, description: dto.description,
>           revision: 0, createdAt: timestamp, updatedAt: timestamp,
>         };
>         this.database.connection.prepare(`INSERT INTO claims
>           (id, workflow_id, workflow_version, state, title, description, revision, created_at, updated_at)
>           VALUES (@id, @workflowId, @workflowVersion, @state, @title, @description, @revision, @createdAt, @updatedAt)`).run(claim);
>         return this.get(claim.id);
>       }).immediate();
>     } catch { throw new ClaimError('CLAIM_STORAGE_FAILED', 500, 'Unable to create claim.'); }
>   }
>   get(id: string): Claim {
>     if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw new ClaimError('CLAIM_NOT_FOUND', 404, 'Claim not found.');
>     try {
>       const claim = this.database.connection.prepare<[string], Claim>(`${SELECT} WHERE id = ?`).get(id);
>       if (!claim) throw new ClaimError('CLAIM_NOT_FOUND', 404, 'Claim not found.');
>       return Object.freeze(claim);
>     } catch (error) {
>       if (error instanceof ClaimError) throw error;
>       throw new ClaimError('CLAIM_STORAGE_FAILED', 500, 'Unable to retrieve claim.');
>     }
>   }
>   list(limit = 50, offset = 0): ClaimPage {
>     validatePagination(limit, offset);
>     try {
>       const items = this.database.connection.prepare<[number, number], Claim>(`${SELECT} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`).all(limit, offset);
>       return Object.freeze({ items: Object.freeze(items.map(item => Object.freeze(item))), limit, offset });
>     } catch { throw new ClaimError('CLAIM_STORAGE_FAILED', 500, 'Unable to list claims.'); }
>   }
>   resolveWorkflow(id: string): RegisteredWorkflowVersion {
>     const claim = this.get(id);
>     try { return this.registry.get(claim.workflowId, claim.workflowVersion); }
>     catch { throw new ClaimError('CLAIM_WORKFLOW_UNAVAILABLE', 500, 'Pinned workflow is unavailable or invalid.'); }
>   }
> }
> EOF
> cat > src/claims/claims-http.ts <<'EOF'
> import { ArgumentsHost, Catch, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
> import type { CanActivate, ExceptionFilter, ExecutionContext, PipeTransform } from '@nestjs/common';
> import type { Request, Response } from 'express';
> import { ClaimError, parseClaimQuery, validateCreateClaim } from './claim.types.js';
>
> // Local development selection, not authentication or ownership enforcement.
> export const DEMO_ACTORS = Object.freeze({ 'claimant-1': Object.freeze({ role: 'claimant' }), 'adjuster-1': Object.freeze({ role: 'adjuster' }) });
> @Injectable()
> export class ClaimsDemoGuard implements CanActivate {
>   canActivate(context: ExecutionContext): boolean {
>     if (process.env.NODE_ENV !== 'development' || process.env.DEMO_IDENTITY_ENABLED !== 'true') {
>       throw new ForbiddenException({ error: { code: 'DEMO_IDENTITY_DISABLED', message: 'Claim API requires enabled development demo identity.' } });
>     }
>     const actor = context.switchToHttp().getRequest<Request>().headers['x-demo-actor-id'];
>     if (typeof actor !== 'string' || !Object.hasOwn(DEMO_ACTORS, actor)) {
>       throw new UnauthorizedException({ error: { code: 'IDENTITY_REQUIRED', message: 'Select a backend-allowlisted demo actor.' } });
>     }
>     return true;
>   }
> }
> export class CreateClaimPipe implements PipeTransform<unknown> { transform(value: unknown) { return validateCreateClaim(value); } }
> export class ClaimQueryPipe implements PipeTransform<unknown> { transform(value: unknown) { return parseClaimQuery(value); } }
> @Catch(ClaimError)
> export class ClaimExceptionFilter implements ExceptionFilter<ClaimError> {
>   catch(error: ClaimError, host: ArgumentsHost): void {
>     host.switchToHttp().getResponse<Response>().status(error.status).json({ error: { code: error.code, message: error.message } });
>   }
> }
> EOF
> cat > src/claims/claims.controller.ts <<'EOF'
> import { Body, Controller, Get, Param, Post, Query, UseFilters, UseGuards } from '@nestjs/common';
> import { ClaimService } from './claim.service.js';
> import type { CreateClaimDto } from './claim.types.js';
> import { ClaimExceptionFilter, ClaimQueryPipe, ClaimsDemoGuard, CreateClaimPipe } from './claims-http.js';
>
> @Controller('api/claims')
> @UseGuards(ClaimsDemoGuard)
> @UseFilters(ClaimExceptionFilter)
> export class ClaimsController {
>   constructor(private readonly claims: ClaimService) {}
>   @Post()
>   create(@Body(new CreateClaimPipe()) input: CreateClaimDto) { return this.claims.create(input); }
>   @Get()
>   list(@Query(new ClaimQueryPipe()) query: { limit: number; offset: number }) { return this.claims.list(query.limit, query.offset); }
>   @Get(':id')
>   get(@Param('id') id: string) { return this.claims.get(id); }
> }
> EOF
> cat > src/claims/claims.module.ts <<'EOF'
> import { Module } from '@nestjs/common';
> import { DatabaseModule } from '../database/database.module.js';
> import { DatabaseService } from '../database/database.service.js';
> import { WorkflowModule } from '../workflow/workflow.module.js';
> import { WorkflowConfigService } from '../workflow/workflow-config.service.js';
> import { WorkflowRegistryModule } from '../workflow/workflow-registry.module.js';
> import { WorkflowRegistryService } from '../workflow/workflow-registry.service.js';
> import { ClaimService } from './claim.service.js';
> import { ClaimsController } from './claims.controller.js';
> import { ClaimsDemoGuard } from './claims-http.js';
> @Module({
>   imports: [DatabaseModule, WorkflowModule, WorkflowRegistryModule],
>   controllers: [ClaimsController],
>   providers: [ClaimsDemoGuard, {
>     provide: ClaimService,
>     inject: [DatabaseService, WorkflowRegistryService, WorkflowConfigService],
>     useFactory: (database: DatabaseService, registry: WorkflowRegistryService, config: WorkflowConfigService) => new ClaimService(database, registry, config),
>   }],
>   exports: [ClaimService],
> })
> export class ClaimsModule {}
> EOF
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run build``
> - Ran ``cat > src/claims/claim.service.spec.ts <<'EOF'
> import { mkdtempSync, rmSync } from 'node:fs';
> import { join } from 'node:path';
> import { tmpdir } from 'node:os';
> import { randomUUID } from 'node:crypto';
> import Database from 'better-sqlite3';
> import { DatabaseService } from '../database/database.service.js';
> import { MIGRATIONS, migrationChecksum, runMigrations } from '../database/migrations.js';
> import { WorkflowRegistryService } from '../workflow/workflow-registry.service.js';
> import { WorkflowConfigService } from '../workflow/workflow-config.service.js';
> import { ClaimService } from './claim.service.js';
> let directory: string;
> let db: DatabaseService;
> let registry: WorkflowRegistryService;
> let config: WorkflowConfigService;
> let service: ClaimService;
> const input = { title: 'Laptop damage', description: 'Screen damaged in transport.' };
> beforeEach(() => {
>   directory = mkdtempSync(join(tmpdir(), 'claims-service-'));
>   db = new DatabaseService(join(directory, 'test.sqlite'));
>   registry = new WorkflowRegistryService(db); config = new WorkflowConfigService();
>   registry.register(config.definition); service = new ClaimService(db, registry, config);
> });
> afterEach(() => { db?.close(); vi.restoreAllMocks(); rmSync(directory, { recursive: true, force: true }); });
> describe('claim persistence and pinning', () => {
>   it('creates a persisted claim with initial state, zero revision, UUID and UTC timestamps', () => {
>     const before = Date.now(); const claim = service.create(input);
>     expect(claim).toMatchObject({ ...input, workflowId: 'claims', workflowVersion: 1, state: 'draft', revision: 0 });
>     expect(claim.id).toMatch(/^[0-9a-f-]{36}$/);
>     expect(Date.parse(claim.createdAt)).toBeGreaterThanOrEqual(before);
>     expect(new Date(claim.createdAt).toISOString()).toBe(claim.createdAt);
>     expect(claim.updatedAt).toBe(claim.createdAt); expect(service.get(claim.id)).toEqual(claim);
>   });
>   it('trims required text', () => { expect(service.create({ title: '  Title  ', description: '\n Details\t' })).toMatchObject({ title: 'Title', description: 'Details' }); });
>   it.each([
>     {}, null, [], { title: '', description: 'x' }, { title: ' \t\n', description: 'x' },
>     { title: 'x', description: '　 ' }, { title: 5, description: 'x' }, { title: 'x', description: {} },
>     { title: 'x'.repeat(121), description: 'x' }, { title: 'x', description: 'x'.repeat(2001) },
>     { ...input, state: 'approved' }, { ...input, roles: ['adjuster'] },
>   ])('rejects invalid creation input %j', value => {
>     expect(() => service.create(value)).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST', status: 400 }));
>     expect(service.list().items).toHaveLength(0);
>   });
>   it('accepts exactly maximum-length business fields', () => {
>     expect(service.create({ title: 'x'.repeat(120), description: 'x'.repeat(2000) }).description).toHaveLength(2000);
>   });
>   it('reports unknown and malformed claim IDs with a stable code', () => {
>     for (const id of [randomUUID(), 'not-a-uuid']) expect(() => service.get(id)).toThrow(expect.objectContaining({ code: 'CLAIM_NOT_FOUND', status: 404 }));
>   });
>   it('paginates with stable ordering including equal timestamps', () => {
>     const a = service.create(input); const b = service.create(input); const c = service.create(input);
>     db.connection.prepare('UPDATE claims SET created_at=?').run(a.createdAt);
>     const expected = [a.id, b.id, c.id].sort().reverse();
>     expect(service.list(2, 0).items.map(claim => claim.id)).toEqual(expected.slice(0, 2));
>     expect(service.list(2, 2).items.map(claim => claim.id)).toEqual(expected.slice(2));
>     expect(service.list(2, 3)).toEqual({ items: [], limit: 2, offset: 3 });
>     expect(service.list()).toMatchObject({ limit: 50, offset: 0 });
>   });
>   it.each([[0, 0], [101, 0], [1.5, 0], [10, -1], [10, Number.MAX_SAFE_INTEGER + 1]])('rejects invalid pagination %j %j', (limit, offset) => {
>     expect(() => service.list(limit, offset)).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
>   });
>   it('does not choose latest registered version or rewrite existing claims', () => {
>     const claim = service.create(input);
>     registry.register({ ...config.definition, version: 2, initialState: 'submitted',
>       states: config.definition.states.filter(state => state.id !== 'draft'),
>       transitions: config.definition.transitions.filter(transition => transition.from !== 'draft'),
>     });
>     expect(service.get(claim.id)).toEqual(claim);
>     expect(service.resolveWorkflow(claim.id).definition.version).toBe(1);
>     expect(service.resolveWorkflow(claim.id).definition.initialState).toBe('draft');
>     expect(service.create(input).workflowVersion).toBe(1);
>   });
>   it('uses exact configured version initial state for new claims', () => {
>     const version2 = { ...config.definition, version: 2, initialState: 'submitted', states: config.definition.states.filter(state => state.id !== 'draft'), transitions: config.definition.transitions.filter(transition => transition.from !== 'draft') };
>     registry.register(version2);
>     const configured = { definition: version2 } as WorkflowConfigService;
>     const newService = new ClaimService(db, registry, configured);
>     const claim = newService.create(input);
>     expect(claim).toMatchObject({ workflowVersion: 2, state: 'submitted' });
>     expect(newService.resolveWorkflow(claim.id).definition).toEqual(version2);
>   });
>   it('refuses unregistered configured versions without inserting claims', () => {
>     const configured = { definition: { ...config.definition, version: 99 } } as WorkflowConfigService;
>     expect(() => new ClaimService(db, registry, configured).create(input)).toThrow(expect.objectContaining({ code: 'CLAIM_STORAGE_FAILED' }));
>     expect(service.list().items).toHaveLength(0);
>   });
>   it('database foreign keys reject nonexistent references', () => {
>     const claim = service.create(input);
>     expect(() => db.connection.prepare('INSERT INTO claims SELECT ?, workflow_id, 99, state, title, description, revision, created_at, updated_at FROM claims WHERE id=?').run(randomUUID(), claim.id)).toThrow('FOREIGN KEY');
>   });
>   it('database prevents repinning to an existing version', () => {
>     const claim = service.create(input); registry.register({ ...config.definition, version: 2 });
>     expect(() => db.connection.prepare('UPDATE claims SET workflow_version=2 WHERE id=?').run(claim.id)).toThrow('immutable');
>     expect(service.get(claim.id).workflowVersion).toBe(1);
>   });
>   it('database rejects invalid required fields and revisions', () => {
>     service.create(input);
>     for (const sql of ["UPDATE claims SET title=''", "UPDATE claims SET description=NULL", "UPDATE claims SET state=' '", 'UPDATE claims SET revision=-1', 'UPDATE claims SET revision=1.5']) expect(() => db.connection.exec(sql)).toThrow();
>     expect(service.list().items[0].revision).toBe(0);
>   });
>   it('migration rerun preserves workflow and claim rows', () => {
>     const original = service.create(input); runMigrations(db.connection); runMigrations(db.connection);
>     expect(service.get(original.id)).toEqual(original); expect(registry.get('claims', 1).definition).toEqual(config.definition);
>   });
>   it('upgrades a Task 04 database without changing registered workflows', () => {
>     const file = join(directory, 'old.sqlite'); const old = new Database(file);
>     try { runMigrations(old, [MIGRATIONS[0]]); } finally { old.close(); }
>     const upgraded = new DatabaseService(file);
>     try { expect(upgraded.connection.prepare("SELECT name FROM sqlite_master WHERE name='claims'").get()).toEqual({ name: 'claims' }); }
>     finally { upgraded.close(); }
>   });
>   it('persists claims and pinning across close/reopen', () => {
>     const claim = service.create(input); db.close(); db = new DatabaseService(join(directory, 'test.sqlite'));
>     registry = new WorkflowRegistryService(db); service = new ClaimService(db, registry, config);
>     expect(service.get(claim.id)).toEqual(claim); expect(service.resolveWorkflow(claim.id).definition.version).toBe(1);
>   });
>   it('sanitizes database errors', () => {
>     const claim = service.create(input); db.close();
>     expect(() => service.create(input)).toThrow(expect.objectContaining({ code: 'CLAIM_STORAGE_FAILED', message: 'Unable to create claim.' }));
>     expect(() => service.get(claim.id)).toThrow('Unable to retrieve claim.');
>     expect(() => service.list()).toThrow('Unable to list claims.');
>   });
>   it('fails safely if pinned workflow content becomes invalid', () => {
>     const claim = service.create(input); db.connection.exec("UPDATE workflow_versions SET definition_json='{}'");
>     expect(() => service.resolveWorkflow(claim.id)).toThrow(expect.objectContaining({ code: 'CLAIM_WORKFLOW_UNAVAILABLE' }));
>   });
>   it('keeps migration 001 checksum unchanged', () => {
>     expect(migrationChecksum(MIGRATIONS[0])).toBe('REPLACE_BASELINE_HASH');
>   });
> });
> EOF
> python3 - <<'PY'
> from pathlib import Path
> import subprocess,re,hashlib
> baseline=subprocess.check_output(['git','show',':backend/src/database/migrations.ts']).decode()
> sql=re.search(r'sql: `(.+?)`',baseline,re.S).group(1)
> p=Path('src/claims/claim.service.spec.ts');p.write_text(p.read_text().replace('REPLACE_BASELINE_HASH',hashlib.sha256(sql.encode()).hexdigest()))
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- --reporter=dot``
> - Ran ``cat > test/claims.e2e-spec.ts <<'EOF'
> import { Test } from '@nestjs/testing';
> import type { INestApplication } from '@nestjs/common';
> import request from 'supertest';
> import { randomUUID } from 'node:crypto';
> import { ClaimsModule } from '../src/claims/claims.module.js';
> import { DATABASE_PATH, DatabaseService } from '../src/database/database.service.js';
> let app: INestApplication;
> const input = { title: 'Laptop damage', description: 'Screen damaged during transport.' };
> const actor = 'claimant-1';
> beforeEach(async () => {
>   vi.stubEnv('NODE_ENV', 'development'); vi.stubEnv('DEMO_IDENTITY_ENABLED', 'true');
>   const module = await Test.createTestingModule({ imports: [ClaimsModule] }).overrideProvider(DATABASE_PATH).useValue(':memory:').compile();
>   app = module.createNestApplication(); await app.init();
> });
> afterEach(async () => { await app?.close(); vi.unstubAllEnvs(); });
> describe('claims HTTP', () => {
>   it('creates with 201 and explicit response fields', async () => {
>     const response = await request(app.getHttpServer()).post('/api/claims').set('X-Demo-Actor-Id', actor).send({ title: '  Laptop damage  ', description: input.description }).expect(201);
>     expect(Object.keys(response.body).sort()).toEqual(['id', 'workflowId', 'workflowVersion', 'state', 'title', 'description', 'revision', 'createdAt', 'updatedAt'].sort());
>     expect(response.body).toMatchObject({ ...input, workflowId: 'claims', workflowVersion: 1, state: 'draft', revision: 0 });
>     expect(response.body.createdAt).toBe(response.body.updatedAt);
>     expect(response.body.id).toMatch(/^[a-f0-9-]{36}$/);
>   });
>   it('retrieves a persisted claim', async () => {
>     const created = await request(app.getHttpServer()).post('/api/claims').set('X-Demo-Actor-Id', actor).send(input).expect(201);
>     const read = await request(app.getHttpServer()).get(`/api/claims/${created.body.id}`).set('X-Demo-Actor-Id', actor).expect(200);
>     expect(read.body).toEqual(created.body);
>   });
>   it('lists claims in the documented page envelope', async () => {
>     await request(app.getHttpServer()).post('/api/claims').set('X-Demo-Actor-Id', actor).send(input).expect(201);
>     const page = await request(app.getHttpServer()).get('/api/claims?limit=1&offset=0').set('X-Demo-Actor-Id', actor).expect(200);
>     expect(page.body).toMatchObject({ limit: 1, offset: 0, items: [expect.objectContaining({ workflowId: 'claims', workflowVersion: 1 })] });
>     const empty = await request(app.getHttpServer()).get('/api/claims?limit=1&offset=1').set('X-Demo-Actor-Id', actor).expect(200);
>     expect(empty.body.items).toEqual([]);
>   });
>   it('returns a safe 404 for missing claims', async () => {
>     const result = await request(app.getHttpServer()).get(`/api/claims/${randomUUID()}`).set('X-Demo-Actor-Id', actor).expect(404);
>     expect(result.body).toEqual({ error: { code: 'CLAIM_NOT_FOUND', message: 'Claim not found.' } });
>   });
>   it.each([{}, { title: ' ', description: 'x' }, { title: 'x', description: 1 }, { title: 'x'.repeat(121), description: 'x' }])('rejects invalid payload %j', async payload => {
>     const result = await request(app.getHttpServer()).post('/api/claims').set('X-Demo-Actor-Id', actor).send(payload).expect(400);
>     expect(result.body.error.code).toBe('INVALID_REQUEST');
>   });
>   it.each(['id', 'state', 'revision', 'created_at', 'updated_at', 'workflow_id', 'workflow_version', 'workflowId', 'workflowVersion', 'roles', 'actorId', 'extra'])('rejects protected or unknown field %s', async field => {
>     const result = await request(app.getHttpServer()).post('/api/claims').set('X-Demo-Actor-Id', actor).send({ ...input, [field]: 'override' }).expect(400);
>     expect(result.body.error.code).toBe('INVALID_REQUEST');
>   });
>   it.each(['limit=101', 'limit=0', 'offset=-1', 'limit=1.5', 'limit=1&limit=2', 'extra=1'])('rejects invalid pagination %s', async query => {
>     const result = await request(app.getHttpServer()).get(`/api/claims?${query}`).set('X-Demo-Actor-Id', actor).expect(400);
>     expect(result.body.error.code).toBe('INVALID_REQUEST');
>   });
>   it('rejects missing identity', async () => {
>     const result = await request(app.getHttpServer()).post('/api/claims').send(input).expect(401);
>     expect(result.body.error.code).toBe('IDENTITY_REQUIRED');
>   });
>   it.each(['admin', '__proto__', 'constructor'])('rejects unknown actor %s', async id => {
>     await request(app.getHttpServer()).post('/api/claims').set('X-Demo-Actor-Id', id).send(input).expect(401);
>   });
>   it.each([
>     ['production', 'true'], ['production', 'false'], ['test', 'true'], ['development', 'false'], ['', 'true'],
>   ])('fails closed in NODE_ENV=%s DEMO_IDENTITY_ENABLED=%s', async (environment, enabled) => {
>     vi.stubEnv('NODE_ENV', environment); vi.stubEnv('DEMO_IDENTITY_ENABLED', enabled);
>     const result = await request(app.getHttpServer()).post('/api/claims').set('X-Demo-Actor-Id', actor).send(input).expect(403);
>     expect(result.body.error.code).toBe('DEMO_IDENTITY_DISABLED');
>     await request(app.getHttpServer()).get('/api/claims').set('X-Demo-Actor-Id', actor).expect(403);
>     await request(app.getHttpServer()).get(`/api/claims/${randomUUID()}`).set('X-Demo-Actor-Id', actor).expect(403);
>   });
>   it('returns sanitized 500 on storage failure', async () => {
>     app.get(DatabaseService).close();
>     const result = await request(app.getHttpServer()).post('/api/claims').set('X-Demo-Actor-Id', actor).send(input).expect(500);
>     expect(result.body).toEqual({ error: { code: 'CLAIM_STORAGE_FAILED', message: 'Unable to create claim.' } });
>   });
> });
> EOF
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run test:e2e``
>
> </details>
>
> The claim service tests pass, including version pinning, database reopen persistence, constraints, and input validation. The HTTP suite also passes: creation returns 201, reads return the documented shapes, protected fields are rejected, and every claim route fails closed outside enabled development demo mode. No new dependencies were needed.
>
> <details><summary>Explored 3 files, a list, ran 7 commands</summary>
>
> - Ran ````python3 - <<'PY'
> from pathlib import Path
> p=Path('src/claims/claim.service.ts');s=p.read_text().replace("import { WorkflowRegistryService }", "import { WorkflowRegistryService, WorkflowRegistryError }").replace("    } catch { throw new ClaimError('CLAIM_STORAGE_FAILED', 500, 'Unable to create claim.'); }", """    } catch (error) {
>       if (error instanceof WorkflowRegistryError) throw new ClaimError('CLAIM_WORKFLOW_UNAVAILABLE', 500, 'Configured workflow is unavailable or invalid.');
>       throw new ClaimError('CLAIM_STORAGE_FAILED', 500, 'Unable to create claim.');
>     }""");p.write_text(s)
> p=Path('src/claims/claim.service.spec.ts');s=p.read_text().replace(' as WorkflowConfigService;', ';').replace("new ClaimService(db, registry, configured).create(input)).toThrow(expect.objectContaining({ code: 'CLAIM_STORAGE_FAILED' }));", "new ClaimService(db, registry, configured).create(input)).toThrow(expect.objectContaining({ code: 'CLAIM_WORKFLOW_UNAVAILABLE' }));")
> s=s.replace("try { runMigrations(old, [MIGRATIONS[0]]); } finally { old.close(); }", """try {
>       runMigrations(old, [MIGRATIONS[0]]);
>       const stored = db.connection.prepare('SELECT * FROM workflow_versions').get();
>       if (!stored || typeof stored !== 'object') throw new Error('Missing fixture workflow');
>       old.prepare('INSERT INTO workflow_versions (workflow_id, version, schema_version, definition_json, definition_sha256, registered_at) VALUES (@workflow_id, @version, @schema_version, @definition_json, @definition_sha256, @registered_at)').run(stored);
>     } finally { old.close(); }""").replace("try { expect(upgraded.connection.prepare(\"SELECT name FROM sqlite_master WHERE name='claims'\").get()).toEqual({ name: 'claims' }); }", """try {
>       expect(upgraded.connection.prepare("SELECT name FROM sqlite_master WHERE name='claims'").get()).toEqual({ name: 'claims' });
>       expect(new WorkflowRegistryService(upgraded).get('claims', 1)).toEqual(registry.get('claims', 1));
>     }""")
> p.write_text(s)
> PY
> cat >> README.md <<'EOF'
>
> ## Claim persistence and pinned workflows (Task 05)
>
> Migration `002_claims` appends the claims table without changing migration 001.
> It stores server-generated UUIDs, workflow_id/version, state, title, description,
> revision (default zero), and created/updated UTC ISO 8601 timestamps. NOT NULL,
> STRICT typing, length/range checks, and a composite foreign key protect data.
> The foreign key rejects unregistered workflow references and prevents deleting
> referenced versions. A trigger rejects changes to either workflow identity field
> on existing claims, even when the proposed version exists. No claim update or
> transition API is implemented.
>
> The `(created_at DESC, id DESC)` index supports ordered page reads. The workflow
> reference index supports foreign-key lookups. Previously registered versions are
> preserved during upgrade. Migration checksum validation remains active.
>
> ClaimService uses the startup-configured workflow identity/version, resolves it
> through WorkflowRegistryService inside the creation transaction, and takes that
> version's initial state. It never automatically selects the latest stored
> version. Existing claims retain their original reference, and resolveWorkflow(id)
> retrieves exactly that version, irrespective of later registrations or startup
> configuration changes. Creation does not accept workflow selection overrides.
>
> ### Minimal API and development boundary
>
> All claim routes require both NODE_ENV=development and
> DEMO_IDENTITY_ENABLED=true, plus X-Demo-Actor-Id equal to claimant-1 or adjuster-1.
> IDs and roles are backend-owned; client role/actor payload properties are rejected.
> Unknown/missing actors return 401 IDENTITY_REQUIRED. Disabled/misconfigured or
> production mode returns 403 DEMO_IDENTITY_DISABLED, including for reads.
> A production flag never enables the demo mechanism. NODE_ENV=test also denies
> these routes unless the isolated HTTP test explicitly selects development mode.
>
> This actor selection is **not production authentication**. There is no ownership,
> assignment, or role authorization policy yet: either allowlisted local actor may
> create/read all demo claims. Claims do not yet record an owner. Use only local,
> non-sensitive demo data. A production authentication adapter is deferred; claim
> routes remain inaccessible in production. For local use, bind the process to
> loopback externally if needed; this task does not change the existing listener.
>
> Start from backend:
>
> ```sh
> NODE_ENV=development DEMO_IDENTITY_ENABLED=true npm run start:dev
> ```
>
> POST /api/claims accepts exactly title and description. Both must be strings,
> nonempty after trimming; title is limited to 120 UTF-16 code units and description
> to 2000, measured before trimming. Unknown/protected fields are rejected rather
> than removed. DTO pipes and the service share the same validation functions;
> service callers cannot bypass business-field checks.
>
> ```sh
> curl -X POST http://localhost:3000/api/claims \
>   -H 'Content-Type: application/json' \
>   -H 'X-Demo-Actor-Id: claimant-1' \
>   -d '{"title":"Laptop damage","description":"Screen damaged during transport."}'
> ```
>
> 201 response (illustrative ID/timestamps):
>
> ```json
> {
>   "id": "d6721ff3-9ae4-41f6-8dc4-1bb2effe5dbc",
>   "workflowId": "claims",
>   "workflowVersion": 1,
>   "state": "draft",
>   "title": "Laptop damage",
>   "description": "Screen damaged during transport.",
>   "revision": 0,
>   "createdAt": "2026-10-19T10:00:00.000Z",
>   "updatedAt": "2026-10-19T10:00:00.000Z"
> }
> ```
>
> GET /api/claims/:id returns that shape with 200, or 404 CLAIM_NOT_FOUND.
> GET /api/claims?limit=50&offset=0 returns:
>
> ```json
> { "items": [], "limit": 50, "offset": 0 }
> ```
>
> The items array contains claim objects. Default limit is 50; valid limits are
> 1–100 and offset is a nonnegative safe integer. Repeated/unknown query parameters,
> fractional values, and out-of-range values return 400 INVALID_REQUEST. Ordering
> is newest createdAt first, then descending ID to resolve ties. Offset pagination
> is deterministic for unchanged data; concurrent inserts can shift page offsets.
> No total-count query is performed.
>
> Invalid business input returns 400 INVALID_REQUEST. Storage failures return
> 500 CLAIM_STORAGE_FAILED. Unavailable/invalid selected or pinned workflows return
> 500 CLAIM_WORKFLOW_UNAVAILABLE. Domain errors use:
>
> ```json
> { "error": { "code": "CLAIM_NOT_FOUND", "message": "Claim not found." } }
> ```
>
> Raw SQLite errors, paths, digests, and stored definitions are not exposed.
> Malformed JSON is rejected by the existing HTTP body parser. Creation is not
> idempotent: retrying a successful POST can create another claim.
>
> ### Tests and deferred work
>
> ```sh
> npm test
> npm test -- src/claims/claim.service.spec.ts
> npm run test:e2e
> npm run build
> npm run lint
> ```
>
> Service tests use isolated temporary files with cleanup and include a database
> close/reopen test, upgrade from migration 001, immutable-reference checks, and
> version-specific initial states. HTTP tests override SQLite with :memory: and
> restore development environment overrides after each test. Existing tests remain.
>
> Deferred: claim ownership/authentication and authorization, transitions,
> precondition execution, cycle counting, notifications, audits, receipts, and
> frontend features. The next task should establish demo ownership/access rules
> before adding transactional workflow execution.
> EOF
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH ./node_modules/.bin/prettier --write src/claims src/database/migrations.ts src/database/database.spec.ts src/app.module.ts test/claims.e2e-spec.ts````
>
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run lint`
>
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- src/claims/claim.service.spec.ts`
>
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- --reporter=dot`
>
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run build`
>
> - Ran `cat src/claims/claim.service.ts; git diff --stat; git diff -- src/database/migrations.ts src/database/database.spec.ts src/app.module.ts; git ls-files --others --exclude-standard; git diff --check; PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH ./node_modules/.bin/tsc --noEmit --incremental false`
>
> <details><summary>Explored 3 files, a list</summary>
>
> - Listed files in `supertest`
> - Read `./node_modules/@types/supertest/package.json`
> - Read `./tsconfig.build.json`
> - Read `./src/claims/claims-http.ts`
>
> </details>
>
> - Ran `python3 - <<'PY'
> from pathlib import Path
> p=Path('test/app.e2e-spec.ts');s=p.read_text().replace("import { App } from 'supertest/types';", "import type { App } from 'supertest/types.js';");p.write_text(s)
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH ./node_modules/.bin/tsc --noEmit --incremental false`
>
> </details>
>
> The full unit suite now passes with 109 tests; build and lint pass too. The upgrade test confirms migration 002 preserves the registered workflow, and the checksum test confirms migration 001’s SQL is unchanged. A supplemental type-check found an existing extensionless Supertest type import; I corrected it for NodeNext, and the type-check passes. I’m finishing the E2E rerun and diff review.
>
> <details><summary>Ran 2 commands</summary>
>
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run test:e2e`
> - Ran ``python3 - <<'PY'
> from pathlib import Path
> import subprocess,re
> baseline=subprocess.check_output(['git','show',':backend/src/database/migrations.ts']).decode()
> current=Path('src/database/migrations.ts').read_text()
> old=re.search(r'sql: `(.+?)`',baseline,re.S).group(1)
> new=re.search(r'sql: `(.+?)`',current,re.S).group(1)
> assert old == new
> print('Migration 001 SQL unchanged: PASS')
> Path('tsconfig.build.tsbuildinfo').write_bytes(subprocess.check_output(['git','show',':backend/tsconfig.build.tsbuildinfo']))
> PY
> git diff --check; git diff --stat; git ls-files --others --exclude-standard; git diff -- test/app.e2e-spec.ts; rg -n '\bany\b|INSERT INTO|UPDATE|DELETE' src/claims src/database/migrations.ts``
>
> </details>
</details>

Implemented Task 05: persistent claims, immutable workflow version pinning, and guarded create/read APIs. No dependencies were added.

**Implementation and schema**

Migration `002_claims` adds the claims table with a composite foreign key to registered workflow versions, required-field and numeric constraints, pagination indexes, and a trigger preventing workflow reference changes. Migration 001’s SQL remains unchanged.

Creation validates and trims business fields, generates the UUID and UTC timestamps, sets revision zero, and uses the exact configured registered workflow’s initial state. Existing claims retain their original version after newer versions are registered or the database is reopened.

**Changed files**

Under `backend/`:

| Files | Purpose |
|---|---|
| [claim.service.ts](./backend/src/claims/claim.service.ts) | Transactional creation, retrieval, pagination, pinned workflow resolution |
| [claim.types.ts](./backend/src/claims/claim.types.ts) | DTOs, responses, validation, stable errors |
| `claims.controller.ts`, `claims.module.ts` | Routes and dependency wiring |
| `claims-http.ts` | DTO pipes, error filter, development identity guard |
| `claim.service.spec.ts`, `test/claims.e2e-spec.ts` | 70 new test cases |
| `src/database/migrations.ts` | Append-only claims migration |
| `src/database/database.spec.ts` | Updated migration expectations |
| `src/app.module.ts` | Registers claims module |
| `test/app.e2e-spec.ts` | Corrects existing NodeNext type import |
| `README.md` | API, schema, security boundary, and setup documentation |

**API**

- `POST /api/claims` → `201`
- `GET /api/claims?limit=50&offset=0` → `200`
- `GET /api/claims/:id` → `200` or `404`

Create request:

```json
{"title":"Laptop damage","description":"Screen damaged during transport."}
```

Responses include `id`, `workflowId`, `workflowVersion`, `state`, `title`, `description`, `revision`, `createdAt`, and `updatedAt`. List responses use `{items, limit, offset}`. Maximum page size is 100.

Unknown/protected fields return `400`; storage failures return sanitized errors.

**Security boundary**

Every claim route requires:

- `NODE_ENV=development`
- `DEMO_IDENTITY_ENABLED=true`
- An allowlisted `X-Demo-Actor-Id`: `claimant-1` or `adjuster-1`

Production and improperly configured requests fail closed. This is local demo identity, **not production authentication**. Ownership and role authorization remain deferred; either allowed actor can access all demo claims.

**Verification**

Commands ran from `backend/` using Node **22.15.1** on `PATH`.

| Command | Result |
|---|---|
| `npm test -- --reporter=dot` | **109 passed** |
| `npm test -- src/claims/claim.service.spec.ts` | **34 passed**, including persistence/reopen and pinning |
| `npm run test:e2e` | **37 passed** |
| `npm run build` | Passed |
| `npm run lint` | Passed |
| `tsc --noEmit --incremental false` | Passed |
| `git diff --check` | Passed |

The existing Observe worker error appeared during the passing E2E run. Generated compiler-cache changes were discarded during final review.

Transitions, cycle counting, notifications, audits, receipts, full authentication, and frontend work remain unimplemented. Recommended next task: establish claim ownership/access rules before transactional workflow execution.

> User context
>
> Attachments:
> - # Task 06 — Claim Ownership & Role-Based Access Control ## Context We are build…: `~/.codex/attachments/b450cf21-c4a3-4da8-8280-7af47c562f85/Pasted text.txt`

<details><summary>8 previous messages</summary>

> I’ll read Task 06 and inspect the current claim and identity boundary before implementing ownership and access control.
>
> <details><summary>Explored a file, ran a command</summary>
>
> <details><summary>Explored a file</summary>
>
> - Read `~/.codex/attachments/b450cf21-c4a3-4da8-8280-7af47c562f85/Pasted text.txt`
>
> </details>
>
> - Ran `cat backend/src/claims/claim.service.ts backend/src/claims/claim.types.ts backend/src/claims/claims-http.ts backend/src/claims/claims.controller.ts backend/src/claims/claims.module.ts; cat backend/src/database/migrations.ts; cat backend/package.json; git status --short; rg -n 'service\.|newService\.|new ClaimService|count: 2|003_probe|004_fail' backend/src/claims/claim.service.spec.ts backend/src/database/database.spec.ts; rg -n 'ownership|owner|either|34|claimant-1|adjuster-1' backend/README.md backend/test/claims.e2e-spec.ts`
>
> </details>
>
> I’ll keep legacy claims unowned, visible only to adjusters. New claims will get their owner from a validated backend actor, and a database trigger will prevent ownership changes. I’ll add `claimant-2` to test cross-owner access, pass verified identity through the HTTP boundary, and apply access filtering in SQL before pagination.
>
> <details><summary>Ran 5 commands</summary>
>
> - Ran ``cat > src/claims/claim-access.ts <<'EOF'
> import type { ActorRole } from '../workflow/workflow.types.js';
> import { ClaimError } from './claim.types.js';
>
> const verified = Symbol('verified-demo-actor');
> export interface VerifiedActor {
>   readonly id: string;
>   readonly role: ActorRole;
>   readonly [verified]: true;
> }
> const actors = new Map<string, VerifiedActor>();
> const trusted = new WeakSet<object>();
> for (const [id, role] of [
>   ['claimant-1', 'claimant'], ['claimant-2', 'claimant'], ['adjuster-1', 'adjuster'],
> ] as const) {
>   const actor: VerifiedActor = Object.freeze({ id, role, [verified]: true });
>   actors.set(id, actor); trusted.add(actor);
> }
> export function resolveDemoActor(id: unknown): VerifiedActor {
>   const actor = typeof id === 'string' ? actors.get(id) : undefined;
>   if (!actor) throw new ClaimError('IDENTITY_REQUIRED', 401, 'Select a backend-allowlisted demo actor.');
>   return actor;
> }
> export function requireVerifiedActor(actor: unknown): VerifiedActor {
>   if (typeof actor !== 'object' || actor === null || !trusted.has(actor)) {
>     throw new ClaimError('IDENTITY_REQUIRED', 401, 'Verified actor identity is required.');
>   }
>   // Re-identify only after proving reference membership; no client object is trusted.
>   for (const candidate of actors.values()) if (candidate === actor) return candidate;
>   throw new ClaimError('IDENTITY_REQUIRED', 401, 'Verified actor identity is required.');
> }
> export function authorizeClaimCreation(value: unknown): VerifiedActor {
>   const actor = requireVerifiedActor(value);
>   if (actor.role !== 'claimant') throw new ClaimError('CLAIM_CREATION_FORBIDDEN', 403, 'Claim creation is not permitted.');
>   return actor;
> }
> /** null means all claims for adjusters; otherwise filter to this exact owner. */
> export function claimReadOwner(value: unknown): string | null {
>   const actor = requireVerifiedActor(value);
>   return actor.role === 'adjuster' ? null : actor.id;
> }
> EOF
> python3 - <<'PY'
> from pathlib import Path
> p=Path('src/database/migrations.ts');s=p.read_text().replace('  }),\n]);', '''  }),
>   Object.freeze({
>     id: '003_claim_ownership',
>     sql: `ALTER TABLE claims ADD COLUMN owner_actor_id TEXT
>       CHECK(owner_actor_id IS NULL OR (length(trim(owner_actor_id)) BETWEEN 1 AND 64 AND owner_actor_id = trim(owner_actor_id)));
>     CREATE INDEX claims_owner_created_at_id ON claims(owner_actor_id, created_at DESC, id DESC);
>     CREATE TRIGGER claims_owner_immutable
>     BEFORE UPDATE OF owner_actor_id ON claims
>     WHEN OLD.owner_actor_id IS NOT NEW.owner_actor_id
>     BEGIN SELECT RAISE(ABORT, 'Claim ownership is immutable'); END;`,
>   }),
> ]);''');p.write_text(s)
> p=Path('src/claims/claim.types.ts');s=p.read_text().replace('  readonly id: string;','  readonly id: string;\n  readonly ownerActorId: string | null;').replace("      | 'INVALID_REQUEST'", "      | 'IDENTITY_REQUIRED'\n      | 'CLAIM_CREATION_FORBIDDEN'\n      | 'INVALID_REQUEST'").replace('readonly status: 400 | 404 | 500','readonly status: 400 | 401 | 403 | 404 | 500');p.write_text(s)
> p=Path('src/claims/claim.service.ts');s=p.read_text().replace("import { randomUUID } from 'node:crypto';", "import { randomUUID } from 'node:crypto';\nimport { authorizeClaimCreation, claimReadOwner } from './claim-access.js';\nimport type { VerifiedActor } from './claim-access.js';").replace('SELECT id, workflow_id','SELECT id, owner_actor_id AS ownerActorId, workflow_id').replace('create(input: unknown): Claim {', 'create(input: unknown, identity: VerifiedActor): Claim {\n    const actor = authorizeClaimCreation(identity);').replace('            id: randomUUID(),','            id: randomUUID(),\n            ownerActorId: actor.id,').replace('(id, workflow_id, workflow_version, state, title, description, revision, created_at, updated_at)', '(id, owner_actor_id, workflow_id, workflow_version, state, title, description, revision, created_at, updated_at)').replace('VALUES (@id, @workflowId', 'VALUES (@id, @ownerActorId, @workflowId').replace('return this.get(claim.id);','return this.get(claim.id, actor);').replace('get(id: string): Claim {','get(id: string, actor: VerifiedActor): Claim {\n    const owner = claimReadOwner(actor);')
> s=s.replace('const claim = this.database.connection\n        .prepare<[string], Claim>(`${SELECT} WHERE id = ?`)\n        .get(id);', '''const claim = owner === null
>         ? this.database.connection.prepare<[string], Claim>(`${SELECT} WHERE id = ?`).get(id)
>         : this.database.connection.prepare<[string, string], Claim>(`${SELECT} WHERE id = ? AND owner_actor_id = ?`).get(id, owner);''')
> s=s.replace('list(limit = 50, offset = 0): ClaimPage {','list(actor: VerifiedActor, limit = 50, offset = 0): ClaimPage {\n    const owner = claimReadOwner(actor);')
> start=s.index('      const items = this.database.connection',s.index('  list('));end=s.index('      return Object.freeze',start)
> s=s[:start]+'''      const items = owner === null
>         ? this.database.connection.prepare<[number, number], Claim>(`${SELECT} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`).all(limit, offset)
>         : this.database.connection.prepare<[string, number, number], Claim>(`${SELECT} WHERE owner_actor_id = ? ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`).all(owner, limit, offset);
> '''+s[end:]
> s=s.replace('resolveWorkflow(id: string): RegisteredWorkflowVersion {\n    const claim = this.get(id);','resolveWorkflow(id: string, actor: VerifiedActor): RegisteredWorkflowVersion {\n    const claim = this.get(id, actor);');p.write_text(s)
> p=Path('src/claims/claims-http.ts');s=p.read_text().replace('  UnauthorizedException,','  createParamDecorator,').replace("import type { Request, Response } from 'express';", "import type { Request, Response } from 'express';\nimport { resolveDemoActor, requireVerifiedActor } from './claim-access.js';\nimport type { VerifiedActor } from './claim-access.js';")
> a=s.index('// Local development selection');b=s.index('@Injectable()',a)
> s=s[:a]+'''// Request-scoped identity is private to this module and never sourced from a body.
> const requestActors = new WeakMap<Request, VerifiedActor>();
> export const CurrentActor = createParamDecorator((_data: unknown, context: ExecutionContext): VerifiedActor => {
>   return requireVerifiedActor(requestActors.get(context.switchToHttp().getRequest<Request>()));
> });
> '''+s[b:]
> a=s.index('    const actor = context.switchToHttp()');b=s.index('    return true;',a)
> s=s[:a]+'''    const request = context.switchToHttp().getRequest<Request>();
>     requestActors.set(request, resolveDemoActor(request.headers['x-demo-actor-id']));
> '''+s[b:];p.write_text(s)
> p=Path('src/claims/claims.controller.ts');s=p.read_text().replace("import type { CreateClaimDto }", "import type { VerifiedActor } from './claim-access.js';\nimport type { CreateClaimDto }").replace('  CreateClaimPipe,','  CreateClaimPipe,\n  CurrentActor,').replace('create(@Body(new CreateClaimPipe()) input: CreateClaimDto)', 'create(@Body(new CreateClaimPipe()) input: CreateClaimDto, @CurrentActor() actor: VerifiedActor)').replace('this.claims.create(input)','this.claims.create(input, actor)').replace('list(@Query(new ClaimQueryPipe()) query: { limit: number; offset: number })','list(@Query(new ClaimQueryPipe()) query: { limit: number; offset: number }, @CurrentActor() actor: VerifiedActor)').replace('this.claims.list(query.limit, query.offset)','this.claims.list(actor, query.limit, query.offset)').replace("get(@Param('id') id: string)", "get(@Param('id') id: string, @CurrentActor() actor: VerifiedActor)").replace('this.claims.get(id)','this.claims.get(id, actor)');p.write_text(s)
> p=Path('src/database/database.spec.ts');s=p.read_text().replace("count(database, 'schema_migrations')).toEqual({ count: 2 })", "count(database, 'schema_migrations')).toEqual({ count: 3 })").replace("id: '003_probe'", "id: '004_probe'").replace("id: '004_fail'", "id: '005_fail'");p.write_text(s)
> PY
> /Users/tranngochung/.nvm/versions/node/v22.15.1/bin/node --input-type=module <<'EOF'
> import ts from 'typescript';
> import { readFileSync, writeFileSync } from 'node:fs';
> const file = 'src/claims/claim.service.spec.ts';
> let text = readFileSync(file, 'utf8');
> const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
> const edits = [];
> function visit(node) {
>   if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
>     const method = node.expression.name.text;
>     const target = node.expression.expression.getText(source);
>     if ((target === 'service' || target === 'newService' || target.startsWith('new ClaimService(')) && ['create', 'get', 'list', 'resolveWorkflow'].includes(method)) {
>       if (method === 'list') edits.push([node.arguments.pos, node.arguments.length ? 'claimant, ' : 'claimant']);
>       else edits.push([node.arguments.end, ', claimant']);
>     }
>   }
>   ts.forEachChild(node, visit);
> }
> visit(source);
> for (const [pos, insert] of edits.sort((a,b) => b[0]-a[0])) text = text.slice(0,pos)+insert+text.slice(pos);
> text = "import { resolveDemoActor } from './claim-access.js';\nconst claimant = resolveDemoActor('claimant-1');\n"+text;
> writeFileSync(file,text);
> EOF
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run build``
> - Ran `python3 - <<'PY'
> from pathlib import Path
> p=Path('src/claims/claim-access.ts');s=p.read_text().replace('[verified]: true });','[verified]: true as const });');p.write_text(s)
> p=Path('src/claims/claim.service.spec.ts');s=p.read_text().replace("INSERT INTO claims SELECT ?, workflow_id, 99, state, title, description, revision, created_at, updated_at FROM claims WHERE id=?", "INSERT INTO claims (id, workflow_id, workflow_version, state, title, description, revision, created_at, updated_at) SELECT ?, workflow_id, 99, state, title, description, revision, created_at, updated_at FROM claims WHERE id=?");p.write_text(s)
> p=Path('test/claims.e2e-spec.ts');s=p.read_text().replace("        'id',", "        'ownerActorId',\n        'id',");p.write_text(s)
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- --reporter=dot
> sed -n '30,65p' test/claims.e2e-spec.ts`
> - Ran ``cat > src/claims/claim-access.spec.ts <<'EOF'
> import { mkdtempSync, rmSync } from 'node:fs';
> import { join } from 'node:path';
> import { tmpdir } from 'node:os';
> import { randomUUID } from 'node:crypto';
> import Database from 'better-sqlite3';
> import { DatabaseService } from '../database/database.service.js';
> import { MIGRATIONS, migrationChecksum, runMigrations } from '../database/migrations.js';
> import { WorkflowRegistryService } from '../workflow/workflow-registry.service.js';
> import { WorkflowConfigService } from '../workflow/workflow-config.service.js';
> import { ClaimService } from './claim.service.js';
> import { authorizeClaimCreation, claimReadOwner, requireVerifiedActor, resolveDemoActor } from './claim-access.js';
> const first = resolveDemoActor('claimant-1');
> const second = resolveDemoActor('claimant-2');
> const adjuster = resolveDemoActor('adjuster-1');
> const input = { title: 'Device damage', description: 'Screen damaged during delivery.' };
> let directory: string;
> let database: DatabaseService;
> let registry: WorkflowRegistryService;
> let config: WorkflowConfigService;
> let service: ClaimService;
> beforeEach(() => {
>   directory = mkdtempSync(join(tmpdir(), 'claim-access-'));
>   database = new DatabaseService(join(directory, 'claims.sqlite'));
>   registry = new WorkflowRegistryService(database); config = new WorkflowConfigService();
>   registry.register(config.definition); service = new ClaimService(database, registry, config);
> });
> afterEach(() => { database?.close(); vi.unstubAllEnvs(); rmSync(directory, { recursive: true, force: true }); });
> function legacy(): string {
>   const id = randomUUID(); const timestamp = new Date().toISOString();
>   database.connection.prepare(`INSERT INTO claims (id, workflow_id, workflow_version, state, title, description, created_at, updated_at)
>     VALUES (?, 'claims', 1, 'draft', 'Legacy', 'Unknown creator', ?, ?)`).run(id, timestamp, timestamp);
>   return id;
> }
> describe('claim ownership and centralized access policy', () => {
>   it('assigns verified claimant as owner and permits own reads', () => {
>     const claim = service.create(input, first);
>     expect(claim.ownerActorId).toBe(first.id); expect(service.get(claim.id, first)).toEqual(claim);
>     expect(database.connection.prepare('SELECT owner_actor_id FROM claims WHERE id=?').get(claim.id)).toEqual({ owner_actor_id: first.id });
>   });
>   it('conceals cross-owner and missing claims with identical errors', () => {
>     const claim = service.create(input, first);
>     for (const id of [claim.id, randomUUID()]) expect(() => service.get(id, second)).toThrow(expect.objectContaining({ code: 'CLAIM_NOT_FOUND', status: 404, message: 'Claim not found.' }));
>     expect(() => service.resolveWorkflow(claim.id, second)).toThrow(expect.objectContaining({ code: 'CLAIM_NOT_FOUND' }));
>   });
>   it('filters before pagination and preserves ordering', () => {
>     const a = service.create(input, first); const b = service.create(input, second);
>     const c = service.create(input, first); const d = service.create(input, second); const e = service.create(input, first);
>     [a, b, c, d, e].forEach((claim, index) => database.connection.prepare('UPDATE claims SET created_at=? WHERE id=?').run(`2026-10-19T10:00:0${index}.000Z`, claim.id));
>     expect(service.list(first, 2).items.map(claim => claim.id)).toEqual([e.id, c.id]);
>     expect(service.list(first, 2, 2).items.map(claim => claim.id)).toEqual([a.id]);
>     expect(service.list(second).items.map(claim => claim.id)).toEqual([d.id, b.id]);
>     expect(service.list(adjuster, 2).items.map(claim => claim.id)).toEqual([e.id, d.id]);
>   });
>   it('allows adjuster reads for different owners and legacy rows', () => {
>     const a = service.create(input, first); const b = service.create(input, second); const id = legacy();
>     expect(service.get(a.id, adjuster)).toEqual(a); expect(service.get(b.id, adjuster)).toEqual(b);
>     expect(service.get(id, adjuster).ownerActorId).toBeNull(); expect(service.list(adjuster).items).toHaveLength(3);
>   });
>   it('hides unowned rows from all claimants', () => {
>     const id = legacy();
>     for (const actor of [first, second]) {
>       expect(service.list(actor).items).toEqual([]);
>       expect(() => service.get(id, actor)).toThrow(expect.objectContaining({ code: 'CLAIM_NOT_FOUND' }));
>     }
>   });
>   it('denies adjuster creation with a stable error', () => {
>     expect(() => service.create(input, adjuster)).toThrow(expect.objectContaining({ code: 'CLAIM_CREATION_FORBIDDEN', status: 403 }));
>     expect(service.list(adjuster).items).toEqual([]);
>   });
>   it('does not accept fabricated actor objects in direct service calls', () => {
>     for (const actor of [undefined, { id: first.id, role: 'claimant' }, { ...first }, { id: second.id, role: 'adjuster' }]) {
>       expect(() => Reflect.apply(service.create, service, [input, actor])).toThrow(expect.objectContaining({ code: 'IDENTITY_REQUIRED' }));
>       expect(() => Reflect.apply(service.list, service, [actor])).toThrow(expect.objectContaining({ code: 'IDENTITY_REQUIRED' }));
>       expect(() => Reflect.apply(service.get, service, [randomUUID(), actor])).toThrow(expect.objectContaining({ code: 'IDENTITY_REQUIRED' }));
>     }
>     expect(service.list(adjuster).items).toEqual([]);
>   });
>   it('keeps identity and role values frozen and backend-owned', () => {
>     expect(Reflect.set(first, 'role', 'adjuster')).toBe(false); expect(first.role).toBe('claimant');
>     expect(requireVerifiedActor(first)).toBe(first); expect(claimReadOwner(first)).toBe(first.id);
>     expect(claimReadOwner(adjuster)).toBeNull(); expect(authorizeClaimCreation(second)).toBe(second);
>   });
>   it.each([undefined, 'unknown', '__proto__', 'constructor', ['claimant-1']])('rejects unknown identity %j', actor => {
>     expect(() => resolveDemoActor(actor)).toThrow(expect.objectContaining({ code: 'IDENTITY_REQUIRED' }));
>   });
>   it.each(['ownerActorId', 'owner_actor_id', 'ownerId', 'actor', 'role', 'roles'])('rejects caller-supplied %s', key => {
>     expect(() => service.create({ ...input, [key]: second.id }, first)).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
>   });
>   it('prevents ownership reassignment including adopting an unowned claim', () => {
>     const claim = service.create(input, first); const id = legacy();
>     expect(() => database.connection.prepare('UPDATE claims SET owner_actor_id=? WHERE id=?').run(second.id, claim.id)).toThrow('ownership is immutable');
>     expect(() => database.connection.prepare('UPDATE claims SET owner_actor_id=? WHERE id=?').run(first.id, id)).toThrow('ownership is immutable');
>     expect(service.get(claim.id, first).ownerActorId).toBe(first.id); expect(service.get(id, adjuster).ownerActorId).toBeNull();
>   });
>   it('upgrades populated Task 05 data without inventing ownership', () => {
>     const file = join(directory, 'legacy.sqlite'); const old = new Database(file); const id = randomUUID(); const timestamp = new Date().toISOString();
>     try {
>       old.pragma('foreign_keys=ON'); runMigrations(old, MIGRATIONS.slice(0, 2));
>       const row = database.connection.prepare('SELECT * FROM workflow_versions').get();
>       if (!row || typeof row !== 'object') throw new Error('Missing workflow fixture');
>       old.prepare('INSERT INTO workflow_versions VALUES (@workflow_id, @version, @schema_version, @definition_json, @definition_sha256, @registered_at)').run(row);
>       old.prepare("INSERT INTO claims VALUES (?, 'claims', 1, 'draft', 'Legacy', 'Unknown owner', 0, ?, ?)").run(id, timestamp, timestamp);
>     } finally { old.close(); }
>     const upgraded = new DatabaseService(file);
>     try {
>       const service = new ClaimService(upgraded, new WorkflowRegistryService(upgraded), config);
>       expect(service.get(id, adjuster)).toMatchObject({ ownerActorId: null, workflowVersion: 1, createdAt: timestamp });
>       expect(service.list(first).items).toEqual([]);
>       expect(() => service.get(id, first)).toThrow('Claim not found');
>       runMigrations(upgraded.connection);
>       expect(upgraded.connection.prepare('SELECT count(*) AS count FROM schema_migrations').get()).toEqual({ count: 3 });
>       registry.register({ ...config.definition, version: 2 });
>       expect(() => upgraded.connection.prepare("UPDATE claims SET workflow_id='other' WHERE id=?").run(id)).toThrow('workflow reference is immutable');
>     } finally { upgraded.close(); }
>   });
>   it('preserves owner and exact workflow version across restart', () => {
>     const claim = service.create(input, second); registry.register({ ...config.definition, version: 2 }); database.close();
>     database = new DatabaseService(join(directory, 'claims.sqlite'));
>     service = new ClaimService(database, new WorkflowRegistryService(database), config);
>     expect(service.get(claim.id, second)).toEqual(claim); expect(service.resolveWorkflow(claim.id, second).definition.version).toBe(1);
>   });
>   it('sanitizes storage failures for authorized actors', () => {
>     const claim = service.create(input, first); database.close();
>     expect(() => service.get(claim.id, first)).toThrow(expect.objectContaining({ code: 'CLAIM_STORAGE_FAILED', message: 'Unable to retrieve claim.' }));
>     expect(() => service.list(adjuster)).toThrow('Unable to list claims.');
>   });
>   it('retains migration 001 and 002 checksums', () => {
>     expect(MIGRATIONS.slice(0, 2).map(migrationChecksum)).toEqual(BASELINE_HASHES);
>   });
> });
> EOF
> python3 - <<'PY'
> from pathlib import Path
> import subprocess,re,hashlib,json
> baseline=subprocess.check_output(['git','show',':backend/src/database/migrations.ts']).decode()
> hashes=[hashlib.sha256(sql.encode()).hexdigest() for sql in re.findall(r'sql: `(.+?)`',baseline,re.S)[:2]]
> p=Path('src/claims/claim-access.spec.ts');p.write_text(p.read_text().replace('BASELINE_HASHES',json.dumps(hashes)))
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- src/claims/claim-access.spec.ts``
> - Ran `tail -40 test/claims.e2e-spec.ts; cat src/claims/claim.service.ts; node --version`
> - Ran ``python3 - <<'PY'
> from pathlib import Path
> p=Path('src/claims/claims-http.ts');s=p.read_text().replace('export class CreateClaimPipe', '''export class EmptyClaimQueryPipe implements PipeTransform<unknown> {
>   transform(value: unknown): void {
>     if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length) {
>       throw new ClaimError('INVALID_REQUEST', 400, 'This endpoint does not accept query parameters.');
>     }
>   }
> }
> export class CreateClaimPipe''');p.write_text(s)
> p=Path('src/claims/claims.controller.ts');s=p.read_text().replace('  CurrentActor,','  CurrentActor,\n  EmptyClaimQueryPipe,').replace('input: CreateClaimDto, @CurrentActor() actor: VerifiedActor)', 'input: CreateClaimDto, @CurrentActor() actor: VerifiedActor, @Query(new EmptyClaimQueryPipe()) _query: unknown)').replace("get(@Param('id') id: string, @CurrentActor() actor: VerifiedActor)", "get(@Param('id') id: string, @CurrentActor() actor: VerifiedActor, @Query(new EmptyClaimQueryPipe()) _query: unknown)");p.write_text(s)
> PY
> cat >> test/claims.e2e-spec.ts <<'EOF'
>
> describe('claim ownership HTTP policy', () => {
>   async function create(id: string = 'claimant-1') {
>     return request(app.getHttpServer()).post('/api/claims').set('X-Demo-Actor-Id', id).send(input).expect(201);
>   }
>   it('assigns ownership from verified actor and permits own lookup', async () => {
>     const result = await create('claimant-2'); expect(result.body.ownerActorId).toBe('claimant-2');
>     const read = await request(app.getHttpServer()).get(`/api/claims/${result.body.id}`).set('X-Demo-Actor-Id', 'claimant-2').expect(200);
>     expect(read.body).toEqual(result.body);
>   });
>   it('conceals another owner with exactly the missing-claim error', async () => {
>     const created = await create();
>     const hidden = await request(app.getHttpServer()).get(`/api/claims/${created.body.id}`).set('X-Demo-Actor-Id', 'claimant-2').expect(404);
>     const absent = await request(app.getHttpServer()).get(`/api/claims/${randomUUID()}`).set('X-Demo-Actor-Id', 'claimant-2').expect(404);
>     expect(hidden.body).toEqual(absent.body);
>     expect(hidden.body).toEqual({ error: { code: 'CLAIM_NOT_FOUND', message: 'Claim not found.' } });
>   });
>   it('lists only own claims and allows adjuster reads across owners', async () => {
>     const first = await create(); const second = await create('claimant-2');
>     for (const [id, owned] of [['claimant-1', first.body.id], ['claimant-2', second.body.id]]) {
>       const page = await request(app.getHttpServer()).get('/api/claims').set('X-Demo-Actor-Id', id).expect(200);
>       expect(page.body.items.map((item: { id: string }) => item.id)).toEqual([owned]);
>       await request(app.getHttpServer()).get(`/api/claims/${owned}`).set('X-Demo-Actor-Id', 'adjuster-1').expect(200);
>     }
>     const all = await request(app.getHttpServer()).get('/api/claims').set('X-Demo-Actor-Id', 'adjuster-1').expect(200);
>     expect(all.body.items).toHaveLength(2);
>   });
>   it('denies adjuster creation and ignores spoofed role headers', async () => {
>     const denied = await request(app.getHttpServer()).post('/api/claims').set('X-Demo-Actor-Id', 'adjuster-1').set('X-Role', 'claimant').send(input).expect(403);
>     expect(denied.body.error.code).toBe('CLAIM_CREATION_FORBIDDEN');
>     const page = await request(app.getHttpServer()).get('/api/claims').set('X-Demo-Actor-Id', 'adjuster-1').expect(200);
>     expect(page.body.items).toEqual([]);
>   });
>   it.each(['ownerActorId', 'owner_actor_id', 'ownerId', 'role'])('rejects supplied %s in body and query', async field => {
>     const created = await create();
>     const body = await request(app.getHttpServer()).post('/api/claims').set('X-Demo-Actor-Id', 'claimant-1').send({ ...input, [field]: 'claimant-2' }).expect(400);
>     expect(body.body.error.code).toBe('INVALID_REQUEST');
>     for (const path of ['/api/claims', `/api/claims/${created.body.id}`]) {
>       const result = await request(app.getHttpServer()).get(path).query({ [field]: 'claimant-2' }).set('X-Demo-Actor-Id', 'claimant-1').expect(400);
>       expect(result.body.error.code).toBe('INVALID_REQUEST');
>     }
>     await request(app.getHttpServer()).post('/api/claims').query({ [field]: 'claimant-2' }).set('X-Demo-Actor-Id', 'claimant-1').send(input).expect(400);
>   });
>   it('shows legacy unowned claims only to adjusters', async () => {
>     const id = randomUUID(); const now = new Date().toISOString();
>     app.get(DatabaseService).connection.prepare(`INSERT INTO claims (id, workflow_id, workflow_version, state, title, description, created_at, updated_at)
>       VALUES (?, 'claims', 1, 'draft', 'Legacy', 'Unknown owner', ?, ?)`).run(id, now, now);
>     for (const actor of ['claimant-1', 'claimant-2']) {
>       await request(app.getHttpServer()).get(`/api/claims/${id}`).set('X-Demo-Actor-Id', actor).expect(404);
>       const own = await request(app.getHttpServer()).get('/api/claims').set('X-Demo-Actor-Id', actor).expect(200);
>       expect(own.body.items).toEqual([]);
>     }
>     const legacy = await request(app.getHttpServer()).get(`/api/claims/${id}`).set('X-Demo-Actor-Id', 'adjuster-1').expect(200);
>     expect(legacy.body.ownerActorId).toBeNull();
>     const all = await request(app.getHttpServer()).get('/api/claims').set('X-Demo-Actor-Id', 'adjuster-1').expect(200);
>     expect(all.body.items).toHaveLength(1);
>   });
>   it('does not elevate a claimant using a role header', async () => {
>     const created = await create('claimant-2');
>     await request(app.getHttpServer()).get(`/api/claims/${created.body.id}`).set('X-Demo-Actor-Id', 'claimant-1').set('X-Role', 'adjuster').expect(404);
>   });
> });
> EOF
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run build``
>
> </details>
>
> The 24 new access tests pass. They verify owner assignment, hidden cross-owner reads, filtering before pagination, adjuster permissions, forged-identity rejection, legacy-data upgrade, and unchanged migration 001/002 checksums. The production build also passes. I’ll now run the HTTP suite and update the documentation to describe the new policy.
>
> <details><summary>Ran 6 commands</summary>
>
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run test:e2e`
> - Ran ````python3 - <<'PY'
> from pathlib import Path
> p=Path('README.md');s=p.read_text().replace('plus X-Demo-Actor-Id equal to claimant-1 or adjuster-1.', 'plus X-Demo-Actor-Id equal to claimant-1, claimant-2, or adjuster-1.')
> s=s.replace('This actor selection is **not production authentication**. There is no ownership,\nassignment, or role authorization policy yet: either allowlisted local actor may\ncreate/read all demo claims. Claims do not yet record an owner. Use only local,\nnon-sensitive demo data. A production authentication adapter is deferred; claim\nroutes remain inaccessible in production.', 'This actor selection is **not production authentication**. Task 06 enforces\nclaim ownership: claimants create/read their own claims, and adjusters read all\nclaims but cannot create. Use only local, non-sensitive demo data. A production\nauthentication adapter is deferred; claim routes remain inaccessible in production.')
> s=s.replace('  "workflowId": "claims",\n  "workflowVersion": 1,\n  "state": "draft",', '  "ownerActorId": "claimant-1",\n  "workflowId": "claims",\n  "workflowVersion": 1,\n  "state": "draft",')
> s=s.replace('Deferred: claim ownership/authentication and authorization, transitions,\nprecondition execution, cycle counting, notifications, audits, receipts, and\nfrontend features. The next task should establish demo ownership/access rules\nbefore adding transactional workflow execution.', 'Deferred: production authentication, transition authorization/execution,\nprecondition execution, cycle counting, notifications, audits, receipts, and\nfrontend features. Task 06 now provides claim ownership and create/read access\nrules; transactional workflow execution is the next implementation task.')
> s+='''
>
> ## Claim ownership and RBAC (Task 06)
>
> The backend-owned allowlist contains claimant-1 and claimant-2 (claimant role),
> and adjuster-1 (adjuster role). Client headers select only one of these demo
> identities; role, owner, and actor values in request payloads cannot grant access.
>
> | Actor | Create | Detail / pinned workflow resolution | List |
> |---|---|---|---|
> | Claimant | Own claim only | Own claims; other/legacy claims return 404 | Own claims |
> | Adjuster | 403 CLAIM_CREATION_FORBIDDEN | Any claim, including legacy | All claims |
> | Missing/unknown actor | 401 IDENTITY_REQUIRED | 401 | 401 |
> | Demo disabled / outside development | 403 DEMO_IDENTITY_DISABLED | 403 | 403 |
>
> ClaimsDemoGuard validates the header and associates a backend-issued frozen actor
> with the request in a private WeakMap. CurrentActor retrieves that identity;
> controllers do not parse headers or decide permissions. claim-access.ts owns
> identity validation and create/read policy. ClaimService requires verified actor
> references for every operation (including workflow resolution). Structurally
> similar or copied actor objects are rejected even in direct service calls.
> Internal backend callers use resolveDemoActor, never body-supplied identity data.
> These references are in-process capabilities, not authentication credentials.
>
> Creation assigns ownerActorId from the verified claimant and accepts only title
> and description. ownerActorId is returned as a read-only demo actor ID, or null
> for legacy claims. Ownership cannot be overridden or reassigned through any API.
> POST and detail routes reject query parameters; list accepts only limit/offset.
> Owner, role, and other unknown payload/query properties return 400 INVALID_REQUEST.
> No owner lookup, reassignment, or actor-management endpoints are provided.
>
> Both detail and list apply the claimant ownership predicate in SQL. Filtering
> occurs before LIMIT/OFFSET, preserving the existing stable createdAt/ID ordering.
> Denied detail lookups have exactly the same 404 CLAIM_NOT_FOUND envelope as
> unknown claims; they do not disclose whether another actor owns the ID.
> Adjusters use the unrestricted read query. Database errors remain sanitized.
>
> ### Migration and legacy claims
>
> Append-only migration 003_claim_ownership adds nullable owner_actor_id with a
> bounded nonblank-text constraint, an owner/createdAt/ID index for claimant pages,
> and an ownership-immutability trigger. Migration 001/002 SQL and checksums are
> unchanged. All existing fields, the composite workflow foreign key, and the
> workflow-pinning immutability trigger are preserved.
>
> Previously created claims receive NULL owner. No ownership is guessed, inferred,
> or assigned to a default actor. Only adjusters can read these legacy records.
> The schema deliberately permits NULL for legacy compatibility, so direct SQL
> can still insert unowned rows; ClaimService always inserts a verified claimant
> owner. The database trigger prevents ownership changes, including adoption of
> an unowned row. There is no reassignment mechanism in this task.
>
> ### Verification and limitations
>
> From backend with the intended Node runtime on PATH:
>
> ```sh
> npm test -- src/claims/claim-access.spec.ts
> npm test
> npm run test:e2e
> npm run build
> npm run lint
> git diff --check
> ```
>
> Ownership tests cover interleaved owners with pagination, adjuster read/create
> rules, forged service identities, legacy migration upgrade, unchanged checksums,
> restart/version pinning, and sanitized failures. HTTP tests retain missing and
> unknown identity, disabled/production configuration, input validation, and add
> cross-owner non-disclosure, role/owner spoofing, and legacy visibility. Temporary
> databases are isolated and HTTP environment overrides are restored after tests.
>
> Local callers can still select any allowlisted demo actor: these permissions
> are a demonstration, not proof of a real user's identity. Production claim
> routes remain disabled until a real authentication adapter is implemented.
> Transitions, transition RBAC, preconditions, side effects, cycle counting,
> audit events, command receipts, notifications, and frontend work remain deferred.
> No dependencies were added. Recommended next task: transactional transition
> execution against each claim's pinned workflow with these access rules.
> '''
> p.write_text(s)
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH ./node_modules/.bin/prettier --write src/claims/ src/database/migrations.ts src/database/database.spec.ts test/claims.e2e-spec.ts
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH ./node_modules/.bin/tsc --noEmit --incremental false````
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run lint`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- src/claims/claim-access.spec.ts`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- --reporter=dot`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run build`
>
> </details>
>
> Verification is green: 133 unit/integration tests and 47 E2E tests pass, along with build, lint, and the supplemental type-check. Legacy claims remain unowned and adjuster-only; new claims are owned at creation. I’m reviewing the final diff for migration changes and generated files before the final report.
>
> <details><summary>Ran 2 commands</summary>
>
> - Ran `git diff --stat; git diff -- src/claims/claim-access.ts src/claims/claim.service.ts src/claims/claims-http.ts src/claims/claims.controller.ts src/database/migrations.ts; git ls-files --others --exclude-standard; rg -n 'no ownership|either allowlisted|do not yet record|ownership/authentication|claimant-1 or adjuster-1|Only title' README.md src/claims; cat src/claims/claim-access.ts`
> - Ran ``python3 - <<'PY'
> from pathlib import Path
> import subprocess,re,hashlib
> baseline=subprocess.check_output(['git','show',':backend/src/database/migrations.ts']).decode()
> current=Path('src/database/migrations.ts').read_text()
> old=re.findall(r'sql: `(.+?)`',baseline,re.S)[:2]
> new=re.findall(r'sql: `(.+?)`',current,re.S)[:2]
> assert old == new
> for index,sql in enumerate(new,1): print(f'Migration {index:03d} unchanged: {hashlib.sha256(sql.encode()).hexdigest()}')
> Path('tsconfig.build.tsbuildinfo').write_bytes(subprocess.check_output(['git','show',':backend/tsconfig.build.tsbuildinfo']))
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH node --version
> git diff --check
> git diff --stat
> git ls-files --others --exclude-standard``
>
> </details>
</details>

Implemented Task 06 only. No dependencies added.

Authorization now runs in the service layer:

| Actor | Create | Read/list |
|---|---|---|
| Claimant | Creates owned claims | Own claims only |
| Adjuster | `403 CLAIM_CREATION_FORBIDDEN` | All claims |
| Missing/unknown identity | Rejected | Rejected |
| Demo disabled or production | Disabled | Disabled |

Cross-owner lookups return the same `404 CLAIM_NOT_FOUND` response as missing claims. SQL filters ownership before pagination. Controllers receive backend-verified actor references; fabricated service identities and client-supplied owner/role fields are rejected.

Migration `003_claim_ownership` adds nullable ownership, an ownership-list index, and an immutability trigger. Legacy claims remain unowned and adjuster-only. New claims always receive a verified owner through the service. Migration 001/002 SQL and checksums remain unchanged.

Changed files:

- [claim-access.ts](./backend/src/claims/claim-access.ts): centralized identity and authorization policy.
- Claim service, types, HTTP helpers, and controller: owner persistence, verified identity propagation, access filtering.
- Migrations and database tests: ownership upgrade and updated expectations.
- Claim service/access tests and E2E tests: ownership, legacy visibility, spoofing, pagination, and pinning.
- Backend README: policy, migration, API response, and limitations.

Checks ran using Node **22.15.1**:

| Command | Result |
|---|---|
| `npm test -- src/claims/claim-access.spec.ts` | **24 passed** |
| `npm test -- --reporter=dot` | **133 passed** |
| `npm run test:e2e` | **47 passed** |
| `npm run build` | Passed |
| `npm run lint` | Passed |
| `tsc --noEmit --incremental false` | Passed |
| `git diff --check` | Passed |

Final diff reviewed; generated compiler-cache changes were discarded. The existing Observe worker error remains visible during the passing E2E run.

Demo identity remains selectable by local callers and is **not production authentication**. Nullable ownership supports legacy records; direct SQL can still insert unowned rows. Transitions, audits, notifications, receipts, and frontend work remain deferred.

Recommended next task: transactional transition execution against each claim’s pinned workflow.

> User context
>
> Attachments:
> - # Task 07 — Transactional Workflow Transition Engine ## Context We are building…: `~/.codex/attachments/2f8bbbd9-8fdc-45de-9f9d-17cbaaba2192/Pasted text.txt`

<details><summary>10 previous messages</summary>

> I’ll read Task 07 and inspect the current workflow, claim, and access-control code before implementing the transition engine.
>
> <details><summary>Explored a file, ran a command</summary>
>
> <details><summary>Explored a file</summary>
>
> - Read `~/.codex/attachments/2f8bbbd9-8fdc-45de-9f9d-17cbaaba2192/Pasted text.txt`
>
> </details>
>
> - Ran `cat backend/src/workflow/workflow.types.ts backend/config/claims.v1.json backend/src/claims/claims.module.ts backend/src/claims/claims.controller.ts backend/src/claims/claim-access.ts backend/src/claims/claim.types.ts; cat backend/src/database/migrations.ts; rg -n 'count: 3|expected tables|004_probe|005_fail' backend/src/database/database.spec.ts; git status --short`
>
> </details>
>
> The existing configuration can express the required behavior without changes. I’ll add a lifetime request counter to the claims row, plus append-only transition events, local notifications, and command receipts. Command IDs will be globally unique, as Task 07 requires cross-actor reuse to conflict. Claim access will be checked before receipt lookup, and retries will return the original committed result.
>
> <details><summary>Ran 2 commands</summary>
>
> - Ran ``python3 - <<'PY'
> from pathlib import Path
> p=Path('src/database/migrations.ts');s=p.read_text().replace('  }),\n]);', '''  }),
>   Object.freeze({
>     id: '004_workflow_transitions',
>     sql: `ALTER TABLE claims ADD COLUMN information_request_count INTEGER NOT NULL DEFAULT 0 CHECK(information_request_count BETWEEN 0 AND 3);
>     CREATE TABLE transition_events (
>       id TEXT PRIMARY KEY NOT NULL,
>       claim_id TEXT NOT NULL REFERENCES claims(id),
>       actor_id TEXT NOT NULL,
>       actor_role TEXT NOT NULL CHECK(actor_role IN ('claimant', 'adjuster')),
>       transition_id TEXT NOT NULL,
>       from_state TEXT NOT NULL,
>       to_state TEXT NOT NULL,
>       previous_revision INTEGER NOT NULL CHECK(previous_revision >= 0),
>       resulting_revision INTEGER NOT NULL CHECK(resulting_revision = previous_revision + 1),
>       input_json TEXT NOT NULL CHECK(json_valid(input_json)),
>       created_at TEXT NOT NULL,
>       UNIQUE(claim_id, resulting_revision)
>     ) STRICT;
>     CREATE TABLE notifications (
>       id TEXT PRIMARY KEY NOT NULL,
>       event_id TEXT NOT NULL REFERENCES transition_events(id),
>       effect_index INTEGER NOT NULL CHECK(effect_index >= 0),
>       recipient_actor_id TEXT NOT NULL,
>       template TEXT NOT NULL CHECK(template IN ('information_requested', 'claim_approved', 'claim_rejected')),
>       message TEXT NOT NULL,
>       created_at TEXT NOT NULL,
>       UNIQUE(event_id, effect_index)
>     ) STRICT;
>     CREATE TABLE command_receipts (
>       command_id TEXT PRIMARY KEY NOT NULL,
>       event_id TEXT NOT NULL UNIQUE REFERENCES transition_events(id),
>       fingerprint TEXT NOT NULL CHECK(length(fingerprint) = 64),
>       result_json TEXT NOT NULL CHECK(json_valid(result_json))
>     ) STRICT;
>     CREATE TRIGGER transition_events_no_update BEFORE UPDATE ON transition_events BEGIN SELECT RAISE(ABORT, 'Transition events are immutable'); END;
>     CREATE TRIGGER transition_events_no_delete BEFORE DELETE ON transition_events BEGIN SELECT RAISE(ABORT, 'Transition events are immutable'); END;
>     CREATE TRIGGER notifications_no_update BEFORE UPDATE ON notifications BEGIN SELECT RAISE(ABORT, 'Notifications are immutable'); END;
>     CREATE TRIGGER notifications_no_delete BEFORE DELETE ON notifications BEGIN SELECT RAISE(ABORT, 'Notifications are immutable'); END;
>     CREATE TRIGGER command_receipts_no_update BEFORE UPDATE ON command_receipts BEGIN SELECT RAISE(ABORT, 'Command receipts are immutable'); END;
>     CREATE TRIGGER command_receipts_no_delete BEFORE DELETE ON command_receipts BEGIN SELECT RAISE(ABORT, 'Command receipts are immutable'); END;`,
>   }),
> ]);''');p.write_text(s)
> p=Path('src/claims/claim.types.ts');s=p.read_text().replace('  readonly revision: number;', '  readonly revision: number;\n  readonly informationRequestCount: number;').replace("      | 'IDENTITY_REQUIRED'", """      | 'TRANSITION_NOT_FOUND'
>       | 'STATE_CONFLICT'
>       | 'TRANSITION_FORBIDDEN'
>       | 'PRECONDITION_FAILED'
>       | 'REVISION_CONFLICT'
>       | 'CYCLE_LIMIT_REACHED'
>       | 'COMMAND_ID_REUSED'
>       | 'NOTIFICATION_RECIPIENT_UNAVAILABLE'
>       | 'TRANSITION_STORAGE_FAILED'
>       | 'STORAGE_BUSY'
>       | 'IDENTITY_REQUIRED'""").replace('400 | 401 | 403 | 404 | 500','400 | 401 | 403 | 404 | 409 | 422 | 500 | 503');p.write_text(s)
> p=Path('src/claims/claim.service.ts');s=p.read_text().replace('  state, title, description, revision,', '  state, title, description, revision, information_request_count AS informationRequestCount,').replace('            revision: 0,','            revision: 0,\n            informationRequestCount: 0,');p.write_text(s)
> p=Path('src/database/database.spec.ts');s=p.read_text().replace("count(database, 'schema_migrations')).toEqual({ count: 3 })", "count(database, 'schema_migrations')).toEqual({ count: 4 })").replace("id: '004_probe'", "id: '005_probe'").replace("id: '005_fail'", "id: '006_fail'")
> s=s.replace("      { name: 'claims' },", "      { name: 'claims' },\n      { name: 'command_receipts' },\n      { name: 'notifications' },").replace("      { name: 'workflow_versions' },", "      { name: 'transition_events' },\n      { name: 'workflow_versions' },");p.write_text(s)
> p=Path('src/claims/claim-access.spec.ts');s=p.read_text().replace('toEqual({ count: 3 })','toEqual({ count: 4 })');p.write_text(s)
> p=Path('test/claims.e2e-spec.ts');s=p.read_text().replace("        'revision',", "        'revision',\n        'informationRequestCount',");p.write_text(s)
> PY
> cat > src/claims/transition-command.ts <<'EOF'
> import { createHash } from 'node:crypto';
> import { ClaimError } from './claim.types.js';
> import type { Claim } from './claim.types.js';
> export interface TransitionCommand {
>   readonly commandId: string;
>   readonly transitionId: string;
>   readonly expectedRevision: number;
>   readonly input: Readonly<Record<string, string>>;
> }
> export interface TransitionResult {
>   readonly claim: Claim;
>   readonly auditEventId: string;
>   readonly notificationIds: readonly string[];
> }
> function invalid(message: string): never { throw new ClaimError('INVALID_REQUEST', 400, message); }
> export function validateTransitionCommand(value: unknown): TransitionCommand {
>   if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid('Expected a transition command object.');
>   const record = value as Record<string, unknown>;
>   if (Object.keys(record).some(key => !['commandId', 'transitionId', 'expectedRevision', 'input'].includes(key))) return invalid('Unknown transition command field.');
>   if (typeof record.commandId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(record.commandId)) return invalid('commandId must be a UUID v4.');
>   if (typeof record.transitionId !== 'string' || !/^[a-z][a-z0-9_]{0,63}$/.test(record.transitionId)) return invalid('Invalid transitionId.');
>   if (typeof record.expectedRevision !== 'number' || !Number.isSafeInteger(record.expectedRevision) || record.expectedRevision < 0 || record.expectedRevision >= Number.MAX_SAFE_INTEGER) return invalid('expectedRevision must be a nonnegative safe integer below the maximum.');
>   const input = record.input;
>   if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length > 20) return invalid('input must be an object with at most 20 text fields.');
>   const entries = Object.entries(input);
>   const normalized: [string, string][] = [];
>   for (const [key, text] of entries) {
>     if (!/^[a-z][a-z0-9_]{0,63}$/.test(key) || typeof text !== 'string' || text.length > 2000) return invalid('Invalid transition input field.');
>     normalized.push([key, text.trim()]);
>   }
>   return Object.freeze({ commandId: record.commandId.toLowerCase(), transitionId: record.transitionId, expectedRevision: record.expectedRevision, input: Object.freeze(Object.fromEntries(normalized)) });
> }
> export function transitionFingerprint(claimId: string, command: TransitionCommand): string {
>   const text = JSON.stringify([claimId, command.transitionId, command.expectedRevision, Object.entries(command.input).sort(([a], [b]) => a.localeCompare(b))]);
>   return createHash('sha256').update(text, 'utf8').digest('hex');
> }
> EOF
> cat > src/claims/transition.service.ts <<'EOF'
> import { randomUUID } from 'node:crypto';
> import { DatabaseService } from '../database/database.service.js';
> import type { TransitionDefinition, NotificationTemplate } from '../workflow/workflow.types.js';
> import { ClaimService } from './claim.service.js';
> import { requireVerifiedActor } from './claim-access.js';
> import type { VerifiedActor } from './claim-access.js';
> import { ClaimError } from './claim.types.js';
> import type { Claim } from './claim.types.js';
> import { transitionFingerprint, validateTransitionCommand } from './transition-command.js';
> import type { TransitionCommand, TransitionResult } from './transition-command.js';
>
> interface Receipt { actor_id: string; claim_id: string; fingerprint: string; result_json: string }
> const templates: Record<NotificationTemplate, (input: Readonly<Record<string, string>>) => string> = {
>   information_requested: input => `Information requested: ${input.message ?? ''}`,
>   claim_approved: () => 'Claim approved.',
>   claim_rejected: input => `Claim rejected: ${input.reason ?? ''}`,
> };
> function checkInput(transition: TransitionDefinition, command: TransitionCommand): void {
>   const fields = new Map(transition.inputFields.map(field => [field.name, field]));
>   if (Object.keys(command.input).some(key => !fields.has(key))) throw new ClaimError('INVALID_REQUEST', 400, 'Unknown transition input field.');
>   for (const field of transition.inputFields) {
>     const text = command.input[field.name];
>     if (text === undefined && !field.required) continue;
>     if (text === undefined || (field.required && !text) || text.length < field.minLength || text.length > field.maxLength) throw new ClaimError('INVALID_REQUEST', 400, `Invalid input for ${field.name}.`);
>   }
> }
> export class TransitionService {
>   constructor(private readonly database: DatabaseService, private readonly claims: ClaimService) {}
>   execute(claimId: string, input: unknown, identity: VerifiedActor): TransitionResult {
>     const actor = requireVerifiedActor(identity);
>     const command = validateTransitionCommand(input);
>     try {
>       return this.database.connection.transaction(() => {
>         const claim = this.claims.get(claimId, actor);
>         const workflow = this.claims.resolveWorkflow(claim.id, actor).definition;
>         const fingerprint = transitionFingerprint(claim.id, command);
>         const receipt = this.database.connection.prepare<[string], Receipt>(`SELECT e.actor_id, e.claim_id, r.fingerprint, r.result_json
>           FROM command_receipts r JOIN transition_events e ON e.id=r.event_id WHERE r.command_id=?`).get(command.commandId);
>         if (receipt) {
>           if (receipt.actor_id !== actor.id || receipt.claim_id !== claim.id || receipt.fingerprint !== fingerprint) throw new ClaimError('COMMAND_ID_REUSED', 409, 'Command ID was already used for a different request or actor.');
>           return this.readReceipt(receipt.result_json);
>         }
>         const transition = workflow.transitions.find(item => item.id === command.transitionId);
>         if (!transition) throw new ClaimError('TRANSITION_NOT_FOUND', 404, 'Transition not found in pinned workflow.');
>         if (!transition.roles.includes(actor.role)) throw new ClaimError('TRANSITION_FORBIDDEN', 403, 'Transition is not permitted for this actor.');
>         if (claim.revision !== command.expectedRevision) throw new ClaimError('REVISION_CONFLICT', 409, 'Claim changed. Refresh before retrying.');
>         if (claim.state !== transition.from) throw new ClaimError('STATE_CONFLICT', 409, 'Transition is not available from the current state.');
>         checkInput(transition, command);
>         for (const condition of transition.preconditions) {
>           if (condition.fields.some(field => !claim[field].trim())) throw new ClaimError('PRECONDITION_FAILED', 422, 'Required claim fields are missing.');
>         }
>         const increment = transition.kind === 'information_request' ? 1 : 0;
>         const limit = Math.min(3, workflow.limits.informationRequests);
>         if (increment && claim.informationRequestCount >= limit) throw new ClaimError('CYCLE_LIMIT_REACHED', 422, 'Information-request limit reached.');
>         if (transition.sideEffects.length && claim.ownerActorId === null) throw new ClaimError('NOTIFICATION_RECIPIENT_UNAVAILABLE', 422, 'Claim has no notification recipient.');
>         const timestamp = new Date().toISOString();
>         const changed = this.database.connection.prepare(`UPDATE claims SET state=?, revision=revision+1, information_request_count=information_request_count+?, updated_at=?
>           WHERE id=? AND revision=? AND state=? AND information_request_count=?`).run(transition.to, increment, timestamp, claim.id, command.expectedRevision, claim.state, claim.informationRequestCount);
>         if (changed.changes !== 1) throw new ClaimError('REVISION_CONFLICT', 409, 'Claim changed. Refresh before retrying.');
>         const eventId = randomUUID();
>         this.database.connection.prepare(`INSERT INTO transition_events (id, claim_id, actor_id, actor_role, transition_id, from_state, to_state, previous_revision, resulting_revision, input_json, created_at)
>           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(eventId, claim.id, actor.id, actor.role, transition.id, claim.state, transition.to, claim.revision, claim.revision + 1, JSON.stringify(command.input), timestamp);
>         const notificationIds: string[] = [];
>         transition.sideEffects.forEach((effect, index) => {
>           const id = randomUUID();
>           this.database.connection.prepare(`INSERT INTO notifications (id, event_id, effect_index, recipient_actor_id, template, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
>             .run(id, eventId, index, claim.ownerActorId, effect.template, templates[effect.template](command.input), timestamp);
>           notificationIds.push(id);
>         });
>         const result: TransitionResult = Object.freeze({ claim: this.claims.get(claim.id, actor), auditEventId: eventId, notificationIds: Object.freeze(notificationIds) });
>         this.database.connection.prepare('INSERT INTO command_receipts (command_id, event_id, fingerprint, result_json) VALUES (?, ?, ?, ?)').run(command.commandId, eventId, fingerprint, JSON.stringify(result));
>         return result;
>       }).immediate();
>     } catch (error) {
>       if (error instanceof ClaimError) throw error;
>       if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'SQLITE_BUSY') throw new ClaimError('STORAGE_BUSY', 503, 'Storage is busy. Retry the same command.');
>       throw new ClaimError('TRANSITION_STORAGE_FAILED', 500, 'Unable to execute transition.');
>     }
>   }
>   private readReceipt(text: string): TransitionResult {
>     const result: unknown = JSON.parse(text);
>     if (!result || typeof result !== 'object' || !('claim' in result) || !('auditEventId' in result) || typeof result.auditEventId !== 'string' || !('notificationIds' in result) || !Array.isArray(result.notificationIds) || !result.notificationIds.every((id: unknown) => typeof id === 'string')) throw new Error('Invalid receipt');
>     const claim = result.claim;
>     if (!claim || typeof claim !== 'object' || !('id' in claim) || typeof claim.id !== 'string' || !('revision' in claim) || !Number.isSafeInteger(claim.revision)) throw new Error('Invalid receipt claim');
>     // Only our own serialized, immutable response is persisted; validate the shape before replay.
>     return Object.freeze({ claim: Object.freeze(claim) as Claim, auditEventId: result.auditEventId, notificationIds: Object.freeze(result.notificationIds) });
>   }
> }
> EOF
> python3 - <<'PY'
> from pathlib import Path
> p=Path('src/claims/claims.module.ts');s=p.read_text().replace("import { ClaimService }", "import { TransitionService } from './transition.service.js';\nimport { ClaimService }").replace('    ClaimsDemoGuard,','''    ClaimsDemoGuard,
>     { provide: TransitionService, inject: [DatabaseService, ClaimService], useFactory: (database: DatabaseService, claims: ClaimService) => new TransitionService(database, claims) },''').replace('exports: [ClaimService]', 'exports: [ClaimService, TransitionService]');p.write_text(s)
> p=Path('src/claims/claims.controller.ts');s=p.read_text().replace('  Post,','  Post,\n  HttpCode,').replace("import { ClaimService }", "import { TransitionService } from './transition.service.js';\nimport { ClaimService }").replace('constructor(private readonly claims: ClaimService) {}','constructor(private readonly claims: ClaimService, private readonly transitions: TransitionService) {}').replace('  @Get()','''  @Post(':id/transitions')
>   @HttpCode(200)
>   transition(@Param('id') id: string, @Body() input: unknown, @CurrentActor() actor: VerifiedActor, @Query(new EmptyClaimQueryPipe()) _query: unknown) {
>     return this.transitions.execute(id, input, actor);
>   }
>   @Get()''');p.write_text(s)
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run build``
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- --reporter=dot`
>
> </details>
>
> The engine and migration are in place, and all 133 existing tests still pass. Execution uses the pinned configuration, checks role and ownership, and commits the state, counter, audit, notifications, and receipt in one immediate transaction. I’m now adding failure-injection, replay, cycle-limit, and competing-command tests to verify rollback and concurrency behavior.
>
> <details><summary>Explored a search, ran 4 commands</summary>
>
> - Ran ``cat > src/claims/transition.service.spec.ts <<'EOF'
> import { mkdtempSync, rmSync } from 'node:fs';
> import { tmpdir } from 'node:os';
> import { join } from 'node:path';
> import { randomUUID, createHash } from 'node:crypto';
> import Database from 'better-sqlite3';
> import { DatabaseService } from '../database/database.service.js';
> import { WorkflowConfigService } from '../workflow/workflow-config.service.js';
> import { WorkflowRegistryService } from '../workflow/workflow-registry.service.js';
> import { ClaimService } from './claim.service.js';
> import { TransitionService } from './transition.service.js';
> import { resolveDemoActor } from './claim-access.js';
> import { MIGRATIONS, runMigrations } from '../database/migrations.js';
> const claimant = resolveDemoActor('claimant-1');
> const other = resolveDemoActor('claimant-2');
> const adjuster = resolveDemoActor('adjuster-1');
> const fields = { title: 'Damage', description: 'Screen damaged in transit.' };
> let directory: string;
> let db: DatabaseService;
> let claims: ClaimService;
> let registry: WorkflowRegistryService;
> let config: WorkflowConfigService;
> let engine: TransitionService;
> let id: string;
> beforeEach(() => {
>   directory = mkdtempSync(join(tmpdir(), 'transitions-'));
>   db = new DatabaseService(join(directory, 'test.sqlite'));
>   registry = new WorkflowRegistryService(db); config = new WorkflowConfigService(); registry.register(config.definition);
>   claims = new ClaimService(db, registry, config); engine = new TransitionService(db, claims);
>   id = claims.create(fields, claimant).id;
> });
> afterEach(() => { db?.close(); vi.restoreAllMocks(); rmSync(directory, { recursive: true, force: true }); });
> function command(transitionId: string, expectedRevision: number, input: Record<string, string> = {}) { return { transitionId, expectedRevision, input, commandId: randomUUID() }; }
> function review() { engine.execute(id, command('submit', 0), claimant); engine.execute(id, command('start_review', 1), adjuster); }
> function counts() { return ['transition_events', 'notifications', 'command_receipts'].map(table => db.connection.prepare(`SELECT count(*) AS count FROM ${table}`).get()); }
>
> describe('transactional workflow execution', () => {
>   it('commits a configured transition with one revision and accurate audit', () => {
>     const result = engine.execute(id, command('submit', 0), claimant);
>     expect(result.claim).toMatchObject({ state: 'submitted', revision: 1, informationRequestCount: 0, workflowVersion: 1 });
>     expect(result.notificationIds).toEqual([]);
>     expect(db.connection.prepare('SELECT actor_id, actor_role, transition_id, from_state, to_state, previous_revision, resulting_revision, created_at FROM transition_events').get()).toEqual({ actor_id: claimant.id, actor_role: 'claimant', transition_id: 'submit', from_state: 'draft', to_state: 'submitted', previous_revision: 0, resulting_revision: 1, created_at: result.claim.updatedAt });
>     expect(counts()).toEqual([{ count: 1 }, { count: 0 }, { count: 1 }]);
>   });
>   it('conceals cross-owner and nonexistent claims identically', () => {
>     for (const claimId of [id, randomUUID()]) expect(() => engine.execute(claimId, command('submit', 0), other)).toThrow(expect.objectContaining({ code: 'CLAIM_NOT_FOUND', status: 404 }));
>     expect(counts()).toEqual([{ count: 0 }, { count: 0 }, { count: 0 }]);
>   });
>   it('rejects unknown transition IDs', () => { expect(() => engine.execute(id, command('unknown', 0), claimant)).toThrow(expect.objectContaining({ code: 'TRANSITION_NOT_FOUND' })); });
>   it('rejects wrong source states', () => { expect(() => engine.execute(id, command('approve', 0), adjuster)).toThrow(expect.objectContaining({ code: 'STATE_CONFLICT' })); });
>   it('enforces roles from configuration', () => { expect(() => engine.execute(id, command('submit', 0), adjuster)).toThrow(expect.objectContaining({ code: 'TRANSITION_FORBIDDEN', status: 403 })); });
>   it('enforces preconditions independently from DB text checks', () => {
>     db.connection.prepare("UPDATE claims SET title=? WHERE id=?").run('\t', id);
>     expect(() => engine.execute(id, command('submit', 0), claimant)).toThrow(expect.objectContaining({ code: 'PRECONDITION_FAILED', status: 422 }));
>     expect(claims.get(id, claimant).revision).toBe(0);
>   });
>   it.each([{}, { message: ' ' }, { message: 'x', extra: 'bad' }, { message: 'x'.repeat(2001) }])('rejects invalid request-information inputs %j', input => {
>     review(); expect(() => engine.execute(id, command('request_information', 2, input), adjuster)).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
>     expect(claims.get(id, claimant)).toMatchObject({ state: 'under_review', revision: 2, informationRequestCount: 0 });
>     expect(counts()).toEqual([{ count: 2 }, { count: 0 }, { count: 2 }]);
>   });
>   it('requires the configured rejection reason and persists it on success', () => {
>     review(); expect(() => engine.execute(id, command('reject', 2), adjuster)).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
>     const result = engine.execute(id, command('reject', 2, { reason: '  Not covered  ' }), adjuster);
>     expect(result.claim.state).toBe('rejected');
>     expect(db.connection.prepare('SELECT input_json FROM transition_events WHERE id=?').get(result.auditEventId)).toEqual({ input_json: '{"reason":"Not covered"}' });
>     expect(db.connection.prepare('SELECT recipient_actor_id, template, message FROM notifications').get()).toEqual({ recipient_actor_id: claimant.id, template: 'claim_rejected', message: 'Claim rejected: Not covered' });
>   });
>   it('allows cycles one through three and rejects the fourth without changes', () => {
>     review(); let revision = 2;
>     for (let cycle = 1; cycle <= 3; cycle++) {
>       const result = engine.execute(id, command('request_information', revision++, { message: 'More information' }), adjuster);
>       expect(result.claim.informationRequestCount).toBe(cycle);
>       engine.execute(id, command('provide_information', revision++, { response: 'Details' }), claimant);
>     }
>     const before = counts();
>     expect(() => engine.execute(id, command('request_information', revision, { message: 'Again' }), adjuster)).toThrow(expect.objectContaining({ code: 'CYCLE_LIMIT_REACHED' }));
>     expect(counts()).toEqual(before); expect(claims.get(id, claimant)).toMatchObject({ state: 'under_review', revision: 8, informationRequestCount: 3 });
>     expect(engine.execute(id, command('approve', 8), adjuster).claim.state).toBe('approved');
>   });
>   it('replays the original result after later state changes with no duplicate effects', () => {
>     review(); const cmd = command('request_information', 2, { message: ' Details ' });
>     const first = engine.execute(id, cmd, adjuster);
>     engine.execute(id, command('provide_information', 3, { response: 'Done' }), claimant);
>     const before = counts();
>     expect(engine.execute(id, { ...cmd, input: { message: 'Details' } }, adjuster)).toEqual(first);
>     expect(counts()).toEqual(before); expect(claims.get(id, claimant)).toMatchObject({ revision: 4, informationRequestCount: 1 });
>   });
>   it('rejects same command ID with a different request', () => {
>     const cmd = command('submit', 0); engine.execute(id, cmd, claimant);
>     expect(() => engine.execute(id, { ...cmd, expectedRevision: 1 }, claimant)).toThrow(expect.objectContaining({ code: 'COMMAND_ID_REUSED' }));
>   });
>   it('rejects same command ID by a different actor with access', () => {
>     const cmd = command('submit', 0); engine.execute(id, cmd, claimant);
>     expect(() => engine.execute(id, cmd, adjuster)).toThrow(expect.objectContaining({ code: 'COMMAND_ID_REUSED' }));
>     expect(() => engine.execute(id, cmd, other)).toThrow(expect.objectContaining({ code: 'CLAIM_NOT_FOUND' }));
>   });
>   it('rejects stale expected revisions', () => {
>     engine.execute(id, command('submit', 0), claimant);
>     expect(() => engine.execute(id, command('start_review', 0), adjuster)).toThrow(expect.objectContaining({ code: 'REVISION_CONFLICT' }));
>     expect(claims.get(id, claimant).revision).toBe(1);
>   });
>   it.each(['claims', 'transition_events', 'notifications', 'command_receipts'])('rolls back all writes when %s fails', table => {
>     review(); const before = claims.get(id, claimant); const rows = counts();
>     db.connection.exec(`CREATE TRIGGER injected_failure BEFORE ${table === 'claims' ? 'UPDATE' : 'INSERT'} ON ${table} BEGIN SELECT RAISE(ABORT, 'injected failure'); END`);
>     const cmd = command('request_information', 2, { message: 'Details' });
>     expect(() => engine.execute(id, cmd, adjuster)).toThrow(expect.objectContaining({ code: 'TRANSITION_STORAGE_FAILED' }));
>     expect(claims.get(id, claimant)).toEqual(before); expect(counts()).toEqual(rows);
>     db.connection.exec('DROP TRIGGER injected_failure');
>     expect(engine.execute(id, cmd, adjuster).claim.informationRequestCount).toBe(1);
>   });
>   it('uses conditional update row count to detect a lost write', () => {
>     review(); db.connection.exec("CREATE TRIGGER skip_update BEFORE UPDATE ON claims BEGIN SELECT RAISE(IGNORE); END");
>     expect(() => engine.execute(id, command('approve', 2), adjuster)).toThrow(expect.objectContaining({ code: 'REVISION_CONFLICT' }));
>     expect(claims.get(id, claimant).revision).toBe(2); expect(counts()).toEqual([{ count: 2 }, { count: 0 }, { count: 2 }]);
>   });
>   it('keeps successful events, notifications and receipts immutable', () => {
>     review(); engine.execute(id, command('approve', 2), adjuster);
>     for (const table of ['transition_events', 'notifications', 'command_receipts']) {
>       expect(() => db.connection.exec(`DELETE FROM ${table}`)).toThrow('immutable');
>       const column = table === 'transition_events' ? 'actor_id' : table === 'notifications' ? 'message' : 'fingerprint';
>       expect(() => db.connection.exec(`UPDATE ${table} SET ${column}=${column}`)).toThrow('immutable');
>     }
>   });
>   it('uses pinned version one after version two changes role and transitions', () => {
>     registry.register({ ...config.definition, version: 2, transitions: config.definition.transitions.map(transition => transition.id === 'submit' ? { ...transition, roles: ['adjuster'] } : transition) });
>     expect(engine.execute(id, command('submit', 0), claimant).claim).toMatchObject({ workflowVersion: 1, state: 'submitted' });
>   });
>   it('accepts a configuration-only new state and transition', () => {
>     const value = { ...config.definition, version: 2, states: [...config.definition.states, { id: 'escalated', label: 'Escalated', terminal: true }], transitions: [...config.definition.transitions, { ...config.definition.transitions[0], id: 'escalate', to: 'escalated' }] };
>     registry.register(value);
>     const service = new ClaimService(db, registry, { definition: value }); const claim = service.create(fields, claimant);
>     expect(new TransitionService(db, service).execute(claim.id, command('escalate', 0), claimant).claim.state).toBe('escalated');
>   });
>   it('rejects an unavailable pinned workflow without writes', () => {
>     db.connection.exec("UPDATE workflow_versions SET definition_json='{}'");
>     expect(() => engine.execute(id, command('submit', 0), claimant)).toThrow(expect.objectContaining({ code: 'CLAIM_WORKFLOW_UNAVAILABLE' }));
>     expect(counts()).toEqual([{ count: 0 }, { count: 0 }, { count: 0 }]);
>   });
>   it('preserves counters and receipt replay across a restart', () => {
>     review(); const cmd = command('request_information', 2, { message: 'Details' }); const first = engine.execute(id, cmd, adjuster); db.close();
>     db = new DatabaseService(join(directory, 'test.sqlite')); registry = new WorkflowRegistryService(db); claims = new ClaimService(db, registry, config); engine = new TransitionService(db, claims);
>     expect(engine.execute(id, cmd, adjuster)).toEqual(first); expect(claims.get(id, claimant).informationRequestCount).toBe(1);
>   });
>   it('does not invent a notification recipient for unowned legacy claims', () => {
>     const legacy = randomUUID(); const now = new Date().toISOString();
>     db.connection.prepare("INSERT INTO claims (id,workflow_id,workflow_version,state,title,description,created_at,updated_at) VALUES (?,'claims',1,'under_review','Legacy','Unknown owner',?,?)").run(legacy, now, now);
>     expect(() => engine.execute(legacy, command('request_information', 0, { message: 'Details' }), adjuster)).toThrow(expect.objectContaining({ code: 'NOTIFICATION_RECIPIENT_UNAVAILABLE' }));
>     expect(claims.get(legacy, adjuster).revision).toBe(0);
>   });
>   it('serializes competing commands across independent database connections', async () => {
>     engine.execute(id, command('submit', 0), claimant);
>     const second = new DatabaseService(join(directory, 'test.sqlite'));
>     try {
>       const otherEngine = new TransitionService(second, new ClaimService(second, new WorkflowRegistryService(second), config));
>       const outcomes = await Promise.allSettled([
>         Promise.resolve().then(() => engine.execute(id, command('start_review', 1), adjuster)),
>         Promise.resolve().then(() => otherEngine.execute(id, command('start_review', 1), adjuster)),
>       ]);
>       expect(outcomes.filter(result => result.status === 'fulfilled')).toHaveLength(1);
>       const failed = outcomes.find(result => result.status === 'rejected');
>       expect(failed?.status === 'rejected' && failed.reason.code).toBe('REVISION_CONFLICT');
>       expect(claims.get(id, claimant).revision).toBe(2);
>     } finally { second.close(); }
>   });
>   it('maps a held SQLite writer lock to a retryable safe error', () => {
>     const second = new DatabaseService(join(directory, 'test.sqlite'));
>     try {
>       db.connection.pragma('busy_timeout=1'); second.connection.exec('BEGIN IMMEDIATE');
>       expect(() => engine.execute(id, command('submit', 0), claimant)).toThrow(expect.objectContaining({ code: 'STORAGE_BUSY', status: 503 }));
>     } finally { second.connection.exec('ROLLBACK'); second.close(); }
>   });
>   it('upgrades populated migration 003 data without changing ownership or pinning', () => {
>     const file = join(directory, 'old.sqlite'); const old = new Database(file); const timestamp = new Date().toISOString();
>     try {
>       runMigrations(old, MIGRATIONS.slice(0, 3));
>       const row = db.connection.prepare('SELECT * FROM workflow_versions').get();
>       if (!row || typeof row !== 'object') throw new Error('Missing fixture');
>       old.prepare('INSERT INTO workflow_versions VALUES (@workflow_id,@version,@schema_version,@definition_json,@definition_sha256,@registered_at)').run(row);
>       old.prepare("INSERT INTO claims (id,workflow_id,workflow_version,state,title,description,created_at,updated_at,owner_actor_id) VALUES (?,'claims',1,'draft','Old','Existing',?,?,?)").run(id, timestamp, timestamp, claimant.id);
>     } finally { old.close(); }
>     const upgraded = new DatabaseService(file);
>     try {
>       const service = new ClaimService(upgraded, new WorkflowRegistryService(upgraded), config);
>       expect(service.get(id, claimant)).toMatchObject({ workflowVersion: 1, informationRequestCount: 0, ownerActorId: claimant.id, createdAt: timestamp });
>     } finally { upgraded.close(); }
>   });
>   it('retains exact migration 001–003 hashes', () => {
>     expect(MIGRATIONS.slice(0, 3).map(item => createHash('sha256').update(item.sql).digest('hex'))).toEqual(BASELINE_HASHES);
>   });
> });
> EOF
> python3 - <<'PY'
> from pathlib import Path
> import subprocess,re,json,hashlib
> baseline=subprocess.check_output(['git','show',':backend/src/database/migrations.ts']).decode()
> hashes=[hashlib.sha256(s.encode()).hexdigest() for s in re.findall(r'sql: `(.+?)`',baseline,re.S)[:3]]
> p=Path('src/claims/transition.service.spec.ts');p.write_text(p.read_text().replace('BASELINE_HASHES',json.dumps(hashes)))
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- src/claims/transition.service.spec.ts``
>
> - Ran `python3 - <<'PY'
> from pathlib import Path
> p=Path('src/claims/transition-command.ts');s=p.read_text().replace("  if (Object.keys(record).some", "  if (['commandId', 'transitionId', 'expectedRevision', 'input'].some(key => !Object.hasOwn(record, key))) return invalid('Missing required transition command field.');\n  if (Object.keys(record).some").replace('a.localeCompare(b)', 'a < b ? -1 : a > b ? 1 : 0');p.write_text(s)
> p=Path('src/claims/transition.service.ts');s=p.read_text().replace('const text = command.input[field.name];', 'const text = Object.hasOwn(command.input, field.name) ? command.input[field.name] : undefined;').replace("import type { Claim } from './claim.types.js';\n", '')
> a=s.index('    if (!claim || typeof claim');b=s.index('\n  }\n}',a)
> s=s[:a]+'''    if (!claim || typeof claim !== 'object' ||
>         !('id' in claim) || typeof claim.id !== 'string' ||
>         !('ownerActorId' in claim) || (claim.ownerActorId !== null && typeof claim.ownerActorId !== 'string') ||
>         !('workflowId' in claim) || typeof claim.workflowId !== 'string' ||
>         !('workflowVersion' in claim) || typeof claim.workflowVersion !== 'number' || !Number.isSafeInteger(claim.workflowVersion) || claim.workflowVersion < 1 ||
>         !('state' in claim) || typeof claim.state !== 'string' ||
>         !('title' in claim) || typeof claim.title !== 'string' ||
>         !('description' in claim) || typeof claim.description !== 'string' ||
>         !('revision' in claim) || typeof claim.revision !== 'number' || !Number.isSafeInteger(claim.revision) || claim.revision < 1 ||
>         !('informationRequestCount' in claim) || typeof claim.informationRequestCount !== 'number' || !Number.isInteger(claim.informationRequestCount) || claim.informationRequestCount < 0 || claim.informationRequestCount > 3 ||
>         !('createdAt' in claim) || typeof claim.createdAt !== 'string' ||
>         !('updatedAt' in claim) || typeof claim.updatedAt !== 'string') throw new Error('Invalid receipt claim');
>     return Object.freeze({ claim: Object.freeze({
>       id: claim.id, ownerActorId: claim.ownerActorId, workflowId: claim.workflowId, workflowVersion: claim.workflowVersion,
>       state: claim.state, title: claim.title, description: claim.description, revision: claim.revision,
>       informationRequestCount: claim.informationRequestCount, createdAt: claim.createdAt, updatedAt: claim.updatedAt,
>     }), auditEventId: result.auditEventId, notificationIds: Object.freeze(result.notificationIds) });'''+s[b:]
> p.write_text(s)
> # Only migration 004 is new/unapplied; tighten its constraints without touching old SQL.
> p=Path('src/database/migrations.ts');s=p.read_text();a=s.index("    id: '004_workflow_transitions'");before=s[:a];part=s[a:]
> part=part.replace('id TEXT PRIMARY KEY NOT NULL,', 'id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),').replace('actor_id TEXT NOT NULL,', 'actor_id TEXT NOT NULL CHECK(length(actor_id) BETWEEN 1 AND 64),').replace('transition_id TEXT NOT NULL,', 'transition_id TEXT NOT NULL CHECK(length(transition_id) BETWEEN 1 AND 64),').replace('from_state TEXT NOT NULL,','from_state TEXT NOT NULL CHECK(length(from_state) BETWEEN 1 AND 64),').replace('to_state TEXT NOT NULL,','to_state TEXT NOT NULL CHECK(length(to_state) BETWEEN 1 AND 64),').replace('CHECK(resulting_revision = previous_revision + 1)', 'CHECK(resulting_revision = previous_revision + 1 AND resulting_revision <= 9007199254740991)').replace('created_at TEXT NOT NULL,','created_at TEXT NOT NULL CHECK(length(created_at) = 24),').replace('message TEXT NOT NULL,','message TEXT NOT NULL CHECK(length(message) BETWEEN 1 AND 2200),').replace('command_id TEXT PRIMARY KEY NOT NULL,','command_id TEXT PRIMARY KEY NOT NULL CHECK(length(command_id) = 36),').replace('CHECK(length(fingerprint) = 64)', "CHECK(length(fingerprint) = 64 AND fingerprint NOT GLOB '*[^0-9a-f]*')")
> # recipient field got actor_id replacement as a suffix; retain its matching explicit check.
> part=part.replace('CHECK(length(actor_id) BETWEEN 1 AND 64),\n      template', 'CHECK(length(recipient_actor_id) BETWEEN 1 AND 64),\n      template')
> p.write_text(before+part)
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run build
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- src/claims/transition.service.spec.ts`
>
> <details><summary>Explored a search</summary>
>
> - Searched for `CHECK|recipient|schema_migrations` in `migrations.ts`
>
> </details>
>
> - Ran `python3 - <<'PY'
> from pathlib import Path
> p=Path('src/database/migrations.ts');s=p.read_text().replace('command_id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36)', 'command_id TEXT PRIMARY KEY NOT NULL CHECK(length(command_id) = 36)').replace('        id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),','        id TEXT PRIMARY KEY NOT NULL,');p.write_text(s)
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- src/claims/transition.service.spec.ts`
>
> - Ran ``cat > test/transitions.e2e-spec.ts <<'EOF'
> import { Test } from '@nestjs/testing';
> import type { INestApplication } from '@nestjs/common';
> import request from 'supertest';
> import { randomUUID } from 'node:crypto';
> import { ClaimsModule } from '../src/claims/claims.module.js';
> import { DATABASE_PATH, DatabaseService } from '../src/database/database.service.js';
> let app: INestApplication;
> let id: string;
> const command = (transitionId = 'submit', expectedRevision = 0, input: Record<string, string> = {}) => ({ transitionId, expectedRevision, input, commandId: randomUUID() });
> function execute(payload: unknown, actor = 'claimant-1', claimId = id) {
>   return request(app.getHttpServer()).post(`/api/claims/${claimId}/transitions`).set('X-Demo-Actor-Id', actor).send(payload);
> }
> beforeEach(async () => {
>   vi.stubEnv('NODE_ENV', 'development'); vi.stubEnv('DEMO_IDENTITY_ENABLED', 'true');
>   const module = await Test.createTestingModule({ imports: [ClaimsModule] }).overrideProvider(DATABASE_PATH).useValue(':memory:').compile();
>   app = module.createNestApplication(); await app.init();
>   const claim = await request(app.getHttpServer()).post('/api/claims').set('X-Demo-Actor-Id', 'claimant-1').send({ title: 'Damage', description: 'Screen damaged' }).expect(201);
>   id = claim.body.id;
> });
> afterEach(async () => { await app?.close(); vi.unstubAllEnvs(); });
> async function review() { await execute(command()).expect(200); await execute(command('start_review', 1), 'adjuster-1').expect(200); }
> describe('transition HTTP API', () => {
>   it('returns committed claim, audit ID and notification IDs with 200', async () => {
>     const result = await execute(command()).expect(200);
>     expect(result.body.claim).toMatchObject({ id, state: 'submitted', revision: 1, informationRequestCount: 0, ownerActorId: 'claimant-1', workflowVersion: 1 });
>     expect(result.body.auditEventId).toMatch(/^[0-9a-f-]{36}$/); expect(result.body.notificationIds).toEqual([]);
>   });
>   it('runs request/response and approval with local notification records', async () => {
>     await review();
>     const requested = await execute(command('request_information', 2, { message: 'Purchase date?' }), 'adjuster-1').expect(200);
>     expect(requested.body.claim).toMatchObject({ informationRequestCount: 1, revision: 3, state: 'awaiting_information' });
>     expect(requested.body.notificationIds).toHaveLength(1);
>     await execute(command('provide_information', 3, { response: 'Yesterday' })).expect(200);
>     const approved = await execute(command('approve', 4), 'adjuster-1').expect(200);
>     expect(approved.body.claim).toMatchObject({ state: 'approved', revision: 5, informationRequestCount: 1 });
>   });
>   it('conceals cross-owner and missing claim IDs', async () => {
>     const hidden = await execute(command(), 'claimant-2').expect(404);
>     const absent = await execute(command(), 'claimant-2', randomUUID()).expect(404);
>     expect(hidden.body).toEqual(absent.body); expect(hidden.body.error.code).toBe('CLAIM_NOT_FOUND');
>   });
>   it('returns stable unknown-transition, role and source errors', async () => {
>     expect((await execute(command('unknown')).expect(404)).body.error.code).toBe('TRANSITION_NOT_FOUND');
>     expect((await execute(command(), 'adjuster-1').expect(403)).body.error.code).toBe('TRANSITION_FORBIDDEN');
>     expect((await execute(command('approve'), 'adjuster-1').expect(409)).body.error.code).toBe('STATE_CONFLICT');
>   });
>   it('returns stable stale-revision errors', async () => {
>     await execute(command()).expect(200);
>     expect((await execute(command('start_review', 0), 'adjuster-1').expect(409)).body.error.code).toBe('REVISION_CONFLICT');
>   });
>   it('requires configured rejection reason', async () => {
>     await review(); expect((await execute(command('reject', 2), 'adjuster-1').expect(400)).body.error.code).toBe('INVALID_REQUEST');
>     const result = await execute(command('reject', 2, { reason: 'Not covered' }), 'adjuster-1').expect(200);
>     expect(result.body.claim.state).toBe('rejected');
>   });
>   it('enforces the three-cycle lifetime limit through HTTP', async () => {
>     await review(); let revision = 2;
>     for (let cycle = 1; cycle <= 3; cycle++) {
>       const result = await execute(command('request_information', revision++, { message: 'Details' }), 'adjuster-1').expect(200);
>       expect(result.body.claim.informationRequestCount).toBe(cycle);
>       await execute(command('provide_information', revision++, { response: 'Details supplied' })).expect(200);
>     }
>     expect((await execute(command('request_information', revision, { message: 'Again' }), 'adjuster-1').expect(422)).body.error.code).toBe('CYCLE_LIMIT_REACHED');
>     const detail = await request(app.getHttpServer()).get(`/api/claims/${id}`).set('X-Demo-Actor-Id', 'claimant-1').expect(200);
>     expect(detail.body).toMatchObject({ revision: 8, informationRequestCount: 3, state: 'under_review' });
>   });
>   it('returns original response on retry and conflicts on changed actor or payload', async () => {
>     const payload = command(); const first = await execute(payload).expect(200);
>     expect((await execute(payload).expect(200)).body).toEqual(first.body);
>     expect((await execute({ ...payload, expectedRevision: 1 }).expect(409)).body.error.code).toBe('COMMAND_ID_REUSED');
>     expect((await execute(payload, 'adjuster-1').expect(409)).body.error.code).toBe('COMMAND_ID_REUSED');
>   });
>   it.each(['state', 'revision', 'ownerActorId', 'workflowVersion', 'actor', 'role', 'informationRequestCount', 'audit', 'notifications'])('rejects protected command property %s', async field => {
>     expect((await execute({ ...command(), [field]: 'override' }).expect(400)).body.error.code).toBe('INVALID_REQUEST');
>   });
>   it.each([
>     {}, { ...command(), expectedRevision: -1 }, { ...command(), commandId: 'invalid' },
>     { ...command(), input: { actor: 'override' } }, { ...command(), input: { message: 12 } },
>   ])('rejects invalid command %j', async payload => { expect((await execute(payload).expect(400)).body.error.code).toBe('INVALID_REQUEST'); });
>   it('rejects unverified HTTP identities', async () => {
>     await request(app.getHttpServer()).post(`/api/claims/${id}/transitions`).send(command()).expect(401);
>     await execute(command(), 'unknown').expect(401);
>   });
>   it.each([['production', 'true'], ['development', 'false'], ['test', 'true']])('fails closed in %s with demo %s', async (environment, enabled) => {
>     vi.stubEnv('NODE_ENV', environment); vi.stubEnv('DEMO_IDENTITY_ENABLED', enabled);
>     expect((await execute(command()).expect(403)).body.error.code).toBe('DEMO_IDENTITY_DISABLED');
>   });
>   it('sanitizes write errors and rolls back state', async () => {
>     app.get(DatabaseService).connection.exec("CREATE TRIGGER fail_audit BEFORE INSERT ON transition_events BEGIN SELECT RAISE(ABORT, 'private SQL failure'); END");
>     const result = await execute(command()).expect(500);
>     expect(result.body).toEqual({ error: { code: 'TRANSITION_STORAGE_FAILED', message: 'Unable to execute transition.' } });
>     const claim = await request(app.getHttpServer()).get(`/api/claims/${id}`).set('X-Demo-Actor-Id', 'claimant-1').expect(200);
>     expect(claim.body.revision).toBe(0);
>   });
> });
> EOF
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run test:e2e``
>
> </details>
>
> The new transition tests and HTTP suite pass. The tests cover rollback when the state update, audit insert, notification insert, or receipt insert fails. They also verify three successful request cycles, rejection of the fourth, and replay after later state changes and a database restart without duplicate effects. I corrected a constraint error caught while tightening migration 004; the focused suite passes again.
>
> <details><summary>Ran 5 commands</summary>
>
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run lint`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- --reporter=dot`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH ./node_modules/.bin/tsc --noEmit --incremental false`
> - Ran `python3 - <<'PY'
> from pathlib import Path
> p=Path('src/claims/transition.service.spec.ts');s=p.read_text().replace('input: Record<string, string> = {}', 'input: unknown = {}');s+='''
>
> describe('transition input and idempotency boundaries', () => {
>   it('uses equivalent normalized input regardless of object key order', () => {
>     const definition = { ...config.definition, version: 2, transitions: config.definition.transitions.map(item => item.id === 'submit' ? { ...item, inputFields: ['alpha', 'beta'].map(name => ({ name, label: name, required: true, minLength: 1, maxLength: 20 })) } : item) };
>     registry.register(definition); claims = new ClaimService(db, registry, { definition }); engine = new TransitionService(db, claims);
>     id = claims.create(fields, claimant).id;
>     const cmd = command('submit', 0, { beta: ' two ', alpha: 'one' });
>     const first = engine.execute(id, cmd, claimant);
>     expect(engine.execute(id, { ...cmd, input: { alpha: 'one', beta: 'two' } }, claimant)).toEqual(first);
>     expect(counts()).toEqual([{ count: 1 }, { count: 0 }, { count: 1 }]);
>   });
>   it('does not treat an inherited property as required input', () => {
>     const definition = { ...config.definition, version: 2, transitions: config.definition.transitions.map(item => item.id === 'submit' ? { ...item, inputFields: [{ name: 'constructor', label: 'Details', required: true, minLength: 1, maxLength: 20 }] } : item) };
>     registry.register(definition); claims = new ClaimService(db, registry, { definition }); engine = new TransitionService(db, claims);
>     id = claims.create(fields, claimant).id;
>     expect(() => engine.execute(id, command('submit', 0), claimant)).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
>     expect(engine.execute(id, command('submit', 0, { constructor: 'present' }), claimant).claim.revision).toBe(1);
>   });
>   it('uses the same pinned limit for an added information-request transition', () => {
>     const definition = { ...config.definition, version: 2, limits: { informationRequests: 1 }, transitions: [...config.definition.transitions, { ...config.definition.transitions[2], id: 'ask_again' }] };
>     registry.register(definition); claims = new ClaimService(db, registry, { definition }); engine = new TransitionService(db, claims);
>     id = claims.create(fields, claimant).id; review();
>     engine.execute(id, command('request_information', 2, { message: 'Details' }), adjuster);
>     engine.execute(id, command('provide_information', 3, { response: 'Done' }), claimant);
>     expect(() => engine.execute(id, command('ask_again', 4, { message: 'Again' }), adjuster)).toThrow(expect.objectContaining({ code: 'CYCLE_LIMIT_REACHED' }));
>   });
>   it('conflicts on command IDs reused for a different accessible claim', () => {
>     const cmd = command('submit', 0); engine.execute(id, cmd, claimant);
>     const second = claims.create(fields, claimant);
>     expect(() => engine.execute(second.id, cmd, claimant)).toThrow(expect.objectContaining({ code: 'COMMAND_ID_REUSED' }));
>     expect(claims.get(second.id, claimant).revision).toBe(0);
>   });
>   it('rejects forged direct-service identity before processing', () => {
>     expect(() => Reflect.apply(engine.execute, engine, [id, command(), { id: claimant.id, role: 'claimant' }])).toThrow(expect.objectContaining({ code: 'IDENTITY_REQUIRED' }));
>   });
> });
> ''';p.write_text(s)
> p=Path('test/transitions.e2e-spec.ts');s=p.read_text().replace('function execute(payload: unknown', 'function execute(payload: object');p.write_text(s)
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH ./node_modules/.bin/tsc --noEmit --incremental false
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- src/claims/transition.service.spec.ts`
> - Ran ````python3 - <<'PY'
> from pathlib import Path
> p=Path('src/claims/transition.service.spec.ts');s=p.read_text().replace("[id, command(), { id: claimant.id", "[id, command('submit', 0), { id: claimant.id");p.write_text(s)
> p=Path('README.md');s=p.read_text().replace('transitions,\nprecondition execution, cycle counting, notifications, audits, receipts, and\nfrontend features.', 'transition execution (added in Task 07), and frontend features.').replace('Deferred: production authentication, transition authorization/execution,\nprecondition execution, cycle counting, notifications, audits, receipts, and\nfrontend features. Task 06 now provides claim ownership and create/read access\nrules; transactional workflow execution is the next implementation task.', 'Task 06 provides claim ownership and create/read access rules. Task 07 adds\ntransaction execution, transition RBAC, cycle limits, local notifications, audits,\nand receipts. Production authentication and frontend features remain deferred.')
> s=s.replace('Transitions, transition RBAC, preconditions, side effects, cycle counting,\naudit events, command receipts, notifications, and frontend work remain deferred.\nNo dependencies were added. Recommended next task: transactional transition\nexecution against each claim\'s pinned workflow with these access rules.', 'Task 07 now adds transactional transitions, transition RBAC, preconditions,\nlocal side effects, cycle counting, successful audit events, and command receipts.\nProduction authentication and frontend work remain deferred. No dependencies\nwere added for ownership or transition execution.')
> s=s.replace('  "revision": 0,\n  "createdAt"', '  "revision": 0,\n  "informationRequestCount": 0,\n  "createdAt"')
> s+='''
>
> ## Transactional workflow transitions (Task 07)
>
> POST /api/claims/:id/transitions uses the same verified development actor and
> production fail-closed guard as claim creation/reads. It accepts exactly:
>
> ```json
> {
>   "transitionId": "request_information",
>   "expectedRevision": 2,
>   "commandId": "5d459684-4a08-4c82-b610-cebde7153b76",
>   "input": { "message": "Please provide the purchase date." }
> }
> ```
>
> commandId is a UUID v4. expectedRevision is a nonnegative safe integer below the
> maximum safe integer, so incrementing remains safe. input is required (use {} for
> transitions without fields), contains only configured text fields, and cannot
> supply actor/role/state/revision/owner/version/counter/audit/notification overrides.
> Query parameters are rejected. Text is trimmed, bounded to 2000 code units before
> normalization, then checked against each configured field's required/min/max
> constraints. Required text cannot be whitespace-only. Unknown fields fail with
> 400 INVALID_REQUEST. No workflow configuration extension was needed.
>
> Successful execution returns 200:
>
> ```json
> {
>   "claim": {
>     "id": "d6721ff3-9ae4-41f6-8dc4-1bb2effe5dbc",
>     "ownerActorId": "claimant-1",
>     "workflowId": "claims",
>     "workflowVersion": 1,
>     "state": "awaiting_information",
>     "title": "Laptop damage",
>     "description": "Screen damaged during transport.",
>     "revision": 3,
>     "informationRequestCount": 1,
>     "createdAt": "2026-10-19T10:00:00.000Z",
>     "updatedAt": "2026-10-19T10:10:00.000Z"
>   },
>   "auditEventId": "22f6b5ac-2c5b-4ffd-bb27-1955ab6578eb",
>   "notificationIds": ["b16dd5bd-197c-44c5-a989-e02e8d99c679"]
> }
> ```
>
> ### Authorization, workflow rules and transaction
>
> The service verifies actor reference membership, validates the command envelope,
> then starts a short synchronous BEGIN IMMEDIATE transaction. It checks claim
> access before looking up receipts: another claimant's claim remains a 404 even
> when a command ID is known. It resolves the claim's exact pinned registered
> workflow rather than the startup default/latest version.
>
> A new command must name a configured transition, have an allowed configured role,
> match the current revision/source state, satisfy all configured preconditions
> (AND), and provide all configured input. claimFieldsPresent checks each configured
> claim text field. Every information_request-kind transition uses the same pinned
> root limit, capped at three; other transitions never increment or reset the count.
> Missing notification ownership on legacy-unowned claims returns 422 rather than
> inventing a recipient. Their read access remains unchanged.
>
> The conditional state update checks ID, expected revision, source state, and
> observed cycle count, and must affect exactly one row. It increments revision once.
> State/counter/updatedAt, successful audit, configured local notifications, and
> receipt commit together. Any error rolls the whole transaction back, including
> failed inserts after the state update. No success receipt remains for a failure.
>
> ### Idempotency and concurrency
>
> Command IDs are globally unique for successful transition requests, as required
> by Task 07 (a stricter scope than the early actor-scoped proposal). A deterministic
> SHA-256 fingerprint covers claim ID, transition ID, expected revision, and
> key-sorted normalized input. Object key order and trimmed whitespace do not cause
> false conflicts. UUID command IDs are normalized to lowercase.
>
> An identical request by the original actor returns the stored original response,
> even after later transitions or a restart, without repeating effects. Current
> claim access and pinned-workflow integrity are checked before replay. Changing a
> well-formed request, its target claim, or its actor returns 409 COMMAND_ID_REUSED
> when the caller has access to the target claim. Cross-owner denial takes priority.
> Receipts are retained indefinitely in this challenge. Creation POST remains
> non-idempotent; these receipts cover transition commands only.
>
> BEGIN IMMEDIATE serializes writers; conditional revision updates prevent silent
> lost writes. Two distinct commands with the same expected revision cannot both
> commit. SQLite lock exhaustion returns 503 STORAGE_BUSY: retry with the same
> command ID. Synchronous driver calls and the existing five-second busy timeout
> are suitable for this small local application, not a high-throughput deployment.
>
> ### Migration, events and local notifications
>
> Migration 004_workflow_transitions appends:
>
> - claims.information_request_count, default zero, constrained to 0–3. Claims remain
>   authoritative for current state, revision, and request count.
> - transition_events: claim FK, verified actor ID/role, transition ID, from/to state,
>   previous/resulting revision, validated input JSON, and UTC timestamp. Unique
>   (claim_id, resulting_revision) supports per-claim history in revision order.
> - notifications: event FK, effect position, claimant recipient, backend-owned
>   template/rendered message, and timestamp; unique (event_id, effect_index).
> - command_receipts: global command-ID primary key, unique event FK, fingerprint,
>   and complete original response JSON.
>
> Event -> claim -> pinned workflow and notification/receipt -> event relationships
> avoid duplicating authoritative workflow identities and association fields.
> The existing claim workflow-reference trigger prevents repinning those links.
> Audit before/after state and revision are intentional historical snapshots;
> receipt response JSON is intentionally denormalized to replay the exact result,
> never used as current claim state. Timestamps use Date.toISOString().
>
> Update/delete triggers make successful events, notifications, and receipts
> append-only for ordinary SQL/application operations. Database administrators can
> still drop triggers or edit files; these records are not tamper-proof. No APIs
> edit/delete them. Notification templates are backend-owned and only create local
> records; no email, external provider, workers, or network effects are involved.
> Failed attempts are not persisted in this task because the existing schema has
> no rejected-attempt facility; they never appear as successful events.
>
> Legacy claims/ownership/workflow references survive upgrade; the new counter is
> zero because no transition execution existed before migration 004. Migration
> 001–003 SQL/checksums remain unchanged. New foreign keys prevent orphan records.
>
> ### Stable errors
>
> Errors retain the existing {error: {code, message}} envelope:
>
> | Status | Code |
> |---|---|
> | 400 | INVALID_REQUEST |
> | 401 | IDENTITY_REQUIRED |
> | 403 | DEMO_IDENTITY_DISABLED, TRANSITION_FORBIDDEN |
> | 404 | CLAIM_NOT_FOUND, TRANSITION_NOT_FOUND |
> | 409 | REVISION_CONFLICT, STATE_CONFLICT, COMMAND_ID_REUSED |
> | 422 | PRECONDITION_FAILED, CYCLE_LIMIT_REACHED, NOTIFICATION_RECIPIENT_UNAVAILABLE |
> | 500 | CLAIM_WORKFLOW_UNAVAILABLE, CLAIM_STORAGE_FAILED, TRANSITION_STORAGE_FAILED |
> | 503 | STORAGE_BUSY |
>
> No raw database exception, SQL text, or filesystem path is exposed. A successful
> third information request is allowed; a fourth fails without state/counter/audit/
> notification/receipt changes. Approval/rejection can still proceed after the limit.
>
> ### Verification and next work
>
> ```sh
> npm test -- src/claims/transition.service.spec.ts
> npm test
> npm run test:e2e
> npm run build
> npm run lint
> ./node_modules/.bin/tsc --noEmit --incremental false
> git diff --check
> ```
>
> Tests cover config-only extensions, pinned versions, cross-owner access, roles,
> conditions/inputs, cycles, replay, competing commands over independent connections,
> held writer locks, append-only records, restart persistence, legacy upgrade, and
> fault injection at state/audit/notification/receipt writes. Concurrency tests use
> no sleeps; in-process synchronous calls are serialized, with an independent
> connection lock test exercising SQLite writer contention.
>
> Deferred: permitted-action discovery, audit/notification read APIs, rejected
> attempt logging, frontend UI, production authentication, external side effects,
> and workflow editing. Recommended next task: authorized action discovery and
> read-only audit history, followed by the frontend workflow demonstration.
> '''
> p.write_text(s)
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH ./node_modules/.bin/prettier --write src/claims/transition-command.ts src/claims/transition.service.ts src/claims/transition.service.spec.ts src/claims/claims.controller.ts src/claims/claims.module.ts src/claims/claim.types.ts src/claims/claim.service.ts src/database/migrations.ts src/database/database.spec.ts test/transitions.e2e-spec.ts test/claims.e2e-spec.ts
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH ./node_modules/.bin/tsc --noEmit --incremental false````
>
> </details>
>
> I’ve added tests for input key-order equivalence, inherited-property handling, a configured limit below three, and an added information-request transition sharing that limit. The supplemental type-check passes after correcting two test-fixture types. I’m running the final checks and reviewing the migration diff; no dependencies or workflow configuration fields were added.
>
> <details><summary>Ran 7 commands</summary>
>
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run lint`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- src/claims/transition.service.spec.ts`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- --reporter=dot`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run build`
> - Ran `git diff --stat; git diff -- src/database/migrations.ts src/claims/claims.module.ts src/claims/claims.controller.ts src/claims/claim.service.ts; cat src/claims/transition-command.ts; sed -n '1,230p' src/claims/transition.service.ts; git ls-files --others --exclude-standard; rg -n 'deferred|not implemented|no transition|remain' README.md | tail -20`
> - Ran `sed -n '238,270p' README.md; sed -n '234,345p' src/claims/transition.service.ts; git diff -- src/claims/claim-access.spec.ts src/database/database.spec.ts`
> - Ran ``python3 - <<'PY'
> from pathlib import Path
> p=Path('README.md');s=p.read_text().replace('restore tooling, workflow version selection/migration, claim pinning, transition\nexecution, authentication, and real side effects are not implemented here.', 'restore tooling, workflow-version migration, production authentication, and\nexternal side effects remain deferred. Later sections describe claim pinning\nand transition execution added after Task 04.').replace('on existing claims, even when the proposed version exists. No claim update or\ntransition API is implemented.', 'on existing claims, even when the proposed version exists. General claim-edit\nAPIs remain deferred; Task 07 adds the transition command API.').replace('and resolveWorkflow(id)\nretrieves exactly that version', 'and resolveWorkflow(id, actor)\nretrieves exactly that version');p.write_text(s)
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH ./node_modules/.bin/tsc --noEmit --incremental false
> python3 - <<'PY'
> from pathlib import Path
> import subprocess,re,hashlib
> baseline=subprocess.check_output(['git','show',':backend/src/database/migrations.ts']).decode()
> current=Path('src/database/migrations.ts').read_text()
> old=re.findall(r'sql: `(.+?)`',baseline,re.S)[:3]
> new=re.findall(r'sql: `(.+?)`',current,re.S)[:3]
> assert old==new
> # The migration runner itself must also remain unchanged.
> assert baseline[baseline.index('export class DatabaseError'):] == current[current.index('export class DatabaseError'):]
> print('Migrations 001–003 and migration runner unchanged: PASS')
> Path('tsconfig.build.tsbuildinfo').write_bytes(subprocess.check_output(['git','show',':backend/tsconfig.build.tsbuildinfo']))
> PY
> git diff --check
> git status --short | tail -8``
>
> </details>
</details>

Implemented Task 07 only. No dependencies added and no commit created.

`POST /api/claims/:id/transitions` now executes against the claim’s exact pinned workflow:

```json
{
  "transitionId": "request_information",
  "expectedRevision": 2,
  "commandId": "5d459684-4a08-4c82-b610-cebde7153b76",
  "input": {"message": "Please provide the purchase date."}
}
```

Success returns `200` with the updated claim, audit event ID, and notification IDs.

The engine enforces ownership, configured roles, source state, preconditions, required inputs, revision checks, and the lifetime information-request limit. State, counter, audit, local notifications, and receipt commit atomically. Matching retries return the original result; conflicting command-ID reuse returns `409`.

Migration `004_workflow_transitions` adds the claim counter and three tables: `transition_events`, `notifications`, and `command_receipts`. Foreign keys preserve claim associations; update/delete triggers protect persisted success records. Migrations 001–003 and the migration runner remain unchanged.

Changed files include:

- [transition.service.ts](./backend/src/claims/transition.service.ts): transactional execution and replay.
- [transition-command.ts](./backend/src/claims/transition-command.ts): strict command validation and fingerprinting.
- Claims controller/module/types/service: endpoint wiring, errors, and counter responses.
- Migration and existing tests: new schema expectations.
- New transition service and E2E tests.
- Backend README: API, transaction, idempotency, and limitation documentation.

Checks ran with Node **22.15.1**:

| Command | Result |
|---|---|
| `npm test -- src/claims/transition.service.spec.ts` | **36 passed** |
| `npm test -- --reporter=dot` | **169 passed** |
| `npm run test:e2e` | **74 passed** |
| `npm run build` | Passed |
| `npm run lint` | Passed |
| `tsc --noEmit --incremental false` | Passed |
| `git diff --check` | Passed |

Tests cover rollback at every write stage, cycle exhaustion, replay after restart, competing commands, lock contention, pinned versions, and configuration-only extensions. Development migration-constraint and test-typing errors were corrected before successful reruns.

The existing Observe worker error remains visible during the passing E2E suite. Rejected-attempt persistence and audit/notification read APIs remain deferred. Demo identity remains development-only; notifications are local records.

Final diff reviewed and generated compiler-cache changes discarded. Recommended next task: authorized action discovery and read-only audit history.

> Investigate and fix the `MIGRATION_DRIFT` startup error in `backend/src/database/migrations.ts`.
>
> Observed error:
>
> `DatabaseError: Applied migration history does not match this application. Restore the matching migration set.`\
> `code: MIGRATION_DRIFT`
>
> Context:
>
> - This is the Claims Workflow Orchestrator AI Challenge.
> - Existing migrations from previous tasks include `001_workflow_versions`, `002_claims`, and `003_claim_ownership`.
> - Migration history and previously applied schema must remain intact.
> - Do not delete the SQLite database, drop tables, reset migration history, or bypass checksum verification.
>
> Tasks:
>
> 1. Inspect the migration runner and determine exactly which migration ID/checksum differs between the stored migration history and the current migration definitions.
> 2. Identify the active SQLite database path from the actual runtime configuration. Do not assume it is the default path.
> 3. Inspect the relevant migration history rows and current migration files. Do not print sensitive data.
> 4. Determine whether the cause is a modified historical migration, a renamed/removed migration, an unexpected database file, or another mismatch.
> 5. If an earlier migration was modified after being applied, restore its original contents from Git history or the appropriate earlier commit when available. Do not guess the original SQL or checksum.
> 6. If the application is opening an unintended database, correct the configuration or environment variable instead of modifying migration history.
> 7. If the original migration cannot be recovered, stop and report the exact discrepancy and safe recovery options. Do not silently rewrite history.
> 8. Add or update tests to verify migration drift is detected and that existing migration history remains compatible.
> 9. Run the relevant migration/database tests and report the actual results.
>
> Constraints:
>
> - Do not modify previously applied migrations merely to make startup pass.
> - Do not change stored checksums or disable drift detection as a workaround.
> - Do not delete or recreate user data.
> - Keep the fix minimal and limited to the verified cause.
>
> Final report must include:
>
> - Root cause and evidence.
> - Active SQLite database path.
> - Exact migration ID involved.
> - Files changed.
> - Tests actually run and their results.
> - Whether the original migration history and existing data were preserved.

<details><summary>6 previous messages</summary>

> I’ll trace the database path used at startup, compare its migration IDs and checksums with the current definitions and available history, and fix only a verified mismatch. I won’t change stored migration history or delete data.
>
> <details><summary>Ran 4 commands</summary>
>
> - Ran `pwd; git status --short; cat backend/src/database/database.service.ts backend/src/database/migrations.ts; cat backend/package.json; rg --files --hidden -g 'AGENTS.md' -g '.env*' -g '*launch*' -g '*ecosystem*' -g '*compose*' -g '!node_modules' -g '!.git' -g '!dist'`
> - Ran ``python3 - <<'PY'
> import sqlite3,hashlib,re,subprocess,json
> from pathlib import Path
> p=Path('backend/data/claims.sqlite').resolve()
> conn=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True)
> try:
>  rows=conn.execute('select id,checksum from schema_migrations order by id').fetchall()
>  sources={'working':Path('backend/src/database/migrations.ts').read_text(),'index':subprocess.check_output(['git','show',':backend/src/database/migrations.ts']).decode()}
>  if Path('backend/dist/database/migrations.js').exists(): sources['compiled']=Path('backend/dist/database/migrations.js').read_text()
>  print('Candidate database:',p)
>  print('Stored migration history:',json.dumps(rows))
>  for label,source in sources.items():
>   ids=re.findall(r"id: ['\"]([^'\"]+)['\"]",source)
>   sqls=re.findall(r'sql: `(.+?)`',source,re.S)
>   print(label,json.dumps([(id,hashlib.sha256(sql.encode()).hexdigest()) for id,sql in zip(ids,sqls)]))
>  print('Schema objects:',json.dumps(conn.execute("SELECT type,name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").fetchall()))
> finally:conn.close()
> PY``
> - Ran `ps -axo pid,ppid,comm | rg 'node|nest|npm|vite|zsh'`
> - Ran `python3 - <<'PY'
> import subprocess,re,json
> for pid in (2276,2308,2619,2636,2637):
>  command=subprocess.run(['ps','-p',str(pid),'-o','command='],capture_output=True,text=True).stdout.strip()
>  environment=subprocess.run(['ps','eww','-p',str(pid),'-o','command='],capture_output=True,text=True).stdout
>  values={key:(re.search(r'(?:^|\s)'+key+r'=([^\s]*)',environment).group(1) if re.search(r'(?:^|\s)'+key+r'=([^\s]*)',environment) else '<unset>') for key in ('SQLITE_DATABASE_PATH','NODE_ENV')}
>  cwd=subprocess.run(['/usr/sbin/lsof','-a','-p',str(pid),'-d','cwd','-Fn'],capture_output=True,text=True).stdout
>  print(json.dumps({'pid':pid,'command':command,'configuration':values,'cwd': [line[1:] for line in cwd.splitlines() if line.startswith('n')]}))
> PY`
>
> </details>
>
> The mismatch is in `004_workflow_transitions`; migrations 001–003 match exactly. The running backend has no `SQLITE_DATABASE_PATH` override and runs from `backend/`, which confirms it selects `backend/data/claims.sqlite`.
>
> The stored migration 004 checksum is `6940a9a7…e05db7`; the current source and compiled definition hash to `c0a49a41…1248ce`. I changed migration 004’s constraints during Task 07 after its earlier form had been applied. I’ll recover that exact earlier SQL from the recorded tool call and verify its full checksum before restoring it.
>
> <details><summary>Ran 2 commands</summary>
>
> - Ran ``mkdir -p backend/src/database/fixtures
> cat > /private/tmp/claims-original-migration-004.sql <<'EOF'
> ALTER TABLE claims ADD COLUMN information_request_count INTEGER NOT NULL DEFAULT 0 CHECK(information_request_count BETWEEN 0 AND 3);
>     CREATE TABLE transition_events (
>       id TEXT PRIMARY KEY NOT NULL,
>       claim_id TEXT NOT NULL REFERENCES claims(id),
>       actor_id TEXT NOT NULL,
>       actor_role TEXT NOT NULL CHECK(actor_role IN ('claimant', 'adjuster')),
>       transition_id TEXT NOT NULL,
>       from_state TEXT NOT NULL,
>       to_state TEXT NOT NULL,
>       previous_revision INTEGER NOT NULL CHECK(previous_revision >= 0),
>       resulting_revision INTEGER NOT NULL CHECK(resulting_revision = previous_revision + 1),
>       input_json TEXT NOT NULL CHECK(json_valid(input_json)),
>       created_at TEXT NOT NULL,
>       UNIQUE(claim_id, resulting_revision)
>     ) STRICT;
>     CREATE TABLE notifications (
>       id TEXT PRIMARY KEY NOT NULL,
>       event_id TEXT NOT NULL REFERENCES transition_events(id),
>       effect_index INTEGER NOT NULL CHECK(effect_index >= 0),
>       recipient_actor_id TEXT NOT NULL,
>       template TEXT NOT NULL CHECK(template IN ('information_requested', 'claim_approved', 'claim_rejected')),
>       message TEXT NOT NULL,
>       created_at TEXT NOT NULL,
>       UNIQUE(event_id, effect_index)
>     ) STRICT;
>     CREATE TABLE command_receipts (
>       command_id TEXT PRIMARY KEY NOT NULL,
>       event_id TEXT NOT NULL UNIQUE REFERENCES transition_events(id),
>       fingerprint TEXT NOT NULL CHECK(length(fingerprint) = 64),
>       result_json TEXT NOT NULL CHECK(json_valid(result_json))
>     ) STRICT;
>     CREATE TRIGGER transition_events_no_update BEFORE UPDATE ON transition_events BEGIN SELECT RAISE(ABORT, 'Transition events are immutable'); END;
>     CREATE TRIGGER transition_events_no_delete BEFORE DELETE ON transition_events BEGIN SELECT RAISE(ABORT, 'Transition events are immutable'); END;
>     CREATE TRIGGER notifications_no_update BEFORE UPDATE ON notifications BEGIN SELECT RAISE(ABORT, 'Notifications are immutable'); END;
>     CREATE TRIGGER notifications_no_delete BEFORE DELETE ON notifications BEGIN SELECT RAISE(ABORT, 'Notifications are immutable'); END;
>     CREATE TRIGGER command_receipts_no_update BEFORE UPDATE ON command_receipts BEGIN SELECT RAISE(ABORT, 'Command receipts are immutable'); END;
>     CREATE TRIGGER command_receipts_no_delete BEFORE DELETE ON command_receipts BEGIN SELECT RAISE(ABORT, 'Command receipts are immutable'); END;
> EOF
> python3 - <<'PY'
> import sqlite3,hashlib,re,json
> from pathlib import Path
> p=Path('backend/data/claims.sqlite').resolve()
> conn=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True)
> try:
>  expected=conn.execute("SELECT checksum FROM schema_migrations WHERE id='004_workflow_transitions'").fetchone()[0]
>  # Remove only the heredoc's delimiter newline: the original template literal ends at its semicolon.
>  sql=Path('/private/tmp/claims-original-migration-004.sql').read_text().removesuffix('\n')
>  actual=hashlib.sha256(sql.encode()).hexdigest()
>  print('Recovered recorded Task 07 SQL checksum:',actual)
>  assert actual==expected, 'Recovery differs from recorded database checksum; do not edit source'
>  print('Exact match with stored migration 004: PASS')
>  tables=['schema_migrations','workflow_versions','claims','transition_events','notifications','command_receipts']
>  # Store private verification digests, never print application records.
>  hashes={}
>  for table in tables:
>   rows=conn.execute(f'SELECT * FROM {table} ORDER BY rowid').fetchall()
>   hashes[table]={'count':len(rows),'digest':hashlib.sha256(json.dumps(rows,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()}
>  Path('/private/tmp/claims-migration-before.json').write_text(json.dumps(hashes))
>  print('Read-only data verification baseline captured (no row contents printed).')
> finally:conn.close()
> p=Path('backend/src/database/migrations.ts');source=p.read_text()
> matches=list(re.finditer(r'sql: `(.+?)`',source,re.S));assert len(matches)==4
> match=matches[3]
> p.write_text(source[:match.start(1)]+sql+source[match.end(1):])
> Path('backend/src/database/fixtures/004_workflow_transitions.original.sql').write_text(sql)
> print('Restored source and saved exact historical test fixture; database unchanged.')
> PY``
> - Ran ``cat > backend/src/database/migration-history.spec.ts <<'EOF'
> import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
> import { tmpdir } from 'node:os';
> import { join } from 'node:path';
> import { randomUUID } from 'node:crypto';
> import Database from 'better-sqlite3';
> import { DatabaseError, MIGRATIONS, migrationChecksum, runMigrations } from './migrations.js';
> import { loadWorkflowDefinition } from '../workflow/workflow-config.service.js';
> import { canonicalWorkflowJson, workflowDigest } from '../workflow/workflow-registry.service.js';
>
> // Exact SQL recovered from the original Task 07 tool call. Its hash matches the
> // existing application's stored ledger, unlike the subsequently hardened SQL.
> const originalSql = readFileSync(new URL('./fixtures/004_workflow_transitions.original.sql', import.meta.url), 'utf8');
> const archivedMigration = { id: '004_workflow_transitions', sql: originalSql };
> const historicalHashes = [
>   '306d576e7ec1decd06e12b6c66758400b07a0e1bf35e9c228149e8c8db165a6a',
>   'ede9401f0a11fa973173f0cf6160f7c931fbf945c710a7b5b55968310d05dcd5',
>   'daec614a1a2674c99178164b13aa4258653e3846b014029c5c2ccbeb7692f508',
>   '6940a9a79b6c29999b4038e38ec6e885f2d8be7c4fd75405a486ebad69e05db7',
> ];
> const tables = ['schema_migrations', 'workflow_versions', 'claims', 'transition_events', 'notifications', 'command_receipts'] as const;
> let directory: string;
> let db: Database.Database;
> function snapshot() {
>   return tables.map(table => db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all());
> }
> beforeEach(() => {
>   directory = mkdtempSync(join(tmpdir(), 'migration-history-'));
>   db = new Database(join(directory, 'historical.sqlite'));
>   db.pragma('foreign_keys=ON');
>   // Initialize using the independently archived SQL, not the current migration 004.
>   runMigrations(db, [...MIGRATIONS.slice(0, 3), archivedMigration]);
>   const definition = loadWorkflowDefinition();
>   const json = canonicalWorkflowJson(definition);
>   const timestamp = '2026-10-19T10:00:00.000Z';
>   const claimId = randomUUID(); const eventId = randomUUID(); const notificationId = randomUUID();
>   db.prepare('INSERT INTO workflow_versions VALUES (?, ?, ?, ?, ?, ?)').run('claims', 1, 1, json, workflowDigest(json), timestamp);
>   db.prepare(`INSERT INTO claims (id,workflow_id,workflow_version,state,title,description,revision,created_at,updated_at,owner_actor_id,information_request_count)
>     VALUES (?,'claims',1,'awaiting_information','Damage','Existing claim',3,?,?,'claimant-1',1)`).run(claimId, timestamp, timestamp);
>   db.prepare(`INSERT INTO transition_events VALUES (?,?,'adjuster-1','adjuster','request_information','under_review','awaiting_information',2,3,?,?)`).run(eventId, claimId, '{"message":"More information"}', timestamp);
>   db.prepare('INSERT INTO notifications VALUES (?,?,0,?,?,?,?)').run(notificationId, eventId, 'claimant-1', 'information_requested', 'Information requested: More information', timestamp);
>   db.prepare('INSERT INTO command_receipts VALUES (?,?,?,?)').run(randomUUID(), eventId, 'a'.repeat(64), JSON.stringify({ claimId, auditEventId: eventId, notificationIds: [notificationId] }));
> });
> afterEach(() => { db?.close(); rmSync(directory, { recursive: true, force: true }); });
>
> describe('compatibility with already-applied migration history', () => {
>   it('retains every verified historical checksum including original migration 004', () => {
>     expect(migrationChecksum(archivedMigration)).toBe(historicalHashes[3]);
>     expect(MIGRATIONS.map(migrationChecksum)).toEqual(historicalHashes);
>   });
>   it('accepts a populated original database without changing history, schema, or data', () => {
>     const before = snapshot();
>     const schema = db.prepare('SELECT type,name,sql FROM sqlite_master ORDER BY name').all();
>     runMigrations(db); runMigrations(db);
>     expect(snapshot()).toEqual(before);
>     expect(db.prepare('SELECT type,name,sql FROM sqlite_master ORDER BY name').all()).toEqual(schema);
>     expect(db.pragma('foreign_key_check')).toEqual([]);
>   });
>   it('rejects edited applied SQL and preserves the original ledger and all rows', () => {
>     const before = snapshot();
>     const changed = [...MIGRATIONS.slice(0, 3), { ...archivedMigration, sql: `${originalSql}\n` }];
>     expect(() => runMigrations(db, changed)).toThrow(expect.objectContaining({ code: 'MIGRATION_DRIFT' }));
>     expect(snapshot()).toEqual(before);
>   });
>   it('rejects a renamed historical migration without rewriting history', () => {
>     const before = snapshot();
>     expect(() => runMigrations(db, [...MIGRATIONS.slice(0, 3), { ...archivedMigration, id: '004_renamed' }])).toThrow(DatabaseError);
>     expect(snapshot()).toEqual(before);
>   });
>   it('rejects a removed historical migration without deleting data', () => {
>     const before = snapshot();
>     expect(() => runMigrations(db, MIGRATIONS.slice(0, 3))).toThrow(expect.objectContaining({ code: 'MIGRATION_DRIFT' }));
>     expect(snapshot()).toEqual(before);
>   });
> });
> EOF
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH backend/node_modules/.bin/prettier --write backend/src/database/migration-history.spec.ts
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix backend test -- src/database/migration-history.spec.ts src/database/database.spec.ts``
>
> </details>
>
> The recovered SQL hashes exactly to the checksum stored in the database, so I restored that version without changing the ledger. Git has no commits and its index contains only migrations 001–003; the recovery source was the earlier Task 07 tool call, confirmed by the full SHA-256 match.
>
> The targeted migration/database suite passes all 36 tests. The new tests use the archived SQL to create a populated historical database, then verify compatibility and confirm that edited, renamed, or removed migrations still fail without changing its rows.
>
> <details><summary>Ran 5 commands</summary>
>
> - Ran `python3 - <<'PY'
> import subprocess,json
> rows=subprocess.check_output(['ps','-axo','pid=,ppid=,comm='],text=True)
> parsed=[line.strip().split(None,2) for line in rows.splitlines() if line.strip()]
> backend={2308}
> while True:
>  children={int(pid) for pid,parent,_ in parsed if int(parent) in backend}
>  if children.issubset(backend): break
>  backend |= children
> for pid in sorted(backend):
>  files=subprocess.run(['/usr/sbin/lsof','-a','-p',str(pid),'-Fn'],capture_output=True,text=True).stdout
>  names=[line[1:] for line in files.splitlines() if line.startswith('n') and '/claims-workflow-orchestrator/backend/data/claims.sqlite' in line]
>  print(json.dumps({'backendPid':pid,'openDatabaseFiles':names}))
> PY`
> - Ran ``python3 - <<'PY'
> from pathlib import Path
> import sqlite3,hashlib,json,re,subprocess
> p=Path('backend/data/claims.sqlite').resolve()
> conn=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True)
> try:
>  baseline=json.loads(Path('/private/tmp/claims-migration-before.json').read_text())
>  for table,expected in baseline.items():
>   rows=conn.execute(f'SELECT * FROM {table} ORDER BY rowid').fetchall()
>   actual={'count':len(rows),'digest':hashlib.sha256(json.dumps(rows,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()}
>   assert actual==expected,f'{table} changed during verification'
>  print('Original migration history and all existing application rows unchanged: PASS')
>  stored=dict(conn.execute('SELECT id,checksum FROM schema_migrations'))
>  for name in ['backend/src/database/migrations.ts','backend/dist/database/migrations.js']:
>   source=Path(name).read_text();ids=re.findall(r"id: ['\"]([^'\"]+)['\"]",source);sqls=re.findall(r'sql: `(.+?)`',source,re.S)
>   current={id:hashlib.sha256(sql.encode()).hexdigest() for id,sql in zip(ids,sqls)}
>   assert current==stored,f'{name} still differs'
>   print(name+': all migration checksums match stored history')
>  baseline_source=subprocess.check_output(['git','show',':backend/src/database/migrations.ts']).decode()
>  old=re.findall(r'sql: `(.+?)`',baseline_source,re.S)[:3]
>  new=re.findall(r'sql: `(.+?)`',Path('backend/src/database/migrations.ts').read_text(),re.S)[:3]
>  assert old==new
>  print('Migrations 001–003 unchanged: PASS')
> finally: conn.close()
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix backend test -- --reporter=dot
> git diff --check``
> - Ran `git diff --check; git diff --numstat -- backend/src/database/migrations.ts backend/src/database/migration-history.spec.ts; git ls-files --others --exclude-standard backend/src/database; git diff -- backend/src/database/migrations.ts`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix backend run lint`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH backend/node_modules/.bin/tsc -p backend/tsconfig.json --noEmit --incremental false`
>
> </details>
</details>

Fixed. The cause was my Task 07 edit to **`004_workflow_transitions` after its earlier SQL had already been applied**. Migrations 001–003 matched.

The mismatch was:

- Stored: `6940a9a79b6c29999b4038e38ec6e885f2d8be7c4fd75405a486ebad69e05db7`
- Modified source: `c0a49a41aa75ab16105b63f96e8545b70a29949e4f6ceb39078d702d0d1248ce`

I recovered the original SQL from the recorded Task 07 tool call and verified its exact checksum before restoring it. Git has no commits containing migration 004.

The confirmed active database is:

`/Users/tranngochung/Folders/claims-workflow-orchestrator/backend/data/claims.sqlite`

The running backend has no path override. After restoration, its restarted process reopened that file, and both source and compiled migration checksums match the stored history.

Files changed:

- `backend/src/database/migrations.ts` — restored original migration 004.
- `backend/src/database/fixtures/004_workflow_transitions.original.sql` — exact historical test fixture.
- `backend/src/database/migration-history.spec.ts` — compatibility and drift regression tests.

Actual verification:

| Command | Result |
|---|---|
| `npm --prefix backend test -- src/database/migration-history.spec.ts src/database/database.spec.ts` | **36 passed** |
| `npm --prefix backend test -- --reporter=dot` | **174 passed** |
| `npm --prefix backend run lint` | Passed |
| TypeScript check with `--noEmit --incremental false` | Passed |
| `git diff --check` | Passed |

**Original migration history and existing data were preserved.** Read-only before/after comparisons confirmed all existing application rows remained unchanged. No stored checksums, tables, or data were reset.

> User context
>
> Attachments:
> - # Task 08 — Authorized Action Discovery & Read-Only Audit History ## Context We…: `~/.codex/attachments/1aef123d-b5dd-472f-917e-0d440d36c488/Pasted text.txt`

<details><summary>8 previous messages</summary>

> I’ll read Task 08 and inspect the transition engine and access policy before adding action discovery and audit history. I’ll leave the applied migrations unchanged.
>
> <details><summary>Explored a file, ran a command</summary>
>
> <details><summary>Explored a file</summary>
>
> - Read `~/.codex/attachments/1aef123d-b5dd-472f-917e-0d440d36c488/Pasted text.txt`
>
> </details>
>
> - Ran `cat backend/src/claims/claims.controller.ts backend/src/claims/claims.module.ts backend/src/claims/claims-http.ts; sed -n '1,180p' backend/src/claims/transition.service.ts; cat backend/src/workflow/workflow.types.ts; sed -n '1,90p' backend/test/transitions.e2e-spec.ts; cat backend/package.json backend/vitest.config.ts backend/vitest.config.e2e.ts; git status --short; rg --files -g AGENTS.md -g '!node_modules' -g '!.git'`
>
> </details>
>
> The persisted audit events already contain the fields needed, so no migration is necessary. Discovery will return current-state transitions with eligibility, a stable blocking reason, and configured input metadata. Required input will be collected at submission; discovery stays advisory. I’ll share the existing precondition, cycle-limit, and recipient checks with execution, while preserving Task 07’s validation order. Audit history will use the existing authorization and bounded pagination rules.
>
> <details><summary>Ran 2 commands</summary>
>
> - Ran ``python3 - <<'PY'
> from pathlib import Path
> import sqlite3,hashlib,json
> p=Path('backend/src/database/migrations.ts')
> Path('/private/tmp/task08-migrations.sha256').write_text(hashlib.sha256(p.read_bytes()).hexdigest())
> p=Path('backend/tsconfig.build.tsbuildinfo')
> if p.exists(): Path('/private/tmp/task08-tsbuildinfo').write_bytes(p.read_bytes())
> p=Path('backend/data/claims.sqlite').resolve()
> if p.exists():
>  db=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True)
>  try:
>   tables=['schema_migrations','workflow_versions','claims','transition_events','notifications','command_receipts']
>   snapshot={table:hashlib.sha256(json.dumps(db.execute(f'SELECT * FROM {table} ORDER BY rowid').fetchall(),ensure_ascii=False,separators=(',',':')).encode()).hexdigest() for table in tables}
>   Path('/private/tmp/task08-data-baseline.json').write_text(json.dumps(snapshot))
>  finally: db.close()
> print('Captured migration/file and existing-data baselines without printing application data.')
> PY
> cat > backend/src/claims/transition-eligibility.ts <<'EOF'
> import type { Claim } from './claim.types.js';
> import type { TransitionDefinition } from '../workflow/workflow.types.js';
>
> export type TransitionConstraintCode =
>   | 'PRECONDITION_FAILED'
>   | 'CYCLE_LIMIT_REACHED'
>   | 'NOTIFICATION_RECIPIENT_UNAVAILABLE';
> export interface TransitionConstraintFailure {
>   readonly code: TransitionConstraintCode;
>   readonly message: string;
> }
> /** Read-only checks supported by the current schema, shared with execution. */
> export function transitionConstraintFailure(
>   claim: Claim,
>   transition: TransitionDefinition,
>   informationRequestLimit: number,
> ): TransitionConstraintFailure | null {
>   for (const condition of transition.preconditions) {
>     if (condition.fields.some(field => !claim[field].trim())) {
>       return { code: 'PRECONDITION_FAILED', message: 'Required claim fields are missing.' };
>     }
>   }
>   if (transition.kind === 'information_request' && claim.informationRequestCount >= Math.min(3, informationRequestLimit)) {
>     return { code: 'CYCLE_LIMIT_REACHED', message: 'Information-request limit reached.' };
>   }
>   if (transition.sideEffects.length && claim.ownerActorId === null) {
>     return { code: 'NOTIFICATION_RECIPIENT_UNAVAILABLE', message: 'Claim has no notification recipient.' };
>   }
>   return null;
> }
> EOF
> cat > backend/src/claims/claim-workflow-read.types.ts <<'EOF'
> import type { ActorRole, InputFieldDefinition } from '../workflow/workflow.types.js';
> import type { TransitionConstraintCode } from './transition-eligibility.js';
> export interface AvailableTransition {
>   readonly id: string;
>   readonly label: string;
>   readonly from: string;
>   readonly to: string;
>   readonly eligible: boolean;
>   readonly reasonCode: 'TRANSITION_FORBIDDEN' | TransitionConstraintCode | null;
>   readonly inputFields: readonly InputFieldDefinition[];
> }
> export interface AvailableTransitions {
>   readonly claimId: string;
>   readonly workflowId: string;
>   readonly workflowVersion: number;
>   readonly state: string;
>   readonly revision: number;
>   readonly informationRequestCount: number;
>   readonly informationRequestLimit: number;
>   readonly transitions: readonly AvailableTransition[];
> }
> export interface ClaimAuditEvent {
>   readonly id: string;
>   readonly transitionId: string;
>   readonly actor: { readonly id: string; readonly role: ActorRole };
>   readonly fromState: string;
>   readonly toState: string;
>   readonly previousRevision: number;
>   readonly resultingRevision: number;
>   readonly createdAt: string;
> }
> export interface ClaimAuditPage {
>   readonly claimId: string;
>   readonly workflowId: string;
>   readonly workflowVersion: number;
>   readonly items: readonly ClaimAuditEvent[];
>   readonly limit: number;
>   readonly offset: number;
> }
> EOF
> cat > backend/src/claims/claim-workflow-read.service.ts <<'EOF'
> import { DatabaseService } from '../database/database.service.js';
> import type { ActorRole } from '../workflow/workflow.types.js';
> import { ClaimService } from './claim.service.js';
> import { requireVerifiedActor } from './claim-access.js';
> import type { VerifiedActor } from './claim-access.js';
> import { ClaimError, validatePagination } from './claim.types.js';
> import { transitionConstraintFailure } from './transition-eligibility.js';
> import type { AvailableTransition, AvailableTransitions, ClaimAuditEvent, ClaimAuditPage } from './claim-workflow-read.types.js';
>
> type AuditRow = Omit<ClaimAuditEvent, 'actor'> & { actorId: string; actorRole: ActorRole };
> export class ClaimWorkflowReadService {
>   constructor(private readonly database: DatabaseService, private readonly claims: ClaimService) {}
>   availableTransitions(claimId: string, identity: VerifiedActor): AvailableTransitions {
>     const actor = requireVerifiedActor(identity);
>     try {
>       // A deferred read transaction keeps claim and definition reads in one snapshot.
>       return this.database.connection.transaction(() => {
>         const claim = this.claims.get(claimId, actor);
>         const workflow = this.claims.resolveWorkflow(claim.id, actor).definition;
>         const transitions = workflow.transitions.filter(transition => transition.from === claim.state).map((transition): AvailableTransition => {
>           const reasonCode = !transition.roles.includes(actor.role)
>             ? 'TRANSITION_FORBIDDEN'
>             : transitionConstraintFailure(claim, transition, workflow.limits.informationRequests)?.code ?? null;
>           return Object.freeze({ id: transition.id, label: transition.label, from: transition.from, to: transition.to, eligible: reasonCode === null, reasonCode, inputFields: transition.inputFields });
>         });
>         return Object.freeze({ claimId: claim.id, workflowId: claim.workflowId, workflowVersion: claim.workflowVersion,
>           state: claim.state, revision: claim.revision, informationRequestCount: claim.informationRequestCount,
>           informationRequestLimit: Math.min(3, workflow.limits.informationRequests), transitions: Object.freeze(transitions) });
>       }).deferred();
>     } catch (error) {
>       if (error instanceof ClaimError) throw error;
>       throw new ClaimError('CLAIM_STORAGE_FAILED', 500, 'Unable to discover claim transitions.');
>     }
>   }
>   audit(claimId: string, identity: VerifiedActor, limit = 50, offset = 0): ClaimAuditPage {
>     const actor = requireVerifiedActor(identity);
>     validatePagination(limit, offset);
>     try {
>       return this.database.connection.transaction(() => {
>         const claim = this.claims.get(claimId, actor);
>         const rows = this.database.connection.prepare<[string, number, number], AuditRow>(`SELECT id, transition_id AS transitionId,
>           actor_id AS actorId, actor_role AS actorRole, from_state AS fromState, to_state AS toState,
>           previous_revision AS previousRevision, resulting_revision AS resultingRevision, created_at AS createdAt
>           FROM transition_events WHERE claim_id = ? ORDER BY created_at ASC, resulting_revision ASC, id ASC LIMIT ? OFFSET ?`).all(claim.id, limit, offset);
>         const items = rows.map(({ actorId, actorRole, ...event }): ClaimAuditEvent => Object.freeze({ ...event, actor: Object.freeze({ id: actorId, role: actorRole }) }));
>         return Object.freeze({ claimId: claim.id, workflowId: claim.workflowId, workflowVersion: claim.workflowVersion, items: Object.freeze(items), limit, offset });
>       }).deferred();
>     } catch (error) {
>       if (error instanceof ClaimError) throw error;
>       throw new ClaimError('CLAIM_STORAGE_FAILED', 500, 'Unable to read claim audit history.');
>     }
>   }
> }
> EOF
> python3 - <<'PY'
> from pathlib import Path
> p=Path('backend/src/claims/transition.service.ts');s=p.read_text().replace("import { randomUUID } from 'node:crypto';", "import { randomUUID } from 'node:crypto';\nimport { transitionConstraintFailure } from './transition-eligibility.js';")
> a=s.index('          for (const condition of transition.preconditions)');b=s.index('          const timestamp',a)
> s=s[:a]+'''          const failure = transitionConstraintFailure(claim, transition, workflow.limits.informationRequests);
>           if (failure) throw new ClaimError(failure.code, 422, failure.message);
>           const increment = transition.kind === 'information_request' ? 1 : 0;
> '''+s[b:];p.write_text(s)
> p=Path('backend/src/claims/claims.module.ts');s=p.read_text().replace("import { ClaimService }", "import { ClaimWorkflowReadService } from './claim-workflow-read.service.js';\nimport { ClaimService }").replace('    ClaimsDemoGuard,','''    ClaimsDemoGuard,
>     { provide: ClaimWorkflowReadService, inject: [DatabaseService, ClaimService], useFactory: (database: DatabaseService, claims: ClaimService) => new ClaimWorkflowReadService(database, claims) },''').replace('exports: [ClaimService, TransitionService]', 'exports: [ClaimService, TransitionService, ClaimWorkflowReadService]');p.write_text(s)
> p=Path('backend/src/claims/claims.controller.ts');s=p.read_text().replace("import { TransitionService }", "import { ClaimWorkflowReadService } from './claim-workflow-read.service.js';\nimport type { AvailableTransitions, ClaimAuditPage } from './claim-workflow-read.types.js';\nimport { TransitionService }").replace('    private readonly transitions: TransitionService,','    private readonly transitions: TransitionService,\n    private readonly workflowReads: ClaimWorkflowReadService,')
> s=s.replace("  @Get(':id')", '''  @Get(':id/available-transitions')
>   availableTransitions(@Param('id') id: string, @CurrentActor() actor: VerifiedActor, @Query(new EmptyClaimQueryPipe()) _query: unknown): AvailableTransitions {
>     return this.workflowReads.availableTransitions(id, actor);
>   }
>   @Get(':id/audit')
>   audit(@Param('id') id: string, @CurrentActor() actor: VerifiedActor, @Query(new ClaimQueryPipe()) query: { limit: number; offset: number }): ClaimAuditPage {
>     return this.workflowReads.audit(id, actor, query.limit, query.offset);
>   }
>   @Get(':id')''');p.write_text(s)
> PY``
> - Ran ``cat > src/claims/claim-workflow-read.service.spec.ts <<'EOF'
> import { mkdtempSync, rmSync } from 'node:fs';
> import { tmpdir } from 'node:os';
> import { join } from 'node:path';
> import { randomUUID } from 'node:crypto';
> import { DatabaseService } from '../database/database.service.js';
> import { WorkflowConfigService } from '../workflow/workflow-config.service.js';
> import { WorkflowRegistryService } from '../workflow/workflow-registry.service.js';
> import { ClaimService } from './claim.service.js';
> import { ClaimWorkflowReadService } from './claim-workflow-read.service.js';
> import { TransitionService } from './transition.service.js';
> import { resolveDemoActor } from './claim-access.js';
> const claimant = resolveDemoActor('claimant-1');
> const other = resolveDemoActor('claimant-2');
> const adjuster = resolveDemoActor('adjuster-1');
> let directory: string;
> let db: DatabaseService;
> let claims: ClaimService;
> let reads: ClaimWorkflowReadService;
> let engine: TransitionService;
> let config: WorkflowConfigService;
> let registry: WorkflowRegistryService;
> let id: string;
> const command = (transitionId: string, expectedRevision: number, input: Record<string, string> = {}) => ({ commandId: randomUUID(), transitionId, expectedRevision, input });
> beforeEach(() => {
>   directory = mkdtempSync(join(tmpdir(), 'workflow-read-'));
>   db = new DatabaseService(join(directory, 'test.sqlite'));
>   registry = new WorkflowRegistryService(db); config = new WorkflowConfigService(); registry.register(config.definition);
>   claims = new ClaimService(db, registry, config); reads = new ClaimWorkflowReadService(db, claims); engine = new TransitionService(db, claims);
>   id = claims.create({ title: 'Damage', description: 'Screen damaged in transit.' }, claimant).id;
> });
> afterEach(() => { db?.close(); vi.restoreAllMocks(); rmSync(directory, { recursive: true, force: true }); });
> function review() { engine.execute(id, command('submit', 0), claimant); engine.execute(id, command('start_review', 1), adjuster); }
> function snapshot() { return ['schema_migrations', 'workflow_versions', 'claims', 'transition_events', 'notifications', 'command_receipts'].map(table => db.connection.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()); }
>
> describe('authorized action discovery', () => {
>   it('returns the exact pinned claim snapshot and eligible claimant action', () => {
>     expect(reads.availableTransitions(id, claimant)).toEqual({ claimId: id, workflowId: 'claims', workflowVersion: 1, state: 'draft', revision: 0, informationRequestCount: 0, informationRequestLimit: 3,
>       transitions: [{ id: 'submit', label: 'Submit', from: 'draft', to: 'submitted', eligible: true, reasonCode: null, inputFields: [] }] });
>   });
>   it('conceals cross-owner claims and missing claims with the same error', () => {
>     for (const claimId of [id, randomUUID()]) expect(() => reads.availableTransitions(claimId, other)).toThrow(expect.objectContaining({ code: 'CLAIM_NOT_FOUND', status: 404, message: 'Claim not found.' }));
>   });
>   it('includes disallowed current-state actions with a safe role reason', () => {
>     expect(reads.availableTransitions(id, adjuster).transitions[0]).toMatchObject({ id: 'submit', eligible: false, reasonCode: 'TRANSITION_FORBIDDEN' });
>   });
>   it('only offers transitions whose source matches current state', () => {
>     engine.execute(id, command('submit', 0), claimant);
>     const result = reads.availableTransitions(id, adjuster);
>     expect(result.transitions.map(item => item.id)).toEqual(['start_review']);
>     expect(result.transitions[0].eligible).toBe(true);
>     expect(reads.availableTransitions(id, claimant).transitions[0].eligible).toBe(false);
>   });
>   it('reports claim precondition failures using the same constraint as execution', () => {
>     db.connection.prepare('UPDATE claims SET description=? WHERE id=?').run('\t', id);
>     expect(reads.availableTransitions(id, claimant).transitions[0]).toMatchObject({ eligible: false, reasonCode: 'PRECONDITION_FAILED' });
>     expect(() => engine.execute(id, command('submit', 0), claimant)).toThrow(expect.objectContaining({ code: 'PRECONDITION_FAILED' }));
>   });
>   it('provides required form metadata without requiring input during discovery', () => {
>     review(); const result = reads.availableTransitions(id, adjuster);
>     expect(result.transitions.map(item => item.id)).toEqual(['request_information', 'approve', 'reject']);
>     expect(result.transitions[0]).toMatchObject({ eligible: true, reasonCode: null, inputFields: [{ name: 'message', label: 'Message', required: true, minLength: 1, maxLength: 2000 }] });
>     expect(result.transitions[2].inputFields[0].name).toBe('reason');
>   });
>   it('reflects all three cycles and only blocks another information request', () => {
>     review(); let revision = 2;
>     for (let cycle = 0; cycle < 3; cycle++) {
>       expect(reads.availableTransitions(id, adjuster).transitions.find(item => item.id === 'request_information')?.eligible).toBe(true);
>       engine.execute(id, command('request_information', revision++, { message: 'Details' }), adjuster);
>       engine.execute(id, command('provide_information', revision++, { response: 'Done' }), claimant);
>     }
>     const result = reads.availableTransitions(id, adjuster);
>     expect(result.informationRequestCount).toBe(3);
>     expect(result.transitions[0]).toMatchObject({ id: 'request_information', eligible: false, reasonCode: 'CYCLE_LIMIT_REACHED' });
>     expect(result.transitions.slice(1).every(item => item.eligible)).toBe(true);
>   });
>   it('preserves version-one labels, roles and limits after a newer version is registered', () => {
>     registry.register({ ...config.definition, version: 2, limits: { informationRequests: 1 }, transitions: config.definition.transitions.map(item => item.id === 'submit' ? { ...item, label: 'Changed', roles: ['adjuster'] } : item) });
>     const result = reads.availableTransitions(id, claimant);
>     expect(result.workflowVersion).toBe(1); expect(result.informationRequestLimit).toBe(3);
>     expect(result.transitions[0]).toMatchObject({ label: 'Submit', eligible: true });
>   });
>   it('discovers configuration-only states and transitions without graph changes in code', () => {
>     const definition = { ...config.definition, version: 2, states: [...config.definition.states, { id: 'escalated', label: 'Escalated', terminal: true }], transitions: [...config.definition.transitions, { ...config.definition.transitions[0], id: 'escalate', to: 'escalated' }] };
>     registry.register(definition); const ownClaims = new ClaimService(db, registry, { definition });
>     const ownReads = new ClaimWorkflowReadService(db, ownClaims); const claim = ownClaims.create({ title: 'Other', description: 'Details' }, claimant);
>     expect(ownReads.availableTransitions(claim.id, claimant).transitions.map(item => item.id)).toEqual(['submit', 'escalate']);
>   });
>   it('returns no actions for a terminal claim', () => {
>     review(); engine.execute(id, command('approve', 2), adjuster);
>     expect(reads.availableTransitions(id, adjuster).transitions).toEqual([]);
>   });
>   it('reports unavailable notification recipients on unowned legacy records', () => {
>     const legacy = randomUUID(); const now = new Date().toISOString();
>     db.connection.prepare("INSERT INTO claims (id, workflow_id, workflow_version,state,title,description,created_at,updated_at) VALUES (?,'claims',1,'under_review','Legacy','Unknown owner',?,?)").run(legacy, now, now);
>     const result = reads.availableTransitions(legacy, adjuster);
>     expect(result.transitions.every(item => !item.eligible && item.reasonCode === 'NOTIFICATION_RECIPIENT_UNAVAILABLE')).toBe(true);
>     expect(() => reads.availableTransitions(legacy, claimant)).toThrow('Claim not found');
>   });
>   it('revalidates stale advisory eligibility at execution', () => {
>     const result = reads.availableTransitions(id, claimant);
>     engine.execute(id, command('submit', 0), claimant);
>     expect(() => engine.execute(id, command('submit', result.revision), claimant)).toThrow(expect.objectContaining({ code: 'REVISION_CONFLICT' }));
>   });
>   it('fails safely on unavailable pinned definitions', () => {
>     db.connection.exec("UPDATE workflow_versions SET definition_json='{}'");
>     expect(() => reads.availableTransitions(id, claimant)).toThrow(expect.objectContaining({ code: 'CLAIM_WORKFLOW_UNAVAILABLE' }));
>   });
> });
>
> describe('read-only successful audit history', () => {
>   it('returns an empty page for a claim without successful transitions', () => {
>     expect(reads.audit(id, claimant)).toEqual({ claimId: id, workflowId: 'claims', workflowVersion: 1, items: [], limit: 50, offset: 0 });
>   });
>   it('returns persisted transition data and no command, notification or input internals', () => {
>     const result = engine.execute(id, command('submit', 0), claimant);
>     expect(reads.audit(id, claimant).items).toEqual([{ id: result.auditEventId, transitionId: 'submit', actor: { id: claimant.id, role: 'claimant' }, fromState: 'draft', toState: 'submitted', previousRevision: 0, resultingRevision: 1, createdAt: result.claim.updatedAt }]);
>     expect(reads.audit(id, adjuster)).toEqual(reads.audit(id, claimant));
>   });
>   it('conceals cross-owner and missing history with the same error', () => {
>     review();
>     for (const claimId of [id, randomUUID()]) expect(() => reads.audit(claimId, other)).toThrow(expect.objectContaining({ code: 'CLAIM_NOT_FOUND', message: 'Claim not found.' }));
>   });
>   it('excludes another accessible claim from audit results', () => {
>     review(); const otherClaim = claims.create({ title: 'Other', description: 'Details' }, other);
>     engine.execute(otherClaim.id, command('submit', 0), other);
>     expect(reads.audit(id, adjuster).items.map(item => item.transitionId)).toEqual(['submit', 'start_review']);
>   });
>   it('orders equal timestamps by persisted resulting revision and paginates stably', () => {
>     vi.useFakeTimers();
>     try { vi.setSystemTime(new Date('2026-10-19T10:00:00.000Z')); review(); engine.execute(id, command('approve', 2), adjuster); }
>     finally { vi.useRealTimers(); }
>     const result = reads.audit(id, claimant);
>     expect(new Set(result.items.map(item => item.createdAt)).size).toBe(1);
>     expect(result.items.map(item => item.resultingRevision)).toEqual([1, 2, 3]);
>     expect(reads.audit(id, claimant, 2, 0).items).toEqual(result.items.slice(0, 2));
>     expect(reads.audit(id, claimant, 2, 2).items).toEqual(result.items.slice(2));
>     expect(reads.audit(id, claimant, 2, 3).items).toEqual([]);
>   });
>   it('uses timestamp ordering even when clock time differs from revision ordering', () => {
>     vi.useFakeTimers();
>     try {
>       vi.setSystemTime(new Date('2026-10-19T11:00:00.000Z')); engine.execute(id, command('submit', 0), claimant);
>       vi.setSystemTime(new Date('2026-10-19T10:00:00.000Z')); engine.execute(id, command('start_review', 1), adjuster);
>     } finally { vi.useRealTimers(); }
>     expect(reads.audit(id, claimant).items.map(item => item.transitionId)).toEqual(['start_review', 'submit']);
>   });
>   it('does not reconstruct history from current state', () => {
>     review(); db.connection.prepare("UPDATE claims SET state='draft' WHERE id=?").run(id);
>     expect(reads.audit(id, claimant).items.map(item => item.transitionId)).toEqual(['submit', 'start_review']);
>   });
>   it('does not add failed attempts or replayed commands to successful history', () => {
>     const cmd = command('submit', 0); engine.execute(id, cmd, claimant); engine.execute(id, cmd, claimant);
>     expect(() => engine.execute(id, command('start_review', 0), adjuster)).toThrow();
>     expect(reads.audit(id, claimant).items).toHaveLength(1);
>   });
>   it.each([[0, 0], [101, 0], [1.5, 0], [1, -1]])('rejects invalid pagination %s / %s', (limit, offset) => {
>     expect(() => reads.audit(id, claimant, limit, offset)).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
>   });
>   it('keeps audit update/delete triggers effective after history reads', () => {
>     review(); reads.audit(id, adjuster);
>     expect(() => db.connection.exec('DELETE FROM transition_events')).toThrow('immutable');
>     expect(() => db.connection.exec("UPDATE transition_events SET actor_id='other'")).toThrow('immutable');
>   });
> });
>
> describe('read safety', () => {
>   it('executes both reads with SQLite query-only mode and changes no persisted rows', () => {
>     review(); engine.execute(id, command('request_information', 2, { message: 'Details' }), adjuster);
>     const before = snapshot(); const changes = db.connection.prepare('SELECT total_changes() AS count').get();
>     db.connection.pragma('query_only=ON');
>     reads.availableTransitions(id, claimant); reads.availableTransitions(id, adjuster);
>     reads.audit(id, claimant); reads.audit(id, adjuster, 1, 0);
>     expect(snapshot()).toEqual(before); expect(db.connection.prepare('SELECT total_changes() AS count').get()).toEqual(changes);
>   });
>   it('rejects fabricated identities in direct service calls', () => {
>     for (const method of [reads.availableTransitions, reads.audit]) expect(() => Reflect.apply(method, reads, [id, { id: claimant.id, role: 'claimant' }])).toThrow(expect.objectContaining({ code: 'IDENTITY_REQUIRED' }));
>   });
>   it('sanitizes failures of the discovery transaction and audit query', () => {
>     db.close(); expect(() => reads.availableTransitions(id, claimant)).toThrow(expect.objectContaining({ code: 'CLAIM_STORAGE_FAILED', message: 'Unable to discover claim transitions.' }));
>     expect(() => reads.audit(id, claimant)).toThrow(expect.objectContaining({ code: 'CLAIM_STORAGE_FAILED', message: 'Unable to read claim audit history.' }));
>   });
>   it('sanitizes an audit-table read failure after successful claim authorization', () => {
>     db.connection.exec('ALTER TABLE transition_events RENAME TO inaccessible_events');
>     expect(() => reads.audit(id, claimant)).toThrow(expect.objectContaining({ code: 'CLAIM_STORAGE_FAILED', message: 'Unable to read claim audit history.' }));
>   });
> });
> EOF
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- src/claims/claim-workflow-read.service.spec.ts src/claims/transition.service.spec.ts``
>
> </details>
>
> The targeted run passed 66 tests: 30 new discovery/audit tests and all 36 transition-engine tests. The read tests cover ownership, pinned definitions, input metadata, cycle limits, deterministic audit ordering, and unchanged database rows. They also run both read methods with SQLite query-only mode enabled to catch accidental writes. Next I’ll test the HTTP routes and document the contracts.
>
> <details><summary>Ran 2 commands</summary>
>
> - Ran ``cat > test/claim-workflow-read.e2e-spec.ts <<'EOF'
> import { Test } from '@nestjs/testing';
> import type { INestApplication } from '@nestjs/common';
> import request from 'supertest';
> import { randomUUID } from 'node:crypto';
> import { ClaimsModule } from '../src/claims/claims.module.js';
> import { DatabaseService, DATABASE_PATH } from '../src/database/database.service.js';
> import { WorkflowRegistryService } from '../src/workflow/workflow-registry.service.js';
> import { WorkflowConfigService } from '../src/workflow/workflow-config.service.js';
> let app: INestApplication;
> let id: string;
> const command = (transitionId: string, expectedRevision: number, input: Record<string, string> = {}) => ({ transitionId, expectedRevision, input, commandId: randomUUID() });
> function read(kind: string, actor = 'claimant-1', claimId = id) {
>   return request(app.getHttpServer()).get(`/api/claims/${claimId}/${kind}`).set('X-Demo-Actor-Id', actor);
> }
> function execute(payload: object, actor = 'claimant-1') { return request(app.getHttpServer()).post(`/api/claims/${id}/transitions`).set('X-Demo-Actor-Id', actor).send(payload); }
> async function review() { await execute(command('submit', 0)).expect(200); await execute(command('start_review', 1), 'adjuster-1').expect(200); }
> beforeEach(async () => {
>   vi.stubEnv('NODE_ENV', 'development'); vi.stubEnv('DEMO_IDENTITY_ENABLED', 'true');
>   const module = await Test.createTestingModule({ imports: [ClaimsModule] }).overrideProvider(DATABASE_PATH).useValue(':memory:').compile();
>   app = module.createNestApplication(); await app.init();
>   const created = await request(app.getHttpServer()).post('/api/claims').set('X-Demo-Actor-Id', 'claimant-1').send({ title: 'Damage', description: 'Screen damaged.' }).expect(201);
>   id = created.body.id;
> });
> afterEach(async () => { await app?.close(); vi.unstubAllEnvs(); });
>
> describe('action discovery HTTP', () => {
>   it('returns the explicit discovery contract for an owned claim', async () => {
>     const result = await read('available-transitions').expect(200);
>     expect(result.body).toEqual({ claimId: id, workflowId: 'claims', workflowVersion: 1, state: 'draft', revision: 0, informationRequestCount: 0, informationRequestLimit: 3,
>       transitions: [{ id: 'submit', label: 'Submit', from: 'draft', to: 'submitted', eligible: true, reasonCode: null, inputFields: [] }] });
>   });
>   it('distinguishes current-state actions by role and includes form metadata', async () => {
>     await review();
>     const adjuster = await read('available-transitions', 'adjuster-1').expect(200);
>     expect(adjuster.body.transitions.map((item: { id: string }) => item.id)).toEqual(['request_information', 'approve', 'reject']);
>     expect(adjuster.body.transitions[0]).toMatchObject({ eligible: true, reasonCode: null, inputFields: [{ name: 'message', label: 'Message', required: true, minLength: 1, maxLength: 2000 }] });
>     const claimant = await read('available-transitions').expect(200);
>     expect(claimant.body.transitions.every((item: { eligible: boolean; reasonCode: string }) => !item.eligible && item.reasonCode === 'TRANSITION_FORBIDDEN')).toBe(true);
>   });
>   it('shows a precondition failure without executing the action', async () => {
>     app.get(DatabaseService).connection.prepare('UPDATE claims SET title=? WHERE id=?').run('\t', id);
>     const result = await read('available-transitions').expect(200);
>     expect(result.body.transitions[0]).toMatchObject({ eligible: false, reasonCode: 'PRECONDITION_FAILED' });
>     expect((await read('audit').expect(200)).body.items).toEqual([]);
>   });
>   it('reflects the cycle limit while preserving final-decision actions', async () => {
>     await review(); let revision = 2;
>     for (let cycle = 0; cycle < 3; cycle++) {
>       await execute(command('request_information', revision++, { message: 'Details' }), 'adjuster-1').expect(200);
>       await execute(command('provide_information', revision++, { response: 'Done' })).expect(200);
>     }
>     const result = await read('available-transitions', 'adjuster-1').expect(200);
>     expect(result.body).toMatchObject({ informationRequestCount: 3, revision: 8 });
>     expect(result.body.transitions[0]).toMatchObject({ eligible: false, reasonCode: 'CYCLE_LIMIT_REACHED' });
>     expect(result.body.transitions.slice(1).every((item: { eligible: boolean }) => item.eligible)).toBe(true);
>   });
>   it('uses the original pinned definition after registering a newer one', async () => {
>     const original = app.get(WorkflowConfigService).definition;
>     app.get(WorkflowRegistryService).register({ ...original, version: 2, transitions: original.transitions.map(item => item.id === 'submit' ? { ...item, label: 'Version two', roles: ['adjuster'] } : item) });
>     const result = await read('available-transitions').expect(200);
>     expect(result.body.workflowVersion).toBe(1); expect(result.body.transitions[0]).toMatchObject({ label: 'Submit', eligible: true });
>   });
>   it('discovery does not grant execution permission or bypass revision checks', async () => {
>     const discovered = await read('available-transitions').expect(200);
>     await execute(command('submit', 0)).expect(200);
>     const stale = await execute(command('submit', discovered.body.revision)).expect(409);
>     expect(stale.body.error.code).toBe('REVISION_CONFLICT');
>   });
>   it.each(['limit=1', 'role=adjuster', 'ownerActorId=claimant-2', 'actor=adjuster-1'])('rejects unsupported discovery query %s', async query => {
>     const result = await read('available-transitions').query(query).expect(400);
>     expect(result.body.error.code).toBe('INVALID_REQUEST');
>   });
> });
>
> describe('audit history HTTP', () => {
>   it('returns an empty bounded page with pinned claim metadata', async () => {
>     expect((await read('audit').expect(200)).body).toEqual({ claimId: id, workflowId: 'claims', workflowVersion: 1, items: [], limit: 50, offset: 0 });
>   });
>   it('returns persisted event fields to claimant and adjuster with stable pagination', async () => {
>     const submitted = await execute(command('submit', 0)).expect(200);
>     const started = await execute(command('start_review', 1), 'adjuster-1').expect(200);
>     const history = await read('audit').expect(200);
>     expect(history.body.items).toEqual([
>       { id: submitted.body.auditEventId, transitionId: 'submit', actor: { id: 'claimant-1', role: 'claimant' }, fromState: 'draft', toState: 'submitted', previousRevision: 0, resultingRevision: 1, createdAt: submitted.body.claim.updatedAt },
>       { id: started.body.auditEventId, transitionId: 'start_review', actor: { id: 'adjuster-1', role: 'adjuster' }, fromState: 'submitted', toState: 'under_review', previousRevision: 1, resultingRevision: 2, createdAt: started.body.claim.updatedAt },
>     ]);
>     expect((await read('audit', 'adjuster-1').expect(200)).body).toEqual(history.body);
>     const page = await read('audit').query({ limit: 1, offset: 1 }).expect(200);
>     expect(page.body).toMatchObject({ limit: 1, offset: 1, items: [history.body.items[1]] });
>     expect((await read('audit').query({ limit: 1, offset: 2 }).expect(200)).body.items).toEqual([]);
>   });
>   it('never includes failed transitions or duplicate events for replay', async () => {
>     const cmd = command('submit', 0); await execute(cmd).expect(200); await execute(cmd).expect(200);
>     await execute(command('start_review', 0), 'adjuster-1').expect(409);
>     expect((await read('audit').expect(200)).body.items).toHaveLength(1);
>   });
>   it.each(['limit=0', 'limit=101', 'limit=1.5', 'offset=-1', 'limit=1&limit=2', 'role=adjuster', 'ownerActorId=claimant-2'])('rejects invalid audit pagination/query %s', async query => {
>     expect((await read('audit').query(query).expect(400)).body.error.code).toBe('INVALID_REQUEST');
>   });
> });
>
> describe.each(['available-transitions', 'audit'])('%s access and read safety', kind => {
>   it('returns identical 404s for missing and cross-owner claims', async () => {
>     const hidden = await read(kind, 'claimant-2').expect(404);
>     const missing = await read(kind, 'claimant-2', randomUUID()).expect(404);
>     expect(hidden.body).toEqual(missing.body); expect(hidden.body).toEqual({ error: { code: 'CLAIM_NOT_FOUND', message: 'Claim not found.' } });
>   });
>   it('requires a known verified actor', async () => {
>     await request(app.getHttpServer()).get(`/api/claims/${id}/${kind}`).expect(401);
>     expect((await read(kind, 'unknown').expect(401)).body.error.code).toBe('IDENTITY_REQUIRED');
>   });
>   it('does not use role values supplied in a body or extra header', async () => {
>     await read(kind, 'claimant-2').set('X-Role', 'adjuster').send({ actor: 'adjuster-1', role: 'adjuster' }).expect(404);
>   });
>   it.each([['production', 'true'], ['development', 'false'], ['test', 'true']])('fails closed in %s / %s', async (environment, enabled) => {
>     vi.stubEnv('NODE_ENV', environment); vi.stubEnv('DEMO_IDENTITY_ENABLED', enabled);
>     expect((await read(kind).expect(403)).body.error.code).toBe('DEMO_IDENTITY_DISABLED');
>   });
>   it('changes no data even when SQLite rejects writes', async () => {
>     await review(); const db = app.get(DatabaseService).connection;
>     const tables = ['claims', 'transition_events', 'notifications', 'command_receipts', 'workflow_versions', 'schema_migrations'];
>     const before = tables.map(table => db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all());
>     db.pragma('query_only=ON'); await read(kind).expect(200);
>     expect(tables.map(table => db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all())).toEqual(before);
>   });
>   it('returns sanitized errors when storage is unavailable', async () => {
>     app.get(DatabaseService).close();
>     const response = await read(kind).expect(500);
>     expect(response.body.error.code).toBe('CLAIM_STORAGE_FAILED');
>     expect(response.body.error.message).toBe(kind === 'audit' ? 'Unable to read claim audit history.' : 'Unable to discover claim transitions.');
>     expect(Object.keys(response.body)).toEqual(['error']);
>   });
> });
> EOF
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run test:e2e``
> - Ran ````python3 - <<'PY'
> from pathlib import Path
> p=Path('README.md');s=p.read_text().replace('Deferred: permitted-action discovery, audit/notification read APIs, rejected\nattempt logging, frontend UI, production authentication, external side effects,\nand workflow editing. Recommended next task: authorized action discovery and\nread-only audit history, followed by the frontend workflow demonstration.', 'Task 08 adds authorized action discovery and successful audit history reads.\nNotification read APIs, rejected-attempt logging, frontend UI, production\nauthentication, external side effects, and workflow editing remain deferred.')
> s+='''
>
> ## Authorized action discovery and audit history (Task 08)
>
> Both APIs use the existing verified actor context. Enable NODE_ENV=development
> and DEMO_IDENTITY_ENABLED=true, then send X-Demo-Actor-Id: claimant-1, claimant-2,
> or adjuster-1. Claimants can read only their own claims; adjusters can read any
> claim, including legacy-unowned claims. Missing and cross-owner claims produce
> identical 404 CLAIM_NOT_FOUND bodies. Unknown/missing actors return 401 and
> production/disabled demo identity returns 403. Demo selection is not production
> authentication, and the production fail-closed behavior is unchanged.
>
> ### Available transitions
>
> GET /api/claims/:id/available-transitions accepts no query parameters. Example:
>
> ```sh
> curl http://localhost:3000/api/claims/CLAIM_ID/available-transitions \\
>   -H 'X-Demo-Actor-Id: claimant-1'
> ```
>
> For an owned draft, the 200 response is:
>
> ```json
> {
>   "claimId": "d6721ff3-9ae4-41f6-8dc4-1bb2effe5dbc",
>   "workflowId": "claims",
>   "workflowVersion": 1,
>   "state": "draft",
>   "revision": 0,
>   "informationRequestCount": 0,
>   "informationRequestLimit": 3,
>   "transitions": [
>     {
>       "id": "submit",
>       "label": "Submit",
>       "from": "draft",
>       "to": "submitted",
>       "eligible": true,
>       "reasonCode": null,
>       "inputFields": []
>     }
>   ]
> }
> ```
>
> Only transitions originating from the persisted current state are included, in
> configuration order. Both eligible and blocked transitions are returned. Each
> inputFields entry contains the actual configured name, label, required,
> minLength, and maxLength. For example, request_information exposes the required
> message field (1–2000 characters); reject exposes reason. No claim input values
> or executable handlers are returned.
>
> Eligibility uses the exact registered workflow version pinned to the claim,
> never the latest or startup default. Role rejection takes precedence; otherwise,
> the service uses the same read-only constraint helper as execution. Possible
> reasonCode values are:
>
> - null: allowed to attempt with valid transition-specific input.
> - TRANSITION_FORBIDDEN: current actor role is not allowed by configuration.
> - PRECONDITION_FAILED: at least one configured claimFieldsPresent condition fails.
> - CYCLE_LIMIT_REACHED: an information_request transition would exceed the shared
>   pinned limit (never greater than three).
> - NOTIFICATION_RECIPIENT_UNAVAILABLE: a configured notification has no known
>   claimant recipient, as can occur on legacy-unowned claims.
>
> The current schema only supports claimFieldsPresent, which can be evaluated
> fully from the claim snapshot. Required form input is metadata, not an unmet
> claim precondition: eligible=true does not mean an empty input submission will
> succeed. There is no unknown status because all currently supported preconditions
> are safely evaluable; future handler/schema extensions must define their
> read-time eligibility behavior explicitly. Terminal states return transitions: [].
>
> Discovery is advisory. Submit commands through POST /api/claims/:id/transitions
> using expectedRevision from the discovery response and a new commandId. Execution
> still independently checks identity, access, role, state, revision, inputs,
> preconditions, cycle limit, and recipients inside its transaction. Discovery
> never grants a capability to bypass those checks. Task 07 validation order,
> errors, effects, and idempotency semantics remain unchanged.
>
> ### Successful audit history
>
> GET /api/claims/:id/audit?limit=50&offset=0 returns actual persisted successful
> transition_events for that claim:
>
> ```sh
> curl 'http://localhost:3000/api/claims/CLAIM_ID/audit?limit=50&offset=0' \\
>   -H 'X-Demo-Actor-Id: claimant-1'
> ```
>
> Example 200 response after submit:
>
> ```json
> {
>   "claimId": "d6721ff3-9ae4-41f6-8dc4-1bb2effe5dbc",
>   "workflowId": "claims",
>   "workflowVersion": 1,
>   "items": [
>     {
>       "id": "22f6b5ac-2c5b-4ffd-bb27-1955ab6578eb",
>       "transitionId": "submit",
>       "actor": { "id": "claimant-1", "role": "claimant" },
>       "fromState": "draft",
>       "toState": "submitted",
>       "previousRevision": 0,
>       "resultingRevision": 1,
>       "createdAt": "2026-10-19T10:00:00.000Z"
>     }
>   ],
>   "limit": 50,
>   "offset": 0
> }
> ```
>
> Ordering is createdAt ascending, then resultingRevision ascending, then event ID
> ascending. Equal timestamps are deterministic. If server clock time goes
> backwards, timestamp order can differ from revision order; resultingRevision is
> retained so clients can identify the actual transition sequence.
>
> Pagination matches claim-list conventions: default limit 50, valid range 1–100,
> nonnegative safe-integer offset, no total-count query. Unknown/repeated parameters,
> fractional values, and excessive limits return 400 INVALID_REQUEST. Empty histories
> or pages beyond the end return items: []. Offset pages are stable for unchanged
> data; appending events can affect pages if timestamps are out of chronological
> order.
>
> Audit history is read from events, not reconstructed from current state, receipt
> snapshots, or notifications. Failed commands are absent; successful replays do
> not duplicate events. Persisted actor ID/role, transition ID, states, revisions,
> and timestamp are returned. Transition input JSON, receipt fingerprints, stored
> workflow JSON, notification messages, and raw SQL details are not exposed.
> Pinned identity metadata comes from the authorized claim row; audit retrieval
> does not need to reinterpret the historical event using a workflow definition.
>
> ### Read safety, verification and deferred work
>
> Each service operation uses a deferred SQLite read transaction so authorization
> and result queries share one snapshot. They run SELECTs only: no state/revision/
> counter changes, no notifications, events, or receipts, and no migration/history
> writes. Existing update/delete protections remain intact; no mutation endpoints
> are added. Audit append-only triggers are application safeguards, not protection
> against database administrators who can alter the database or drop triggers.
>
> Errors retain {error: {code, message}}. Inaccessible/missing claims remain 404;
> unavailable pinned definitions during discovery use CLAIM_WORKFLOW_UNAVAILABLE.
> Unexpected storage failures use a sanitized 500 CLAIM_STORAGE_FAILED response.
> No dependencies, schema extensions, or migrations were added. Migration 001–004
> SQL/checksums, including the restored original migration 004, are unchanged.
>
> ```sh
> npm test -- src/claims/claim-workflow-read.service.spec.ts
> npm test
> npm run test:e2e
> npm run build
> npm run lint
> ./node_modules/.bin/tsc --noEmit --incremental false
> git diff --check
> ```
>
> Tests cover authorization, configuration-only actions, pinned versions, form
> metadata, shared execution constraints, cycle limits, stale discovery, ordering
> with equal timestamps, pagination, append-only protections, failed/replayed
> commands, sanitized failures, and database snapshots in SQLite query-only mode.
> HTTP tests use isolated in-memory databases and restore environment overrides.
> No tests use the development database.
>
> Remaining work: frontend workflow demonstration, notification read APIs if needed,
> rejected-attempt logging, production authentication, external side effects, and
> workflow editing. Recommended next task: the React claim workflow UI using these
> APIs, with at least five documented reproducible end-to-end scenarios.
> '''
> p.write_text(s)
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH ./node_modules/.bin/prettier --write src/claims/claim-workflow-read.types.ts src/claims/claim-workflow-read.service.ts src/claims/claim-workflow-read.service.spec.ts src/claims/transition-eligibility.ts src/claims/transition.service.ts src/claims/claims.controller.ts src/claims/claims.module.ts test/claim-workflow-read.e2e-spec.ts
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH ./node_modules/.bin/tsc --noEmit --incremental false````
>
> </details>
>
> The E2E suite passed all 110 tests, including 36 new read-API tests. Both routes enforce the existing identity and ownership rules, reject unsupported query parameters, and return sanitized storage errors. The README now documents the contracts, blocking reasons, advisory eligibility, and audit pagination/order. TypeScript checking also passes. I’ll finish with the full unit suite, build, lint, and data-preservation check.
>
> <details><summary>Ran 6 commands</summary>
>
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run lint`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- src/claims/claim-workflow-read.service.spec.ts`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm test -- --reporter=dot`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run build`
> - Ran `git diff --stat; git diff -- src/claims/transition.service.ts src/claims/claims.controller.ts src/claims/claims.module.ts; cat src/claims/claim-workflow-read.service.ts; sed -n '1,100p' src/workflow/workflow-registry.service.ts; sed -n '68,162p' src/claims/claim.service.ts; rg -n 'preconditions|claimFieldsPresent|additionalProperties|createNotification' config/workflow.schema.json; git ls-files --others --exclude-standard`
> - Ran `python3 - <<'PY'
> from pathlib import Path
> import hashlib,json,sqlite3
> assert hashlib.sha256(Path('backend/src/database/migrations.ts').read_bytes()).hexdigest() == Path('/private/tmp/task08-migrations.sha256').read_text()
> print('Migrations 001–004 and migration runner are byte-for-byte unchanged: PASS')
> p=Path('backend/data/claims.sqlite').resolve()
> baseline_path=Path('/private/tmp/task08-data-baseline.json')
> if baseline_path.exists():
>  baseline=json.loads(baseline_path.read_text()); db=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True)
>  try:
>   for table,expected in baseline.items():
>    actual=hashlib.sha256(json.dumps(db.execute(f'SELECT * FROM {table} ORDER BY rowid').fetchall(),ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
>    assert actual==expected,f'Existing {table} rows changed during this task'
>   print('Existing database history, claims, audits, notifications and receipts unchanged: PASS')
>  finally: db.close()
> cache=Path('/private/tmp/task08-tsbuildinfo')
> if cache.exists(): Path('backend/tsconfig.build.tsbuildinfo').write_bytes(cache.read_bytes())
> PY
> git diff --check
> git status --short`
>
> </details>
</details>

Implemented Task 08 only. No dependencies or migrations added; no commit created.

The APIs reuse the existing strict workflow schema, pinned registry, verified actors, ownership checks, error envelope, and pagination rules.

- **`GET /api/claims/:id/available-transitions`** returns `claimId`, `workflowId`, `workflowVersion`, `state`, `revision`, cycle count/limit, and `transitions`. Each transition contains `id`, `label`, `from`, `to`, `eligible`, `reasonCode`, and configured `inputFields`.
- **`GET /api/claims/:id/audit`** returns `claimId`, pinned workflow identity, `items`, `limit`, and `offset`. Events contain their persisted ID, transition, actor ID/role, prior/resulting states and revisions, and timestamp.

Discovery includes blocked current-state actions with stable reasons. It remains advisory; execution revalidates everything. Audit ordering is timestamp, resulting revision, then event ID. Pagination defaults to 50 and allows at most 100.

Claimants access only their own claims; adjusters retain read access. Missing and cross-owner claims return identical `404` responses. Production and disabled demo identity remain fail-closed.

Changed files under `backend/`:

| Files | Purpose |
|---|---|
| [claim-workflow-read.service.ts](./backend/src/claims/claim-workflow-read.service.ts) | Authorized snapshot reads |
| `claim-workflow-read.types.ts` | Explicit response contracts |
| `transition-eligibility.ts`, `transition.service.ts` | Shared checks, preserving execution order |
| `claims.controller.ts`, `claims.module.ts` | Routes and dependency wiring |
| New service and E2E test files | 66 new test cases |
| `README.md` | Contracts, examples, semantics, limitations |

Verification used Node **22.15.1**, from `backend/`:

| Command | Result |
|---|---|
| `npm test -- src/claims/claim-workflow-read.service.spec.ts` | **30 passed** |
| `npm test -- --reporter=dot` | **204 passed** |
| `npm run test:e2e` | **110 passed** |
| `npm run build` | Passed |
| `npm run lint` | Passed |
| `tsc --noEmit --incremental false` | Passed |
| `git diff --check` | Passed |

Migrations **001–004 and the runner are byte-for-byte unchanged**. Existing database rows were verified unchanged. Query-only tests confirm neither read method writes data, and append-only protections remain effective.

The existing Observe worker error appeared during the passing E2E suite. Production authentication, rejected-attempt logging, notification reads, and frontend work remain deferred.

Recommended next task: the React workflow UI and five documented reproducible scenarios.

> User context
>
> Attachments:
> - # Task 09 — React Workflow UI & Reproducible Demo Scenarios ## Context The Clai…: `~/.codex/attachments/0f90946b-dc4c-42a7-9250-b16d6ae34454/Pasted text.txt`

<details><summary>5 previous messages</summary>

> I’ll read Task 09, then inspect the frontend and API contracts before building the UI and reproducible scenarios.
>
> <details><summary>Explored a file, ran a command</summary>
>
> <details><summary>Explored a file</summary>
>
> - Read `~/.codex/attachments/0f90946b-dc4c-42a7-9250-b16d6ae34454/Pasted text.txt`
>
> </details>
>
> - Ran `cat frontend/package.json frontend/vite.config.ts frontend/src/App.tsx frontend/src/index.css frontend/tsconfig.app.json frontend/.oxlintrc.json; cat backend/src/claims/claim-workflow-read.types.ts backend/src/claims/transition-command.ts backend/src/claims/claim.types.ts backend/src/claims/claim-access.ts; cat backend/src/main.ts; cat /Users/tranngochung/.codex/plugins/cache/openai-bundled/browser/26.825.51511/skills/control-in-app-browser/SKILL.md; git status --short`
>
> </details>
>
> There’s no frontend test framework yet. I’ll add Vitest, React Testing Library, and jsdom as development dependencies to test the UI and retry behavior. The app will use relative `/api` requests through a configurable Vite development proxy; the actor selector will be removed from production builds.
>
> I’ll also use the Browser skill to check the dashboard against a backend using a disposable database.
>
> <details><summary>Ran a command</summary>
>
> - Ran `cat /Users/tranngochung/.codex/plugins/cache/openai-bundled/browser/26.825.51511/skills/control-in-app-browser/SKILL.md; cat frontend/src/main.tsx frontend/tsconfig.node.json backend/src/main.ts backend/src/claims/claim-access.ts; cat frontend/tsconfig.json; ls frontend/node_modules/vitest frontend/node_modules/@testing-library/react frontend/node_modules/jsdom`
>
> </details>
>
> System error
>
> You’ve hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit https://chatgpt.com/settings/usage to purchase more credits or try again at 8:14 PM.
</details>

> User context
>
> Attachments:
> - # Task 09 — React Workflow UI & Reproducible Demo Scenarios ## Context The Clai…: `~/.codex/attachments/d624bcb4-df63-4559-bcdf-81ba7d83313c/Pasted text.txt`

<details><summary>11 previous messages</summary>

> <details><summary>Explored a file, ran a command</summary>
>
> <details><summary>Explored a file</summary>
>
> - Read `~/.codex/attachments/d624bcb4-df63-4559-bcdf-81ba7d83313c/Pasted text.txt`
>
> </details>
>
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm install -D vitest @testing-library/react jsdom --no-audit --no-fund`
>
> </details>
>
> I’ll make uncertain transition results explicit: the UI will keep the original command and revision, lock that form, and offer a same-command retry. It won’t retry automatically or silently adopt a newer revision. The scenario guide will use a separate disposable database; no reset endpoint or production demo controls will be added.
>
> <details><summary>Ran 3 commands, called 3 tools</summary>
>
> - Ran ``mkdir -p frontend/src/api frontend/src/components docs
> cat > frontend/src/api/contracts.ts <<'EOF'
> export type DemoActorId = 'claimant-1' | 'claimant-2' | 'adjuster-1';
> export interface Claim {
>   id: string; ownerActorId: string | null; workflowId: string; workflowVersion: number;
>   state: string; title: string; description: string; revision: number; informationRequestCount: number;
>   createdAt: string; updatedAt: string;
> }
> export interface Page<T> { items: T[]; limit: number; offset: number }
> export interface InputField { name: string; label: string; required: boolean; minLength: number; maxLength: number }
> export interface Action { id: string; label: string; from: string; to: string; eligible: boolean; reasonCode: string | null; inputFields: InputField[] }
> export interface Discovery {
>   claimId: string; workflowId: string; workflowVersion: number; state: string; revision: number;
>   informationRequestCount: number; informationRequestLimit: number; transitions: Action[];
> }
> export interface AuditEvent {
>   id: string; transitionId: string; actor: { id: string; role: 'claimant' | 'adjuster' };
>   fromState: string; toState: string; previousRevision: number; resultingRevision: number; createdAt: string;
> }
> export interface AuditPage extends Page<AuditEvent> { claimId: string; workflowId: string; workflowVersion: number }
> export interface TransitionCommand { transitionId: string; expectedRevision: number; commandId: string; input: Record<string, string> }
> export interface TransitionResult { claim: Claim; auditEventId: string; notificationIds: string[] }
> EOF
> cat > frontend/src/api/client.ts <<'EOF'
> import type { AuditPage, Claim, DemoActorId, Discovery, Page, TransitionCommand, TransitionResult } from './contracts';
> export class ApiError extends Error {
>   readonly code: string;
>   readonly status: number;
>   readonly uncertain: boolean;
>   constructor(code: string, message: string, status = 0, uncertain = false) {
>     super(message); this.name = 'ApiError'; this.code = code; this.status = status; this.uncertain = uncertain;
>   }
> }
> async function request<T>(actor: DemoActorId, path: string, body?: object, signal?: AbortSignal): Promise<T> {
>   let response: Response;
>   try {
>     response = await fetch(`/api${path}`, {
>       method: body === undefined ? 'GET' : 'POST',
>       headers: { ...(import.meta.env.DEV ? { 'X-Demo-Actor-Id': actor } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
>       body: body === undefined ? undefined : JSON.stringify(body),
>       signal: signal ?? AbortSignal.timeout(15000),
>     });
>   } catch { throw new ApiError('NETWORK_ERROR', 'Could not reach the API. Check the connection and development proxy.', 0, true); }
>   let value: unknown;
>   try { value = await response.json(); }
>   catch { throw new ApiError('INVALID_RESPONSE', 'The API returned an unreadable response.', response.status, response.ok || response.status >= 500); }
>   if (!response.ok) {
>     let code = 'API_ERROR'; let message = 'The request could not be completed.';
>     if (value && typeof value === 'object' && 'error' in value && value.error && typeof value.error === 'object') {
>       if ('code' in value.error && typeof value.error.code === 'string') code = value.error.code;
>       if ('message' in value.error && typeof value.error.message === 'string') message = value.error.message;
>     }
>     throw new ApiError(code, message, response.status, response.status >= 500);
>   }
>   return value as T;
> }
> export const api = {
>   list: (actor: DemoActorId, offset: number, signal?: AbortSignal) => request<Page<Claim>>(actor, `/claims?limit=10&offset=${offset}`, undefined, signal),
>   create: (actor: DemoActorId, input: { title: string; description: string }) => request<Claim>(actor, '/claims', input),
>   claim: (actor: DemoActorId, id: string, signal?: AbortSignal) => request<Claim>(actor, `/claims/${encodeURIComponent(id)}`, undefined, signal),
>   actions: (actor: DemoActorId, id: string, signal?: AbortSignal) => request<Discovery>(actor, `/claims/${encodeURIComponent(id)}/available-transitions`, undefined, signal),
>   audit: (actor: DemoActorId, id: string, offset: number, signal?: AbortSignal) => request<AuditPage>(actor, `/claims/${encodeURIComponent(id)}/audit?limit=10&offset=${offset}`, undefined, signal),
>   transition: (actor: DemoActorId, id: string, command: TransitionCommand) => request<TransitionResult>(actor, `/claims/${encodeURIComponent(id)}/transitions`, command),
> };
> EOF
> cat > frontend/src/useRemote.ts <<'EOF'
> import { useCallback, useEffect, useState } from 'react';
> export function useRemote<T>(load: (signal: AbortSignal) => Promise<T>) {
>   const [version, setVersion] = useState(0);
>   const [state, setState] = useState<{ data?: T; loading: boolean; error?: Error }>({ loading: true });
>   const refresh = useCallback(() => { setState(previous => ({ ...previous, loading: true, error: undefined })); setVersion(value => value + 1); }, []);
>   useEffect(() => {
>     const controller = new AbortController();
>     setState(previous => ({ ...previous, loading: true, error: undefined }));
>     load(controller.signal).then(data => {
>       if (!controller.signal.aborted) setState({ data, loading: false });
>     }).catch((error: unknown) => {
>       if (!controller.signal.aborted) setState(previous => ({ ...previous, loading: false, error: error instanceof Error ? error : new Error('Unable to load data.') }));
>     });
>     return () => controller.abort();
>   }, [load, version]);
>   return { ...state, refresh };
> }
> EOF
> cat > frontend/src/components/Common.tsx <<'EOF'
> import { ApiError } from '../api/client';
> export function label(value: string) { return value.replaceAll('_', ' '); }
> export function StateBadge({ state }: { state: string }) { return <span className={`state state-${state}`}>{label(state)}</span>; }
> export function ErrorNotice({ error }: { error?: Error }) {
>   if (!error) return null;
>   const code = error instanceof ApiError ? error.code : 'REQUEST_FAILED';
>   const help = code === 'REVISION_CONFLICT' || code === 'STATE_CONFLICT' ? 'Refresh the claim and review its current actions. Nothing was resubmitted.'
>     : code === 'CLAIM_NOT_FOUND' ? 'This claim is unavailable to the selected actor.'
>     : code === 'DEMO_IDENTITY_DISABLED' ? 'Start the backend with NODE_ENV=development and DEMO_IDENTITY_ENABLED=true.' : '';
>   return <div className="notice error" role="alert"><strong>{code}</strong><p>{error.message}</p>{help && <p>{help}</p>}</div>;
> }
> export function Pager({ offset, count, disabled, onChange, name }: { offset: number; count: number; disabled: boolean; onChange: (offset: number) => void; name: string }) {
>   return <nav className="pager" aria-label={`${name} pagination`}><span>Page {offset / 10 + 1}</span><div><button className="button secondary small" disabled={disabled || offset === 0} onClick={() => onChange(Math.max(0, offset - 10))}>Previous {name}</button><button className="button secondary small" disabled={disabled || count < 10} onClick={() => onChange(offset + 10)}>Next {name}</button></div></nav>;
> }
> EOF
> cat > frontend/src/components/ClaimList.tsx <<'EOF'
> import { useCallback, useState } from 'react';
> import { api } from '../api/client';
> import type { DemoActorId } from '../api/contracts';
> import { useRemote } from '../useRemote';
> import { ErrorNotice, Pager, StateBadge } from './Common';
> export function ClaimList({ actor, onOpen, onCreate }: { actor: DemoActorId; onOpen: (id: string) => void; onCreate: () => void }) {
>   const [offset, setOffset] = useState(0);
>   const load = useCallback((signal: AbortSignal) => api.list(actor, offset, signal), [actor, offset]);
>   const page = useRemote(load);
>   return <>
>     <div className="page-heading"><div><span className="eyebrow">YOUR WORKSPACE</span><h1>Claims overview</h1><p>Move each claim forward, with every decision accounted for.</p></div>{actor !== 'adjuster-1' && <button className="button" onClick={onCreate}><span aria-hidden="true">＋</span> New claim</button>}</div>
>     <section className="panel"><div className="panel-heading"><div><h2>Claims</h2><p>{actor === 'adjuster-1' ? 'All claims available for review' : 'Claims owned by your selected demo actor'}</p></div><button className="button secondary small" onClick={page.refresh} disabled={page.loading}>Refresh list</button></div>
>       <ErrorNotice error={page.error}/>
>       {page.loading && <p className="loading" role="status">Loading claims…</p>}
>       {page.data && <><div className="table-scroll"><table><thead><tr><th>Claim</th><th>Status</th><th>Owner</th><th>Workflow</th><th>Revision</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{page.data.items.map(claim => <tr key={claim.id}><td><button className="claim-link" onClick={() => onOpen(claim.id)}>{claim.title}</button><span className="table-id">{claim.id}</span></td><td><StateBadge state={claim.state}/></td><td>{claim.ownerActorId ?? 'Unowned legacy claim'}</td><td>{claim.workflowId} <span className="muted">v{claim.workflowVersion}</span></td><td><span className="revision">{claim.revision}</span></td><td><button className="open-button" aria-label={`Open ${claim.title}`} onClick={() => onOpen(claim.id)}>↗</button></td></tr>)}</tbody></table></div>
>       {!page.data.items.length && <div className="empty"><span className="empty-icon" aria-hidden="true">▤</span><h3>No claims on this page</h3><p>{offset ? 'Return to the previous page.' : actor === 'adjuster-1' ? 'Ask a claimant to create a claim to begin the review.' : 'Create your first claim to start the workflow.'}</p></div>}
>       <Pager offset={offset} count={page.data.items.length} disabled={page.loading} onChange={setOffset} name="claims"/></>}
>     </section><p className="footnote">Live API data · Access and actions are enforced by the backend.</p>
>   </>;
> }
> EOF
> cat > frontend/src/components/CreateClaim.tsx <<'EOF'
> import { useState } from 'react';
> import type { FormEvent } from 'react';
> import { api } from '../api/client';
> import type { DemoActorId } from '../api/contracts';
> import { ErrorNotice } from './Common';
> export function CreateClaim({ actor, onCreated, onBack }: { actor: DemoActorId; onCreated: (id: string) => void; onBack: () => void }) {
>   const [title, setTitle] = useState(''); const [description, setDescription] = useState('');
>   const [busy, setBusy] = useState(false); const [error, setError] = useState<Error>(); const [validation, setValidation] = useState('');
>   async function submit(event: FormEvent) {
>     event.preventDefault();
>     if (!title.trim() || !description.trim() || title.length > 120 || description.length > 2000) { setValidation('Enter a title (1–120 characters) and description (1–2000 characters).'); return; }
>     setBusy(true); setError(undefined); setValidation('');
>     try { const claim = await api.create(actor, { title: title.trim(), description: description.trim() }); onCreated(claim.id); }
>     catch (failure) { setError(failure instanceof Error ? failure : new Error('Unable to create claim.')); }
>     finally { setBusy(false); }
>   }
>   return <><button className="back-link" disabled={busy} onClick={onBack}>← All claims</button><div className="page-heading"><div><span className="eyebrow">START A WORKFLOW</span><h1>New claim</h1><p>Your claim starts in the configured initial state.</p></div></div><form className="panel form-panel" onSubmit={submit} noValidate aria-label="Create claim"><ErrorNotice error={error}/>{error && <p className="footnote">Creation has no idempotency receipt. Check the claims list before submitting again if the outcome is uncertain.</p>}{validation && <p role="alert" className="field-error">{validation}</p>}<label htmlFor="claim-title">Title <span>Required</span></label><input id="claim-title" value={title} onChange={event => setTitle(event.target.value)} disabled={busy} maxLength={120} required placeholder="A short description of the claim"/><label htmlFor="claim-description">Description <span>Required</span></label><textarea id="claim-description" value={description} onChange={event => setDescription(event.target.value)} disabled={busy} maxLength={2000} required rows={6} placeholder="Tell the reviewer what happened."/><div className="form-footer"><span>Owner: {actor}</span><button className="button" disabled={busy}>{busy ? 'Creating…' : 'Create claim'}</button></div></form></>;
> }
> EOF
> cat > frontend/src/components/TransitionActions.tsx <<'EOF'
> import { useRef, useState } from 'react';
> import type { FormEvent } from 'react';
> import { api, ApiError } from '../api/client';
> import type { Action, DemoActorId, Discovery, TransitionCommand } from '../api/contracts';
> import { ErrorNotice } from './Common';
> const reasons: Record<string, string> = {
>   TRANSITION_FORBIDDEN: 'Your selected role cannot perform this action.', PRECONDITION_FAILED: 'Required claim information is missing.',
>   CYCLE_LIMIT_REACHED: 'The lifetime information-request limit has been reached.', NOTIFICATION_RECIPIENT_UNAVAILABLE: 'This legacy claim has no notification recipient.',
> };
> export function TransitionActions({ actor, discovery, refreshing, onSuccess, onLock }: { actor: DemoActorId; discovery: Discovery; refreshing: boolean; onSuccess: () => void; onLock: (locked: boolean) => void }) {
>   const [selected, setSelected] = useState<string>(); const [values, setValues] = useState<Record<string, string>>({});
>   const [validation, setValidation] = useState(''); const [error, setError] = useState<Error>();
>   const [pending, setPending] = useState<{ command: TransitionCommand; label: string }>(); const [busy, setBusy] = useState(false);
>   const inFlight = useRef(false);
>   async function send(attempt: { command: TransitionCommand; label: string }) {
>     if (inFlight.current) return;
>     inFlight.current = true; setBusy(true); onLock(true); setError(undefined);
>     try {
>       await api.transition(actor, discovery.claimId, attempt.command);
>       setPending(undefined); setSelected(undefined); setValues({}); onLock(false); onSuccess();
>     } catch (failure) {
>       const problem = failure instanceof Error ? failure : new Error('Unable to execute transition.'); setError(problem);
>       if (!(problem instanceof ApiError) || problem.uncertain) { setPending(attempt); }
>       else { setPending(undefined); onLock(false); }
>     } finally { inFlight.current = false; setBusy(false); }
>   }
>   function submit(event: FormEvent, action: Action) {
>     event.preventDefault(); if (inFlight.current || pending) return;
>     const input: Record<string, string> = {};
>     for (const field of action.inputFields) {
>       const raw = values[field.name] ?? ''; const text = raw.trim();
>       if ((field.required && !text) || (text && (text.length < field.minLength || raw.length > field.maxLength))) { setValidation(`${field.label}: enter ${Math.max(field.required ? 1 : 0, field.minLength)}–${field.maxLength} characters.`); return; }
>       if (field.required || raw.length) input[field.name] = text;
>     }
>     setValidation(''); const attempt = { label: action.label, command: { commandId: crypto.randomUUID(), transitionId: action.id, expectedRevision: discovery.revision, input } };
>     setPending(attempt); void send(attempt);
>   }
>   return <section className="panel"><div className="panel-heading"><div><span className="eyebrow">NEXT STEP</span><h2>Workflow actions</h2></div><span className="subtle-badge">Revision {discovery.revision}</span></div><div className="panel-body"><p className="muted small-text">Availability comes from the pinned workflow. Every submission is checked again.</p><ErrorNotice error={error}/>
>     {pending ? <div className="pending-card" role="status"><h3>{busy ? `Submitting ${pending.label}…` : 'Outcome not yet confirmed'}</h3><p>{busy ? 'Please keep this page open.' : 'The server may have committed this command. Retry the exact same request to recover its result.'}</p><code className="command-id">{pending.command.commandId}</code>{!busy && <button className="button" onClick={() => void send(pending)}>Retry same command</button>}<p className="footnote">Actor, navigation, and inputs stay locked until this attempt is resolved. Reloading discards this in-memory retry context.</p></div>
>     : <div className="action-list">{discovery.transitions.map(action => <div className={`action-card ${action.eligible ? '' : 'blocked'}`} key={action.id}><div className="action-heading"><div><h3>{action.label}</h3><span className="muted small-text">{action.from.replaceAll('_', ' ')} → {action.to.replaceAll('_', ' ')}</span></div>{action.eligible ? <button className="button secondary small" disabled={refreshing || busy} onClick={() => { setSelected(action.id); setValues({}); setValidation(''); setError(undefined); }}>{selected === action.id ? 'Selected' : 'Choose action'}</button> : <span className="blocked-label">Unavailable</span>}</div>
>     {!action.eligible && <p className="blocked-reason">{reasons[action.reasonCode ?? ''] ?? 'This action is currently unavailable.'}</p>}
>     {action.eligible && selected === action.id && <form aria-label={`${action.label} form`} noValidate onSubmit={event => submit(event, action)}>{action.inputFields.map(field => <div key={field.name}><label htmlFor={`input-${action.id}-${field.name}`}>{field.label} <span>{field.required ? 'Required' : 'Optional'}</span></label><textarea id={`input-${action.id}-${field.name}`} value={values[field.name] ?? ''} onChange={event => setValues(previous => ({ ...previous, [field.name]: event.target.value }))} maxLength={field.maxLength} required={field.required} rows={3}/><p className="input-hint">{field.minLength}–{field.maxLength} characters</p></div>)}{validation && <p className="field-error" role="alert">{validation}</p>}<button className="button" disabled={refreshing || busy}>Confirm {action.label.toLowerCase()}</button></form>}</div>)}{!discovery.transitions.length && <div className="empty compact"><h3>No further actions</h3><p>The current workflow state has no outgoing transitions.</p></div>}</div>}
>   </div></section>;
> }
> EOF``
>
> - Ran `cat > frontend/src/components/ClaimDetail.tsx <<'EOF'
> import { useCallback, useState } from 'react';
> import { api } from '../api/client';
> import type { DemoActorId } from '../api/contracts';
> import { useRemote } from '../useRemote';
> import { TransitionActions } from './TransitionActions';
> import { ErrorNotice, label, Pager, StateBadge } from './Common';
> export function ClaimDetail({ actor, id, locked, onBack, onLock, created }: { actor: DemoActorId; id: string; locked: boolean; onBack: () => void; onLock: (value: boolean) => void; created: boolean }) {
>   const [auditOffset, setAuditOffset] = useState(0); const [success, setSuccess] = useState(created ? 'Claim created. Your workflow is ready.' : '');
>   const load = useCallback(async (signal: AbortSignal) => {
>     const [claim, discovery, audit] = await Promise.all([api.claim(actor, id, signal), api.actions(actor, id, signal), api.audit(actor, id, auditOffset, signal)]);
>     return { claim, discovery, audit };
>   }, [actor, id, auditOffset]);
>   const detail = useRemote(load);
>   function transitioned() { setSuccess('Transition recorded. Claim, actions, and audit history are refreshing.'); setAuditOffset(0); detail.refresh(); }
>   const data = detail.data;
>   const inconsistent = data && data.claim.revision !== data.discovery.revision;
>   return <><div className="detail-nav"><button className="back-link" disabled={locked} onClick={onBack}>← All claims</button><button className="button secondary small" disabled={detail.loading} onClick={detail.refresh}>Refresh claim</button></div>
>     {success && <div className="notice success" role="status">{success}</div>}<ErrorNotice error={detail.error}/>{detail.loading && <p className="loading" role="status">Loading claim details…</p>}
>     {data && <><div className="page-heading"><div><span className="eyebrow">CLAIM DETAILS</span><h1>{data.claim.title}</h1><p className="mono claim-id">{data.claim.id}</p></div><StateBadge state={data.claim.state}/></div>
>       <div className="detail-layout"><div className="detail-main"><section className="panel"><div className="panel-heading"><h2>Claim summary</h2><span className="subtle-badge">Live record</span></div><div className="panel-body"><p className="description">{data.claim.description}</p><dl className="metadata"><div><dt>Owner</dt><dd>{data.claim.ownerActorId ?? 'Unowned legacy claim'}</dd></div><div><dt>Pinned workflow</dt><dd>{data.claim.workflowId} · v{data.claim.workflowVersion}</dd></div><div><dt>Revision</dt><dd>{data.claim.revision}</dd></div><div><dt>Created</dt><dd>{new Date(data.claim.createdAt).toLocaleString()}</dd></div></dl><div className="cycle-box"><div><strong>Information requests</strong><span>{data.claim.informationRequestCount} / {data.discovery.informationRequestLimit} used</span></div><progress aria-label="Information-request cycles" max={data.discovery.informationRequestLimit} value={data.claim.informationRequestCount}/><p>A successful request consumes one lifetime cycle.</p></div></div></section>
>       <section className="panel"><div className="panel-heading"><div><span className="eyebrow">ACCOUNTABILITY</span><h2>Audit history</h2></div><span className="muted small-text">Successful transitions</span></div><ol className="timeline">{data.audit.items.map(event => <li key={event.id}><span className="timeline-dot" aria-hidden="true"/><div><div className="event-heading"><h3>{label(event.transitionId)}</h3><span className="subtle-badge">Revision {event.resultingRevision}</span></div><p>{label(event.fromState)} <span aria-hidden="true">→</span> {label(event.toState)}</p><small>{event.actor.id} · {event.actor.role} · <time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString()}</time></small></div></li>)}</ol>{!data.audit.items.length && <div className="empty compact"><h3>No transitions on this page</h3><p>Successful workflow actions will appear here.</p></div>}<Pager name="audit events" offset={auditOffset} count={data.audit.items.length} disabled={detail.loading || locked} onChange={setAuditOffset}/></section></div>
>       <aside className="detail-actions">{inconsistent && <p className="notice error" role="alert">The claim changed during refresh. Refresh again before choosing an action.</p>}<TransitionActions actor={actor} discovery={data.discovery} refreshing={detail.loading || Boolean(detail.error) || Boolean(inconsistent)} onSuccess={transitioned} onLock={onLock}/></aside></div></>}
>   </>;
> }
> EOF
> cat > frontend/src/DemoApp.tsx <<'EOF'
> import { useState } from 'react';
> import type { DemoActorId } from './api/contracts';
> import { ClaimList } from './components/ClaimList';
> import { CreateClaim } from './components/CreateClaim';
> import { ClaimDetail } from './components/ClaimDetail';
> const actors: { id: DemoActorId; label: string }[] = [
>   { id: 'claimant-1', label: 'Claimant 01 · claimant-1' }, { id: 'claimant-2', label: 'Claimant 02 · claimant-2' }, { id: 'adjuster-1', label: 'Adjuster · adjuster-1' },
> ];
> type View = { type: 'list' } | { type: 'create' } | { type: 'detail'; id: string; created: boolean };
> export default function DemoApp() {
>   const [actor, setActor] = useState<DemoActorId>('claimant-1'); const [view, setView] = useState<View>({ type: 'list' }); const [locked, setLocked] = useState(false);
>   function home() { if (!locked) setView({ type: 'list' }); }
>   return <div className="app-shell"><a className="skip-link" href="#workspace">Skip to workspace</a><aside className="sidebar"><div className="brand"><span className="brand-mark" aria-hidden="true">C</span><div>Claims<span>WORKFLOW ORCHESTRATOR</span></div></div><div className="nav-caption">WORKSPACE</div><button className="sidebar-link active" onClick={home} disabled={locked}><span aria-hidden="true">▤</span> Claims <span className="nav-arrow" aria-hidden="true">↗</span></button><div className="sidebar-note"><span className="dot"/> DEVELOPMENT DEMO<p>A clear path from claim<br/>to decision.</p><small>Local notifications · Recorded decisions</small></div></aside>
>     <div className="workspace-shell"><header className="topbar"><span className="breadcrumb">Workspace <span aria-hidden="true">/</span> <strong>Claims</strong></span><div className="actor-switch"><span className="avatar" aria-hidden="true">{actor === 'adjuster-1' ? 'AD' : 'CL'}</span><div><label htmlFor="demo-actor">Demo actor</label><select id="demo-actor" value={actor} disabled={locked} onChange={event => { const next = actors.find(item => item.id === event.target.value); if (next) { setActor(next.id); setView({ type: 'list' }); } }}>{actors.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}</select></div></div></header>
>     <div className="demo-banner"><span className="dot"/> Demo identity is not production authentication. Access is enforced by the backend.</div><main id="workspace" tabIndex={-1} key={actor}>
>       {view.type === 'list' && <ClaimList actor={actor} onCreate={() => setView({ type: 'create' })} onOpen={id => setView({ type: 'detail', id, created: false })}/>}
>       {view.type === 'create' && <CreateClaim actor={actor} onBack={home} onLock={setLocked} onCreated={id => setView({ type: 'detail', id, created: true })}/>}
>       {view.type === 'detail' && <ClaimDetail key={view.id} actor={actor} id={view.id} created={view.created} locked={locked} onBack={home} onLock={setLocked}/>}
>     </main><footer className="app-footer"><span>Claims Workflow Orchestrator</span><span>Every state. Every step. Accounted for.</span></footer></div></div>;
> }
> EOF
> cat > frontend/src/App.tsx <<'EOF'
> import { lazy, Suspense } from 'react';
> const DemoApp = import.meta.env.DEV ? lazy(() => import('./DemoApp')) : null;
> export default function App() {
>   if (!import.meta.env.DEV || !DemoApp) return <main className="production-notice"><div className="brand-mark" aria-hidden="true">C</div><h1>Claims Workflow Orchestrator</h1><p>The development demo is unavailable in this build.</p><p>Production access requires a real authentication adapter.</p></main>;
>   return <Suspense fallback={<p className="loading" role="status">Opening workspace…</p>}><DemoApp/></Suspense>;
> }
> EOF
> python3 - <<'PY'
> from pathlib import Path
> import json
> p=Path('frontend/src/components/CreateClaim.tsx');s=p.read_text().replace('onBack }: { actor:', 'onBack, onLock }: { actor:').replace('onBack: () => void })', 'onBack: () => void; onLock: (value: boolean) => void })').replace("    setBusy(true);", "    setBusy(true); onLock(true);").replace('finally { setBusy(false); }','finally { setBusy(false); onLock(false); }');p.write_text(s)
> p=Path('frontend/src/components/TransitionActions.tsx');s=p.read_text().replace('(text && (text.length < field.minLength || raw.length > field.maxLength))', '(raw.length > 0 && (text.length < field.minLength || raw.length > field.maxLength))');p.write_text(s)
> p=Path('frontend/package.json');d=json.loads(p.read_text());d['scripts']['test']='vitest run';d['scripts']['typecheck']='tsc -b';p.write_text(json.dumps(d,indent=2)+'\n')
> p=Path('frontend/tsconfig.app.json');s=p.read_text().replace('"compilerOptions": {','"compilerOptions": {\n    "strict": true,');p.write_text(s)
> p=Path('frontend/tsconfig.node.json');s=p.read_text().replace('"include": ["vite.config.ts"]','"include": ["vite.config.ts", "vitest.config.ts"]');p.write_text(s)
> PY
> cat > frontend/vite.config.ts <<'EOF'
> import { defineConfig, loadEnv } from 'vite';
> import react from '@vitejs/plugin-react';
> import tailwindcss from '@tailwindcss/vite';
> export default defineConfig(({ mode, command }) => {
>   const env = loadEnv(mode, process.cwd(), '');
>   const target = process.env.API_PROXY_TARGET ?? env.API_PROXY_TARGET;
>   if (command === 'serve' && mode !== 'test' && !target) throw new Error('Set API_PROXY_TARGET in frontend/.env.local (see .env.example).');
>   if (target && !['http:', 'https:'].includes(new URL(target).protocol)) throw new Error('API_PROXY_TARGET must be an HTTP(S) origin.');
>   return { plugins: [react(), tailwindcss()], server: { proxy: target ? { '/api': { target, changeOrigin: true } } : undefined } };
> });
> EOF
> cat > frontend/.env.example <<'EOF'
> # Server-only Vite development proxy. Match the backend PORT.
> API_PROXY_TARGET=http://127.0.0.1:3000
> EOF
> cat > frontend/vitest.config.ts <<'EOF'
> import { defineConfig } from 'vitest/config';
> import react from '@vitejs/plugin-react';
> export default defineConfig({ plugins: [react()], test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'], include: ['src/**/*.test.ts', 'src/**/*.test.tsx'] } });
> EOF
> cat > frontend/src/test-setup.ts <<'EOF'
> import { beforeEach, afterEach, vi } from 'vitest';
> import { cleanup } from '@testing-library/react';
> beforeEach(() => vi.stubEnv('DEV', true));
> afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
> EOF
> cat > frontend/src/index.css <<'EOF'
> @import "tailwindcss";
> :root{font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#25333d;background:#f5f7f9;font-synthesis:none;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;font-size:14px;line-height:1.5;--accent:#087f72;--border:#e4e9ec;--muted:#6c7a85}*{box-sizing:border-box}body{margin:0}button,input,select,textarea{font:inherit}button{cursor:pointer}button:disabled{cursor:not-allowed;opacity:.5}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,a:focus-visible{outline:3px solid #58bdb1;outline-offset:3px}h1,h2,h3,p{margin:0}h1{font-size:30px;font-weight:650;letter-spacing:-1px;line-height:1.25}h2{font-size:16px;font-weight:650;letter-spacing:-.2px}h3{font-size:14px;font-weight:650}p{color:var(--muted)}.app-shell{display:flex;min-height:100vh}.sidebar{width:238px;flex-shrink:0;background:#142d35;color:#e8f2f2;padding:31px 20px;display:flex;flex-direction:column;position:fixed;inset:0 auto 0 0}.brand{display:flex;gap:12px;align-items:center;font-size:22px;font-weight:650;letter-spacing:-.5px}.brand>div>span{display:block;font-size:8px;letter-spacing:1.4px;color:#96b4ba;font-weight:500;margin-top:3px}.brand-mark{display:grid;place-items:center;background:#1c776d;color:white;border:1px solid #4a9b91;border-radius:11px;width:42px;height:42px;font-weight:700;font-size:24px;flex-shrink:0}.nav-caption{font-size:10px;letter-spacing:1.5px;color:#86a4ac;margin:58px 12px 15px}.sidebar-link{display:flex;align-items:center;gap:12px;width:100%;border:1px solid #335159;background:#29464d;color:#fff;padding:12px 14px;border-radius:7px;font-weight:550;text-align:left}.sidebar-link>span:first-child{font-size:19px;color:#92d3c9}.nav-arrow{margin-left:auto;color:#a1bfc4}.sidebar-note{margin-top:auto;padding:24px 10px 0;font-size:9px;letter-spacing:1px;color:#9ab4ba}.sidebar-note p{font-size:18px;line-height:1.6;color:#d3e4e7;margin:20px 0;letter-spacing:-.3px}.sidebar-note small{font-size:10px;letter-spacing:0;color:#8aa8af}.dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#65b9a8;margin-right:7px;vertical-align:middle}.workspace-shell{width:calc(100% - 238px);margin-left:238px;display:flex;flex-direction:column;min-height:100vh}.topbar{height:83px;padding:0 44px;background:#fff;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:15px}.breadcrumb{font-size:12px;color:#85929a;display:flex;gap:14px}.breadcrumb strong{color:#40505c;font-weight:500}.actor-switch{display:flex;align-items:center;gap:10px}.avatar{width:33px;height:33px;border-radius:50%;background:#e7f0ed;color:#397064;display:grid;place-items:center;font-size:10px;font-weight:700}.actor-switch label{display:block;font-size:10px;color:#7a8790;margin:0}.actor-switch select{background:transparent;border:0;font-size:12px;font-weight:550;padding:0 16px 0 0;max-width:235px;color:#33464e}.demo-banner{padding:9px 44px;font-size:11px;background:#ecf5f2;border-bottom:1px solid #dceae4;color:#54786b}main#workspace{padding:38px 44px 55px;width:100%;max-width:1540px;margin:0 auto;flex:1}.page-heading{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:28px}.page-heading p{margin-top:10px;font-size:13px}.eyebrow{display:block;font-size:9px;letter-spacing:1.8px;color:#74858e;font-weight:650;margin-bottom:10px}.button{border:1px solid var(--accent);background:var(--accent);color:white;display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:6px;padding:10px 16px;font-size:12px;font-weight:600;min-height:38px;white-space:nowrap}.button:hover:not(:disabled){filter:brightness(.95)}.button.secondary{background:#fff;border-color:#d9e2e5;color:#435861}.button.small{padding:6px 11px;font-size:11px;min-height:31px}.panel{background:#fff;border:1px solid var(--border);border-radius:9px;box-shadow:0 2px 4px #172f3903;overflow:hidden}.panel-heading{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:20px 24px;border-bottom:1px solid #edf0f2}.panel-heading p{font-size:11px;margin-top:5px}.panel-heading .eyebrow{font-size:8px;margin-bottom:5px}.panel-body{padding:24px}.table-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left}th{background:#fafbfc;color:#7a8993;font-size:9px;letter-spacing:.6px;text-transform:uppercase;font-weight:550;padding:13px 22px;border-bottom:1px solid var(--border);white-space:nowrap}td{padding:21px 22px;border-bottom:1px solid #edf0f2;font-size:12px;white-space:nowrap}tbody tr:hover{background:#fbfdfc}.claim-link{display:block;border:0;padding:0;background:none;font-weight:600;color:#2d414d;text-align:left}.claim-link:hover{text-decoration:underline;color:var(--accent)}.table-id{display:block;color:#81909a;font-size:9px;font-family:ui-monospace,monospace;margin-top:5px}.state{text-transform:capitalize;display:inline-flex;align-items:center;gap:6px;background:#eef1f4;color:#627383;border:1px solid #e5e9ed;font-size:10px;font-weight:550;border-radius:5px;padding:4px 9px;white-space:nowrap}.state:before{content:"";width:5px;height:5px;background:currentColor;border-radius:50%}.state-submitted{color:#3c71a2;background:#edf4fb;border-color:#deebf8}.state-under_review{color:#846d2f;background:#f8f4e7;border-color:#eee5c9}.state-awaiting_information{color:#a36137;background:#fcf1e8;border-color:#f1e3d6}.state-approved{color:#277c61;background:#eaf6ef;border-color:#d6eddf}.state-rejected{color:#a1585e;background:#fbefef;border-color:#efdfe1}.revision{display:inline-block;min-width:25px;text-align:center;background:#f5f7f8;border:1px solid #ebeff1;border-radius:4px;font-size:11px;color:#6d7d88;padding:1px 5px}.open-button{background:none;border:0;font-size:18px;color:#7a8f98;padding:4px}.muted{color:var(--muted)}.small-text{font-size:11px}.pager{padding:17px 23px;display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#8a969e;border-top:1px solid #edf0f2;gap:15px}.pager>div{display:flex;gap:8px}.footnote{font-size:10px;margin-top:17px;color:#8b979e;line-height:1.7}.empty{padding:65px 25px;text-align:center}.empty-icon{display:block;margin:0 auto 15px;width:48px;height:48px;line-height:48px;color:#7b9c97;background:#eff5f3;border-radius:12px;font-size:25px}.empty h3{font-size:15px;margin-bottom:8px}.empty p{font-size:12px}.empty.compact{padding:28px 18px}.app-footer{padding:18px 44px;border-top:1px solid var(--border);display:flex;justify-content:space-between;font-size:9px;color:#94a0a7;gap:15px}.loading{padding:18px 24px;color:#6b858d;font-size:12px}.notice{border:1px solid;border-radius:6px;padding:13px 16px;font-size:12px;margin:0 0 18px;overflow-wrap:anywhere}.notice strong{font-size:10px;letter-spacing:.4px}.notice p{color:inherit;margin-top:4px}.notice.error{color:#9e4947;background:#fff4f2;border-color:#f1d9d5}.notice.success{background:#edf8f2;border-color:#d2e9dd;color:#34705b}.panel>.notice{margin:18px 22px}.back-link{border:0;background:none;color:#67818b;font-size:11px;padding:0;margin:0 0 22px}.back-link:hover:not(:disabled){color:var(--accent)}.detail-nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}.detail-nav .back-link{margin:0}.mono{font-family:ui-monospace,monospace}.claim-id{font-size:10px!important;overflow-wrap:anywhere}.detail-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(300px,1fr);gap:24px;align-items:start}.detail-main{display:flex;flex-direction:column;gap:24px}.description{font-size:13px;line-height:1.8;color:#596c77;white-space:pre-wrap;overflow-wrap:anywhere}.metadata{display:grid;grid-template-columns:1fr 1fr;gap:21px;margin:25px 0}.metadata dt{color:#8b99a1;font-size:10px;margin-bottom:5px}.metadata dd{margin:0;font-size:12px;font-weight:550;overflow-wrap:anywhere}.subtle-badge{font-size:9px;color:#758792;background:#f4f7f8;border:1px solid #e9edef;border-radius:4px;padding:3px 7px;white-space:nowrap}.cycle-box{border:1px solid #e3eee9;border-radius:6px;background:#f8fbfa;padding:16px;margin-top:25px}.cycle-box>div{display:flex;justify-content:space-between;font-size:11px;gap:10px}.cycle-box>div span{color:#598578}.cycle-box p{font-size:10px;margin-top:7px}.cycle-box progress{appearance:none;width:100%;height:5px;border:0;border-radius:5px;margin-top:15px;overflow:hidden}.cycle-box progress::-webkit-progress-bar{background:#e4eeea}.cycle-box progress::-webkit-progress-value{background:#72aa97}.cycle-box progress::-moz-progress-bar{background:#72aa97}.action-list{display:flex;flex-direction:column;gap:13px;margin-top:18px}.action-card{border:1px solid #e2e9eb;border-radius:6px;padding:15px}.action-card.blocked{background:#fafbfc;border-style:dashed}.action-heading{display:flex;gap:12px;justify-content:space-between;align-items:center}.action-heading h3{font-size:12px;margin-bottom:5px}.blocked-label{font-size:9px;color:#8f9ba3}.blocked-reason{font-size:11px;line-height:1.65;margin-top:13px}.action-card form{border-top:1px solid #edf0f2;margin-top:16px;padding-top:14px}.action-card form .button{margin-top:15px;width:100%}.pending-card{background:#f0f7f5;border:1px solid #dcebe6;border-radius:6px;padding:18px;margin-top:18px}.pending-card p{font-size:12px;line-height:1.7;margin:10px 0}.pending-card .footnote{font-size:10px}.command-id{display:block;font-size:10px;overflow-wrap:anywhere;margin-bottom:18px;color:#5b776f}.timeline{list-style:none;margin:0;padding:10px 24px}.timeline li{display:flex;gap:15px;position:relative;padding:18px 0 22px}.timeline li:before{content:"";width:1px;background:#e2eae8;position:absolute;top:30px;bottom:-20px;left:4px}.timeline li:last-child:before{display:none}.timeline-dot{width:9px;height:9px;background:#78a99b;border:2px solid #e5f1ec;border-radius:50%;flex-shrink:0;margin-top:6px;z-index:1}.timeline li>div{flex:1;min-width:0}.event-heading{display:flex;align-items:center;justify-content:space-between;gap:10px}.event-heading h3{text-transform:capitalize;font-size:12px}.timeline li p{font-size:11px;margin:7px 0}.timeline small{font-size:9px;color:#91a0a7}.form-panel{max-width:680px;padding:28px}.form-panel label,.action-card label{display:block;font-size:12px;font-weight:600;margin:20px 0 8px}.form-panel label:first-of-type{margin-top:0}label span{font-weight:400;color:#91a0a7;font-size:10px;margin-left:7px}input,textarea{display:block;width:100%;padding:11px 12px;border:1px solid #dce4e8;border-radius:5px;background:white;color:#344d57;resize:vertical;font-size:12px}input::placeholder,textarea::placeholder{color:#a1adb4}.form-footer{border-top:1px solid #edf0f2;display:flex;align-items:center;justify-content:space-between;margin-top:25px;padding-top:20px;gap:15px}.form-footer span{font-size:11px;color:#8c9ba3}.field-error{font-size:11px;color:#a34943;margin:12px 0}.input-hint{font-size:9px;margin-top:5px;color:#8fa0a8}.skip-link{position:fixed;top:-100px;left:10px;background:#fff;padding:12px;z-index:100}.skip-link:focus{top:10px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.production-notice{max-width:650px;margin:15vh auto;padding:40px}.production-notice h1{margin:25px 0}.production-notice p{margin:14px 0}@media(min-width:1600px){.workspace-shell main#workspace{padding-top:50px}}@media(max-width:1180px){.sidebar{width:195px;padding-left:15px;padding-right:15px}.workspace-shell{width:calc(100% - 195px);margin-left:195px}.topbar,.demo-banner,.app-footer{padding-left:25px;padding-right:25px}main#workspace{padding:30px 25px}.detail-layout{grid-template-columns:1fr}.brand{font-size:20px}.brand>div>span{font-size:7px}}@media(max-width:760px){.sidebar{display:none}.workspace-shell{width:100%;margin-left:0}.topbar{height:78px;padding:12px 20px}.breadcrumb{font-size:11px;gap:8px}.demo-banner{padding:9px 20px;font-size:10px}main#workspace{padding:26px 18px}.page-heading{align-items:flex-start;gap:14px;margin-bottom:22px}h1{font-size:25px}.page-heading p{font-size:12px}.page-heading>.button{font-size:11px;padding:8px 12px}.actor-switch select{max-width:182px;font-size:10px}.avatar{display:none}.panel-heading,.panel-body{padding:19px}.detail-layout{gap:19px}.metadata{gap:18px}.app-footer{padding:16px 20px;font-size:8px}.app-footer>span:last-child{display:none}.pager{padding:15px}.pager .button{font-size:9px;padding:5px 9px}.form-panel{padding:22px}.timeline{padding:10px 19px}.event-heading{gap:6px}.table-id{font-size:8px}}
> EOF
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm run build`
>
> - Ran `cat > frontend/src/components/ClaimDetail.tsx <<'EOF'
> import { useCallback, useState } from 'react';
> import { api } from '../api/client';
> import type { DemoActorId } from '../api/contracts';
> import { useRemote } from '../useRemote';
> import { TransitionActions } from './TransitionActions';
> import { ErrorNotice, label, Pager, StateBadge } from './Common';
> export function ClaimDetail({ actor, id, locked, onBack, onLock, created }: { actor: DemoActorId; id: string; locked: boolean; onBack: () => void; onLock: (value: boolean) => void; created: boolean }) {
>   const [auditOffset, setAuditOffset] = useState(0); const [success, setSuccess] = useState(created ? 'Claim created. Your workflow is ready.' : '');
>   const load = useCallback(async (signal: AbortSignal) => {
>     const [claim, discovery, audit] = await Promise.all([api.claim(actor, id, signal), api.actions(actor, id, signal), api.audit(actor, id, auditOffset, signal)]);
>     return { claim, discovery, audit };
>   }, [actor, id, auditOffset]);
>   const detail = useRemote(load);
>   function transitioned() { setSuccess('Transition recorded. Claim, actions, and audit history are refreshing.'); setAuditOffset(0); detail.refresh(); }
>   const data = detail.data;
>   const inconsistent = data && data.claim.revision !== data.discovery.revision;
>   return <><div className="detail-nav"><button className="back-link" disabled={locked} onClick={onBack}>← All claims</button><button className="button secondary small" disabled={detail.loading} onClick={detail.refresh}>Refresh claim</button></div>
>     {success && <div className="notice success" role="status">{success}</div>}<ErrorNotice error={detail.error}/>{detail.loading && <p className="loading" role="status">Loading claim details…</p>}
>     {data && <><div className="page-heading"><div><span className="eyebrow">CLAIM DETAILS</span><h1>{data.claim.title}</h1><p className="mono claim-id">{data.claim.id}</p></div><StateBadge state={data.claim.state}/></div>
>       <div className="detail-layout"><div className="detail-main"><section className="panel"><div className="panel-heading"><h2>Claim summary</h2><span className="subtle-badge">Live record</span></div><div className="panel-body"><p className="description">{data.claim.description}</p><dl className="metadata"><div><dt>Owner</dt><dd>{data.claim.ownerActorId ?? 'Unowned legacy claim'}</dd></div><div><dt>Pinned workflow</dt><dd>{data.claim.workflowId} · v{data.claim.workflowVersion}</dd></div><div><dt>Revision</dt><dd>{data.claim.revision}</dd></div><div><dt>Created</dt><dd>{new Date(data.claim.createdAt).toLocaleString()}</dd></div></dl><div className="cycle-box"><div><strong>Information requests</strong><span>{data.claim.informationRequestCount} / {data.discovery.informationRequestLimit} used</span></div><progress aria-label="Information-request cycles" max={data.discovery.informationRequestLimit} value={data.claim.informationRequestCount}/><p>A successful request consumes one lifetime cycle.</p></div></div></section>
>       <section className="panel"><div className="panel-heading"><div><span className="eyebrow">ACCOUNTABILITY</span><h2>Audit history</h2></div><span className="muted small-text">Successful transitions</span></div><ol className="timeline">{data.audit.items.map(event => <li key={event.id}><span className="timeline-dot" aria-hidden="true"/><div><div className="event-heading"><h3>{label(event.transitionId)}</h3><span className="subtle-badge">Revision {event.resultingRevision}</span></div><p>{label(event.fromState)} → {label(event.toState)}</p><small>{event.actor.id} · {event.actor.role} · <time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString()}</time></small></div></li>)}</ol>{!data.audit.items.length && <div className="empty compact"><h3>No transitions on this page</h3><p>Successful workflow actions will appear here.</p></div>}<Pager name="audit events" offset={auditOffset} count={data.audit.items.length} disabled={detail.loading || locked} onChange={setAuditOffset}/></section></div>
>       <aside className="detail-actions">{inconsistent && <p className="notice error" role="alert">The claim changed during refresh. Refresh again before choosing an action.</p>}<TransitionActions actor={actor} discovery={data.discovery} refreshing={detail.loading || Boolean(detail.error) || Boolean(inconsistent)} onSuccess={transitioned} onLock={onLock}/></aside></div></>}
>   </>;
> }
> EOF
> cat > frontend/src/DemoApp.tsx <<'EOF'
> import { useState } from 'react';
> import type { DemoActorId } from './api/contracts';
> import { ClaimList } from './components/ClaimList';
> import { CreateClaim } from './components/CreateClaim';
> import { ClaimDetail } from './components/ClaimDetail';
> const actors: { id: DemoActorId; label: string }[] = [
>   { id: 'claimant-1', label: 'Claimant 01 · claimant-1' }, { id: 'claimant-2', label: 'Claimant 02 · claimant-2' }, { id: 'adjuster-1', label: 'Adjuster · adjuster-1' },
> ];
> type View = { type: 'list' } | { type: 'create' } | { type: 'detail'; id: string; created: boolean };
> export default function DemoApp() {
>   const [actor, setActor] = useState<DemoActorId>('claimant-1'); const [view, setView] = useState<View>({ type: 'list' }); const [locked, setLocked] = useState(false);
>   function home() { if (!locked) setView({ type: 'list' }); }
>   return <div className="app-shell"><a className="skip-link" href="#workspace">Skip to workspace</a><aside className="sidebar"><div className="brand"><span className="brand-mark" aria-hidden="true">C</span><div>Claims<span>WORKFLOW ORCHESTRATOR</span></div></div><div className="nav-caption">WORKSPACE</div><button className="sidebar-link active" onClick={home} disabled={locked}><span aria-hidden="true">▤</span> Claims <span className="nav-arrow" aria-hidden="true">↗</span></button><div className="sidebar-note"><span className="dot"/> DEVELOPMENT DEMO<p>A clear path from claim<br/>to decision.</p><small>Local notifications · Recorded decisions</small></div></aside>
>     <div className="workspace-shell"><header className="topbar"><span className="breadcrumb">Workspace <span aria-hidden="true">/</span> <strong>Claims</strong></span><div className="actor-switch"><span className="avatar" aria-hidden="true">{actor === 'adjuster-1' ? 'AD' : 'CL'}</span><div><label htmlFor="demo-actor">Demo actor</label><select id="demo-actor" value={actor} disabled={locked} onChange={event => { const next = actors.find(item => item.id === event.target.value); if (next) { setActor(next.id); setView({ type: 'list' }); } }}>{actors.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}</select></div></div></header>
>     <div className="demo-banner"><span className="dot"/> Demo identity is not production authentication. Access is enforced by the backend.</div><main id="workspace" tabIndex={-1} key={actor}>
>       {view.type === 'list' && <ClaimList actor={actor} onCreate={() => setView({ type: 'create' })} onOpen={id => setView({ type: 'detail', id, created: false })}/>}
>       {view.type === 'create' && <CreateClaim actor={actor} onBack={home} onLock={setLocked} onCreated={id => setView({ type: 'detail', id, created: true })}/>}
>       {view.type === 'detail' && <ClaimDetail key={view.id} actor={actor} id={view.id} created={view.created} locked={locked} onBack={home} onLock={setLocked}/>}
>     </main><footer className="app-footer"><span>Claims Workflow Orchestrator</span><span>Every state. Every step. Accounted for.</span></footer></div></div>;
> }
> EOF
> cat > frontend/src/App.tsx <<'EOF'
> import { lazy, Suspense } from 'react';
> const DemoApp = import.meta.env.DEV ? lazy(() => import('./DemoApp')) : null;
> export default function App() {
>   if (!import.meta.env.DEV || !DemoApp) return <main className="production-notice"><div className="brand-mark" aria-hidden="true">C</div><h1>Claims Workflow Orchestrator</h1><p>The development demo is unavailable in this build.</p><p>Production access requires a real authentication adapter.</p></main>;
>   return <Suspense fallback={<p className="loading" role="status">Opening workspace…</p>}><DemoApp/></Suspense>;
> }
> EOF
> python3 - <<'PY'
> from pathlib import Path
> import json
> p=Path('frontend/src/components/CreateClaim.tsx');s=p.read_text().replace('onBack }: { actor:', 'onBack, onLock }: { actor:').replace('onBack: () => void })', 'onBack: () => void; onLock: (value: boolean) => void })').replace('    setBusy(true);','    setBusy(true); onLock(true);').replace('finally { setBusy(false); }','finally { setBusy(false); onLock(false); }');p.write_text(s)
> p=Path('frontend/src/components/TransitionActions.tsx');s=p.read_text().replace('(text && (text.length < field.minLength || raw.length > field.maxLength))', '(raw.length > 0 && (text.length < field.minLength || raw.length > field.maxLength))');p.write_text(s)
> p=Path('frontend/package.json');d=json.loads(p.read_text());d['scripts']['test']='vitest run';d['scripts']['typecheck']='tsc -b';p.write_text(json.dumps(d,indent=2)+'\n')
> p=Path('frontend/tsconfig.app.json');s=p.read_text().replace('"compilerOptions": {','"compilerOptions": {\n    "strict": true,');p.write_text(s)
> p=Path('frontend/tsconfig.node.json');s=p.read_text().replace('"include": ["vite.config.ts"]','"include": ["vite.config.ts", "vitest.config.ts"]');p.write_text(s)
> PY
> cat > frontend/vite.config.ts <<'EOF'
> import { defineConfig, loadEnv } from 'vite';
> import react from '@vitejs/plugin-react';
> import tailwindcss from '@tailwindcss/vite';
> export default defineConfig(({ mode, command }) => {
>   const env = loadEnv(mode, process.cwd(), '');
>   const target = process.env.API_PROXY_TARGET ?? env.API_PROXY_TARGET;
>   if (command === 'serve' && mode !== 'test' && !target) throw new Error('Set API_PROXY_TARGET in frontend/.env.local (see .env.example).');
>   if (target && !['http:', 'https:'].includes(new URL(target).protocol)) throw new Error('API_PROXY_TARGET must be an HTTP(S) origin.');
>   return { plugins: [react(), tailwindcss()], server: { proxy: target ? { '/api': { target, changeOrigin: true } } : undefined } };
> });
> EOF
> cat > frontend/.env.example <<'EOF'
> # Server-only Vite development proxy. Match the backend PORT.
> API_PROXY_TARGET=http://127.0.0.1:3000
> EOF
> cat > frontend/vitest.config.ts <<'EOF'
> import { defineConfig } from 'vitest/config';
> import react from '@vitejs/plugin-react';
> export default defineConfig({ plugins: [react()], test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'], include: ['src/**/*.test.ts', 'src/**/*.test.tsx'] } });
> EOF
> cat > frontend/src/test-setup.ts <<'EOF'
> import { beforeEach, afterEach, vi } from 'vitest';
> import { cleanup } from '@testing-library/react';
> beforeEach(() => vi.stubEnv('DEV', true));
> afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
> EOF
> cat > frontend/src/index.css <<'EOF'
> @import "tailwindcss";
> :root{font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#25333d;background:#f5f7f9;font-synthesis:none;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;font-size:14px;line-height:1.5;--accent:#087f72;--border:#e4e9ec;--muted:#6c7a85}*{box-sizing:border-box}body{margin:0}button,input,select,textarea{font:inherit}button{cursor:pointer}button:disabled{cursor:not-allowed;opacity:.5}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,a:focus-visible{outline:3px solid #58bdb1;outline-offset:3px}h1,h2,h3,p{margin:0}h1{font-size:30px;font-weight:650;letter-spacing:-1px;line-height:1.25}h2{font-size:16px;font-weight:650}h3{font-size:14px;font-weight:650}p{color:var(--muted)}.app-shell{display:flex;min-height:100vh}.sidebar{width:238px;flex-shrink:0;background:#142d35;color:#e8f2f2;padding:31px 20px;display:flex;flex-direction:column;position:fixed;inset:0 auto 0 0}.brand{display:flex;gap:12px;align-items:center;font-size:22px;font-weight:650;letter-spacing:-.5px}.brand>div>span{display:block;font-size:8px;letter-spacing:1.4px;color:#96b4ba;font-weight:500;margin-top:3px}.brand-mark{display:grid;place-items:center;background:#1c776d;color:white;border:1px solid #4a9b91;border-radius:11px;width:42px;height:42px;font-weight:700;font-size:24px;flex-shrink:0}.nav-caption{font-size:10px;letter-spacing:1.5px;color:#86a4ac;margin:58px 12px 15px}.sidebar-link{display:flex;align-items:center;gap:12px;width:100%;border:1px solid #335159;background:#29464d;color:#fff;padding:12px 14px;border-radius:7px;font-weight:550;text-align:left}.sidebar-link>span:first-child{font-size:19px;color:#92d3c9}.nav-arrow{margin-left:auto;color:#a1bfc4}.sidebar-note{margin-top:auto;padding:24px 10px 0;font-size:9px;letter-spacing:1px;color:#9ab4ba}.sidebar-note p{font-size:18px;line-height:1.6;color:#d3e4e7;margin:20px 0;letter-spacing:-.3px}.sidebar-note small{font-size:10px;letter-spacing:0;color:#8aa8af}.dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#65b9a8;margin-right:7px;vertical-align:middle}.workspace-shell{width:calc(100% - 238px);margin-left:238px;display:flex;flex-direction:column;min-height:100vh}.topbar{height:83px;padding:0 44px;background:#fff;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:15px}.breadcrumb{font-size:12px;color:#85929a;display:flex;gap:14px}.breadcrumb strong{color:#40505c;font-weight:500}.actor-switch{display:flex;align-items:center;gap:10px}.avatar{width:33px;height:33px;border-radius:50%;background:#e7f0ed;color:#397064;display:grid;place-items:center;font-size:10px;font-weight:700}.actor-switch label{display:block;font-size:10px;color:#7a8790;margin:0}.actor-switch select{background:transparent;border:0;font-size:12px;font-weight:550;padding:0 16px 0 0;max-width:235px;color:#33464e}.demo-banner{padding:9px 44px;font-size:11px;background:#ecf5f2;border-bottom:1px solid #dceae4;color:#54786b}main#workspace{padding:38px 44px 55px;width:100%;max-width:1540px;margin:0 auto;flex:1}.page-heading{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:28px}.page-heading p{margin-top:10px;font-size:13px}.eyebrow{display:block;font-size:9px;letter-spacing:1.8px;color:#74858e;font-weight:650;margin-bottom:10px}.button{border:1px solid var(--accent);background:var(--accent);color:white;display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:6px;padding:10px 16px;font-size:12px;font-weight:600;min-height:38px;white-space:nowrap}.button:hover:not(:disabled){filter:brightness(.95)}.button.secondary{background:#fff;border-color:#d9e2e5;color:#435861}.button.small{padding:6px 11px;font-size:11px;min-height:31px}.panel{background:#fff;border:1px solid var(--border);border-radius:9px;box-shadow:0 2px 4px #172f3903;overflow:hidden}.panel-heading{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:20px 24px;border-bottom:1px solid #edf0f2}.panel-heading p{font-size:11px;margin-top:5px}.panel-heading .eyebrow{font-size:8px;margin-bottom:5px}.panel-body{padding:24px}.table-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left}th{background:#fafbfc;color:#7a8993;font-size:9px;letter-spacing:.6px;text-transform:uppercase;font-weight:550;padding:13px 22px;border-bottom:1px solid var(--border);white-space:nowrap}td{padding:21px 22px;border-bottom:1px solid #edf0f2;font-size:12px;white-space:nowrap}tbody tr:hover{background:#fbfdfc}.claim-link{display:block;border:0;padding:0;background:none;font-weight:600;color:#2d414d;text-align:left}.claim-link:hover{text-decoration:underline;color:var(--accent)}.table-id{display:block;color:#81909a;font-size:9px;font-family:ui-monospace,monospace;margin-top:5px}.state{text-transform:capitalize;display:inline-flex;align-items:center;gap:6px;background:#eef1f4;color:#627383;border:1px solid #e5e9ed;font-size:10px;font-weight:550;border-radius:5px;padding:4px 9px;white-space:nowrap}.state:before{content:"";width:5px;height:5px;background:currentColor;border-radius:50%}.state-submitted{color:#3c71a2;background:#edf4fb;border-color:#deebf8}.state-under_review{color:#846d2f;background:#f8f4e7;border-color:#eee5c9}.state-awaiting_information{color:#a36137;background:#fcf1e8;border-color:#f1e3d6}.state-approved{color:#277c61;background:#eaf6ef;border-color:#d6eddf}.state-rejected{color:#a1585e;background:#fbefef;border-color:#efdfe1}.revision{display:inline-block;min-width:25px;text-align:center;background:#f5f7f8;border:1px solid #ebeff1;border-radius:4px;font-size:11px;color:#6d7d88;padding:1px 5px}.open-button{background:none;border:0;font-size:18px;color:#7a8f98;padding:4px}.muted{color:var(--muted)}.small-text{font-size:11px}.pager{padding:17px 23px;display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#8a969e;border-top:1px solid #edf0f2;gap:15px}.pager>div{display:flex;gap:8px}.footnote{font-size:10px;margin-top:17px;color:#8b979e;line-height:1.7}.empty{padding:65px 25px;text-align:center}.empty-icon{display:block;margin:0 auto 15px;width:48px;height:48px;line-height:48px;color:#7b9c97;background:#eff5f3;border-radius:12px;font-size:25px}.empty h3{font-size:15px;margin-bottom:8px}.empty p{font-size:12px}.empty.compact{padding:28px 18px}.app-footer{padding:18px 44px;border-top:1px solid var(--border);display:flex;justify-content:space-between;font-size:9px;color:#94a0a7;gap:15px}.loading{padding:18px 24px;color:#6b858d;font-size:12px}.notice{border:1px solid;border-radius:6px;padding:13px 16px;font-size:12px;margin:0 0 18px;overflow-wrap:anywhere}.notice strong{font-size:10px;letter-spacing:.4px}.notice p{color:inherit;margin-top:4px}.notice.error{color:#9e4947;background:#fff4f2;border-color:#f1d9d5}.notice.success{background:#edf8f2;border-color:#d2e9dd;color:#34705b}.panel>.notice{margin:18px 22px}.back-link{border:0;background:none;color:#67818b;font-size:11px;padding:0;margin:0 0 22px}.detail-nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}.detail-nav .back-link{margin:0}.mono{font-family:ui-monospace,monospace}.claim-id{font-size:10px!important;overflow-wrap:anywhere}.detail-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(300px,1fr);gap:24px;align-items:start}.detail-main{display:flex;flex-direction:column;gap:24px}.description{font-size:13px;line-height:1.8;color:#596c77;white-space:pre-wrap;overflow-wrap:anywhere}.metadata{display:grid;grid-template-columns:1fr 1fr;gap:21px;margin:25px 0}.metadata dt{color:#8b99a1;font-size:10px;margin-bottom:5px}.metadata dd{margin:0;font-size:12px;font-weight:550;overflow-wrap:anywhere}.subtle-badge{font-size:9px;color:#758792;background:#f4f7f8;border:1px solid #e9edef;border-radius:4px;padding:3px 7px;white-space:nowrap}.cycle-box{border:1px solid #e3eee9;border-radius:6px;background:#f8fbfa;padding:16px;margin-top:25px}.cycle-box>div{display:flex;justify-content:space-between;font-size:11px;gap:10px}.cycle-box>div span{color:#598578}.cycle-box p{font-size:10px;margin-top:7px}.cycle-box progress{appearance:none;width:100%;height:5px;border:0;border-radius:5px;margin-top:15px;overflow:hidden}.cycle-box progress::-webkit-progress-bar{background:#e4eeea}.cycle-box progress::-webkit-progress-value{background:#72aa97}.cycle-box progress::-moz-progress-bar{background:#72aa97}.action-list{display:flex;flex-direction:column;gap:13px;margin-top:18px}.action-card{border:1px solid #e2e9eb;border-radius:6px;padding:15px}.action-card.blocked{background:#fafbfc;border-style:dashed}.action-heading{display:flex;gap:12px;justify-content:space-between;align-items:center}.action-heading h3{font-size:12px;margin-bottom:5px}.blocked-label{font-size:9px;color:#8f9ba3}.blocked-reason{font-size:11px;line-height:1.65;margin-top:13px}.action-card form{border-top:1px solid #edf0f2;margin-top:16px;padding-top:14px}.action-card form .button{margin-top:15px;width:100%}.pending-card{background:#f0f7f5;border:1px solid #dcebe6;border-radius:6px;padding:18px;margin-top:18px}.pending-card p{font-size:12px;line-height:1.7;margin:10px 0}.pending-card .footnote{font-size:10px}.command-id{display:block;font-size:10px;overflow-wrap:anywhere;margin-bottom:18px;color:#5b776f}.timeline{list-style:none;margin:0;padding:10px 24px}.timeline li{display:flex;gap:15px;position:relative;padding:18px 0 22px}.timeline li:before{content:"";width:1px;background:#e2eae8;position:absolute;top:30px;bottom:-20px;left:4px}.timeline li:last-child:before{display:none}.timeline-dot{width:9px;height:9px;background:#78a99b;border:2px solid #e5f1ec;border-radius:50%;flex-shrink:0;margin-top:6px;z-index:1}.timeline li>div{flex:1;min-width:0}.event-heading{display:flex;align-items:center;justify-content:space-between;gap:10px}.event-heading h3{text-transform:capitalize;font-size:12px}.timeline li p{font-size:11px;margin:7px 0}.timeline small{font-size:9px;color:#91a0a7}.form-panel{max-width:680px;padding:28px}.form-panel label,.action-card label{display:block;font-size:12px;font-weight:600;margin:20px 0 8px}.form-panel label:first-of-type{margin-top:0}label span{font-weight:400;color:#91a0a7;font-size:10px;margin-left:7px}input,textarea{display:block;width:100%;padding:11px 12px;border:1px solid #dce4e8;border-radius:5px;background:white;color:#344d57;resize:vertical;font-size:12px}input::placeholder,textarea::placeholder{color:#a1adb4}.form-footer{border-top:1px solid #edf0f2;display:flex;align-items:center;justify-content:space-between;margin-top:25px;padding-top:20px;gap:15px}.form-footer span{font-size:11px;color:#8c9ba3}.field-error{font-size:11px;color:#a34943;margin:12px 0}.input-hint{font-size:9px;margin-top:5px;color:#8fa0a8}.skip-link{position:fixed;top:-100px;left:10px;background:#fff;padding:12px;z-index:100}.skip-link:focus{top:10px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.production-notice{max-width:650px;margin:15vh auto;padding:40px}.production-notice h1{margin:25px 0}.production-notice p{margin:14px 0}@media(max-width:1180px){.sidebar{width:195px;padding-left:15px;padding-right:15px}.workspace-shell{width:calc(100% - 195px);margin-left:195px}.topbar,.demo-banner,.app-footer{padding-left:25px;padding-right:25px}main#workspace{padding:30px 25px}.detail-layout{grid-template-columns:1fr}.brand{font-size:20px}.brand>div>span{font-size:7px}}@media(max-width:760px){.sidebar{display:none}.workspace-shell{width:100%;margin-left:0}.topbar{height:78px;padding:12px 20px}.breadcrumb{font-size:11px;gap:8px}.demo-banner{padding:9px 20px;font-size:10px}main#workspace{padding:26px 18px}.page-heading{align-items:flex-start;gap:14px;margin-bottom:22px}h1{font-size:25px}.page-heading p{font-size:12px}.page-heading>.button{font-size:11px;padding:8px 12px}.actor-switch select{max-width:182px;font-size:10px}.avatar{display:none}.panel-heading,.panel-body{padding:19px}.detail-layout{gap:19px}.metadata{gap:18px}.app-footer{padding:16px 20px;font-size:8px}.app-footer>span:last-child{display:none}.pager{padding:15px}.pager .button{font-size:9px;padding:5px 9px}.form-panel{padding:22px}.timeline{padding:10px 19px}.event-heading{gap:6px}.table-id{font-size:8px}}
> EOF
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix frontend run build`
>
> MCP tool call
>
> node_repl.js
>
> ```json
> {
>   "code": "const { setupBrowserRuntime } = await import('/Users/tranngochung/.codex/plugins/cache/openai-bundled/browser/26.825.51511/scripts/browser-client.mjs'); const agent = await setupBrowserRuntime(); const browser = await agent.browsers.getForUrl('http://127.0.0.1:5174/'); nodeRepl.write(await browser.documentation());",
>   "title": "Connect to the local app browser"
> }
> ```
>
> Error: No browser is available
>
> MCP tool call
>
> node_repl.js
>
> ```json
> {
>   "code": "nodeRepl.write(await agent.documentation.get('bootstrap-troubleshooting'));",
>   "title": "Check the browser connection"
> }
> ```
>
> ```text
> # Browser Runtime Troubleshooting
> - If browser setup completed but discovery or selection fails, reuse the existing `agent`; do not reset the JavaScript session or import another browser runtime.
> - Inspect `await agent.browsers.list()` once to see which browser types are available. Do not assume that a missing requested browser can be replaced with another backend when the user explicitly named it.
> - If a requested backend has specific troubleshooting documentation in the skill's setup catalog, read it before retrying.
> - If the requested browser remains unavailable, report that plainly instead of controlling it through an unrelated browser tool or source-code workaround.
> ```
>
> MCP tool call
>
> node_repl.js
>
> ```json
> {
>   "code": "nodeRepl.write(await agent.browsers.list());",
>   "title": "Check available browsers"
> }
> ```
>
> ```text
> []
> ```
>
> </details>
>
> The dashboard, claim form, detail view, action forms, and audit pagination are in place. The production build excludes the demo workspace.
>
> No browser is connected in this session, so I can’t verify the rendered layout in a real browser here. I’ll continue with component interaction tests and a live API smoke check against a disposable database, and report that visual-check limitation clearly.
>
> <details><summary>Ran 2 commands</summary>
>
> - Ran ``mkdir -p frontend/src/test
> cat > frontend/src/test/fixtures.ts <<'EOF'
> import type { Action, Claim, Discovery, AuditPage } from '../api/contracts';
> export const claim: Claim = { id: '11111111-1111-4111-8111-111111111111', ownerActorId: 'claimant-1', workflowId: 'claims', workflowVersion: 1, state: 'under_review', title: 'Laptop damage', description: 'Screen damaged during transport.', revision: 2, informationRequestCount: 0, createdAt: '2026-10-19T10:00:00.000Z', updatedAt: '2026-10-19T10:01:00.000Z' };
> export const action: Action = { id: 'request_information', label: 'Request information', from: 'under_review', to: 'awaiting_information', eligible: true, reasonCode: null, inputFields: [{ name: 'message', label: 'Message', required: true, minLength: 5, maxLength: 2000 }] };
> export const discovery: Discovery = { claimId: claim.id, workflowId: 'claims', workflowVersion: 1, state: claim.state, revision: claim.revision, informationRequestCount: 0, informationRequestLimit: 3, transitions: [action] };
> export const audit: AuditPage = { claimId: claim.id, workflowId: 'claims', workflowVersion: 1, limit: 10, offset: 0, items: [] };
> EOF
> cat > frontend/src/api/client.test.ts <<'EOF'
> import { describe, it, expect, vi } from 'vitest';
> import { api, ApiError } from './client';
> import { claim } from '../test/fixtures';
> describe('API contract', () => {
>   it('uses relative URLs, backend-owned actor selection, and bounded pages', async () => {
>     const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [], limit: 10, offset: 10 }), { status: 200 }));
>     vi.stubGlobal('fetch', fetcher); await api.list('claimant-2', 10);
>     expect(fetcher).toHaveBeenCalledWith('/api/claims?limit=10&offset=10', expect.objectContaining({ method: 'GET', headers: { 'X-Demo-Actor-Id': 'claimant-2' } }));
>   });
>   it('sends the exact transition envelope without role or state overrides', async () => {
>     const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ claim, auditEventId: 'event', notificationIds: [] }), { status: 200 }));
>     vi.stubGlobal('fetch', fetcher); const command = { transitionId: 'submit', expectedRevision: 0, commandId: crypto.randomUUID(), input: {} };
>     await api.transition('claimant-1', claim.id, command);
>     expect(fetcher).toHaveBeenCalledWith(`/api/claims/${claim.id}/transitions`, expect.objectContaining({ method: 'POST', body: JSON.stringify(command) }));
>   });
>   it('marks network and unreadable success responses as uncertain', async () => {
>     const fetcher = vi.fn().mockRejectedValueOnce(new TypeError('network')).mockResolvedValueOnce(new Response('bad JSON', { status: 200 }));
>     vi.stubGlobal('fetch', fetcher);
>     await expect(api.create('claimant-1', { title: 'X', description: 'Y' })).rejects.toMatchObject({ code: 'NETWORK_ERROR', uncertain: true });
>     await expect(api.list('claimant-1', 0)).rejects.toMatchObject({ code: 'INVALID_RESPONSE', uncertain: true });
>   });
>   it.each([409, 403])('preserves stable HTTP %s errors without marking them uncertain', async status => {
>     vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'BACKEND_ERROR', message: 'Rejected' } }), { status })));
>     await expect(api.list('claimant-1', 0)).rejects.toMatchObject({ code: 'BACKEND_ERROR', status, message: 'Rejected', uncertain: false });
>   });
>   it('never sends a demo identity header in production mode', async () => {
>     vi.stubEnv('DEV', false); const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status: 200 })); vi.stubGlobal('fetch', fetcher);
>     await api.list('claimant-1', 0); expect(fetcher).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ headers: {} }));
>   });
>   it('treats server/proxy failures as safe same-command retry candidates', async () => {
>     vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"error":{"code":"STORAGE_BUSY","message":"Busy"}}', { status: 503 })));
>     await expect(api.list('claimant-1', 0)).rejects.toBeInstanceOf(ApiError);
>   });
> });
> EOF
> cat > frontend/src/components/TransitionActions.test.tsx <<'EOF'
> import { describe, it, expect, vi } from 'vitest';
> import { render, screen, fireEvent, waitFor } from '@testing-library/react';
> import { TransitionActions } from './TransitionActions';
> import { api, ApiError } from '../api/client';
> import { claim, action, discovery } from '../test/fixtures';
> function draw() { const success = vi.fn(); const lock = vi.fn(); render(<TransitionActions actor="adjuster-1" discovery={discovery} refreshing={false} onSuccess={success} onLock={lock}/>); return { success, lock }; }
> function fill(message = 'Please provide details') { fireEvent.click(screen.getByRole('button', { name: 'Choose action' })); fireEvent.change(screen.getByLabelText(/Message/), { target: { value: message } }); fireEvent.submit(screen.getByRole('form', { name: 'Request information form' })); }
> describe('configured action forms', () => {
>   it('only renders actionable controls for eligible transitions', () => {
>     render(<TransitionActions actor="adjuster-1" discovery={{ ...discovery, transitions: [action, { ...action, id: 'approve', label: 'Approve', eligible: false, reasonCode: 'TRANSITION_FORBIDDEN' }] }} refreshing={false} onSuccess={vi.fn()} onLock={vi.fn()}/>);
>     expect(screen.getAllByRole('button', { name: 'Choose action' })).toHaveLength(1);
>     expect(screen.getByText('Your selected role cannot perform this action.')).toBeTruthy();
>     expect(screen.queryByRole('button', { name: 'Confirm approve' })).toBeNull();
>   });
>   it('validates dynamic required and minimum-length fields before sending', () => {
>     const send = vi.spyOn(api, 'transition'); draw(); fill('   ');
>     expect(screen.getByRole('alert').textContent).toContain('Message: enter 5–2000 characters'); expect(send).not.toHaveBeenCalled();
>     fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'abc' } }); fireEvent.submit(screen.getByRole('form', { name: 'Request information form' })); expect(send).not.toHaveBeenCalled();
>   });
>   it('sends discovered revision, fresh UUID, and trimmed configured input', async () => {
>     const send = vi.spyOn(api, 'transition').mockResolvedValue({ claim: { ...claim, revision: 3 }, auditEventId: 'event', notificationIds: [] });
>     const { success } = draw(); fill('  Please provide details  ');
>     await waitFor(() => expect(success).toHaveBeenCalledOnce());
>     expect(send).toHaveBeenCalledWith('adjuster-1', claim.id, expect.objectContaining({ transitionId: 'request_information', expectedRevision: 2, input: { message: 'Please provide details' }, commandId: expect.stringMatching(/^[0-9a-f-]{36}$/) }));
>   });
>   it('preserves the exact command ID, input, and revision when retrying an uncertain request', async () => {
>     const uuid = vi.spyOn(crypto, 'randomUUID');
>     const send = vi.spyOn(api, 'transition').mockRejectedValueOnce(new ApiError('NETWORK_ERROR', 'Lost connection', 0, true)).mockResolvedValueOnce({ claim, auditEventId: 'event', notificationIds: [] });
>     const { success, lock } = draw(); fill();
>     fireEvent.click(await screen.findByRole('button', { name: 'Retry same command' }));
>     await waitFor(() => expect(success).toHaveBeenCalledOnce());
>     expect(send.mock.calls[1][2]).toEqual(send.mock.calls[0][2]); expect(uuid).toHaveBeenCalledOnce(); expect(lock).toHaveBeenLastCalledWith(false);
>   });
>   it.each(['REVISION_CONFLICT', 'TRANSITION_FORBIDDEN'])('shows %s without silently retrying', async code => {
>     const send = vi.spyOn(api, 'transition').mockRejectedValue(new ApiError(code, 'Backend rejected the request', code === 'REVISION_CONFLICT' ? 409 : 403));
>     draw(); fill(); await screen.findByText(code); expect(send).toHaveBeenCalledOnce(); expect(screen.queryByText('Retry same command')).toBeNull();
>     if (code === 'REVISION_CONFLICT') expect(screen.getByText(/Nothing was resubmitted/)).toBeTruthy();
>   });
>   it('creates a new command ID only after an explicitly initiated new command', async () => {
>     const send = vi.spyOn(api, 'transition').mockRejectedValue(new ApiError('REVISION_CONFLICT', 'Stale', 409)); draw(); fill(); await screen.findByText('REVISION_CONFLICT');
>     fireEvent.submit(screen.getByRole('form', { name: 'Request information form' }));
>     await waitFor(() => expect(send).toHaveBeenCalledTimes(2)); expect(send.mock.calls[0][2].commandId).not.toBe(send.mock.calls[1][2].commandId);
>   });
> });
> EOF
> cat > frontend/src/DemoApp.test.tsx <<'EOF'
> import { describe, it, expect, vi } from 'vitest';
> import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
> import DemoApp from './DemoApp';
> import App from './App';
> import { api, ApiError } from './api/client';
> import { claim, discovery, audit } from './test/fixtures';
> import type { Claim, Page } from './api/contracts';
> function detailMocks() {
>   const getClaim = vi.spyOn(api, 'claim').mockResolvedValue(claim); const actions = vi.spyOn(api, 'actions').mockResolvedValue(discovery); const history = vi.spyOn(api, 'audit').mockResolvedValue(audit);
>   return { getClaim, actions, history };
> }
> async function open() { vi.spyOn(api, 'list').mockResolvedValue({ items: [claim], limit: 10, offset: 0 }); detailMocks(); render(<DemoApp/>); fireEvent.click(await screen.findByRole('button', { name: 'Open Laptop damage' })); await screen.findByRole('heading', { name: 'Workflow actions' }); }
> describe('claims demo workspace', () => {
>   it('shows loading without fake claims', () => {
>     vi.spyOn(api, 'list').mockReturnValue(new Promise(() => {})); render(<DemoApp/>);
>     expect(screen.getByText('Loading claims…')).toBeTruthy(); expect(screen.queryByText('Laptop damage')).toBeNull();
>   });
>   it('shows a useful empty state with no synthetic rows', async () => {
>     vi.spyOn(api, 'list').mockResolvedValue({ items: [], limit: 10, offset: 0 }); render(<DemoApp/>);
>     await screen.findByText('No claims on this page'); expect(screen.queryAllByRole('cell')).toHaveLength(0);
>   });
>   it('shows backend list errors with their stable code', async () => {
>     vi.spyOn(api, 'list').mockRejectedValue(new ApiError('IDENTITY_REQUIRED', 'Choose a known actor', 401)); render(<DemoApp/>);
>     expect((await screen.findByRole('alert')).textContent).toContain('IDENTITY_REQUIRED');
>   });
>   it('creates a claim and navigates to its actual details', async () => {
>     vi.spyOn(api, 'list').mockResolvedValue({ items: [], limit: 10, offset: 0 }); const create = vi.spyOn(api, 'create').mockResolvedValue(claim); detailMocks(); render(<DemoApp/>);
>     fireEvent.click(screen.getByRole('button', { name: /New claim/ }));
>     fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Laptop damage' } }); fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Screen damaged during transport.' } });
>     fireEvent.click(screen.getByRole('button', { name: 'Create claim' }));
>     await screen.findByRole('heading', { name: 'Laptop damage' });
>     expect(create).toHaveBeenCalledWith('claimant-1', { title: 'Laptop damage', description: 'Screen damaged during transport.' }); expect(screen.getByText(/Claim created/)).toBeTruthy();
>   });
>   it('refreshes detail, discovery, and history after successful execution', async () => {
>     vi.spyOn(api, 'list').mockResolvedValue({ items: [claim], limit: 10, offset: 0 });
>     const mocks = detailMocks(); vi.spyOn(api, 'transition').mockImplementation(async () => {
>       mocks.getClaim.mockResolvedValue({ ...claim, state: 'awaiting_information', revision: 3, informationRequestCount: 1 });
>       mocks.actions.mockResolvedValue({ ...discovery, state: 'awaiting_information', revision: 3, informationRequestCount: 1, transitions: [] });
>       mocks.history.mockResolvedValue({ ...audit, items: [{ id: 'event', transitionId: 'request_information', actor: { id: 'adjuster-1', role: 'adjuster' }, fromState: 'under_review', toState: 'awaiting_information', previousRevision: 2, resultingRevision: 3, createdAt: claim.updatedAt }] });
>       return { claim, auditEventId: 'event', notificationIds: [] };
>     });
>     render(<DemoApp/>); fireEvent.click(await screen.findByRole('button', { name: 'Open Laptop damage' }));
>     fireEvent.click(await screen.findByRole('button', { name: 'Choose action' })); fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Please provide details' } }); fireEvent.submit(screen.getByRole('form', { name: 'Request information form' }));
>     await screen.findByText('No further actions'); expect(mocks.getClaim).toHaveBeenCalledTimes(2); expect(mocks.actions).toHaveBeenCalledTimes(2); expect(mocks.history).toHaveBeenCalledTimes(2);
>     expect(screen.getByRole('progressbar').getAttribute('value')).toBe('1');
>   });
>   it('locks actor changes during an uncertain request and reuses command context after refresh', async () => {
>     vi.spyOn(api, 'list').mockResolvedValue({ items: [claim], limit: 10, offset: 0 }); detailMocks();
>     const send = vi.spyOn(api, 'transition').mockRejectedValueOnce(new ApiError('NETWORK_ERROR', 'Unknown outcome', 0, true)).mockResolvedValueOnce({ claim, auditEventId: 'event', notificationIds: [] });
>     render(<DemoApp/>); fireEvent.click(await screen.findByRole('button', { name: 'Open Laptop damage' }));
>     fireEvent.click(await screen.findByRole('button', { name: 'Choose action' })); fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Please provide details' } }); fireEvent.submit(screen.getByRole('form', { name: 'Request information form' }));
>     await screen.findByText('Outcome not yet confirmed'); expect(screen.getByLabelText('Demo actor').hasAttribute('disabled')).toBe(true);
>     fireEvent.click(screen.getByRole('button', { name: 'Refresh claim' })); await waitFor(() => expect(api.actions).toHaveBeenCalledTimes(2));
>     fireEvent.click(screen.getByRole('button', { name: 'Retry same command' })); await screen.findByText(/Transition recorded/);
>     expect(send.mock.calls[1][2]).toEqual(send.mock.calls[0][2]); expect(screen.getByLabelText('Demo actor').hasAttribute('disabled')).toBe(false);
>   });
>   it('paginates claim API data with bounded offsets', async () => {
>     const list = vi.spyOn(api, 'list').mockResolvedValueOnce({ items: Array.from({ length: 10 }, (_, i) => ({ ...claim, id: `${claim.id}-${i}`, title: `Claim ${i}` })), limit: 10, offset: 0 }).mockResolvedValue({ items: [], limit: 10, offset: 10 });
>     render(<DemoApp/>); await screen.findByRole('button', { name: 'Open Claim 0' }); fireEvent.click(screen.getByRole('button', { name: 'Next claims' }));
>     await screen.findByText('Page 2'); await waitFor(() => expect(list).toHaveBeenLastCalledWith('claimant-1', 10, expect.any(AbortSignal)));
>   });
>   it('discards late responses and cached rows when the actor changes', async () => {
>     let resolveOld: (page: Page<Claim>) => void = () => {};
>     const old = new Promise<Page<Claim>>(resolve => { resolveOld = resolve; });
>     vi.spyOn(api, 'list').mockImplementation(actor => actor === 'claimant-1' ? old : Promise.resolve({ items: [], limit: 10, offset: 0 })); render(<DemoApp/>);
>     fireEvent.change(screen.getByLabelText('Demo actor'), { target: { value: 'claimant-2' } }); await screen.findByText('No claims on this page');
>     await act(async () => resolveOld({ items: [claim], limit: 10, offset: 0 })); expect(screen.queryByText('Laptop damage')).toBeNull();
>   });
>   it('shows detail authorization errors without inventing a claim', async () => {
>     vi.spyOn(api, 'list').mockResolvedValue({ items: [claim], limit: 10, offset: 0 }); detailMocks(); vi.mocked(api.claim).mockRejectedValue(new ApiError('CLAIM_NOT_FOUND', 'Claim not found.', 404));
>     render(<DemoApp/>); fireEvent.click(await screen.findByRole('button', { name: 'Open Laptop damage' })); await screen.findByText('CLAIM_NOT_FOUND'); expect(screen.queryByRole('heading', { name: 'Claim summary' })).toBeNull();
>   });
>   it('does not show a creation control for the demo adjuster', async () => {
>     vi.spyOn(api, 'list').mockResolvedValue({ items: [], limit: 10, offset: 0 }); render(<DemoApp/>); fireEvent.change(screen.getByLabelText('Demo actor'), { target: { value: 'adjuster-1' } }); await screen.findByText('No claims on this page'); expect(screen.queryByRole('button', { name: /New claim/ })).toBeNull();
>   });
>   it('does not expose demo actor controls or send API requests in production mode', () => {
>     vi.stubEnv('DEV', false); const list = vi.spyOn(api, 'list'); render(<App/>);
>     expect(screen.getByText('The development demo is unavailable in this build.')).toBeTruthy(); expect(screen.queryByLabelText('Demo actor')).toBeNull(); expect(list).not.toHaveBeenCalled();
>   });
>   it('renders the pinned workflow version and no made-up cycle maximum', async () => {
>     await open(); expect(screen.getByText('claims · v1')).toBeTruthy(); expect(screen.getByRole('progressbar').getAttribute('max')).toBe('3');
>   });
> });
> EOF
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix frontend test``
> - Ran `python3 - <<'PY'
> from pathlib import Path
> p=Path('frontend/src/components/TransitionActions.tsx');s=p.read_text().replace("const raw = values[field.name] ?? '';", "const raw = Object.hasOwn(values, field.name) ? values[field.name] : '';").replace("value={values[field.name] ?? ''}", "value={Object.hasOwn(values, field.name) ? values[field.name] : ''}");p.write_text(s)
> p=Path('frontend/src/test-setup.ts');s=p.read_text().replace("beforeEach(() => vi.stubEnv('DEV', true));", "beforeEach(() => { vi.stubEnv('DEV', true); });");p.write_text(s)
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix frontend run build
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix frontend run lint`
>
> </details>
>
> All 26 frontend tests pass. They cover loading and empty states, creation and detail navigation, metadata-driven forms, same-command retries, refresh after success, stale/authorization errors, and production hiding. I’m addressing two lint warnings, then writing the five-scenario guide with exact requests for cases the UI correctly blocks, such as a fourth information request.
>
> <details><summary>Ran 8 commands</summary>
>
> - Ran ````cat > frontend/src/useRemote.ts <<'EOF'
> import { useCallback, useEffect, useState } from 'react';
> export function useRemote<T>(load: (signal: AbortSignal) => Promise<T>) {
>   const [version, setVersion] = useState(0);
>   const [state, setState] = useState<{ data?: T; loading: boolean; error?: Error; forLoad?: typeof load; forVersion?: number }>({ loading: true });
>   const refresh = useCallback(() => { setState(previous => ({ ...previous, loading: true, error: undefined })); setVersion(value => value + 1); }, []);
>   useEffect(() => {
>     const controller = new AbortController();
>     load(controller.signal).then(data => {
>       if (!controller.signal.aborted) setState({ data, loading: false, forLoad: load, forVersion: version });
>     }).catch((error: unknown) => {
>       if (!controller.signal.aborted) setState(previous => ({ ...previous, loading: false, forLoad: load, forVersion: version, error: error instanceof Error ? error : new Error('Unable to load data.') }));
>     });
>     return () => controller.abort();
>   }, [load, version]);
>   const current = state.forLoad === load && state.forVersion === version;
>   return { data: state.data, error: current ? state.error : undefined, loading: state.loading || !current, refresh };
> }
> EOF
> cat > frontend/src/format.ts <<'EOF'
> export function label(value: string) { return value.replaceAll('_', ' '); }
> EOF
> python3 - <<'PY'
> from pathlib import Path
> p=Path('frontend/src/components/Common.tsx');s=p.read_text().replace("export function label(value: string) { return value.replaceAll('_', ' '); }", "import { label } from '../format';");p.write_text(s)
> p=Path('frontend/src/components/ClaimDetail.tsx');s=p.read_text().replace('ErrorNotice, label, Pager', 'ErrorNotice, Pager').replace("import { useRemote } from '../useRemote';", "import { useRemote } from '../useRemote';\nimport { label } from '../format';");p.write_text(s)
> p=Path('frontend/src/api/client.test.ts');s=p.read_text().replace('api, ApiError','api').replace(".rejects.toBeInstanceOf(ApiError)", ".rejects.toMatchObject({ code: 'STORAGE_BUSY', status: 503, uncertain: true })");p.write_text(s)
> p=Path('frontend/src/index.css');s=p.read_text();s+='\n/* Keep supporting copy legible on the light workspace surface. */\n.footnote,.input-hint,.timeline small,.metadata dt,label span,.table-id,.actor-switch label,.blocked-label{color:#657680}\n';p.write_text(s)
> p=Path('frontend/index.html');s=p.read_text().replace('<title>frontend</title>', '<title>Claims Workflow Orchestrator</title>').replace('<title>Vite + React + TS</title>','<title>Claims Workflow Orchestrator</title>');p.write_text(s)
> PY
> cat > docs/demo-scenarios.md <<'EOF'
> # Five reproducible workflow scenarios
>
> Use only disposable demo claims. These steps call the real API, with no SQL edits,
> seeding endpoint, or fake results. No extra tooling beyond Node and curl is needed.
> All command IDs below are generated fresh except deliberate idempotency replays.
>
> ## Prerequisites and safe isolation
>
> Use a Node runtime compatible with the installed native SQLite binding (verified
> with 22.15.1; newer installed tooling declares ^22.22.3 or compatible newer major).
> Install backend and frontend dependencies with that same Node runtime on PATH.
>
> In terminal A, from `backend/`, create a NEW disposable directory and start the API
> on an unused port. This never touches `backend/data/claims.sqlite`:
>
> ```sh
> npm ci
> export CWO_DEMO_DIR="$(mktemp -d "${TMPDIR:-/tmp}/claims-demo.XXXXXX")"
> export SQLITE_DATABASE_PATH="$CWO_DEMO_DIR/claims.sqlite"
> export PORT=3109
> export NODE_ENV=development
> export DEMO_IDENTITY_ENABLED=true
> npm run start:dev
> ```
>
> In terminal B, from `frontend/`:
>
> ```sh
> npm ci
> API_PROXY_TARGET=http://127.0.0.1:3109 npm run dev
> ```
>
> Open the URL Vite prints. `/api` requests go through Vite's same-origin proxy; no
> backend CORS change is needed. API_PROXY_TARGET is server-side configuration,
> not a client-exposed VITE variable. Match it to the backend's actual origin/PORT.
> The example origins are local run instructions, not hardcoded application URLs.
>
> The selector supports claimant-1, claimant-2, and adjuster-1 only. It clears prior
> actor data when switched. This is development impersonation, not authentication.
> Production bundles show an unavailable notice and contain no actor selector;
> the backend also independently rejects production/disabled-demo requests.
>
> To reset: stop the disposable backend, create a NEW mktemp directory, change
> SQLITE_DATABASE_PATH, and restart. Refresh the UI. Retain old directories for
> review; do not delete/reset a database containing user data. There is no UI or
> API reset/delete route. Never edit applied migrations or stored checksums.
>
> ## Curl helpers (terminal C)
>
> Set the origin matching terminal A. Helpers use only the documented API and
> allowlisted demo identities. Use the exact controlled JSON inputs shown below.
>
> ```sh
> export CWO_API_BASE_URL=http://127.0.0.1:3109
>
> create_demo_claim() {
>   curl -sS -i "$CWO_API_BASE_URL/api/claims" \
>     -H 'Content-Type: application/json' -H 'X-Demo-Actor-Id: claimant-1' \
>     --data '{"title":"Disposable workflow scenario","description":"Created intentionally for a local demo."}'
> }
>
> transition_demo_claim() {
>   local cwo_actor="$1" cwo_transition="$2" cwo_revision="$3" cwo_input="${4:-\{\}}"
>   local cwo_command_id="${5:-$(node -p 'crypto.randomUUID()')}"
>   curl -sS -i "$CWO_API_BASE_URL/api/claims/$CWO_CLAIM_ID/transitions" \
>     -H 'Content-Type: application/json' -H "X-Demo-Actor-Id: $cwo_actor" \
>     --data "{\"transitionId\":\"$cwo_transition\",\"expectedRevision\":$cwo_revision,\"commandId\":\"$cwo_command_id\",\"input\":$cwo_input}"
> }
> ```
>
> For EACH scenario run `create_demo_claim`, expect 201, and copy its returned `id`:
>
> ```sh
> export CWO_CLAIM_ID='paste-the-real-returned-UUID-here'
> ```
>
> Use a fresh claim for each scenario. Do not substitute an existing user claim.
>
> ## 1. Approval happy path
>
> UI: as claimant-1, create a new claim, choose Submit, and confirm. Switch to
> adjuster-1, open the same claim, choose Start review and confirm, then Approve and
> confirm. After each action the state, revision, action list, and audit refresh.
> Expected final state: approved, revision 3, information-request count 0, three
> ordered success events. The approval response has one local notification ID.
>
> Equivalent API steps for a fresh claim:
>
> ```sh
> transition_demo_claim claimant-1 submit 0 '{}'
> transition_demo_claim adjuster-1 start_review 1 '{}'
> transition_demo_claim adjuster-1 approve 2 '{}'
> ```
>
> Every response is 200. Discovery has no outgoing actions after approval.
>
> ## 2. Role and ownership denial
>
> For a fresh draft, select adjuster-1 in the UI. Submit is shown as unavailable
> with a role explanation. It has no actionable submit control. Select claimant-2:
> this claim is absent from that actor's list.
>
> Prove enforcement with the API, rather than adding a UI bypass:
>
> ```sh
> transition_demo_claim adjuster-1 submit 0 '{}'
> curl -sS -i "$CWO_API_BASE_URL/api/claims/$CWO_CLAIM_ID" -H 'X-Demo-Actor-Id: claimant-2'
> ```
>
> Expected: 403 TRANSITION_FORBIDDEN and 404 CLAIM_NOT_FOUND, respectively. The owner
> can still read the draft at revision 0. Adjuster creation is also denied with
> 403 CLAIM_CREATION_FORBIDDEN if POST /api/claims is called directly. The backend,
> not the hidden frontend creation control, enforces this policy.
>
> ## 3. Three information-request cycles; fourth request rejected
>
> Start a fresh claim and enter review:
>
> ```sh
> transition_demo_claim claimant-1 submit 0 '{}'
> transition_demo_claim adjuster-1 start_review 1 '{}'
> transition_demo_claim adjuster-1 request_information 2 '{"message":"Please provide details."}'
> transition_demo_claim claimant-1 provide_information 3 '{"response":"Here are the details."}'
> transition_demo_claim adjuster-1 request_information 4 '{"message":"Please clarify the details."}'
> transition_demo_claim claimant-1 provide_information 5 '{"response":"Clarification supplied."}'
> transition_demo_claim adjuster-1 request_information 6 '{"message":"One final clarification."}'
> transition_demo_claim claimant-1 provide_information 7 '{"response":"Final clarification supplied."}'
> transition_demo_claim adjuster-1 request_information 8 '{"message":"This fourth request must fail."}'
> ```
>
> The first eight transitions return 200. Requests consume counts 1, 2, and 3;
> responses do not increment it. The fourth request ATTEMPT returns 422
> CYCLE_LIMIT_REACHED. State remains under_review, revision 8, count 3. No success
> audit, receipt, or notification is added for that rejection.
>
> UI: alternate adjuster Request information and owner Provide information, using
> the configured Message/Response forms. Reopen the claim after each actor switch.
> At count 3, Request information is blocked; Approve and Reject remain eligible.
> Use curl for the denied fourth attempt because the UI correctly prevents it.
>
> ## 4. Invalid transition and required input
>
> For a fresh draft:
>
> ```sh
> transition_demo_claim adjuster-1 approve 0 '{}'
> ```
>
> Expected: 409 STATE_CONFLICT; state draft, revision 0, audit empty. This is a real
> invalid-source transition, not a fabricated precondition failure. Creation's
> required title/description checks normally make submit's preconditions pass.
> Do not corrupt database fields to manufacture a failure.
>
> Then enter review and try rejecting without its configured reason:
>
> ```sh
> transition_demo_claim claimant-1 submit 0 '{}'
> transition_demo_claim adjuster-1 start_review 1 '{}'
> transition_demo_claim adjuster-1 reject 2 '{}'
> ```
>
> Expected: 400 INVALID_REQUEST; still under_review/revision 2. The UI generates the
> Reason form from discovery metadata and rejects empty/whitespace-only submission
> locally. A valid reason permits the real rejection:
>
> ```sh
> transition_demo_claim adjuster-1 reject 2 '{"reason":"Not covered in this disposable demo."}'
> ```
>
> Expected: 200, rejected/revision 3, one local notification ID, persisted reason
> in the success event's input (not exposed by the read-only audit API).
>
> ## 5. Idempotent replay and stale revision
>
> For a fresh draft, retain ONE command ID and submit the SAME request twice:
>
> ```sh
> export CWO_REPLAY_ID="$(node -p 'crypto.randomUUID()')"
> transition_demo_claim claimant-1 submit 0 '{}' "$CWO_REPLAY_ID"
> transition_demo_claim claimant-1 submit 0 '{}' "$CWO_REPLAY_ID"
> transition_demo_claim claimant-1 submit 1 '{}' "$CWO_REPLAY_ID"
> transition_demo_claim adjuster-1 start_review 0 '{}'
> ```
>
> Expected: first two calls return 200 with the same claim snapshot/audit ID; revision
> is still 1 and there is only one success event. Third returns 409 COMMAND_ID_REUSED
> because the payload changed. Fourth uses a new ID but stale revision and returns
> 409 REVISION_CONFLICT. No automatic resubmission with a new revision occurs.
>
> Read the actual history:
>
> ```sh
> curl -sS -i "$CWO_API_BASE_URL/api/claims/$CWO_CLAIM_ID/audit" -H 'X-Demo-Actor-Id: claimant-1'
> ```
>
> UI stale conflict: open the same fresh draft in two tabs as claimant-1. Submit in
> one tab; confirm the old Submit form in the other without refreshing. The second
> shows REVISION_CONFLICT. Refresh explicitly, then review current actions.
>
> UI uncertain-network retry: use the browser's development tools to go offline
> before confirming an action. The UI shows Outcome not yet confirmed and its
> command ID. Restore connectivity and click Retry same command. Inspect the
> request: ID, input, and expected revision stay identical. This offline exercise
> does not pretend a server commit occurred; the API replay steps above prove
> recovery after an actual successful commit. Actor/navigation/forms stay locked
> while the outcome is unresolved. Keep the page open: retry context is currently
> in memory and is discarded by a browser reload.
>
> ## Verification
>
> ```sh
> # frontend/
> npm test
> npm run build
> npm run lint
> npm run typecheck
>
> # backend/
> npm test
> npm run test:e2e
> ```
>
> Component tests simulate network loss explicitly; application screens never
> substitute their test fixtures or synthetic data for backend records.
> EOF
> cat > frontend/README.md <<'EOF'
> # Claims Workflow Orchestrator — frontend
>
> React + TypeScript + Vite + Tailwind CSS v4. The development demo uses only the
> existing NestJS APIs: claims, action discovery, transition commands, and audit.
>
> ## Local development
>
> Use the same supported Node runtime for installs/builds and the backend's native
> SQLite addon. Checks were run with Node 22.15.1; some existing backend tooling
> requires ^22.22.3 or a compatible newer major for a warning-free installation.
>
> Start the backend with an explicit disposable database as described in
> [the scenario guide](../docs/demo-scenarios.md), NODE_ENV=development, and
> DEMO_IDENTITY_ENABLED=true. Then, from frontend/:
>
> ```sh
> npm ci
> cp .env.example .env.local
> # Edit API_PROXY_TARGET to match the running backend origin/PORT.
> npm run dev
> ```
>
> Alternatively pass API_PROXY_TARGET directly to npm run dev. Vite requires it for
> development, proxies relative /api calls to that origin, and does not expose it
> to client code. No backend CORS weakening is needed. The example target uses the
> backend's default port 3000; the isolated scenario guide uses 3109 instead.
> Do not put secrets into VITE_* variables.
>
> ## Screens and behavior
>
> - Paginated claim dashboard, real loading/empty/error states, creation and details.
> - Three fixed allowlisted demo actor selections; the backend remains authoritative.
> - Pinned workflow, revision, owner, request-cycle count/limit, discovered actions.
> - Input forms generated from eligible actions' inputFields metadata.
> - Read-only audit timeline with bounded page navigation.
> - Stable backend errors, explicit refresh after conflicts, no automatic retries.
> - An uncertain transition keeps its original command ID/input/revision for an
>   explicit same-command retry. Navigation/actor/input changes are locked until
>   resolution. Refreshing data does not replace that pending command.
>
> The production build excludes the demo workspace and actor-selection module,
> shows an unavailable notice, and sends no demo identity. There is no production
> authentication adapter; the backend's production claim routes remain fail-closed.
>
> ## Checks
>
> ```sh
> npm test
> npm run build
> npm run lint
> npm run typecheck
> ```
>
> Vitest, React Testing Library, and jsdom are development-only additions because
> the scaffold had no frontend testing tools. Tests use explicit fixtures and mocks;
> they are never imported into application screens. TypeScript strict checking is
> enabled. Tests exercise state rendering, creation/navigation, discovered forms,
> retry IDs, refresh behavior, actor isolation, errors, and production hiding.
>
> ## Demo scenarios and limitations
>
> Follow [all five reproducible scenarios](../docs/demo-scenarios.md). Use fresh
> claims and a separate disposable database; reset by choosing a NEW database path,
> not by deleting a database containing user data.
>
> The demo is deliberately development-only. Actor selection impersonates known
> local actors and is not authentication. Navigation is in memory, with no routing
> library or deep links. Pending transition context is retained in memory until
> resolution, but not across a browser reload. Creation itself is non-idempotent;
> after uncertain creation, check the list before submitting again. Offset pages
> may move during concurrent writes. There are no notification reads, external
> services, fake metrics, seeded production claims, or frontend workflow graph.
> EOF
> cat > README.md <<'EOF'
> # Claims Workflow Orchestrator
>
> A configurable claims workflow with a NestJS/SQLite backend and a React/Vite
> reviewer demo. States, role restrictions, preconditions, input forms, and local
> side effects come from immutable, registered JSON workflow versions.
>
> Start with [local setup and the five reproducible scenarios](docs/demo-scenarios.md).
> Use an isolated disposable SQLite database for demonstrations; existing migration
> history must not be edited or reset.
>
> - [Frontend setup, checks, and limitations](frontend/README.md)
> - [Backend architecture, API contracts, and checks](backend/README.md)
> - [Workflow configuration vocabulary](backend/config/README.md)
>
> The UI is development-only and requires the backend's development demo identity
> flags. Production builds intentionally expose no impersonation controls or
> production authentication bypass. No fake data is displayed as backend data.
> EOF
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix frontend run lint````
> - Ran `python3 - <<'PY'
> from pathlib import Path
> import hashlib,json,sqlite3
> Path('/private/tmp/task09-migrations.sha256').write_text(hashlib.sha256(Path('backend/src/database/migrations.ts').read_bytes()).hexdigest())
> Path('/private/tmp/task09-tsbuildinfo').write_bytes(Path('backend/tsconfig.build.tsbuildinfo').read_bytes())
> p=Path('backend/data/claims.sqlite').resolve()
> if p.exists():
>  db=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True)
>  try:
>   tables=['schema_migrations','workflow_versions','claims','transition_events','notifications','command_receipts']
>   data={table:hashlib.sha256(json.dumps(db.execute(f'SELECT * FROM {table} ORDER BY rowid').fetchall(),ensure_ascii=False,separators=(',',':')).encode()).hexdigest() for table in tables}
>   Path('/private/tmp/task09-data-baseline.json').write_text(json.dumps(data))
>  finally: db.close()
> p=Path('docs/demo-scenarios.md');s=p.read_text().replace('cwo_input="${4:-\\{\\}}"','cwo_input="$4"');p.write_text(s)
> p=Path('backend/README.md');s=p.read_text().replace('Remaining work: frontend workflow demonstration, notification read APIs if needed,\nrejected-attempt logging, production authentication, external side effects, and\nworkflow editing. Recommended next task: the React claim workflow UI using these\nAPIs, with at least five documented reproducible end-to-end scenarios.', 'Task 09 adds the React workflow demo; see ../frontend/README.md for setup and\n../docs/demo-scenarios.md for five reproducible scenarios with a disposable\ndatabase. Notification read APIs, rejected-attempt logging, production\nauthentication, external side effects, and workflow editing remain deferred.');p.write_text(s)
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix frontend test
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix frontend run typecheck`
> - Ran `cat frontend/index.html; cat frontend/public/favicon.svg | head -3; cat frontend/package.json; git diff --stat; rg -n 'cwo_input' docs/demo-scenarios.md; /Users/tranngochung/.nvm/versions/node/v22.15.1/bin/node -e 'console.log(require("./frontend/node_modules/jsdom/package.json").engines)'`
> - Ran ``python3 - <<'PY'
> from pathlib import Path
> p=Path('frontend/src/components/TransitionActions.test.tsx');s=p.read_text();s+='''
>
> it('handles an additional configured field named constructor and enforces its bounds', async () => {
>   const send = vi.spyOn(api, 'transition').mockResolvedValue({ claim, auditEventId: 'event', notificationIds: [] });
>   render(<TransitionActions actor="adjuster-1" discovery={{ ...discovery, transitions: [{ ...action, inputFields: [{ name: 'constructor', label: 'Details', required: true, minLength: 1, maxLength: 8 }] }] }} refreshing={false} onSuccess={vi.fn()} onLock={vi.fn()}/>);
>   fireEvent.click(screen.getByRole('button', { name: 'Choose action' }));
>   fireEvent.submit(screen.getByRole('form', { name: 'Request information form' })); expect(send).not.toHaveBeenCalled();
>   fireEvent.change(screen.getByLabelText(/Details/), { target: { value: '123456789' } }); fireEvent.submit(screen.getByRole('form', { name: 'Request information form' })); expect(send).not.toHaveBeenCalled();
>   fireEvent.change(screen.getByLabelText(/Details/), { target: { value: 'valid' } }); fireEvent.submit(screen.getByRole('form', { name: 'Request information form' }));
>   await waitFor(() => expect(send).toHaveBeenCalledOnce()); expect(send.mock.calls[0][2].input).toEqual({ constructor: 'valid' });
> });
> ''';p.write_text(s)
> p=Path('frontend/src/DemoApp.test.tsx');s=p.read_text();s+='''
>
> it('paginates actual audit API results without unbounded history requests', async () => {
>   vi.spyOn(api, 'list').mockResolvedValue({ items: [claim], limit: 10, offset: 0 }); detailMocks();
>   vi.mocked(api.audit).mockResolvedValueOnce({ ...audit, items: Array.from({ length: 10 }, (_, index) => ({ id: `event-${index}`, transitionId: 'submit', actor: { id: 'claimant-1', role: 'claimant' as const }, fromState: 'draft', toState: 'submitted', previousRevision: index, resultingRevision: index + 1, createdAt: claim.updatedAt })) }).mockResolvedValue({ ...audit, offset: 10, items: [] });
>   render(<DemoApp/>); fireEvent.click(await screen.findByRole('button', { name: 'Open Laptop damage' }));
>   const next = await screen.findByRole('button', { name: 'Next audit events' }); await waitFor(() => expect(next.hasAttribute('disabled')).toBe(false)); fireEvent.click(next);
>   await screen.findByText('No transitions on this page'); expect(api.audit).toHaveBeenLastCalledWith('claimant-1', claim.id, 10, expect.any(AbortSignal));
> });
> it('rejects empty creation fields locally', () => {
>   vi.spyOn(api, 'list').mockResolvedValue({ items: [], limit: 10, offset: 0 }); const create = vi.spyOn(api, 'create'); render(<DemoApp/>);
>   fireEvent.click(screen.getByRole('button', { name: /New claim/ })); fireEvent.click(screen.getByRole('button', { name: 'Create claim' }));
>   expect(screen.getByRole('alert').textContent).toContain('Enter a title'); expect(create).not.toHaveBeenCalled();
> });
> ''';p.write_text(s)
> PY
> cat > frontend/public/favicon.svg <<'EOF'
> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="#142d35"/><path d="M27 12a11 11 0 1 0 0 16" fill="none" stroke="#87d0bd" stroke-width="4" stroke-linecap="round"/></svg>
> EOF
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH backend/node_modules/.bin/prettier --write frontend/src/api/*.ts frontend/src/components/*.tsx frontend/src/DemoApp*.tsx frontend/src/App.tsx frontend/src/useRemote.ts frontend/src/format.ts frontend/src/test-setup.ts frontend/src/test/fixtures.ts frontend/src/index.css frontend/vite.config.ts frontend/vitest.config.ts
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix frontend test``
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix frontend run lint`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix backend test -- --reporter=dot`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix backend run build`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix frontend run build`
>
> </details>
>
> The frontend now has 29 passing tests, and frontend build, strict type-check, and lint pass. All 204 backend unit tests also pass. The scenario guide includes safe isolated setup, exact API steps, expected statuses, and reset-by-new-database-path instructions. I’ll now check the real API through the Vite proxy and verify that the production bundle contains no demo actor IDs or identity header.
>
> <details><summary>Ran 5 commands</summary>
>
> - Ran `mktemp -d /private/tmp/claims-task09.XXXXXX`
> - Ran ``cat > /private/tmp/task09-live-check.mjs <<'EOF'
> import assert from 'node:assert/strict';
> import { randomUUID } from 'node:crypto';
> const origin = 'http://127.0.0.1:33110';
> async function call(method, path, actor='claimant-1', body) {
>   const response = await fetch(origin + '/api' + path, { method, headers: { 'X-Demo-Actor-Id': actor, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
>   return { status: response.status, body: await response.json() };
> }
> async function create(name) { const result=await call('POST','/claims','claimant-1',{title:`Task09 disposable verification: ${name}`,description:'Real API record in a dedicated temporary database.'}); assert.equal(result.status,201); return result.body; }
> async function step(claim, transitionId, expectedRevision, actor, input={}, status=200, commandId=randomUUID()) {
>   const result=await call('POST',`/claims/${claim.id}/transitions`,actor,{transitionId,expectedRevision,commandId,input}); assert.equal(result.status,status,JSON.stringify(result.body)); return result.body;
> }
> const page=await fetch(origin); assert.equal(page.status,200); assert.match(await page.text(),/Claims Workflow Orchestrator/);
> assert.equal((await fetch(origin+'/src/DemoApp.tsx')).status,200);
> assert.deepEqual((await call('GET','/claims?limit=10&offset=0')).body.items,[]);
> let claim=await create('approval'); await step(claim,'submit',0,'claimant-1'); await step(claim,'start_review',1,'adjuster-1');
> const approved=await step(claim,'approve',2,'adjuster-1'); assert.equal(approved.claim.state,'approved'); assert.equal(approved.notificationIds.length,1);
> assert.equal((await call('GET',`/claims/${claim.id}/audit`)).body.items.length,3); console.log('PASS 1: approval path through actual Vite API proxy');
> claim=await create('denial'); assert.equal((await step(claim,'submit',0,'adjuster-1',{},403)).error.code,'TRANSITION_FORBIDDEN');
> assert.equal((await call('GET',`/claims/${claim.id}`,'claimant-2')).status,404); assert.equal((await call('POST','/claims','adjuster-1',{title:'Denied',description:'Denied'})).status,403); console.log('PASS 2: role and ownership denial');
> claim=await create('cycle limit'); await step(claim,'submit',0,'claimant-1'); await step(claim,'start_review',1,'adjuster-1');
> for(let i=0;i<3;i++){const result=await step(claim,'request_information',2+i*2,'adjuster-1',{message:'Details please'});assert.equal(result.claim.informationRequestCount,i+1);await step(claim,'provide_information',3+i*2,'claimant-1',{response:'Details supplied'});}
> assert.equal((await step(claim,'request_information',8,'adjuster-1',{message:'Fourth attempt'},422)).error.code,'CYCLE_LIMIT_REACHED');
> const current=(await call('GET',`/claims/${claim.id}`)).body; assert.equal(current.revision,8);assert.equal(current.informationRequestCount,3);
> assert.equal((await call('GET',`/claims/${claim.id}/available-transitions`,'adjuster-1')).body.transitions[0].reasonCode,'CYCLE_LIMIT_REACHED');console.log('PASS 3: three successful cycles, fourth rejected');
> claim=await create('invalid transition'); assert.equal((await step(claim,'approve',0,'adjuster-1',{},409)).error.code,'STATE_CONFLICT');
> assert.equal((await call('GET',`/claims/${claim.id}/audit`)).body.items.length,0);
> await step(claim,'submit',0,'claimant-1');await step(claim,'start_review',1,'adjuster-1');assert.equal((await step(claim,'reject',2,'adjuster-1',{},400)).error.code,'INVALID_REQUEST');
> assert.equal((await step(claim,'reject',2,'adjuster-1',{reason:'Disposable demo rejection'})).claim.state,'rejected');console.log('PASS 4: invalid source and missing configured reason');
> claim=await create('replay');const key=randomUUID();const first=await step(claim,'submit',0,'claimant-1',{},200,key);assert.deepEqual(await step(claim,'submit',0,'claimant-1',{},200,key),first);
> assert.equal((await step(claim,'submit',1,'claimant-1',{},409,key)).error.code,'COMMAND_ID_REUSED');assert.equal((await step(claim,'start_review',0,'adjuster-1',{},409)).error.code,'REVISION_CONFLICT');
> assert.equal((await call('GET',`/claims/${claim.id}/audit`)).body.items.length,1);console.log('PASS 5: committed replay and stale revision rejection');
> assert.equal((await call('GET','/claims?limit=10&offset=0','adjuster-1')).body.items.length,5);assert.equal((await call('GET','/claims?limit=10&offset=0','claimant-2')).body.items.length,0);
> console.log('All five scenarios verified with real records in the disposable database only.');
> EOF
> /Users/tranngochung/.nvm/versions/node/v22.15.1/bin/node /private/tmp/task09-live-check.mjs``
> - Ran `python3 - <<'PY'
> from pathlib import Path
> p=Path('frontend/src/api/client.ts');s=p.read_text().replace('signal: signal ?? AbortSignal.timeout(15000),', 'signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),');p.write_text(s)
> p=Path('frontend/src/index.css');s=p.read_text();s+='\n.page-heading>div,.action-heading>div{min-width:0}h1,h2,h3{overflow-wrap:anywhere}.claim-link{max-width:320px;white-space:normal;overflow-wrap:anywhere}\n';p.write_text(s)
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH backend/node_modules/.bin/prettier --write frontend/src/api/client.ts frontend/src/index.css
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix frontend test`
> - Ran `rg -n 'interface ConfigEnv|isPreview' frontend/node_modules/vite/dist/node/index.d.ts | head -10; cat frontend/vite.config.ts; sed -n '1,115p' frontend/src/components/TransitionActions.tsx; git status --short | tail -30`
> - Ran ````python3 - <<'PY'
> from pathlib import Path
> p=Path('frontend/vite.config.ts');s=p.read_text().replace('({ mode, command })', '({ mode, command, isPreview })').replace('command === "serve" && mode !== "test" && !target', 'command === "serve" && !isPreview && mode !== "test" && !target');p.write_text(s)
> p=Path('frontend/src/index.css');s=p.read_text();s+='\n@media(max-width:480px){.breadcrumb{display:none}.topbar:before{content:"CLAIMS";font-size:10px;font-weight:650;letter-spacing:1.2px;color:#4c6b74;margin-right:auto}.actor-switch select{max-width:190px}}\n';p.write_text(s)
> p=Path('frontend/README.md');s=p.read_text().replace('shows an unavailable notice, and sends no demo identity.', 'shows an unavailable notice, and sends no demo identity. `npm run preview` can\nserve that production notice without API_PROXY_TARGET.');p.write_text(s)
> PY
> PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH backend/node_modules/.bin/prettier --write frontend/vite.config.ts frontend/src/index.css
> python3 - <<'PY'
> from pathlib import Path
> import re,subprocess
> text=Path('docs/demo-scenarios.md').read_text()
> block=next(b for b in re.findall(r'```sh\n(.*?)```',text,re.S) if 'create_demo_claim()' in b)
> p=Path('/private/tmp/task09-doc-helpers.zsh');p.write_text(block)
> subprocess.run(['zsh','-n',str(p)],check=True)
> print('Documented scenario helper syntax: PASS')
> PY````
>
> </details>
>
> All five scenarios passed through the real Vite proxy against the separate temporary database: approval, access denial, three request cycles with the fourth rejected, invalid transitions/input, and idempotent replay with a stale-revision conflict. I’m finishing the regression checks and production artifact inspection, then I’ll stop the temporary servers and confirm that the existing database and migrations are unchanged.
>
> <details><summary>Ran 9 commands</summary>
>
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix backend run test:e2e`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix frontend run lint`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix backend run lint`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix frontend run typecheck`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH npm --prefix frontend run build`
> - Ran `python3 - <<'PY'
> from pathlib import Path
> import hashlib,json,sqlite3
> assets='\n'.join(p.read_text() for p in Path('frontend/dist/assets').glob('*.js'))
> for text in ('claimant-1','claimant-2','adjuster-1','X-Demo-Actor-Id','Retry same command','/api/claims','33109'):
>  assert text not in assets,f'Development-only content leaked: {text}'
> assert 'Production access requires a real authentication adapter.' in assets
> print('Production JavaScript excludes demo actors, identity header, API workspace and test origin: PASS')
> assert hashlib.sha256(Path('backend/src/database/migrations.ts').read_bytes()).hexdigest()==Path('/private/tmp/task09-migrations.sha256').read_text()
> print('Migrations 001–004 and migration runner unchanged: PASS')
> p=Path('backend/data/claims.sqlite').resolve()
> if Path('/private/tmp/task09-data-baseline.json').exists():
>  db=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True)
>  try:
>   for table,digest in json.loads(Path('/private/tmp/task09-data-baseline.json').read_text()).items():
>    rows=db.execute(f'SELECT * FROM {table} ORDER BY rowid').fetchall()
>    assert hashlib.sha256(json.dumps(rows,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()==digest,f'{table} changed'
>   print('Existing database history, claims, events, notifications and receipts preserved: PASS')
>  finally: db.close()
> Path('backend/tsconfig.build.tsbuildinfo').write_bytes(Path('/private/tmp/task09-tsbuildinfo').read_bytes())
> PY
> git diff --check
> git diff --stat
> git ls-files --others --exclude-standard`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH API_PROXY_TARGET=http://127.0.0.1:33109 npm run dev -- --host 127.0.0.1 --port 33110 --strictPort`
> - Ran `PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH NODE_ENV=development DEMO_IDENTITY_ENABLED=true PORT=33109 SQLITE_DATABASE_PATH=/private/tmp/claims-task09.GEkzLn/claims.sqlite node dist/main.js`
> - Ran `git diff --check; git status --short; git diff -- frontend/package.json frontend/vite.config.ts frontend/tsconfig.app.json frontend/tsconfig.node.json backend/README.md; rg -n 'fixtures|localhost|127\.0\.0\.1|https?://' frontend/src --glob '!*.test.*' --glob '!test/**' --glob '!assets/**'`
>
> </details>
</details>

Implemented Task 09: responsive claim dashboard, creation/detail views, metadata-driven transition forms, blocked-action explanations, cycle progress, and paginated audit history.

Uncertain transition retries retain the original command ID, input, and revision. Successful transitions refresh all detail data; stale conflicts require explicit review.

Changes include frontend components, typed API client, loading/retry handling, styling, Vite proxy configuration, test setup, and documentation. Vitest, React Testing Library, and jsdom were added as development dependencies.

Verification:

| Check | Result |
|---|---|
| Frontend tests | **29 passed** |
| Frontend build, lint, type-check | Passed |
| Backend unit tests | **204 passed** |
| Backend E2E tests | **110 passed** |
| Backend build and lint | Passed |
| Five scenarios through the real Vite proxy | **All passed** |
| `git diff --check` | Passed |

Production artifacts exclude demo actors, identity headers, and the demo workspace. Migrations 001–004 and existing database data were verified unchanged. No fake application data, backend authorization bypass, or commit was added.

With a compatible Node runtime, start from separate terminals:

```sh
cd backend
npm ci
SQLITE_DATABASE_PATH="$(mktemp -d)/claims.sqlite" \
PORT=3109 NODE_ENV=development DEMO_IDENTITY_ENABLED=true \
npm run start:dev
```

```sh
cd frontend
npm ci
API_PROXY_TARGET=http://127.0.0.1:3109 npm run dev
```

Open Vite’s printed URL. Follow the [five-scenario guide](./docs/demo-scenarios.md) for exact steps and expected responses. Setup and limitations are in the [frontend README](./frontend/README.md).

Limitations: navigation and pending retries are in memory; reloading loses retry context. No browser was connected, so visual browser QA was unavailable. Existing Observe telemetry errors remain. Production authentication is still deferred.

> # Task 10 — Minimal Hardening & Acceptance Testing
>
> ## Objective
>
> Verify that the existing Claims Workflow Orchestrator satisfies the original AI Challenge requirements. Fix only confirmed defects or material gaps. Keep this task small and token-efficient.
>
> Do not add new product features, perform broad refactors, redesign the architecture, or rewrite documentation unnecessarily.
>
> ## Context
>
> Implemented tasks:
>
> - Task 03: Workflow configuration validation.
> - Task 04: SQLite migrations and immutable workflow registry.
> - Task 05: Claim persistence and pinned workflow versions.
> - Task 06: Claim ownership and RBAC.
> - Task 07: Transactional transition engine, information-request cycle limit, audit events, notifications, and idempotency.
> - Task 08: Authorized action discovery and read-only audit history.
> - Task 09: React UI and five reproducible demo scenarios.
>
> Reported existing verification:
>
> - Frontend tests: 29 passed.
> - Backend unit tests: 204 passed.
> - Backend E2E tests: 110 passed.
> - Frontend/backend builds, lint, and TypeScript checks passed.
> - Five scenarios passed through the real Vite proxy.
> - Migrations 001–004 and existing database data were preserved.
>
> These are previous reported results. Re-run checks only where needed to verify the current checkout.
>
> ## Step 1 — Check the original challenge requirements
>
> Inspect the challenge instructions and current implementation. Verify these requirements against actual code and tests:
>
> 1. Configurable JSON/YAML workflow state machine.
> 2. Transitions, preconditions, side effects, RBAC, and immutable audit trail.
> 3. Maximum three information-request cycles.
> 4. CLI or UI to demonstrate the workflow.
> 5. Five reproducible scenarios.
> 6. At least 15 meaningful tests.
> 7. Adding states/transitions using existing registered handlers requires configuration-only changes.
> 8. Raw/verbatim AI coding agent conversation log can be preserved and submitted.
>
> For each requirement, classify it as:
>
> - Verified satisfied.
> - Confirmed gap.
> - Not verifiable from the current repository.
>
> Do not claim compliance based only on README statements. Follow the implementation and relevant tests. Do not invent requirements absent from the challenge.
>
> ## Step 2 — Review only material risks
>
> Prioritize:
>
> - Authorization and cross-owner data isolation.
> - Workflow version pinning and configuration validation.
> - Atomicity of claim state, revision, cycle count, audit events, notifications, and command receipts.
> - Idempotent retry and stale revision/concurrency behavior.
> - Audit immutability and read-only endpoints.
> - Migration drift protection and preservation of existing data.
> - Production builds excluding development-only demo identity mechanisms.
> - Frontend handling of errors, stale revisions, and uncertain transition retries.
> - Reproducibility of the five documented scenarios.
>
> Do not investigate or refactor unrelated code. Do not treat existing non-blocking Observe telemetry errors as application failures without evidence.
>
> ## Step 3 — Fix policy
>
> - Fix only confirmed, material defects or challenge requirement gaps.
> - Prefer the smallest targeted patch.
> - Do not add dependencies unless strictly necessary.
> - Do not add migrations unless a confirmed requirement cannot be satisfied otherwise. If a migration seems necessary, explain why before proceeding.
> - Never bypass authorization, disable tests, weaken validation, or suppress errors to make checks pass.
> - Do not introduce fake data or insecure production shortcuts.
> - Do not change historical migrations 001–004 or their stored checksums.
> - Do not delete, recreate, or reset any existing database.
> - Do not create a commit.
>
> If no material defects are found, make no code changes and report that clearly.
>
> ## Step 4 — Verification
>
> Run the smallest useful set of targeted tests for any changes. Then run the existing full frontend/backend checks where practical:
>
> - Frontend tests and build.
> - Backend unit tests and E2E tests.
> - Lint and TypeScript checks.
> - `git diff --check`.
>
> Do not rerun expensive commands unnecessarily if the current checkout has already passed them and no relevant files changed. Clearly distinguish previously reported results from commands actually run in this task.
>
> Inspect the final diff and `git status --short`. Confirm whether migrations 001–004 changed and report any unrelated pre-existing modifications without overwriting them.
>
> ## Final report
>
> Keep the report concise. Include:
>
> 1. Requirement checklist with status and brief evidence.
> 2. Confirmed defects found and minimal fixes, if any.
> 3. Commands actually run and their results.
> 4. Remaining material gaps or items that could not be verified.
> 5. Whether migrations and existing database data were preserved.
> 6. Whether the project is ready for submission, and any required action before submission.
>
> Implement Task 10 only. Optimize for correctness and low token usage.

<details><summary>6 previous messages</summary>

> I’ll check the requirements against the current code and tests, review the material risks, and run the existing checks once. I’ll make changes only if I find a confirmed defect or gap.
>
> <details><summary>Ran a command</summary>
>
> - Ran `git status --short; git diff --stat; rg --files -g '*challenge*' -g '*conversation*' -g '*transcript*' -g '*AGENTS.md' -g '!node_modules' -g '!dist'; cat frontend/package.json backend/package.json; cat frontend/src/components/TransitionActions.tsx frontend/src/useRemote.ts frontend/src/App.tsx; cat docs/demo-scenarios.md`
>
> </details>
>
> Context compaction
>
> Source: automatic
> Status: completed
>
> <details><summary>Ran 8 commands</summary>
>
> - Ran `git status --short; rg --files -g AGENTS.md -g '*challenge*' -g '*conversation*' -g '*transcript*'; cat backend/package.json; cat frontend/package.json`
> - Ran `cat backend/src/claims/transition.service.ts backend/src/claims/claims-http.ts backend/src/database/migration-history.spec.ts`
> - Ran `rg -n 'it\(|test\(|transaction|immutable|checksum|query_only|configuration|pinned' backend/src/claims/*.spec.ts backend/src/database/*.spec.ts backend/src/workflow/workflow-config.spec.ts; cat backend/src/database/database.service.ts; cat frontend/src/App.tsx; cat backend/src/claims/transition-eligibility.ts`
> - Ran `python3 - <<'PY'
> import pathlib,hashlib,json,sqlite3
> root=pathlib.Path.cwd(); files={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file() and not any(x in p.parts for x in ('node_modules','.git','dist','data','.vite'))}
> pathlib.Path('/tmp/cwo-task10-files.json').write_text(json.dumps(files))
> p=root/'backend/tsconfig.build.tsbuildinfo'; pathlib.Path('/tmp/cwo-task10-buildinfo').write_bytes(p.read_bytes())
> p=root/'backend/data/claims.sqlite'
> if p.exists():
>  c=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True)
>  tables=['schema_migrations','workflow_versions','claims','transition_events','notifications','command_receipts']
>  snapshot={t:hashlib.sha256(json.dumps(c.execute('SELECT * FROM '+t+' ORDER BY rowid').fetchall()).encode()).hexdigest() for t in tables}
>  pathlib.Path('/tmp/cwo-task10-db.json').write_text(json.dumps(snapshot)); print('Read-only database baseline captured:',p)
>  print('Migration IDs:',[r[0] for r in c.execute('SELECT * FROM schema_migrations')]); c.close()
> PY`
> - Ran `export PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH
> npm test && npm run build && npm run lint`
> - Ran `export PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH
> npm test && npm run build && npm run lint && ./node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`
> - Ran `export PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH
> npm run test:e2e`
> - Ran `cat backend/src/workflow/workflow-config.validator.ts backend/src/claims/claim.service.ts; rg -n 'production|DEMO_IDENTITY|rollback|rolls back' backend/test/*.ts backend/src/claims/transition.service.spec.ts; cat frontend/src/api/client.ts`
>
> </details>
>
> The reviewed code covers the main integrity risks: transitions commit atomically, retries use stored receipts, ownership checks precede claim access, and demo identity fails closed in production. Existing tests also cover configuration-only extensions and migration compatibility. I found no raw conversation-log artifact; that submission item remains unverified.
>
> <details><summary>Explored 2 files, a search, ran a command</summary>
>
> - Ran `python3 - <<'PY'
> import pathlib,json,hashlib,sqlite3
> root=pathlib.Path.cwd(); p=root/'backend/tsconfig.build.tsbuildinfo'; p.write_bytes(pathlib.Path('/tmp/cwo-task10-buildinfo').read_bytes())
> before=json.loads(pathlib.Path('/tmp/cwo-task10-files.json').read_text()); after={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file() and not any(x in p.parts for x in ('node_modules','.git','dist','data','.vite'))}
> changes=[p for p in before.keys()|after.keys() if before.get(p)!=after.get(p)]; print('Workspace file changes during Task 10:',changes)
> p=root/'backend/data/claims.sqlite'; c=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True); before=json.loads(pathlib.Path('/tmp/cwo-task10-db.json').read_text()); after={t:hashlib.sha256(json.dumps(c.execute('SELECT * FROM '+t+' ORDER BY rowid').fetchall()).encode()).hexdigest() for t in before}; assert before==after; print('Existing database: all six table snapshots unchanged'); c.close()
> js='\n'.join(p.read_text() for p in (root/'frontend/dist').rglob('*.js'))
> for marker in ['claimant-1','claimant-2','adjuster-1','X-Demo-Actor-Id','Retry same command']:
>  assert marker not in js,marker
> assert 'Production access requires a real authentication adapter.' in js
> print('Production bundle: demo actor IDs, header and command UI excluded')
> PY
>  git diff --check
>  git diff -- backend/src/database/migrations.ts
>  git status --short`
>
> <details><summary>Explored 2 files, a search</summary>
>
> - Read `./README.md`
> - Searched for `^##|^###|CWO_|transition ` in `demo-scenarios.md`
> - Read `./backend/config/claims.v1.json`
>
> </details>
>
> </details>
</details>

No material defects found. No source changes, dependencies, migrations, or commits were needed.

| Requirement | Status and evidence |
|---|---|
| Configurable JSON/YAML workflow | **Verified satisfied:** JSON loader, schema validation, and semantic validation tests. |
| Transitions, preconditions, side effects, RBAC, immutable audit | **Verified satisfied:** execution and authorization tests; audit update/delete triggers and read-only endpoints. Immutability does not protect against database administrators. |
| Maximum three information requests | **Verified satisfied:** tests allow three successful requests and reject the fourth without writes. |
| CLI or UI demonstration | **Verified satisfied:** React demo and curl commands; frontend tests passed. |
| Five reproducible scenarios | **Verified satisfied:** documented commands match configuration and tested behavior. Live proxy scenarios were previously reported; not rerun here. |
| At least 15 meaningful tests | **Verified satisfied:** 343 tests passed this task. |
| Configuration-only state/transition additions | **Verified satisfied:** validator, execution, and discovery tests cover extensions using existing handlers. |
| Raw AI conversation log | **Not verifiable:** no transcript artifact found. Attach the actual verbatim conversation before submission. |

Commands actually run:

- Frontend: `npm test` — **29 passed**; `npm run build` and `npm run lint` passed. Build includes TypeScript checking.
- Backend: `npm test` — **204 passed**; `npm run test:e2e` — **110 passed**.
- Backend build, lint, and `tsc -p tsconfig.json --noEmit --incremental false` passed.
- `git diff --check` passed.
- Production bundle inspection confirmed demo actor IDs, identity header, and transition UI were excluded.

The existing Observe worker warning appeared during E2E execution; all tests passed.

Migrations **001–004 remain unchanged**, with historical-checksum compatibility tests passing. Read-only snapshots confirmed all six persisted tables in `backend/data/claims.sqlite` remained unchanged. Existing staged, unstaged, and untracked work was preserved; the final workspace comparison showed no Task 10 changes.

Functionally ready for submission. Before submitting, attach the raw conversation log and ensure the existing untracked source and documentation files are included.

> ## Task 11 — Complete Claim Lifecycle: PAYMENT_INITIATED and CLOSED
>
> Review the existing Claims Workflow Orchestrator implementation against the required challenge scenarios.
>
> ### Required lifecycle
>
> Happy path:\
> `SUBMITTED → DOCUMENTS_VERIFIED → UNDER_ASSESSMENT → APPROVED → PAYMENT_INITIATED → CLOSED`
>
> Rejection path:\
> `SUBMITTED → DOCUMENTS_VERIFIED → UNDER_ASSESSMENT → REJECTED → CLOSED`
>
> Request more info loop:\
> `SUBMITTED → DOCUMENTS_VERIFIED → UNDER_ASSESSMENT → PENDING_INFO → DOCUMENTS_VERIFIED → UNDER_ASSESSMENT → APPROVED → PAYMENT_INITIATED → CLOSED`
>
> ### Instructions
>
> 1. Inspect the current workflow configuration, registered handlers, transition eligibility logic, backend tests, and frontend transition UI. Determine whether `PAYMENT_INITIATED` and `CLOSED` are missing or partially implemented before changing anything.
> 2. If missing, implement these states and transitions using the existing architecture and registered handlers wherever possible:
>    - `APPROVED → PAYMENT_INITIATED`
>    - `PAYMENT_INITIATED → CLOSED`
>    - `REJECTED → CLOSED`
> 3. Preserve existing RBAC, preconditions, required inputs, side effects, optimistic concurrency, idempotency, immutable audit history, and information-request lifetime limits.
> 4. Treat payment initiation as a workflow transition and a recorded side effect. Do not integrate a real payment provider or claim that money was transferred. Follow existing side-effect conventions and make the operation safe against duplicate command retries.
> 5. Ensure `CLOSED` is a terminal state unless the challenge's existing rules explicitly require otherwise.
> 6. Keep workflow configuration and implementation consistent. Adding states/transitions should be configuration-only where existing registered handlers support them. If new handlers are genuinely required, implement and test them without introducing unnecessary abstractions.
> 7. Add or update automated tests for:
>    - Happy path ending at `CLOSED` through `PAYMENT_INITIATED`.
>    - Rejection path ending at `CLOSED` without payment initiation.
>    - Request-more-information loop followed by approval, payment initiation, and closure.
>    - Invalid direct transition `SUBMITTED → APPROVED`.
>    - Unauthorized transition attempts.
>    - Duplicate command retries and state/revision/audit consistency for payment initiation and closure.
>    - `CLOSED` cannot transition to another state.
> 8. Update the five-scenario demo documentation and ensure the frontend can discover and perform the new transitions through the existing API. Do not hardcode transitions only in the frontend.
>
> ### Data and migration safety
>
> - Do not reset, delete, or overwrite the existing SQLite database.
> - Do not modify migrations 001–004 or their checksums.
> - If a schema change is truly necessary, add a new migration and explain why before applying it.
> - Preserve existing claims and workflow version history. Handle the workflow versioning implications explicitly.
> - Do not bypass migration drift checks or production fail-closed identity safeguards.
>
> ### Validation and report
>
> Run the relevant backend unit tests, E2E tests, frontend tests, build, lint, TypeScript checks, and `git diff --check`.
>
> Report:
>
> - Files changed and why.
> - The exact transitions and side effects implemented.
> - Test commands and actual results.
> - Any limitations or scenario that could not be executed.
> - Confirmation that migrations 001–004 and existing database records were preserved.
>
> Do not claim a test passed unless it was actually run. Do not commit or push unless explicitly requested.

<details><summary>6 previous messages</summary>

> I’ll inspect the current workflow and tests, then add the required lifecycle as a new workflow version so existing claims retain their original behavior and history.
>
> <details><summary>Explored 11 files, a list, ran a command</summary>
>
> <details><summary>Explored 6 files, a list</summary>
>
> - Listed files
> - Read `./backend/src/workflow/workflow.types.ts`
> - Read `./backend/config/workflow.schema.json`
> - Read `./backend/src/workflow/workflow-config.service.ts`
> - Read `./backend/src/claims/transition.service.spec.ts`
> - Read `./backend/src/workflow/workflow-registry.service.ts`
> - Read `./docs/demo-scenarios.md`
>
> </details>
>
> - Ran `cat backend/src/workflow/workflow.module.ts backend/src/workflow/workflow-registry.module.ts; head -65 backend/test/transitions.e2e-spec.ts; head -50 backend/test/claims.e2e-spec.ts; cat backend/src/database/migrations.ts | rg -n 'template|CHECK'; head -45 backend/src/workflow/workflow-config.spec.ts; rg -n 'WorkflowConfigService|loadWorkflowDefinition|workflowVersion|version: 1' backend/test backend/src --glob '*.spec.ts'`
>
> <details><summary>Explored 5 files</summary>
>
> - Read `./backend/src/database/database.spec.ts`
> - Read `./frontend/src/components/TransitionActions.test.tsx`
> - Read `./backend/src/claims/claim-workflow-read.service.ts`
> - Read `./backend/src/database/migrations.ts`
> - Read `./backend/vitest.config.ts`
>
> </details>
>
> </details>
>
> `PAYMENT_INITIATED` and `CLOSED` are missing. The current workflow also skips document verification and assessment, and treats approval and rejection as terminal.
>
> I’ll add version 2 with the full lifecycle, using lowercase state IDs to match the existing schema. Version 1 and its claims will remain unchanged. Payment initiation needs a distinct local record; migration 005 will add that table without changing migrations 001–004. No payment provider will be called.
>
> <details><summary>Ran 8 commands</summary>
>
> - Ran `sed -n '85,110p' backend/src/database/migrations.ts; rg -n 'MIGRATIONS|length\)|toHaveLength|schema_migrations' backend/src/database/database.spec.ts backend/src/claims/*.spec.ts; cat backend/src/claims/transition-eligibility.ts; head -40 backend/test/claim-workflow-read.e2e-spec.ts`
> - Ran ``python3 - <<'PY'
> from pathlib import Path
> import json,hashlib,sqlite3
> root=Path.cwd(); baseline={}
> for p in [Path('backend/src/database/migrations.ts'),Path('backend/config/claims.v1.json'),Path('backend/tsconfig.build.tsbuildinfo')]: baseline[str(p)]=p.read_bytes().hex()
> Path('/tmp/cwo-task11-baseline.json').write_text(json.dumps(baseline))
> p=root/'backend/data/claims.sqlite'; c=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True); tables=[r[0] for r in c.execute("select name from sqlite_master where type='table'")]; Path('/tmp/cwo-task11-data.json').write_text(json.dumps({t:hashlib.sha256(repr(c.execute('select * from '+t+' order by rowid').fetchall()).encode()).hexdigest() for t in tables})); c.close()
> v=json.loads(Path('backend/config/claims.v1.json').read_text()); v['version']=2
> v['states']=[{'id':s,'label':s.replace('_',' ').capitalize(),'terminal':s=='closed'} for s in ['draft','submitted','documents_verified','under_assessment','pending_info','approved','payment_initiated','rejected','closed']]
> for t in v['transitions']:
>  if t['id']=='start_review': t.update(id='verify_documents',label='Verify documents',to='documents_verified')
>  for k in ['from','to']:
>   t[k]={'under_review':'under_assessment','awaiting_information':'pending_info'}.get(t[k],t[k])
>  if t['id']=='provide_information': t['to']='documents_verified'
> def transition(id,label,source,target,effects=[]): return dict(id=id,label=label,**{'from':source,'to':target},roles=['adjuster'],inputFields=[],preconditions=[],sideEffects=effects)
> v['transitions'].insert(2,transition('start_assessment','Start assessment','documents_verified','under_assessment'))
> v['transitions'] += [transition('initiate_payment','Initiate payment (local record only)','approved','payment_initiated',[{'type':'recordPaymentInitiation'}]),transition('close_paid','Close claim','payment_initiated','closed'),transition('close_rejected','Close rejected claim','rejected','closed')]
> Path('backend/config/claims.v2.json').write_text(json.dumps(v,indent=2)+'\n')
> p=Path('backend/src/workflow/workflow-config.service.ts'); s=p.read_text().replace('const MAX_CONFIG_BYTES',"export const CURRENT_WORKFLOW_PATH = new URL('../../config/claims.v2.json', import.meta.url);\nconst MAX_CONFIG_BYTES").replace('constructor() {\n    this.definition = loadWorkflowDefinition();','constructor(path: string | URL = CURRENT_WORKFLOW_PATH) {\n    this.definition = loadWorkflowDefinition(path);'); p.write_text(s)
> p=Path('backend/src/workflow/workflow.types.ts'); s=p.read_text().replace('export type SideEffectDefinition = CreateNotificationEffect;',"export interface RecordPaymentInitiationEffect {\n  readonly type: 'recordPaymentInitiation';\n}\nexport type SideEffectDefinition = CreateNotificationEffect | RecordPaymentInitiationEffect;"); p.write_text(s)
> p=Path('backend/config/workflow.schema.json'); s=json.loads(p.read_text()); node=s['properties']['transitions']['items']['properties']['sideEffects']; node['items']={'oneOf':[node['items'],{'type':'object','additionalProperties':False,'required':['type'],'properties':{'type':{'const':'recordPaymentInitiation'}}}]}; p.write_text(json.dumps(s,indent=2)+'\n')
> p=Path('backend/src/database/migrations.ts'); s=p.read_text(); s=s.replace('\n]);', '''
>   Object.freeze({
>     id: '005_payment_initiations',
>     sql: `CREATE TABLE payment_initiations (
>       event_id TEXT PRIMARY KEY NOT NULL REFERENCES transition_events(id),
>       claim_id TEXT NOT NULL UNIQUE REFERENCES claims(id),
>       created_at TEXT NOT NULL
>     ) STRICT;
>     CREATE TRIGGER payment_initiations_no_update BEFORE UPDATE ON payment_initiations BEGIN SELECT RAISE(ABORT, 'Payment initiation records are immutable'); END;
>     CREATE TRIGGER payment_initiations_no_delete BEFORE DELETE ON payment_initiations BEGIN SELECT RAISE(ABORT, 'Payment initiation records are immutable'); END;`,
>   }),
> ]);''',1); p.write_text(s)
> p=Path('backend/src/claims/transition.service.ts'); s=p.read_text().replace('transition.sideEffects.forEach((effect, index) => {','''transition.sideEffects.forEach((effect, index) => {
>             if (effect.type === 'recordPaymentInitiation') {
>               this.database.connection.prepare(
>                 'INSERT INTO payment_initiations (event_id, claim_id, created_at) VALUES (?, ?, ?)',
>               ).run(eventId, claim.id, timestamp);
>               return;
>             }'''); p.write_text(s)
> # Explicitly keep the existing tests as compatibility coverage for immutable version 1.
> for p in Path('backend/src/claims').glob('*.spec.ts'):
>  s=p.read_text().replace('new WorkflowConfigService()',"new WorkflowConfigService(new URL('../../config/claims.v1.json', import.meta.url))"); p.write_text(s)
> for p in [Path('backend/test/claims.e2e-spec.ts'),Path('backend/test/transitions.e2e-spec.ts'),Path('backend/test/claim-workflow-read.e2e-spec.ts')]:
>  s=p.read_text();
>  if "import { WorkflowConfigService }" not in s: s="import { WorkflowConfigService } from '../src/workflow/workflow-config.service.js';\n"+s
>  s=s.replace('.overrideProvider(DATABASE_PATH)',".overrideProvider(WorkflowConfigService)\n    .useValue(new WorkflowConfigService(new URL('../config/claims.v1.json', import.meta.url)))\n    .overrideProvider(DATABASE_PATH)"); p.write_text(s)
> p=Path('backend/src/database/database.spec.ts'); s=p.read_text().replace('{ count: 4 }','{ count: 5 }').replace(".get('claims', 1).definition,\n      ).toEqual(definition());",".get('claims', 2).definition,\n      ).toEqual(new WorkflowConfigService().definition);"); p.write_text(s)
> p=Path('backend/src/claims/claim-access.spec.ts'); s=p.read_text().replace('{ count: 4 }','{ count: 5 }'); p.write_text(s)
> p=Path('backend/src/database/migration-history.spec.ts'); s=p.read_text().replace('MIGRATIONS.map(migrationChecksum)','MIGRATIONS.slice(0, 4).map(migrationChecksum)'); s=s.replace('runMigrations(db);\n    runMigrations(db);','runMigrations(db, MIGRATIONS.slice(0, 4));\n    runMigrations(db, MIGRATIONS.slice(0, 4));'); p.write_text(s)
> PY``
> - Ran ``cat > backend/src/claims/lifecycle.spec.ts <<'EOF'
> import { randomUUID } from 'node:crypto';
> import { DatabaseService } from '../database/database.service.js';
> import { WorkflowConfigService, DEFAULT_WORKFLOW_PATH } from '../workflow/workflow-config.service.js';
> import { WorkflowRegistryService } from '../workflow/workflow-registry.service.js';
> import { ClaimService } from './claim.service.js';
> import { TransitionService } from './transition.service.js';
> import { ClaimWorkflowReadService } from './claim-workflow-read.service.js';
> import { resolveDemoActor } from './claim-access.js';
> const owner = resolveDemoActor('claimant-1');
> const adjuster = resolveDemoActor('adjuster-1');
> let db: DatabaseService;
> let claims: ClaimService;
> let engine: TransitionService;
> let reads: ClaimWorkflowReadService;
> let id: string;
> let revision: number;
> const command = (transitionId: string, expectedRevision: number, input = {}) => ({ transitionId, expectedRevision, input, commandId: randomUUID() });
> function execute(transition: string, input = {}, actor = adjuster) {
>   const result = engine.execute(id, command(transition, revision, input), actor);
>   revision = result.claim.revision;
>   return result;
> }
> function assessment() {
>   execute('submit', {}, owner);
>   execute('verify_documents');
>   execute('start_assessment');
> }
> function snapshot() {
>   return ['claims', 'transition_events', 'notifications', 'payment_initiations', 'command_receipts'].map(table => db.connection.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all());
> }
> beforeEach(() => {
>   db = new DatabaseService(':memory:');
>   const config = new WorkflowConfigService();
>   const registry = new WorkflowRegistryService(db);
>   registry.register(config.definition);
>   claims = new ClaimService(db, registry, config);
>   engine = new TransitionService(db, claims);
>   reads = new ClaimWorkflowReadService(db, claims);
>   id = claims.create({ title: 'Damage', description: 'Damaged screen' }, owner).id;
>   revision = 0;
> });
> afterEach(() => db.close());
> it('runs the complete happy path and exposes payment and closure through discovery', () => {
>   assessment();
>   execute('approve');
>   expect(reads.availableTransitions(id, adjuster).transitions).toMatchObject([{ id: 'initiate_payment', eligible: true }]);
>   expect(execute('initiate_payment').claim.state).toBe('payment_initiated');
>   expect(reads.availableTransitions(id, adjuster).transitions).toMatchObject([{ id: 'close_paid', eligible: true }]);
>   expect(execute('close_paid').claim).toMatchObject({ state: 'closed', revision: 6, workflowVersion: 2 });
>   expect(reads.audit(id, owner).items.map(e => e.toState)).toEqual(['submitted', 'documents_verified', 'under_assessment', 'approved', 'payment_initiated', 'closed']);
>   expect(db.connection.prepare('SELECT count(*) n FROM payment_initiations').get()).toEqual({ n: 1 });
> });
> it('closes rejection without initiating payment and keeps the required reason', () => {
>   assessment();
>   const before = snapshot();
>   expect(() => execute('reject')).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
>   expect(snapshot()).toEqual(before);
>   execute('reject', { reason: 'Not covered' });
>   expect(execute('close_rejected').claim.state).toBe('closed');
>   expect(db.connection.prepare('SELECT * FROM payment_initiations').all()).toEqual([]);
> });
> it('returns information to documents verification before assessment and completes closure', () => {
>   assessment();
>   execute('request_information', { message: 'Receipt?' });
>   expect(execute('provide_information', { response: 'Attached' }, owner).claim.state).toBe('documents_verified');
>   execute('start_assessment');
>   execute('approve'); execute('initiate_payment');
>   expect(execute('close_paid').claim).toMatchObject({ state: 'closed', informationRequestCount: 1, revision: 9 });
> });
> it('enforces three requests across repeated document verification and assessment', () => {
>   assessment();
>   for (let i = 0; i < 3; i++) {
>     execute('request_information', { message: 'More?' });
>     execute('provide_information', { response: 'Details' }, owner);
>     execute('start_assessment');
>   }
>   const before = snapshot();
>   expect(() => execute('request_information', { message: 'Fourth' })).toThrow(expect.objectContaining({ code: 'CYCLE_LIMIT_REACHED' }));
>   expect(snapshot()).toEqual(before);
> });
> it('rejects direct submitted approval, cross-owner access and claimant payment/closure', () => {
>   execute('submit', {}, owner);
>   expect(() => execute('approve')).toThrow(expect.objectContaining({ code: 'STATE_CONFLICT' }));
>   execute('verify_documents'); execute('start_assessment'); execute('approve');
>   const before = snapshot();
>   expect(() => execute('initiate_payment', {}, owner)).toThrow(expect.objectContaining({ code: 'TRANSITION_FORBIDDEN' }));
>   expect(() => execute('initiate_payment', {}, resolveDemoActor('claimant-2'))).toThrow(expect.objectContaining({ code: 'CLAIM_NOT_FOUND' }));
>   expect(snapshot()).toEqual(before);
>   execute('initiate_payment');
>   expect(() => execute('close_paid', {}, owner)).toThrow(expect.objectContaining({ code: 'TRANSITION_FORBIDDEN' }));
> });
> it('deduplicates payment and closure even after closure and rejects stale or changed commands', () => {
>   assessment(); execute('approve');
>   const payment = command('initiate_payment', revision);
>   const result = engine.execute(id, payment, adjuster); revision++;
>   expect(engine.execute(id, payment, adjuster)).toEqual(result);
>   const close = command('close_paid', revision);
>   const closed = engine.execute(id, close, adjuster); revision++;
>   const before = snapshot();
>   expect(engine.execute(id, close, adjuster)).toEqual(closed);
>   expect(engine.execute(id, payment, adjuster)).toEqual(result);
>   expect(() => engine.execute(id, { ...payment, expectedRevision: revision }, adjuster)).toThrow(expect.objectContaining({ code: 'COMMAND_ID_REUSED' }));
>   expect(() => engine.execute(id, command('close_paid', revision - 1), adjuster)).toThrow(expect.objectContaining({ code: 'REVISION_CONFLICT' }));
>   expect(snapshot()).toEqual(before);
> });
> it('treats closed as terminal and rejects every configured transition', () => {
>   assessment(); execute('approve'); execute('initiate_payment'); execute('close_paid');
>   expect(reads.availableTransitions(id, adjuster).transitions).toEqual([]);
>   const before = snapshot();
>   for (const transition of new WorkflowConfigService().definition.transitions) {
>     const actor = transition.roles.includes('adjuster') ? adjuster : owner;
>     expect(() => execute(transition.id, {}, actor)).toThrow(expect.objectContaining({ code: 'STATE_CONFLICT' }));
>   }
>   expect(snapshot()).toEqual(before);
> });
> it.each(['payment_initiations', 'command_receipts'])('rolls back payment, state, revision, audit and receipts when %s fails', table => {
>   assessment(); execute('approve');
>   db.connection.exec(`CREATE TRIGGER fail_payment BEFORE INSERT ON ${table} BEGIN SELECT RAISE(ABORT, 'injected'); END`);
>   const before = snapshot();
>   expect(() => execute('initiate_payment')).toThrow(expect.objectContaining({ code: 'TRANSITION_STORAGE_FAILED' }));
>   expect(snapshot()).toEqual(before);
> });
> it('protects payment records against update/delete and preserves version-one pins', () => {
>   assessment(); execute('approve'); execute('initiate_payment');
>   expect(() => db.connection.exec("UPDATE payment_initiations SET created_at='changed'")).toThrow('immutable');
>   expect(() => db.connection.exec('DELETE FROM payment_initiations')).toThrow('immutable');
>   const legacy = new WorkflowConfigService(DEFAULT_WORKFLOW_PATH);
>   const registry = new WorkflowRegistryService(db); registry.register(legacy.definition);
>   const oldClaims = new ClaimService(db, registry, legacy);
>   const old = oldClaims.create({ title: 'Old', description: 'Existing version' }, owner);
>   expect(claims.resolveWorkflow(old.id, owner).definition).toEqual(legacy.definition);
>   expect(reads.availableTransitions(old.id, owner).transitions[0].id).toBe('submit');
>   expect(old.workflowVersion).toBe(1);
> });
> EOF
> cat > backend/test/lifecycle.e2e-spec.ts <<'EOF'
> import { Test } from '@nestjs/testing';
> import type { INestApplication } from '@nestjs/common';
> import request from 'supertest';
> import { randomUUID } from 'node:crypto';
> import { ClaimsModule } from '../src/claims/claims.module.js';
> import { DATABASE_PATH, DatabaseService } from '../src/database/database.service.js';
> let app: INestApplication;
> let db: DatabaseService;
> let id: string;
> let revision: number;
> const command = (transitionId: string, expectedRevision: number, input = {}) => ({ transitionId, expectedRevision, input, commandId: randomUUID() });
> function post(payload: object, actor = 'adjuster-1') {
>   return request(app.getHttpServer()).post(`/api/claims/${id}/transitions`).set('X-Demo-Actor-Id', actor).send(payload);
> }
> async function step(transition: string, input = {}, actor = 'adjuster-1') {
>   const discovery = await request(app.getHttpServer()).get(`/api/claims/${id}/available-transitions`).set('X-Demo-Actor-Id', actor).expect(200);
>   expect(discovery.body.transitions).toContainEqual(expect.objectContaining({ id: transition, eligible: true }));
>   const payload = command(transition, revision, input);
>   const result = await post(payload, actor).expect(200);
>   revision = result.body.claim.revision;
>   expect((await post(payload, actor).expect(200)).body).toEqual(result.body);
>   return result.body;
> }
> beforeEach(async () => {
>   vi.stubEnv('NODE_ENV', 'development'); vi.stubEnv('DEMO_IDENTITY_ENABLED', 'true');
>   const module = await Test.createTestingModule({ imports: [ClaimsModule] }).overrideProvider(DATABASE_PATH).useValue(':memory:').compile();
>   db = module.get(DatabaseService); app = module.createNestApplication(); await app.init();
>   const result = await request(app.getHttpServer()).post('/api/claims').set('X-Demo-Actor-Id', 'claimant-1').send({ title: 'Lifecycle', description: 'Real API scenario' }).expect(201);
>   id = result.body.id; revision = 0;
>   expect(result.body.workflowVersion).toBe(2);
> });
> afterEach(async () => { await app?.close(); vi.unstubAllEnvs(); });
> it.each(['approval', 'rejection', 'information'])('completes %s lifecycle through discovery and immutable history', async path => {
>   await step('submit', {}, 'claimant-1');
>   expect((await post(command('approve', revision)).expect(409)).body.error.code).toBe('STATE_CONFLICT');
>   await step('verify_documents'); await step('start_assessment');
>   if (path === 'information') {
>     await step('request_information', { message: 'More information' });
>     await step('provide_information', { response: 'Details' }, 'claimant-1');
>     await step('verify_documents').catch(() => { throw new Error('Information response already verifies documents; start assessment next.'); });
>   }
>   if (path === 'rejection') {
>     await step('reject', { reason: 'Not covered' }); await step('close_rejected');
>   } else {
>     await step('approve');
>     await post(command('initiate_payment', revision), 'claimant-1').expect(403);
>     await step('initiate_payment'); await step('close_paid');
>   }
>   const actions = await request(app.getHttpServer()).get(`/api/claims/${id}/available-transitions`).set('X-Demo-Actor-Id', 'adjuster-1').expect(200);
>   expect(actions.body.state).toBe('closed'); expect(actions.body.transitions).toEqual([]);
>   const audit = await request(app.getHttpServer()).get(`/api/claims/${id}/audit`).set('X-Demo-Actor-Id', 'claimant-1').expect(200);
>   expect(audit.body.items).toHaveLength(revision);
>   expect(db.connection.prepare('SELECT count(*) n FROM command_receipts').get()).toEqual({ n: revision });
>   expect(db.connection.prepare('SELECT count(*) n FROM payment_initiations').get()).toEqual({ n: path === 'rejection' ? 0 : 1 });
>   await post(command('approve', revision)).expect(409);
> });
> EOF
> python3 - <<'PY'
> from pathlib import Path
> p=Path('backend/test/lifecycle.e2e-spec.ts');s=p.read_text().replace("await step('verify_documents').catch(() => { throw new Error('Information response already verifies documents; start assessment next.'); });","await step('start_assessment');");p.write_text(s)
> PY
> export PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH
> npm test --prefix backend > /tmp/cwo-task11-unit.log 2>&1
>  tail -45 /tmp/cwo-task11-unit.log``
> - Ran ````cat >> frontend/src/components/TransitionActions.test.tsx <<'EOF'
>
> it.each([
>   ["initiate_payment", "Initiate payment (local record only)", "approved", "payment_initiated"],
>   ["close_paid", "Close claim", "payment_initiated", "closed"],
>   ["close_rejected", "Close rejected claim", "rejected", "closed"],
> ])("executes discovered lifecycle action %s without a frontend transition registry", async (id, label, from, to) => {
>   const transition = vi.spyOn(api, "transition").mockResolvedValue({ claim: { ...claim, state: to }, auditEventId: "event", notificationIds: [] });
>   render(<TransitionActions actor="adjuster-1" discovery={{ ...discovery, state: from, transitions: [{ ...action, id, label, from, to, inputFields: [], eligible: true, reasonCode: null }] }} refreshing={false} onSuccess={vi.fn()} onLock={vi.fn()} />);
>   fireEvent.click(screen.getByRole("button", { name: "Choose action" }));
>   fireEvent.submit(screen.getByRole("form", { name: `${label} form` }));
>   await waitFor(() => expect(transition).toHaveBeenCalledWith("adjuster-1", discovery.claimId, expect.objectContaining({ transitionId: id, expectedRevision: discovery.revision, input: {} })));
> });
> EOF
> python3 - <<'PY'
> from pathlib import Path
> p=Path('docs/demo-scenarios.md');s=p.read_text();s=s[:s.index('## 1. Approval happy path')]+'''## Workflow versions and local payment records
>
> New claims use immutable workflow version 2. Version 1 remains unchanged; existing
> claims retain their pinned definition, including its terminal approval/rejection.
> Use fresh claims for these scenarios. IDs use lowercase snake_case, corresponding
> to the challenge's uppercase state names. Draft creation precedes SUBMITTED.
> Migration 005 adds only an immutable local payment-initiation record linked to its
> success audit event. No money is transferred and no payment provider is called.
>
> The UI discovers all actions and input forms from the API. Select the owner for
> Submit/Provide information and the adjuster for all other transitions. Confirm
> one action at a time; state, revision, cycle count, actions and audit refresh.
>
> ## 1. Approval, payment initiation and closure
>
> For a fresh claim:
>
> ```sh
> transition_demo_claim claimant-1 submit 0 '{}'
> transition_demo_claim adjuster-1 verify_documents 1 '{}'
> transition_demo_claim adjuster-1 start_assessment 2 '{}'
> transition_demo_claim adjuster-1 approve 3 '{}'
> transition_demo_claim adjuster-1 initiate_payment 4 '{}'
> transition_demo_claim adjuster-1 close_paid 5 '{}'
> ```
>
> All return 200. Audit destinations are submitted, documents_verified,
> under_assessment, approved, payment_initiated, closed. Final revision 6, count 0,
> six events, one approval notification and one local payment record. CLOSED has
> no discovered outgoing actions. The payment record is persisted server-side;
> notificationIds contains notification IDs only.
>
> ## 2. Role and ownership denial
>
> For a fresh draft:
>
> ```sh
> transition_demo_claim adjuster-1 submit 0 '{}'
> curl -sS -i "$CWO_API_BASE_URL/api/claims/$CWO_CLAIM_ID" -H 'X-Demo-Actor-Id: claimant-2'
> ```
>
> Expect 403 TRANSITION_FORBIDDEN and 404 CLAIM_NOT_FOUND. Claim remains revision 0.
> On an approved claim, claimant-1 attempting initiate_payment also receives 403;
> only adjusters can initiate payment or close a claim. The UI disables actions
> based on discovery; the backend independently enforces access.
>
> ## 3. Information loop, lifetime limit and completion
>
> For a fresh claim:
>
> ```sh
> transition_demo_claim claimant-1 submit 0 '{}'
> transition_demo_claim adjuster-1 verify_documents 1 '{}'
> transition_demo_claim adjuster-1 start_assessment 2 '{}'
> transition_demo_claim adjuster-1 request_information 3 '{"message":"Receipt?"}'
> transition_demo_claim claimant-1 provide_information 4 '{"response":"Receipt supplied."}'
> transition_demo_claim adjuster-1 start_assessment 5 '{}'
> transition_demo_claim adjuster-1 request_information 6 '{"message":"More details?"}'
> transition_demo_claim claimant-1 provide_information 7 '{"response":"Details supplied."}'
> transition_demo_claim adjuster-1 start_assessment 8 '{}'
> transition_demo_claim adjuster-1 request_information 9 '{"message":"Final clarification?"}'
> transition_demo_claim claimant-1 provide_information 10 '{"response":"Clarification supplied."}'
> transition_demo_claim adjuster-1 start_assessment 11 '{}'
> transition_demo_claim adjuster-1 request_information 12 '{"message":"Fourth request must fail."}'
> transition_demo_claim adjuster-1 approve 12 '{}'
> transition_demo_claim adjuster-1 initiate_payment 13 '{}'
> transition_demo_claim adjuster-1 close_paid 14 '{}'
> ```
>
> Only the fourth request fails: 422 CYCLE_LIMIT_REACHED, without changing revision,
> audit, receipts or side effects. Each response goes to documents_verified and
> requires another start_assessment. Final state closed, revision 15, lifetime
> count 3. A single loop followed by approval follows the same sequence with the
> two additional loops omitted (closed revision 9).
>
> ## 4. Invalid direct approval, required reason and rejection closure
>
> For a fresh claim:
>
> ```sh
> transition_demo_claim claimant-1 submit 0 '{}'
> transition_demo_claim adjuster-1 approve 1 '{}'
> transition_demo_claim adjuster-1 verify_documents 1 '{}'
> transition_demo_claim adjuster-1 start_assessment 2 '{}'
> transition_demo_claim adjuster-1 reject 3 '{}'
> transition_demo_claim adjuster-1 reject 3 '{"reason":"Not covered in this demo."}'
> transition_demo_claim adjuster-1 close_rejected 4 '{}'
> ```
>
> Direct SUBMITTED → APPROVED returns 409 STATE_CONFLICT. Missing rejection reason
> returns 400 INVALID_REQUEST. Other commands return 200. Final closed/revision 5,
> one rejection notification and no payment-initiation record or event.
>
> ## 5. Idempotent payment/closure retry and stale revision
>
> On a fresh claim perform scenario 1 through approve (revision 4), then:
>
> ```sh
> export CWO_PAYMENT_ID="$(node -p 'crypto.randomUUID()')"
> transition_demo_claim adjuster-1 initiate_payment 4 '{}' "$CWO_PAYMENT_ID"
> transition_demo_claim adjuster-1 initiate_payment 4 '{}' "$CWO_PAYMENT_ID"
> export CWO_CLOSE_ID="$(node -p 'crypto.randomUUID()')"
> transition_demo_claim adjuster-1 close_paid 5 '{}' "$CWO_CLOSE_ID"
> transition_demo_claim adjuster-1 close_paid 5 '{}' "$CWO_CLOSE_ID"
> transition_demo_claim adjuster-1 initiate_payment 4 '{}' "$CWO_PAYMENT_ID"
> transition_demo_claim adjuster-1 initiate_payment 6 '{}' "$CWO_PAYMENT_ID"
> transition_demo_claim adjuster-1 close_paid 5 '{}'
> transition_demo_claim adjuster-1 approve 6 '{}'
> curl -sS -i "$CWO_API_BASE_URL/api/claims/$CWO_CLAIM_ID/audit" -H 'X-Demo-Actor-Id: claimant-1'
> ```
>
> Exact retries return their original result (even the payment retry after closure),
> with identical audit IDs and no duplicate local records. Changed payload with the
> same payment ID returns 409 COMMAND_ID_REUSED; a new ID at stale revision returns
> 409 REVISION_CONFLICT; approval from closed returns 409 STATE_CONFLICT. Final
> revision 6, six audit events/receipts and one payment record.
>
> For UI stale revision testing, open a claim in two tabs and act in one before
> confirming the other's old form. Refresh after REVISION_CONFLICT. For uncertain
> network outcomes, keep the page open and use Retry same command after restoring
> connectivity. The UI preserves ID, input and expected revision and locks actor/
> navigation while unresolved. Retry context is in memory; reload discards it.
>
> ## Verification
>
> ```sh
> # frontend/
> npm test
> npm run build
> npm run lint
> npm run typecheck
> # backend/
> npm test
> npm run test:e2e
> npm run build
> npm run lint
> npx tsc -p tsconfig.json --noEmit --incremental false
> ```
> ''';p.write_text(s)
> p=Path('backend/config/README.md');p.write_text(p.read_text()+'''\nVersion 2 (`claims.v2.json`) is the startup configuration for new claims. Version 1\nremains immutable for existing pins. Version 2 adds document verification,\nassessment, pending information, payment initiation and terminal closure.\n`recordPaymentInitiation` writes an immutable local record in the transition's\ntransaction; it never calls a payment provider. It has no configurable arguments.\nOnly the existing notification effect requires a claimant recipient.\n''')
> p=Path('backend/src/claims/transition-eligibility.ts');s=p.read_text().replace("if (transition.sideEffects.length && claim.ownerActorId === null)","if (transition.sideEffects.some(effect => effect.type === 'createNotification') && claim.ownerActorId === null)");p.write_text(s)
> PY````
> - Ran `python3 - <<'PY'
> from pathlib import Path
> p=Path('backend/src/workflow/workflow-config.service.ts');s=p.read_text().replace('export const DEFAULT_WORKFLOW_PATH = new URL(','export const LEGACY_WORKFLOW_PATH = new URL(').replace("export const CURRENT_WORKFLOW_PATH = new URL('../../config/claims.v2.json', import.meta.url);","export const DEFAULT_WORKFLOW_PATH = new URL('../../config/claims.v2.json', import.meta.url);").replace('= CURRENT_WORKFLOW_PATH','= DEFAULT_WORKFLOW_PATH').replace('ensure backend/config/claims.v1.json exists','ensure backend/config/claims.v2.json exists');p.write_text(s)
> for filename in ['backend/src/workflow/workflow-config.spec.ts','backend/src/database/database.spec.ts','backend/src/database/migration-history.spec.ts']:
>  p=Path(filename);s=p.read_text().replace('loadWorkflowDefinition()',"loadWorkflowDefinition(new URL('../../config/claims.v1.json', import.meta.url))")
>  if filename.endswith('workflow-config.spec.ts'): s=s.replace('  DEFAULT_WORKFLOW_PATH,','  LEGACY_WORKFLOW_PATH as DEFAULT_WORKFLOW_PATH,')
>  if filename.endswith('database.spec.ts'): s=s.replace("{ name: 'notifications' },","{ name: 'notifications' },\n      { name: 'payment_initiations' },")
>  p.write_text(s)
> p=Path('backend/src/claims/lifecycle.spec.ts');s=p.read_text().replace('DEFAULT_WORKFLOW_PATH','LEGACY_WORKFLOW_PATH');p.write_text(s)
> p=Path('backend/src/database/migration-history.spec.ts');s=p.read_text();s += '''\n
> it('adds payment records to a populated 001–004 database without changing existing rows', () => {
>   const before = snapshot();
>   const oldLedger = db.prepare('SELECT * FROM schema_migrations ORDER BY id').all();
>   runMigrations(db);
>   expect(snapshot().slice(1)).toEqual(before.slice(1));
>   expect(db.prepare('SELECT * FROM schema_migrations ORDER BY id').all().slice(0, 4)).toEqual(oldLedger);
>   expect(db.prepare('SELECT * FROM payment_initiations').all()).toEqual([]);
>   expect(db.pragma('foreign_key_check')).toEqual([]);
>   const upgraded = snapshot();
>   runMigrations(db);
>   expect(snapshot()).toEqual(upgraded);
> });
> ''';p.write_text(s)
> PY
> export PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH
> ./backend/node_modules/.bin/prettier --write backend/src/workflow/workflow-config.service.ts backend/src/workflow/workflow.types.ts backend/src/claims/lifecycle.spec.ts backend/src/claims/transition.service.ts backend/src/claims/transition-eligibility.ts backend/src/claims/*.spec.ts backend/src/database/*.spec.ts backend/test/*.e2e-spec.ts backend/config/workflow.schema.json backend/config/claims.v2.json frontend/src/components/TransitionActions.test.tsx > /tmp/cwo-task11-format.log
> npm test --prefix backend && npm run build --prefix backend && npm run lint --prefix backend && ./backend/node_modules/.bin/tsc -p backend/tsconfig.json --noEmit --incremental false`
> - Ran `export PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH
> npm test && npm run build && npm run lint && npm run typecheck`
> - Ran `export PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH
> npm run test:e2e`
> - Ran `git diff --stat; rg -n 'claims.v1|under_review|approved.*terminal|six|004|four migrations' backend/README.md backend/config/README.md frontend/README.md README.md; cat frontend/src/components/TransitionActions.tsx | tail -70`
>
> </details>
>
> The new lifecycle tests pass through the API and action-discovery endpoints. Payment initiation creates one local record in the same transaction as the state change, audit event and receipt. Exact retries return the original result, including after closure.
>
> So far, 215 backend unit tests, 113 E2E tests and 32 frontend tests pass. Builds, lint and TypeScript checks also pass. I’m checking the final diff and database preservation now.
>
> <details><summary>Ran 3 commands</summary>
>
> - Ran `git diff -- backend/test/claim-workflow-read.e2e-spec.ts backend/src/database/database.spec.ts backend/src/workflow/workflow-config.service.ts; head -45 backend/config/README.md; rg -n 'toBe\(4\)|count: 4|MIGRATIONS.map' backend`
> - Ran ``python3 - <<'PY'
> from pathlib import Path
> p=Path('backend/config/README.md');s=p.read_text().replace('`claims.v1.json` is the startup definition','`claims.v2.json` is the startup definition').replace('- The only effect is createNotification, recipient claimant, and template\n  information_requested, claim_approved, or claim_rejected. These identifiers\n  describe future backend-owned handlers; no handler executes in this task.','- Effects are createNotification (recipient claimant; template\n  information_requested, claim_approved, or claim_rejected) and\n  recordPaymentInitiation (no arguments). Both use backend-owned local handlers.');p.write_text(s)
> p=Path('backend/README.md');p.write_text(p.read_text()+'''\n## Complete lifecycle (workflow version 2)\n\nNew claims use `config/claims.v2.json`: draft → submitted → documents_verified →\nunder_assessment → approved → payment_initiated → closed. Rejection closes via\nrejected → closed. Information responses return pending_info → documents_verified,\nthen require assessment again. Only closed is terminal in version 2.\n\nExisting claims stay pinned to their original immutable version; version 1 is\nretained without rewriting claims, receipts or audit history. Migration 005 adds\n`payment_initiations` (event_id primary/foreign key, unique claim_id foreign key,\ncreated_at) with update/delete rejection triggers. The record is a local workflow\nside effect, atomically committed with state/revision, audit and command receipt.\nIt does not represent a transfer of money. `notificationIds` still contains only\nnotification IDs; the payment event is visible through the existing audit API.\nNo new HTTP routes or production identity mechanisms are introduced.\n\nSee [the five updated scenarios](../docs/demo-scenarios.md) for command IDs, roles,\nrevisions, information-request limits and exact retries.\n''')
> p=Path('backend/test/claim-workflow-read.e2e-spec.ts');s=p.read_text();start=s.index('    app.get(WorkflowRegistryService).register({');end=s.index("    const result = await read('available-transitions')",start);import subprocess
> old=subprocess.check_output(['git','show',':backend/test/claim-workflow-read.e2e-spec.ts'],text=True);a=old.index('    app\n      .get(WorkflowRegistryService)');b=old.index("    const result = await read('available-transitions')",a);s=s[:start]+old[a:b]+s[end:];p.write_text(s)
> p=Path('backend/src/claims/lifecycle.spec.ts');s=p.read_text().replace("['payment_initiations', 'command_receipts']","['transition_events', 'payment_initiations', 'command_receipts']");s += '''\n
> it('rolls back closure when receipt persistence fails', () => {
>   assessment(); execute('approve'); execute('initiate_payment');
>   db.connection.exec("CREATE TRIGGER fail_closure BEFORE INSERT ON command_receipts BEGIN SELECT RAISE(ABORT, 'injected'); END");
>   const before = snapshot();
>   expect(() => execute('close_paid')).toThrow(expect.objectContaining({ code: 'TRANSITION_STORAGE_FAILED' }));
>   expect(snapshot()).toEqual(before);
> });
> ''';p.write_text(s)
> PY
> export PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH
> ./backend/node_modules/.bin/prettier --write backend/src/claims/lifecycle.spec.ts
> npm test --prefix backend && npm run build --prefix backend && npm run lint --prefix backend && ./backend/node_modules/.bin/tsc -p backend/tsconfig.json --noEmit --incremental false``
> - Ran `python3 - <<'PY'
> from pathlib import Path
> import json,hashlib,sqlite3,re
> baseline=json.loads(Path('/tmp/cwo-task11-baseline.json').read_text())
> old=bytes.fromhex(baseline['backend/src/database/migrations.ts']).decode(); new=Path('backend/src/database/migrations.ts').read_text()
> # Compare the entire original migration definition prefix, byte for byte.
> prefix=old[:old.index('\n]);')]; assert new.startswith(prefix)
> assert Path('backend/config/claims.v1.json').read_bytes()==bytes.fromhex(baseline['backend/config/claims.v1.json'])
> print('Migrations 001–004 SQL unchanged byte for byte; version 1 configuration unchanged')
> p=Path.cwd()/'backend/data/claims.sqlite'; c=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True)
> before=json.loads(Path('/tmp/cwo-task11-data.json').read_text()); after={t:hashlib.sha256(repr(c.execute('select * from '+t+' order by rowid').fetchall()).encode()).hexdigest() for t in before};assert before==after
> print('Existing database: all original table rows and migration ledger unchanged')
> print('Existing database migration IDs:',[r[0] for r in c.execute('select id from schema_migrations order by id')]);c.close()
> Path('backend/tsconfig.build.tsbuildinfo').write_bytes(bytes.fromhex(baseline['backend/tsconfig.build.tsbuildinfo']))
> # Confirm the production UI still excludes the development action machinery.
> js='\n'.join(p.read_text() for p in Path('frontend/dist').rglob('*.js'))
> assert all(x not in js for x in ['claimant-1','X-Demo-Actor-Id','Retry same command']);print('Production bundle demo identity exclusion checked')
> PY
> git diff --check
> git status --short`
>
> </details>
</details>

Implemented the complete lifecycle in [claims.v2.json](./backend/config/claims.v2.json).

New claims follow:

- Happy path: `submitted → documents_verified → under_assessment → approved → payment_initiated → closed`
- Rejection: `under_assessment → rejected → closed`
- Information loop: `under_assessment → pending_info → documents_verified → under_assessment`

`closed` is terminal. Adjusters execute payment initiation and closure; existing ownership, input validation, cycle limits, concurrency and idempotency protections remain enforced.

Files changed include:

- Workflow configuration, loader, schema and types for version 2.
- Transition execution and eligibility for the new `recordPaymentInitiation` side effect.
- [migrations.ts](./backend/src/database/migrations.ts): appended migration **005**, adding immutable local payment records.
- Backend lifecycle, migration compatibility and regression tests; frontend tests proving discovered payment/closure actions work without hardcoding.
- Backend/config documentation and [five demo scenarios](./docs/demo-scenarios.md).

Payment initiation records **no transfer of money**. Its local record commits atomically with state, revision, audit and command receipt. Duplicate retries create no additional records.

Actual validation results:

| Check | Result |
|---|---|
| Backend `npm test` | **217 passed** |
| Backend `npm run test:e2e` | **113 passed** |
| Frontend `npm test` | **32 passed** |
| Both builds and lint commands | Passed |
| Backend TypeScript and frontend typecheck | Passed |
| `git diff --check` | Passed |

All three lifecycle scenarios executed through HTTP E2E tests. Browser interaction and manual curl scenarios were not rerun. The existing non-blocking Observe warning appeared during E2E.

Migrations **001–004** and version 1 configuration were verified unchanged byte for byte. Existing database records and migration history remained unchanged; migration 005 ran only against isolated test databases and will apply on application startup. Existing claims remain pinned to version 1. No commit or push was created.

> # Task: Rebuild Backend Setup and Run Documentation
>
> Review and rewrite the backend setup documentation for the Claims Workflow Orchestrator project from scratch.
>
> ## 1. Inspect the existing project first
>
> Before writing documentation, inspect:
>
> - `backend/package.json` and all available scripts.
> - Backend entry points and NestJS configuration.
> - Environment variable loading and validation.
> - SQLite database configuration and the existing database path.
> - Migration execution and migration drift protection.
> - Demo identity authentication and role-based access control.
> - API routes and the actual backend startup process.
> - Existing README files and backend documentation.
>
> Use the actual source code as the source of truth. Do not invent commands, environment variables, endpoints, or expected responses.
>
> ## 2. Rewrite the documentation
>
> Update the existing backend setup guide in the appropriate location, preferably `backend/README.md` if that fits the repository structure.
>
> Write the guide in clear Vietnamese and cover:
>
> 1. **Prerequisites** — required Node.js version, package manager, and dependencies.
> 2. **Install dependencies** — exact commands from the correct directory.
> 3. **Environment configuration** — explain every required variable, its purpose, and safe local development values.
> 4. **Database setup** — identify the actual SQLite database path, explain how migrations run, and provide a safe way to verify database readiness.
> 5. **Start the backend** — provide the exact command supported by `package.json`.
> 6. **Verify the server** — use a real existing endpoint and show the expected HTTP status and response shape.
> 7. **Demo identity** — explain the supported actor IDs and how to pass the required headers for claimant and adjuster requests.
> 8. **Test API requests** — include copy-paste-ready `curl` examples for listing claims, creating a claim, viewing claim details, viewing available transitions, and viewing the audit trail, using valid request payloads based on the actual API implementation.
> 9. **Troubleshooting** — cover port conflicts, missing environment variables, database path errors, migration drift, unauthorized requests, invalid payloads, and common startup failures.
> 10. **Stop the server** — explain how to stop the local development process safely.
>
> ## 3. Important safety constraints
>
> - Do not delete, reset, recreate, or overwrite the existing SQLite database.
> - Do not modify existing database migrations just to make startup succeed.
> - Do not disable migration drift protection.
> - Do not weaken authentication, role checks, claim ownership checks, or production security.
> - Demo identity must remain development-only and fail closed in production.
> - Do not introduce new dependencies or change application behavior just to write documentation.
> - Clearly distinguish commands that initialize a new database from commands that run the application against an existing database.
> - If any step cannot be verified from the source code, explicitly mark it as requiring verification instead of guessing.
>
> ## 4. Validate every instruction
>
> After writing the guide:
>
> - Check every command against the actual project scripts and source code.
> - Verify the working directory for every command.
> - Confirm all referenced files and endpoints exist.
> - Run safe, non-destructive checks where possible.
> - Do not start destructive database operations.
> - Do not claim a command was tested if it was not executed.
> - If local execution is unavailable, state which steps still need manual verification.
>
> ## 5. Deliverables
>
> - Rewrite the existing guide rather than creating duplicate documentation unnecessarily.
> - Summarize the files changed.
> - Provide the exact commands I should run in Terminal, in order.
> - Explain what successful output should look like at each step.
> - Identify any remaining blockers separately from documentation issues.
>
> Keep the scope focused on making the backend straightforward to install, start, and verify. Do not refactor unrelated code or add new features.

<details><summary>8 previous messages</summary>

> Tôi sẽ đối chiếu mã nguồn và các lệnh hiện có, rồi viết lại `backend/README.md` bằng tiếng Việt. Các bước kiểm tra sẽ không ghi vào cơ sở dữ liệu hiện có.
>
> <details><summary>Ran 3 commands</summary>
>
> - Ran `cat backend/package.json backend/src/main.ts backend/src/app.controller.ts backend/src/app.service.ts backend/nest-cli.json backend/src/app.module.ts backend/src/database/database.service.ts backend/src/claims/claims.controller.ts backend/src/claims/claims-http.ts; rg -n 'process.env|dotenv|ConfigModule|engines' backend/src backend/package.json frontend/README.md; cat backend/src/claims/claim.types.ts | head -140; head -50 backend/README.md; cat backend/.gitignore; node --version; npm --version`
> - Ran `node -e 'for (const n of ["@nestjs/core","@nestjs/cli","better-sqlite3","vitest","typescript"]) {let p=require("./backend/node_modules/"+n+"/package.json");console.log(n,p.version,JSON.stringify(p.engines))}'
> cat backend/src/claims/claim-workflow-read.types.ts backend/src/workflow/workflow-config.service.ts backend/src/database/database.module.ts; cat backend/src/claims/claim-access.ts | head -65; cat README.md; head -65 frontend/README.md; git status --short | tail -18; ls -l backend/data/claims.sqlite backend/dist/main.js; cat backend/src/database/migrations.ts | tail -85`
> - Ran `node - <<'JS'
> const lock=require('./backend/package-lock.json');const counts={};for(const [name,p] of Object.entries(lock.packages)){const n=p.engines?.node;if(n && (n.includes('22.22')||n.includes('22.12')||n.includes('22.19')))counts[name]=n;}console.log(counts)
> JS
> cat backend/src/claims/claim-access.ts | tail -42; cat backend/tsconfig.build.json; rg -n '^##|^###' backend/README.md; git status --porcelain > /tmp/cwo-docs-status-before.txt
> python3 - <<'PY'
> from pathlib import Path
> import sqlite3,hashlib,json
> p=Path.cwd()/'backend/data/claims.sqlite';c=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True);d={r[0]:hashlib.sha256(repr(c.execute('select * from "'+r[0]+'" order by rowid').fetchall()).encode()).hexdigest() for r in c.execute("select name from sqlite_master where type='table'").fetchall()};Path('/tmp/cwo-docs-db-before.json').write_text(json.dumps(d));print('Existing database ledger:',c.execute('select id from schema_migrations order by id').fetchall());c.close()
> Path('/tmp/cwo-docs-buildinfo').write_bytes(Path('backend/tsconfig.build.tsbuildinfo').read_bytes())
> PY`
>
> </details>
>
> Backend không tự đọc `.env`; các biến phải được truyền từ Terminal. Tệp SQLite hiện có là `backend/data/claims.sqlite` và đang ghi nhận migrations 001–004; lần khởi động tiếp theo trên tệp này sẽ áp dụng migration 005.
>
> Tôi sẽ hướng dẫn riêng hai cách: tạo database demo mới và dùng database hiện có. Phần kiểm tra chạy thật sẽ dùng database tạm. Tôi cũng xác nhận `GET /` trả `Hello World!`, còn các route `/api/claims` cần demo identity hợp lệ.
>
> <details><summary>Ran 6 commands</summary>
>
> - Ran ````cat > backend/README.md <<'EOF'
> # Cài đặt và chạy backend Claims Workflow Orchestrator
>
> Backend sử dụng NestJS, TypeScript, SQLite (`better-sqlite3`) và cấu hình workflow
> JSON. Hướng dẫn dưới đây dành cho Terminal dùng zsh/bash trên macOS/Linux.
> Bắt đầu từ thư mục gốc repository; không cần cài Nest CLI hoặc SQLite server toàn cục.
>
> ## 1. Điều kiện cần
>
> - Dùng Node.js **22.22.3 trở lên trong nhánh 22.x**, kèm npm. Đây là mức đáp ứng
>   yêu cầu của các công cụ trong `package-lock.json` hiện tại; không dùng Node 16/18.
>   `backend/package.json` chưa khai báo `engines` riêng.
> - Có `curl` để kiểm tra HTTP. Các ví dụ phân tích JSON dùng chính Node.js.
> - Có quyền đọc/ghi thư mục database và tạo các tệp SQLite WAL/SHM bên cạnh nó.
> - Kết nối mạng cho lần cài dependency đầu tiên. `better-sqlite3` là native module;
>   nếu không có binary phù hợp, quá trình cài có thể cần Python và bộ công cụ C/C++
>   của hệ điều hành. Không cần cài thêm package vào dự án để làm theo hướng dẫn.
>
> Từ thư mục gốc repository:
>
> ```sh
> cd backend
> node --version
> npm --version
> npm ci
> ```
>
> Mong đợi: phiên bản Node/npm được in ra; `npm ci` kết thúc với exit code 0 và cài
> đúng lockfile. Lệnh này thay thế `node_modules`, không khởi tạo database. Không đổi
> runtime Node giữa lúc cài native module và lúc chạy backend.
>
> ## 2. Biến môi trường
>
> Ứng dụng đọc trực tiếp `process.env`; không có `dotenv`/`ConfigModule` để tự nạp
> `.env`. Chỉ tạo một tệp `.env` sẽ không cấu hình backend. Dùng `export` trong chính
> Terminal chạy server; biến ở Terminal khác không tự truyền sang.
>
> | Biến | Ý nghĩa và giá trị local |
> | --- | --- |
> | `PORT` | Cổng HTTP, mặc định `3000` khi không đặt. Ví dụ dùng `3109`; chọn cổng số hợp lệ, chưa bị chiếm. Code chưa validate biến này. |
> | `NODE_ENV` | Phải là chính xác `development` để dùng demo identity. Trong `test`, nếu không chỉ định database, mặc định là `:memory:`. Không có giá trị mặc định do ứng dụng tự gán. |
> | `DEMO_IDENTITY_ENABLED` | Phải là chính xác chuỗi `true`, đồng thời `NODE_ENV=development`, mới mở claim API demo. Thiếu/sai giá trị sẽ bị từ chối. |
> | `SQLITE_DATABASE_PATH` | Đường dẫn SQLite. Không bắt buộc; mặc định là `backend/data/claims.sqlite`, tính theo vị trí module, cả khi chạy source và `dist`. Giá trị rỗng/toàn khoảng trắng bị từ chối. Nên dùng đường dẫn tuyệt đối. Đường dẫn tương đối phụ thuộc working directory. |
>
> Không cần API key hay thông tin payment provider. Module Observe hiện có credential
> placeholder trong source, không có biến môi trường Observe do ứng dụng định nghĩa.
> `API_PROXY_TARGET` thuộc Vite frontend, không phải cấu hình backend.
>
> Demo không phải authentication production: biết actor ID là có thể chọn danh tính
> đó khi demo bật. Chỉ chạy trong môi trường local tin cậy. `app.listen` không chỉ
> định bind host; không coi URL `127.0.0.1` bên dưới là cấu hình giới hạn lắng nghe.
> Production luôn từ chối demo identity, kể cả đặt `DEMO_IDENTITY_ENABLED=true`.
> Chưa có authentication adapter production.
>
> ## 3. Chọn database trước khi chạy
>
> Chỉ chọn **một** phương án trong Terminal A, đang ở `backend/`.
>
> ### A. Tạo database demo mới, tách khỏi dữ liệu hiện có
>
> ```sh
> export CWO_DEMO_DIR="$(mktemp -d "${TMPDIR:-/tmp}/claims-demo.XXXXXX")"
> export SQLITE_DATABASE_PATH="$CWO_DEMO_DIR/claims.sqlite"
> printf 'Database demo: %s\n' "$SQLITE_DATABASE_PATH"
> ```
>
> `mktemp` chỉ tạo thư mục mới. SQLite chưa tồn tại; backend sẽ tạo tệp và áp dụng
> migrations khi khởi động ở bước 4. Giữ lại đường dẫn đã in để kiểm tra hoặc dùng
> lại dữ liệu demo. Chạy lại `mktemp` sẽ chọn một database mới khác, không xóa tệp cũ.
>
> ### B. Chạy với database hiện có
>
> Đối với database mặc định của checkout này:
>
> ```sh
> export SQLITE_DATABASE_PATH="$PWD/data/claims.sqlite"
> test -f "$SQLITE_DATABASE_PATH" && printf 'Đã tìm thấy: %s\n' "$SQLITE_DATABASE_PATH"
> ```
>
> Chỉ tiếp tục nếu kiểm tra thành công. Nếu ứng dụng trước đây dùng đường dẫn khác,
> đặt `SQLITE_DATABASE_PATH` thành đường dẫn tuyệt đối của **tệp đó** và kiểm tra lại;
> không giả định tệp mặc định là database đang dùng của một process khác.
> Một đường dẫn sai nhưng ghi được có thể khiến backend tạo database mới ngoài ý muốn.
>
> Khởi động trên tệp hiện có có thể ghi migrations còn thiếu và đăng ký workflow
> version mới. Đây không phải thao tác chỉ đọc. Trước khi nâng cấp dữ liệu quan trọng,
> dừng process sử dụng database và tạo bản backup SQLite nhất quán theo quy trình
> của bạn; không chỉ sao chép riêng tệp chính khi WAL vẫn đang hoạt động.
>
> ### Migrations và workflow versions
>
> `DatabaseService` tự chạy migration trong quá trình khởi động, trước khi HTTP server
> sẵn sàng. Không có script `migrate`, `seed` hoặc `reset` riêng trong `package.json`.
>
> - Migrations nằm trong `src/database/migrations.ts`: `001_workflow_versions`,
>   `002_claims`, `003_claim_ownership`, `004_workflow_transitions`,
>   `005_payment_initiations`.
> - Lịch sử nằm ở `schema_migrations`. Runner đối chiếu ID/thứ tự và SHA-256 của SQL
>   đã áp dụng; sai lệch dừng startup với `MIGRATION_DRIFT`.
> - Các migration còn thiếu được áp dụng trong một transaction. Lỗi sẽ rollback
>   phần migration đang chờ, không ghi đè checksum cũ.
> - Kết nối bật foreign keys, WAL, `synchronous=FULL`, timeout 5 giây.
> - `config/claims.v2.json` và `config/workflow.schema.json` được nạp/validate lúc
>   startup. Registry lưu version bất biến; claim cũ giữ nguyên version đã pin.
>   Không sửa nội dung version đã đăng ký để thay đổi claim cũ.
> - Migration 005 chỉ thêm bảng local payment initiation. Không có chuyển tiền thật.
>
> Không xóa database, sửa ledger/checksum, đổi migration 001–004 hay tắt kiểm tra
> drift để làm startup thành công. Không chạy `DatabaseService` chỉ để “xem” database:
> constructor của nó có thể áp dụng migrations.
>
> ## 4. Khởi động backend — Terminal A
>
> Sau khi chọn database, vẫn ở `backend/`:
>
> ```sh
> export PORT=3109
> export NODE_ENV=development
> export DEMO_IDENTITY_ENABLED=true
> npm run start:dev
> ```
>
> Script thực tế là `nest start --watch`: biên dịch, chạy `src/main.ts`, theo dõi thay
> đổi mã nguồn. Không cần chạy `npm run build` trước lệnh này. Mong đợi biên dịch
> không lỗi, log Nest đăng ký routes và server bắt đầu lắng nghe. Giữ Terminal này mở;
> kiểm tra HTTP bên dưới mới xác nhận server đang phục vụ request.
>
> Các lựa chọn khác, cũng chạy từ `backend/`:
>
> ```sh
> # Chạy không watch; dùng môi trường đã export trong Terminal này
> npm start
>
> # Hoặc build rồi chạy output, thay cho hai cách trên
> npm run build
> NODE_ENV=production DEMO_IDENTITY_ENABLED=false npm run start:prod
> ```
>
> Không chạy đồng thời các lựa chọn trên cùng một cổng/database để thử setup.
> `start:prod` là `node dist/main`; cần build trước. Khi đóng gói, giữ `config/`
> bên cạnh `dist/`; Nest build không chép JSON workflow vào `dist`. Production có thể
> trả `GET /`, nhưng claim routes trả 403 vì chưa có authentication production.
>
> ## 5. Kiểm tra server và database — Terminal B
>
> Mở Terminal mới, vào `backend/` từ thư mục gốc repository:
>
> ```sh
> cd backend
> export CWO_API_BASE_URL=http://127.0.0.1:3109
> curl -i "$CWO_API_BASE_URL/"
> ```
>
> Mong đợi HTTP **200**, body là văn bản `Hello World!` (không phải JSON).
> Route này không yêu cầu identity. Không có endpoint `/health` hoặc `/api/health`.
> Vì app khởi tạo database và registry trước khi listen, response này cho biết quá
> trình startup đã hoàn tất; nó không phải kiểm tra tính toàn vẹn database liên tục.
>
> ### Kiểm tra SQLite chỉ đọc (tùy chọn)
>
> Trong Terminal B, đặt biến thành **đúng đường dẫn đã in/chọn ở Terminal A**:
>
> ```sh
> export SQLITE_DATABASE_PATH='/duong/dan/tuyet/doi/claims.sqlite'
> node --input-type=module <<'JS'
> import Database from 'better-sqlite3';
> import { existsSync } from 'node:fs';
> const path = process.env.SQLITE_DATABASE_PATH;
> if (!path || !existsSync(path)) throw new Error('Cần đường dẫn database đã tồn tại');
> const db = new Database(path, { readonly: true, fileMustExist: true });
> try {
>   db.pragma('query_only = ON');
>   console.log('quick_check:', db.pragma('quick_check', { simple: true }));
>   console.log('foreign_key_check:', db.pragma('foreign_key_check'));
>   console.log('migrations:', db.prepare('SELECT id FROM schema_migrations ORDER BY id').all());
> } finally {
>   db.close();
> }
> JS
> ```
>
> Thay đường dẫn mẫu trước khi chạy. Mong đợi `quick_check: ok`,
> `foreign_key_check: []`, danh sách 001–005 sau startup thành công trên code hiện tại.
> Lệnh không chạy migration, không in nội dung claim. Database cũ chưa được nâng cấp
> có thể chỉ có 001–004; không tự sửa lịch sử để ép danh sách khớp.
>
> ## 6. Demo identity và quyền truy cập
>
> Mọi route `/api/claims` đều cần header `X-Demo-Actor-Id` thuộc allowlist backend:
>
> | Actor ID | Role | Quyền |
> | --- | --- | --- |
> | `claimant-1` | `claimant` | Tạo claim, xem claim của mình, thực hiện transition cho claimant. |
> | `claimant-2` | `claimant` | Giống trên, nhưng sở hữu tập claim riêng. |
> | `adjuster-1` | `adjuster` | Xem mọi claim; thực hiện transition cho adjuster, không được tạo claim. |
>
> Không truyền `role`, `actorId`, `ownerActorId` hoặc state trong body tạo claim.
> Backend tự xác định role và owner. Claim khác owner hoặc không tồn tại cùng trả
> 404 `CLAIM_NOT_FOUND`. Legacy claim không có owner không hiển thị cho claimant.
>
> ## 7. Thử API bằng curl — Terminal B
>
> Các lệnh dưới đây dùng `CWO_API_BASE_URL` ở bước 5, với server demo đang bật.
> Chỉ lệnh tạo claim ghi dữ liệu; nên thực hiện trên database demo mới.
>
> ### Liệt kê claim của claimant-1
>
> ```sh
> curl -i "$CWO_API_BASE_URL/api/claims?limit=10&offset=0" \
>   -H 'X-Demo-Actor-Id: claimant-1'
> ```
>
> HTTP **200**, JSON `{ "items": [...], "limit": 10, "offset": 0 }`.
> Với database mới, `items` là `[]`. Adjuster dùng cùng lệnh với header
> `X-Demo-Actor-Id: adjuster-1` để xem tất cả claim.
> Phân trang mặc định limit 50/offset 0; limit hợp lệ 1–100, offset nguyên không âm.
>
> ### Tạo claim và lưu ID thật
>
> ```sh
> CWO_CREATE_JSON="$(curl --fail-with-body -sS "$CWO_API_BASE_URL/api/claims" \
>   -H 'Content-Type: application/json' \
>   -H 'X-Demo-Actor-Id: claimant-1' \
>   --data '{"title":"Hu hong man hinh","description":"Man hinh bi hong khi van chuyen."}')"
> printf '%s\n' "$CWO_CREATE_JSON"
> export CWO_CLAIM_ID="$(printf '%s' "$CWO_CREATE_JSON" | node --input-type=module -e '
> let text = "";
> for await (const chunk of process.stdin) text += chunk;
> const claim = JSON.parse(text);
> if (typeof claim.id !== "string") throw new Error("Không nhận được claim ID; kiểm tra lỗi API");
> console.log(claim.id);
> ')"
> printf 'Claim ID: %s\n' "$CWO_CLAIM_ID"
> ```
>
> HTTP **201**; ví dụ JSON có các trường (ID và thời gian do server sinh):
>
> ```json
> {
>   "id": "<UUID thực tế>",
>   "ownerActorId": "claimant-1",
>   "workflowId": "claims",
>   "workflowVersion": 2,
>   "state": "draft",
>   "title": "Hu hong man hinh",
>   "description": "Man hinh bi hong khi van chuyen.",
>   "revision": 0,
>   "informationRequestCount": 0,
>   "createdAt": "<UTC ISO timestamp>",
>   "updatedAt": "<UTC ISO timestamp>"
> }
> ```
>
> Lệnh tạo không in HTTP headers để giữ body là JSON cho bước lấy ID. Nếu gặp lỗi,
> dừng và kiểm tra response trước khi dùng ID. Không tự động retry tạo claim vì
> endpoint tạo chưa có command deduplication. `title`/`description` phải là chuỗi
> không rỗng, tối đa lần lượt 120/2000 ký tự; không chấp nhận trường thừa.
> `--fail-with-body` cần curl hỗ trợ option này; kiểm tra `curl --version` nếu báo lỗi.
>
> ### Xem chi tiết, action được phép và audit
>
> ```sh
> curl -i "$CWO_API_BASE_URL/api/claims/$CWO_CLAIM_ID" \
>   -H 'X-Demo-Actor-Id: claimant-1'
>
> curl -i "$CWO_API_BASE_URL/api/claims/$CWO_CLAIM_ID/available-transitions" \
>   -H 'X-Demo-Actor-Id: claimant-1'
>
> curl -i "$CWO_API_BASE_URL/api/claims/$CWO_CLAIM_ID/audit?limit=10&offset=0" \
>   -H 'X-Demo-Actor-Id: claimant-1'
> ```
>
> Cả ba trả HTTP **200**:
>
> - Detail trả claim object như response tạo ở trên.
> - Available transitions trả `claimId`, `workflowId`, `workflowVersion`, `state`,
>   `revision`, `informationRequestCount`, `informationRequestLimit`, `transitions`.
>   Claim draft mới có action `submit`; mỗi action có `id`, `label`, `from`, `to`,
>   `eligible`, `reasonCode`, `inputFields`. Eligibility vẫn được kiểm tra lại khi execute.
> - Audit trả `claimId`, `workflowId`, `workflowVersion`, `items`, `limit`, `offset`.
>   Claim mới có `items: []`. Event thành công có actor, transition, state trước/sau,
>   revision trước/sau và thời gian. Không có endpoint sửa/xóa audit.
>
> Detail và available-transitions không chấp nhận query parameters. Audit chỉ nhận
> `limit`/`offset`. Nếu muốn thử chuyển trạng thái, xem
> [năm kịch bản đầy đủ](../docs/demo-scenarios.md), gồm command UUID, expectedRevision,
> input bắt buộc, replay và lifecycle tới closed. Không tự suy ra revision mới để
> resubmit một command đang có kết quả chưa chắc chắn.
>
> ## 8. Xử lý lỗi thường gặp
>
> Lỗi nghiệp vụ có dạng `{ "error": { "code": "...", "message": "..." } }`.
> Thông báo lỗi startup xuất hiện trong Terminal A.
>
> | Triệu chứng | Kiểm tra và xử lý |
> | --- | --- |
> | `EADDRINUSE` | Cổng đã bị process khác dùng. Dừng đúng server của bạn hoặc chọn `PORT` khác rồi cập nhật `CWO_API_BASE_URL` và frontend proxy. Không kill process lạ. |
> | Curl không kết nối được | Kiểm tra Terminal A đã startup xong, đúng cổng và chưa dừng. `GET /` phải trả 200 trước khi thử claim API. |
> | 403 `DEMO_IDENTITY_DISABLED` | Cần đồng thời `NODE_ENV=development` và `DEMO_IDENTITY_ENABLED=true` trong Terminal chạy backend; restart sau khi đổi env. Không bỏ guard; production phải tiếp tục từ chối. |
> | 401 `IDENTITY_REQUIRED` | Thiếu/sai header actor. Chỉ dùng ba ID trong bảng allowlist, không gửi role tùy ý. |
> | 403 `CLAIM_CREATION_FORBIDDEN` / `TRANSITION_FORBIDDEN` | Dùng actor đúng role. Adjuster không tạo claim; owner claimant không được approve/payment/close. |
> | 404 `CLAIM_NOT_FOUND` | Kiểm tra UUID thật, đúng database và đúng owner. Không bỏ ownership check để tìm claim khác. |
> | 400 `INVALID_REQUEST` | Kiểm tra JSON, Content-Type, tên trường/độ dài, query pagination. Body tạo chỉ nhận title và description. JSON sai cú pháp có thể bị framework từ chối trước handler. |
> | 409 `REVISION_CONFLICT` / `STATE_CONFLICT` | Đọc lại claim/actions và đánh giá hành động. Không tự thay expectedRevision của command cũ. |
> | 409 `COMMAND_ID_REUSED` | Một command ID đã dùng cho request/actor khác. Retry cùng command phải giữ nguyên payload và actor. |
> | 422 `CYCLE_LIMIT_REACHED` | Đã dùng hết ba lần yêu cầu thông tin trong suốt đời claim; không reset counter. |
> | `DATABASE_INITIALIZATION_FAILED` | Kiểm tra SQLITE_DATABASE_PATH không rỗng, thư mục ghi được, path trỏ tới file chứ không phải thư mục; WAL cần quyền ghi cạnh file. Không sửa quyền quá rộng hoặc xóa database. |
> | `MIGRATION_DRIFT` | Dừng. Xác minh đúng database, đối chiếu ID/checksum trong schema_migrations với migration của checkout. Khôi phục đúng migration gốc từ lịch sử đáng tin cậy; nếu không tìm được, giữ nguyên dữ liệu và báo lỗi để xử lý. Không sửa checksum hay reset ledger. |
> | `MIGRATION_FAILED` | Đọc lỗi, kiểm tra quyền/khóa/database và bộ migration đúng version. Transaction migration đang chờ đã rollback. Không sửa migration đã áp dụng để thử vượt lỗi. |
> | `Workflow configuration invalid` | Kiểm tra config/claims.v2.json và config/workflow.schema.json tồn tại, đọc được và hợp lệ; không tắt validator. |
> | `WORKFLOW_VERSION_CONFLICT` | Nội dung khác nhưng dùng lại ID/version đã đăng ký. Khôi phục cấu hình đúng hoặc phát hành version mới; giữ pin của claim cũ. |
> | `SQLITE_BUSY` / 503 `STORAGE_BUSY` | Một writer khác giữ khóa. Chờ writer hoàn tất; với transition, retry đúng command ID/payload cũ. Không xóa WAL/SHM hay database. |
> | Lỗi load native better-sqlite3 / ABI / thiếu binary | Xác nhận Node phù hợp lockfile, cài lại dependency bằng npm ci với cùng runtime. Khi cần build native, cài toolchain hệ điều hành. Không thay lockfile tùy tiện. |
> | `EBADENGINE` khi cài | Kiểm tra node --version và yêu cầu engine từ lockfile. Môi trường Node 22.15.1 từng chạy được nhưng thấp hơn yêu cầu một số công cụ; ưu tiên 22.22.3+ trong nhánh 22.x. |
> | Không tìm thấy dist/main | Chạy npm run build trước start:prod và giữ config/ ở đúng vị trí. |
> | Observe worker báo lỗi telemetry | Scaffold còn credential placeholder. Kiểm tra HTTP và log startup thực tế; cảnh báo telemetry riêng lẻ chưa chứng minh API thất bại. Không tắt kiểm tra ứng dụng để che lỗi. |
>
> ## 9. Kiểm tra tự động và các scripts
>
> Từ `backend/`, với dependencies đã cài:
>
> ```sh
> npm test
> npm run test:e2e
> npm run build
> npm run lint
> ./node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false
> ```
>
> Mong đợi exit code 0. Tests dùng memory/database tạm qua cấu hình test; không đặt
> SQLITE_DATABASE_PATH thành database dữ liệu thật để chạy thử công cụ khác.
> E2E cần quyền mở socket local. Build tạo `dist` và có thể cập nhật compiler cache.
>
> | Scripts còn lại | Công dụng |
> | --- | --- |
> | `npm run start:debug` | Nest watch kèm debugger; chỉ dùng local. |
> | `npm run test:watch` | Chạy Vitest watch. |
> | `npm run test:cov` | Vitest kèm coverage. |
> | `npm run test:debug` | Vitest inspector, không chạy file song song. |
> | `npm run format` | Prettier **ghi lại** source/tests; không cần để setup. |
> | `npm run deploy` | `nest deploy`; không thuộc quy trình chạy local, chưa xác minh cấu hình/quyền triển khai. |
>
> ## 10. Dừng server
>
> Trong Terminal A, nhấn **Ctrl+C**, chờ process thoát và prompt xuất hiện. Không chỉ
> đóng tab khi cần chắc chắn server đã dừng. Backend bật Nest shutdown hooks;
> DatabaseService đóng kết nối khi module bị hủy. Nếu watch còn process con, kiểm
> tra process của đúng phiên chạy trước khi thao tác; không kill theo tên hàng loạt.
> Giữ nguyên database và các tệp đi kèm. Chạy lại với cùng đường dẫn sẽ giữ dữ liệu;
> chọn database mới bằng phương án A nếu cần một demo độc lập.
> EOF
> export PORT=3109 NODE_ENV=development DEMO_IDENTITY_ENABLED=true
> export CWO_DEMO_DIR="$(mktemp -d "${TMPDIR:-/tmp}/claims-docs.XXXXXX")"
> export SQLITE_DATABASE_PATH="$CWO_DEMO_DIR/claims.sqlite"
> printf '%s' "$SQLITE_DATABASE_PATH" > /tmp/cwo-docs-test-path
> npm run start:dev````
> - Ran `export PORT=3109 NODE_ENV=development DEMO_IDENTITY_ENABLED=true
> export SQLITE_DATABASE_PATH="$(cat /tmp/cwo-docs-test-path)"
> npm run start:dev`
> - Ran `export PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH
> export PORT=3109 NODE_ENV=development DEMO_IDENTITY_ENABLED=true
> export SQLITE_DATABASE_PATH="$(cat /tmp/cwo-docs-test-path)"
> node --version
> npm run start:dev`
> - Ran ````python3 - <<'PY'
> import re,pathlib
> text=pathlib.Path('backend/README.md').read_text();blocks=re.findall(r'```sh\n(.*?)```',text,re.S);chosen=[]
> for b in blocks:
>  if 'export CWO_API_BASE_URL' in b: chosen.append(b.replace('cd backend\n',''))
>  elif 'quick_check' in b: chosen.append(b.replace("'/duong/dan/tuyet/doi/claims.sqlite'", "\"$(cat /tmp/cwo-docs-test-path)\""))
>  elif b.startswith('curl -i') or b.startswith('CWO_CREATE_JSON='): chosen.append(b)
> pathlib.Path('/tmp/cwo-docs-api-check.sh').write_text('set -e\nexport PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH\n'+'\n'.join(chosen))
> PY
> zsh -n /tmp/cwo-docs-api-check.sh
> zsh /tmp/cwo-docs-api-check.sh````
> - Ran ````python3 - <<'PY'
> import re,pathlib
> text=pathlib.Path('README.md').read_text();blocks=re.findall(r'```sh\n(.*?)```',text,re.S);chosen=[]
> for b in blocks:
>  if 'export CWO_API_BASE_URL' in b: chosen.append(b.replace('cd backend\n',''))
>  elif 'quick_check' in b: chosen.append(b.replace("'/duong/dan/tuyet/doi/claims.sqlite'", "\"$(cat /tmp/cwo-docs-test-path)\""))
>  elif b.startswith('curl -i') or b.startswith('CWO_CREATE_JSON='): chosen.append(b)
> pathlib.Path('/tmp/cwo-docs-api-check.sh').write_text('set -e\nexport PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH\n'+'\n'.join(chosen))
> PY
> zsh -n /tmp/cwo-docs-api-check.sh
> zsh /tmp/cwo-docs-api-check.sh````
> - Ran `lsof -nP -iTCP:3109 -sTCP:LISTEN; cat /tmp/cwo-docs-test-path; python3 - <<'PY'
> import sqlite3,pathlib,json,hashlib
> p=pathlib.Path.cwd()/'backend/data/claims.sqlite';c=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True);b=json.loads(pathlib.Path('/tmp/cwo-docs-db-before.json').read_text());print('Default database unchanged:',all(hashlib.sha256(repr(c.execute('select * from "'+t+'" order by rowid').fetchall()).encode()).hexdigest()==h for t,h in b.items()));c.close()
> PY`
>
> </details>
>
> Tôi đã gặp xung đột cổng 3109 và mắc lỗi khi gửi ví dụ tạo claim trước khi xác nhận server mới đã bind thành công. Request đó tới server đang chạy sẵn và tạo một claim demo (`954fbde8-01fd-4bcd-9f56-75c5fe043cb8`). Xin lỗi vì thao tác ngoài dự kiến này; tôi sẽ giữ nguyên bản ghi, không tự xóa hay sửa dữ liệu.
>
> Database mặc định vẫn được xác nhận không thay đổi. Tôi sẽ kiểm tra lại trên cổng riêng và bổ sung bước xác nhận server vào hướng dẫn.
>
> <details><summary>Ran 7 commands</summary>
>
> - Ran `lsof -p 17168 -Fn | rg 'sqlite|cwd'; lsof -nP -iTCP:31879 -sTCP:LISTEN`
> - Ran `export PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH
> export PORT=31879 NODE_ENV=development DEMO_IDENTITY_ENABLED=true
> export SQLITE_DATABASE_PATH="$(cat /tmp/cwo-docs-test-path)"
> npm run start:dev`
> - Ran `python3 - <<'PY'
> from pathlib import Path
> p=Path('backend/README.md');s=p.read_text().replace('export PORT=3109\nexport NODE_ENV',"# Trên macOS/Linux có lsof: nếu thấy process LISTEN, chọn cổng khác trước khi chạy.\nlsof -nP -iTCP:3109 -sTCP:LISTEN\nexport PORT=3109\nexport NODE_ENV");s=s.replace('kiểm tra HTTP bên dưới mới xác nhận server đang phục vụ request.','kiểm tra HTTP bên dưới mới xác nhận server đang phục vụ request.\nNếu có EADDRINUSE, dừng bước kiểm tra HTTP và không gửi POST: một server khác có\nthể đang trả lời ở cổng đó. Chọn cổng khác, khởi động lại và cập nhật URL ở Terminal B.');s += '''\n## 11. Phạm vi xác minh hướng dẫn\n\nĐã đối chiếu scripts, biến môi trường, schema, routes và response với source hiện\ntại. Đã chạy start:dev và các ví dụ HTTP/kiểm tra SQLite trên database tạm riêng,\nvới Node 22.15.1/npm 10.9.2 có sẵn. Node này thấp hơn yêu cầu một số công cụ trong\nlockfile; cài mới bằng Node 22.22.3+ cần xác minh trên máy sử dụng. Không chạy lại\nnpm ci, deploy, coverage/debug, hoặc khởi động production trong lần sửa tài liệu\nnày. Các lệnh đó được đối chiếu với package.json; không coi là đã thử thực tế.\n''';p.write_text(s)
> PY`
> - Ran `lsof -nP -iTCP:31879 -sTCP:LISTEN`
> - Ran `lsof -p 83293 -Fn | rg 'claims.sqlite$'
> python3 - <<'PY'
> from pathlib import Path
> p=Path('/tmp/cwo-docs-api-check.sh');s=p.read_text().replace('127.0.0.1:3109','127.0.0.1:31879');p.write_text(s)
> PY
> zsh /tmp/cwo-docs-api-check.sh > /tmp/cwo-docs-api-results.txt 2>&1
> python3 - <<'PY'
> from pathlib import Path
> import re
> s=Path('/tmp/cwo-docs-api-results.txt').read_text();print('HTTP checks:',re.findall(r'HTTP/1.1 [^\n]+',s));print('New database list empty:', '"items":[],"limit":10,"offset":0' in s);print('SQLite:', 'quick_check: ok' in s, 'foreign_key_check: []' in s);assert 'Hello World!' in s;assert 'quick_check: ok' in s;assert '"items":[],"limit":10,"offset":0' in s;assert len(re.findall('HTTP/1.1 200 OK',s))==5
> PY
> curl -sS -o /tmp/cwo-docs-auth-response -w 'Missing identity status: %{http_code}\n' http://127.0.0.1:31879/api/claims
> curl -sS -o /tmp/cwo-docs-adjuster-response -w 'Adjuster list status: %{http_code}\n' http://127.0.0.1:31879/api/claims -H 'X-Demo-Actor-Id: adjuster-1'`
> - Ran `curl -sS -o /tmp/cwo-docs-create-verified.json -w 'Create status: %{http_code}\n' http://127.0.0.1:31879/api/claims -H 'Content-Type: application/json' -H 'X-Demo-Actor-Id: claimant-1' --data '{"title":"Hu hong man hinh","description":"Man hinh bi hong khi van chuyen."}'
> curl -sS -o /tmp/cwo-docs-invalid.json -w 'Invalid payload status: %{http_code}\n' http://127.0.0.1:31879/api/claims -H 'Content-Type: application/json' -H 'X-Demo-Actor-Id: claimant-1' --data '{"title":"","description":"Invalid"}'`
> - Ran ````python3 - <<'PY'
> from pathlib import Path
> import sqlite3,hashlib,json,re,subprocess
> p=Path.cwd()/'backend/data/claims.sqlite';c=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True);b=json.loads(Path('/tmp/cwo-docs-db-before.json').read_text());assert all(hashlib.sha256(repr(c.execute('select * from "'+t+'" order by rowid').fetchall()).encode()).hexdigest()==h for t,h in b.items());c.close();print('Default database unchanged (all table contents including migration history)')
> Path('backend/tsconfig.build.tsbuildinfo').write_bytes(Path('/tmp/cwo-docs-buildinfo').read_bytes())
> before=set(Path('/tmp/cwo-docs-status-before.txt').read_text().splitlines());after=set(subprocess.check_output(['git','status','--porcelain'],text=True).splitlines());print('Status changes:',before^after)
> s=Path('backend/README.md').read_text()
> for target in re.findall(r'\]\(([^)]+)\)',s):assert (Path('backend')/target).exists(),target
> blocks=re.findall(r'```sh\n(.*?)```',s,re.S)
> for i,block in enumerate(blocks):
>  p=Path('/tmp')/f'cwo-docs-shell-{i}.sh';p.write_text(block);subprocess.run(['zsh','-n',str(p)],check=True)
> print('All shell examples parse; local Markdown links exist')
> PY
> git diff --check
> git diff --numstat -- backend/README.md
> git status --short | tail -12````
>
> </details>
>
> Các ví dụ trong README đã chạy thành công trên cổng riêng 31879: đọc API trả 200, tạo claim trả 201, thiếu identity trả 401, payload sai trả 400. SQLite tạm báo `quick_check: ok`, không có lỗi foreign key và đủ migrations 001–005.
>
> Chỉ `backend/README.md` thay đổi. Database mặc định vẫn nguyên vẹn; server có sẵn ở cổng 3109 dùng một database demo tạm khác, nơi còn giữ claim được tạo nhầm đã báo ở trên. Tôi chưa chạy lại `npm ci`; môi trường hiện có dùng Node 22.15.1, thấp hơn yêu cầu của một số công cụ trong lockfile.
>
> <details><summary>Ran a command</summary>
>
> - Ran `lsof -nP -iTCP:31879 -sTCP:LISTEN; git diff --check; git status --short`
>
> </details>
</details>

Đã viết lại [backend/README.md](./backend/README.md) bằng tiếng Việt. Chỉ tệp này thay đổi; không sửa code, dependency hoặc migration.

Sau khi chọn Node **22.22.3+ thuộc nhánh 22.x**, chạy Terminal A:

```sh
cd /Users/tranngochung/Folders/claims-workflow-orchestrator/backend
node --version
npm --version
npm ci

export CWO_DEMO_DIR="$(mktemp -d "${TMPDIR:-/tmp}/claims-demo.XXXXXX")"
export SQLITE_DATABASE_PATH="$CWO_DEMO_DIR/claims.sqlite"
export PORT=31879
export NODE_ENV=development
export DEMO_IDENTITY_ENABLED=true
npm run start:dev
```

`npm ci` cần kết thúc thành công; Nest cần biên dịch không lỗi và không báo xung đột cổng. Các lệnh trên tạo **database demo mới**, không dùng database mặc định.

Terminal B:

```sh
curl -i http://127.0.0.1:31879/

curl -i 'http://127.0.0.1:31879/api/claims?limit=10&offset=0' \
  -H 'X-Demo-Actor-Id: claimant-1'
```

Mong đợi: **200 `Hello World!`**, sau đó **200** với `items: []`. README có đầy đủ lệnh tạo claim, lấy ID thật, xem detail/actions/audit và kiểm tra SQLite chỉ đọc. Dừng bằng **Ctrl+C** tại Terminal A.

Đã kiểm tra thực tế trên database tạm: startup, HTTP **200/201/400/401**, SQLite integrity, migrations 001–005 và cú pháp các ví dụ shell. `git diff --check` đạt. Chưa chạy lại `npm ci` hoặc xác minh cài mới bằng Node khuyến nghị; runtime thử nghiệm hiện có là 22.15.1.

**Sự cố cần lưu ý:** lần kiểm tra đầu gửi nhầm tới server có sẵn cổng 3109, tạo thêm claim `954fbde8-01fd-4bcd-9f56-75c5fe043cb8` trong database demo của server đó. Tôi không xóa bản ghi. Database mặc định `backend/data/claims.sqlite` và lịch sử migration được xác nhận không thay đổi.

> # Task: Make Backend Setup Documentation Actually Work on Windows
>
> The current backend setup documentation is not sufficient: following it on Windows does not result in a working backend.
>
> Your job is to fix the documentation based on the actual repository and verify the instructions. Do not merely rewrite the wording or provide theoretical advice.
>
> ## 1. Reproduce and identify the failure
>
> Inspect the entire backend setup process, including:
>
> - `backend/package.json` and its scripts
> - Node.js and package manager requirements
> - Environment variable loading
> - SQLite database paths and directory creation
> - Database migrations and migration drift protection
> - NestJS startup and port configuration
> - Demo identity configuration and API authentication
> - Any shell commands or scripts that assume macOS/Linux
>
> Identify why the documented instructions fail on Windows. Fix the actual cause where appropriate, not just the documentation.
>
> ## 2. Windows must be a first-class supported environment
>
> Provide copy-paste-ready instructions for Windows 10/11 using PowerShell.
>
> The user must not need Git Bash, WSL, macOS Terminal, or Linux commands.
>
> Ensure the instructions work with the project's actual scripts and dependencies. In particular:
>
> - Do not use `export VAR=value`, `$PWD`-based Unix examples, `lsof`, `grep`, or Unix-only environment-variable syntax in PowerShell instructions.
> - Use PowerShell-compatible environment-variable syntax and commands to inspect ports and processes.
> - Use Windows-compatible path handling.
> - Check whether package scripts rely on shell-specific syntax or environment-variable tools that do not work on Windows.
> - If a script is not cross-platform, fix it using the smallest appropriate change without altering application behavior.
> - State the exact directory from which every command must be executed.
>
> ## 3. Write a complete setup guide
>
> Update the existing documentation instead of creating duplicate guides unnecessarily.
>
> Include these sections:
>
> 1. Prerequisites and exact required versions.
> 2. How to clone the repository and enter the backend directory.
> 3. How to install dependencies with the correct package manager.
> 4. How to configure environment variables in PowerShell.
> 5. How to configure and verify the SQLite database safely.
> 6. The exact command to start the backend.
> 7. How to confirm the server is running.
> 8. Copy-paste-ready API requests using PowerShell-compatible commands.
> 9. How to use the supported demo claimant and adjuster identities.
> 10. How to run backend tests.
> 11. How to stop the server.
> 12. Troubleshooting with concrete fixes for the actual errors that may occur.
>
> Explain which commands belong in Terminal 1 and which belong in Terminal 2.
>
> For every major step, include:
>
> - The exact command.
> - The expected successful output or HTTP status.
> - What to do if the output differs.
>
> ## 4. Database and security safeguards
>
> - Never delete, reset, recreate, or overwrite an existing database.
> - Never modify applied migrations to bypass migration drift protection.
> - Do not weaken authentication, RBAC, claim ownership, or production safeguards.
> - Keep demo identity disabled or unavailable in production.
> - If a fresh database is required for a new installation, document the supported initialization process separately and make sure it cannot overwrite an existing database.
> - Never commit real secrets or local environment files.
>
> ## 5. Verify the guide before finishing
>
> Do not claim the guide works merely because it looks correct.
>
> - Check all commands against the actual source code and scripts.
> - Run all safe checks available in the current environment.
> - If Windows is available, follow the documented process in a clean Windows PowerShell session.
> - If Windows is not available, explicitly state that Windows execution has not been verified; do not claim it passed.
> - If a command fails, fix the underlying issue and rerun the relevant checks.
> - Do not fabricate successful outputs or test results.
>
> ## 6. Deliverables
>
> Report:
>
> - The root cause of the original Windows setup failure.
> - Every file changed and why.
> - The exact PowerShell commands to follow from a fresh checkout until the backend responds successfully.
> - Verification results, clearly distinguishing executed tests from unverified Windows-specific steps.
> - Any remaining blockers.
>
> Keep the changes focused on making the documented setup reproducible on Windows. Do not add unrelated features or refactor unrelated modules.

<details><summary>6 previous messages</summary>

> Tôi sẽ kiểm tra lại scripts và quy trình startup để tìm các điểm phụ thuộc Unix, rồi cập nhật README với lệnh PowerShell. Tôi cũng sẽ kiểm tra môi trường hiện tại có thể chạy PowerShell hay Windows hay không và phân biệt rõ phần đã chạy với phần chưa xác minh.
>
> <details><summary>Ran a command</summary>
>
> - Ran `cat backend/package.json; cat backend/src/main.ts backend/src/database/database.service.ts; head -32 backend/README.md; git remote -v; command -v pwsh; command -v powershell; node --version; rg --files -g AGENTS.md; cat backend/tsconfig.json; git status --short; cat backend/vitest.config.e2e.ts`
>
> </details>
>
> Các lệnh chính trong `package.json` không dùng cú pháp đặt biến kiểu Unix. Điểm không tương thích rõ ràng nằm ở hướng dẫn: `export`, `mktemp`, `lsof`, heredoc và `curl` có thể là alias trong PowerShell 5.1. Backend cũng không tự nạp `.env`, nên thiếu hai biến demo sẽ khiến claim API trả 403 dù server đã chạy.
>
> Máy hiện tại không có Windows hoặc PowerShell. Tôi sẽ dùng cú pháp tương thích PowerShell 5.1/7, kiểm tra backend trên hệ điều hành hiện có và ghi rõ phần Windows chưa được chạy thực tế.
>
> <details><summary>Ran 5 commands</summary>
>
> - Ran `cat backend/src/claims/claims-http.ts | head -63; cat backend/src/workflow/workflow-config.service.ts | head -24; cat backend/src/claims/claim.types.ts | head -25; rg -n 'id:|migrationChecksum|MIGRATION_DRIFT' backend/src/database/migrations.ts; node - <<'JS'
> const lock=require('./backend/package-lock.json'); for(const name of ['@angular-devkit/core','better-sqlite3','@nestjs/cli','vitest']) {const p=lock.packages['node_modules/'+name]; console.log(name,p.version,p.engines)}
> JS
> python3 - <<'PY'
> from pathlib import Path
> import hashlib,json,sqlite3
> paths=['backend/README.md','backend/package.json','backend/package-lock.json','backend/src/database/migrations.ts','backend/tsconfig.build.tsbuildinfo']
> Path('/tmp/cwo-windows-docs-baseline.json').write_text(json.dumps({p:Path(p).read_bytes().hex() for p in paths}))
> p=Path.cwd()/'backend/data/claims.sqlite';c=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True)
> Path('/tmp/cwo-windows-docs-db.json').write_text(json.dumps({r[0]:hashlib.sha256(repr(c.execute('select * from "'+r[0]+'" order by rowid').fetchall()).encode()).hexdigest() for r in c.execute("select name from sqlite_master where type='table'").fetchall()}));c.close()
> PY`
> - Ran ````cat > backend/README.md <<'EOF'
> # Backend: cài đặt và chạy trên Windows 10/11 (PowerShell)
>
> Dùng **Windows PowerShell 5.1 hoặc PowerShell 7** trong Windows Terminal; không cần
> Git Bash, WSL, Nest CLI toàn cục hay SQLite server. Mọi lệnh bên dưới là PowerShell.
> Terminal 1 chạy backend; Terminal 2 gửi HTTP requests. Không chạy cả hai phiên
> backend cùng cổng. Backend là NestJS/TypeScript, dùng SQLite và workflow JSON.
>
> ## 1. Vì sao hướng dẫn cũ không chạy trên Windows?
>
> Hướng dẫn cũ dùng cú pháp zsh/bash: export, mktemp, lsof, heredoc và cách đặt biến
> trước một command. PowerShell không thực hiện các bước đó tương đương. Trong
> Windows PowerShell 5.1, tên curl còn có thể trỏ tới Invoke-WebRequest nên flags
> của curl không dùng được. Hướng dẫn này dùng cmdlet HTTP của PowerShell trực tiếp.
>
> Backend **không tự nạp .env**: chỉ đọc process.env. Hai biến demo không được truyền
> vào process sẽ khiến claim routes trả 403, dù GET / vẫn hoạt động. Không có lỗi
> Windows cụ thể/stack trace được cung cấp; đây là các điểm không tương thích đã xác
> nhận từ hướng dẫn và source, không phải kết quả tái hiện trên Windows.
>
> Các scripts npm hiện tại không dùng cú pháp đặt biến riêng của Unix; không cần
> cross-env hay dependency mới. Đường dẫn SQLite được xử lý bằng node:path và
> fileURLToPath, không hardcode dấu phân cách Unix.
>
> ## 2. Điều kiện và phiên bản
>
> - Chọn **Node.js 22.22.3, Windows x64**, cho quy trình này. Các bản mới hơn trong
>   nhánh 22.x cũng đáp ứng engine hiện tại. Node 22.15.1 thấp hơn yêu cầu của một số
>   công cụ trong lockfile; không dùng Node 16/18. Máy ARM64 cần kiểm chứng riêng khả
>   năng cài native binding; quy trình Windows chưa được chạy trong lần viết này.
> - Dùng **npm đi kèm Node**; lockfileVersion là 3. Engine npm chặt nhất được đối chiếu
>   ở toolchain hiện tại chấp nhận >=8.0.0; dự án không pin một bản npm chính xác và
>   không khai báo engines trong package.json. Không chuyển sang Yarn/pnpm để setup.
> - Git for Windows để clone. Dự án không pin phiên bản Git; lệnh git phải chạy được.
> - PowerShell 5.1 hoặc 7; có mạng để cài dependency và quyền ghi thư mục database.
> - better-sqlite3 là native module. Nếu không tải được binary cho runtime/kiến trúc,
>   cần Python và Visual Studio Build Tools có workload C++ để build; xem xử lý lỗi.
>
> Mở **Terminal 1**, PowerShell thường, không cần quyền Administrator:
>
> ```powershell
> $ErrorActionPreference = 'Stop'
> $PSVersionTable.PSVersion
> node --version
> npm.cmd --version
> git --version
> ```
>
> Mong đợi: PowerShell >=5.1, Node v22.22.3 (hoặc bản 22.x mới hơn), npm/Git in được
> phiên bản. Nếu không tìm thấy lệnh, cài công cụ, mở lại Terminal rồi kiểm tra PATH:
>
> ```powershell
> Get-Command node, npm.cmd, git
> where.exe node
> ```
>
> Không tiếp tục với Node cũ. Dùng npm.cmd tránh lỗi execution policy chặn npm.ps1;
> không cần đổi policy toàn máy hoặc chạy PowerShell bằng quyền admin.
>
> ## 3. Clone và cài dependency — Terminal 1
>
> Từ thư mục người dùng Windows, clone repository thật được khai báo trong Git remote:
>
> ```powershell
> Set-Location $env:USERPROFILE
> git clone https://github.com/tranngochung13/claims-workflow-orchestrator.git
> if ($LASTEXITCODE -ne 0) { throw 'Clone failed; check URL, network and repository access.' }
> Set-Location (Join-Path $env:USERPROFILE 'claims-workflow-orchestrator\backend')
> npm.cmd ci
> if ($LASTEXITCODE -ne 0) { throw 'Dependency install failed; fix the error before starting.' }
> ```
>
> Mong đợi: clone thành công, working directory kết thúc bằng backend, npm ci exit 0.
> Nếu repository đã tồn tại, không xóa/clone đè: dùng Set-Location tới thư mục backend
> của checkout đó rồi chạy npm.cmd ci. URL/quyền clone cần xác minh trên máy của bạn;
> lần sửa tài liệu này không clone lại hoặc truy cập GitHub.
>
> npm ci dùng package-lock.json và thay node_modules, không tạo database. Không copy
> node_modules từ macOS/Linux hoặc từ Node khác sang Windows. Cài và chạy bằng cùng
> runtime Node; không sửa lockfile để che lỗi cài đặt.
>
> ## 4. Chọn database an toàn — Terminal 1, tại backend
>
> Chỉ chọn **A hoặc B**. Các biến PowerShell thông thường và biến $env: chỉ thuộc
> Terminal hiện tại; Terminal 2 không tự có chúng.
>
> ### A. Cài mới/demo: dùng đường dẫn mới, không chạm database cũ
>
> ```powershell
> $demoDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ('claims-demo-' + [guid]::NewGuid().ToString('N'))
> New-Item -ItemType Directory -Path $demoDirectory -ErrorAction Stop | Out-Null
> $env:SQLITE_DATABASE_PATH = Join-Path $demoDirectory 'claims.sqlite'
> if (Test-Path -LiteralPath $env:SQLITE_DATABASE_PATH) { throw 'Refusing to initialize an existing path.' }
> Write-Output "New demo database: $env:SQLITE_DATABASE_PATH"
> ```
>
> Mong đợi: in đường dẫn tuyệt đối mới, chưa có claims.sqlite. Không dùng -Force.
> SQLite được tạo **khi backend khởi động**, không phải ở lệnh New-Item.
> Giữ lại đường dẫn để dùng lại dữ liệu; thư mục temp có thể bị hệ điều hành dọn về
> sau, không dùng làm nơi lưu dữ liệu quan trọng lâu dài.
>
> ### B. Dùng database hiện có, không khởi tạo lại
>
> Nếu dùng database mặc định của checkout, tại backend:
>
> ```powershell
> $existingDatabase = Join-Path (Get-Location).Path 'data\claims.sqlite'
> if (-not (Test-Path -LiteralPath $existingDatabase -PathType Leaf)) { throw 'Existing database not found; verify its actual location.' }
> $env:SQLITE_DATABASE_PATH = (Resolve-Path -LiteralPath $existingDatabase).Path
> Write-Output "Existing database: $env:SQLITE_DATABASE_PATH"
> ```
>
> Nếu trước đó dùng database ở chỗ khác, thay giá trị $existingDatabase bằng đường dẫn
> thật trước khi kiểm tra. Không chọn đường dẫn không tồn tại để “khôi phục” dữ liệu.
> Khởi động trên database cũ **có thể áp dụng migration còn thiếu và đăng ký workflow
> version mới**; đây không phải kiểm tra chỉ đọc. Dữ liệu quan trọng cần backup SQLite
> nhất quán trước nâng cấp. Không chỉ copy tệp chính khi writer/WAL còn hoạt động.
>
> ### SQLite và migrations thực tế
>
> - Không đặt SQLITE_DATABASE_PATH thì mặc định là backend/data/claims.sqlite,
>   tính theo vị trí module ở source/dist, không theo ổ đĩa C:. Trong test mode,
>   khi không chỉ định path thì dùng :memory:. Path rỗng/toàn khoảng trắng bị từ chối.
> - Parent directory được tạo đệ quy khi khởi tạo kết nối. Path tương đối theo working
>   directory; dùng đường dẫn tuyệt đối như trên. Trong giá trị $env:, không thêm
>   ký tự nháy bao quanh đường dẫn; PowerShell đã xử lý nháy của chuỗi.
> - Migrations 001–005 nằm trong src/database/migrations.ts, tự chạy trước HTTP listen.
>   Không có script migrate/seed/reset riêng. schema_migrations lưu ID và SHA-256 SQL.
>   Lịch sử phải là prefix chính xác của bộ migration; mismatch gây MIGRATION_DRIFT.
> - Migration đang chờ chạy trong transaction, lỗi rollback phần đang chờ. Không sửa
>   applied migrations/checksums, xóa ledger hay database để vượt lỗi.
> - Kết nối bật foreign_keys, WAL, synchronous=FULL, timeout 5 giây. Cần quyền ghi cạnh
>   file để SQLite tạo WAL/SHM; tránh thư mục chỉ đọc/network share khi thử setup.
> - config/claims.v2.json và workflow.schema.json được validate trước mở database.
>   Registry giữ version bất biến, claim cũ giữ pin; không sửa lại nội dung version cũ.
>   Migration 005 thêm local payment records, không chuyển tiền thật.
>
> ## 5. Cấu hình và chạy — Terminal 1, tại backend
>
> ```powershell
> $env:PORT = '31879'
> $env:NODE_ENV = 'development'
> $env:DEMO_IDENTITY_ENABLED = 'true'
> $listeners = @(Get-NetTCPConnection -State Listen -LocalPort ([int]$env:PORT) -ErrorAction SilentlyContinue)
> if ($listeners.Count -gt 0) {
>     $listeners | Select-Object LocalAddress, LocalPort, OwningProcess
>     throw 'Port already in use. Choose another PORT; do not send POST to an unknown server.'
> }
> Write-Output "PORT=$env:PORT NODE_ENV=$env:NODE_ENV DEMO_IDENTITY_ENABLED=$env:DEMO_IDENTITY_ENABLED"
> Write-Output "SQLITE_DATABASE_PATH=$env:SQLITE_DATABASE_PATH"
> npm.cmd run start:dev
> ```
>
> Mong đợi: biên dịch không lỗi, Nest đăng ký routes và server listen thành công.
> start:dev là nest start --watch; không cần build riêng. Giữ Terminal 1 mở. Nếu báo
> EADDRINUSE hoặc startup error, **không gửi API requests**: server khác có thể đang
> trả lời ở cổng đó. Chọn cổng khác và cập nhật URL ở Terminal 2. Nếu kiểm tra port
> không chạy được do quyền/cmdlet, cần xác minh cổng bằng công cụ Windows trước POST.
>
> Backend không tự đọc .env. PORT mặc định 3000, chưa có validation riêng cho biến
> này; dùng chuỗi số hợp lệ. Demo chỉ bật khi đồng thời NODE_ENV=development và
> DEMO_IDENTITY_ENABLED=true, đúng chữ thường. API_PROXY_TARGET là biến frontend,
> không cấu hình backend. Không có payment credentials cần điền.
>
> app.listen không giới hạn bind host; URL loopback dưới đây không có nghĩa backend
> chỉ lắng nghe loopback. Chỉ bật demo trong môi trường local tin cậy, không mở ra
> Internet. Không commit secrets hay local env files; hướng dẫn không tạo .env.
>
> ## 6. Xác nhận server — Terminal 2
>
> Mở **PowerShell mới**, vào backend (đổi đường dẫn nếu checkout ở vị trí khác):
>
> ```powershell
> $ErrorActionPreference = 'Stop'
> Set-Location (Join-Path $env:USERPROFILE 'claims-workflow-orchestrator\backend')
> $baseUrl = 'http://127.0.0.1:31879'
> $response = Invoke-WebRequest -Uri "$baseUrl/" -UseBasicParsing
> $response.StatusCode
> $response.Content
> ```
>
> Mong đợi: **200** và văn bản **Hello World!**, không phải JSON. Không có /health
> hay /api/health. Startup khởi tạo DB/registry trước listen; GET / không phải kiểm
> tra database liên tục. Nếu lỗi kết nối, đọc Terminal 1 và đối chiếu cổng trước.
> Phải xác nhận Terminal 1 không báo EADDRINUSE trước khi tiếp tục.
>
> ## 7. Actor demo và API — Terminal 2
>
> | Header X-Demo-Actor-Id | Role và quyền |
> | --- | --- |
> | claimant-1 | Tạo claim và xem/thực hiện action của owner này. |
> | claimant-2 | Claimant khác, dữ liệu sở hữu riêng. |
> | adjuster-1 | Xem mọi claim; action adjuster; không được tạo claim. |
>
> Đây là impersonation demo, không phải production authentication. Role/owner do
> backend allowlist xác định, không lấy từ request body. Production từ chối claim
> API dù DEMO_IDENTITY_ENABLED=true; chưa có authentication adapter production.
>
> ### Liệt kê claims
>
> ```powershell
> $claimantHeaders = @{ 'X-Demo-Actor-Id' = 'claimant-1' }
> $adjusterHeaders = @{ 'X-Demo-Actor-Id' = 'adjuster-1' }
> $response = Invoke-WebRequest -Uri "$baseUrl/api/claims?limit=10&offset=0" -Headers $claimantHeaders -UseBasicParsing
> $response.StatusCode
> $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
> ```
>
> Mong đợi **200**, object items/limit/offset; database mới có items là mảng rỗng.
> limit 1–100 (mặc định 50), offset nguyên không âm (mặc định 0). Để adjuster liệt kê:
>
> ```powershell
> Invoke-RestMethod -Uri "$baseUrl/api/claims?limit=10&offset=0" -Headers $adjusterHeaders
> ```
>
> Mong đợi cùng cấu trúc page, gồm claim của mọi owner. Lỗi 401/403: xem bảng lỗi;
> không đổi guard hoặc thêm role vào body để vượt kiểm tra.
>
> ### Tạo claim: chỉ thực hiện trên database demo mới
>
> ```powershell
> $payload = @{ title = 'Hu hong man hinh'; description = 'Man hinh hong khi van chuyen.' } | ConvertTo-Json -Compress
> $response = Invoke-WebRequest -Uri "$baseUrl/api/claims" -Method Post -Headers $claimantHeaders -ContentType 'application/json' -Body $payload -UseBasicParsing
> $response.StatusCode
> $claim = $response.Content | ConvertFrom-Json
> if (-not $claim.id) { throw 'No claim ID returned; stop and inspect the response.' }
> $claimId = $claim.id
> $claim | ConvertTo-Json -Depth 10
> ```
>
> Mong đợi **201**, UUID thật ở id, ownerActorId=claimant-1, workflowId=claims,
> workflowVersion=2, state=draft, revision=0, informationRequestCount=0, title,
> description và createdAt/updatedAt UTC. title/description không rỗng, giới hạn
> 120/2000 ký tự, không nhận trường thừa. Không gửi role/owner/state trong body.
> Nếu request thất bại, dừng và đọc lỗi trước khi dùng $claimId. Không tự retry tạo
> claim nếu chưa biết outcome: endpoint tạo chưa có command deduplication.
>
> ### Detail, available transitions và audit
>
> ```powershell
> $response = Invoke-WebRequest -Uri "$baseUrl/api/claims/$claimId" -Headers $claimantHeaders -UseBasicParsing
> $response.StatusCode
> $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
>
> $response = Invoke-WebRequest -Uri "$baseUrl/api/claims/$claimId/available-transitions" -Headers $claimantHeaders -UseBasicParsing
> $response.StatusCode
> $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
>
> $response = Invoke-WebRequest -Uri "$baseUrl/api/claims/$claimId/audit?limit=10&offset=0" -Headers $claimantHeaders -UseBasicParsing
> $response.StatusCode
> $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
> ```
>
> Mong đợi cả ba **200**. Detail trả claim object; discovery có claimId, workflowId,
> workflowVersion, state, revision, informationRequestCount, informationRequestLimit,
> transitions (draft mới có submit eligible). Audit có metadata workflow, items,
> limit, offset; claim mới có items rỗng. Detail/discovery không nhận query params.
> Audit chỉ đọc, không có endpoint sửa/xóa. Đổi sang claimant-2 sẽ trả 404 cho claim
> này, cùng response với claim không tồn tại; không bỏ ownership check.
>
> ## 8. Kiểm tra database chỉ đọc — Terminal 2, tại backend
>
> Copy đường dẫn chính xác được Terminal 1 in, không chạy phương án tạo demo mới
> ở Terminal 2. Lệnh nhập dưới đây hỏi path thay vì dùng đường dẫn mẫu có thể bị quên:
>
> ```powershell
> $env:SQLITE_DATABASE_PATH = Read-Host 'Paste the absolute database path printed in Terminal 1 (without surrounding quotes)'
> if (-not (Test-Path -LiteralPath $env:SQLITE_DATABASE_PATH -PathType Leaf)) { throw 'Database file does not exist; do not initialize a replacement.' }
> @'
> import Database from 'better-sqlite3';
> const db = new Database(process.env.SQLITE_DATABASE_PATH, { readonly: true, fileMustExist: true });
> try {
>   db.pragma('query_only = ON');
>   console.log('quick_check:', db.pragma('quick_check', { simple: true }));
>   console.log('foreign_key_check:', db.pragma('foreign_key_check'));
>   console.log('migrations:', db.prepare('SELECT id FROM schema_migrations ORDER BY id').all());
> } finally { db.close(); }
> '@ | node --input-type=module
> if ($LASTEXITCODE -ne 0) { throw 'Read-only database check failed.' }
> ```
>
> Mong đợi quick_check: ok, foreign_key_check: [], migrations 001–005 sau startup
> thành công. Không dùng constructor DatabaseService để kiểm tra chỉ đọc vì nó chạy
> migration. Nếu file cũ chỉ có 001–004 và chưa nâng cấp, không sửa ledger để ép khớp.
>
> ## 9. Tests và các lệnh khác — tại backend
>
> Dùng Terminal 2 nếu vẫn đang xem server ở Terminal 1. Xóa override DB khỏi **Terminal
> 2** để không truyền path dữ liệu thật vào công cụ test; việc này không đổi env của
> server ở Terminal 1:
>
> ```powershell
> Remove-Item Env:SQLITE_DATABASE_PATH -ErrorAction SilentlyContinue
> npm.cmd test
> if ($LASTEXITCODE -ne 0) { throw 'Unit tests failed.' }
> npm.cmd run test:e2e
> if ($LASTEXITCODE -ne 0) { throw 'E2E tests failed.' }
> npm.cmd run lint
> if ($LASTEXITCODE -ne 0) { throw 'Lint failed.' }
> & '.\node_modules\.bin\tsc.cmd' -p tsconfig.json --noEmit --incremental false
> if ($LASTEXITCODE -ne 0) { throw 'TypeScript check failed.' }
> ```
>
> Mong đợi tests passed và mọi exit code bằng 0. Tests hiện tại dùng memory hoặc DB
> tạm; E2E cần socket local. Không tắt test/guard để che lỗi. Build nên chạy sau khi
> **Ctrl+C dừng watch ở Terminal 1**, tránh cùng ghi output/cache:
>
> ```powershell
> npm.cmd run build
> if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
> ```
>
> Mong đợi tạo dist, không có lỗi compiler. Các scripts còn lại:
>
> | Lệnh npm.cmd | Chức năng |
> | --- | --- |
> | start | nest start, không watch. |
> | run start:debug | Watch với debugger, chỉ local. |
> | run start:prod | node dist/main, cần build trước và config/ bên cạnh dist/. |
> | run test:watch | Vitest watch. |
> | run test:cov | Coverage. |
> | run test:debug | Vitest inspector. |
> | run format | Prettier ghi lại source/tests, không cần cho setup. |
> | run deploy | nest deploy, chưa xác minh quyền/cấu hình deploy; ngoài phạm vi local. |
>
> Nếu chạy production sau build, trong Terminal 1 tại backend, dùng path DB đã chọn:
>
> ```powershell
> $env:NODE_ENV = 'production'
> $env:DEMO_IDENTITY_ENABLED = 'false'
> npm.cmd run start:prod
> ```
>
> GET / vẫn trả 200, claim routes phải trả 403 DEMO_IDENTITY_DISABLED. Không đổi
> NODE_ENV sang development để gọi là cấu hình production. Giữ config/ cùng cấp dist/;
> Nest build không copy workflow JSON vào dist. Local dev có thể dùng npm.cmd start
> hoặc start:dev sau khi dừng phiên production và export lại hai biến demo bằng $env:.
>
> ## 10. Lỗi thường gặp và cách xử lý
>
> Invoke-WebRequest/Invoke-RestMethod trên PowerShell 5.1 ném exception với HTTP 4xx/5xx.
> Xem status và ErrorDetails trong thông báo, không coi exception là PowerShell không
> hỗ trợ API. Lỗi nghiệp vụ thường có body error.code/error.message.
>
> | Lỗi | Cách xử lý cụ thể |
> | --- | --- |
> | npm.ps1 cannot be loaded | Dùng npm.cmd như hướng dẫn; không đổi execution policy toàn máy. |
> | export/mktemp/lsof not recognized | Đang dùng hướng dẫn Unix. Dùng các khối powershell trong tệp này. |
> | curl flags bị từ chối | Dùng Invoke-WebRequest với hashtable headers/ConvertTo-Json; không dùng alias curl với flags của Unix. |
> | Node/module syntax error, EBADENGINE | Kiểm tra node --version, Get-Command node, where.exe node. Chọn Node 22.22.3+, mở lại Terminal và npm.cmd ci với runtime đó. |
> | better-sqlite3 NODE_MODULE_VERSION / binary không tương thích | Không tái sử dụng node_modules từ OS/runtime khác. Chạy npm.cmd ci tại backend bằng đúng Node Windows đang dùng. |
> | node-gyp/build native thất bại | Đọc lỗi download/proxy trước. Nếu cần compile, cài Python và Visual Studio Build Tools với C++ workload; mở Terminal mới rồi npm.cmd ci. Không đảm bảo mọi kiến trúc có prebuilt binary. |
> | Missing script: start:dev | Sai thư mục. Set-Location tới backend chứa package.json rồi chạy npm.cmd run start:dev. |
> | EADDRINUSE | Dừng gửi request. Xem Get-NetTCPConnection -State Listen -LocalPort 31879 và Get-Process -Id với OwningProcess đã in. Không kill process lạ. Chọn PORT khác, restart và cập nhật $baseUrl. |
> | Connection refused | Đọc Terminal 1, xác nhận compiler/startup hoàn tất và cổng đúng. Không coi log NestApplication successfully started riêng lẻ là bind thành công nếu sau đó có lỗi listen. |
> | .env không có tác dụng | Backend không nạp .env. Đặt $env: trong Terminal 1 rồi restart. Không đặt chỉ ở Terminal 2. |
> | 403 DEMO_IDENTITY_DISABLED | Development cần đúng NODE_ENV=development và DEMO_IDENTITY_ENABLED=true trong server process. Production phải tiếp tục từ chối. |
> | 401 IDENTITY_REQUIRED | Header X-Demo-Actor-Id thiếu/sai; chỉ có claimant-1, claimant-2, adjuster-1. |
> | 403 CLAIM_CREATION_FORBIDDEN / TRANSITION_FORBIDDEN | Chọn đúng actor/role. Adjuster không tạo claim; claimant không approve/payment/close. |
> | 404 CLAIM_NOT_FOUND | Kiểm tra UUID, database và owner. Claim khác owner cố ý bị ẩn. |
> | 400 INVALID_REQUEST | Body JSON đúng Content-Type, chỉ title/description khi tạo; giới hạn độ dài và query đúng. JSON hỏng có thể bị framework từ chối trước handler. |
> | 409 REVISION_CONFLICT / STATE_CONFLICT | Đọc lại claim/discovery; không tự sửa expectedRevision của command đang có outcome chưa chắc chắn. |
> | 409 COMMAND_ID_REUSED | Retry phải giữ nguyên ID, actor và payload; không dùng ID đó cho lệnh khác. |
> | 422 CYCLE_LIMIT_REACHED | Đã hết ba lần request information trong đời claim; không reset counter. |
> | DATABASE_INITIALIZATION_FAILED | Path không rỗng; phải là file, parent ghi được và cho tạo WAL/SHM. Kiểm tra Test-Path và đường dẫn in ra. Không trỏ vào Program Files hoặc thư mục chỉ đọc. |
> | MIGRATION_DRIFT | Dừng. Kiểm tra đúng DB và bộ source, đối chiếu ID/checksum; khôi phục migration gốc từ Git đáng tin cậy. Không tìm được bản gốc thì báo lỗi, không sửa checksum/xóa ledger/reset DB. |
> | MIGRATION_FAILED | Kiểm tra quyền, khóa và migration đúng version; pending transaction đã rollback. Không sửa applied migration để thử vượt lỗi. |
> | WORKFLOW_VERSION_CONFLICT | Nội dung khác nhưng dùng lại version đã đăng ký. Khôi phục nội dung đúng hoặc phát hành version mới, không đổi pin claim cũ. |
> | Workflow configuration invalid | Giữ config/claims.v2.json và workflow.schema.json đúng vị trí, đọc được/hợp lệ; không tắt validator. |
> | STORAGE_BUSY / SQLITE_BUSY | Chờ writer khác hoàn tất. Transition retry cùng command ID/payload, không xóa WAL/SHM/DB. |
> | Observe worker warning | Source đang dùng credential placeholder. Kiểm tra HTTP và lỗi ứng dụng thực tế; telemetry warning riêng không chứng minh backend hỏng. |
> | dist/main not found | Dừng watch, chạy npm.cmd run build trước start:prod; giữ config/ cạnh dist/. |
>
> ## 11. Dừng và chạy lại
>
> Terminal 1: nhấn **Ctrl+C**, chờ process thoát và prompt trở lại. Nếu npm/cmd hỏi
> Terminate batch job (Y/N), chọn Y. Backend có shutdown hooks và đóng SQLite khi
> module bị hủy. Không dùng Stop-Process theo tên node hàng loạt. Giữ nguyên database
> và sidecars; không xóa để “reset”. Muốn dùng lại demo thì giữ cùng path. Muốn demo
> độc lập thì dùng phương án A tạo thư mục mới, không đụng database cũ.
>
> ## 12. Phạm vi xác minh và tài liệu liên quan
>
> Môi trường sửa tài liệu là macOS, **không có Windows hoặc PowerShell**: chưa chạy
> quy trình trong clean Windows PowerShell, chưa xác minh native install trên Windows.
> Các khối PowerShell được đối chiếu source; không coi là đã parse/chạy bởi PowerShell.
> Node 22.15.1/npm 10.9.2 hiện có dùng cho kiểm tra backend trên macOS, không chứng minh
> npm ci bằng Node 22.22.3 trên Windows đã thành công. Không cài lại dependencies,
> clone lại, chạy deploy hoặc sửa DB dữ liệu thật chỉ để xác minh hướng dẫn.
>
> Xem [vocabulary workflow](config/README.md) và
> [năm kịch bản nghiệp vụ](../docs/demo-scenarios.md). Phần shell/curl của tài liệu
> kịch bản hiện vẫn dành cho Unix; không copy trực tiếp vào PowerShell. Backend/API
> không phụ thuộc frontend. Hướng dẫn Windows trong tệp này kiểm tra list/create/
> detail/discovery/audit, không tuyên bố đã chạy đủ năm kịch bản trên Windows.
> EOF
> npm test && npm run lint && npm run build && ./node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false````
> - Ran ````cat > /Users/tranngochung/Folders/claims-workflow-orchestrator/backend/README.md <<'EOF'
> # Backend trên Windows 10/11 — PowerShell
>
> Dùng Windows PowerShell **5.1** hoặc PowerShell **7**, không cần Git Bash/WSL.
> Terminal 1 chạy server; Terminal 2 gửi requests. Tất cả khối lệnh bên dưới là
> PowerShell. Không cần Nest CLI toàn cục hay SQLite server.
>
> ## 1. Nguyên nhân hướng dẫn cũ thất bại
>
> Hướng dẫn cũ dùng export, mktemp, lsof, heredoc và cú pháp biến của bash/zsh.
> PowerShell không chạy chúng tương đương. Trong PowerShell 5.1, curl còn có thể là
> alias của Invoke-WebRequest, không nhận flags như curl Unix. Hướng dẫn mới dùng
> cmdlet HTTP trực tiếp, hashtable headers và ConvertTo-Json.
>
> Backend không tự nạp .env; chỉ đọc process.env. Thiếu NODE_ENV=development hoặc
> DEMO_IDENTITY_ENABLED=true khiến claim API trả 403 dù GET / vẫn trả 200.
> Scripts npm hiện tại không chứa cú pháp đặt biến riêng Unix, nên không cần sửa
> script hoặc thêm cross-env. SQLite dùng node:path/fileURLToPath, hỗ trợ đường dẫn
> Windows. Không có stack trace Windows được cung cấp: đây là các điểm không tương
> thích xác nhận từ source/hướng dẫn, không phải kết quả tái hiện trên Windows.
>
> ## 2. Điều kiện và phiên bản — Terminal 1
>
> - Chọn **Node.js 22.22.3 Windows x64**, hoặc bản mới hơn trong nhánh 22.x. Đây là
>   mức đáp ứng engine của toolchain trong lockfile hiện tại. Không dùng Node 16/18;
>   Node 22.15.1 thấp hơn yêu cầu một số công cụ dù từng chạy được trên macOS.
> - npm đi kèm Node; lockfileVersion=3. Toolchain được đối chiếu chấp nhận npm >=8;
>   dự án không pin bản npm chính xác hoặc khai báo engines riêng. Không đổi sang
>   Yarn/pnpm. npm 10.9.2 là bản có sẵn được dùng kiểm tra trên macOS.
> - PowerShell 5.1/7, Git for Windows (dự án không pin bản Git), mạng để cài package,
>   quyền ghi thư mục database. Windows ARM64/native binding cần xác minh riêng.
> - better-sqlite3 là native module: nếu không tải được binary phù hợp thì cần Python
>   và Visual Studio Build Tools với workload C++; không thêm dependency dự án.
>
> Mở PowerShell thường, không cần Administrator:
>
> ```powershell
> $ErrorActionPreference = 'Stop'
> $PSVersionTable.PSVersion
> node --version
> npm.cmd --version
> git --version
> ```
>
> Mong đợi phiên bản như trên, mọi lệnh chạy được. Nếu sai/không tìm thấy, cài công
> cụ phù hợp, mở Terminal mới và kiểm tra PATH:
>
> ```powershell
> Get-Command node, npm.cmd, git
> where.exe node
> ```
>
> Dùng npm.cmd tránh execution policy chặn npm.ps1; không cần nới policy toàn máy.
>
> ## 3. Clone và cài — Terminal 1
>
> Từ thư mục người dùng Windows, dùng URL trong Git remote của repository:
>
> ```powershell
> Set-Location $env:USERPROFILE
> git clone https://github.com/tranngochung13/claims-workflow-orchestrator.git
> if ($LASTEXITCODE -ne 0) { throw 'Clone failed; check URL, network and repository access.' }
> Set-Location (Join-Path $env:USERPROFILE 'claims-workflow-orchestrator\backend')
> npm.cmd ci
> if ($LASTEXITCODE -ne 0) { throw 'Install failed; fix the error before starting.' }
> ```
>
> Mong đợi clone thành công, working directory là backend và npm ci exit 0. Nếu đã
> có checkout, không xóa/clone đè: Set-Location tới backend của checkout đó rồi npm.cmd
> ci. URL/quyền clone cần kiểm tra trên máy bạn; lần sửa tài liệu này không clone lại.
>
> npm ci cài đúng lockfile, thay node_modules, không tạo database. Không copy
> node_modules từ macOS/Linux hay Node khác sang Windows. Cài và chạy cùng runtime.
>
> ## 4. Chọn database — Terminal 1, tại backend
>
> Chỉ chọn **A hoặc B**. Biến ở Terminal 1 không tự xuất hiện trong Terminal 2.
>
> ### A. Cài mới/demo: đường dẫn mới, không đụng database hiện có
>
> ```powershell
> $demoDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ('claims-demo-' + [guid]::NewGuid().ToString('N'))
> New-Item -ItemType Directory -Path $demoDirectory -ErrorAction Stop | Out-Null
> $env:SQLITE_DATABASE_PATH = Join-Path $demoDirectory 'claims.sqlite'
> if (Test-Path -LiteralPath $env:SQLITE_DATABASE_PATH) { throw 'Refusing to initialize an existing path.' }
> Write-Output "New demo database: $env:SQLITE_DATABASE_PATH"
> ```
>
> Mong đợi path tuyệt đối mới, chưa có claims.sqlite; không dùng -Force. Backend sẽ
> khởi tạo file và migrations khi startup, không phải lúc New-Item. Giữ lại path nếu
> muốn dùng lại dữ liệu. Thư mục temp có thể bị hệ điều hành dọn, không dùng lưu dữ
> liệu quan trọng lâu dài. Tạo demo khác bằng thư mục mới, không xóa database cũ.
>
> ### B. Dùng database hiện có, không khởi tạo lại
>
> Tại backend, với database mặc định của checkout:
>
> ```powershell
> $existingDatabase = Join-Path (Get-Location).Path 'data\claims.sqlite'
> if (-not (Test-Path -LiteralPath $existingDatabase -PathType Leaf)) { throw 'Existing database not found; verify its actual location.' }
> $env:SQLITE_DATABASE_PATH = (Resolve-Path -LiteralPath $existingDatabase).Path
> Write-Output "Existing database: $env:SQLITE_DATABASE_PATH"
> ```
>
> Nếu trước đó dùng path khác, thay $existingDatabase bằng path thật trước khi kiểm
> tra. Không trỏ tới file không tồn tại để “khôi phục” dữ liệu. Startup trên DB cũ có
> thể áp dụng migrations còn thiếu và đăng ký workflow mới: **không phải chỉ đọc**.
> Backup SQLite nhất quán trước nâng cấp dữ liệu quan trọng; không chỉ copy file
> chính khi WAL/writer còn hoạt động. Không reset/ghi đè database.
>
> ### Cơ chế thực tế
>
> - Không đặt SQLITE_DATABASE_PATH: mặc định backend/data/claims.sqlite, tính theo
>   module source/dist. Trong test mode, không override thì dùng :memory:.
> - Path rỗng/toàn khoảng trắng bị từ chối; parent directory được tạo đệ quy. Path
>   tương đối theo working directory; nên dùng path tuyệt đối như trên. Không đưa
>   ký tự nháy bao quanh vào chính giá trị biến môi trường.
> - Migrations 001–005 trong src/database/migrations.ts tự chạy trước HTTP listen.
>   Không có script migrate/seed/reset. schema_migrations lưu ID/SHA-256 SQL, phải
>   khớp prefix chính xác; mismatch dừng với MIGRATION_DRIFT. Pending migrations
>   chạy trong transaction; lỗi rollback phần đang chờ, không sửa checksum cũ.
> - Foreign keys, WAL, synchronous=FULL, timeout 5 giây; cần quyền ghi cạnh file để
>   tạo WAL/SHM. Tránh thư mục chỉ đọc/network share cho lần setup local.
> - config/claims.v2.json và workflow.schema.json được validate trước mở DB. Registry
>   bất biến, claim cũ giữ version đã pin. Migration 005 thêm local payment records,
>   không chuyển tiền thật. Không sửa applied migrations hay nội dung version cũ.
>
> ## 5. Cấu hình và chạy — Terminal 1, tại backend
>
> ```powershell
> $env:PORT = '31879'
> $env:NODE_ENV = 'development'
> $env:DEMO_IDENTITY_ENABLED = 'true'
> $listeners = @(Get-NetTCPConnection -State Listen -LocalPort ([int]$env:PORT) -ErrorAction SilentlyContinue)
> if ($listeners.Count -gt 0) {
>     $listeners | Select-Object LocalAddress, LocalPort, OwningProcess
>     throw 'Port occupied. Choose another PORT; do not POST to an unknown server.'
> }
> Write-Output "PORT=$env:PORT NODE_ENV=$env:NODE_ENV DEMO_IDENTITY_ENABLED=$env:DEMO_IDENTITY_ENABLED"
> Write-Output "SQLITE_DATABASE_PATH=$env:SQLITE_DATABASE_PATH"
> npm.cmd run start:dev
> ```
>
> Mong đợi compiler không lỗi, routes được đăng ký và listen thành công. start:dev là
> nest start --watch, không cần build trước. Giữ Terminal 1 mở. Nếu EADDRINUSE/startup
> error, không gửi POST: có thể server khác đang trả lời. Chọn PORT khác, restart và
> đổi URL Terminal 2. Nếu cmdlet kiểm tra port bị chặn/không có, cần kiểm chứng cổng
> bằng công cụ Windows trước khi gửi requests ghi dữ liệu.
>
> Không tự đọc .env. PORT mặc định 3000, chưa validate riêng: dùng chuỗi số hợp lệ.
> Demo cần đồng thời đúng development và true, phân biệt chữ hoa/thường. Không có
> payment credentials. API_PROXY_TARGET là biến Vite frontend, không phải backend.
> Observe đang có credential placeholder trong source, không có env Observe do app
> định nghĩa. Không commit secrets/local env files; hướng dẫn này không tạo .env.
>
> app.listen không giới hạn bind host; URL loopback không có nghĩa chỉ listen loopback.
> Chỉ bật demo trong local tin cậy, không mở ra Internet. Production luôn từ chối
> claim API demo, kể cả DEMO_IDENTITY_ENABLED=true; chưa có auth adapter production.
>
> ## 6. Kiểm tra server — Terminal 2
>
> Mở PowerShell mới, vào backend của cùng checkout (đổi path nếu clone ở nơi khác):
>
> ```powershell
> $ErrorActionPreference = 'Stop'
> Set-Location (Join-Path $env:USERPROFILE 'claims-workflow-orchestrator\backend')
> $baseUrl = 'http://127.0.0.1:31879'
> $response = Invoke-WebRequest -Uri "$baseUrl/" -UseBasicParsing
> $response.StatusCode
> $response.Content
> ```
>
> Mong đợi **200**, văn bản **Hello World!**, không phải JSON. Không có /health hay
> /api/health. App khởi tạo DB/registry trước listen; GET / không phải continuous DB
> health check. Nếu khác, đọc Terminal 1/đối chiếu cổng; phải chắc phiên của bạn không
> báo EADDRINUSE trước khi làm bước tạo claim.
>
> ## 7. Demo identities và API — Terminal 2
>
> | Header X-Demo-Actor-Id | Quyền |
> | --- | --- |
> | claimant-1 | Tạo claim, xem/action claim mình sở hữu. |
> | claimant-2 | Claimant khác, tập dữ liệu sở hữu riêng. |
> | adjuster-1 | Xem mọi claim, action adjuster; không tạo claim. |
>
> Đây là impersonation demo, không phải authentication production. Role và owner do
> backend allowlist xác định; không gửi role/actor/owner trong body.
>
> ### Liệt kê claims
>
> ```powershell
> $claimantHeaders = @{ 'X-Demo-Actor-Id' = 'claimant-1' }
> $adjusterHeaders = @{ 'X-Demo-Actor-Id' = 'adjuster-1' }
> $response = Invoke-WebRequest -Uri "$baseUrl/api/claims?limit=10&offset=0" -Headers $claimantHeaders -UseBasicParsing
> $response.StatusCode
> $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
> Invoke-RestMethod -Uri "$baseUrl/api/claims?limit=10&offset=0" -Headers $adjusterHeaders
> ```
>
> Mong đợi **200**, object items/limit/offset; DB mới có items=[]. Adjuster xem mọi
> owner. limit 1–100 (mặc định 50), offset nguyên không âm (mặc định 0). 401/403: kiểm
> tra header và env ở Terminal 1, không sửa guard để vượt lỗi.
>
> ### Tạo claim — chỉ trên database demo mới
>
> ```powershell
> $payload = @{ title = 'Hu hong man hinh'; description = 'Man hinh hong khi van chuyen.' } | ConvertTo-Json -Compress
> $response = Invoke-WebRequest -Uri "$baseUrl/api/claims" -Method Post -Headers $claimantHeaders -ContentType 'application/json' -Body $payload -UseBasicParsing
> $response.StatusCode
> $claim = $response.Content | ConvertFrom-Json
> if (-not $claim.id) { throw 'No claim ID; stop and inspect the response.' }
> $claimId = $claim.id
> $claim | ConvertTo-Json -Depth 10
> ```
>
> Mong đợi **201**, UUID thật, ownerActorId=claimant-1, workflowId=claims,
> workflowVersion=2, state=draft, revision=0, informationRequestCount=0, title,
> description, createdAt/updatedAt UTC. Chỉ nhận title/description không rỗng, tối đa
> 120/2000 ký tự; trường thừa bị từ chối. Nếu lỗi, dừng trước khi dùng $claimId.
> Không tự retry tạo claim khi outcome chưa rõ: endpoint này chưa deduplicate command.
>
> ### Detail, discovery, audit
>
> ```powershell
> $response = Invoke-WebRequest -Uri "$baseUrl/api/claims/$claimId" -Headers $claimantHeaders -UseBasicParsing
> $response.StatusCode
> $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
>
> $response = Invoke-WebRequest -Uri "$baseUrl/api/claims/$claimId/available-transitions" -Headers $claimantHeaders -UseBasicParsing
> $response.StatusCode
> $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
>
> $response = Invoke-WebRequest -Uri "$baseUrl/api/claims/$claimId/audit?limit=10&offset=0" -Headers $claimantHeaders -UseBasicParsing
> $response.StatusCode
> $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
> ```
>
> Mong đợi cả ba **200**. Detail trả claim object; discovery có claimId, workflowId,
> workflowVersion, state, revision, informationRequestCount/Limit và transitions
> (draft có submit eligible). Audit có metadata workflow, items/limit/offset; claim
> mới items=[]. Detail/discovery không nhận query, audit chỉ limit/offset.
> Claim khác owner trả 404 giống claim không tồn tại; audit không có API sửa/xóa.
> Nếu lỗi, xem bảng troubleshooting trước khi gọi lại.
>
> ## 8. Kiểm tra SQLite chỉ đọc — Terminal 2, tại backend
>
> Nhập đúng path được Terminal 1 in; không chạy lại bước tạo database mới ở Terminal 2:
>
> ```powershell
> $env:SQLITE_DATABASE_PATH = Read-Host 'Paste absolute database path from Terminal 1, without surrounding quotes'
> if (-not (Test-Path -LiteralPath $env:SQLITE_DATABASE_PATH -PathType Leaf)) { throw 'Database does not exist; do not create a replacement.' }
> @'
> import Database from 'better-sqlite3';
> const db = new Database(process.env.SQLITE_DATABASE_PATH, { readonly: true, fileMustExist: true });
> try {
>   db.pragma('query_only = ON');
>   console.log('quick_check:', db.pragma('quick_check', { simple: true }));
>   console.log('foreign_key_check:', db.pragma('foreign_key_check'));
>   console.log('migrations:', db.prepare('SELECT id FROM schema_migrations ORDER BY id').all());
> } finally { db.close(); }
> '@ | node --input-type=module
> if ($LASTEXITCODE -ne 0) { throw 'Read-only check failed.' }
> ```
>
> Mong đợi quick_check: ok, foreign_key_check: [], migrations 001–005 sau startup.
> DB cũ chưa nâng cấp có thể chỉ 001–004: không sửa ledger để ép khớp. Không dùng
> DatabaseService constructor để kiểm tra chỉ đọc, vì nó áp dụng migrations.
>
> ## 9. Tests và build — tại backend
>
> Terminal 2: bỏ override DB trong phiên test, không đổi env server ở Terminal 1:
>
> ```powershell
> Remove-Item Env:SQLITE_DATABASE_PATH -ErrorAction SilentlyContinue
> npm.cmd test
> if ($LASTEXITCODE -ne 0) { throw 'Unit tests failed.' }
> npm.cmd run test:e2e
> if ($LASTEXITCODE -ne 0) { throw 'E2E tests failed.' }
> npm.cmd run lint
> if ($LASTEXITCODE -ne 0) { throw 'Lint failed.' }
> & '.\node_modules\.bin\tsc.cmd' -p tsconfig.json --noEmit --incremental false
> if ($LASTEXITCODE -ne 0) { throw 'TypeScript check failed.' }
> ```
>
> Mong đợi tests passed, exit 0. Tests dùng memory/DB tạm; E2E cần socket local.
> Nếu lỗi, giữ nguyên kiểm tra bảo mật và sửa nguyên nhân. **Dừng watch ở Terminal 1
> bằng Ctrl+C trước khi build**, tránh cùng ghi dist/compiler cache:
>
> ```powershell
> npm.cmd run build
> if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
> ```
>
> Mong đợi tạo dist không lỗi compiler. Các scripts khác:
>
> | npm.cmd command | Chức năng |
> | --- | --- |
> | start | nest start, không watch. |
> | run start:debug | Watch với debugger, chỉ local. |
> | run start:prod | node dist/main; build trước, giữ config/ cạnh dist/. |
> | run test:watch / run test:cov / run test:debug | Vitest watch, coverage, inspector. |
> | run format | Prettier ghi lại source/tests, không cần setup. |
> | run deploy | nest deploy, ngoài phạm vi local; chưa xác minh cấu hình/quyền deploy. |
>
> Production sau build, Terminal 1 tại backend với database đã chọn:
>
> ```powershell
> $env:NODE_ENV = 'production'
> $env:DEMO_IDENTITY_ENABLED = 'false'
> npm.cmd run start:prod
> ```
>
> GET / phải trả 200, claim API phải trả 403 DEMO_IDENTITY_DISABLED. Không đổi sang
> development rồi gọi đó là production. Nest build không copy workflow JSON: giữ
> config/ cùng cấp dist/. Muốn quay lại demo, dừng production, đặt lại hai biến demo
> bằng $env: rồi npm.cmd run start:dev.
>
> ## 10. Troubleshooting
>
> PowerShell 5.1 cmdlet HTTP ném exception với 4xx/5xx. Đọc HTTP status và ErrorDetails;
> đó không phải bằng chứng cmdlet không hỗ trợ API. Lỗi nghiệp vụ thường có dạng
> { "error": { "code": "...", "message": "..." } }.
>
> | Triệu chứng | Xử lý |
> | --- | --- |
> | npm.ps1 bị chặn | Dùng npm.cmd; không nới execution policy toàn máy. |
> | export/mktemp/lsof không tìm thấy hoặc curl flags sai | Dùng các khối PowerShell ở đây, không copy lệnh Unix. |
> | EBADENGINE/module syntax error | Kiểm tra node --version/Get-Command/where.exe node; chọn Node 22.22.3+, mở Terminal mới, npm.cmd ci với cùng runtime. |
> | better-sqlite3 ABI/NODE_MODULE_VERSION | Không copy node_modules từ OS/Node khác; npm.cmd ci bằng đúng Windows Node đang chạy. |
> | node-gyp/native build fail | Đọc lỗi network/proxy trước. Nếu cần compile, cài Python/Visual Studio Build Tools C++ rồi mở Terminal mới và npm.cmd ci. Không bảo đảm mọi kiến trúc có prebuilt binary. |
> | Missing script: start:dev | Sai working directory; vào backend có package.json. |
> | EADDRINUSE | Xem Get-NetTCPConnection -State Listen -LocalPort 31879; dùng Get-Process -Id với OwningProcess đã in. Không kill process lạ. Chọn PORT khác, restart, đổi $baseUrl. |
> | Connection refused | Xem Terminal 1 và cổng; log NestApplication successfully started không đủ nếu sau đó có listen error. |
> | .env không có tác dụng | Backend không nạp .env; đặt $env: trong Terminal 1, restart. |
> | 403 DEMO_IDENTITY_DISABLED | Development cần đúng development/true trong server process; production phải tiếp tục fail closed. |
> | 401 IDENTITY_REQUIRED | Thiếu/sai X-Demo-Actor-Id; chỉ ba ID allowlist. |
> | 403 CLAIM_CREATION_FORBIDDEN/TRANSITION_FORBIDDEN | Chọn đúng role; adjuster không tạo claim, claimant không approve/payment/close. |
> | 404 CLAIM_NOT_FOUND | Kiểm tra UUID, DB, owner; claim khác owner cố ý bị ẩn. |
> | 400 INVALID_REQUEST | JSON, Content-Type, trường/độ dài/query đúng schema; JSON hỏng có thể bị framework từ chối trước handler. |
> | 409 REVISION_CONFLICT/STATE_CONFLICT | Đọc lại claim/discovery; không tự sửa revision của command có outcome chưa chắc chắn. |
> | 409 COMMAND_ID_REUSED | Retry giữ nguyên ID/actor/payload, không dùng ID cũ cho request khác. |
> | 422 CYCLE_LIMIT_REACHED | Hết ba lần request information trong đời claim; không reset counter. |
> | DATABASE_INITIALIZATION_FAILED | Path không rỗng, file không phải directory, parent/WAL ghi được. Không dùng Program Files/thư mục chỉ đọc. Kiểm tra path in ra/Test-Path. |
> | MIGRATION_DRIFT | Dừng, kiểm tra đúng DB/source, đối chiếu ID/checksum. Khôi phục migration gốc từ Git đáng tin cậy; không tìm được thì báo lỗi. Không sửa checksum/ledger, reset DB hoặc sửa applied migrations. |
> | MIGRATION_FAILED | Kiểm tra quyền/khóa/bộ migration; pending transaction rollback. Không sửa applied migration để vượt lỗi. |
> | WORKFLOW_VERSION_CONFLICT | Version đã đăng ký có nội dung khác; khôi phục đúng hoặc phát hành version mới, giữ pin claim cũ. |
> | Workflow configuration invalid | Giữ config/claims.v2.json và workflow.schema.json đúng chỗ, đọc được/hợp lệ. Không bỏ validator. |
> | STORAGE_BUSY/SQLITE_BUSY | Chờ writer; transition retry cùng command. Không xóa WAL/SHM/DB. |
> | Observe worker warning | Source còn credentials placeholder; đối chiếu HTTP/lỗi ứng dụng. Telemetry warning riêng chưa chứng minh API hỏng. |
> | dist/main không tìm thấy | Dừng watch, build trước start:prod, giữ config/ cạnh dist/. |
>
> ## 11. Dừng server
>
> Terminal 1 nhấn **Ctrl+C**, chờ prompt. Nếu hỏi Terminate batch job (Y/N), chọn Y.
> Có Nest shutdown hooks/đóng SQLite khi module bị hủy; không Stop-Process theo tên
> node hàng loạt. Giữ nguyên database/sidecars. Dùng lại path để giữ dữ liệu; muốn
> demo mới thì tạo thư mục mới, không xóa/reset dữ liệu.
>
> ## 12. Phạm vi xác minh
>
> Máy sửa tài liệu là macOS, **không có Windows hoặc PowerShell**. Chưa thực thi hoặc
> parse bằng PowerShell, chưa xác minh cài native dependencies trong Windows clean
> session. Không tuyên bố Windows đã pass. Các lệnh được đối chiếu scripts/source;
> Node 22.15.1/npm 10.9.2 có sẵn dùng cho kiểm tra backend macOS, không chứng minh npm
> ci bằng Node 22.22.3 trên Windows thành công. Không clone/cài lại dependencies,
> chạy deploy hoặc ghi database hiện có chỉ để kiểm tra tài liệu.
>
> Xem [workflow vocabulary](config/README.md) và [năm kịch bản](../docs/demo-scenarios.md).
> Shell/curl trong guide kịch bản vẫn dành cho Unix, không copy thẳng vào PowerShell.
> Hướng dẫn này kiểm tra list/create/detail/discovery/audit; không tuyên bố đã chạy
> năm kịch bản bằng Windows. Backend/API không cần frontend để kiểm tra setup.
> EOF
> export PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH
> npm test && npm run lint && npm run build && ./node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false````
> - Ran `export PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH
> npm run test:e2e`
> - Ran `git diff --check; git diff --stat; rg -n 'process.env|dotenv|ConfigModule' backend/src; git status --short`
>
> </details>
>
> README đã được chuyển sang quy trình PowerShell: dùng `npm.cmd`, `$env:`, `Join-Path`, thư mục demo mới có kiểm tra tồn tại và `Invoke-WebRequest`. Hướng dẫn cũng tách Terminal 1/2, có kiểm tra cổng trước startup và giữ nguyên cơ chế migration drift.
>
> Trên macOS, 217 unit tests, build, lint và TypeScript đã qua; E2E đang chạy. Tôi chưa xác minh cài đặt native module hoặc các lệnh PowerShell trên Windows.
>
> <details><summary>Ran 2 commands</summary>
>
> - Ran ``export PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH
> node --input-type=module <<'JS'
> import { spawn } from 'node:child_process';
> import { mkdtempSync } from 'node:fs';
> import { tmpdir } from 'node:os';
> import { join } from 'node:path';
> import net from 'node:net';
> import Database from 'better-sqlite3';
> const listener = net.createServer();
> await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
> const port = listener.address().port;
> await new Promise(resolve => listener.close(resolve));
> const path = join(mkdtempSync(join(tmpdir(), 'cwo-win-guide-')), 'claims.sqlite');
> const child = spawn('npm', ['run', 'start:prod'], { env: { ...process.env, PORT: String(port), NODE_ENV: 'development', DEMO_IDENTITY_ENABLED: 'true', SQLITE_DATABASE_PATH: path }, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
> let output=''; let exited=false; child.on('exit', () => exited=true);
> child.stdout.on('data', chunk => output+=chunk); child.stderr.on('data', chunk => output+=chunk);
> try {
>   const origin = `http://127.0.0.1:${port}`;
>   let ready=false;
>   for(let i=0;i<100;i++) {
>     if(exited) throw new Error('Startup failed: '+output);
>     if(output.includes('EADDRINUSE')) throw new Error('Port conflict');
>     try { const response=await fetch(origin, {signal:AbortSignal.timeout(300)}); if(response.status===200 && await response.text()==='Hello World!') { ready=true;break; } } catch {}
>     await new Promise(resolve=>setTimeout(resolve,100));
>   }
>   if(!ready) throw new Error('Startup timeout: '+output);
>   const headers={'X-Demo-Actor-Id':'claimant-1'};
>   const list=await fetch(origin+'/api/claims?limit=10&offset=0',{headers});
>   const page=await list.json(); if(list.status!==200 || page.items.length!==0) throw new Error('Expected isolated empty database');
>   const created=await fetch(origin+'/api/claims',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({title:'Hu hong man hinh',description:'Man hinh hong khi van chuyen.'})});
>   const claim=await created.json(); if(created.status!==201 || claim.workflowVersion!==2) throw new Error('Create failed');
>   const statuses=[];
>   for(const route of ['', '/available-transitions', '/audit?limit=10&offset=0']) {const response=await fetch(origin+'/api/claims/'+claim.id+route,{headers});if(response.status!==200) throw new Error('Read route failed');statuses.push(response.status);}
>   const missing=await fetch(origin+'/api/claims');if(missing.status!==401)throw new Error('Identity guard failed');
>   const db=new Database(path,{readonly:true,fileMustExist:true});
>   db.pragma('query_only=ON');
>   const quick=db.pragma('quick_check',{simple:true});const foreign=db.pragma('foreign_key_check');const migrations=db.prepare('SELECT id FROM schema_migrations ORDER BY id').all();db.close();
>   if(quick!=='ok'||foreign.length||migrations.length!==5)throw new Error('Database check failed');
>   console.log(JSON.stringify({platform:process.platform,node:process.version,root:200,list:list.status,create:created.status,reads:statuses,missingIdentity:missing.status,quickCheck:quick,migrations:migrations.length,isolatedDatabase:true}));
> } finally {
>   try{process.kill(-child.pid,'SIGINT');}catch{}
>   await Promise.race([new Promise(resolve=>child.once('exit',resolve)),new Promise(resolve=>setTimeout(resolve,3000))]);
>   try{process.kill(-child.pid,'SIGTERM');}catch{}
> }
> JS``
> - Ran ````python3 - <<'PY'
> from pathlib import Path
> p=Path('backend/README.md');s=p.read_text();s=s.replace('trong server process; production phải tiếp tục fail closed.', 'trong server process; production phải tiếp tục fail closed.')
> s += '''\nKết quả chạy trong lần sửa này trên macOS: npm test (217 passed), npm run\ntest:e2e (113 passed), lint, build và TypeScript noEmit đều thành công. Đã chạy\nscript start:prod với NODE_ENV=development trên cổng chọn động/database tạm mới:\nGET /, list/detail/discovery/audit trả 200, create trả 201, thiếu identity trả 401;\nSQLite quick_check=ok và đủ 5 migrations. Đây là kiểm tra API/compiled startup\nmacOS, không thay thế chạy npm.cmd ci/start:dev trong Windows PowerShell.\n''';p.write_text(s)
> import json,hashlib,sqlite3
> baseline=json.loads(Path('/tmp/cwo-windows-docs-baseline.json').read_text())
> Path('backend/tsconfig.build.tsbuildinfo').write_bytes(bytes.fromhex(baseline['backend/tsconfig.build.tsbuildinfo']))
> for name in ['backend/package.json','backend/package-lock.json','backend/src/database/migrations.ts']:
>  assert Path(name).read_bytes()==bytes.fromhex(baseline[name]),name
> print('Package scripts, lockfile and all migrations unchanged byte-for-byte')
> p=Path.cwd()/'backend/data/claims.sqlite';c=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True);b=json.loads(Path('/tmp/cwo-windows-docs-db.json').read_text());assert all(hashlib.sha256(repr(c.execute('select * from "'+t+'" order by rowid').fetchall()).encode()).hexdigest()==h for t,h in b.items());c.close();print('Existing database and migration ledger unchanged')
> import re
> s=Path('backend/README.md').read_text()
> for t in re.findall(r'\]\(([^)]+)\)',s): assert (Path('backend')/t).exists(),t
> for block in re.findall(r'```powershell\n(.*?)```',s,re.S):
>  for bad in ['export ', 'mktemp ', 'lsof ', '$PWD', 'grep ', '<<']:
>   assert bad not in block,bad
> print('Local documentation links exist; no Unix-only commands in PowerShell blocks (static check only)')
> PY
> git diff --check
> git diff --stat
> git status --short````
>
> </details>
</details>

Đã cập nhật [backend/README.md](./backend/README.md) với hướng dẫn PowerShell 5.1/7 đầy đủ.

Nguyên nhân xác nhận được là hướng dẫn cũ dùng cú pháp Unix và không cấu hình biến môi trường đúng cho PowerShell. Backend không tự đọc `.env`; thiếu hai biến demo sẽ trả 403. Scripts npm hiện tại không cần sửa.

Sau khi cài **Node 22.22.3 Windows x64**, chạy Terminal 1:

```powershell
$ErrorActionPreference = 'Stop'
node --version
npm.cmd --version

Set-Location $env:USERPROFILE
git clone https://github.com/tranngochung13/claims-workflow-orchestrator.git
if ($LASTEXITCODE -ne 0) { throw 'Clone failed' }

Set-Location (Join-Path $env:USERPROFILE 'claims-workflow-orchestrator\backend')
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw 'Install failed' }

$demoDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ('claims-demo-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $demoDirectory -ErrorAction Stop | Out-Null
$env:SQLITE_DATABASE_PATH = Join-Path $demoDirectory 'claims.sqlite'
if (Test-Path -LiteralPath $env:SQLITE_DATABASE_PATH) { throw 'Path already exists' }

$env:PORT = '31879'
$env:NODE_ENV = 'development'
$env:DEMO_IDENTITY_ENABLED = 'true'

$listeners = @(Get-NetTCPConnection -State Listen -LocalPort 31879 -ErrorAction SilentlyContinue)
if ($listeners.Count -gt 0) { throw 'Port occupied; choose another port' }

Write-Output $env:SQLITE_DATABASE_PATH
npm.cmd run start:dev
```

Chờ biên dịch thành công, không có lỗi startup. Terminal 2:

```powershell
$baseUrl = 'http://127.0.0.1:31879'
$response = Invoke-WebRequest -Uri "$baseUrl/" -UseBasicParsing
$response.StatusCode
$response.Content
```

Mong đợi **200** và **Hello World!**. README có lệnh PowerShell tạo/list/detail/discovery/audit, kiểm tra SQLite, chạy tests và xử lý lỗi. Dừng server bằng **Ctrl+C** trong Terminal 1.

Đã chạy trên macOS:

- **217 unit tests**, **113 E2E tests** passed.
- Build, lint, TypeScript và `git diff --check` passed.
- Startup/API trên database tạm: đọc **200**, tạo **201**, thiếu identity **401**; SQLite hợp lệ.

**Chưa xác minh trên Windows:** máy hiện tại không có Windows/PowerShell. Cài mới bằng `npm.cmd ci`, native SQLite binding và toàn bộ quy trình PowerShell vẫn cần chạy thực tế; không tuyên bố Windows đã pass.

Chỉ README thay đổi. Scripts, dependencies, migrations và dữ liệu database hiện có được xác nhận giữ nguyên.

> # Task: Complete macOS and Linux Backend Setup Documentation
>
> The Windows backend setup documentation has already been addressed in the previous task.
>
> Now inspect the current changes and existing documentation. Add or fix macOS and Linux setup instructions if they are missing or incomplete.
>
> ## 1. Inspect before editing
>
> - Review the current backend README and root README.
> - Inspect `backend/package.json`, npm scripts, environment configuration, SQLite paths, migrations, and backend startup code.
> - Identify which macOS and Linux instructions already exist and whether they match the actual implementation.
> - Do not duplicate instructions that are already correct.
>
> ## 2. Add macOS instructions
>
> Provide copy-paste-ready commands for macOS Terminal using zsh/bash-compatible syntax, covering:
>
> - Prerequisites and required Node.js version.
> - Cloning the repository and entering the correct backend directory.
> - Installing dependencies with the repository's actual package manager.
> - Setting environment variables.
> - Configuring and verifying the SQLite database safely.
> - Starting the backend.
> - Verifying that the server responds successfully.
> - Calling real API endpoints with the required demo identity headers.
> - Running backend tests.
> - Stopping the server.
> - Troubleshooting common setup failures.
>
> ## 3. Add Linux instructions
>
> Provide equivalent copy-paste-ready instructions for a standard bash-compatible Linux shell.
>
> Cover the same setup, database safety, startup, API verification, tests, shutdown, and troubleshooting steps as the macOS guide.
>
> Do not assume a specific Linux distribution unless the project requires it. If installation commands depend on the distribution, explain the prerequisite without presenting an unverified command as universal.
>
> ## 4. Preserve Windows compatibility
>
> - Keep the Windows instructions from the previous task.
> - Do not replace PowerShell commands with Unix-only commands in shared instructions.
> - Avoid modifying working Windows setup behavior.
> - Prefer cross-platform npm scripts and Node.js code where practical.
> - Ensure database paths and environment-variable handling are correct for each operating system.
>
> ## 5. Safety constraints
>
> - Never delete, reset, recreate, or overwrite an existing SQLite database.
> - Do not modify applied migrations or disable migration drift protection.
> - Do not weaken authentication, RBAC, claim ownership, or production safeguards.
> - Do not introduce unrelated dependencies, features, or refactors.
> - Do not invent environment variables, scripts, endpoints, request payloads, or expected responses. Verify them against the actual code.
>
> ## 6. Verify and report
>
> - Check every command against the repository's actual implementation.
> - Run safe installation, build, test, and API checks wherever the environment permits.
> - Clearly distinguish checks that were actually executed from instructions that were only inspected.
> - Never claim macOS or Linux execution was verified if those environments were unavailable.
> - Keep the documentation concise, practical, and executable without requiring the reader to research missing steps.
>
> ## Deliverables
>
> 1. Update the existing documentation with complete Windows, macOS, and Linux instructions.
> 2. Report which macOS/Linux instructions were missing or incorrect.
> 3. List all changed files and explain why each change was needed.
> 4. Provide the exact commands to run on macOS and Linux from a fresh checkout until the backend responds successfully.
> 5. Report verification results for all three operating systems separately.
>
> Do not redo the Windows work unnecessarily. Focus on completing macOS and Linux support while preserving Windows compatibility.

<details><summary>6 previous messages</summary>

> Tôi sẽ giữ nguyên hướng dẫn PowerShell, kiểm tra phần macOS/Linux còn thiếu rồi bổ sung quy trình zsh/bash dùng chung ở chỗ phù hợp. Các kiểm tra chạy thật sẽ dùng database tạm riêng.
>
> <details><summary>Ran 4 commands</summary>
>
> - Ran `head -16 backend/README.md; tail -24 backend/README.md; cat README.md backend/package.json backend/src/main.ts backend/src/database/database.service.ts; head -40 docs/demo-scenarios.md; git status --short; uname -s; command -v docker; command -v bash; command -v zsh`
> - Ran `docker info --format '{{.OSType}}'`
> - Ran `cat backend/src/claims/claims.controller.ts | rg '@(Get|Post|Controller)|HttpCode'; sed -n '30,49p' backend/src/claims/claims-http.ts; rg -n 'maxLength|Only title|120|2000' backend/src/claims/claim.types.ts; rg --files -g AGENTS.md; node --version; npm --version; python3 - <<'PY'
> from pathlib import Path
> import hashlib,json,sqlite3
> names=['backend/README.md','README.md','backend/src/database/migrations.ts','backend/package.json','backend/package-lock.json','backend/tsconfig.build.tsbuildinfo']
> Path('/tmp/cwo-unix-docs-baseline.json').write_text(json.dumps({p:Path(p).read_bytes().hex() for p in names}))
> p=Path.cwd()/'backend/data/claims.sqlite';c=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True);Path('/tmp/cwo-unix-docs-db.json').write_text(json.dumps({t:hashlib.sha256(repr(c.execute('select * from "'+t+'" order by rowid').fetchall()).encode()).hexdigest() for (t,) in c.execute("select name from sqlite_master where type='table'").fetchall()}));c.close()
> PY`
> - Ran `docker info --format '{{.OSType}}'
> docker image ls --format '{{.Repository}}:{{.Tag}}'`
>
> </details>
>
> README backend hiện chỉ hướng dẫn Windows; `docs/demo-scenarios.md` đã có cách chạy demo Unix đúng, nhưng chưa phải hướng dẫn setup đầy đủ. Tôi sẽ giữ nguyên các lệnh PowerShell và thêm một phần dùng chung cho macOS zsh/bash và Linux bash, với lưu ý riêng về native SQLite toolchain.
>
> Máy hiện tại là macOS. Docker daemon không chạy, nên tôi không có môi trường Linux để kiểm tra thực thi.
>
> <details><summary>Ran 7 commands</summary>
>
> - Ran ````python3 - <<'PY'
> from pathlib import Path
> p=Path('backend/README.md');s=p.read_text();s=s.replace('# Backend trên Windows 10/11 — PowerShell', '# Backend — Windows, macOS và Linux\n\n- Windows 10/11: phần PowerShell ngay bên dưới.\n- [macOS và Linux: Terminal zsh/bash](#macos-va-linux).\n- [Workflow scenarios](../docs/demo-scenarios.md): giữ nguyên các kịch bản nghiệp vụ.\n\n## Windows 10/11 — PowerShell',1).replace('Tất cả khối lệnh bên dưới là\nPowerShell.', 'Các khối lệnh trong phần Windows là\nPowerShell.',1);p.write_text(s)
> p=Path('README.md');s=p.read_text().replace('Start with [local setup and the five reproducible scenarios](docs/demo-scenarios.md).','Start with [backend setup for Windows, macOS, and Linux](backend/README.md),\nthen follow the [five reproducible scenarios](docs/demo-scenarios.md).').replace('[Backend architecture, API contracts, and checks]','[Backend setup, API examples, and checks]');p.write_text(s)
> PY
> cat >> backend/README.md <<'EOF'
>
> <a id="macos-va-linux"></a>
>
> ## macOS và Linux — Terminal zsh/bash
>
> Các lệnh dưới đây dùng chung cho **macOS Terminal (zsh/bash)** và **Linux bash**.
> Không chạy chúng trong PowerShell. Không cần sửa npm scripts hoặc application code.
> Phần này chỉ setup/kiểm tra API; các [năm kịch bản](../docs/demo-scenarios.md) đã có
> lệnh Unix đúng nên không chép lại ở đây.
>
> ### 1. Điều kiện riêng từng hệ điều hành
>
> - Cả hai: chọn **Node.js 22.22.3 hoặc bản 22.x mới hơn**, npm đi kèm, Git, curl.
>   Engine toolchain trong lockfile yêu cầu mức này; dự án không pin bản npm riêng.
>   Không dùng Node 16/18 hoặc copy node_modules từ OS/runtime khác.
> - macOS: nếu better-sqlite3 phải compile thay vì tải prebuilt binary, cần Python và
>   Apple Command Line Tools (C/C++). Dùng runtime đúng kiến trúc máy, nhất quán từ
>   cài dependency đến chạy server; không trộn native module Intel/Apple Silicon.
> - Linux: nếu native build cần thiết, cài Python, C/C++ compiler và make theo hướng
>   dẫn distro của bạn. Không có một lệnh apt/yum/apk phổ quát cho mọi distro. Binary
>   khả dụng còn tùy kiến trúc/libc; lần sửa này chưa xác minh trên Linux.
> - Chọn thư mục local ghi được cho SQLite/WAL/SHM. Không cần SQLite server hoặc CLI.
>   Không dùng sudo npm ci để né lỗi quyền.
>
> Terminal 1, từ thư mục bất kỳ:
>
> ```sh
> node --version
> npm --version
> git --version
> curl --version
> ```
>
> Mong đợi Node v22.22.3+ trong nhánh 22.x và các công cụ chạy được. Nếu thiếu/sai,
> cài hoặc chọn runtime thích hợp theo hệ điều hành rồi mở Terminal mới; kiểm tra
> `command -v node` và `command -v npm`. Không tiếp tục chỉ vì shell có một Node cũ.
>
> ### 2. Clone và cài — Terminal 1
>
> ```sh
> cd "$HOME"
> git clone https://github.com/tranngochung13/claims-workflow-orchestrator.git &&
>   cd claims-workflow-orchestrator/backend &&
>   npm ci
> ```
>
> Mong đợi clone/install exit 0, thư mục hiện tại là backend. Nếu clone/install lỗi,
> dừng và xử lý trước startup. Checkout đã tồn tại: không clone đè/xóa, vào backend
> của nó rồi npm ci. Lệnh cài dùng đúng lockfile, thay node_modules nhưng không tạo DB.
> URL lấy từ Git remote; quyền truy cập repository cần xác minh trên máy sử dụng.
>
> ### 3. Chọn database — Terminal 1, tại backend
>
> Chỉ chọn **A hoặc B**. Backend không tự nạp .env; các export phải ở Terminal chạy
> server. Tệp .env không tự thay thế những lệnh này. Không commit secrets/local env.
>
> **A. Demo/cài mới, đường dẫn mới hoàn toàn:**
>
> ```sh
> export CWO_DEMO_DIR="$(mktemp -d "${TMPDIR:-/tmp}/claims-demo.XXXXXX")"
> test -n "$CWO_DEMO_DIR" && test -d "$CWO_DEMO_DIR" || exit 1
> export SQLITE_DATABASE_PATH="$CWO_DEMO_DIR/claims.sqlite"
> test ! -e "$SQLITE_DATABASE_PATH" || exit 1
> printf 'New demo database: %s\n' "$SQLITE_DATABASE_PATH"
> ```
>
> Mong đợi in path mới chưa có claims.sqlite; backend tạo file ở startup. mktemp chỉ
> cho thư mục mới, không ghi đè DB cũ. Giữ path để dùng lại. Temp có thể bị hệ điều
> hành dọn; không lưu dữ liệu quan trọng lâu dài ở đây.
>
> **B. Database hiện có** (thay cho A), mặc định của checkout, tại backend:
>
> ```sh
> export SQLITE_DATABASE_PATH="$(pwd -P)/data/claims.sqlite"
> test -f "$SQLITE_DATABASE_PATH" || { printf '%s\n' 'Existing database not found; stop and verify its path.' >&2; exit 1; }
> printf 'Existing database: %s\n' "$SQLITE_DATABASE_PATH"
> ```
>
> Nếu process trước dùng path khác, thay giá trị bằng path tuyệt đối thật của tệp đó.
> Không dùng path không tồn tại để “phục hồi”. Startup có thể áp dụng pending migration
> và đăng ký workflow mới, không phải chỉ đọc: backup SQLite nhất quán trước nâng cấp
> dữ liệu quan trọng. Không copy riêng file chính khi writer/WAL còn hoạt động.
>
> Không override thì mặc định backend/data/claims.sqlite, theo module source/dist;
> path tương đối theo working directory. Test mode không override dùng :memory:.
> Path rỗng bị từ chối, parent được tạo đệ quy. Startup tự kiểm tra ID/SHA-256 trong
> schema_migrations rồi áp dụng pending migrations 001–005 theo transaction. Không
> có script migrate/reset/seed. Không sửa applied SQL, checksum hoặc xóa DB khi drift.
> Config/registry được validate và claim cũ giữ pin; WAL/foreign keys/FULL bật như
> phần Windows. Migration 005 chỉ ghi local payment, không chuyển tiền.
>
> ### 4. Kiểm tra cổng và start — Terminal 1, tại backend
>
> Dùng Node để kiểm tra cổng, không phụ thuộc lsof trên macOS hoặc ss/netstat của
> một distro Linux cụ thể:
>
> ```sh
> export PORT=31879
> export NODE_ENV=development
> export DEMO_IDENTITY_ENABLED=true
> node --input-type=module <<'JS'
> import net from 'node:net';
> const server = net.createServer();
> server.once('error', error => {
>   console.error('Port check failed:', error.code, '- choose another PORT before starting.');
>   process.exitCode = 1;
> });
> server.listen(Number(process.env.PORT), () => server.close());
> JS
> ```
>
> Mong đợi exit 0, không có lỗi. Nếu khác, không chạy bước tiếp theo; chọn PORT khác
> và kiểm tra lại. Đây là preflight, vẫn có thể bị process khác chiếm cổng sau đó.
>
> ```sh
> printf 'PORT=%s NODE_ENV=%s DEMO_IDENTITY_ENABLED=%s\n' "$PORT" "$NODE_ENV" "$DEMO_IDENTITY_ENABLED"
> printf 'SQLITE_DATABASE_PATH=%s\n' "$SQLITE_DATABASE_PATH"
> npm run start:dev
> ```
>
> Mong đợi compile không lỗi, routes đăng ký và listen thành công. Giữ Terminal 1 mở.
> Nếu có EADDRINUSE hoặc lỗi startup, **không gửi POST** tới cổng đó; có thể server
> khác đang trả lời. Chọn cổng khác, restart và cập nhật URL Terminal 2.
>
> PORT mặc định 3000, code chưa validate riêng; dùng số hợp lệ. Hai biến demo phải
> đồng thời chính xác development/true. API_PROXY_TARGET là biến Vite, không backend.
> App không giới hạn bind host: dùng URL loopback không đồng nghĩa chỉ listen local.
> Chỉ bật demo trong môi trường tin cậy, không public; không đổi production guard.
>
> ### 5. Kiểm tra HTTP và API — Terminal 2
>
> Từ thư mục bất kỳ, macOS zsh/bash hoặc Linux bash; đổi URL nếu Terminal 1 đổi PORT:
>
> ```sh
> export CWO_API_BASE_URL=http://127.0.0.1:31879
> curl -i "$CWO_API_BASE_URL/"
> curl -i "$CWO_API_BASE_URL/api/claims?limit=10&offset=0" \
>   -H 'X-Demo-Actor-Id: claimant-1'
> curl -i "$CWO_API_BASE_URL/api/claims?limit=10&offset=0" \
>   -H 'X-Demo-Actor-Id: adjuster-1'
> ```
>
> Mong đợi 200 và văn bản Hello World! ở root, 200 với page items/limit/offset ở hai
> lệnh list; database mới items=[]. Không có /health. Claim API cần header: claimant-1
> và claimant-2 chỉ xem claim mình sở hữu; adjuster-1 xem mọi claim nhưng không tạo.
> Nếu status khác, xem bảng lỗi bên dưới; không tiếp tục ghi khi chưa rõ server/path.
>
> **Tạo claim, chỉ trên database demo mới.** Terminal 2 cần Node để đọc ID từ JSON:
>
> ```sh
> CWO_CREATE_JSON="$(curl --fail -sS "$CWO_API_BASE_URL/api/claims" \
>   -H 'Content-Type: application/json' -H 'X-Demo-Actor-Id: claimant-1' \
>   --data '{"title":"Hu hong man hinh","description":"Man hinh hong khi van chuyen."}')" || exit 1
> printf '%s\n' "$CWO_CREATE_JSON"
> export CWO_CLAIM_ID="$(printf '%s' "$CWO_CREATE_JSON" | node --input-type=module -e '
> let text = "";
> for await (const chunk of process.stdin) text += chunk;
> const claim = JSON.parse(text);
> if (typeof claim.id !== "string") throw new Error("No claim ID; stop and inspect response");
> console.log(claim.id);
> ')"
> test -n "$CWO_CLAIM_ID" || exit 1
> ```
>
> POST trả 201 (khối trên giữ body JSON, không in HTTP headers); response có UUID thật,
> ownerActorId=claimant-1, workflowId=claims, workflowVersion=2, state=draft, revision=0,
> informationRequestCount=0, title/description và UTC timestamps. Title/description
> không rỗng, tối đa 120/2000 ký tự, không nhận role/owner/state hay trường thừa.
> Không retry tạo tự động nếu outcome chưa rõ; endpoint tạo không có deduplication.
> Nếu curl lỗi, dùng request không ghi như GET / để chẩn đoán, không gửi POST lại ngay.
>
> ```sh
> curl -i "$CWO_API_BASE_URL/api/claims/$CWO_CLAIM_ID" \
>   -H 'X-Demo-Actor-Id: claimant-1'
> curl -i "$CWO_API_BASE_URL/api/claims/$CWO_CLAIM_ID/available-transitions" \
>   -H 'X-Demo-Actor-Id: claimant-1'
> curl -i "$CWO_API_BASE_URL/api/claims/$CWO_CLAIM_ID/audit?limit=10&offset=0" \
>   -H 'X-Demo-Actor-Id: claimant-1'
> ```
>
> Mong đợi ba status 200: detail là claim object; discovery có metadata/cycle limit,
> transitions với submit eligible; audit có metadata, items=[], limit/offset. Không
> có API sửa/xóa audit. Claim khác owner bị 404 giống claim không tồn tại. Detail và
> discovery không nhận query; list/audit chỉ nhận limit 1–100, offset không âm.
>
> ### 6. SQLite readiness chỉ đọc — Terminal 2, tại backend
>
> Vào backend của checkout (ví dụ cd "$HOME/claims-workflow-orchestrator/backend").
> Nhập path được Terminal 1 in ra, không chạy lại mktemp:
>
> ```sh
> printf 'Paste absolute database path from Terminal 1 (no surrounding quotes): '
> IFS= read -r SQLITE_DATABASE_PATH
> export SQLITE_DATABASE_PATH
> test -f "$SQLITE_DATABASE_PATH" || exit 1
> node --input-type=module <<'JS'
> import Database from 'better-sqlite3';
> const db = new Database(process.env.SQLITE_DATABASE_PATH, { readonly: true, fileMustExist: true });
> try {
>   db.pragma('query_only = ON');
>   console.log('quick_check:', db.pragma('quick_check', { simple: true }));
>   console.log('foreign_key_check:', db.pragma('foreign_key_check'));
>   console.log('migrations:', db.prepare('SELECT id FROM schema_migrations ORDER BY id').all());
> } finally { db.close(); }
> JS
> ```
>
> Mong đợi quick_check: ok, foreign_key_check: [], 001–005 sau startup thành công.
> DB cũ chưa nâng cấp có thể chỉ có 001–004; không sửa ledger để ép khớp. Không dùng
> DatabaseService để đọc trạng thái vì constructor của nó có thể migrate.
>
> ### 7. Tests, build, shutdown — tại backend
>
> Terminal 2, tách override DB khỏi phiên test, không đổi server ở Terminal 1:
>
> ```sh
> unset SQLITE_DATABASE_PATH
> npm test &&
>   npm run test:e2e &&
>   npm run lint &&
>   ./node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false
> ```
>
> Mong đợi tests passed và exit 0. E2E cần socket local, tests dùng memory/DB tạm.
> Nếu lỗi, sửa nguyên nhân; không bỏ test/guard. Dừng watch ở Terminal 1 bằng **Ctrl+C**,
> chờ prompt, rồi build tại backend để tránh cùng ghi dist/compiler cache:
>
> ```sh
> npm run build
> ```
>
> Mong đợi exit 0, tạo dist. Không xóa DB/WAL/SHM khi dừng. Có shutdown hooks/đóng SQLite;
> không kill toàn bộ process Node. Dùng lại path để giữ dữ liệu; demo mới chọn path mới.
>
> Tùy chọn chạy compiled server, Terminal 1 giữ database/PORT đã chọn:
>
> ```sh
> NODE_ENV=production DEMO_IDENTITY_ENABLED=false npm run start:prod
> ```
>
> Cần build trước, giữ config/ bên cạnh dist/; GET / trả 200, claim API phải 403
> DEMO_IDENTITY_DISABLED. Đây không phải cấu hình production authentication hoàn chỉnh.
> Không đổi NODE_ENV sang development để vượt guard. npm start là lựa chọn chạy
> không watch; các script khác được liệt kê trong phần Windows ở trên.
>
> ### 8. Troubleshooting macOS/Linux
>
> | Lỗi | Cách xử lý |
> | --- | --- |
> | Command not found/EBADENGINE/module syntax error | Kiểm tra command -v node/npm và phiên bản; chọn Node 22.22.3+ nhánh 22.x, mở Terminal mới, npm ci cùng runtime. |
> | Native better-sqlite3/ABI/build fail | Không copy node_modules giữa OS/kiến trúc/Node. Kiểm tra tải binary/proxy; nếu compile cần Python/C++ và toolchain riêng macOS/distro như phần prerequisite. |
> | Permission denied khi cài | Dùng checkout do user sở hữu, sửa vị trí/quyền theo chính sách máy; không sudo npm ci hoặc chmod rộng để né lỗi. |
> | Missing script | Vào backend chứa package.json, không chạy npm start:dev từ repository root. Lệnh đúng là npm run start:dev. |
> | EADDRINUSE | Dừng request ghi, chọn PORT trống và cập nhật URL. Trên macOS có thể dùng lsof -nP -iTCP:31879 -sTCP:LISTEN; Linux có ss -ltnp nếu đã cài. Không giả định công cụ này có trên mọi distro, không kill process lạ. |
> | Curl connection refused | Đọc startup log, đúng cổng; log successfully started chưa đủ nếu sau đó có listen error. |
> | 401/403 | Đúng allowlisted header và export hai biến demo ở Terminal 1 rồi restart; production phải fail closed. Adjuster không tạo claim. |
> | 400/404 | Đúng body JSON/query/UUID/database/owner; không bỏ ownership hoặc validation. |
> | DATABASE_INITIALIZATION_FAILED | Path không rỗng, parent và WAL ghi được, file không phải directory; kiểm tra path in ở Terminal 1, không tạo DB thay thế khi tìm sai path. |
> | MIGRATION_DRIFT/MIGRATION_FAILED | Dừng, đối chiếu đúng DB/source. Khôi phục bộ applied SQL gốc đáng tin cậy; không sửa checksum/history/reset DB. Pending transaction lỗi được rollback. |
> | WORKFLOW_VERSION_CONFLICT/config invalid | Khôi phục đúng version hoặc tạo version mới, giữ config/ đúng vị trí/hợp lệ, không đổi pin claim cũ. |
> | STORAGE_BUSY/SQLITE_BUSY | Chờ writer; transition retry cùng command ID/payload, không xóa sidecars/DB. |
> | Observe telemetry warning | Kiểm tra HTTP/lỗi ứng dụng; placeholder telemetry không phải bằng chứng API hỏng. |
>
> Các mã transition/revision/cycle khác có cùng ý nghĩa như bảng Windows, không phụ
> thuộc shell. Không tự đổi revision hoặc reset lifetime counter để ép transition.
>
> ### 9. Trạng thái xác minh theo OS
>
> - **macOS:** có môi trường thực; kết quả chạy trong lần cập nhật này được báo riêng
>   ở phần tổng kết bên dưới. Cài mới/clone với Node 22.22.3 chưa được thực thi; runtime
>   sẵn có là Node 22.15.1/npm 10.9.2, thấp hơn engine một số tooling.
> - **Linux:** đã đối chiếu source, bash syntax và quy trình nhưng chưa thực thi trên
>   Linux. Docker daemon local không chạy; chạy bash trên macOS không chứng minh Linux.
> - **Windows:** giữ nguyên các commands PowerShell của phần trước; không có Windows/
>   PowerShell trong môi trường này nên chưa thực thi, không tuyên bố Windows pass.
> EOF````
> - Ran ````python3 - <<'PY'
> from pathlib import Path
> import re,subprocess,json
> s=Path('backend/README.md').read_text();section=s[s.index('<a id="macos-va-linux">'):];blocks=re.findall(r'```sh\n(.*?)```',section,re.S)
> for i,block in enumerate(blocks):
>  p=Path('/tmp')/f'cwo-unix-guide-{i}.sh';p.write_text(block)
>  for shell in ['bash','zsh']:subprocess.run([shell,'-n',str(p)],check=True)
> print('All Unix command blocks parse in bash and zsh')
> baseline=json.loads(Path('/tmp/cwo-unix-docs-baseline.json').read_text());old=bytes.fromhex(baseline['backend/README.md']).decode()
> assert re.findall(r'```powershell\n(.*?)```',old,re.S)==re.findall(r'```powershell\n(.*?)```',s,re.S)
> print('All existing PowerShell command blocks preserved exactly')
> for target in re.findall(r'\]\(([^)]+)\)',s):
>  if target.startswith('#'): continue
>  assert (Path('backend')/target).exists(),target
> print('Local Markdown links exist')
> PY
> export PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH
> npm test --prefix backend && npm run lint --prefix backend && npm run build --prefix backend && ./backend/node_modules/.bin/tsc -p backend/tsconfig.json --noEmit --incremental false````
> - Ran `export PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH
> npm run test:e2e`
> - Ran ````python3 - <<'PY'
> from pathlib import Path
> import re
> s=Path('backend/README.md').read_text().split('<a id="macos-va-linux">',1)[1];blocks=re.findall(r'```sh\n(.*?)```',s,re.S)
> startup=blocks[2]+"\nprintf '%s' \"$SQLITE_DATABASE_PATH\" > /tmp/cwo-unix-guide-db-path\n"+blocks[4]+blocks[5]
> Path('/tmp/cwo-unix-guide-start.sh').write_text('set -e\nexport PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH\n'+startup)
> PY````
> - Ran `bash -e /tmp/cwo-unix-guide-start.sh`
> - Ran `lsof -nP -iTCP:31879 -sTCP:LISTEN`
> - Ran ````lsof -p 18917 -Fn | rg 'claims.sqlite$'
> python3 - <<'PY'
> from pathlib import Path
> import re
> s=Path('../backend/README.md').read_text().split('<a id="macos-va-linux">',1)[1];blocks=re.findall(r'```sh\n(.*?)```',s,re.S)
> Path('/tmp/cwo-unix-guide-api.sh').write_text('set -e\nexport PATH=/Users/tranngochung/.nvm/versions/node/v22.15.1/bin:$PATH\n'+'\n'.join(blocks[6:10]))
> PY
> printf '%s\n' "$(cat /tmp/cwo-unix-guide-db-path)" | zsh /tmp/cwo-unix-guide-api.sh > /tmp/cwo-unix-guide-api.log 2>&1
> python3 - <<'PY'
> from pathlib import Path
> import re
> s=Path('/tmp/cwo-unix-guide-api.log').read_text();statuses=re.findall(r'HTTP/1.1 (\d+)',s);assert statuses==['200']*6,statuses;assert 'Hello World!' in s;assert '"items":[],"limit":10,"offset":0' in s;assert 'quick_check: ok' in s;assert 'foreign_key_check: []' in s;assert '005_payment_initiations' in s
> print('macOS zsh: root, claimant/adjuster list, detail/discovery/audit returned 200; creation returned a real ID; SQLite quick_check ok, no FK errors, migrations 001–005')
> PY````
>
> </details>
>
> Trên macOS, tôi đã chạy các khối tạo database và `start:dev` bằng bash, rồi chạy ví dụ API và kiểm tra SQLite bằng zsh. Các request đọc trả 200; tạo claim trả ID thật; SQLite báo `quick_check: ok`, không lỗi foreign key và đủ migrations 001–005.
>
> 217 unit tests, 113 E2E tests, build, lint và TypeScript đều qua. Tôi đang kiểm tra diff cuối và xác nhận dữ liệu hiện có không thay đổi; các khối lệnh PowerShell được giữ nguyên từng byte.
>
> <details><summary>Ran a command</summary>
>
> - Ran ````python3 - <<'PY'
> from pathlib import Path
> import json,hashlib,sqlite3,re
> p=Path('backend/README.md');s=p.read_text().replace('## 12. Phạm vi xác minh\n','## 12. Phạm vi xác minh của lần cập nhật Windows trước\n',1).replace('Kết quả chạy trong lần sửa này trên macOS: npm test (217 passed)', 'Kết quả của lần cập nhật Windows trước trên macOS: npm test (217 passed)',1)
> s += '''\nKết quả macOS của lần bổ sung Unix này: các khối tạo DB mới, preflight cổng và\nstart:dev trích từ tài liệu đã chạy bằng bash; các khối API và SQLite readiness\nđã chạy bằng zsh. Root, list claimant/adjuster, detail/discovery/audit đều trả 200;\ncreate trả claim ID thật; quick_check=ok, foreign_key_check=[], migrations 001–005.\nĐã dừng server test bằng Ctrl+C. npm test: 217 passed; npm run test:e2e: 113 passed;\nbuild, lint, TypeScript noEmit và git diff --check thành công. Mọi khối Unix parse\nđược bằng bash -n và zsh -n; đây không phải kiểm chứng execution trên Linux.\nKhông chạy npm ci/clone lại; dùng dependencies sẵn có với Node 22.15.1/npm 10.9.2.\n''';p.write_text(s)
> baseline=json.loads(Path('/tmp/cwo-unix-docs-baseline.json').read_text());Path('backend/tsconfig.build.tsbuildinfo').write_bytes(bytes.fromhex(baseline['backend/tsconfig.build.tsbuildinfo']))
> for name in ['backend/src/database/migrations.ts','backend/package.json','backend/package-lock.json']:assert Path(name).read_bytes()==bytes.fromhex(baseline[name]),name
> old=bytes.fromhex(baseline['backend/README.md']).decode();assert re.findall(r'```powershell\n(.*?)```',old,re.S)==re.findall(r'```powershell\n(.*?)```',s,re.S)
> p=Path.cwd()/'backend/data/claims.sqlite';c=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True);before=json.loads(Path('/tmp/cwo-unix-docs-db.json').read_text());assert all(hashlib.sha256(repr(c.execute('select * from "'+t+'" order by rowid').fetchall()).encode()).hexdigest()==h for t,h in before.items());c.close()
> print('PowerShell blocks, package scripts/lockfile, all migrations and existing DB contents/history preserved')
> PY
> git diff --check
> git diff -- README.md
> git status --short
> lsof -nP -iTCP:31879 -sTCP:LISTEN````
>
> </details>
</details>

Đã cập nhật:

- [backend/README.md](./backend/README.md): bổ sung quy trình macOS/Linux đầy đủ; giữ nguyên từng khối lệnh PowerShell.
- [README.md](./README.md): dẫn tới setup theo hệ điều hành trước các kịch bản demo.

Trước đó, hướng dẫn Unix chỉ nằm trong demo scenarios, thiếu quy trình clone, kiểm tra cổng, dùng database hiện có, SQLite readiness và troubleshooting đầy đủ.

Sau khi chọn **Node 22.22.3+ thuộc nhánh 22.x**, macOS/Linux dùng Terminal 1:

```sh
cd "$HOME"
git clone https://github.com/tranngochung13/claims-workflow-orchestrator.git &&
  cd claims-workflow-orchestrator/backend &&
  npm ci
```

Nếu thành công, tiếp tục tại `backend/`:

```sh
export CWO_DEMO_DIR="$(mktemp -d "${TMPDIR:-/tmp}/claims-demo.XXXXXX")"
test -n "$CWO_DEMO_DIR" && test -d "$CWO_DEMO_DIR" || exit 1
export SQLITE_DATABASE_PATH="$CWO_DEMO_DIR/claims.sqlite"
test ! -e "$SQLITE_DATABASE_PATH" || exit 1

export PORT=31879
export NODE_ENV=development
export DEMO_IDENTITY_ENABLED=true

node --input-type=module <<'JS'
import net from 'node:net';
const server = net.createServer();
server.once('error', error => {
  console.error(error.code);
  process.exitCode = 1;
});
server.listen(Number(process.env.PORT), () => server.close());
JS
```

Chỉ khi kiểm tra cổng thành công:

```sh
npm run start:dev
```

Terminal 2, sau khi startup không lỗi:

```sh
curl -i http://127.0.0.1:31879/
curl -i 'http://127.0.0.1:31879/api/claims?limit=10&offset=0' \
  -H 'X-Demo-Actor-Id: claimant-1'
```

Mong đợi **200 `Hello World!`** và **200** với `items: []`.

| Hệ điều hành | Xác minh |
|---|---|
| macOS | Đã chạy startup bằng bash, API/SQLite bằng zsh; 217 unit tests, 113 E2E tests, build/lint/TypeScript đều đạt. |
| Linux | Kiểm tra source và cú pháp bash; **chưa chạy trên Linux**, Docker daemon không hoạt động. |
| Windows | Các lệnh PowerShell giữ nguyên; **chưa chạy trên Windows**. |

`git diff --check` đạt. Chưa clone/cài dependencies lại; runtime thử nghiệm hiện có là Node 22.15.1/npm 10.9.2. Migrations, scripts, lockfile và dữ liệu database hiện có được xác nhận không thay đổi.

> # Claims Workflow Orchestrator — Technical Writeup
>
> ## Overview
>
> Claims Workflow Orchestrator is a configurable workflow engine for managing insurance claim lifecycles. It separates workflow definitions from execution logic so that states and transitions can be configured without rewriting the core engine, provided the required handlers already exist.
>
> ## Architecture
>
> The solution consists of:
>
> - **Frontend:** React, TypeScript, Vite, and Tailwind CSS for claim management, workflow actions, and audit history.
> - **Backend:** NestJS and TypeScript for workflow execution, API endpoints, authorization, and business rules.
> - **Persistence:** SQLite for claims, workflow versions, transition events, notifications, and command receipts.
> - **Workflow configuration:** JSON-based definitions describing states, transitions, permitted roles, and associated rules.
>
> ## Key Design Decisions
>
> ### Configurable state machine
>
> Workflow definitions are validated before execution. Claims are associated with a specific workflow version to preserve the meaning of their lifecycle as configurations evolve.
>
> ### Authorization and ownership
>
> The backend enforces role-based transition permissions and claim ownership. Authorization is checked on the server rather than relying on frontend visibility.
>
> ### Transactional transitions and idempotency
>
> Transition processing records the state change and related audit, notification, and command receipt data consistently. Command IDs support safe retries and prevent conflicting reuse.
>
> ### Information-request limits
>
> The workflow enforces the configured maximum number of information-request cycles for each claim.
>
> ### Auditability
>
> Transition history is persisted to support reviewing how a claim progressed through the workflow.
>
> ## Testing
>
> The project includes backend unit and integration tests and frontend tests. Refer to the committed test results for the actual test counts and scenario outcomes.
>
> ## Running the Project
>
> Follow the setup instructions in the repository README. The README should document prerequisites, environment configuration, database setup, startup commands, API verification, and test execution.
>
> ## Limitations and Future Improvements
>
> Potential future improvements include production identity integration, deployment automation, observability, and additional workflow configurations. These should be treated as future work unless already implemented.

<details><summary>2 previous messages</summary>

> Tôi sẽ đối chiếu bản writeup với code hiện tại rồi lưu thành tài liệu kỹ thuật trong repository, cập nhật các điểm về payment record, giới hạn ba lần và phạm vi xác thực production.
>
> <details><summary>Explored 2 files, a search, ran 3 commands</summary>
>
> - Ran `git status --short; rg --files docs; cat README.md; cat backend/config/claims.v2.json | head -35; rg -n 'recordPayment|transaction|immediate|receipt|fingerprint|UPDATE claims' backend/src/claims/transition.service.ts; cat backend/src/claims/transition-eligibility.ts; head -24 frontend/src/App.tsx; cat frontend/.env.example; rg -n '003_|004_|005_|no_update|no_delete' backend/src/database/migrations.ts; cat backend/src/claims/claims-http.ts | sed -n '30,55p'`
>
> <details><summary>Explored 2 files, a search</summary>
>
> - Read `./docs/technical-writeup.md`
> - Read `./backend/src/claims/transition-eligibility.ts`
> - Searched for `fingerprint|trim` in `transition-command.ts`
>
> </details>
>
> - Ran `sed -n '66,104p' docs/technical-writeup.md; git diff -- README.md; git diff --check; rg -n 'payment|uncertain|pending|randomUUID' frontend/src/components/TransitionActions.tsx backend/src/claims/lifecycle.spec.ts | head -14`
>
> - Ran ``python3 - <<'PY'
> from pathlib import Path
> p=Path('docs/technical-writeup.md');s=p.read_text();needle='in version 2; creation starts in `draft` before submission.\n';addition='''
> The configured paths after submission are:
>
> - Approval: `submitted → documents_verified → under_assessment → approved → payment_initiated → closed`.
> - Rejection: `submitted → documents_verified → under_assessment → rejected → closed`.
> - Information loop: `under_assessment → pending_info → documents_verified → under_assessment` before a decision.
>
> These paths come from [the version 2 configuration](../backend/config/claims.v2.json),
> not frontend transition definitions.
> ''';assert needle in s;s=s.replace(needle,needle+addition,1);p.write_text(s)
> import re
> for target in re.findall(r'\]\(([^)]+)\)',s):assert (p.parent/target).exists(),target
> print('Technical writeup local links verified')
> PY
> git diff --check
> git status --short``
>
> </details>
</details>

Đã đối chiếu và bổ sung [technical-writeup.md](./docs/technical-writeup.md) với các lifecycle thực tế, payment record cục bộ, transaction/idempotency, giới hạn ba lần và các hạn chế production.

Giữ nguyên liên kết writeup đã có trong README. Các liên kết nội bộ và `git diff --check` đều đạt. Không thay đổi code/database hoặc chạy lại tests cho chỉnh sửa tài liệu này.

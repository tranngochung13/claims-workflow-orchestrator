# Workflow configuration (Task 03)

`claims.v2.json` is the startup definition; `workflow.schema.json` is its
Draft 7 JSON Schema. The backend loads the file eagerly through WorkflowModule.
Missing, malformed, structurally invalid, or semantically invalid definitions
prevent provider creation and therefore application startup. No fallback exists.

Paths are resolved relative to the module URL, not the working directory. Source
and compiled layouts both resolve to `backend/config/`. Ship that directory
alongside `dist/`; `nest build` does not copy it into `dist`. Editing JSON requires
an application restart. No environment-controlled config path is exposed.

Consumers inject WorkflowConfigService and read its `definition`. The definition
is a defensive copy, recursively frozen, and readonly in TypeScript. The service
itself is frozen. Validation errors report at most 20 issues, bounded paths, and
reasons without echoing JSON values. JSON text is limited to 1 MiB.

## Configuration rules

- Identifiers match `^[a-z][a-z0-9_]{0,63}$` (1–64 lowercase ASCII characters,
  beginning with a letter). State and transition IDs are unique in their arrays.
- Schema version is 1. Workflow version is a positive safe integer.
- States (1–200) and transitions (1–1000) are required; labels are nonblank and
  limited to 120 characters. Unknown properties are rejected at every level.
- Initial/source/target references must exist. Initial state cannot be terminal;
  terminal states have no outgoing transitions. Every state must be reachable.
- Roles are the nonempty unique subset of claimant and adjuster.
- Input fields have unique names per transition, bounded labels, explicit
  required/minLength/maxLength properties, and a maximum length of 2000.
  Required fields need minLength >= 1; minLength cannot exceed maxLength.
  Runtime submission validation, including whitespace-only rejection for required
  text, belongs to transition execution in a later task.
- Preconditions use AND semantics. The only supported condition is
  claimFieldsPresent with a nonempty unique list from title and description.
- Effects are createNotification (recipient claimant; template
  information_requested, claim_approved, or claim_rejected) and
  recordPaymentInitiation (no arguments). Both use backend-owned local handlers.
- Optional kind information_request is the sole marker for shared cycle behavior.
  Every such transition uses root limits.informationRequests (1–3). No local
  counter, override, or alternative request behavior can be configured. Later
  runtime code must enforce/count this marker atomically; this loader does not
  infer intent from transition IDs or state names.
- Adding states/transitions using this vocabulary requires only JSON edits.
  New condition/effect capabilities need explicit schema/types/backend code.
  No code expressions, dynamic imports, URLs, or arbitrary handlers are allowed.

The initial definition includes submit, start_review, request_information,
provide_information, approve, and reject. Required message, response, and reason
fields have minLength 1 and maxLength 2000. Submit requires title and description.

## Verification

From backend, with a compatible Node runtime on PATH:

```sh
npm test
npm run build
npm run lint
```

The current local Node 22.15.1 runs these checks. Dependency installation reported
existing tooling engine requirements above that version (including Angular
Devkit's ^22.22.3 requirement) and a tsconfck/TypeScript 6 peer mismatch. Prefer a
runtime satisfying installed package engine requirements for clean setup; this
task does not upgrade the scaffold or claim those warnings are resolved.

Task 04 adds SQLite migrations and immutable workflow-version registration; see
../README.md for persistence and startup details. Claim-version pinning, actor
authentication, transition execution, input submission checks, and notification
creation remain deferred.

Version 2 (`claims.v2.json`) is the startup configuration for new claims. Version 1
remains immutable for existing pins. Version 2 adds document verification,
assessment, pending information, payment initiation and terminal closure.
`recordPaymentInitiation` writes an immutable local record in the transition's
transaction; it never calls a payment provider. It has no configurable arguments.
Only the existing notification effect requires a claimant recipient.

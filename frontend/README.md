# Claims Workflow Orchestrator — frontend

React + TypeScript + Vite + Tailwind CSS v4. The development demo uses only the
existing NestJS APIs: claims, action discovery, transition commands, and audit.

## Local development

Use the same supported Node runtime for installs/builds and the backend's native
SQLite addon. Checks were run with Node 22.15.1; some existing backend tooling
requires ^22.22.3 or a compatible newer major for a warning-free installation.

Start the backend with an explicit disposable database as described in
[the scenario guide](../docs/demo-scenarios.md), NODE_ENV=development, and
DEMO_IDENTITY_ENABLED=true. Then, from frontend/:

```sh
npm ci
cp .env.example .env.local
# Edit API_PROXY_TARGET to match the running backend origin/PORT.
npm run dev
```

Alternatively pass API_PROXY_TARGET directly to npm run dev. Vite requires it for
development, proxies relative /api calls to that origin, and does not expose it
to client code. No backend CORS weakening is needed. The example target uses the
backend's default port 3000; the isolated scenario guide uses 3109 instead.
Do not put secrets into VITE_* variables.

## Screens and behavior

- Paginated claim dashboard, real loading/empty/error states, creation and details.
- Three fixed allowlisted demo actor selections; the backend remains authoritative.
- Pinned workflow, revision, owner, request-cycle count/limit, discovered actions.
- Input forms generated from eligible actions' inputFields metadata.
- Read-only audit timeline with bounded page navigation.
- Stable backend errors, explicit refresh after conflicts, no automatic retries.
- An uncertain transition keeps its original command ID/input/revision for an
  explicit same-command retry. Navigation/actor/input changes are locked until
  resolution. Refreshing data does not replace that pending command.

The production build excludes the demo workspace and actor-selection module,
shows an unavailable notice, and sends no demo identity. `npm run preview` can
serve that production notice without API_PROXY_TARGET. There is no production
authentication adapter; the backend's production claim routes remain fail-closed.

## Checks

```sh
npm test
npm run build
npm run lint
npm run typecheck
```

Vitest, React Testing Library, and jsdom are development-only additions because
the scaffold had no frontend testing tools. Tests use explicit fixtures and mocks;
they are never imported into application screens. TypeScript strict checking is
enabled. Tests exercise state rendering, creation/navigation, discovered forms,
retry IDs, refresh behavior, actor isolation, errors, and production hiding.

## Demo scenarios and limitations

Follow [all five reproducible scenarios](../docs/demo-scenarios.md). Use fresh
claims and a separate disposable database; reset by choosing a NEW database path,
not by deleting a database containing user data.

The demo is deliberately development-only. Actor selection impersonates known
local actors and is not authentication. Navigation is in memory, with no routing
library or deep links. Pending transition context is retained in memory until
resolution, but not across a browser reload. Creation itself is non-idempotent;
after uncertain creation, check the list before submitting again. Offset pages
may move during concurrent writes. There are no notification reads, external
services, fake metrics, seeded production claims, or frontend workflow graph.

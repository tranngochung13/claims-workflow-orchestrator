# Claims Workflow Orchestrator

A configurable claims workflow with a NestJS/SQLite backend and a React/Vite
reviewer demo. States, role restrictions, preconditions, input forms, and local
side effects come from immutable, registered JSON workflow versions.

Start with [backend setup for Windows, macOS, and Linux](backend/README.md),
then follow the [five reproducible scenarios](docs/demo-scenarios.md).
Use an isolated disposable SQLite database for demonstrations; existing migration
history must not be edited or reset.

- [Frontend setup, checks, and limitations](frontend/README.md)
- [Backend setup, API examples, and checks](backend/README.md)
- [Workflow configuration vocabulary](backend/config/README.md)
- [Technical writeup](docs/technical-writeup.md)

The UI is development-only and requires the backend's development demo identity
flags. Production builds intentionally expose no impersonation controls or
production authentication bypass. No fake data is displayed as backend data.

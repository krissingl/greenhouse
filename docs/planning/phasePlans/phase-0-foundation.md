# Phase 0: Foundation

_Created: 2026-07-18 | Status: DRAFT_

## Goal

Stand up Greenhouse's technical foundation — a runnable Expo + React Native +
TypeScript app shell, wired to a self-initializing SQLite database, with the
project's layered folder structure, design system, and dev tooling in place —
so every later phase can build a vertical slice on solid ground.

## Context

This is the first phase; nothing precedes it. The repository today contains only
planning artifacts (`spec/`, `docs/`, `sessions/`) and two seed theme files at
`catchAll/light_theme.ts` and `catchAll/dark_theme.ts` — there is no `package.json`,
no `src/` directory, and no app scaffolding yet. Phase 0 starts from a clean slate.

Two sources shape this plan beyond the roadmap task list:

- `spec/PROJECT_SPEC.md` — the layered architecture (`presentation → application →
domain → persistence`, each layer talking only to the one directly below it),
  the `.claude/project-config.json` directory mapping for those layers, and the
  cross-cutting error-handling requirement that DB/migration failures must fail
  gracefully and never cause permanent data loss.
- `docs/planning/ux-design-intent.md` — explicit Phase 0 instructions for the
  seed theme files: both `catchAll/light_theme.ts` and `catchAll/dark_theme.ts`
  import a `Theme` type that does not exist yet, and `catchAll/` is a temporary
  drop, not the real design-system home. Phase 0 must define the `Theme` type,
  relocate both files into the real location (e.g. `src/theme/`), and wire theme
  selection to the on-device system light/dark preference.

Per the spec's Definition of Done, Phase 0's deliverable is narrower than later
phases: a running app that initializes the database successfully and provides the
basic shell. No domain entities (Interest, Constraint, Session, Reflection, Step)
are modeled or persisted in this phase — that begins in Phase 1. Building
entity-specific schema or repositories now would be pre-building utilities ahead
of need; Phase 0 establishes the _mechanism_ (migration runner, repository base
pattern), not the _content_.

## Steps

### Step 1: Scaffold the Expo + TypeScript project and layered folder structure

Initialize the Expo project (TypeScript template) at the repository root, alongside
the existing `spec/`, `docs/`, `sessions/`, and `.claude/` directories. Configure
`tsconfig.json` for strict mode. Create the `src/` directory skeleton matching the
four layers defined in `.claude/project-config.json`:
`src/screens`, `src/components`, `src/navigation` (presentation); `src/services`
(application); `src/domain` (domain); `src/repositories`, `src/db` (persistence).
Directories with no content yet get a placeholder (e.g. `.gitkeep`) — do not add
logic that belongs to a later step or phase. Update `.gitignore` for
`node_modules`, Expo build output, and other generated artifacts.

### Step 2: Configure ESLint and Prettier

Install and configure ESLint with TypeScript and React Native/Expo recommended
rules, plus Prettier for formatting, with the two integrated so lint and format
don't fight each other. Add `lint` and `format` scripts to `package.json`. Rules
should be strict enough to catch type and import errors early but not so bespoke
that they block later phases' velocity.

### Step 3: Set up navigation shell

Install React Navigation (native stack navigator). Create `src/navigation` with a
root navigator and one placeholder screen in `src/screens` (e.g. a "Home"
placeholder) so the app boots to a visible, navigable screen. This is scaffolding
only — no real screens or features; later phases add their own screens to this
navigator.

### Step 4: Establish the design system and theming

Per the design-intent doc: define the missing `Theme` type (shape ≈ `{ dark:
boolean; colors: {...}; spacing: {...}; radius: {...}; typography: {...};
elevation: {...}; animation: {...} }`, matching the fields already used by the
seed theme files) in the real design-system location, e.g. `src/theme/types.ts`.
Relocate `catchAll/light_theme.ts` and `catchAll/dark_theme.ts` into `src/theme/`
(e.g. `src/theme/lightTheme.ts`, `src/theme/darkTheme.ts`), updating their `Theme`
import to the new type location, and delete the now-empty `catchAll/` directory.
Build a `ThemeProvider`/`useTheme` hook that selects light or dark theme based on
the on-device system color-scheme preference (React Native's `Appearance`/
`useColorScheme`, no network involved). Wrap the app root (from Step 3) in the
provider so the placeholder screen already renders with theme colors, proving the
wiring works end-to-end.

### Step 5: Configure logging

Add a lightweight logging utility (e.g. `src/utils/logger.ts`) with levels
(debug/info/warn/error) and a console-based implementation for v1. This exists to
satisfy the spec's error-handling requirement — DB and migration failures (Steps
6–7) must fail gracefully and be diagnosable, never silently corrupt or lose data.
Keep it simple: a thin wrapper, not a logging framework.

### Step 6: Configure SQLite

Install `expo-sqlite`. Create `src/db/connection.ts` that opens the app database
(e.g. `greenhouse.db`), enables the `foreign_keys` pragma, and exposes a single
typed accessor used only within the persistence layer (`src/db`,
`src/repositories`) — consistent with the architecture rule that persistence
concerns must not leak upward.

### Step 7: Implement database migrations

Build a migration runner in `src/db/migrations/`: numbered migration files applied
in order, tracked in a `schema_migrations` bookkeeping table, each applied inside
a transaction so a failed migration cannot leave the database in a partial state.
On failure, log via Step 5's logger and fail gracefully rather than crash-losing
data, per the spec's error-handling requirement. The only migration in this phase
creates the `schema_migrations` table itself — no domain entity tables (Interest,
Constraint, Session, Reflection, Step) are created here; those arrive with the
phase that introduces each entity, starting with Interest in Phase 1. Wire the
migration run into app startup (e.g. on mount, before the navigation shell
renders) so launching the app is what satisfies the Phase 0 deliverable: "a
running application that initializes the database successfully."

### Step 8: Establish repository infrastructure

Add a shared repository pattern in `src/repositories` (e.g. a base
class/helper such as `withConnection` or `BaseRepository`) that future concrete
repositories (starting with `InterestRepository` in Phase 1) will build on. It
should provide a consistent way to access the Step 6 connection and a single
error-wrapping strategy that turns SQLite-level failures into typed errors before
they reach the application layer, honoring the architecture rule that persistence
concerns must not leak into domain logic. No concrete entity repository is built
in this phase.

### Step 9: Configure the testing framework

Set up Jest (via the `jest-expo` preset) with TypeScript support and React Native
Testing Library. Write the initial smoke tests that exercise this phase's only
real logic: the Step 6 connection opens successfully, the Step 7 migration runner
applies the baseline migration and is idempotent (running it twice does not fail
or duplicate), and the app shell (Step 3/4) renders without crashing. This is what
satisfies the spec's "critical business logic is tested" criterion for a phase
that has no domain logic yet — the initialization path _is_ the critical logic
here.

### Step 10 (Optional): Configure CI

Add a GitHub Actions workflow that installs dependencies and runs lint, typecheck,
and test on push/PR, using the scripts established in Steps 2 and 9. The roadmap
marks this optional — see Notes.

## Notes

- **Theme relocation destination is `src/theme/`.** This keeps design-system code
  inside the presentation layer's natural home and matches the design-intent
  doc's suggested location. Domain/application code must never import directly
  from `catchAll/`; that path ceases to exist after Step 4.
- **Migrations in this phase create only the bookkeeping table, not entity
  schema.** Entity tables are introduced incrementally, one phase at a time,
  starting with `Interest` in Phase 1 — this preserves the vertical-slice
  approach and avoids designing schema for entities (Constraint, Session,
  Reflection, Step) before the phase that needs them.
- **No concrete repositories are built in this phase.** Step 8 establishes only
  the shared pattern; `InterestRepository` and later entity repositories are
  Phase 1+ work.
- **Logging is intentionally minimal (console-based).** No external logging
  service or persistence of logs — Greenhouse is local-first and single-user, and
  the spec's error-handling concern is about graceful failure, not observability
  infrastructure.
- **CI (Step 10) is explicitly optional per both the spec's Feature Roadmap and
  `docs/ROADMAP.md`.** Flag this to the user at ticketing time so they can decide
  whether it becomes a ticket or is dropped for this phase.
- **Constraints carried from the spec:** offline-first with no network calls
  anywhere in this phase (theme selection reads on-device system preference only);
  TypeScript throughout; SQLite as the sole persistence mechanism; the layered
  architecture's one-way dependency rule applies even at scaffold stage — empty
  layer folders are created now, but no shortcuts (e.g. a screen importing
  `src/db` directly) are acceptable once later phases fill them in.

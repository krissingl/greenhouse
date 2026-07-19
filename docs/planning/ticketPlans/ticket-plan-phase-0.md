# Ticket Plan: Phase 0 — Foundation

**Purpose:** Stand up Greenhouse's technical foundation — a runnable Expo + React Native + TypeScript app shell wired to a self-initializing SQLite database, with the project's layered folder structure, design system, and dev tooling in place.
**Total tickets:** 10
**Prefix:** P0:
**Status: LOCKED**

---

## Ticket 1 of 10

**Title:** P0:Scaffold Expo TypeScript project and layered folder structure

**Description:**
Initialize the Expo project (TypeScript template) at the repository root alongside the existing `spec/`, `docs/`, `sessions/`, and `.claude/` directories. Create the `src/` skeleton matching the four architecture layers and configure strict TypeScript and `.gitignore` for generated artifacts.

**Acceptance Criteria:**

- [ ] Expo TypeScript project is initialized at the repository root and runs via the standard Expo start command without error.
- [ ] `tsconfig.json` has strict mode enabled.
- [ ] `src/screens`, `src/components`, `src/navigation`, `src/services`, `src/domain`, `src/repositories`, and `src/db` directories exist, each committed via a placeholder (e.g. `.gitkeep`) where empty.
- [ ] `.gitignore` excludes `node_modules`, Expo build output, and other generated artifacts.
- [ ] No logic beyond scaffolding (no screens, services, or repository implementations) exists in any of the new directories.

---

## Ticket 2 of 10

**Title:** P0:Configure ESLint and Prettier

**Description:**
Install and configure ESLint with TypeScript and React Native/Expo recommended rules, plus Prettier for formatting, integrated so the two tools do not conflict.

**Acceptance Criteria:**

- [ ] ESLint is configured with TypeScript and React Native/Expo recommended rule sets.
- [ ] Prettier is configured and integrated with ESLint (no rule conflicts when both run).
- [ ] `package.json` includes a `lint` script and a `format` script, both of which run successfully against the current codebase.
- [ ] Lint rules catch a deliberately introduced type or import error (verified manually during review).

**Dependencies:** Ticket 1 — requires the scaffolded project to configure against.

---

## Ticket 3 of 10

**Title:** P0:Set up navigation shell

**Description:**
Install React Navigation (native stack navigator) and create a root navigator with one placeholder screen so the app boots to a visible, navigable screen.

**Acceptance Criteria:**

- [ ] React Navigation native stack navigator is installed and configured in `src/navigation`.
- [ ] A placeholder "Home" screen exists in `src/screens` and is registered as the initial route.
- [ ] Running the app displays the placeholder screen with no navigation errors.
- [ ] No feature-specific screens or business logic are present — this is scaffolding only.

**Dependencies:** Ticket 1 — requires the scaffolded project and folder structure.

---

## Ticket 4 of 10

**Title:** P0:Establish design system and theming

**Description:**
Define the missing `Theme` type in `src/theme/`, relocate the seed theme files from `catchAll/` into their real home, and build a `ThemeProvider`/`useTheme` hook that selects light or dark theme from the on-device system color-scheme preference, wired into the app root so the placeholder screen renders themed.

**Acceptance Criteria:**

- [ ] A `Theme` type is defined (e.g. `src/theme/types.ts`) covering `dark`, `colors`, `spacing`, `radius`, `typography`, `elevation`, and `animation`, matching the fields used by the seed theme files.
- [ ] `catchAll/light_theme.ts` and `catchAll/dark_theme.ts` are relocated into `src/theme/` (e.g. `lightTheme.ts`, `darkTheme.ts`) with their `Theme` import updated to the new type location.
- [ ] The `catchAll/` directory no longer exists after relocation.
- [ ] A `ThemeProvider`/`useTheme` hook selects light or dark theme based on the on-device system color-scheme preference (via `Appearance`/`useColorScheme`), with no network calls involved.
- [ ] The app root from Ticket 3 is wrapped in `ThemeProvider`, and the placeholder screen visibly renders using theme colors.

**Dependencies:** Ticket 3 — wraps the navigation shell's app root.

---

## Ticket 5 of 10

**Title:** P0:Configure logging utility

**Description:**
Add a lightweight logging utility with debug/info/warn/error levels and a console-based implementation, to support graceful, diagnosable failure handling for the database and migration work in later tickets.

**Acceptance Criteria:**

- [ ] `src/utils/logger.ts` (or equivalent) exports a logger with `debug`, `info`, `warn`, and `error` methods.
- [ ] Each level logs to the console with a level indicator and message.
- [ ] The logger has no external service dependency and no log persistence.
- [ ] The implementation is a thin wrapper (no third-party logging framework introduced).

**Dependencies:** Ticket 1 — requires the scaffolded project.

---

## Ticket 6 of 10

**Title:** P0:Configure SQLite connection

**Description:**
Install `expo-sqlite` and create a typed connection accessor that opens the app database and enables foreign key enforcement, usable only within the persistence layer.

**Acceptance Criteria:**

- [ ] `expo-sqlite` is installed and added to project dependencies.
- [ ] `src/db/connection.ts` opens the app database (e.g. `greenhouse.db`) and enables the `foreign_keys` pragma on connection.
- [ ] A single typed accessor for the connection is exported from `src/db` and used only by code within `src/db` and `src/repositories`.
- [ ] Opening the connection succeeds when the app runs, verified by a manual run or the smoke test in Ticket 9.

**Dependencies:** Ticket 1 — requires the scaffolded project and `src/db` directory.

---

## Ticket 7 of 10

**Title:** P0:Implement database migration runner

**Description:**
Build a migration runner in `src/db/migrations/` that applies numbered migrations in order inside transactions, tracks applied migrations in a `schema_migrations` table, and fails gracefully with logging on error. The only migration in this phase creates the `schema_migrations` table itself.

**Acceptance Criteria:**

- [ ] Migration files in `src/db/migrations/` are numbered and applied in order.
- [ ] Each migration runs inside a transaction; a failed migration does not leave the database in a partial state.
- [ ] A `schema_migrations` bookkeeping table tracks which migrations have been applied.
- [ ] The only migration defined in this phase creates the `schema_migrations` table — no entity tables (Interest, Constraint, Session, Reflection, Step) are created.
- [ ] On migration failure, the error is logged via the Ticket 5 logger and the app does not crash or lose existing data.
- [ ] The migration runner is wired into app startup (runs before the navigation shell renders).
- [ ] Running the migration runner twice does not fail or duplicate the applied migration record.

**Dependencies:** Ticket 6 — requires the database connection; Ticket 5 — requires the logger.

---

## Ticket 8 of 10

**Title:** P0:Establish repository infrastructure

**Description:**
Add a shared repository pattern in `src/repositories` that future concrete repositories will build on, providing consistent access to the database connection and a single strategy for wrapping SQLite-level failures into typed errors before they reach the application layer.

**Acceptance Criteria:**

- [ ] A shared base (e.g. `BaseRepository` class or `withConnection` helper) exists in `src/repositories`.
- [ ] The shared base provides access to the Ticket 6 connection without exposing raw SQLite objects outside the persistence layer.
- [ ] SQLite-level errors are caught and re-thrown as typed errors defined within the persistence layer.
- [ ] No concrete entity repository (e.g. `InterestRepository`) is implemented in this ticket.

**Dependencies:** Ticket 6 — requires the database connection.

---

## Ticket 9 of 10

**Title:** P0:Configure testing framework and add foundation smoke tests

**Description:**
Set up Jest via the `jest-expo` preset with TypeScript support and React Native Testing Library, then write smoke tests covering this phase's real logic: the database connection, migration runner idempotency, and app shell rendering.

**Acceptance Criteria:**

- [ ] Jest is configured with the `jest-expo` preset, TypeScript support, and React Native Testing Library.
- [ ] `package.json` includes a `test` script that runs the suite successfully.
- [ ] A test verifies the Ticket 6 database connection opens successfully.
- [ ] A test verifies the Ticket 7 migration runner applies the baseline migration and that running it twice does not fail or duplicate records.
- [ ] A test verifies the app shell (navigation + theme provider from Tickets 3–4) renders without crashing.

**Dependencies:** Ticket 7 — requires the migration runner; Ticket 4 — requires the themed app shell.

---

## Ticket 10 of 10

**Title:** P0:Configure CI workflow for lint, typecheck, and test

**Description:**
Add a GitHub Actions workflow that installs dependencies and runs lint, typecheck, and test on push and pull request, using the scripts established in Tickets 2 and 9.

**Acceptance Criteria:**

- [ ] A GitHub Actions workflow file exists that triggers on push and pull request.
- [ ] The workflow installs project dependencies.
- [ ] The workflow runs the `lint` script from Ticket 2, a TypeScript typecheck, and the `test` script from Ticket 9.
- [ ] The workflow fails the run if any of lint, typecheck, or test fails.

**Dependencies:** Ticket 2 — requires the `lint` script; Ticket 9 — requires the `test` script.

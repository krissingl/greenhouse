# Phase 1: Interest Backlog (MVP)

_Created: 2026-07-18 | Status: DRAFT_

## Goal

Deliver a usable personal backlog: create an Interest with just a title, list it,
view its details, edit it, archive or hard-delete it, search, and filter by state.
This is Greenhouse's first true vertical slice — it exercises presentation,
application (services), domain, and persistence together for the first time.

## Context

Phase 0 is built and committed. It provides the mechanism this phase builds
content on top of, but models no domain entities yet:

- **Persistence:** `src/db/connection.ts` exposes a single typed `getDatabase()`
  accessor, used only within `src/db` and `src/repositories`. `src/db/migrationRunner.ts`
  applies numbered migrations from `src/db/migrations/` in order, each in its own
  transaction, tracked in `schema_migrations`; the only migration so far
  (`001_create_schema_migrations.ts`) creates that bookkeeping table. `src/db/bootstrap.ts`
  runs migrations at app startup and swallows failures after logging so the app
  never crash-loses data.
- **Repository base:** `src/repositories/BaseRepository.ts` is an abstract class
  exposing a `withConnection` helper that wraps SQLite failures into a typed
  `RepositoryError` (`src/repositories/errors.ts`). No concrete repository exists
  yet — `InterestRepository` is the first.
- **Presentation shell:** `src/theme/` (`ThemeProvider`/`useTheme`, light/dark
  tokens) is wired into `App.tsx`. `src/navigation/RootNavigator.tsx` defines a
  native-stack `RootStackParamList` with a single placeholder route, `Home`,
  rendering `src/screens/HomeScreen.tsx` (a static "Greenhouse" title, themed).
- **Empty layers:** `src/domain/` and `src/services/` contain only `.gitkeep` —
  nothing has been built there yet. This phase adds their first real content.

Two sources shape this plan beyond the roadmap's feature list (create/list/view/edit/
archive-or-delete/search/filter):

- `spec/PROJECT_SPEC.md` — the `Interest` entity (types `OneTimeProject` /
  `StructuredLearning` / `UnstructuredLearning`; states `Backlog` / `InProgress` /
  `Complete`; only a title required at creation), the **Archive = soft-delete flag**
  resolved decision (`archivedAt` timestamp, orthogonal to state; archived interests
  are hidden from default views but recoverable; delete is a separate permanent hard
  removal), the layered architecture's one-way call rule, and the indicative
  `InterestService`/`InterestRepository` contracts.
- `docs/planning/ux-design-intent.md` — "title first, alone… everything else is
  always optional and never gates the save," which shapes the create flow.

**Two contract gaps this phase resolves.** The spec explicitly calls its service/
repository signatures a "first-pass draft… expected to be refined as each phase is
implemented." Two refinements are needed to deliver this phase's roadmap features
and the Archive resolved decision:

1. `InterestService` lists `archive()` but not `delete()`, even though the roadmap
   feature is "Archive **or delete** interests" and `InterestRepository.remove()`
   already exists for it. This phase adds `InterestService.delete(id)`, thin
   orchestration over `InterestRepository.remove()`.
2. The Archive decision states archived interests are "recoverable," which requires
   a way back. This phase adds `InterestService.unarchive(id)` (clears `archivedAt`)
   alongside `archive()`.

Flag both additions to the user at ticketing time so `spec/CHANGELOG.md` can record
them if the user wants the spec kept current.

**Interest `type` is schema-present but not yet user-settable.** The spec's domain
model treats `type` as core to `Interest`, but the roadmap places "Interest type"
under Phase 2 ("Guided Interest Setup"), alongside the other enrichment axes
(time/energy/location/etc.). This phase's `interests` table and `InterestDetails`
type include a nullable `type` column/field so the schema doesn't need to change
shape in Phase 2, but no Phase 1 screen offers a way to set it — creation and
editing in this phase only ever touch `title` (and, for editing, `state`). Setting
`type` is Phase 2 UI work.

## Steps

### Step 1: Define the Interest domain model

In `src/domain/interest.ts`, define the entity shapes the rest of the phase builds
on: `InterestId` (string alias), `InterestType` (`'OneTimeProject' |
'StructuredLearning' | 'UnstructuredLearning'`), `InterestState` (`'Backlog' |
'InProgress' | 'Complete'`), `Interest` (`id`, `title`, `type: InterestType | null`,
`state`, `archivedAt: string | null`, `createdAt`, `updatedAt`), `NewInterest`
(`{ title: string } & Partial<{ type: InterestType }>` — matches the spec's
`create` signature), `InterestDetails` (`{ type: InterestType }` — the only
Interest-owned detail field in this phase; constraint-style axes are a separate
entity arriving in Phase 2), and `InterestFilter` (`{ state?: InterestState; type?:
InterestType; query?: string; includeArchived?: boolean }`). Add one pure domain
rule: a `validateTitle`/`assertValidTitle` function rejecting empty or
whitespace-only titles (trimmed) — the only business rule Phase 1 needs, since
title is the sole required field. Cover it with unit tests in
`src/domain/__tests__/interest.test.ts`. No persistence or UI code here.

### Step 2: Add the `interests` table migration

Add `src/db/migrations/002_create_interests.ts` following the `Migration`
interface and pattern established by `001_create_schema_migrations.ts`, and
register it in `src/db/migrations/index.ts`. Schema: `id TEXT PRIMARY KEY`,
`title TEXT NOT NULL`, `type TEXT` (nullable, `CHECK` constrained to the three
`InterestType` values or `NULL`), `state TEXT NOT NULL DEFAULT 'Backlog'`
(`CHECK` constrained to the three `InterestState` values), `archived_at TEXT`
(nullable ISO-8601), `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL`. Use a
`TEXT` (UUID) primary key rather than SQLite autoincrement — see Notes; this is
the convention later entity tables (Constraint, Session, Reflection, Step) should
follow. Extend `src/db/__tests__/migrationRunner.test.ts` (or a new test file) to
confirm the migration applies cleanly on top of `001` and is idempotent, matching
the existing test's pattern.

### Step 3: Implement `InterestRepository`

Add `src/repositories/InterestRepository.ts`, extending `BaseRepository` and
using its `withConnection` helper exclusively — no other file touches
`src/db/connection.ts` for Interest data. Implement the spec's repository
contract: `insert(NewInterest): Promise<Interest>` (generates the id and
timestamps, defaults `state` to `'Backlog'`), `findById(id): Promise<Interest |
null>`, `query(filter: InterestFilter): Promise<Interest[]>` (translates `state`/
`type`/`query`/`includeArchived` into a parameterized SQL `WHERE` clause — `query`
does a case-insensitive `LIKE` match on `title`, and rows with `archived_at NOT
NULL` are excluded unless `includeArchived` is true; filtering happens in SQL, not
in-memory, per the spec's search/filter latency concern), `update(id, patch:
Partial<Interest>): Promise<Interest>` (also bumps `updated_at`), and
`remove(id): Promise<void>` (hard delete row). Row↔domain mapping (SQLite row ⇄
`Interest`) is private to this file. Write repository tests
(`src/repositories/__tests__/InterestRepository.test.ts`) against a real
in-memory/test SQLite connection covering insert, findById (including not-found →
null), query filtering by each of state/type/query/includeArchived, update, and
remove.

### Step 4: Implement `InterestService`

Add `src/services/InterestService.ts`. Implements `create` (runs Step 1's title
validation, then calls `InterestRepository.insert`), `get`, `list` (passes
through to `InterestRepository.query`, defaulting `includeArchived` to `false`
when the caller omits it — this is what makes archived interests "hidden from
default views"), `update` (re-validates title if present in the patch), `setState`
(thin wrapper over `InterestRepository.update` that only touches `state`),
`archive` (sets `archivedAt` to now via `update`), and the two additions from
Context: `unarchive` (clears `archivedAt`) and `delete` (calls
`InterestRepository.remove`). The service is the only caller of
`InterestRepository` — no screen imports the repository directly. Unit-test the
service with a fake/mock repository, focused on the logic the service itself
owns: title validation on create/update, the `includeArchived` default, and that
`archive`/`unarchive`/`delete`/`setState` call the repository with the right
arguments.

### Step 5: Build the Interest List screen

Add `src/screens/InterestListScreen.tsx` and wire it into
`RootNavigator.tsx` as the new default route, replacing the Phase 0 `Home`
placeholder (`HomeScreen.tsx` is removed — see Notes). On mount (and on
navigation focus, so returning from Create/Edit/Detail reflects changes), calls
`InterestService.list()` and renders the results using a themed list item
component (e.g. `src/components/InterestListItem.tsx`, showing title and state).
Include a minimal empty state ("No interests yet") — not the polished Phase 8
version, just enough for the screen to make sense with zero data. Add a themed
"+" affordance that navigates to the Create screen (Step 6). Tapping a row
navigates to the Detail screen (Step 7), passing the interest id via the
navigator's param list. Search input and state-filter control are explicitly
out of scope for this step — Step 10 adds them once the base list works.

### Step 6: Build the Create Interest flow

Add `src/screens/CreateInterestScreen.tsx`, reachable from the List screen's "+"
affordance. Per the design-intent doc: **one field, alone** — a title text input
and a Save action, nothing else. Save is disabled/no-ops on an empty/whitespace
title (mirroring Step 1's domain rule, surfaced as inline UI feedback rather than
a blocking alert) and otherwise calls `InterestService.create({ title })`,
then navigates back to the List screen. No type picker, no other fields — those
are explicitly Phase 2. Add the route to `RootNavigator`'s param list.

### Step 7: Build the Interest Detail screen

Add `src/screens/InterestDetailScreen.tsx`, reached by tapping a List row.
Displays the interest's title, state, and type (or "not set" if `null`), plus
created/updated timestamps. Provides entry points (not the logic itself) to Edit
(Step 8) and to Archive/Unarchive/Delete (Step 9) — those steps implement what
happens when the entry points are used. Fetches via `InterestService.get(id)`;
handles the not-found case (e.g. the interest was deleted elsewhere) by showing a
short message and a way back to the list rather than crashing. Add the route
(with an `interestId` param) to `RootNavigator`.

### Step 8: Build Edit Interest (title and state)

Add `src/screens/EditInterestScreen.tsx`, reached from the Detail screen. Lets
the user change the title (same validation as Create) and the state
(`Backlog`/`InProgress`/`Complete` — a segmented control or equivalent, since
Phase 1 has no other mechanism yet to move an interest between states). Title
changes call `InterestService.update`; state changes call
`InterestService.setState`. Saving returns to the Detail screen, which reflects
the change (re-fetch on focus). Add the route to `RootNavigator`.

### Step 9: Implement Archive, Unarchive, and Delete

On the Detail screen, add an Archive action for non-archived interests (calls
`InterestService.archive`, returns to the List screen since the interest now
falls out of the default view) and, for archived interests, an Unarchive action
in its place (calls `InterestService.unarchive`). Add a Delete action, gated
behind a confirmation prompt (irreversible, unlike Archive) that calls
`InterestService.delete` and returns to the List screen on confirm. To satisfy
"recoverable" from the Archive resolved decision, add a way to reach archived
interests from the List screen — the simplest option consistent with Step 10's
filter UI is an "Archived" filter value alongside the state filters, using
`InterestService.list({ includeArchived: true, ... })` (see Notes on exact
placement).

### Step 10: Add search and filter-by-state to the List screen

Extend `InterestListScreen` with a search input (debounced, filters by title
substring) and a state-filter control (`Backlog` / `InProgress` / `Complete` /
`All`, plus the `Archived` option from Step 9). Both drive
`InterestService.list`'s `query`/`state`/`includeArchived` filter parameters —
filtering happens server-side (in SQLite, per Step 3), not by filtering an
already-fetched in-memory array, so behavior stays correct as the backlog grows.
Combine search and state filter (both can be active at once).

## Notes

- **Two contract additions beyond the spec's first-pass draft:**
  `InterestService.delete()` and `InterestService.unarchive()`. Both are directly
  required by this phase's roadmap features and the Archive resolved decision;
  flag to the user at ticketing time so `spec/CHANGELOG.md` can be updated if
  they want the spec's "first-pass draft" brought current.
- **UUID primary keys, not autoincrement integers.** `interests.id` is `TEXT`
  (UUID), diverging from `schema_migrations`' `INTEGER PRIMARY KEY`. This is a
  precedent for every later entity table (Constraint, Session, Reflection, Step)
  — domain entity ids should be stable, exportable strings, not
  connection-local autoincrement values, given Phase 8's planned SQLite-file
  backup/export.
- **Repositories may import domain-defined types.** The layered architecture's
  call direction is strictly top-down (presentation → application → domain →
  persistence), but `InterestRepository` needs to accept/return domain-shaped
  values (`Interest`, `NewInterest`, `InterestFilter`) to do its job — it never
  calls "up" into `src/services` or `src/domain` logic, it only borrows their
  type definitions. This is the first phase exercising that pattern; later
  repositories should follow the same convention.
- **`HomeScreen.tsx` is removed, not kept alongside the list.** Phase 0's
  placeholder is superseded by `InterestListScreen` as the app's default route
  in this phase. Phase 7 (Dashboard & Analytics) will introduce a true dashboard
  as the new root screen, at which point today's list becomes a secondary
  "Backlog" view reachable from it — that re-routing is Phase 7's concern, not
  this phase's.
- **`type` is schema-present, not user-settable.** The `interests` table and
  `InterestDetails` include `type` now so Phase 2 doesn't require a schema
  migration to add it, but no Phase 1 screen exposes a type picker — that UI,
  and the rest of guided setup, is Phase 2 per the roadmap.
- **Constraint, Session, Reflection, and Step entities are untouched.** No
  tables, repositories, or services for them exist yet; they arrive in Phases
  2, 4, 5/6, and 2 respectively, per the Feature Roadmap.
- **Deferred to Phase 8 (Polish):** the polished empty-state design, animations,
  accessibility pass, and further search/performance tuning. Step 5/10 build the
  minimum needed for the screen to be usable now, not the final version.
- **Tests are embedded per step, not a separate final step.** Unlike Phase 0
  (whose only real logic was initialization plumbing), every layer in this phase
  carries real business logic — domain validation, repository query
  correctness, service orchestration — so each step's ticket includes its own
  tests, satisfying the spec's "critical business logic is tested" Definition
  of Done per step rather than in one bolted-on pass at the end.

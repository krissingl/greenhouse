# Ticket Plan: Phase 1 — Interest Backlog (MVP)

**Purpose:** Deliver Greenhouse's first vertical slice — create, list, view, edit, archive/unarchive, delete, search, and filter Interests — exercising presentation, application, domain, and persistence together for the first time.
**Total tickets:** 10
**Prefix:** P1:
**Status: LOCKED**

---

## Ticket 1 of 10

**Title:** P1:Define the Interest domain model

**Description:**
In `src/domain/interest.ts`, define the entity shapes the rest of the phase builds on — `InterestId`, `InterestType`, `InterestState`, `Interest`, `NewInterest`, `InterestDetails`, and `InterestFilter` — plus the one pure business rule this phase needs: title validation.

**Acceptance Criteria:**
- [ ] `src/domain/interest.ts` defines `InterestId` (string alias), `InterestType` (`'OneTimeProject' | 'StructuredLearning' | 'UnstructuredLearning'`), and `InterestState` (`'Backlog' | 'InProgress' | 'Complete'`).
- [ ] `Interest` is defined with `id`, `title`, `type: InterestType | null`, `state`, `archivedAt: string | null`, `createdAt`, `updatedAt`.
- [ ] `NewInterest` is defined as `{ title: string } & Partial<{ type: InterestType }>`.
- [ ] `InterestDetails` is defined as `{ type: InterestType }`.
- [ ] `InterestFilter` is defined as `{ state?: InterestState; type?: InterestType; query?: string; includeArchived?: boolean }`.
- [ ] A `validateTitle`/`assertValidTitle` function rejects empty or whitespace-only titles (after trimming) and accepts valid non-empty titles.
- [ ] `src/domain/__tests__/interest.test.ts` covers the title validation rule for both rejection and acceptance cases.
- [ ] No persistence or UI code exists in `src/domain/interest.ts`.

---

## Ticket 2 of 10

**Title:** P1:Add the interests table migration

**Description:**
Add `src/db/migrations/002_create_interests.ts`, following the `Migration` interface and pattern established by `001_create_schema_migrations.ts`, to create the `interests` table with a UUID primary key.

**Acceptance Criteria:**
- [ ] `src/db/migrations/002_create_interests.ts` implements the `Migration` interface and is registered in `src/db/migrations/index.ts`.
- [ ] The migration creates an `interests` table with columns: `id TEXT PRIMARY KEY`, `title TEXT NOT NULL`, `type TEXT` (nullable, `CHECK` constrained to the three `InterestType` values or `NULL`), `state TEXT NOT NULL DEFAULT 'Backlog'` (`CHECK` constrained to the three `InterestState` values), `archived_at TEXT` (nullable), `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL`.
- [ ] The migration runs inside a transaction, consistent with the Phase 0 migration runner's guarantees.
- [ ] A test (extending `src/db/__tests__/migrationRunner.test.ts` or a new file) confirms migration `002` applies cleanly on top of `001` and that running the migration set twice does not fail or duplicate the applied-migration record.
- [ ] No repository or service code is added in this ticket.

**Dependencies:** Ticket 1 — the table's `type`/`state` CHECK constraints must match the `InterestType`/`InterestState` domain values.

---

## Ticket 3 of 10

**Title:** P1:Implement InterestRepository

**Description:**
Add `src/repositories/InterestRepository.ts`, extending `BaseRepository` and using its `withConnection` helper exclusively, implementing insert/findById/query/update/remove against the `interests` table with SQL-level filtering.

**Acceptance Criteria:**
- [ ] `InterestRepository` extends `BaseRepository` and is the only file (besides `src/db`) that touches the `interests` table.
- [ ] `insert(newInterest: NewInterest): Promise<Interest>` generates the id and timestamps and defaults `state` to `'Backlog'`.
- [ ] `findById(id): Promise<Interest | null>` returns `null` when no row matches.
- [ ] `query(filter: InterestFilter): Promise<Interest[]>` translates `state`, `type`, `query` (case-insensitive `LIKE` match on title), and `includeArchived` into a parameterized SQL `WHERE` clause, with filtering performed in SQL rather than in-memory.
- [ ] `query` excludes rows with a non-null `archived_at` unless `includeArchived` is `true`.
- [ ] `update(id, patch: Partial<Interest>): Promise<Interest>` persists the patch and bumps `updated_at`.
- [ ] `remove(id): Promise<void>` permanently deletes the row.
- [ ] Row-to-domain mapping is private to `InterestRepository.ts` and not exported.
- [ ] `src/repositories/__tests__/InterestRepository.test.ts` runs against a real in-memory/test SQLite connection and covers insert, findById (found and not-found), query filtering by each of state/type/query/includeArchived independently, update, and remove.

**Dependencies:** Ticket 2 — requires the `interests` table; Ticket 1 — requires the domain types the repository accepts and returns.

---

## Ticket 4 of 10

**Title:** P1:Implement InterestService

**Description:**
Add `src/services/InterestService.ts` as the sole caller of `InterestRepository`, orchestrating create/get/list/update/setState/archive/unarchive/delete, including title (re)validation and the default-hides-archived list behavior.

**Acceptance Criteria:**
- [ ] `create(newInterest)` runs title validation before calling `InterestRepository.insert`, and rejects an empty/whitespace-only title without reaching the repository.
- [ ] `get(id)` delegates to `InterestRepository.findById`.
- [ ] `list(filter?)` delegates to `InterestRepository.query`, defaulting `includeArchived` to `false` when the caller omits it.
- [ ] `update(id, patch)` re-validates the title when the patch includes one, before delegating to `InterestRepository.update`.
- [ ] `setState(id, state)` delegates to `InterestRepository.update`, touching only the `state` field.
- [ ] `archive(id)` sets `archivedAt` to the current time via `InterestRepository.update`.
- [ ] `unarchive(id)` clears `archivedAt` via `InterestRepository.update`.
- [ ] `delete(id)` delegates to `InterestRepository.remove`.
- [ ] `src/services/__tests__/InterestService.test.ts` uses a fake/mock repository and verifies: title validation on create and update, the `includeArchived` default on `list`, and that `archive`/`unarchive`/`delete`/`setState` each call the mock repository with the correct arguments.
- [ ] No screen or component in this ticket imports `InterestRepository` directly.

**Dependencies:** Ticket 3 — requires `InterestRepository`; Ticket 1 — requires the domain title-validation rule.

---

## Ticket 5 of 10

**Title:** P1:Build the Interest List screen

**Description:**
Add `src/screens/InterestListScreen.tsx` as the app's new default route, replacing the Phase 0 `HomeScreen` placeholder, listing Interests via `InterestService.list()` with a minimal empty state and navigation to Create and Detail.

**Acceptance Criteria:**
- [ ] `InterestListScreen.tsx` calls `InterestService.list()` on mount and on navigation focus, and renders results via a themed `InterestListItem` component showing title and state.
- [ ] A minimal empty state ("No interests yet" or equivalent) renders when the list is empty.
- [ ] A themed "+" affordance is present and navigates to the Create Interest screen's route.
- [ ] Tapping a list row navigates to the Detail screen's route, passing the interest id via the navigator's param list.
- [ ] `RootNavigator.tsx` is updated so `InterestListScreen` is the initial/default route, and `HomeScreen.tsx` is removed from the codebase.
- [ ] No search input or state-filter control is present in this ticket (explicitly deferred to Ticket 10).

**Dependencies:** Ticket 4 — requires `InterestService.list`.

---

## Ticket 6 of 10

**Title:** P1:Build the Create Interest flow

**Description:**
Add `src/screens/CreateInterestScreen.tsx`, reachable from the List screen's "+" affordance, offering only a title input and a Save action per the design-intent doc's "one field, alone" principle.

**Acceptance Criteria:**
- [ ] `CreateInterestScreen.tsx` presents a title text input and a Save action, with no type picker or other fields.
- [ ] Save is disabled or no-ops (with inline feedback, not a blocking alert) when the title is empty or whitespace-only.
- [ ] On a valid title, Save calls `InterestService.create({ title })` and navigates back to the List screen.
- [ ] The newly created interest appears in the List screen's results after returning (verified via the focus-triggered refresh from Ticket 5).
- [ ] The route is registered in `RootNavigator`'s param list and reachable from the List screen's "+" affordance.

**Dependencies:** Ticket 4 — requires `InterestService.create`; Ticket 5 — requires the List screen's "+" affordance and post-save destination.

---

## Ticket 7 of 10

**Title:** P1:Build the Interest Detail screen

**Description:**
Add `src/screens/InterestDetailScreen.tsx`, reached by tapping a List row, displaying an interest's full read state and providing entry points to Edit and to Archive/Unarchive/Delete.

**Acceptance Criteria:**
- [ ] `InterestDetailScreen.tsx` fetches the interest via `InterestService.get(id)` using the `interestId` route param.
- [ ] The screen displays title, state, type (or "not set" when `null`), `createdAt`, and `updatedAt`.
- [ ] When `get(id)` returns no interest (not-found case), the screen shows a short message and a way back to the List screen instead of crashing.
- [ ] The screen provides a visible entry point to the Edit screen (navigation only; edit logic lands in Ticket 8).
- [ ] The screen provides visible entry points for Archive/Unarchive/Delete (navigation/action hooks only; behavior lands in Ticket 9).
- [ ] The route (with an `interestId` param) is registered in `RootNavigator`'s param list.

**Dependencies:** Ticket 4 — requires `InterestService.get`; Ticket 5 — requires the List screen's row navigation into Detail.

---

## Ticket 8 of 10

**Title:** P1:Build Edit Interest (title and state)

**Description:**
Add `src/screens/EditInterestScreen.tsx`, reached from the Detail screen, letting the user change an interest's title and state.

**Acceptance Criteria:**
- [ ] `EditInterestScreen.tsx` presents an editable title field (same empty/whitespace validation as Create) and a state control covering `Backlog`/`InProgress`/`Complete`.
- [ ] Saving a title change calls `InterestService.update` with the new title.
- [ ] Saving a state change calls `InterestService.setState` with the new state.
- [ ] An invalid (empty/whitespace) title blocks save with inline feedback, matching Create's behavior.
- [ ] Saving returns to the Detail screen, and the Detail screen reflects the change (via its focus-triggered re-fetch).
- [ ] The route is registered in `RootNavigator`'s param list and reachable from the Detail screen's Edit entry point.

**Dependencies:** Ticket 4 — requires `InterestService.update`/`setState`; Ticket 7 — requires the Detail screen's Edit entry point.

---

## Ticket 9 of 10

**Title:** P1:Implement Archive, Unarchive, and Delete

**Description:**
Wire the Detail screen's Archive/Unarchive/Delete entry points to `InterestService`, including a confirmation prompt for the irreversible Delete action, and add an "Archived" filter value so archived interests remain reachable from the List screen.

**Acceptance Criteria:**
- [ ] For a non-archived interest, the Detail screen's Archive action calls `InterestService.archive(id)` and, on success, navigates back to the List screen.
- [ ] For an archived interest, the Detail screen shows an Unarchive action in place of Archive, which calls `InterestService.unarchive(id)`.
- [ ] The Delete action is gated behind a confirmation prompt; confirming calls `InterestService.delete(id)` and navigates back to the List screen; cancelling leaves the interest unchanged.
- [ ] An "Archived" filter value is available (control placement may be finalized alongside Ticket 10's filter UI) that, when selected, calls `InterestService.list({ includeArchived: true, ... })` so archived interests are reachable from the List screen.
- [ ] An interest archived via this ticket's Archive action is confirmed reachable again via the Archived filter, and Unarchive returns it to the default (non-archived) list view.

**Dependencies:** Ticket 4 — requires `InterestService.archive`/`unarchive`/`delete`; Ticket 7 — requires the Detail screen's action entry points.

---

## Ticket 10 of 10

**Title:** P1:Add search and filter-by-state to the List screen

**Description:**
Extend `InterestListScreen` with a debounced search input and a state-filter control (`Backlog`/`InProgress`/`Complete`/`All`/`Archived`), both driving `InterestService.list`'s filter parameters server-side.

**Acceptance Criteria:**
- [ ] A debounced search input filters the list by title substring via `InterestService.list`'s `query` parameter, not by filtering an already-fetched in-memory array.
- [ ] A state-filter control offers `Backlog`, `InProgress`, `Complete`, `All`, and `Archived`, each mapping to the corresponding `InterestService.list` filter parameters (`Archived` maps to `includeArchived: true` as established in Ticket 9).
- [ ] Search and state filter can be active simultaneously, and the displayed list reflects both constraints combined.
- [ ] Clearing the search input or resetting the filter to `All` returns the list to the full default (non-archived) view.
- [ ] No client-side array filtering of an already-fetched full list is used to implement search or state filtering.

**Dependencies:** Ticket 5 — requires the base List screen; Ticket 9 — requires the `Archived` filter option to be defined.

---

## Flag for the user

The phase plan calls out two additions to the spec's "first-pass draft" service contract, both required to deliver this phase's roadmap features and the Archive resolved decision:

- `InterestService.delete(id)` — the roadmap feature is "Archive **or delete** interests," but the spec's `InterestService` draft lists only `archive()`.
- `InterestService.unarchive(id)` — required to satisfy the Archive decision's "recoverable" requirement; not present in the spec's draft contract.

Both are built into Ticket 4. Consider whether `spec/PROJECT_SPEC.md` / `spec/CHANGELOG.md` should be updated to record them as the contract is refined.

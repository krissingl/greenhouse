# Ticket Plan: Phase 2.5 — Interest Shapes (Tasks)

**Purpose:** Remodel the three Interest types into three genuinely different container shapes — add the `Task` entity (`repeatable`/`sequenced`), derive `type` from two behavioral answers instead of asking it, move constraints to whichever level (Interest or Task) the type implies with per-dimension override, replace the single guided-setup flow with a per-type flow, and add Task completion with re-arm. Unblocks Phase 3.
**Total tickets:** 10
**Prefix:** P2.5:
**Status: LOCKED**

---

## Ticket ordering note (deviation from the phase plan's step numbering)

Every phase-plan step maps to exactly one ticket — no splits, no merges. **Tickets 6 and 7 are ordered opposite the phase plan's Step 6/Step 7 numbering.** The phase plan's Step 6 (`GuidedSetupScreen` rework) explicitly consumes the phase plan's Step 7 (`TaskQuickAddList`) inside its `StructuredLearning`/`UnstructuredLearning` branches ("render the Task quick-add sub-flow (Step 7, ordered mode)"). Ticket ordering must reflect what each ticket can actually build on, per the brief's instruction, so `TaskQuickAddList` is ticketed first (Ticket 6) and `GuidedSetupScreen` second (Ticket 7). No other reordering was made; every other ticket follows the phase plan's step sequence.

---

## Ticket 1 of 10

**Title:** P2.5:Add the Task domain model, derived-type inference, and Task-or-Interest Constraint ownership

**Description:**
Adds `src/domain/task.ts` (the `Task` entity and its state-transition rule), extends `src/domain/interest.ts` with the two type-inference answer fields and the pure `inferInterestType` function, and widens `src/domain/constraint.ts` so a `Constraint` can belong to either an Interest or a Task. Pure domain logic only — no persistence or UI.

**Acceptance Criteria:**
- [ ] `src/domain/task.ts` defines `TaskId` (string alias), `TaskMode` (`'repeatable' | 'sequenced'`), `TaskState` (`'armed' | 'done' | 'closed'`), `Task` (`id`, `interestId`, `title`, `mode`, `state`, `position`, `createdAt`, `updatedAt`), `NewTask` (`interestId`, `title` only — no `mode`/`position`), and `TaskPatch` = `Partial<Pick<Task, 'title' | 'position' | 'state'>>`.
- [ ] `validateTaskTitle`/`assertValidTaskTitle` reject a blank/whitespace-only title, mirroring `interest.ts`'s existing title-validation pattern.
- [ ] `nextTaskState(mode: TaskMode, rearm: boolean): TaskState` returns `'done'` for `mode === 'sequenced'` regardless of `rearm`; returns `'armed'` for `mode === 'repeatable', rearm: true` and `'closed'` for `mode === 'repeatable', rearm: false`.
- [ ] `assertValidCompletionRequest(mode, rearm)` throws when `mode === 'sequenced' && rearm === true`; does not throw for any other combination.
- [ ] `src/domain/interest.ts`'s `Interest` gains `oneSittingAnswer: 'Yes' | 'No' | null` and `orderedStepsAnswer: 'Yes' | 'No' | null`; `InterestPatch`'s `Pick` union is widened to include both fields.
- [ ] `inferInterestType(oneSitting: 'Yes' | 'No' | null, orderedSteps: 'Yes' | 'No' | null): InterestType | null` implements exactly: `('Yes', *)` → `OneTimeProject`; `('No', 'Yes')` → `StructuredLearning`; `('No', 'No')` → `UnstructuredLearning`; `(null, *)` → `null`; `('No', null)` → `null`.
- [ ] `InterestType`, `InterestState`, and `displayLabel` are unchanged — no identifiers or labels removed.
- [ ] `src/domain/constraint.ts`'s `Constraint.interestId` changes from `InterestId` to `InterestId | null`; `Constraint` gains `taskId: TaskId | null`.
- [ ] `assertValidConstraintOwner(interestId, taskId): void` throws unless exactly one of the two arguments is non-null.
- [ ] `constraintOwner(c: Constraint): { interestId: InterestId } | { taskId: TaskId }` returns the narrowed non-null owner.
- [ ] `resolveEffectiveConstraint(taskConstraint: Constraint | undefined, umbrellaConstraint: Constraint | undefined): Constraint | undefined` returns `taskConstraint` when its `status` is `'Set'` or `'None'`; otherwise returns `umbrellaConstraint`; otherwise returns `undefined`.
- [ ] `findConstraint`'s existing signature and dimension-only lookup behavior are unchanged.
- [ ] `src/domain/__tests__/task.test.ts` (new) covers `nextTaskState` for both modes and both `rearm` values, and `assertValidCompletionRequest`'s rejection case plus its accepted cases.
- [ ] `src/domain/__tests__/interest.test.ts` is extended to cover all five rows of `inferInterestType`'s truth table.
- [ ] `src/domain/__tests__/constraint.test.ts` is extended to cover `assertValidConstraintOwner`'s accept/reject cases and `resolveEffectiveConstraint`'s three branches (Task wins, Task falls back, neither present).
- [ ] No file touched in this ticket imports from `src/repositories`, `src/services`, `src/screens`, or `src/components`.

---

## Ticket 2 of 10

**Title:** P2.5:Add migrations 008–011 for type-inference columns, Tasks, task_completions, and widened Constraint ownership

**Description:**
Adds the four migrations this phase needs: the two new type-inference columns on `interests` with a backfill from existing `type` values, the `tasks` and `task_completions` tables, and a full-table rebuild of `constraints` so a row can belong to either an Interest or a Task.

**Acceptance Criteria:**
- [ ] `008` (new) is registered in `src/db/migrations/index.ts`, adds `one_sitting_answer TEXT CHECK (one_sitting_answer IN ('Yes','No') OR one_sitting_answer IS NULL)` and `ordered_steps_answer` with the identical `CHECK` shape to `interests` via `ALTER TABLE ... ADD COLUMN`.
- [ ] `008`'s `up` step backfills every existing row exactly per the phase plan's table: `type = 'OneTimeProject'` → `('Yes', NULL)`; `type = 'StructuredLearning'` → `('No', 'Yes')`; `type = 'UnstructuredLearning'` → `('No', 'No')`; `type IS NULL` → `(NULL, NULL)`. `typeSkippedAt`, `archived_at`, and `due_by` are untouched by this migration.
- [ ] `009` (new) creates `tasks`: `id TEXT PRIMARY KEY`, `interest_id TEXT NOT NULL REFERENCES interests(id) ON DELETE CASCADE`, `title TEXT NOT NULL`, `mode TEXT NOT NULL CHECK (mode IN ('repeatable','sequenced'))`, `state TEXT NOT NULL CHECK (state IN ('armed','done','closed')) DEFAULT 'armed'`, `position INTEGER NOT NULL`, `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL`. No `UNIQUE` constraint on `position`.
- [ ] `010` (new) creates `task_completions`: `id TEXT PRIMARY KEY`, `task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE`, `completed_at TEXT NOT NULL`, `rearmed INTEGER NOT NULL DEFAULT 0`.
- [ ] `011` (new) rebuilds `constraints`: creates `constraints_new` with `interest_id TEXT REFERENCES interests(id) ON DELETE CASCADE` now nullable, a new `task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE`, `CHECK ((interest_id IS NULL) <> (task_id IS NULL))`, and two partial unique indexes replacing the old single `UNIQUE (interest_id, dimension)` — one on `(interest_id, dimension) WHERE interest_id IS NOT NULL`, one on `(task_id, dimension) WHERE task_id IS NOT NULL`. Every existing row is copied across with `task_id = NULL`; the old table is dropped and `constraints_new` renamed to `constraints`.
- [ ] All four migrations are registered in order (`008`, `009`, `010`, `011`) and each runs inside a transaction, consistent with the existing migration runner's guarantees.
- [ ] `src/db/__tests__/migrationRunner.test.ts` is extended to confirm `008`–`011` apply cleanly on top of `001`–`007` and that running the full migration set twice does not fail or duplicate applied-migration records.
- [ ] A dedicated test confirms `008`'s backfill produces the exact `(oneSittingAnswer, orderedStepsAnswer)` pair for each of the four `type`/`typeSkippedAt` combinations in the phase plan's Context table.
- [ ] A dedicated test confirms `011` preserves every pre-existing `constraints` row with `task_id = NULL`, and that the `CHECK` constraint rejects an insert with both `interest_id` and `task_id` set and an insert with neither set.
- [ ] A dedicated test confirms a duplicate `(interest_id, dimension)` row is still rejected post-`011`, and a duplicate `(task_id, dimension)` row is also rejected.
- [ ] No repository or service code is added in this ticket.

**Dependencies:** Ticket 1 — the new columns' `CHECK` values and the `tasks`/`task_completions` shapes must match the domain types.

---

## Ticket 3 of 10

**Title:** P2.5:Implement TaskRepository; widen ConstraintRepository for Task ownership

**Description:**
Adds `src/repositories/TaskRepository.ts`, mirroring the existing repository pattern, and extends `ConstraintRepository` with Task-scoped find/replace methods keyed on the widened schema from Ticket 2.

**Acceptance Criteria:**
- [ ] `src/repositories/TaskRepository.ts` extends `BaseRepository` and uses `withConnection` exclusively.
- [ ] `findForInterest(interestId): Promise<Task[]>` returns rows ordered by `position` ascending.
- [ ] `insert(task: NewTask & { mode: TaskMode; position: number }): Promise<Task>` persists exactly the given `mode`/`position` (the repository computes neither), server-generates `id`/`created_at`/`updated_at`, and defaults `state` to `'armed'`.
- [ ] `update(id, patch: TaskPatch): Promise<Task>` persists whichever of `title`/`position`/`state` are present in the patch and bumps `updated_at`.
- [ ] `logCompletion(id, completedAt: string, rearm: boolean): Promise<Task>` inserts one `task_completions` row (`completed_at`, `rearmed = rearm`) and updates the Task's `state` via `nextTaskState` (Ticket 1) in the same connection, returning the updated `Task`.
- [ ] `remove(id): Promise<void>` deletes the Task row; a test confirms its `task_completions` rows and any of its constraint rows are gone afterward via `ON DELETE CASCADE`, with no manual cleanup code in the repository.
- [ ] `ConstraintRepository` gains `findForTask(taskId): Promise<Constraint[]>`, returning rows where `task_id` matches.
- [ ] `ConstraintRepository` gains `replaceForTask(taskId, constraints): Promise<void>` with the same per-dimension upsert semantics as `replaceForInterest` (preserves `id`/`created_at` on re-answer; generates them on first answer), keyed on `(task_id, dimension)`.
- [ ] `findForInterest`/`replaceForInterest`'s existing behavior is unchanged; their row↔domain mapping reads/writes both nullable `interest_id`/`task_id` columns without regressing Interest-owned rows.
- [ ] `findFullyAnsweredInterestIds` is unchanged and stays Interest-scoped.
- [ ] `src/repositories/__tests__/TaskRepository.test.ts` (new) runs against a real test SQLite connection and covers: insert/update round-trip; `logCompletion`'s state transition for both modes (`sequenced` always lands on `'done'`; `repeatable` lands on `'armed'` when `rearm: true` and `'closed'` when `rearm: false`); cascade-delete on `remove`; ordering by `position`.
- [ ] `src/repositories/__tests__/ConstraintRepository.test.ts` is extended to cover: Task-owned insert/update round-trip; a Task's and its umbrella Interest's rows for the same dimension coexisting independently; cascade-delete of Task-owned rows when the Task (not the Interest) is removed; a duplicate `(task_id, dimension)` insert rejected by the partial unique index.

**Dependencies:** Ticket 2 — requires the `tasks`, `task_completions`, and widened `constraints` schema; Ticket 1 — requires the domain types.

---

## Ticket 4 of 10

**Title:** P2.5:Implement TaskService; widen ConstraintService; replace InterestService.skipType with answerTypeQuestion

**Description:**
Adds `src/services/TaskService.ts` — the phase's first service to depend on a repository outside its own aggregate (both `TaskRepository` and `InterestRepository`) — widens `ConstraintService` similarly (`TaskRepository` alongside `ConstraintRepository`), and replaces `InterestService.skipType` with the derived-type-aware `answerTypeQuestion`.

**Acceptance Criteria:**
- [ ] `src/services/TaskService.ts` depends on both `TaskRepository` and `InterestRepository`.
- [ ] `listForInterest(interestId): Promise<Task[]>` delegates to `TaskRepository.findForInterest`.
- [ ] `add(interestId, { title }): Promise<Task>` loads the parent Interest; rejects (without calling `TaskRepository`) when `type === 'OneTimeProject'` or `type === null`; derives `mode` from `type` (`StructuredLearning` → `'sequenced'`, `UnstructuredLearning` → `'repeatable'`); computes `position` as `max(existing Tasks' position) + 1`, or `0` for the interest's first Task.
- [ ] `reorder(interestId, orderedTaskIds): Promise<void>` rejects unless the parent Interest's `type === 'StructuredLearning'`; otherwise writes `position` per the given order via `TaskRepository.update`.
- [ ] `complete(taskId, { rearm? }): Promise<Task>` loads the Task, calls `assertValidCompletionRequest(mode, rearm)`, then `TaskRepository.logCompletion`; after logging, if the parent Interest's `state` is still `'Backlog'`, flips it to `'InProgress'` via `InterestRepository.update`; does **not** flip when the Interest is already `'InProgress'` or `'Complete'`.
- [ ] `nextActionable(interestId): Promise<Task | null>` returns, for a `StructuredLearning` parent, the lowest-`position` Task with `state !== 'done'` (or `null` if none); for `UnstructuredLearning`, the lowest-`position` Task with `state === 'armed'` (or `null` if none).
- [ ] `remove(taskId): Promise<void>` delegates to `TaskRepository.remove`.
- [ ] `ConstraintService` now also depends on `TaskRepository`; gains `listForTask(taskId)` using the same `Unknown`-synthesis pattern as `listForInterest`, over `ALL_DIMENSIONS`.
- [ ] `effectiveForTask(taskId): Promise<Constraint[]>` loads the Task's own rows (`ConstraintRepository.findForTask`) and, via `TaskRepository.findById` then `ConstraintRepository.findForInterest` on the parent `interestId`, the umbrella's rows, then applies `resolveEffectiveConstraint` per dimension.
- [ ] `answer`'s first parameter widens from `interestId: InterestId` to `target: { interestId: InterestId } | { taskId: TaskId }`, dispatching to `replaceForInterest`/`replaceForTask` accordingly, with domain validation run before dispatch in either case.
- [ ] `needsEnrichment` is unchanged.
- [ ] `InterestService.skipType` is removed — no remaining exports or callers.
- [ ] `InterestService.answerTypeQuestion(id, question: 'OneSitting' | 'OrderedSteps', answer: 'Yes' | 'No' | 'Unknown'): Promise<Interest>` persists the raw answer into `oneSittingAnswer`/`orderedStepsAnswer` (`'Unknown'` maps to `null` in the column and sets `typeSkippedAt` to the current timestamp); recomputes `type` via `inferInterestType`; clears `typeSkippedAt` the moment `inferInterestType` returns non-`null`; persists the raw-answer column and the recomputed `type` in one `InterestRepository.update` call.
- [ ] `src/services/__tests__/TaskService.test.ts` (new, fakes) covers: `add`'s `OneTimeProject` rejection, `add`'s null-type rejection, `add`'s mode derivation for both umbrella types, `add`'s position computation for the first Task and a subsequent Task; `complete`'s Backlog→InProgress flip and its non-firing when already `InProgress`/`Complete`; `reorder`'s `StructuredLearning`-only guard (rejecting `UnstructuredLearning` and `OneTimeProject`); `nextActionable` for both modes, including the no-actionable-Task case.
- [ ] `src/services/__tests__/ConstraintService.test.ts` is extended to cover `effectiveForTask`'s override (Task `'Set'` wins over umbrella; Task `'Unknown'` falls back to umbrella; no row on either side yields `undefined` for that dimension) and `answer`'s dispatch to `replaceForInterest` vs `replaceForTask` based on the target shape.
- [ ] `src/services/__tests__/InterestService.test.ts` is extended to cover `answerTypeQuestion`'s branches from the truth table (including `typeSkippedAt`'s set-on-`'Unknown'`/clear-on-resolved-type transitions), and confirms `skipType` is no longer callable.

**Dependencies:** Ticket 3 — requires `TaskRepository` and the widened `ConstraintRepository`.

---

## Ticket 5 of 10

**Title:** P2.5:Rework enrichmentQuestions and EnrichmentCard to be owner-agnostic and drop the type chip picker

**Description:**
Removes the `'type'` `QuestionConfig` variant and replaces it with two tri-state behavioral-question configs (`OneSitting`, `OrderedSteps`); widens `EnrichmentAxis` accordingly. `EnrichmentCard` stays a dumb, service-agnostic component — only its rendered variants change.

**Acceptance Criteria:**
- [ ] The `'type'` `QuestionConfig` variant and its entry in `enrichmentQuestions` are removed.
- [ ] Two new question configs, `OneSitting` and `OrderedSteps`, are added, each offering a `'Yes'`/`'No'` chip pair plus a "Not sure" escape hatch and **no** "Doesn't apply" option.
- [ ] `EnrichmentAxis`'s type changes from `Exclude<ConstraintDimension, 'EnergyFocus'> | 'Type'` to `Exclude<ConstraintDimension, 'EnergyFocus'> | 'OneSitting' | 'OrderedSteps'`.
- [ ] The six axis question configs (`Time`, `Supplies`, `Location`, `Social`, `Weather`, `Season`, `TimeOfDay`) are unchanged — same options, same variants, same copy.
- [ ] `EnrichmentCard`'s prop contract stays `{ axis, answer, onAnswer, onBack, onForward, dueBy?, onDueByChange? }` — no `interestId`/`taskId` prop is added, and the component calls no service.
- [ ] `EnrichmentCard` drops the `'type'`-variant rendering branch and adds rendering for `OneSitting`/`OrderedSteps` by reusing the existing chip-rendering path (no new sub-component).
- [ ] `src/components/__tests__/EnrichmentCard.test.tsx` and/or the `enrichmentQuestions` tests are extended to cover `OneSitting`/`OrderedSteps` chip rendering, `onAnswer` with `'Yes'`/`'No'`, and `onAnswer` with `'Unknown'` on "Not sure".
- [ ] Any test specific to the retired `'type'` variant is removed or updated so no test references it.

**Dependencies:** Ticket 1 — requires the domain types referenced by the widened `EnrichmentAxis`.

---

## Ticket 6 of 10

**Title:** P2.5:Build the TaskQuickAddList component

**Description:**
Adds `src/components/TaskQuickAddList.tsx`, a presentational, name-only Task capture list used by both the guided-setup flow (Ticket 7) and the Interest Detail screen (Ticket 9).

**Acceptance Criteria:**
- [ ] `src/components/TaskQuickAddList.tsx` is presentational only — no service calls — taking the current draft list of `{ title }` entries plus `add`/`remove`/`reorder` callbacks as props.
- [ ] Renders a text-input-plus-add-row list for entering Task titles one at a time.
- [ ] An ordered-mode prop exposes drag-to-reorder or up/down controls; unordered mode renders no reordering controls.
- [ ] Paste-a-list entry is **not** built in this ticket — single-title-at-a-time capture only.
- [ ] `src/components/__tests__/TaskQuickAddList.test.tsx` (new) covers: `add`/`remove` callback invocation on user action; reorder controls present in ordered mode; reorder controls absent in unordered mode.
- [ ] No screen imports or wires this component in this ticket.

**Dependencies:** Ticket 1 — requires `Task`/`NewTask` types.

---

## Ticket 7 of 10

**Title:** P2.5:Rework GuidedSetupScreen for type-inference-first entry and per-type branch dispatch

**Description:**
Restructures `GuidedSetupScreen` from a flat `COVERED_AXES` walk into a type-inference-first entry that then branches by the (now-derived) type, and widens it to also serve as the Task-level constraint editor via a new `taskId` route param.

**Acceptance Criteria:**
- [ ] Route params widen from `{ interestId, startDimension? }` to `{ interestId, taskId?, startAxis? }`; `RootNavigator`'s `GuidedSetup` route type is updated to match.
- [ ] On load, when type is not yet determined (`oneSittingAnswer === null`), the screen renders the `OneSitting` card first, routing the answer through `InterestService.answerTypeQuestion(id, 'OneSitting', answer)`.
- [ ] `OrderedSteps` renders only when `oneSittingAnswer === 'No'` — never when `'Yes'` — routing through `answerTypeQuestion(id, 'OrderedSteps', answer)`.
- [ ] Once `type` resolves (freshly answered, or already set from a prior visit), the screen branches:
  - [ ] `OneTimeProject` sequences through the six axis cards at the Interest level via `ConstraintService.answer({ interestId }, ...)` — unchanged from Phase 2's mechanics.
  - [ ] `StructuredLearning` renders `TaskQuickAddList` (ordered mode) once, calling `TaskService.add` per entry and `TaskService.reorder` on reorder actions, then sequences through the six axis cards once at the umbrella via `ConstraintService.answer({ interestId }, ...)`.
  - [ ] `UnstructuredLearning` renders `TaskQuickAddList` (unordered mode) once, calling `TaskService.add` per entry, then exits — no axis cards render at the umbrella level.
- [ ] When `taskId` is present in route params, every axis card's `onAnswer` targets `ConstraintService.answer({ taskId }, ...)` instead of `{ interestId }`.
- [ ] Single-card edit-in-place mode (`startAxis` provided) renders exactly one card for that axis/question and returns to `InterestDetail` immediately after any answer, including an escape hatch — same autosave-and-close mechanics as Phase 2.
- [ ] Every answer (type-inference or axis) autosaves immediately; no separate "Save" action exists anywhere on this screen.
- [ ] A rejected/failed service call is surfaced as inline feedback, not an unhandled promise rejection.
- [ ] `src/screens/__tests__/GuidedSetupScreen.test.tsx` is extended to cover: `OneSitting`-first entry when type is undetermined; `OrderedSteps` rendering only after `oneSittingAnswer === 'No'` and never after `'Yes'`; each of the three post-type branch flows; `taskId`-present routing of axis answers to `ConstraintService.answer({ taskId })`; single-card edit-in-place mode unchanged.

**Dependencies:** Ticket 4 — requires `InterestService.answerTypeQuestion`, `TaskService.add`/`reorder`, and `ConstraintService.answer`'s widened target; Ticket 5 — requires the reworked `EnrichmentCard`/`enrichmentQuestions`; Ticket 6 — requires `TaskQuickAddList`.

---

## Ticket 8 of 10

**Title:** P2.5:Add Task-level constraint editing with umbrella pre-fill

**Description:**
Reuses `GuidedSetupScreen` with `taskId` set as the on-demand Task-level constraint editor, pre-filling each unanswered axis with the umbrella's effective value so the user amends rather than retypes.

**Acceptance Criteria:**
- [ ] Reached from a Task row's edit affordance (built in Ticket 9) by navigating to `GuidedSetupScreen` with `taskId` set.
- [ ] On load, for any Task (both `repeatable` and `sequenced`), each axis card whose Task has no stored answer for that dimension is pre-filled with `ConstraintService.effectiveForTask(taskId)`'s resolved value for that dimension, rather than rendered blank.
- [ ] A dimension the Task already has its own stored answer for renders that Task-owned value, not the umbrella's.
- [ ] Saving an answer via `onAnswer` always persists a complete, Task-owned `{ taskId }` answer through `ConstraintService.answer` — never a partial diff against the umbrella; the pre-fill is presentational only and writes nothing by itself.
- [ ] This is the only Task-level enrichment trigger built in this phase — no soft-block or session-end trigger is added.
- [ ] Tests (extending `src/screens/__tests__/GuidedSetupScreen.test.tsx` or a dedicated Task-editor test file) cover: a Task with no stored answer for a dimension renders pre-filled with the umbrella's effective value; a Task with its own stored answer renders that value instead; saving calls `ConstraintService.answer({ taskId }, dimension, ...)` with a complete answer, not a partial merge.

**Dependencies:** Ticket 7 — reuses `GuidedSetupScreen`'s `taskId` mode; Ticket 4 — requires `ConstraintService.effectiveForTask`.

---

## Ticket 9 of 10

**Title:** P2.5:Rework InterestDetailScreen for per-type layout, the Tasks section, and the Reconsider-type row

**Description:**
Restructures `InterestDetailScreen`'s answer area by type — a Tasks section replaces the flat axis chip row for both umbrella types, the `Type` row becomes "Reconsider type" (upward-drift-only, per the settled decision), and umbrella-level completion offers are surfaced. Task row completion/re-arm *interaction wiring* is Ticket 10 — this ticket builds the row structure, grouping, and edit affordance.

**Acceptance Criteria:**
- [ ] `OneTimeProject`: renders the existing axis chip row unchanged, plus a new **Complete** action calling `InterestService.setState(id, 'Complete')`.
- [ ] `StructuredLearning`/`UnstructuredLearning`: the flat axis chip row is replaced by a Tasks section.
  - [ ] `StructuredLearning` renders an ordered list of Tasks (by `position`) with the Task returned by `TaskService.nextActionable` visually distinguished from the rest.
  - [ ] `UnstructuredLearning` renders a list grouped by `state` (`armed` vs `closed`).
  - [ ] `StructuredLearning` additionally retains its six umbrella-level axis chips above the Tasks section (Interest-owned, unchanged navigation/mechanics).
  - [ ] `UnstructuredLearning` renders **no** umbrella-level axis chips.
  - [ ] Each Task row shows its title, an edit affordance navigating to `GuidedSetupScreen` with that Task's `taskId` (Ticket 8), and a complete/re-arm control region (wired to `TaskService` in Ticket 10 — this ticket renders the control(s), not their service wiring).
  - [ ] `TaskQuickAddList` (Ticket 6) appears at the bottom of the Tasks section, wired to `TaskService.add` for the umbrella's mode.
  - [ ] A zero-Task umbrella (a valid post-migration state for both types) renders a graceful empty-state prompt directing the user to `TaskQuickAddList` — never a blank area or an error state.
- [ ] All three types: the `Type` `AnswerRow` is replaced by a "Reconsider type" row that never renders a dropdown or picker of any kind.
  - [ ] With **no Tasks** on the Interest, the row is always available and, when tapped, navigates to `GuidedSetupScreen`'s two type-inference cards, in either direction.
  - [ ] Once **at least one Task exists**, the row does not offer an outcome of `OneTimeProject`: if the answers to the two cards would infer `OneTimeProject` while Tasks exist, the screen does not apply that result — it explains inline that a Task-bearing interest can't convert to a one-time project and points at delete-and-recreate, with no warning dialog, discard flow, or orphan-reconciliation UI built.
- [ ] Completion offers:
  - [ ] `StructuredLearning` surfaces a "Mark complete?" offer (`InterestService.setState(id, 'Complete')`) once every Task's `state === 'done'`, **and** a manual complete action remains available even before all Tasks are done (a nudge, not a lock).
  - [ ] `UnstructuredLearning` surfaces the Conclude/Resting action at any time, never gated on Task states, presented with "Satisfied"/"Resting" copy — never "Finished" — calling `InterestService.setState(id, 'Complete')` under the hood.
- [ ] `src/screens/__tests__/InterestDetailScreen.test.tsx` is extended to cover: `OneTimeProject`'s Complete action; `StructuredLearning`'s Tasks section ordering and `nextActionable` highlighting; `UnstructuredLearning`'s `armed`/`closed` grouping; empty-Task-list rendering for both umbrella types; the Reconsider-type row's no-Tasks-either-direction behavior and its has-Tasks block on `OneTimeProject`; `StructuredLearning`'s gated offer plus the always-available manual complete action; `UnstructuredLearning`'s always-available Conclude/Resting action and its distinct copy.

**Dependencies:** Ticket 4 — requires `TaskService`, `ConstraintService`, `InterestService.answerTypeQuestion`; Ticket 6 — requires `TaskQuickAddList`; Ticket 7/8 — requires `GuidedSetupScreen`'s type-inference and `taskId`-editor destinations for navigation.

---

## Ticket 10 of 10

**Title:** P2.5:Wire Task completion, re-arm, and reopen interactions

**Description:**
Wires each Task row's action(s) from Ticket 9 to `TaskService.complete`, adds the small `TaskService.reopen` affordance for re-opening a `'closed'` repeatable Task, and exercises the Backlog→InProgress auto-flip end-to-end in the Detail screen. No Reflection capture appears anywhere in this phase.

**Acceptance Criteria:**
- [ ] `sequenced` Tasks: a single "Complete" action on the row, wired to `TaskService.complete(taskId)` (no `rearm` option offered).
- [ ] After completing a `sequenced` Task, if it was the last non-`'done'` Task on the umbrella, the `StructuredLearning` "Mark complete?" offer (Ticket 9) surfaces inline (toast/banner) — not a forced navigation.
- [ ] `repeatable` Tasks: completing offers an inline choice — "Close it out" (`complete(taskId, { rearm: false })`) and "Re-arm" (`complete(taskId, { rearm: true })`) — both bank the completion; the row reflects the resulting `state` (`'armed'` or `'closed'`).
- [ ] `TaskService` gains `reopen(taskId): Promise<Task>` — a thin wrapper calling `TaskRepository.update(id, { state: 'armed' })` directly, mirroring `InterestService.unarchive`'s shape. Added in this ticket, not Ticket 4.
- [ ] A `'closed'` repeatable Task's row exposes a manual reopen affordance wired to `TaskService.reopen`, returning the row to `'armed'`.
- [ ] The first Task completion on a `Backlog` umbrella flips it to `InProgress` with no separate user action, and the new state is visible in `InterestDetailScreen`'s state label immediately after the action resolves (end-to-end — Ticket 4 already covers the service-layer flip; this ticket verifies and wires the screen-visible result).
- [ ] No Reflection prompt, capture UI, or affordance appears anywhere in this ticket's flows.
- [ ] `src/screens/__tests__/InterestDetailScreen.test.tsx` (or a dedicated Task-row test file) is extended to cover: the `sequenced` Complete action and the last-Task "Mark complete?" surfacing; the `repeatable` Close-it-out vs. Re-arm branches and resulting row state; reopen wiring from a closed row back to `armed`; the end-to-end Backlog→InProgress flip visible on screen after the first Task completion.
- [ ] `src/services/__tests__/TaskService.test.ts` is extended to cover the new `reopen` method.

**Dependencies:** Ticket 9 — requires the Task row structure and completion-offer surfaces; Ticket 4 — requires `TaskService.complete`.

---

## Contract deltas for `spec/CHANGELOG.md` — action needed, not made here

This ticket plan does not edit the spec. The following deltas should be recorded in `spec/CHANGELOG.md` (and, where the API Contracts section is stale, `spec/PROJECT_SPEC.md`) at ticketing time:

- **`InterestService.skipType` is removed**, replaced by `InterestService.answerTypeQuestion(id, question: 'OneSitting' | 'OrderedSteps', answer: 'Yes' | 'No' | 'Unknown'): Promise<Interest>`. The spec's current `InterestService` listing still shows `skipType` — it needs updating, not just a changelog note.
- **`InterestService`/`InterestRepository`'s patch `Pick` gains `oneSittingAnswer`/`orderedStepsAnswer`.** The spec's current `update`/`patch` signatures list only `'title' | 'type' | 'state' | 'archivedAt' | 'typeSkippedAt' | 'dueBy'`.
- **`Constraint.interestId` becomes nullable (`InterestId | null`) and `Constraint` gains `taskId: TaskId | null`.**
- **`TaskService.reopen(taskId): Promise<Task>` is a new method beyond the spec's current `TaskService` listing** (Ticket 10).
- **Migrations run 001–011, not 001–007.**
- **`GuidedSetupScreen`'s route param renames `startDimension` → `startAxis` and widens its type** from `'Type' | ConstraintDimension` to `'OneSitting' | 'OrderedSteps' | Exclude<ConstraintDimension, 'EnergyFocus'>`, and adds an optional `taskId`.

---

## Flag for the user

- **The completion-is-an-event-not-a-flag assumption** (spec: `task_completions` as an append-only log, not a boolean on `tasks`) is implemented as the spec states it (Ticket 2/3), but the brief is explicit that the user never confirmed this in those words. Worth one look before Ticket 2 is worked — the alternative (a single boolean + `completedAt` on `tasks`, no log table) is a strictly smaller change if per-completion Reflection (Phase 5) turns out not to need row-level granularity.
- **The "one sitting" wording tension against the spec's own example.** The spec's `OneTimeProject` example is "build garage shelves," which plausibly spans more than one literal sitting yet is clearly not an umbrella. If "one sitting" is meant loosely ("one continuous undertaking," not literally ≤1 session), the `OneSitting` card's copy (Ticket 5/7) should say so explicitly rather than leaving it to the user's literal reading. This plan does not resolve the spec's wording, only flags the tension.
- **The empty-Task umbrella state Ticket 9 must render gracefully.** Both an `UnstructuredLearning` and a `StructuredLearning` interest with zero Tasks are valid, expected post-migration states (existing umbrellas start with none) and remain reachable afterward (a freshly-typed umbrella before its first quick-add entry). Ticket 9's acceptance criteria call this out explicitly so it isn't missed as an edge case.
- **A new architectural pattern: services depending on a repository outside their own aggregate.** Every service through Phase 2 (`InterestService`, `ConstraintService`, `NoteService`) wrapped exactly one repository for its own aggregate. Ticket 4 breaks that symmetry twice — `TaskService.add` depends on `InterestRepository` (to read the parent's `type`) alongside `TaskRepository`, and the widened `ConstraintService` depends on `TaskRepository` (to resolve a Task's owning Interest) alongside `ConstraintRepository`. Both stay within the layering rule (a service still only calls repositories, never persistence directly), but this is the first time it happens — worth one explicit look before Ticket 4 lands, since it sets a precedent later services may follow.

# Phase 2.5: Interest Shapes (Tasks)

_Created: 2026-08-20 | Status: DRAFT_

## Goal

Remodel the three Interest types from three labels on one shared shape into three
genuinely different container shapes, per the spec's 2026-08-20 amendment: add the
`Task` entity (`repeatable` for `UnstructuredLearning`, `sequenced` for
`StructuredLearning`; `OneTimeProject` gets none), derive `type` from two behavioral
questions instead of asking it directly, move completion down to the Task for both
umbrella types, move constraints to whichever level (Interest or Task) the type
implies with per-dimension override, and replace the single uniform guided-setup
flow with a per-type flow. This phase **blocks Phase 3** — the recommendation
engine cannot be built against a shape that doesn't exist yet.

## Context

Phase 2 is built, committed, and reviewed (migrations 001–007 applied; real
on-device data exists). It delivers, in full:

- **Domain:** `src/domain/interest.ts` (`Interest` with `type: InterestType | null`,
  `typeSkippedAt`, `dueBy`; `InterestPatch`); `src/domain/constraint.ts`
  (`ConstraintDimension` = `Time | Supplies | Location | Social | Weather | Season |
  TimeOfDay | EnergyFocus`; `Constraint<D>` keyed to a single `interestId`;
  `assertValidConstraintAnswer`); `src/domain/note.ts`.
- **Persistence:** migrations 001–007 (`interests`, `constraints`, `type_skipped_at`,
  `due_by`, `notes`, and 007's full-table rebuild splitting `WeatherSeason` into
  three dimensions). `InterestRepository` and `ConstraintRepository`
  (`findForInterest` / `replaceForInterest` as a per-dimension upsert /
  `findFullyAnsweredInterestIds`) both extend `BaseRepository` and use
  `withConnection` exclusively.
- **Application:** `InterestService` (`create/get/list/update/setState/archive/
  unarchive/delete/skipType`); `ConstraintService` (`listForInterest` — synthesizes
  `Unknown` for the full `ALL_DIMENSIONS` list including `EnergyFocus` — `answer`,
  `needsEnrichment`), both thin orchestration over exactly one repository each.
- **Presentation:** `CreateInterestScreen` (title only, then `navigation.replace`
  straight into `GuidedSetupScreen` — "title first, alone" is real, not aspirational);
  `GuidedSetupScreen` (route params `{ interestId, startDimension? }`; single-card
  edit-in-place mode when `startDimension` is given, sequential mode over
  `COVERED_AXES` — `['Type','Time','Supplies','Location','Social','Weather','Season',
  'TimeOfDay']` — otherwise); `EnrichmentCard` (one component serving every axis
  generically via `enrichmentQuestions.ts`'s `QuestionConfig` union — `chips` / `type`
  / `supplies` / `multi` variants); `InterestDetailScreen` (a flat `AnswerRow` per
  covered axis, each tapping into `GuidedSetupScreen` with that `startDimension`;
  Supplies gets a special expandable row); `EditInterestScreen` (title + a `state`
  segmented control + Archive/Delete — **no type field at all**, see the correction
  below); `InterestListScreen` (sections the backlog by `interest.type`, with an
  "Unplanted" section for `type === null`; no idle-enrichment nudge banner is
  actually present in the shipped file, despite the Phase 2 plan's Step 8 — a
  pre-existing gap, not this phase's to fix).
- **Empty:** no `Task`/`Step` concept anywhere — no table, repository, service, or
  screen surface.

Two sources shape this plan beyond the roadmap's 2.5 cell: `spec/PROJECT_SPEC.md`'s
2026-08-20 amendment (Domain Model → Interest/Task/Constraint, Recommendation Engine
→ "Umbrella interests — recommend the next Task", the widened `TaskService` /
`TaskRepository` / `ConstraintService` / `ConstraintRepository` contracts, and the
four new Resolved Decisions), and `docs/planning/ux-design-intent.md`'s "The flow is
per-type, not one flow with a branch" and rewritten "Interest Shapes & Structured
Itineraries" sections, which this plan treats as settled design, not something to
re-derive.

**Correction to the brief: `EditInterestScreen` has no type picker.** Re-reading the
shipped file (`src/screens/EditInterestScreen.tsx`), it renders only a title field, a
`Backlog/InProgress/Complete` state segmented control, and Archive/Delete — `type` is
never referenced. The type editor that must actually be reworked is the `'type'`
`QuestionConfig` variant in `enrichmentQuestions.ts` and its rendering in
`EnrichmentCard`, reached via the `Type` `AnswerRow` on `InterestDetailScreen` and the
first card of `GuidedSetupScreen`'s sequential flow. This plan reworks that surface;
`EditInterestScreen` needs no change at all (see Flag for the user).

**Type-derivation storage — a design decision this phase makes, not given verbatim by
the spec.** The spec says type is derived from "two behavioral questions" but does not
specify how the answers are stored. This plan adds two nullable columns to
`interests` — `oneSittingAnswer: 'Yes' | 'No' | null` and `orderedStepsAnswer: 'Yes' |
'No' | null` — and a pure function `inferInterestType(oneSitting, orderedSteps):
InterestType | null`:

| `oneSittingAnswer` | `orderedStepsAnswer` | Result |
|---|---|---|
| `'Yes'` | *(not asked — moot once one-sitting is true)* | `OneTimeProject` |
| `'No'` | `'Yes'` | `StructuredLearning` |
| `'No'` | `'No'` | `UnstructuredLearning` |
| `null` | *(anything)* | `null` — undetermined |
| `'No'` | `null` | `null` — undetermined |

The flow asks `orderedStepsAnswer` only after `oneSittingAnswer === 'No'` — a small,
low-risk UX tightening beyond the spec's literal "two questions," since asking a moot
second question about something already known to be one-sitting contradicts "friction
is the enemy." Flagged below for one explicit look.

`Interest.typeSkippedAt` **keeps its existing single-column shape** and its existing
mechanic from Phase 2 (a durable "don't re-ask" marker set only on an explicit "Not
sure," never on merely leaving the flow) — generalized to either of the two questions
rather than retired. `type === null && typeSkippedAt === null` still means "never
enough answered to determine, and not yet durably deferred either" — the exact
predicate `GuidedSetupScreen` already uses today, now reading the two new columns
through `inferInterestType` instead of a stored `type` chip choice.

**`InterestService.skipType` is retired; `answerTypeQuestion` replaces it.** The old
method set `type: null` directly, which made sense when `Type` was a free-standing
three-chip choice. It cannot survive type becoming derived — there is no longer a
single "the type" to null out independent of the two answers. This phase replaces it
with `InterestService.answerTypeQuestion(id, question: 'OneSitting' | 'OrderedSteps',
answer: 'Yes' | 'No' | 'Unknown'): Promise<Interest>`, which stores the raw answer
(`'Unknown'` maps to `null` in the column and sets `typeSkippedAt`), then recomputes
`type` via `inferInterestType` and persists both in one `InterestRepository.update`
call. This is a genuine `InterestService` contract change beyond the spec's current
text — flagged below for the changelog.

**Constraint ownership widens from "always an Interest" to "an Interest or a
Task."** `Constraint.interestId: InterestId` becomes `interestId: InterestId | null`
plus a new `taskId: TaskId | null`, with a domain invariant — exactly one of the two
is set — enforced by a new `assertValidConstraintOwner` pure function alongside the
existing `assertValidConstraintAnswer`. The **per-dimension override** rule itself
("the Task's answer, falling back to the umbrella's, no merge") is a business rule,
so it lives in `src/domain/constraint.ts` as a pure function
(`resolveEffectiveConstraint`), with `ConstraintService.effectiveForTask` as thin
orchestration calling it once per dimension — the same domain/service split the
codebase already uses for `assertValidConstraintAnswer` vs. `ConstraintService.answer`.

**A new architectural pattern: services depending on more than one repository.**
Every service to date (`InterestService`, `ConstraintService`, `NoteService`) wraps
exactly one repository for its own aggregate. This phase breaks that symmetry
deliberately, twice: `TaskService.add` must read the parent Interest's `type` to
derive `mode` and to reject Task creation on a `OneTimeProject` (spec: "`mode` is
inherited from the parent Interest's type, not passed"), so it depends on
`InterestRepository` alongside `TaskRepository`; and the widened `ConstraintService`
must resolve a Task's owning Interest to fetch the umbrella's rows for
`effectiveForTask`, so it depends on `TaskRepository` alongside `ConstraintRepository`.
Both stay within the layering rule — a service still only ever calls repositories,
never persistence directly — but this is the first time a service reaches beyond its
own aggregate's repository. Flagged below as a precedent worth one explicit look.

**Existing on-device data — what happens to it.** This is the one place this phase
must touch data, not just add tables:

- **Existing `type` values are backfilled into the two new answer columns**, not
  reset. Migration 008's `up` step reverse-derives `oneSittingAnswer` /
  `orderedStepsAnswer` from each interest's current `type` (`OneTimeProject` →
  `('Yes', null)`; `StructuredLearning` → `('No', 'Yes')`; `UnstructuredLearning` →
  `('No', 'No')`; `type IS NULL` → `(null, null)`, `typeSkippedAt` left exactly as it
  already is). No existing interest is forced back through the type questions; a
  chosen type stays chosen.
- **Existing Interest-level constraint rows need no migration, regardless of type.**
  An `UnstructuredLearning` interest that already has, say, a `Time` answer stored at
  the Interest level under the old uniform flow does **not** need that row moved or
  deleted — under the new per-dimension override, an Interest-level row is exactly
  what a Task falls back to when it has no answer of its own. Old data becomes a
  sensible umbrella-level default for free, with zero row rewriting. This is a direct
  consequence of the override model being additive, not a reshuffle.
- **Existing `StructuredLearning`/`UnstructuredLearning` interests start with zero
  Tasks** — `Task` did not exist before this migration, so there is nothing to
  backfill. They become umbrellas over an empty Task list until the user adds Tasks
  through the reworked Detail screen (Step 9) or revisits Guided Setup. This is a
  valid, expected transitional state ("Tasks are added incrementally... never a
  mandatory full-curriculum upfront"), not an error state — but it does mean Phase 3
  must decide how to treat an umbrella with no Tasks (almost certainly: excluded from
  candidates, same as any interest with nothing actionable). Noted for Phase 3, not
  built here.

## Steps

### Step 1: Domain model — `Task`, derived `type`, and Task-or-Interest `Constraint` ownership

Add `src/domain/task.ts`: `TaskId`, `TaskMode` (`'repeatable' | 'sequenced'`),
`TaskState` (`'armed' | 'done' | 'closed'`), `Task` (`id`, `interestId`, `title`,
`mode`, `state`, `position`, `createdAt`, `updatedAt`), `NewTask` (`interestId`,
`title` — `mode`/`position` assigned by the service, never passed in), `TaskPatch`
(`Partial<Pick<Task, 'title' | 'position' | 'state'>>`, matching the spec's
`TaskRepository.update`), and validation mirroring `interest.ts`'s pattern
(`validateTaskTitle`/`assertValidTaskTitle`). Add one pure state-transition rule,
`nextTaskState(mode: TaskMode, rearm: boolean): TaskState` — `sequenced` always
returns `'done'` regardless of `rearm` (and a companion `assertValidCompletionRequest
(mode, rearm)` rejects `rearm: true` on a `sequenced` Task, per the spec's "rearm
(repeatable only)"); `repeatable` returns `'armed'` if `rearm` else `'closed'`.

In `src/domain/interest.ts`, add `oneSittingAnswer: 'Yes' | 'No' | null` and
`orderedStepsAnswer: 'Yes' | 'No' | null` to `Interest` and to `InterestPatch`'s
`Pick` union; add the pure `inferInterestType` function per the Context table above.
Remove nothing from `InterestType`/`InterestState`/`displayLabel` — the three type
identifiers and their (still-open) display labels are unchanged by this phase.

In `src/domain/constraint.ts`, change `Constraint`'s `interestId: InterestId` to
`interestId: InterestId | null` and add `taskId: TaskId | null`. Add
`assertValidConstraintOwner(interestId, taskId): void` (exactly one non-null) and a
small `constraintOwner(c): { interestId: InterestId } | { taskId: TaskId }` helper for
callers that want the narrowed view. Add the pure per-dimension override rule,
`resolveEffectiveConstraint(taskConstraint: Constraint | undefined, umbrellaConstraint:
Constraint | undefined): Constraint | undefined` — returns the Task's row when its
`status` is `'Set'` or `'None'` (an actual answer, not `'Unknown'`), else the
umbrella's row, else `undefined`. `findConstraint` is unchanged (dimension-only
lookup still works on either an Interest's or a Task's constraint list). Extend
`src/domain/__tests__/constraint.test.ts` and `interest.test.ts`; add
`src/domain/__tests__/task.test.ts` covering `nextTaskState` and
`assertValidCompletionRequest`'s rejection case. No persistence or UI code here.

### Step 2: Migrations 008–011

Add four migrations, registered in `src/db/migrations/index.ts` in order:

- **008 — type-inference columns.** `ALTER TABLE interests ADD COLUMN
  one_sitting_answer TEXT CHECK (one_sitting_answer IN ('Yes','No') OR
  one_sitting_answer IS NULL);` and the same for `ordered_steps_answer`. The `up` step
  then runs the backfill described in Context (one `UPDATE` per existing `type`
  value, keyed off the current `type` column; rows with `type IS NULL` are left both
  `NULL`). `typeSkippedAt`/`archived_at`/`due_by` columns are untouched.
- **009 — `tasks` table.** `id TEXT PRIMARY KEY`, `interest_id TEXT NOT NULL
  REFERENCES interests(id) ON DELETE CASCADE`, `title TEXT NOT NULL`, `mode TEXT NOT
  NULL CHECK (mode IN ('repeatable','sequenced'))`, `state TEXT NOT NULL CHECK (state
  IN ('armed','done','closed')) DEFAULT 'armed'`, `position INTEGER NOT NULL`,
  `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL`. No `UNIQUE` needed — a
  Task's identity is its `id`; ordering is read-then-sort by `position`.
- **010 — `task_completions` table.** `id TEXT PRIMARY KEY`, `task_id TEXT NOT NULL
  REFERENCES tasks(id) ON DELETE CASCADE`, `completed_at TEXT NOT NULL`, `rearmed
  INTEGER NOT NULL DEFAULT 0` — one durable Task row, an append-only completion log,
  exactly as the spec's "completion is an event, not a flag" describes (see Flag for
  the user on this assumption).
- **011 — widen `constraints` for Task ownership.** A full-table rebuild in the same
  style as migration 007 (SQLite can't `ALTER` a `CHECK` or turn a `NOT NULL` column
  nullable in place): create `constraints_new` with `interest_id TEXT REFERENCES
  interests(id) ON DELETE CASCADE` now **nullable**, a new `task_id TEXT REFERENCES
  tasks(id) ON DELETE CASCADE`, `CHECK ((interest_id IS NULL) <> (task_id IS NULL))`,
  and two **partial unique indexes** in place of the old single `UNIQUE (interest_id,
  dimension)` — `CREATE UNIQUE INDEX ... ON constraints_new(interest_id, dimension)
  WHERE interest_id IS NOT NULL` and the equivalent for `task_id` — since SQLite
  treats every `NULL` as distinct for `UNIQUE` purposes, so a plain composite unique
  would silently fail to prevent duplicate rows on the always-`NULL` column. Copy
  every existing row across with `task_id = NULL` (every current row is
  Interest-owned by construction); drop the old table; rename. No row-splitting logic
  is needed — unlike 007, this rebuild is a straight copy plus one new nullable
  column.

Extend `src/db/__tests__/migrationRunner.test.ts` to confirm all four apply cleanly on
top of 001–007, are idempotent, and — specifically for 008 — that the backfill
produces the exact `(oneSittingAnswer, orderedStepsAnswer)` pair for each of the four
`type`/`typeSkippedAt` combinations in Context.

### Step 3: `TaskRepository`; widen `ConstraintRepository` for Task ownership

Add `src/repositories/TaskRepository.ts`, extending `BaseRepository`,
`withConnection`-only, mirroring `InterestRepository`'s row↔domain shape:
`findForInterest(interestId): Promise<Task[]>` (ordered by `position`), `insert(task:
NewTask & { mode: TaskMode; position: number }): Promise<Task>` (position/mode are
resolved by `TaskService`, not this layer — the repository just persists what it's
given), `update(id, patch: TaskPatch): Promise<Task>`, `logCompletion(id, completedAt:
string, rearm: boolean): Promise<Task>` — inserts one `task_completions` row and, in
the same connection, updates the Task's `state` via `nextTaskState` (domain function
from Step 1), returning the updated `Task` — and `remove(id): Promise<void>`
(cascade-deletes its completions and constraint rows).

Extend `ConstraintRepository`: add `findForTask(taskId): Promise<Constraint[]>` and
`replaceForTask(taskId, constraints): Promise<void>`, same per-dimension-upsert
semantics as the Interest-side methods but keyed on `(task_id, dimension)`. The
existing `findForInterest`/`replaceForInterest` continue to operate on rows where
`interest_id` is set (unaffected by the widened schema apart from the row↔domain
mapping now reading/writing both nullable columns). `findFullyAnsweredInterestIds` is
unchanged — it stays Interest-scoped; nothing in this phase needs a Task-scoped
equivalent (see Notes on JIT enrichment).

Write repository tests: `TaskRepository` — insert/update/`logCompletion`'s state
transition for both modes (including the rearm/no-rearm branch), cascade-delete on
`remove`, and ordering by `position`; `ConstraintRepository` — Task-owned upsert,
that a Task's and its umbrella's rows for the same dimension coexist independently,
and cascade-delete of Task-owned constraint rows when the Task (not the Interest) is
removed.

### Step 4: `TaskService`; widen `ConstraintService`; rework `InterestService`'s type methods

Add `src/services/TaskService.ts`, depending on both `TaskRepository` and
`InterestRepository` (see Context on the new cross-aggregate pattern). Implements the
spec's contract: `listForInterest`, `add(interestId, { title })` — loads the parent
Interest, rejects if `type === 'OneTimeProject'` or `type === null` (no type yet
determined, so no shape to hand a Task to), derives `mode` from `type`
(`StructuredLearning → 'sequenced'`, `UnstructuredLearning → 'repeatable'`), and
computes the next `position` (`max(existing) + 1`, or `0`); `reorder(interestId,
orderedTaskIds)` — rejects unless the parent Interest's `type === 'StructuredLearning'`
(sequenced-only, per the spec), then writes `position` per the given order;
`complete(taskId, { rearm? })` — calls `assertValidCompletionRequest`, then
`TaskRepository.logCompletion`; after logging, if the parent Interest is still
`Backlog`, flips it to `InProgress` (see Notes on this proposed answer to the Task
state Open Question) via `InterestRepository.update`; `nextActionable(interestId)` —
loads the Interest's Tasks and `type`, returns the lowest-`position` Task with `state
!== 'done'` for `sequenced`, or the lowest-`position` Task with `state === 'armed'`
for `repeatable`, or `null`; `remove(taskId)`.

Extend `ConstraintService` (now also depending on `TaskRepository`): add
`listForTask(taskId)` (same `Unknown`-synthesis pattern as `listForInterest`, over
`ALL_DIMENSIONS`), `effectiveForTask(taskId)` (loads the Task's own rows and, via
`TaskRepository.findById`, its umbrella's rows, then applies
`resolveEffectiveConstraint` from Step 1 per dimension), and widen `answer`'s first
parameter from `interestId: InterestId` to `target: { interestId: InterestId } |
{ taskId: TaskId }`, dispatching to `replaceForInterest`/`replaceForTask`
accordingly. `needsEnrichment` is unchanged.

In `InterestService`, remove `skipType`; add `answerTypeQuestion(id, question, answer)`
per Context, which persists the raw answer, recomputes `type` via `inferInterestType`,
and sets/clears `typeSkippedAt` (set on an explicit `'Unknown'` answer to either
question; cleared the moment `inferInterestType` returns a non-null type). Unit test
all three services with fakes: `TaskService.add`'s `OneTimeProject`/untyped rejection
and mode derivation; `complete`'s Backlog→InProgress flip (and that it does *not* fire
when the Interest is already `InProgress`/`Complete`); `reorder`'s
`StructuredLearning`-only guard; `ConstraintService.effectiveForTask`'s override
(Task `'Set'` wins, Task `'Unknown'` falls back, no row on either side yields
`undefined` for that dimension); `answerTypeQuestion`'s four branches from the
Context table.

### Step 5: Rework `enrichmentQuestions.ts` and `EnrichmentCard` to be owner-agnostic

Remove the `'type'` `QuestionConfig` variant and its entry in `enrichmentQuestions`.
Add two new tri-state question configs — `OneSitting` and `OrderedSteps` — a new
`variant: 'typeQuestion'` (or reuse `'chips'` with a `'Yes'|'No'` option pair; either
is a config-level decision, not a component rewrite) plus the existing "Not sure"
escape hatch (no "Doesn't apply" — same special case the old `Type` card had, for the
same reason: there's no meaningful "explicitly no answer" for a yes/no behavioral
question). `EnrichmentAxis`'s type changes from `Exclude<ConstraintDimension,
'EnergyFocus'> | 'Type'` to `Exclude<ConstraintDimension, 'EnergyFocus'> |
'OneSitting' | 'OrderedSteps'`. The six axis question configs (`Time`, `Supplies`,
`Location`, `Social`, `Weather`, `Season`, `TimeOfDay`) are otherwise **unchanged** —
same options, same variants.

`EnrichmentCard` widens to accept an owner-agnostic target rather than assuming
Interest: `{ axis, answer, onAnswer, onBack, onForward, dueBy?, onDueByChange? }`
stays as the presentational contract (it already takes `answer`/`onAnswer` as props
and calls no service itself), but the **caller** (Step 6/8) now decides whether
`onAnswer` routes through `ConstraintService.answer({ interestId })` or `({ taskId })`
— no change to `EnrichmentCard`'s internals beyond dropping the `'type'`-variant
rendering branch and adding the two-question rendering. This is the same "dumb
component, service-agnostic" pattern already used, just exercised with a second
target. Extend `src/components/__tests__/EnrichmentCard.test.tsx` (if present) /
`enrichmentQuestions` tests for the two new configs; remove tests specific to the
retired `'type'` variant.

### Step 6: Rework `GuidedSetupScreen` — type-inference-first entry, per-type branch dispatch

Restructure the screen's sequencing logic, which currently just walks a flat
`COVERED_AXES` array. New shape: on load, if `type` is not yet determined
(`isTypeUnanswered` — Step 1's null-check), render `OneSitting` first, then
(conditionally, only if `oneSittingAnswer === 'No'`) `OrderedSteps` — routing both
through `InterestService.answerTypeQuestion`. Once `type` resolves (or was already
set from a prior visit), the screen branches:

- **`OneTimeProject` (Cutting):** unchanged from today — sequence through the six
  axis cards at the Interest level, exactly as Phase 2 built it. Per the design doc,
  "the existing card flow is already right here; leave it alone."
- **`StructuredLearning` (Trellis):** render the Task quick-add sub-flow (Step 7,
  ordered mode) once, then sequence through the six axis cards **once, at the
  umbrella** — same cards, same `ConstraintService.answer({ interestId })` target as
  Cutting.
- **`UnstructuredLearning` (Evergreen):** render the Task quick-add sub-flow (Step 7,
  unordered mode) once, then **exit** — no axis cards at the umbrella level at all;
  axis answers for an Evergreen are captured per-Task, lazily (Step 8), never in
  setup.

Route params widen from `{ interestId, startDimension? }` to `{ interestId, taskId?,
startAxis? }` (renaming `startDimension` since the union now includes the two
type-inference questions, not just `ConstraintDimension`s). When `taskId` is present,
every axis card's `onAnswer` targets `ConstraintService.answer({ taskId }, ...)`
instead of `{ interestId }` — this is how Step 8's per-Task editor reuses this same
screen rather than duplicating it. The single-card edit-in-place mode (`startAxis`
provided) is otherwise unchanged from Phase 2's mechanics — autosave, close-to-Detail
immediately after any answer. Update `RootNavigator`'s `GuidedSetup` route type
accordingly.

### Step 7: Task quick-add capture (name-only, incremental)

Add `src/components/TaskQuickAddList.tsx` — a presentational component (no service
calls, per the `EnrichmentCard`/`InterestListItem` pattern) taking the current draft
list of `{ title }` entries plus `add`/`remove`/`reorder` callbacks, rendering a
simple text-input-plus-add-row list. Ordered mode (Trellis) additionally exposes
drag-to-reorder or up/down controls; unordered mode (Evergreen) does not. This
component is used in two places: inside `GuidedSetupScreen`'s Trellis/Evergreen
branches (Step 6) for initial capture, calling `TaskService.add`/`reorder` per entry
as the user types (autosave-per-item, consistent with the rest of the flow's
autosave discipline — no "save all Tasks" button), and later, reused inside
`InterestDetailScreen`'s Tasks section (Step 9) for adding further Tasks after setup.
Paste-a-list entry (mentioned in the spec as a capture mode) is **not** built in this
phase — quick-add-one-at-a-time satisfies "added incrementally... never a mandatory
full-curriculum upfront"; paste-list is deferred to Phase 8 Polish (see Notes).

### Step 8: Task-level constraint editor (on-demand lazy enrichment)

Reuses `GuidedSetupScreen` (Step 6) with `taskId` set: reached from a Task row's edit
affordance in `InterestDetailScreen`'s Tasks section (Step 9). On load, if the Task's
type is `repeatable` (an Evergreen Task) and the umbrella has answers the Task
doesn't yet have for a given dimension, **pre-fill** that axis card's initial answer
with the umbrella's value (via `ConstraintService.effectiveForTask`, which already
computes exactly this) rather than leaving it blank — per the design doc, "the editor
pre-fills with the umbrella's values so the user amends rather than retypes." This is
a UI convenience only: what gets saved via `onAnswer` is a complete, Task-owned
`{ taskId }` answer, never a partial diff against the umbrella — the engine's
override logic (Step 1/4) is the only place inheritance actually happens.
`StructuredLearning` Tasks reach this same editor too (for the rare case for a step
needing one extra item beyond the umbrella's answers — the design doc's example is a
Trellis step needing a textbook), pre-filled the same way. This is the **only**
enrichment trigger this phase builds for Tasks — the design doc's other two
just-in-time triggers (a recommendation soft-block, a session ending) still depend on
Phase 3/4 subsystems that don't exist yet, exactly as Phase 2 already deferred them
for Interests.

### Step 9: `InterestDetailScreen` rework — Tasks section, per-type layout, completion entry points

Restructure the screen's answer area by type:

- **`OneTimeProject`:** unchanged axis chip row (today's `AnswerRow`s over the six
  axes), plus a **Complete** action (sets `state: 'Complete'` via
  `InterestService.setState`) — this already exists as a no-ceremony action once
  `state` can be set; this phase adds the explicit Complete button where none existed
  (Phase 2 only ever wired `Start`).
- **`StructuredLearning` / `UnstructuredLearning`:** the flat axis chip row is
  replaced by a **Tasks section** — for Trellis, an ordered list with the
  `nextActionable` Task visually distinguished (only it is "doable now"; the rest sit
  quietly underneath, per the design doc); for Evergreen, a list grouped by `state`
  (`armed` vs `closed`). Trellis retains its six umbrella-level axis chips above the
  Tasks section (unchanged mechanics, Interest-owned); Evergreen has **no**
  umbrella-level axis chips at all — nothing to show, since Evergreen axes live on
  Tasks. Each Task row shows its title, a complete/re-arm action (Step 10), and an
  edit affordance into Step 8's per-Task editor. `TaskQuickAddList` (Step 7) appears
  at the bottom of the Tasks section for adding more.
- **All three:** the `Type` `AnswerRow` is replaced by a **"Reconsider type"** row —
  tapping it re-opens `GuidedSetupScreen`'s two type-inference cards (Step 6), never
  a dropdown, per "changing type means revisiting those questions." **Type drift is
  upward only** (see the settled decision in Notes): with **no Tasks yet**, the row
  is always available and behaves exactly as described — there is nothing to
  reconcile, since `OneTimeProject → umbrella` is the only direction that ever needs
  to work smoothly and it costs nothing (a Cutting has no Tasks to begin with). Once
  **Tasks exist**, the row stops offering an outcome of `OneTimeProject` — if the
  user's answers to the two cards would infer `OneTimeProject` while the Interest
  still has Tasks, the screen does not apply that result; it explains that a
  Task-bearing interest can't convert to a one-time project, and points at
  delete-and-recreate as the honest path. No warning dialog, discard flow, or
  orphan-reconciliation UI is built — the guard simply prevents the transition from
  ever landing, so an orphaned-Tasks state is never reachable and there is nothing
  for this screen to render for it.

For `StructuredLearning`, when every Task's `state === 'done'`, and for
`UnstructuredLearning`, at any time (never gated on Task states), surface the
umbrella-level completion offer: "Mark complete?" for Trellis (`state: 'Complete'`),
and the **Conclude / Resting** action for Evergreen (also `state: 'Complete'` under
the hood, but presented as "Satisfied" / "Resting" copy, never "Finished" — per the
design doc's explicit guardrail). Both are offers, never forced, and both remain
available even when not all Tasks are done (Evergreen has no natural "all done"
state to gate on; Trellis's gate is a nudge, not a lock — the user can always declare
done early).

### Step 10: Task completion and re-arm interaction wiring

Wire each Task row's action(s) to `TaskService.complete`:

- **`sequenced`:** a single "Complete" action, calling `complete(taskId)` (no
  `rearm`). After completion, if this was the last non-`'done'` Task, surface the
  Trellis "Mark complete?" offer from Step 9 inline (a toast/banner, not a forced
  navigation).
- **`repeatable`:** completing offers an inline choice — "Close it out" (`complete
  (taskId, { rearm: false })`) or "Re-arm" (`complete(taskId, { rearm: true })`) —
  both bank the completion; the difference is only whether the Task returns to
  `'armed'` or moves to `'closed'`. A `'closed'` Task can be manually reopened back
  to `'armed'` from its row (a plain `TaskService`... **note:** the spec's
  `TaskService` contract has no bare "reopen" method distinct from `complete`; this
  phase adds one small affordance calling `TaskRepository.update(id, { state:
  'armed' })` directly through a thin `TaskService.reopen(taskId)` wrapper, mirroring
  `InterestService.unarchive`'s shape. Flagged below as a small contract addition.
- **Backlog → InProgress auto-flip** (Step 4's `TaskService.complete`) is exercised
  end-to-end here: the very first Task completion on a `Backlog` umbrella flips it to
  `InProgress` with no separate user action, visible immediately in the Detail
  screen's state label.

No Reflection prompt appears anywhere in this step — per the phase boundary, Task and
Interest completion in 2.5 carry **no** reflection capture; that layers in at Phase 5.

## Notes

- **Settled decision (user, 2026-08-20): type drift is upward only.** Reconsidering
  type from `OneTimeProject` into an umbrella must work smoothly regardless of
  state, and it already does trivially — a Cutting has no Tasks to begin with, so
  there is nothing to reconcile. Reconsidering a Task-bearing `StructuredLearning`/
  `UnstructuredLearning` interest *down* into `OneTimeProject` is **not a real
  flow** — the user would sooner delete the interest and recreate it, and that path
  already exists. The only realistic way to land on the wrong umbrella type is a
  mis-answer immediately at setup, when there are zero or near-zero Tasks — so the
  case that would produce orphaned Tasks and the case that actually occurs do not
  overlap. Consequently: with no Tasks, reconsidering type is freely available in
  either direction; once Tasks exist, reconsidering into `OneTimeProject` specifically
  is not offered (Step 9); `OneTimeProject → umbrella` is always available. This
  removes scope from the plan — no warning dialog, discard flow, or orphan-
  reconciliation UI is built, because the orphaned state this would have guarded
  against is never reachable in the first place.
- **Two Open Questions this phase owns; proposed answers, not yet exercised.** (1)
  *Task state model:* `armed | done | closed`, materialized as a column on `tasks`
  and driven by an append-only `task_completions` log via
  `TaskRepository.logCompletion` (Step 2/3) — the log satisfies "an event, not a
  flag" for history and future per-completion Reflections (Phase 5); the column
  satisfies the engine's need (Phase 3) to query "which Tasks are actionable" without
  recomputing from the log every time. (2) *Auto-flip on first completion:* **yes** —
  the first Task completion on a `Backlog` umbrella flips it to `InProgress`
  automatically (Step 4). This does not violate "completion is always user-declared,
  never auto-forced" — that rule governs the `Complete` state, not `InProgress`, and
  `InProgress` carries no judgment either way. Both are proposals; flag for one
  explicit confirmation before ticketing, per the brief.
- **Task-level enrichment timing (the third Open Question) — answered "both," but
  only "on-demand" is buildable now.** Step 8 builds the on-demand trigger (edit icon
  on a Task row). The just-in-time triggers (soft-block, session-end) require Phase
  3/4 subsystems that don't exist yet — identical reasoning to Phase 2's own
  deferral of its two JIT triggers. Nothing new to resolve here; restating it for
  completeness since the brief calls it out as this phase's to settle.
- **Type display names are explicitly out of scope**, per the spec's own Open
  Questions entry. This plan does not touch `displayLabel`'s `Cuttings`/`Trellises`/
  `Evergreens` strings.
- **The completion-is-an-event assumption is followed as the spec states it**, but
  is flagged for one explicit look (see Flag for the user) since the brief notes the
  user never confirmed it in those exact words.
- **Reordering a Task list is `StructuredLearning`-only**, per the spec's
  `TaskService.reorder` contract; `UnstructuredLearning` Tasks have a `position` for
  stable list rendering ("user order") but no reorder UI in this phase — new
  repeatable Tasks simply append.
- **Paste-a-list Task capture and drag-to-reorder polish are deferred to Phase 8**,
  same rationale as Phase 2's deferred animated transitions — quick-add-one-at-a-time
  satisfies the spec's incremental-capture requirement; richer input is a later
  refinement, not a blocker.
- **`EnergyFocus` is untouched by this phase** — still a valid, stored
  `ConstraintDimension` with no question card, at either the Interest or (now) Task
  level. Nothing in this phase changes its status.
- **Constraint rows cascade-delete with their owner** — Interest-owned rows on
  Interest delete (unchanged from Phase 2), Task-owned rows on Task delete (new,
  Step 2's migration 011 `ON DELETE CASCADE`) — `TaskService.remove` needs no
  corresponding `ConstraintService` cleanup call, mirroring the existing Interest
  precedent.
- **What Phase 3 can rely on once this lands:** `Task.state` as the single source of
  truth for "is this actionable" (no recomputation from `task_completions` needed at
  read time); `TaskService.nextActionable(interestId)` for umbrella candidate
  selection; `ConstraintService.effectiveForTask(taskId)` as the one call that
  produces the fully-resolved, override-applied constraint set to evaluate; `Interest.
  type` as stable and query-ready (no need to re-run inference at recommendation
  time); `OneTimeProject` interests continuing to be evaluated as a whole via the
  existing Interest-level `ConstraintService.listForInterest`. Phase 3 does not need
  to know about `oneSittingAnswer`/`orderedStepsAnswer` at all — those are
  setup-time-only inputs to a value (`type`) it already knows how to read.
- **Tests are embedded per step, not a separate final step** — same rationale as
  Phases 1 and 2: every layer here carries real logic (domain inference/validation,
  repository state-transition and cascade correctness, service cross-aggregate
  orchestration, screen branching), so each step's ticket includes its own tests.

## Flag for the user

- **`EditInterestScreen` has no type picker to remove.** The brief's list of surfaces
  to rework names it; the shipped file has no `type` reference at all. The actual
  surface reworked by this plan is the `'type'` `EnrichmentCard` variant / the `Type`
  row on `InterestDetailScreen`, reached via `GuidedSetupScreen`. No action needed on
  `EditInterestScreen` itself — confirm this reading is correct before ticketing.
- **The exact `(oneSittingAnswer, orderedStepsAnswer) → InterestType` truth table
  (Context) is this plan's proposal, not literal spec text.** The spec authorizes
  "two behavioral questions" but not their combinatorics. Worth one look, especially
  the edge case implicit in the spec's own `OneTimeProject` example — "build garage
  shelves" plausibly spans more than one literal sitting, yet is clearly not an
  umbrella. If "one sitting" is meant loosely ("one continuous undertaking," not
  literally ≤1 session), the card's copy should say so explicitly rather than leaving
  it to the user's literal reading; this plan does not attempt to fix the spec's
  wording, only flags the tension.
- **Asking `OrderedSteps` only when `oneSittingAnswer === 'No'`** (Step 6) is a UX
  tightening beyond the spec's literal two-question description. Low risk, but it is
  a divergence from "ask both questions" if that was meant literally rather than as
  a description of the decision tree's shape.
- **The completion-is-an-event-not-a-flag assumption** (spec: `task_completions` as
  an append-only log rather than a boolean on `tasks`) is implemented as stated, per
  the brief's instruction to treat it as given — but the brief is explicit that the
  user never confirmed it in those words. One look before Step 2/3 tickets are
  written would be cheap insurance; the alternative (a single boolean + `completedAt`
  on `tasks`, no log table) is a strictly smaller change if reflection-per-completion
  (Phase 5) turns out not to need row-level granularity after all.
- **Contract changes for `spec/CHANGELOG.md` at ticketing time:** `InterestService.
  skipType` is removed and replaced by `answerTypeQuestion`; `InterestService`/
  `InterestRepository`'s patch `Pick` gains `oneSittingAnswer`/`orderedStepsAnswer`;
  `Constraint`'s `interestId` becomes nullable and gains `taskId`; a new
  `TaskService.reopen(taskId)` exists beyond the spec's current `TaskService` listing
  (Step 10); migrations run 001–011, not 001–007.
  `GuidedSetupScreen`'s route param renames `startDimension` → `startAxis` and widens
  its type.
- **A remaining gap, smaller:** an Evergreen with zero Tasks and a Trellis with zero
  Tasks are both valid post-migration states (Context) with no `Task` for a user to
  interact with beyond "add one." This phase's Detail screen (Step 9) must render
  that empty state gracefully; it is not separately ticketed above because it falls
  out of Step 9's Tasks-section work, but call it out explicitly at ticketing so it
  isn't missed as an edge case.

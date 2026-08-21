# greenhouse — Changelog

## [2026-08-20] — Synced API Contracts to the Phase 2.5 plan; recorded upward-only type drift
- Triggered by: Phase 2.5 planning (`docs/planning/phasePlans/phase-2.5-interest-shapes-tasks.md`
  and `docs/planning/ticketPlans/ticket-plan-phase-2.5.md`), which surfaced contract deltas
  the tickets depend on. Documentation only — no code written; Phase 2.5 is not yet
  implemented. Every delta below is a consequence of a decision already recorded in the
  previous entry, not a new decision.
- Changed: `InterestService.skipType` **removed**, replaced by
  `answerTypeQuestion(id, question: 'OneSitting' | 'OrderedSteps', answer: 'Yes' | 'No' | 'Unknown')`.
  With type derived rather than asked there is nothing to skip; the method records one
  inference answer and re-derives `type` from the pair. The 2026-07-19 `typeSkippedAt`
  decision is annotated in place rather than deleted — `typeSkippedAt` now means "not yet
  enough answered to determine a type."
- Changed: `InterestService.update` and `InterestRepository.update` patch `Pick` gains
  `oneSittingAnswer` and `orderedStepsAnswer`.
- Added: `TaskService.reopen(taskId)` — un-closes a closed Task, mirroring the existing
  rule that Interests can be re-opened.
- Changed: `Constraint.interestId` becomes `InterestId | null` and `Constraint` gains
  `taskId: TaskId | null`, exactly one of which is set. The `UNIQUE (interest_id,
  dimension)` guarantee becomes a pair of partial unique indexes so a Task's answers and
  its umbrella's cannot collide. Recorded in the Domain Model's Constraint section.
- Added: **Type drift is upward only** to Resolved Decisions — user ruling, 2026-08-20.
  `OneTimeProject` → umbrella is a real and trivial flow; umbrella-with-Tasks →
  `OneTimeProject` is not a real flow (a user would delete and recreate), and the only
  way to land on a wrong umbrella type is a mis-answer at setup when no Tasks exist. So
  the orphaning case and the occurring case never overlap. With no Tasks, reconsideration
  is free in either direction; once Tasks exist the inference flow never lands on
  `OneTimeProject`. **No warning dialog, discard flow, or orphan-reconciliation UI.**
- Changed: the `OneTimeProject` illustration from "build shelves, paint a room" to
  one-sitting examples, with an explicit note that the examples illustrate the shape and
  do not fix any particular pursuit's type — the user's answers decide it. The previous
  examples read as multi-session work sitting under a one-sitting definition.
- Note: two further deltas are implementation-level and are **not** reflected in the
  spec, which does not describe screens or routes — migrations now run 001–011 (was
  001–007), and `GuidedSetupScreen`'s route param renames `startDimension` → `startAxis`,
  widens to `'OneSitting' | 'OrderedSteps' | Exclude<ConstraintDimension, 'EnergyFocus'>`,
  and adds an optional `taskId`. Both are captured in the ticket plan.

## [2026-08-20] — Remodelled the three Interest types as container shapes; added the Task entity and Phase 2.5
- Triggered by: Phase 2 UAT finding that the three types "are three different types of
  interests bundled into the same questionnaire and data box and just slapped with a
  label to differentiate them." Resolves the standing todo to revisit
  `StructuredLearning`/`UnstructuredLearning` together with the deferred Complete
  affordance. Documentation only — no code written; Phase 2.5 is not yet planned.
- Added: **`Task`** to the Domain Model — the child of an umbrella Interest, one entity
  with two modes (`repeatable` for `UnstructuredLearning`, `sequenced` for
  `StructuredLearning`). Completion is logged as an **event, not a flag**, so a
  repeatable Task accumulates history and each completion can carry its own optional
  Reflection; "re-arm" is log-and-make-actionable-again, keeping one durable row per
  Task rather than spawning instance rows.
- Changed: **`Interest` types are now three container shapes.** `OneTimeProject` is
  itself the unit of work and has **no** Tasks; the other two are umbrellas over Tasks.
  The Shape & completion table now keys on Tasks rather than Steps, and completion moves
  **down** to the Task — which makes guilt-free Conclude/Resting structural rather than
  special-case copy, and dissolves the Complete-button question deferred in Phase 2.
- Removed: the sketched **`Step`** entity and `StepService`. `Step` is now the
  `sequenced` mode of `Task`; `TaskService` and `TaskRepository` replace them in API
  Contracts.
- Added: **Type is derived, never asked.** Two behavioral questions ("can this be
  finished in one sitting?", "is there a set order of steps to get there?") determine
  type, which is stored as a consequence. Type is no longer a free-standing editable
  field, and `typeSkippedAt` simplifies to "not yet enough answered to determine."
- Added: **Constraint level is a property of the type.** Constraints attach to an
  Interest or a Task; resolution is per-dimension **override** (Task's answer, falling
  back to the umbrella's) with no merge or union semantics. `ConstraintService` gains
  `listForTask` / `effectiveForTask` and `answer`'s target widens from Interest-only.
- Added: **The guided flow is per-type, not one flow with a branch** — recorded in the
  spec's Resolved Decisions and expanded in `docs/planning/ux-design-intent.md`. A
  uniform flow forced a choice between a 30-plus-question setup and umbrella-level
  questions that read as incoherent; both are artifacts of the uniform flow, not the
  model. Tasks are captured name-only at setup, with Task-level axes filled in lazily.
- Added: **Phase 2.5 — Interest Shapes (Tasks)** to the Feature Roadmap, positioned as
  blocking Phase 3. Phase 3/4/5/6 cells updated: recommendation candidates are Tasks for
  umbrella interests and the Interest itself for `OneTimeProject`; sessions attach to the
  Task where one exists; reflections are offered on any completion and never required;
  concluding an umbrella gives impact capture a natural trigger.
- Resolved: the Open Question "Which phase owns the `Step` entity, and which phase owns
  type-specific Interest behavior" — both are owned by Phase 2.5.
- Added: three narrower Open Questions in its place — type **display names**
  (Cuttings/Trellises/Evergreens still read awkwardly; explicitly not blocking), the
  **Task state model**, and **Task-level enrichment timing**.
- Changed: `docs/planning/ux-design-intent.md` (the living design doc) — added "The flow
  is per-type, not one flow with a branch", explicitly superseding the single-flow
  mechanics above it, and rewrote "Interest Shapes & Structured Itineraries" around
  umbrellas, Tasks, and the complete → reflect → close-or-re-arm loop.
- Changed: sharpened the frozen banners on `docs/DOMAIN_MODEL.md`,
  `docs/RECOMMENDATION_ENGINE.md`, `docs/SYS_ARCH.md`, and `docs/ROADMAP.md` to name
  exactly what is stale and instruct readers not to cite them. These four were **not**
  rewritten: their contents were merged into the spec on 2026-07-16, so re-syncing them
  would restore the duplication that consolidation removed. The banners exist so a
  reviewer or planning agent cannot mistake them for current truth — notably
  `RECOMMENDATION_ENGINE.md`, which has contradicted the "feasibility filter, not a
  preference model" decision since 2026-07-16, independent of Phase 2.5.

## [2026-08-20] — Documented migration 007's full row rewrite and corrected the Interest patch signatures
- Triggered by: Phase 2 review (spec reviewer findings, recorded as todos in
  `sessions/todo.md`). Documentation only — the shipped code was already correct
  in every case below; only the spec lagged.
- Changed: The `Weather`/`Season`/`TimeOfDay` **Migration** paragraph now
  enumerates all four row-rewrite cases migration 007 implements, not two. Newly
  documented: a `None` row with no value fans out into three `None` rows (one per
  new dimension, ids derived as `<id>-Weather` / `<id>-Season` / `<id>-TimeOfDay`,
  original timestamps preserved) because "weather or time of year doesn't matter"
  answered all three axes at once and dropping it would silently reopen an
  answered question; and any remaining valueless (`Unknown`) row is dropped,
  since `ConstraintService.listForInterest` synthesizes `Unknown` for absent rows,
  making a dropped row and a stored one indistinguishable to every reader.
- Changed: `InterestService.update` in API Contracts — added `'dueBy'` to the
  patch `Pick`, matching the shipped `InterestPatch` (`src/domain/interest.ts`).
  The spec's Due date prose already documented the feature; only the literal
  signature lagged.
- Changed: `InterestRepository.update` in API Contracts — was `Partial<Interest>`,
  now the same narrow `Pick`-based patch as `InterestService.update`. The shipped
  repository has always taken `InterestPatch`; the wide `Partial<Interest>` in the
  spec sanctioned a patch the code deliberately rejects.

## [2026-07-19] — Recorded four settled Phase 2 planning decisions
- Triggered by: Phase 2 planning (phase plan + ticket plan "Flag for the user")
- Context: `docs/planning/phasePlans/phase-2-guided-interest-setup.md` and
  `docs/planning/ticketPlans/ticket-plan-phase-2.md` settled several decisions
  beyond the spec's first-pass draft, flagged for the spec to record before
  Phase 2 tickets (#21–#28) are implemented. Documentation only — no Phase 2
  code was written.
- Added: `ConstraintService` to API Contracts — `listForInterest(interestId)`,
  `answer(interestId, dimension, input)`, `needsEnrichment(interestIds,
  dimensions)` — required by the "Presentation calls Services" layering rule,
  since no screen may call `ConstraintRepository` directly.
- Changed: `ConstraintRepository` in API Contracts gains
  `findFullyAnsweredInterestIds(interestIds, dimensions)`; documented
  `replaceForInterest` as a per-dimension upsert (dimensions absent from the
  call are left untouched), not a wipe-and-reinsert.
- Resolved: "Constraint storage shape" (previously an Open Question) — the
  Domain Model's eight conceptual Constraint axes are stored as six
  `ConstraintDimension` values (`WeatherSeason` merges weather+seasonal,
  `EnergyFocus` merges energy+focus), one row per (interest, dimension) with a
  `UNIQUE` constraint, `ConstraintStatus` of `Unknown | None | Set`, a
  JSON-encoded value, and `ON DELETE CASCADE` from the parent interest. Moved
  from Open Questions to Resolved Decisions.
- Changed: Noted `EnergyFocus` is a valid, stored `ConstraintDimension` from
  Phase 2 onward but has no question card built until a later phase, per the
  design-intent doc's "(later)" annotation and the Recommendation Engine's
  deferral of energy/focus evaluation. Qualified the Feature Roadmap's Phase 2
  cell text accordingly so it no longer implies energy/focus is captured in
  v1.
- Added: `Interest.typeSkippedAt: string | null` — a durable marker that the
  user deliberately answered "Not sure" to the Type question, mirroring the
  `archivedAt` pattern; distinct from `type === null` meaning "never asked."
  Added `InterestService.skipType(id): Promise<Interest>` to API Contracts, and
  widened `InterestService.update`'s patch type to include `typeSkippedAt`.
  Choosing an actual type clears `typeSkippedAt`.
- Added: Sharpened an Open Question — which phase owns the `Step` entity, and
  which phase owns type-specific Interest behavior (no-ceremony Complete /
  guilt-free Conclude-Resting / Steps-based completion) — left unresolved for
  the user to decide before Phase 3 is planned.

## [2026-07-19] — Reconciled InterestService/Repository contracts with Phase 1 implementation
- Triggered by: Phase 1 review (code-reviewer-spec findings), disposed as fix
- Context: The implemented `InterestService`/`InterestRepository` diverged from the
  API Contracts section in three ways surfaced by review: `archive` was declared as
  `Promise<void>` but implemented as `Promise<Interest>`; `update`'s patch type was
  declared as `Partial<InterestDetails>` (type only) but Ticket #18 requires title
  edits via `update`, and the implementation (post title-patch-corruption fix, see
  below) accepts `title`/`type`/`state`/`archivedAt`; `list`'s filter omitted
  `includeArchived`, which Tickets #19/#20 require. Direction: update the spec to
  match the implementation — the ticket acceptance criteria mandate this behavior.
- Changed: `InterestService.archive` now documented as `Promise<Interest>`.
- Changed: `InterestService.update`'s patch type narrowed to
  `Partial<Pick<Interest, 'title' | 'type' | 'state' | 'archivedAt'>>`, matching the
  narrowed `InterestPatch` type introduced in `src/domain/interest.ts` (a quality
  fix closing a latent bug where an unrestricted `Partial<Interest>` patch could
  silently overwrite `createdAt`).
- Changed: `InterestService.list`'s filter parameter now includes
  `includeArchived?: boolean`, matching `InterestFilter` and the default-hides-archived
  behavior implemented in Ticket #14 and exercised by Tickets #19/#20.

## [2026-07-18] — Closed InterestService contract gap (delete/unarchive)
- Triggered by: Phase 1 phase plan (flagged contract gap)
- Context: `InterestService` declared `archive` (soft-remove) but had no `delete`
  (permanent hard removal) or `unarchive` (recover from archive), despite both being
  required by the roadmap ("archive or delete interests") and the "Archive =
  soft-delete flag" resolved decision (archived interests are recoverable; delete is
  a separate, permanent hard removal).
- Changed: Added `unarchive(id: InterestId): Promise<Interest>` and
  `delete(id: InterestId): Promise<void>` to `InterestService` in the API Contracts
  section, next to `archive`. `delete` maps to the existing `InterestRepository.remove()`
  — no repository change needed. This is a first-pass-draft refinement per the
  section's own note, not a scope change.

## [2026-07-16] — Wired seed design tokens into the workflow
- Triggered by: user (catchAll theme files)
- Context: catchAll/light_theme.ts + dark_theme.ts (committed) were orphaned — no
  artifact referenced them, and both import a `Theme` type that doesn't exist yet.
- Changed: Added a "Visual Design & Theming" section to docs/planning/ux-design-intent.md
  pointing at the seed tokens, flagging the missing `Theme` type and the need to relocate
  out of catchAll/ — both as Phase 0 tasks.
- Changed: Added a design-system/theming pointer in the spec's Frontend architecture, and
  extended the design-intent reading pointer to include Phase 0.

## [2026-07-16] — Captured UX design intent; skip-vs-none semantic
- Triggered by: user (design-doc question)
- Added: docs/planning/ux-design-intent.md — living design-intent doc holding the
  guided-setup flow (capability-not-completion, card flow, skip vs. doesn't-apply,
  just-in-time enrichment, question set, guardrails), interest-shape UX, and
  fulfillment-capture interaction (two signals, capture-the-choice, no scoreboard).
- Changed: Added a pointer to the design doc from the spec's Feature Roadmap.
- Changed: Promoted the skip (unknown) vs. doesn't-apply (explicitly-none) distinction
  into the spec's Recommendation Engine — the two states must be stored distinctly since
  they drive feasibility differently.

## [2026-07-16] — Interest shapes: Steps, per-type completion, revealed fulfillment
- Triggered by: user (domain-model iteration)
- Changed: Domain Model now distinguishes the three Interest shapes. Added a `Step`
  entity for StructuredLearning (ordered itinerary, incremental, own done-state),
  un-deferring the previously-shelved Milestone concept — narrowly, structured-only.
- Changed: Reframed Session as the frictionless record of *choosing* to do an interest
  (captured at point-of-choice, no manual logging). Reframed Reflection around two
  fulfillment signals: stated (self-report) and revealed (how often the user chose it).
  Both are internal; raw counts/streaks are never shown to the user.
- Changed: Completion is now per-type and always user-declared (one-time = done;
  unstructured = guilt-free Conclude/Resting; structured = Steps done). The engine now
  surfaces the *next incomplete Step* for structured interests.
- Changed: Added StepService to the draft contracts and `Step` to project-config.json
  domain entities. Added an Open Question on which interaction counts as "choosing."

## [2026-07-16] — Resolved open questions; recommendation engine reframed
- Triggered by: user (open-questions walkthrough)
- Changed: Rewrote the Recommendation Engine section — it is a deterministic
  feasibility filter over the backlog, not a preference/behavior model. Removed all
  historical-fulfillment / preference / creativity-challenge-novelty ranking. Hard vs.
  soft blocks are now computed per-dimension at evaluation time (soft = shown+warned,
  hard = excluded); analytics never feed recommendations.
- Changed: Added a Resolved Decisions section recording all five decisions (feasibility
  filter, computed hard/soft, archive = soft-delete flag, milestones deferred, backup =
  SQLite file copy for v1 with JSON export deferred).
- Changed: Trimmed Open Questions to the two genuinely-open items (per-dimension
  thresholds/tolerance bands → Phase 3; constraint storage shape → Phase 2).
- Changed: Consistency pass after the reframe — removed lingering "score → rank"
  language from the Phase 3 roadmap cell, the "ranked" Recommendation entity wording,
  and "recommendation rankings" in derived state, so nothing implies desirability
  ranking anymore.

## [2026-07-16] — Spec consolidated into single source of truth
- Triggered by: user (spec fleshing-out)
- Changed: Populated PROJECT_SPEC.md by consolidating PRD.md and the docs/ planning
  files (DOMAIN_MODEL, SYS_ARCH, ROADMAP, RECOMMENDATION_ENGINE, ADR-001, ADR-002)
  into one living spec: Vision/Principles, Domain Model, Architecture, Recommendation
  Engine, internal Service & Repository Contracts (first-pass draft), Feature Roadmap,
  Open Questions, Constraints & Non-Goals.
- Changed: Stamped the seven historical docs (PRD + six docs/ files) with a banner
  marking them frozen and superseded by spec/PROJECT_SPEC.md. README.md left as-is
  (repo front door, not a spec source).
- Note: "API Contracts" section is internal in-process interfaces (no HTTP API); it
  is a first-pass draft to be refined per phase. Open Questions captures unresolved
  domain/schema decisions surfaced during consolidation.

## [2026-07-16 17:44] — Spec initialized
- Triggered by: bootstrap
- Changed: Created initial PROJECT_SPEC.md scaffold.

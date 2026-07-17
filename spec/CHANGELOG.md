# greenhouse — Changelog

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

# greenhouse — Changelog

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

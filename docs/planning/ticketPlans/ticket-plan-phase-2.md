# Ticket Plan: Phase 2 — Guided Interest Setup

**Purpose:** Let the user optionally enrich any Interest — its type, and five of the six constraint axes that will drive Phase 3's feasibility filtering — through a low-friction, card-based flow that never gates saving or using the interest and treats "not sure yet" as a durable answer.
**Total tickets:** 8
**Prefix:** P2:
**Status: LOCKED**

---

## Ticket 1 of 8

**Title:** P2:Extend the Interest domain model and define the Constraint domain model

**Description:**
In `src/domain/interest.ts`, add the durable type-skip field this phase needs. In a new `src/domain/constraint.ts`, define the entity shapes the rest of the phase builds on — six `ConstraintDimension` values, `ConstraintStatus`, a per-dimension `ConstraintValue` union, `Constraint` — plus the one pure business rule this phase needs: that a constraint's `value` is present if and only if it's been answered.

**Acceptance Criteria:**
- [ ] `src/domain/interest.ts`'s `Interest` interface gains `typeSkippedAt: string | null`.
- [ ] `InterestPatch` is widened to `Partial<Pick<Interest, 'title' | 'type' | 'state' | 'archivedAt' | 'typeSkippedAt'>>` — still a narrow `Pick`-based patch type, not a wide `Partial<Interest>`.
- [ ] `src/domain/constraint.ts` defines `ConstraintId` (string alias), `ConstraintDimension` (`'Time' | 'Supplies' | 'Location' | 'Social' | 'WeatherSeason' | 'EnergyFocus'`), and `ConstraintStatus` (`'Unknown' | 'None' | 'Set'`).
- [ ] `ConstraintValue` is a discriminated union: `Time` → one of five buckets (`'5-15' | '15-30' | '30-60' | '1hr+' | 'Varies'`); `Supplies` → `{ name: string; have: boolean }[]`; `Location` → `'Home' | 'Specific' | 'Anywhere'`; `Social` → `'Solo' | 'NeedsPeople'`; `WeatherSeason` → `{ matters: true; note?: string }`; `EnergyFocus` → `'Low' | 'Medium' | 'High'`.
- [ ] `Constraint` is defined with `id`, `interestId`, `dimension`, `status`, `value: ConstraintValue | null`, `createdAt`, `updatedAt`.
- [ ] A validation function (e.g. `assertValidConstraintAnswer`) throws when `status === 'Set'` and `value` is absent, and throws when `status !== 'Set'` and `value` is present; it accepts a valid `Set` answer with a matching value and a valid `Unknown`/`None` answer with no value.
- [ ] `src/domain/__tests__/constraint.test.ts` covers the validation function's accept and reject cases.
- [ ] No persistence or UI code exists in `src/domain/interest.ts` or `src/domain/constraint.ts`.

---

## Ticket 2 of 8

**Title:** P2:Add the constraints table and type_skipped_at migrations

**Description:**
Add `src/db/migrations/003_create_constraints.ts` to create the `constraints` table, and `src/db/migrations/004_add_type_skipped_at_to_interests.ts` to add the durable type-skip column to `interests`.

**Acceptance Criteria:**
- [ ] `src/db/migrations/003_create_constraints.ts` implements the `Migration` interface and is registered in `src/db/migrations/index.ts`.
- [ ] The `constraints` table has columns: `id TEXT PRIMARY KEY`, `interest_id TEXT NOT NULL REFERENCES interests(id) ON DELETE CASCADE`, `dimension TEXT NOT NULL` (`CHECK` constrained to `'Time'`, `'Supplies'`, `'Location'`, `'Social'`, `'WeatherSeason'`, `'EnergyFocus'`), `status TEXT NOT NULL` (`CHECK` constrained to `'Unknown'`, `'None'`, `'Set'`), `value TEXT` (nullable), `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL`, and a `UNIQUE (interest_id, dimension)` constraint.
- [ ] `src/db/migrations/004_add_type_skipped_at_to_interests.ts` implements the `Migration` interface, is registered in `src/db/migrations/index.ts`, and adds a nullable `type_skipped_at TEXT` column to `interests` via `ALTER TABLE`.
- [ ] Both migrations run inside a transaction, consistent with the existing migration runner's guarantees.
- [ ] A test (extending `src/db/__tests__/migrationRunner.test.ts`) confirms `003` and `004` apply cleanly on top of `001`/`002` in order, and that running the full migration set twice does not fail or duplicate applied-migration records.
- [ ] No repository or service code is added in this ticket.

**Dependencies:** Ticket 1 — the `dimension`/`status` `CHECK` constraints must match the `ConstraintDimension`/`ConstraintStatus` domain values.

---

## Ticket 3 of 8

**Title:** P2:Extend InterestRepository for typeSkippedAt; implement ConstraintRepository

**Description:**
Extend `InterestRepository`'s row mapping and SQL to persist `type_skipped_at`. Add `src/repositories/ConstraintRepository.ts`, implementing the spec's `find`/`replace` contract as a per-dimension upsert, plus a bulk query the Detail screen and List screen will need to check enrichment status without N+1 queries.

**Acceptance Criteria:**
- [ ] `InterestRepository`'s row-to-domain mapping reads `type_skipped_at` into `typeSkippedAt`.
- [ ] `InterestRepository.insert` and `InterestRepository.update` read and write `type_skipped_at` (insert defaults it to `null`; update persists whatever value is present in the patch).
- [ ] `InterestRepository.update`'s signature remains `update(id, patch: InterestPatch)` — not reverted to a wider `Partial<Interest>`.
- [ ] `src/repositories/ConstraintRepository.ts` extends `BaseRepository` and uses `withConnection` exclusively.
- [ ] `findForInterest(interestId): Promise<Constraint[]>` returns every stored row for that interest — no default-hides-anything filtering.
- [ ] `replaceForInterest(interestId, constraints: Constraint[]): Promise<void>` upserts each given `Constraint` by `(interest_id, dimension)`: for a dimension with no existing row, it generates `id`/`created_at` server-side (any caller-supplied `id`/`createdAt` is ignored, not trusted); for a dimension with an existing row, it preserves that row's original `id`/`created_at` and overwrites `status`/`value`, bumping `updated_at`. Dimensions not present in the call are left untouched.
- [ ] `findFullyAnsweredInterestIds(interestIds: InterestId[], dimensions: ConstraintDimension[]): Promise<Set<InterestId>>` returns, via a single grouped SQL query (no per-interest loop), the subset of `interestIds` that have every given dimension answered (`status` of `'Set'` or `'None'`).
- [ ] Row-to-domain mapping (JSON encode/decode of `value`) is private to `ConstraintRepository.ts` and not exported.
- [ ] `src/repositories/__tests__/InterestRepository.test.ts` is extended to confirm `typeSkippedAt` round-trips through `insert` and `update`.
- [ ] `src/repositories/__tests__/ConstraintRepository.test.ts` (new) runs against a real test SQLite connection and covers: insert-on-first-answer, update-in-place on re-answer (with `id`/`createdAt` preserved), that answering one dimension leaves sibling dimensions untouched, that deleting the parent interest cascades to its constraint rows, and `findFullyAnsweredInterestIds` against a mix of fully- and partially-answered interests.

**Dependencies:** Ticket 2 — requires the `constraints` table and `type_skipped_at` column; Ticket 1 — requires the domain types.

---

## Ticket 4 of 8

**Title:** P2:Extend InterestService with skipType; implement ConstraintService

**Description:**
Add `InterestService.skipType`, the durable counterpart to setting an interest's type. Add `src/services/ConstraintService.ts` as the sole caller of `ConstraintRepository`, providing a normalized six-entry constraint list, validated single-dimension answers, and a bulk "needs enrichment" check.

**Acceptance Criteria:**
- [ ] `InterestService.skipType(id): Promise<Interest>` calls `InterestRepository.update` (via `update`) with `{ type: null, typeSkippedAt: <current ISO-8601 timestamp> }`.
- [ ] `src/services/ConstraintService.ts` is the sole caller of `ConstraintRepository`.
- [ ] `listForInterest(interestId): Promise<Constraint[]>` calls `ConstraintRepository.findForInterest` and returns exactly six entries — one per `ConstraintDimension` (`Time`, `Supplies`, `Location`, `Social`, `WeatherSeason`, `EnergyFocus`) — synthesizing `{ status: 'Unknown', value: null }` for any dimension with no stored row.
- [ ] `answer(interestId, dimension, input: { status: ConstraintStatus; value?: ConstraintValue }): Promise<Constraint>` runs Ticket 1's validation before calling `ConstraintRepository.replaceForInterest` with a single-element array, and rejects (without calling the repository) when validation fails.
- [ ] `needsEnrichment(interestIds: InterestId[], dimensions: ConstraintDimension[]): Promise<Set<InterestId>>` calls `ConstraintRepository.findFullyAnsweredInterestIds` and returns the complement — the interest ids from `interestIds` that are *not* in the fully-answered set.
- [ ] `src/services/__tests__/InterestService.test.ts` is extended to verify `skipType`'s exact patch to the mock repository.
- [ ] `src/services/__tests__/ConstraintService.test.ts` (new) uses a fake/mock repository and verifies: `listForInterest`'s six-entry fill-in (including for an interest with zero stored rows); `answer`'s validation before delegating, with both an accepted and a rejected case; and `needsEnrichment`'s complement logic.
- [ ] No screen or component in this ticket imports `ConstraintRepository` directly.

**Dependencies:** Ticket 3 — requires the extended `InterestRepository` and `ConstraintRepository`; Ticket 1 — requires the domain validation rule.

---

## Ticket 5 of 8

**Title:** P2:Build the reusable EnrichmentCard component and question config

**Description:**
Add a presentational `EnrichmentCard` component and a data-driven question config covering `Type` plus five constraint dimensions (`EnergyFocus` deliberately excluded), which `GuidedSetupScreen` (Ticket 6) and the Detail screen (Ticket 7) will both consume.

**Acceptance Criteria:**
- [ ] `src/components/EnrichmentCard.tsx` is presentational only — it receives the current answer and an `onAnswer` callback as props and calls no service directly.
- [ ] It renders the question's chip options plus two escape hatches, "Not sure / later" and "None / doesn't apply", styled identically to the answer chips (no warning/error styling on either).
- [ ] `src/screens/enrichmentQuestions.ts` defines question copy and chip options for exactly six axes: `Type`, `Time`, `Supplies`, `Location`, `Social`, `WeatherSeason`. There is no entry for `EnergyFocus`.
- [ ] The `Type` entry offers three type chips (`OneTimeProject`, `StructuredLearning`, `UnstructuredLearning`) plus "Not sure" only — no "None / doesn't apply" option.
- [ ] The `Supplies` entry's card variant supports adding/removing light `{ name, have }` items rather than rendering pure single-select chips.
- [ ] The `WeatherSeason` entry offers a "matters" toggle plus an optional short free-text note field.
- [ ] The config exports an ordered covered-axis list: `['Type', 'Time', 'Supplies', 'Location', 'Social', 'WeatherSeason']`.
- [ ] `src/components/__tests__/EnrichmentCard.test.tsx` covers: rendering the chip options for a given axis; invoking `onAnswer` with `status: 'Set'` and the matching value on a chip tap; invoking `onAnswer` with `status: 'Unknown'` on "Not sure"; and invoking `onAnswer` with `status: 'None'` on "Doesn't apply" for a non-`Type` axis.
- [ ] No screen or service code is added in this ticket — wiring into `GuidedSetupScreen` is Ticket 6, wiring into the Detail screen is Ticket 7.

**Dependencies:** Ticket 1 — requires `ConstraintDimension`/`ConstraintStatus`/`ConstraintValue`.

---

## Ticket 6 of 8

**Title:** P2:Build GuidedSetupScreen

**Description:**
Add `src/screens/GuidedSetupScreen.tsx`, the single screen serving both the sequential first-run enrichment flow and single-card edit-in-place, respecting the durable type-skip and never surfacing `EnergyFocus`.

**Acceptance Criteria:**
- [ ] `GuidedSetupScreen.tsx` accepts route params `{ interestId, startDimension?: 'Type' | ConstraintDimension }`.
- [ ] On mount it loads `ConstraintService.listForInterest(interestId)` and the interest via `InterestService.get`, then narrows to Ticket 5's covered-axis list — `EnergyFocus` is never rendered or sequenced through by this screen, regardless of what `listForInterest` returns.
- [ ] When `startDimension` is provided, the screen renders exactly one `EnrichmentCard` for that axis and navigates back to `InterestDetail` immediately after any answer, including an escape hatch.
- [ ] When `startDimension` is omitted, the screen sequences through the covered axes that are currently unanswered: `Type` counts as unanswered only when `type === null && typeSkippedAt === null`; a constraint dimension counts as unanswered when its `status === 'Unknown'`. It auto-advances to the next unanswered card after each autosaved answer.
- [ ] An already-`Set`/`None` dimension, and a `Type` with `typeSkippedAt` already set, are **not** re-offered by the sequential flow.
- [ ] An always-visible "Close" affordance returns to `InterestDetail` from any card, in either mode. No progress bar or "N of M" count is rendered anywhere on this screen.
- [ ] Choosing a type chip calls `InterestService.update(id, { type, typeSkippedAt: null })`; choosing "Not sure" on the `Type` card calls `InterestService.skipType(id)`.
- [ ] Dimension cards call `ConstraintService.answer(interestId, dimension, { status, value })` on every answer, including escape hatches.
- [ ] Every answer autosaves immediately — no separate "Save" action exists anywhere on this screen.
- [ ] A rejected/failed service call (e.g. `ConstraintService.answer` throwing) is surfaced as inline feedback on the screen, not an unhandled promise rejection.
- [ ] The route is registered in `RootNavigator`'s param list.
- [ ] `src/screens/__tests__/GuidedSetupScreen.test.tsx` covers: single-card mode answering and returning to `InterestDetail`; sequential mode advancing through multiple unanswered cards; sequential mode skipping a dimension already `Set` or `None`; sequential mode skipping `Type` when `typeSkippedAt` is already set; and a service-call failure rendering inline feedback rather than crashing.

**Dependencies:** Ticket 4 — requires `InterestService.skipType` and `ConstraintService`; Ticket 5 — requires `EnrichmentCard` and the question config.

---

## Ticket 7 of 8

**Title:** P2:Wire enrichment chips onto the Interest Detail screen

**Description:**
Extend `InterestDetailScreen` with a chip row for Ticket 5's six covered axes, capability-framing microcopy, and entry points into `GuidedSetupScreen` for both single-card editing and the sequential flow.

**Acceptance Criteria:**
- [ ] `InterestDetailScreen` renders a chip row covering exactly `Type` plus the five built dimensions (`Time`, `Supplies`, `Location`, `Social`, `WeatherSeason`) — no chip for `EnergyFocus`.
- [ ] Chip data is sourced from `ConstraintService.listForInterest` (filtered to the covered list) and the interest's `type`/`typeSkippedAt`, refreshed on focus alongside the existing `InterestService.get` call.
- [ ] A genuinely never-touched axis renders as a soft "＋ add [axis]" invitation.
- [ ] A deliberately-skipped `Type` (`type === null && typeSkippedAt !== null`) renders as its own distinct, answered-looking chip — not the blank invitation.
- [ ] Other answered axes (`Set` or `None`) render as filled chips summarizing the answer (e.g. "15–30 min", "Doesn't apply") — never a red "incomplete" badge.
- [ ] Tapping any chip navigates to `GuidedSetupScreen` with that chip's axis as `startDimension`.
- [ ] A single "＋ Tell me more" entry point navigates to `GuidedSetupScreen` with no `startDimension`.
- [ ] A capability-framing microcopy line renders above the chip row via a pure function (e.g. `describeCapability(constraints, type, typeSkippedAt)`), independently unit-tested for zero answers, partial answers, and a deliberately-skipped `Type`.
- [ ] A failure from `ConstraintService.listForInterest` is surfaced as inline feedback (consistent with the screen's existing `loadError`/`actionError` pattern), not an unhandled promise rejection.
- [ ] `src/screens/__tests__/InterestDetailScreen.test.tsx` is extended to cover the chip row's rendering per answer state and navigation to `GuidedSetupScreen` with the correct `startDimension` per chip.

**Dependencies:** Ticket 4 — requires `ConstraintService.listForInterest`; Ticket 6 — requires `GuidedSetupScreen` as the chip-tap and "Tell me more" destination.

---

## Ticket 8 of 8

**Title:** P2:Add the idle-browsing enrichment nudge to the List screen

**Description:**
Extend `InterestListScreen` with a dismissible banner surfaced when any loaded interest has unanswered enrichment axes, computed with one bulk service call rather than a per-interest check.

**Acceptance Criteria:**
- [ ] The screen computes a "needs enrichment" set from the already-loaded list results, as the union of: (a) interests where `type === null && typeSkippedAt === null`, computed directly from the existing `InterestService.list` result with no extra query; and (b) the result of one call to `ConstraintService.needsEnrichment(interestIds, coveredDimensions)`, where `coveredDimensions` is Ticket 5's covered-axis list minus `'Type'`.
- [ ] Exactly one `ConstraintService.needsEnrichment` call is made per list load/refresh, regardless of how many interests are on screen.
- [ ] An interest with `type` set but zero constraint dimensions answered is included in the "needs enrichment" set.
- [ ] An interest with `type` deliberately skipped (`typeSkippedAt` set) but all five constraint dimensions answered is **not** included in the "needs enrichment" set.
- [ ] When the set is non-empty, a dismissible banner reads "Got a minute? N seeds could tell me more" (N = set size); when empty, no banner renders.
- [ ] Tapping the banner navigates to one interest from the set's `InterestDetail` screen.
- [ ] Dismissing the banner hides it for the remainder of the session (component state only, not persisted).
- [ ] A failure from `ConstraintService.needsEnrichment` is handled with inline feedback consistent with the screen's existing `loadError` pattern — the banner simply does not render rather than crashing the screen.
- [ ] `src/screens/__tests__/InterestListScreen.test.tsx` is extended to cover: banner shown when unanswered interests exist, hidden when none do, dismiss behavior, and that exactly one `needsEnrichment` call is made regardless of list size.

**Dependencies:** Ticket 4 — requires `ConstraintService.needsEnrichment`.

---

## Flag for the user

The phase plan makes several decisions and additions beyond the spec's first-pass draft, carried through into this ticket plan as written. Consider whether `spec/PROJECT_SPEC.md` / `spec/CHANGELOG.md` should be updated to record them:

- `ConstraintService` (Tickets 4, 6, 7, 8) — the spec's API Contracts section defines `ConstraintRepository` but no service; required by the "Presentation calls Services" layering rule.
- Six stored `ConstraintDimension` values (Ticket 1), not the Domain Model's eight conceptual axes — `WeatherSeason` merges weather+seasonal, `EnergyFocus` merges energy+focus, resolving the spec's open "Constraint storage shape" question.
- `EnergyFocus` is stored (Tickets 1–2) but has no v1 card — Tickets 5–8 all deliberately exclude it, deferring it past the roadmap's literal Phase 2 text to match the design doc's "(later)" annotation and the Recommendation Engine's own deferral.
- `Interest.typeSkippedAt` (Ticket 1) — a new column making a deliberate "Not sure" on the Type card durable and distinguishable from never-having-been-asked, per the design doc's skip-is-permanent guardrail.

Two items the phase plan raised remain unresolved and are **out of scope for this ticket plan — no ticket in this plan addresses either**:

- Which phase owns the `Step` entity (needed before Phase 3 can recommend a `StructuredLearning` interest's next Step).
- Which phase owns type-specific interest behavior (no-ceremony Complete / guilt-free Conclude-Resting / Steps-based completion, per the design doc's "Interest Shapes" section).

Both are recorded as one joint decision in `docs/planning/phasePlans/phase-2-guided-interest-setup.md`'s Notes, for the user to resolve before Phase 3 is planned.

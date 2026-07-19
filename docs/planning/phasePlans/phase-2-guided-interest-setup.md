# Phase 2: Guided Interest Setup

_Created: 2026-07-19 | Status: DRAFT_

## Goal

Let the user optionally enrich any Interest — its type, and five of the six
constraint axes that will later drive feasibility filtering (time, supplies,
location, social, weather/season) — through a low-friction, card-based flow
that never gates saving or using the interest, and that treats "not sure yet"
as a real, durable answer rather than silence to be asked again. A sixth
axis, energy/focus, is modeled now but its card is deliberately not built
until later (see Context). This is the phase that gives the Phase 3
recommendation engine most of what it will evaluate.

## Context

Phase 1 is built and committed. It delivers a usable Interest backlog but
leaves every enrichment axis untouched:

- **Domain:** `src/domain/interest.ts` defines `Interest` (with `type:
  InterestType | null`, `state`, `archivedAt`), `NewInterest`, `InterestDetails`
  (`{ type: InterestType }` — the only detail field so far), `InterestFilter`,
  `InterestPatch` (`Partial<Pick<Interest, 'title' | 'type' | 'state' |
  'archivedAt'>>`), and `validateTitle`/`assertValidTitle`.
- **Persistence:** `src/db/migrations/001_create_schema_migrations.ts` and
  `002_create_interests.ts` are applied in order by `src/db/migrationRunner.ts`,
  tracked in `schema_migrations`. `interests` has a `TEXT` (UUID) primary key,
  nullable `type`, and `state`/`archived_at`/timestamp columns. `InterestRepository`
  (`src/repositories/InterestRepository.ts`) extends `BaseRepository` and
  implements `insert`/`findById`/`query`/`update`/`remove` exactly per the spec's
  contract, doing SQL-level filtering (state/type/query/includeArchived).
- **Application:** `InterestService` (`src/services/InterestService.ts`)
  implements `create`/`get`/`list`/`update`/`setState`/`archive`/`unarchive`/
  `delete`, all confirmed to match the spec's API Contracts as of the
  2026-07-19 changelog entry — `archive`/`unarchive` return `Promise<Interest>`,
  `update`'s patch is the narrowed `InterestPatch`, and `list`'s filter includes
  `includeArchived`. Critically for this phase: `update` **already** accepts
  `type` in its patch, so choosing an actual type needs no new repository
  plumbing — but this phase does extend `InterestRepository`/`InterestService`
  regardless, to make a *deliberate skip* of the type question durable (see
  below), which is a genuinely new capability, not present in Phase 1.
- **Presentation:** `InterestListScreen` (default route; debounced search +
  state/`Archived` filter chips), `CreateInterestScreen` (title only),
  `InterestDetailScreen` (title/state/type-or-"not set"/timestamps, with Edit,
  Archive/Unarchive, and confirm-gated Delete actions), `EditInterestScreen`
  (title + state segmented control). `InterestListItem` renders title + state
  only. `RootNavigator` defines four routes: `InterestList`, `CreateInterest`,
  `InterestDetail`, `EditInterest`. `src/theme` provides `Theme` (`colors`,
  `spacing`, `radius`, `typography`, `elevation`, `animation`) via
  `ThemeProvider`/`useTheme`.
- **Empty:** `src/domain` has no `Constraint` concept yet; no `constraints`
  table, repository, or service exists.

Two sources shape this plan beyond the roadmap's Phase 2 cell ("Optionally
enrich interests: type, time/energy/focus/location/supplies/social/weather/
seasonal requirements. All fields optional."):

- `spec/PROJECT_SPEC.md` — the `Constraint` domain concept ("a condition
  affecting whether an Interest can be pursued: time, supplies, location,
  social, weather, seasonal, energy, focus"), the unknown-vs-explicitly-none
  distinction from the Recommendation Engine section ("the two must be stored
  distinctly — conflating them breaks feasibility filtering" — this phase must
  honor that even though evaluation itself is Phase 3), the indicative
  `ConstraintRepository` contract, and the Open Question "Constraint storage
  shape... deferred to Phase 2" that this phase resolves.
- `docs/planning/ux-design-intent.md`'s "Guided Setup (Phase 2)" section in
  full — the capability-not-completion reframe (no progress bar, ever), card
  flow mechanics (one question per card, autosave per answer, editing is the
  same UI as entry), the Skip-vs-"Doesn't apply" semantic, just-in-time
  enrichment triggers, the v1 question set table, and the guardrails ("never" list).

**A schema decision this phase makes, per the Open Question it resolves.** The
spec's Domain Model lists eight conceptual Constraint axes (time, supplies,
location, social, weather, seasonal, energy, focus), but the design-intent
doc's v1 question table asks exactly **six** questions, pairing weather with
season and energy with focus into single cards ("Weather/Season", "Energy/Focus").
This plan stores six `ConstraintDimension` values — `Time`, `Supplies`,
`Location`, `Social`, `WeatherSeason`, `EnergyFocus` — matching the design
doc's question set one-for-one rather than eight separate rows, since one
question naturally produces one answer. Flag this consolidation to the user at
ticketing time so the spec's Domain Model / Open Questions can be updated to
record the resolution.

**A design guardrail this phase enforces for `Type`, not just constraints.**
The design doc states skip is "a valid, permanent-until-changed state" and the
app must "never make skip feel like failure" — and while the Skip-vs-"Doesn't
apply" *semantic* is written about constraint axes, the guardrail against
re-asking a deliberately-skipped question applies equally to the `Type` card
this phase adds. `Type`'s current representation (`Interest.type: InterestType
| null`) cannot distinguish "never asked" from "asked, and the user said not
sure" — both look like `null`. Left that way, the sequential flow (Step 6)
would re-ask `Type` on every visit and the idle nudge (Step 8) would flag the
interest forever, directly violating the guardrail. Three mechanisms were
considered: (a) store `Type` as a seventh row in the `constraints` table,
reusing `ConstraintStatus` — rejected, because `Constraint` is explicitly
scoped in the Domain Model to the eight physical-world axes, `Type` isn't one
of them, and a `Type` row would need `value` to always be `null` regardless of
status (the real value already lives on `interests.type`), breaking Step 1's
"`value` present iff `status === 'Set'`" rule as a special case; (b) a
dedicated nullable `typeSkippedAt: string | null` column on `Interest`,
mirroring the existing `archivedAt` pattern — chosen; (c) inferring "skipped"
from some other existing signal — rejected, no such signal exists. (b) keeps
`Type` a plain `Interest` attribute (consistent with it already being a column
on `interests`, not a separate aggregate) and reuses a pattern already in this
codebase (`archivedAt`), rather than overloading the `Constraint` aggregate
with a concept it wasn't scoped to hold. This adds a small migration and a
small `InterestService.skipType` method (Steps 1–4) — see Notes for a summary.

**A reversal from an earlier "spec is law" reading, now resolved toward the
design doc.** `EnergyFocus` stays a valid, stored `ConstraintDimension`
(included in the migration's `CHECK` constraint from the start, so no later
migration is needed when it ships) but **its card is not built in this
phase**. The roadmap's Phase 2 cell text lists "energy/focus" among the
enrichment axes, which would argue for building it now; but the design doc
marks that exact row "(later)" in its v1 question table, and the
Recommendation Engine section defers energy/focus evaluation to "future." The
deciding factor: "friction is the enemy" applies hardest to this specific
flow — it is, in the design doc's own words, "the make-or-break flow" — and
`EnergyFocus` is the one axis Phase 3 will not evaluate even if captured now,
so asking it buys nothing yet at the cost of one more card in the flow every
new interest walks through. `ConstraintService.listForInterest` (Step 4) still
returns an entry for all six dimensions (so the method is correct once the
card ships later), but every place that decides *which axes to show or check*
(`GuidedSetupScreen`'s sequencing, the Detail screen's chip row, the idle
nudge) reads from Step 5's five-dimension-plus-`Type` covered-axis list, not
the full six — see the relevant steps and Notes.

**A roadmap gap this plan does not resolve: the `Step` entity, and now a
second, related gap.** Phase 1's plan noted, in passing, that `Step` "arrives
in Phase 2" — but the roadmap's actual Phase 2 cell text names only the
constraint/type enrichment axes and never mentions Steps, and Phase 3's
recommendation engine needs a `Step` to exist before it can "recommend the
next Step" for `StructuredLearning` interests. This plan follows the
roadmap's literal Phase 2 text and does **not** build the `Step` entity,
table, repository, service, or UI here. Relatedly: this phase asks for
`Interest.type` but implements no type-specific *behavior* — the design doc's
"Interest Shapes & Structured Itineraries" section makes type behaviorally
meaningful (one-time gets a no-ceremony Complete, unstructured gets a
guilt-free Conclude/Resting, structured owns Steps), and none of that is
built here either. Both gaps are recorded together in Notes as one decision
for the user to make before Phase 3 is planned: which phase owns
type-specific interest behavior, and which phase owns `Step`.

**A contract gap this phase adds.** The spec's API Contracts section defines
`ConstraintRepository` but no `ConstraintService` — yet the architecture's
"Presentation calls Services; Services call Repositories" rule (and the
one-way layering principle) means no screen may call `ConstraintRepository`
directly. This phase adds `ConstraintService` (Step 4), thin orchestration
over `ConstraintRepository`, mirroring how Phase 1 added `InterestService.delete`/
`unarchive` beyond the spec's first-pass draft. Flag to the user at ticketing
time so `spec/CHANGELOG.md` can record it.

**Constraints are never part of `InterestService.create`'s payload.**
`InterestDetails` stays `{ type: InterestType }` — unchanged by this phase.
Every constraint answer is captured after creation, through the flow this
phase builds, preserving "title first, alone" from Phase 1.

## Steps

### Step 1: Extend the Interest domain model and define the Constraint domain model

In `src/domain/interest.ts` (Phase 1), add `typeSkippedAt: string | null` to
`Interest` and to `InterestPatch`'s `Pick` union (now
`Partial<Pick<Interest, 'title' | 'type' | 'state' | 'archivedAt' |
'typeSkippedAt'>>`) — the durable record of a deliberate "Not sure" on the
Type card (see Context on why this lives on `interests` rather than in the
`constraints` table). In `src/domain/constraint.ts`, define `ConstraintId`
(string alias), `ConstraintDimension` (`'Time' | 'Supplies' | 'Location' |
'Social' | 'WeatherSeason' | 'EnergyFocus'`), `ConstraintStatus` (`'Unknown' |
'None' | 'Set'` — the skip-vs-doesn't-apply-vs-answered distinction the spec
requires be stored distinctly), a per-dimension `ConstraintValue`
discriminated union (`Time`: one of the design doc's five time buckets;
`Supplies`: a light list of `{ name: string; have: boolean }` items;
`Location`: `'Home' | 'Specific' | 'Anywhere'`; `Social`: `'Solo' |
'NeedsPeople'`; `WeatherSeason`: `{ matters: true; note?: string }`;
`EnergyFocus`: `'Low' | 'Medium' | 'High'` — defined even though no v1 card
writes it yet, see Step 5), and `Constraint` (`id`, `interestId`, `dimension`,
`status`, `value: ConstraintValue | null`, `createdAt`, `updatedAt`). Add one
pure domain rule — `assertValidConstraintAnswer` (or similar) — enforcing
`value` is present if and only if `status === 'Set'`. Extend
`src/domain/__tests__/interest.test.ts` for `typeSkippedAt`'s presence in the
patch type, and add `src/domain/__tests__/constraint.test.ts` for the new
validation rule. No persistence or UI code here.

### Step 2: Add the `constraints` table and `interests.type_skipped_at` migrations

Add `src/db/migrations/003_create_constraints.ts`, following the `Migration`
interface and pattern of `001`/`002`. Schema: `id TEXT PRIMARY KEY` (UUID,
matching the Phase 1 precedent for entity tables), `interest_id TEXT NOT NULL
REFERENCES interests(id) ON DELETE CASCADE` (so a hard-deleted interest's
constraint rows are removed automatically — no separate cleanup call needed
from `ConstraintService`), `dimension TEXT NOT NULL CHECK (dimension IN
('Time','Supplies','Location','Social','WeatherSeason','EnergyFocus'))` — all
six admitted, including `EnergyFocus`, so no later migration is needed when
its card ships — `status TEXT NOT NULL CHECK (status IN
('Unknown','None','Set'))`, `value TEXT` (nullable, JSON-encoded
`ConstraintValue`), `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL`,
and `UNIQUE (interest_id, dimension)` — one row per dimension per interest,
per the Open Question's "likely" shape. Add
`src/db/migrations/004_add_type_skipped_at_to_interests.ts` — `ALTER TABLE
interests ADD COLUMN type_skipped_at TEXT;` (nullable ISO-8601). Register both
in `src/db/migrations/index.ts`. Extend
`src/db/__tests__/migrationRunner.test.ts` to confirm both apply cleanly on
top of `001`/`002` and are idempotent.

### Step 3: Extend `InterestRepository`; implement `ConstraintRepository`

Extend `InterestRepository`'s (Phase 1) row↔domain mapping and its `insert`/
`update` SQL to read and write the new `type_skipped_at` column, so
`InterestService.skipType` (Step 4) has somewhere to persist to. Add
`src/repositories/ConstraintRepository.ts`, extending `BaseRepository` and
using `withConnection` exclusively. Implement the spec's contract:
`findForInterest(interestId): Promise<Constraint[]>` and
`replaceForInterest(interestId, constraints: Constraint[]): Promise<void>`,
implemented as a **per-dimension upsert** (`INSERT ... ON CONFLICT
(interest_id, dimension) DO UPDATE`, generating `id`/`created_at` only for
dimensions with no existing row, always bumping `updated_at`) rather than a
full-table wipe-and-reinsert — dimensions not present in the call are left
untouched. This interpretation matters because Step 6's autosave-per-answer UX
always calls it with a single-element array. Add one bulk query,
`findFullyAnsweredInterestIds(interestIds: InterestId[], dimensions:
ConstraintDimension[]): Promise<Set<InterestId>>` — a single grouped query
(`WHERE interest_id IN (...) AND dimension IN (...) AND status != 'Unknown'
GROUP BY interest_id HAVING COUNT(DISTINCT dimension) = <dimensions.length>`)
returning which of the given interests have *every* given dimension answered
(`Set` or `None`), so the Step 8 nudge never issues one query per interest.
Row↔domain mapping (JSON-encode/decode `value`) is private to this file.
Write repository tests (`src/repositories/__tests__/InterestRepository.test.ts`
extended for `typeSkippedAt`; `src/repositories/__tests__/ConstraintRepository.test.ts`
new) covering: insert-on-first-answer, update-in-place on re-answer, that
answering one dimension leaves others untouched, cascade-delete of
constraint rows when the parent interest is removed, and
`findFullyAnsweredInterestIds` against a mix of fully- and partially-answered
interests.

### Step 4: Extend `InterestService`; implement `ConstraintService`

Add `InterestService.skipType(id): Promise<Interest>` (Phase 1 file) — a thin
wrapper over `update(id, { type: null, typeSkippedAt: new Date().toISOString()
})`, the durable counterpart to choosing an actual type. Add
`src/services/ConstraintService.ts`. Implements `listForInterest(interestId):
Promise<Constraint[]>`, which calls `ConstraintRepository.findForInterest` and
**fills in a synthetic `{ status: 'Unknown', value: null }` entry for any of
the six `ConstraintDimension` values with no stored row** — still all six,
including `EnergyFocus`, so this method stays correct the day its card ships;
callers that need to know "which axes have a v1 card" read Step 5's
covered-axis list instead, they must not infer it from this method's output
(see Notes). Implements `answer(interestId, dimension, input: { status:
ConstraintStatus; value?: ConstraintValue }): Promise<Constraint>`, which runs
Step 1's validation then calls `ConstraintRepository.replaceForInterest` with
a single-element array. Implements `needsEnrichment(interestIds: InterestId[],
dimensions: ConstraintDimension[]): Promise<Set<InterestId>>`, calling the
repository's `findFullyAnsweredInterestIds` and returning the complement
(the interests *not* fully answered on the given dimensions) — the
interpretation of "needs enrichment" belongs here, not in the repository.
This service is the only caller of `ConstraintRepository`; screens call it,
never the repository directly. Unit test both services with fakes/mocks:
`skipType`'s exact patch; `listForInterest`'s six-entry fill-in; `answer`'s
validation; and `needsEnrichment`'s complement logic.

### Step 5: Build the reusable `EnrichmentCard` component and question config

Add `src/components/EnrichmentCard.tsx` — a presentational, "dumb" component
(receives the current answer and an `onAnswer` callback as props; it does not
call any service itself, consistent with `InterestListItem`'s existing
pattern) rendering one question: title text, chip options (big tap targets),
and — critically — the two guilt-free escape hatches from the design doc,
"Not sure / later" (→ `status: 'Unknown'`) and "None / doesn't apply" (→
`status: 'None'`), styled identically to the answer chips, never as a red
"missing!" warning. Add a co-located config,
`src/screens/enrichmentQuestions.ts`, covering **`Type` plus five dimensions
— Time, Supplies, Location, Social, WeatherSeason** — matching the design
doc's v1 table (Time: 5–15/15–30/30–60/1hr+/Varies; Supplies: None or a
have/need item list — the one dimension whose card renders a small add-item
list instead of pure single-select chips; Location: Home/Specific/Anywhere;
Social: Solo/Needs people; WeatherSeason: a "matters" toggle plus an optional
short free-text note — the design doc leaves the exact widget as "simple
pick," so this is a deliberate v1 minimum, and it is the one place this
config asks for typed text; see Notes on that tension). `EnergyFocus` has
**no entry in this config and no card in v1** — it remains a valid stored
`ConstraintDimension` (Steps 1–2) but is deliberately not built now (see
Context). The `Type` entry is a special case: three type chips plus "Not
sure" only — no "Doesn't apply," since an interest either has a chosen type
or none, and "explicitly no type" isn't a meaningful state. Export the
config's covered-axis list (`['Type', 'Time', 'Supplies', 'Location',
'Social', 'WeatherSeason']`) as the single source of truth Steps 6 and 8 both
read from, rather than each re-deriving "which axes exist in v1." This is all
UI copy/config, not a business rule, so it lives in the presentation layer,
not `src/domain`.

### Step 6: Build `GuidedSetupScreen`

Add `src/screens/GuidedSetupScreen.tsx`, taking `{ interestId, startDimension?:
'Type' | ConstraintDimension }` as route params — one screen serving both
entry modes, realizing "editing is the same UI as entry" literally. On mount,
loads `ConstraintService.listForInterest(interestId)` and the interest (via
`InterestService.get`, for `type`/`typeSkippedAt`), then narrows to Step 5's
covered-axis list before doing anything else — `EnergyFocus` is never
reachable through this screen, regardless of what `listForInterest` returns.
If `startDimension` is provided, renders Step 5's `EnrichmentCard` for that
one axis only, and navigates back to `InterestDetail` immediately after any
answer (including an escape hatch) — this is the single-card edit-in-place
mode. If omitted, sequences through the covered axes that are currently
unanswered: `Type` counts as unanswered only when `type === null &&
typeSkippedAt === null` — a deliberate earlier "Not sure" is **not** re-asked
on later visits, per the design doc's durable-skip guardrail (Context); a
constraint dimension counts as unanswered when its `status === 'Unknown'`.
The screen auto-advances to the next unanswered card after each autosaved
answer, with an always-visible "Close" affordance that returns to
`InterestDetail` at any point — no progress bar, no "N of M" count, per the
capability-not-completion guardrail. Each answer autosaves immediately: the
`Type` card calls `InterestService.update(id, { type, typeSkippedAt: null })`
when a type is chosen (clearing any earlier skip) or `InterestService.skipType(id)`
on "Not sure"; dimension cards call `ConstraintService.answer`. Add the route
to `RootNavigator`.

### Step 7: Wire enrichment chips onto the Interest Detail screen

Extend `InterestDetailScreen` (Phase 1) with a chip row below the existing
title/state/timestamps, covering Step 5's five-dimensions-plus-`Type` list
only (not six) — sourced from `ConstraintService.listForInterest` (filtered to
the covered list) and the interest's `type`/`typeSkippedAt`, refreshed on
focus alongside the existing `InterestService.get` call — each aggregate's own
service is called independently, per the one-repository-per-aggregate rule. A
genuinely never-touched axis renders as a soft "＋ add [axis]" invitation. A
deliberately-skipped `Type` renders as its own distinct, answered-looking chip
(e.g. "Not sure yet," tappable to reconsider) rather than falling back to the
blank invitation — the durable skip must stay *visible*, not be silently
indistinguishable from never having been asked. Other answered axes (`Set` or
`None`) render as filled chips summarizing the answer (e.g. "15–30 min",
"Doesn't apply") — never a red "incomplete" badge. Tapping any chip navigates
to `GuidedSetupScreen` with that `startDimension`. Add the single
low-pressure "＋ Tell me more" entry point (not auto-triggered on
save/creation) that navigates to `GuidedSetupScreen` without `startDimension`,
launching the sequential flow. Above the chip row, render one line of
capability-framing microcopy computed from the current answers (e.g. "I can
only find this if you go looking for it" with zero answers, adding a clause
per answered axis) — implement this as a small pure function (e.g.
`describeCapability(constraints, type, typeSkippedAt)`) so the framing logic
is testable independent of the screen.

### Step 8: Add the idle-browsing enrichment nudge to the List screen

Extend `InterestListScreen` with a dismissible banner computed from two
checks against the already-loaded interests, unioned: (a) interests where
`type === null && typeSkippedAt === null` — computed directly from
`InterestService.list`'s existing result, no extra query, and correctly
excluding interests that deliberately skipped `Type` (change from an earlier
draft that used `type === null` alone, which could not tell "never asked"
from "asked and skipped," and separately missed interests with a type set but
zero constraint dimensions answered); and (b)
`ConstraintService.needsEnrichment(interestIds, coveredDimensions)`, where
`coveredDimensions` is Step 5's covered-axis list minus `Type` (the five
constraint dimensions) — one bulk call regardless of how many interests are
on screen, avoiding the N+1 query a naive per-interest check would cost. If
the union is non-empty, show "Got a minute? N seeds could tell me more," per
the design doc's idle-browsing trigger; tapping it navigates to one such
interest's `InterestDetail`; dismissing hides the banner for the remainder of
the session (component state only — no persisted dismissal).
`EnergyFocus` is excluded from the bulk check by construction (it isn't in
`coveredDimensions`), so an interest is never nudged over an axis with no
card built to answer it. This is the only just-in-time enrichment trigger
this phase builds; the other two (a recommendation soft-block, a session
ending) depend on subsystems that don't exist until Phases 3 and 4 — see Notes.

## Notes

- **`ConstraintService` is a contract addition beyond the spec's first-pass
  draft** (the spec lists `ConstraintRepository` but no service). Required by
  the layered architecture's "Presentation calls Services" rule. Flag to the
  user at ticketing time so `spec/CHANGELOG.md` can be updated.
- **Six stored `ConstraintDimension` values, not the domain model's eight
  conceptual axes.** `WeatherSeason` merges weather+seasonal; `EnergyFocus`
  merges energy+focus — matching the design doc's six-question v1 table
  one-for-one. Flag to the user so the spec's Domain Model / Open Questions
  can record this resolution of "Constraint storage shape."
- **A deliberate "Not sure" on `Type` is now durable, tracked by a new
  `Interest.typeSkippedAt` column** rather than a row in the `constraints`
  table — see Context for the three mechanisms weighed and why a dedicated
  column won. This closes a real guardrail violation in the original draft:
  without it, the sequential flow re-asked `Type` forever and the idle nudge
  flagged skipped-`Type` interests permanently, both directly contradicting
  the design doc's "skip is valid, permanent-until-changed" rule.
- **`EnergyFocus` is modeled and stored (its `ConstraintDimension` value and
  migration `CHECK` entry both exist) but its card is not built in v1** —
  reversing an earlier "the roadmap explicitly lists it, so build it" reading.
  The design doc marks that row "(later)," the Recommendation Engine won't
  evaluate it until some future phase regardless, and "friction is the enemy"
  applies hardest to this specific flow. `ConstraintService.listForInterest`
  still synthesizes an `Unknown` entry for it (so the method is forward-correct
  for whenever the card ships) — every screen-facing decision about *which
  axes to show* instead reads Step 5's five-dimension-plus-`Type`
  covered-axis list, never the full six, so `EnergyFocus` cannot leak into the
  sequential flow, the Detail screen's chips, or the idle nudge.
- **`replaceForInterest` is implemented as a per-dimension upsert**, not a
  full-table replace, to match the autosave-per-answer UX — each call only
  ever touches the one dimension just answered.
- **The idle-nudge signal is now a real "has unanswered axes" check, not a
  proxy.** It unions a direct `type`/`typeSkippedAt` check (free, from
  already-loaded list data) with `ConstraintService.needsEnrichment`, a single
  bulk repository query rather than one query per interest — solving the
  original N+1 concern at the data-access layer instead of by using a
  misleading single-field proxy.
- **Two of the three just-in-time enrichment triggers are deferred.** The
  design doc also describes prompting on a recommendation soft-block and at
  session-end — both require subsystems this phase doesn't have
  (Recommendation Engine is Phase 3, Sessions are Phase 4). Only the
  idle-browsing nudge (Step 8) is built now.
- **Two related gaps, deliberately left for one joint decision before Phase 3
  is planned:** (1) the `Step` entity — Phase 1's plan speculatively placed it
  in "Phase 2," but the roadmap's actual Phase 2 cell text never mentions it,
  and Phase 3 needs it to recommend a `StructuredLearning` interest's next
  Step; (2) type-specific interest *behavior* — this phase lets the user set
  `type`, but nothing behaves differently as a result (no-ceremony Complete
  for `OneTimeProject`, guilt-free Conclude/Resting for
  `UnstructuredLearning`, Steps-based completion for `StructuredLearning`, per
  the design doc's "Interest Shapes" section, are all unbuilt). Neither gap is
  resolved by this plan; flag both to the user together, since whichever
  phase ends up owning `Step` most likely also ends up owning structured
  completion behavior.
- **Constraints are never part of `InterestService.create`'s payload.**
  `InterestDetails` remains `{ type: InterestType }`, unchanged from Phase 1;
  all constraint enrichment happens after creation, through
  `GuidedSetupScreen`.
- **Constraint rows cascade-delete with their parent interest** (`ON DELETE
  CASCADE`) — `InterestService.delete` needs no corresponding
  `ConstraintService` cleanup call.
- **Location and WeatherSeason elaboration is intentionally minimal** — no
  structured place picker, no season/weather taxonomy, just an enum plus an
  optional free-text note for WeatherSeason. That free-text note is a
  deliberate, acknowledged tension with the design doc's "chips/sliders over
  typing, minimal typing" principle — it's the one place in this phase's flow
  that asks for typed input rather than a tap. Kept as the v1 minimum because
  the design doc itself leaves the exact widget open ("simple pick"); deepen
  or replace it only if Phase 3's feasibility evaluation demonstrably needs
  more structure.
- **Deferred to Phase 8 (Polish):** animated card transitions, the full
  accessibility pass, and persisted (vs. session-only) nudge dismissal.
- **Tests are embedded per step, not a separate final step** — same rationale
  as Phase 1: every layer in this phase carries real logic (domain
  validation, repository upsert/bulk-query correctness, service fill-in and
  complement logic, screen behavior), so each step's ticket includes its own
  tests.

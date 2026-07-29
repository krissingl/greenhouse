# Greenhouse — Project Spec

_Last updated: 2026-07-19 | Status: ACTIVE — single source of truth_

> This is the living specification for Greenhouse and the authoritative source
> for engineering decisions. The documents under `docs/` (PRD, ADRs, domain
> model, system architecture, roadmap, recommendation engine) are **historical
> planning material** that seeded this spec; they are frozen and must not be
> edited for current truth. When this spec and a `docs/` file disagree, this
> spec wins. Record every change here in `spec/CHANGELOG.md`.

---

## Vision

Greenhouse is a **local-first personal enrichment application** that helps a user
manage a backlog of interests, hobbies, projects, and experiences they wish to
pursue. It surfaces barriers to participation ahead of time, organizes interests
by their real-world requirements, and recommends interests based on the user's
current circumstances.

It answers one question:

> **What would I enjoy doing right now that I can actually start right now?**

Greenhouse exists to support fulfillment, curiosity, and enrichment — **not**
productivity, output, or goal completion. Its purpose is to help the user spend
limited free time on interests that are accessible, meaningful, and fulfilling.

### Problem

The user has a large, growing collection of interests. When free time appears,
choosing one is overwhelming, and hidden barriers (missing supplies, closed
stores, too little time, wrong location, too little energy/focus) often prevent
starting. Re-discovering those barriers each time becomes a barrier itself, so
free time is spent deciding rather than doing.

### Product Principles

- **Fulfillment over productivity** — support enjoyment and enrichment, never
  maximize output, efficiency, or achievement.
- **Curiosity without obligation** — adding an interest is planting a seed, not
  making a commitment; no guilt over unfinished interests.
- **Minimize capture friction** — only a title is required; everything else is
  optional and can be added later.
- **Reduce activation energy** — identify barriers before the user is ready to
  begin, so they can start quickly when motivation arrives.
- **Reality-based recommendations** — prioritize what is realistically achievable
  right now given current circumstances.
- **Reflection over performance** — insights focus on fulfillment and personal
  patterns, not performance metrics.

### Decision Filters

When evaluating any feature, ask:

1. Does this reduce activation energy?
2. Does this help the user engage with interests they genuinely want to do?
3. Does this improve self-understanding?
4. Could this introduce guilt, obligation, or performance pressure?
5. Would this make Greenhouse feel more like a productivity app?

A feature that primarily serves productivity, accountability, optimization, or
engagement metrics should generally be rejected.

---

## Domain Model

The architecture is organized around the domain model rather than UI screens or
database tables. Business rules belong to these domain concepts. "Interest" is the
canonical entity name (earlier planning docs sometimes say "activity" — treat it
as a synonym for Interest).

### Interest _(primary entity)_

Something the user wants in their life (e.g. learn violin, earn a certification,
build garage shelves). Interests are opportunities, not obligations. Only a title
is required at creation; all other data is optional and incrementally added.

**Types**

- `OneTimeProject` — finite endeavor with a user-defined completion point
  (build shelves, paint a room). Completion is determined by the user.
- `StructuredLearning` — educational pursuit with a defined progression path
  (certification, course). Session-based, has a completion state.
- `UnstructuredLearning` — ongoing pursuit with no natural endpoint (learn
  violin, learn painting). Session-based, long-term exploration.

**States**

- `Backlog` — exists but not currently active.
- `InProgress` — currently being explored or pursued.
- `Complete` — the user considers it complete (user-determined).

**Shape & completion by type**

| Type | Steps | Sessions | "Complete" means |
|---|---|---|---|
| `OneTimeProject` | — | optional | user marks done → reflect |
| `UnstructuredLearning` | — | the main mechanic (repeated) | guilt-free **Conclude / Resting** (satisfied or paused, never "finished") → reflect |
| `StructuredLearning` | ordered **Steps** | ≈ doing the next Step | Steps done or user declares → reflect |

Completion is **always user-declared** and never auto-forced — the app only *offers*
it at the natural moment. Interests can be re-opened, and Steps added after a
"completion."

### Constraint

A condition affecting whether an Interest can be pursued, across eight
conceptual axes: time, supplies, location, social, weather, seasonal, energy,
focus. Constraints are captured to reduce future activation energy and drive
recommendation matching.

**Storage shape** _(resolved 2026-07-19, Phase 2)_ — the eight conceptual axes
are stored as six `ConstraintDimension` values: `Time`, `Supplies`, `Location`,
`Social`, `WeatherSeason` (merges weather + seasonal), and `EnergyFocus`
(merges energy + focus) — matching the design-intent doc's six-question v1 set
one-for-one. One row per `(interest, dimension)`, enforced by a `UNIQUE`
constraint. `ConstraintStatus` is `Unknown | None | Set`, keeping "not yet
answered" and "explicitly doesn't apply" stored distinctly per the
Recommendation Engine's requirement. `value` is JSON-encoded per dimension, and
constraint rows are removed via `ON DELETE CASCADE` when the parent Interest is
deleted. `EnergyFocus` is a valid, stored dimension from Phase 2 onward but has
no question card until a later phase (see Feature Roadmap).

### Note _(resolved 2026-07-28, Phase 2)_

A free-form, timestamped note the user attaches to an Interest — a lightweight
place to jot things like "rented a violin" or "found a teacher" without waiting
for a Session or Reflection to exist. An Interest can have **many** Notes, each
independently timestamped; a Note is plain text with no edit history. Notes are
removed via `ON DELETE CASCADE` when the parent Interest is deleted, mirroring
the `Constraint` cascade pattern. Interest Detail is the home for Notes — the
guided enrichment questionnaire is not a notes surface, since adding one there
would work against the fast-answer flow the enrichment cards are designed for.

Distinct from `Session` notes (Phase 4) and `Reflection` notes (Phase 5), which
are scoped to a single engagement or reflection rather than the Interest as a
whole.

### Session

A record of a single engagement — the *act of choosing to do* an Interest. Captured
frictionlessly at the moment the user starts or acts on the interest (e.g. from a
recommendation), so it needs no manual logging; carries an optional duration and an
optional one-tap mood. Sessions let the user resume without repeating planning work.

Session **counts are internal fulfillment data, never a user-facing scoreboard** — how
often the user *chose* an interest is a revealed-interest signal (see Reflection). The
app never shows raw counts or streaks. **Not** productivity tracking.

### Step _(StructuredLearning interests only)_

An ordered unit of a structured interest's itinerary (e.g. "Module 4: video +
assignment"), with a title, an optional time estimate, and its own done-state. Steps
are added **incrementally** — never a mandatory full curriculum upfront. The
recommendation engine surfaces the *next incomplete Step* and time-fits it. One-time
and unstructured interests have no Steps.

### Reflection

Fulfillment data comes from **two signals**:

- **Stated** — impressions the user records (fulfillment, satisfaction, mood,
  would-do-again, notes). Lightweight and optional; invited periodically ("How's
  violin feeling lately?") and at conclusion — **not** per session.
- **Revealed** — how often the user *chose* the interest over time. Repeatedly choosing
  violin (10× in a month vs. once) is behavioural evidence of genuine interest, derived
  from Session records. Internal only, surfaced as qualitative insight — never a raw
  count.

Reflections exist to improve self-understanding, not to measure output.

### ImpactReflection

An optional reflection recorded after time has passed, capturing lasting value
(a home project that keeps paying off, a skill that becomes useful later). Helps
distinguish immediate fulfillment from long-term impact.

### Recommendation _(derived, not persisted)_

A computed, feasibility-ordered result of the recommendation engine for a given
`UserContext` — an eligible Interest plus any soft-block warnings. Never stored as a
system-of-record entity.

---

## Architecture

Layered architecture. Each layer communicates **only** with the layer directly
below it. Local-first, single-user, offline-first. Domain entities, services,
repositories, and contracts are strongly typed in TypeScript.

```
Presentation  →  Application (Services)  →  Domain  →  Persistence (SQLite)
```

### Frontend (Presentation)

React Native (Expo). Responsible for screens, navigation, user input, form
validation, and display of recommendations/analytics. **Contains no business
logic** — all decisions are delegated to application services.

- Dirs: `src/screens`, `src/components`, `src/navigation`
- Design system & theming: seed light/dark tokens already exist (`catchAll/*_theme.ts`);
  they are adopted, typed, and relocated during Phase 0 — see the design-intent doc.

### Backend (Application + Domain)

There is no server. "Backend" is the on-device application and domain layers.

- **Application (Services)** — `src/services`. Coordinates workflows: create
  Interest, record Session, log Reflection, generate Recommendations, produce
  dashboard data. Orchestrates domain objects and repositories.
- **Domain** — `src/domain`. Business rules and entities; the recommendation
  engine lives here. No UI code, no persistence implementation details.

### Database (Persistence)

SQLite is the system of record. `src/repositories` + `src/db` handle data access,
migrations, repository implementations, and query optimization. Persistence
concerns must not leak into domain logic. Relationships preserve the domain model
rather than optimizing prematurely.

- Persistent state: Interests, Constraints, Notes, Sessions, Reflections, ImpactReflections.
- Derived state (not stored unless caching is required for performance):
  dashboard statistics, recommendation results, analytics summaries.

### Cross-cutting

- **Local-first / offline-first** — all core features work with no network. No
  accounts, authentication, cloud databases, or remote APIs in v1.
- **Error handling** — fail gracefully on invalid DB state, migration failures,
  and malformed input; errors must never cause permanent data loss.
- **Security & privacy** — all personal data stays on-device; focus is preventing
  corruption, safe migrations, and reliable backups/exports.
- **Performance** — expected volume is modest (hundreds of Interests, thousands of
  Sessions/Reflections). Prioritize recommendation responsiveness, dashboard
  rendering, and search/filter latency.

---

## Recommendation Engine

A **deterministic, rule-based feasibility filter**. It does exactly one thing:
from the interests the user *already said they want* (their backlog), surface the
ones they can actually act on right now, and flag the ones that are close-but-marginal.

It is **not** a preference or behavior model. Adding an Interest to the backlog is
the user's statement of desire — the engine never re-litigates that. It does **not**
use historical fulfillment, reflection scores, analytics, or any "what you tend to
like" signal to rank, weight, or hide interests. If the user said they want to learn
violin, violin is always eligible; the only question is whether they can do it *now*.
(Analytics from Phase 7 are descriptive and self-reflective only — they never feed
recommendations.)

### What it answers

> Of the things I already want to do, which are not blocked right now?

Concretely, per interest: Do I have the required supplies? Am I somewhere I can do
it? Do I have enough time (and, later, energy/focus) for a session?

### Feasibility evaluation

Each Interest carries requirements (Constraints) per dimension — time, supplies,
location, social, weather, season (energy, focus are future). At recommendation
time the engine compares each requirement against the current `UserContext` and
produces a per-dimension result:

- **OK** — requirement met.
- **Soft block** — a near-miss within a tolerance band. The interest is **still
  shown**, flagged with a warning (yellow). Examples: session minimum is 5 min and
  the user has 3; the interest usually needs 30 min and the user has 25.
- **Hard block** — the requirement cannot be met and cannot be resolved within the
  current window. The interest is **excluded** from recommendations (it remains in
  the normal backlog view). Example: the user doesn't own a violin and has only 3
  minutes — no way to acquire one now.

Severity is **computed at evaluation time, not stored** on the constraint: the same
"time" requirement yields OK, soft, or hard depending on the current context.
A requirement can be **unknown** (the user skipped it) or **explicitly none** (the user
answered "doesn't apply"). Unknown never blocks — the interest stays eligible, optionally
noted as lower-confidence. Explicitly-none means the interest is unconstrained on that
dimension (always OK). The two must be **stored distinctly** — conflating them breaks
feasibility filtering.

### Result & ordering

The engine returns the eligible interests (those with no hard block), each annotated
with any soft-block warnings. Ordering is **feasibility-first**: fully-feasible
interests before soft-blocked ones. There is no scoring by desirability, history, or
activation-energy weighting — feasibility status and soft warnings are the only
signals.

### Structured interests — recommend the next Step

For a `StructuredLearning` interest the unit evaluated is its *next incomplete Step*,
using that Step's own time estimate: "You have 15 min → your next cyber step is a
10-min video + 5-min assignment." This turns a broad pursuit into an actionable,
time-fitted suggestion. One-time and unstructured interests are evaluated as a whole.

### v1 scope

Candidates are `Backlog` and `InProgress` interests (exclude `Complete` unless
explicitly requested, and exclude archived). v1 uses **time, supplies, and location**
as the primary dimensions; energy, focus, weather, and season layer in as they are
captured. Per-dimension thresholds and tolerance bands (e.g. the 5-minute session
minimum, how far under budget still counts as soft) are tuning parameters defined
during Phase 3. The engine stays deterministic and intentionally simple; refinements
must not require architectural change.

_Note on energy (future):_ energy is forgiving — a "low energy" context should still
surface moderate-energy interests as **soft**, not hard, since starting an activity
often builds energy along the way.

---

## API Contracts (Internal Service & Repository Interfaces)

> **First-pass draft.** Greenhouse is local-first with no HTTP API; "contracts"
> are the in-process interfaces between layers. Signatures below are indicative
> and expected to be refined as each phase is implemented. Presentation calls
> Services; Services call Repositories; Repositories own SQLite.

### Application Services (`src/services`)

```ts
interface InterestService {
  create(input: { title: string } & Partial<InterestDetails>): Promise<Interest>;
  get(id: InterestId): Promise<Interest | null>;
  list(filter?: { state?: InterestState; type?: InterestType; query?: string; includeArchived?: boolean }): Promise<Interest[]>;
  update(id: InterestId, patch: Partial<Pick<Interest, 'title' | 'type' | 'state' | 'archivedAt' | 'typeSkippedAt'>>): Promise<Interest>;
  setState(id: InterestId, state: InterestState): Promise<Interest>;
  archive(id: InterestId): Promise<Interest>;   // soft-remove (sets archivedAt); delete is a separate hard op
  unarchive(id: InterestId): Promise<Interest>; // clears archivedAt; inverse of archive
  delete(id: InterestId): Promise<void>;    // permanent hard removal; distinct from archive
  skipType(id: InterestId): Promise<Interest>;  // durable "Not sure" on the Type question; sets typeSkippedAt, clears type. Choosing an actual type clears typeSkippedAt.
}

interface ConstraintService {                  // added Phase 2 — no screen may call ConstraintRepository directly
  listForInterest(interestId: InterestId): Promise<Constraint[]>; // one entry per stored ConstraintDimension; synthesizes { status: 'Unknown', value: null } for dimensions with no row
  answer(interestId: InterestId, dimension: ConstraintDimension, input: { status: ConstraintStatus; value?: ConstraintValue }): Promise<Constraint>;
  needsEnrichment(interestIds: InterestId[], dimensions: ConstraintDimension[]): Promise<Set<InterestId>>; // interests among interestIds not fully answered on all given dimensions
}

interface NoteService {                        // added Phase 2 — no screen may call NoteRepository directly
  listForInterest(interestId: InterestId): Promise<Note[]>;      // newest first
  add(interestId: InterestId, text: string): Promise<Note>;
}

interface RecommendationService {
  recommend(context: UserContext, options?: { includeCompleted?: boolean }): Promise<Recommendation[]>;
}

interface SessionService {
  start(interestId: InterestId): Promise<Session>;
  end(sessionId: SessionId, data?: { durationMinutes?: number; notes?: string }): Promise<Session>;
  listForInterest(interestId: InterestId): Promise<Session[]>;
}

interface ReflectionService {
  record(interestId: InterestId, input: ReflectionInput): Promise<Reflection>;               // immediate
  recordImpact(interestId: InterestId, input: ImpactReflectionInput): Promise<ImpactReflection>; // delayed
}

interface AnalyticsService {
  inProgress(): Promise<Interest[]>;
  fulfillmentTrends(): Promise<TrendPoint[]>;
  fulfillmentByCategory(): Promise<CategoryStat[]>;
  highImpactInterests(): Promise<Interest[]>;
}

interface StepService {                       // StructuredLearning interests only
  add(interestId: InterestId, step: { title: string; estimateMinutes?: number }): Promise<Step>;
  reorder(interestId: InterestId, orderedStepIds: StepId[]): Promise<void>;
  setDone(stepId: StepId, done: boolean): Promise<Step>;
  nextIncomplete(interestId: InterestId): Promise<Step | null>;
}
```

### Repositories (`src/repositories`)

One repository per aggregate; all SQLite access is confined here.

```ts
interface InterestRepository {
  insert(interest: NewInterest): Promise<Interest>;
  findById(id: InterestId): Promise<Interest | null>;
  query(filter: InterestFilter): Promise<Interest[]>;
  update(id: InterestId, patch: Partial<Interest>): Promise<Interest>;
  remove(id: InterestId): Promise<void>;
}

interface ConstraintRepository {
  findForInterest(interestId: InterestId): Promise<Constraint[]>;
  replaceForInterest(interestId: InterestId, constraints: Constraint[]): Promise<void>; // per-dimension upsert; dimensions absent from the call are left untouched, not a wipe-and-reinsert
  findFullyAnsweredInterestIds(interestIds: InterestId[], dimensions: ConstraintDimension[]): Promise<Set<InterestId>>; // added Phase 2 — bulk check to avoid N+1 queries
}

interface NoteRepository {                      // added Phase 2
  insert(note: NewNote): Promise<Note>;
  findForInterest(interestId: InterestId): Promise<Note[]>;      // newest first; ON DELETE CASCADE from interests
}

interface SessionRepository {
  insert(session: NewSession): Promise<Session>;
  update(id: SessionId, patch: Partial<Session>): Promise<Session>;
  findForInterest(interestId: InterestId): Promise<Session[]>;
}

interface ReflectionRepository {
  insertReflection(r: NewReflection): Promise<Reflection>;
  insertImpactReflection(r: NewImpactReflection): Promise<ImpactReflection>;
  findForInterest(interestId: InterestId): Promise<Reflection[]>;
}
```

---

## Feature Roadmap

Delivered as **vertical slices** — each phase exercises presentation, application,
domain, and persistence and delivers a complete, usable feature.

| Phase | Name | Goal / Deliverable |
|-------|------|--------------------|
| **0** | Foundation | Expo + RN + TypeScript project, ESLint/Prettier, navigation, design system/theming, SQLite + migrations, repository infra, logging, testing framework. Runnable shell that initializes the DB. |
| **1** | Interest Backlog (MVP) | Create (title only), list, view, edit, archive/delete, search, filter by state. A usable personal backlog. |
| **2** | Guided Interest Setup | Optionally enrich interests: type, time/location/supplies/social/weather+seasonal requirements via a card-based flow. Energy/focus is modeled and stored but has no question card until a later phase. All fields optional. Free-form, timestamped Notes on an Interest. |
| **3** | Recommendation Engine (v1) | Deterministic feasibility filter (load candidates → evaluate per-dimension: hard blocks exclude, soft blocks warn → order feasibility-first → return). Request recommendations from current circumstances. |
| **4** | Sessions | Start/end session, record duration, optional notes. |
| **5** | Reflections | Fulfillment, satisfaction, mood, would-do-again, notes. |
| **6** | Impact Reflections | Delayed reflections; lasting impact associated with completed interests. |
| **7** | Dashboard & Analytics | In-progress interests, fulfillment trends, high-impact interests, fulfillment by category, recommendation entry point, reflection summaries. Descriptive, not prescriptive. |
| **8** | Polish | Search/perf improvements, empty states, accessibility, animations, import/export, backup workflows, UX polish. Version 1 release. |

**Dashboard priorities:** (1) Recommend an Interest, (2) Create New Interest,
(3) View In-Progress Interests. Secondary: backlog overview, completed interests,
reflection summaries, analytics entry points.

**Definition of Done (per phase):** feature works end-to-end; data persists
correctly; critical business logic is tested; UX is complete enough for real use;
the app stays runnable and releasable.

**Future backlog (out of v1 scope):** cloud sync, web client, encrypted backups,
improved recommendation heuristics, AI-assisted organization, richer analytics.

**Design intent (UX/interaction):** see
[`docs/planning/ux-design-intent.md`](../docs/planning/ux-design-intent.md) — the
guided-setup flow, interest-shape UX, fulfillment-capture interaction, and the seed
design tokens. Read it before expanding Phases 0, 2, 3, and 5–7 into tickets.

---

## Resolved Decisions

- **Recommendation is a feasibility filter, not a preference model** _(2026-07-16)_ —
  the engine surfaces backlog interests that are actionable right now and never uses
  historical fulfillment, reflections, or analytics to rank or hide them. See
  [Recommendation Engine](#recommendation-engine).
- **Hard vs. soft blocks are computed, not stored** _(2026-07-16)_ — both are kept for
  v1. Severity is derived per-dimension at evaluation time by comparing the current
  context to the interest's requirements. Soft = shown with a warning; hard = excluded
  from recommendations (still in the backlog). Constraint storage shape is left to
  Phase 2 (see Open Questions).
- **Archive = soft-delete flag** _(2026-07-16)_ — `archivedAt` timestamp, orthogonal
  to the `Backlog/InProgress/Complete` lifecycle; archived interests are hidden from
  default views but recoverable. Delete is a separate, permanent hard removal.
- **Steps for structured interests — un-defers Milestones** _(2026-07-16)_ — a `Step`
  entity models the itinerary of `StructuredLearning` interests (ordered, incrementally
  added, own done-state); the engine recommends the next Step. One-time and unstructured
  interests have no Steps. This narrowly reverses the earlier deferral — the
  cybersecurity-cert case showed Sessions alone can't represent a curriculum.
- **Per-type shape & completion** _(2026-07-16)_ — one-time = user marks done;
  unstructured = guilt-free Conclude/Resting (never "finished"); structured = Steps done
  or user declares. Always user-declared, never auto-forced.
- **Fulfillment = stated + revealed, both internal** _(2026-07-16)_ — the fulfillment
  review draws on self-reported reflections *and* how often the user chose an interest
  (revealed interest, derived from Sessions). Engagement is captured frictionlessly at
  the point of choosing — no manual logging. Raw counts and streaks are never shown to
  the user; frequency appears only as qualitative insight. This tracks genuine interest,
  not productivity.
- **Backup/export v1 = SQLite file copy** _(2026-07-16)_ — the lightest complete
  option, fully on-device and offline, with no impact on installing the app to a
  phone. Versioned JSON export is deferred to the future backlog (for web-client
  interop and portability).
- **`ConstraintService` added to API Contracts** _(2026-07-19)_ — the layering
  rule ("Presentation calls Services; Services call Repositories") means no
  screen may call `ConstraintRepository` directly, so Phase 2 adds
  `ConstraintService` as thin orchestration over it. See
  [API Contracts](#api-contracts-internal-service--repository-interfaces).
- **Constraint storage shape resolved: eight conceptual axes, six stored
  dimensions** _(2026-07-19)_ — Phase 2 stores `ConstraintDimension` as six
  values (`Time`, `Supplies`, `Location`, `Social`, `WeatherSeason`,
  `EnergyFocus`), merging weather+seasonal and energy+focus to match the
  design-intent doc's six-question v1 set. One row per (interest, dimension)
  with a `UNIQUE` constraint, `ConstraintStatus` of `Unknown | None | Set`, a
  JSON-encoded value, and `ON DELETE CASCADE` from the parent interest.
  Resolves the former Open Question "Constraint storage shape." See
  [Constraint](#constraint).
- **`EnergyFocus` stored but not carded in v1** _(2026-07-19)_ — `EnergyFocus`
  is a valid `ConstraintDimension` (and CHECK-constrained column value) from
  Phase 2 onward, so no later migration is needed, but Phase 2 builds no
  question card for it — matching the design-intent doc's "(later)"
  annotation and the Recommendation Engine's deferral of energy/focus
  evaluation to a future phase.
- **`Interest.typeSkippedAt` added — durable Type skip** _(2026-07-19)_ —
  mirrors the `archivedAt` pattern: a nullable timestamp marking that the user
  deliberately answered "Not sure" to the Type question, distinct from
  `type === null` meaning "never asked." Without it the guided-setup flow
  would re-ask Type forever and the enrichment nudge would never stop
  flagging the interest. Choosing an actual type clears `typeSkippedAt`.
  `InterestService` gains a corresponding `skipType(id): Promise<Interest>`
  method. See [API Contracts](#api-contracts-internal-service--repository-interfaces).
- **`Note` added as an Interest-attached entity** _(2026-07-28)_ — surfaced
  during Phase 2 UAT: notes previously existed only on `Session` (Phase 4) and
  `Reflection` (Phase 5), with no way to jot a freestanding note against an
  Interest itself. Modeled as many independently-timestamped Notes per
  Interest, following the `Constraint` implementation pattern (own migration,
  `ON DELETE CASCADE` from `interests`, a `NoteRepository` behind a
  `NoteService`). See [Note](#note-resolved-2026-07-28-phase-2).

## Open Questions

- **Per-dimension thresholds & tolerance bands** — the exact numbers that separate
  OK / soft / hard per dimension (e.g. the 5-minute session minimum, how many minutes
  under budget still counts as soft). Tuning work; settle during Phase 3.
- **What counts as "choosing"** — the exact interaction recorded as a Session (acting on
  a recommendation or an explicit "start" vs. merely opening details), so
  revealed-interest data isn't inflated by browsing. Settle when Sessions land (Phase 4).
- **Which phase owns the `Step` entity, and which phase owns type-specific
  Interest behavior** — Phase 1's plan placed `Step` in "Phase 2" in passing,
  but neither the roadmap's Phase 2 cell text nor the Phase 2 phase plan builds
  it, and Phase 3's recommendation engine needs a `Step` to recommend the next
  incomplete Step for `StructuredLearning` interests. Related: Phase 2 lets the
  user set `Interest.type` but implements no type-specific behavior (no-ceremony
  Complete for `OneTimeProject`, guilt-free Conclude/Resting for
  `UnstructuredLearning`, Steps-based completion for `StructuredLearning`, per
  the design-intent doc's "Interest Shapes & Structured Itineraries" section).
  Both gaps are likely owned by the same phase; resolve together before
  Phase 3 is planned.

---

## Constraints & Non-Goals

### Technical Constraints

- Local-first architecture; full offline functionality.
- Single-user design; no accounts or authentication.
- SQLite persistence; React Native app on the Expo runtime; TypeScript codebase.
- No cloud services required for v1. Future sync/backup must remain optional and
  preserve full offline operation.

### Non-Goals (explicitly out of scope)

- Productivity tracking, goal management, performance optimization.
- Habit tracking, streaks, gamification (points, levels, badges, achievements).
- Social features (public profiles, feeds, sharing, competition, community).
- Scheduling / calendar functionality.
- Multi-user support, cloud-hosted databases, notification systems.

### Success Criteria

Greenhouse succeeds if it helps the user spend less time deciding, spend less time
discovering barriers, spend more time on meaningful interests, better understand
what creates fulfillment, and rediscover forgotten interests. It is **not** measured
by completed interests, productivity gains, goal completion, streaks, or engagement
metrics.

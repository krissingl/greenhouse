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

**Types** _(remodelled 2026-08-20, Phase 2.5)_

The three types are **three different container shapes**, not one shape wearing three
labels. What an Interest *contains*, how it is set up, and what "complete" means all
differ by type — and that difference is the point. Do not unify them for uniformity's
sake.

- `OneTimeProject` — a finite endeavor that **is itself the unit of work** (build
  shelves, paint a room). Holds no Tasks; the Interest is the thing you do.
- `UnstructuredLearning` — an **umbrella** over several named, **repeatable** Tasks,
  with no natural endpoint (learn violin → "practice 15 minutes", "read sheet music",
  "follow a tutorial"). You never do the umbrella; you do its Tasks, repeatedly.
- `StructuredLearning` — an **umbrella** over an **ordered, finite** sequence of Tasks
  (a certification's fifteen lessons). Tasks live under the umbrella rather than
  cluttering the board; only the next one is actionable.

**Type is derived, never asked** _(2026-08-20)_ — the user is never asked "is this a
one-time project?" Naming the taxonomy hands the app's job back to the user, which
inverts the product's purpose. Type falls out of a couple of behavioral questions early
in the guided flow ("can this be finished in one sitting?", "is there a set order of
steps to get there?") and is stored as a consequence of those answers. It is therefore
**not a free-standing editable field** — changing type means revisiting those
questions, not picking from a dropdown.

**States**

- `Backlog` — exists but not currently active.
- `InProgress` — currently being explored or pursued.
- `Complete` — the user considers it complete (user-determined).

**Shape & completion by type**

| Type | Tasks | "Complete" means |
|---|---|---|
| `OneTimeProject` | none — the Interest is the unit of work | user marks done |
| `UnstructuredLearning` | many, **repeatable**, unordered | completing a *Task* is the frequent, real closure; concluding the *umbrella* is the rare, guilt-free **Conclude / Resting** (satisfied or paused, never "finished") |
| `StructuredLearning` | many, **sequenced**, ordered and finite | Tasks done in order, or the user declares done |

**Completion moves down to the Task** for both umbrella types, and that is what makes
guilt-free completion *structural* rather than cosmetic: the user banks genuine closure
constantly at the Task level, while the pursuit above it is never told it should have
finished. The Conclude/Resting language stops being special-case copy papering over a
completion model that did not fit, and becomes a rare, meaningful act.

Completion is **always user-declared** and never auto-forced — the app only *offers*
it at the natural moment. Interests can be re-opened, and Tasks added after a
"completion." **Reflection is offered on every completion, at either level, and is
never required.**

**Due date** _(added 2026-07-28, Phase 2)_ — an Interest may carry an optional
`dueBy` date ("done before Halloween", "before the Renaissance Faire"). It is captured
contextually inside the guided flow — offered as a follow-up on the `Season` and
`TimeOfDay` cards, where a deadline naturally comes up — but **stored once, on the
Interest**, never inside a constraint value. Two cards can ask for it, so one canonical
home prevents conflicting dates and lets the engine query it without unpacking JSON.

`dueBy` **affects ordering only, and never nags.** As the date approaches, the interest
climbs the recommendations; it never produces a notification, badge, reminder, or any
other push. A missed `dueBy` does not fail, flag, or hide the interest — Greenhouse
does not scold.

### Task _(the child of an umbrella Interest)_

_(added 2026-08-20, Phase 2.5)_ — a unit of work belonging to an umbrella Interest.
`OneTimeProject` interests have **no** Tasks; `UnstructuredLearning` and
`StructuredLearning` are umbrellas whose Tasks are the things the user actually does.
Each Task has a title, its parent `interestId`, a `mode`, and its own completion
history.

**One entity, two modes.** The board treatment, the umbrella relationship, and the
completion path are identical across both umbrella types; only ordering and
repeatability differ. That is one entity with a `mode`, not two entities.

- `repeatable` (`UnstructuredLearning`) — unordered. Completing a Task does not consume
  it: the user may close it out for good, or **re-arm** it so the next instance is
  lined up while still banking the satisfaction of the one just finished.
- `sequenced` (`StructuredLearning`) — ordered and finite. A Task is consumed once.
  Only the **next incomplete** Task is actionable; the rest wait quietly under the
  umbrella instead of cluttering the board.

This **replaces the previously-sketched `Step` entity**: `Step` is now the `sequenced`
mode of `Task`, and `StepService` is replaced by `TaskService`. Resolves the standing
open question about which phase owns `Step`.

**Completion is an event, not a flag** — each completion is logged rather than flipping
a boolean, so a `repeatable` Task accumulates a real history and every completion can
carry its own optional Reflection. Re-arming is therefore "log this completion and make
the Task actionable again," keeping **one durable row per Task** rather than spawning an
instance row per repetition.

**Tasks are added incrementally** — quick-add as you go, paste a list, or track loosely.
**Never** a mandatory full-curriculum upfront. Granularity is the user's choice: a video
plus its assignment can be one Task or two.

### Constraint

A condition affecting whether an Interest can be pursued, across nine
conceptual axes: session length, supplies, location, social, weather, season,
time of day, energy, focus. Constraints are captured to reduce future activation
energy and drive recommendation matching.

**Storage shape** _(resolved 2026-07-19; revised 2026-07-30, Phase 2 UAT)_ — the nine
conceptual axes are stored as eight `ConstraintDimension` values: `Time`, `Supplies`,
`Location`, `Social`, `Weather`, `Season`, `TimeOfDay`, and `EnergyFocus` (merges
energy + focus). One row per `(interest, dimension)`, enforced by a `UNIQUE`
constraint. `ConstraintStatus` is `Unknown | None | Set`, keeping "not yet
answered" and "explicitly doesn't apply" stored distinctly per the
Recommendation Engine's requirement. `value` is JSON-encoded per dimension, and
constraint rows are removed via `ON DELETE CASCADE` when the parent Interest is
deleted. `EnergyFocus` is a valid, stored dimension from Phase 2 onward but has
no question card until a later phase (see Feature Roadmap).

`Time` (how long one session takes) and `TimeOfDay` (when in the day it is possible)
are **different questions and must never share a name** — the distinction survives from
the shape this section replaces.

**Which level owns a constraint is a property of the type** _(2026-08-20, Phase 2.5)_ —
constraints attach to an **Interest** or to a **Task**, and the guided flow asks at
whichever level the answer actually varies:

| Type | Answered at | Why |
|---|---|---|
| `OneTimeProject` | the Interest | the Interest is the unit of work |
| `UnstructuredLearning` | mostly the **Task** | requirements genuinely differ per Task — practising violin needs a violin, reading sheet music needs the book |
| `StructuredLearning` | mostly the **umbrella** | requirements are constant across steps — a course needs a computer and internet for every lesson |

Resolution is **per-dimension override, never a merge**: the engine reads the Task's
answer for a dimension and falls back to its umbrella's when the Task has none. No merge
or union semantics exist anywhere in the engine. Where a Task needs the umbrella's
answer *plus* one more item, the **editor pre-fills with the umbrella's values** so the
user amends rather than retypes, and what is stored on the Task is a complete,
self-contained answer.

This is deliberately **not** one inheritance algorithm applied uniformly to all three
types. Where the answers live is part of what distinguishes the types, and flattening
that into a merge rule reintroduces exactly the conflation Phase 2.5 exists to remove.

**Why the questionnaire exists** — it is **not** an attempt to understand the user's
task. It collects user-defined data so that (1) the user can read their interest back
as a single useful reference, and (2) the recommendation engine has something concrete
to match on. Every question must therefore produce a **structured, queryable** answer.
Free-text answers fail both purposes at once — they are neither easy to read back at a
glance nor usable by the engine — so prose belongs in the journal (see
[Note](#note-the-interests-journal)), never in a constraint value.

**`Weather`, `Season`, and `TimeOfDay` answer shapes** _(split out 2026-07-30, Phase 2
UAT)_ — three independent dimensions, each a flat multi-select. No `kind`
discriminator: the dimension *is* the discriminator.

- `Weather` → `WeatherCondition[]` — e.g. sunny, overcast, dry. "Only in good light,
  but overcast is fine."
- `Season` → `Season[]` — spring, summer, fall, winter. "This is a fall craft."
- `TimeOfDay` → `TimeOfDay[]` — morning, afternoon, evening, night. "Stargazing only
  works at night."

**Why three dimensions, not one branching value** — these axes **co-occur**. An interest
can be both weather-dependent and time-of-day-dependent ("night sky photography needs a
clear night"), and a single branching value forces a false either/or that silently
discards one real requirement. This reverses the 2026-07-28 "one dimension with a
branching value" decision, which optimised for avoiding a migration at the cost of
representing the domain incorrectly. Correctness wins; the migration is paid once.

**Migration** — splitting the stored dimension requires a migration that widens the
`dimension` `CHECK` constraint (a SQLite table rebuild — create, copy, drop, rename) and
rewrites existing `WeatherSeason` rows. Four cases, exhaustive:

- A row whose value carries `kind: 'Weather' | 'Season' | 'TimeOfDay'` becomes a row on
  the matching new dimension with the `kind` wrapper stripped.
- A legacy `{ matters, note? }` row (already decoded as `Unknown` since Phase 2 Batch A)
  carries no queryable data and is dropped rather than guessed at.
- A `None` row with no value — "weather or time of year doesn't matter" — answered all
  three axes at once, so it **fans out into three `None` rows**, one per new dimension,
  with ids derived from the original (`<id>-Weather`, `<id>-Season`, `<id>-TimeOfDay`)
  and the original timestamps preserved. Dropping it would silently reopen a question
  the user already answered.
- Any remaining valueless row (`Unknown`) is dropped: `ConstraintService.listForInterest`
  synthesizes `{ status: 'Unknown', value: null }` for dimensions with no row, so an
  absent row and a stored `Unknown` row are indistinguishable to every reader.

No `WeatherSeason` value survives in the schema afterwards.

The covered-axis question flow therefore becomes **eight cards** — `Type`, `Time`,
`Supplies`, `Location`, `Social`, `Weather`, `Season`, `TimeOfDay` — with `EnergyFocus`
still deliberately uncarded.

### Note _(the interest's journal)_

A user-authored entry in an Interest's **journal** — a research space the user owns
outright (e.g. "rented a violin from the shop on 5th", "teacher nearby has a
waitlist"). Each note has an optional short title, a free-text body, and its own
`createdAt`.

The journal exists because **the app cannot anticipate every kind of detail an
interest needs.** Constraints capture the structured facts Greenhouse knows how to
reason about; the journal is deliberate open space for everything else, so the user
is never blocked by a field we failed to imagine. Together they make the Interest a
single place to read back everything known about it.

**Storage shape** _(resolved 2026-07-28, Phase 2)_ — **many notes per Interest**, each
an independent row. A note is an observation made at a moment, and collapsing them
into one mutable text field would lose when each was written. Notes display
**newest-first**, with **pinned** notes held above the rest; `pinned` is a boolean on
the note. Notes are individually addressable and are removed via `ON DELETE CASCADE`
when the parent Interest is deleted — matching the `constraints` table's parentage.

**Surface** — the journal is **its own screen**, reached from an icon on the Interest
Detail screen. It is deliberately *not* part of the guided questionnaire: the
questionnaire is a fast, structured, answerable flow, and free-form writing does not
belong in it.

Notes **carry no semantics**: the recommendation engine never parses, matches, scores,
or reads them, and they never affect feasibility or ordering. Anything the engine must
reason about belongs in a `Constraint` or a first-class Interest field, never in a
note. Notes are also distinct from the `notes` field on `Session` (about one
engagement) and on `Reflection` (about how an engagement felt) — a journal note is
about the interest itself and is tied to no engagement.

### Session

A record of a single engagement — the *act of choosing to do* an Interest. Captured
frictionlessly at the moment the user starts or acts on the interest (e.g. from a
recommendation), so it needs no manual logging; carries an optional duration and an
optional one-tap mood. Sessions let the user resume without repeating planning work.

Session **counts are internal fulfillment data, never a user-facing scoreboard** — how
often the user *chose* an interest is a revealed-interest signal (see Reflection). The
app never shows raw counts or streaks. **Not** productivity tracking.

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

- Persistent state: Interests, Constraints, Sessions, Reflections, ImpactReflections.
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

**Closing-window ordering** _(added 2026-07-28)_ — within the fully-feasible group,
an interest whose `dueBy` is approaching sorts higher, weighted by proximity. This is
**not** a preference model and does not reverse the resolved decision above: it ranks
by how soon an opportunity closes, never by how much the user enjoyed something before.
No history, reflection, or analytics data is consulted. Interests without a `dueBy`
are never penalised, and the bump produces ordering only — never a push (see
[Interest → Due date](#interest-primary-entity)).

**Season and time-of-day are feasibility, not preference** — a `Season` requirement
that does not match the current date is a **hard block**: a fall craft in spring is
genuinely not doable, so it is excluded rather than demoted. `TimeOfDay` and `Weather`
requirements evaluate against the current `UserContext` exactly like every other
dimension.

### Umbrella interests — recommend the next Task

_(revised 2026-08-20, Phase 2.5)_ — for an umbrella Interest the unit evaluated is a
**Task**, never the umbrella itself, and constraints are read at the effective level
(the Task's answer, falling back to the umbrella's — see
[Constraint](#constraint)):

- `StructuredLearning` → the *next incomplete* Task, using that Task's own answers:
  "You have 15 min → your next cyber step is a 10-min video + 5-min assignment."
- `UnstructuredLearning` → any *armed* Task: "You have 15 min → practice violin."

`OneTimeProject` interests hold no Tasks and are evaluated as a whole. This turns a
broad pursuit into an actionable, time-fitted suggestion rather than a vague nudge
toward something the user cannot directly *do*.

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
  update(id: InterestId, patch: Partial<Pick<Interest, 'title' | 'type' | 'state' | 'archivedAt' | 'typeSkippedAt' | 'dueBy'>>): Promise<Interest>;
  setState(id: InterestId, state: InterestState): Promise<Interest>;
  archive(id: InterestId): Promise<Interest>;   // soft-remove (sets archivedAt); delete is a separate hard op
  unarchive(id: InterestId): Promise<Interest>; // clears archivedAt; inverse of archive
  delete(id: InterestId): Promise<void>;    // permanent hard removal; distinct from archive
  skipType(id: InterestId): Promise<Interest>;  // durable "Not sure" on the Type question; sets typeSkippedAt, clears type. Choosing an actual type clears typeSkippedAt.
}

interface ConstraintService {                  // added Phase 2 — no screen may call ConstraintRepository directly
  listForInterest(interestId: InterestId): Promise<Constraint[]>; // one entry per stored ConstraintDimension; synthesizes { status: 'Unknown', value: null } for dimensions with no row
  listForTask(taskId: TaskId): Promise<Constraint[]>;             // Phase 2.5 — same synthesis, Task-level answers only
  effectiveForTask(taskId: TaskId): Promise<Constraint[]>;        // Phase 2.5 — per-dimension override: the Task's answer, falling back to its umbrella's. What the engine evaluates.
  answer(target: { interestId: InterestId } | { taskId: TaskId }, dimension: ConstraintDimension, input: { status: ConstraintStatus; value?: ConstraintValue }): Promise<Constraint>; // Phase 2.5 widened the target from Interest-only
  needsEnrichment(interestIds: InterestId[], dimensions: ConstraintDimension[]): Promise<Set<InterestId>>; // interests among interestIds not fully answered on all given dimensions
}

interface NoteService {                        // added Phase 2 — no screen may call NoteRepository directly
  listForInterest(interestId: InterestId): Promise<Note[]>; // pinned first, then newest-first
  add(interestId: InterestId, input: { title?: string; body: string }): Promise<Note>; // rejects blank/whitespace-only body
  update(noteId: NoteId, patch: Partial<Pick<Note, 'title' | 'body' | 'pinned'>>): Promise<Note>;
  remove(noteId: NoteId): Promise<void>;
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

interface TaskService {                       // Phase 2.5 — umbrella interests only; OneTimeProject has no Tasks. Replaces the sketched StepService.
  listForInterest(interestId: InterestId): Promise<Task[]>;                  // sequenced: in order; repeatable: user order
  add(interestId: InterestId, input: { title: string }): Promise<Task>;      // mode is inherited from the parent Interest's type, not passed
  reorder(interestId: InterestId, orderedTaskIds: TaskId[]): Promise<void>;  // sequenced mode only
  complete(taskId: TaskId, options?: { rearm?: boolean }): Promise<Task>;    // logs a completion event; rearm (repeatable only) makes the Task actionable again
  nextActionable(interestId: InterestId): Promise<Task | null>;              // sequenced: next incomplete; repeatable: next armed
  remove(taskId: TaskId): Promise<void>;
}
```

### Repositories (`src/repositories`)

One repository per aggregate; all SQLite access is confined here.

```ts
interface InterestRepository {
  insert(interest: NewInterest): Promise<Interest>;
  findById(id: InterestId): Promise<Interest | null>;
  query(filter: InterestFilter): Promise<Interest[]>;
  update(id: InterestId, patch: Partial<Pick<Interest, 'title' | 'type' | 'state' | 'archivedAt' | 'typeSkippedAt' | 'dueBy'>>): Promise<Interest>;  // same narrow patch as InterestService.update
  remove(id: InterestId): Promise<void>;
}

interface ConstraintRepository {
  findForInterest(interestId: InterestId): Promise<Constraint[]>;
  findForTask(taskId: TaskId): Promise<Constraint[]>;                                    // Phase 2.5
  replaceForInterest(interestId: InterestId, constraints: Constraint[]): Promise<void>; // per-dimension upsert; dimensions absent from the call are left untouched, not a wipe-and-reinsert
  replaceForTask(taskId: TaskId, constraints: Constraint[]): Promise<void>;              // Phase 2.5 — same per-dimension upsert semantics
  findFullyAnsweredInterestIds(interestIds: InterestId[], dimensions: ConstraintDimension[]): Promise<Set<InterestId>>; // added Phase 2 — bulk check to avoid N+1 queries
}

interface TaskRepository {                                                               // Phase 2.5
  findForInterest(interestId: InterestId): Promise<Task[]>;                              // ordered by position
  insert(task: NewTask): Promise<Task>;
  update(id: TaskId, patch: Partial<Pick<Task, 'title' | 'position' | 'state'>>): Promise<Task>;
  logCompletion(id: TaskId, completedAt: string, rearm: boolean): Promise<Task>;         // appends a completion event; rearm restores actionability (repeatable only)
  remove(id: TaskId): Promise<void>;
}

interface NoteRepository {
  findForInterest(interestId: InterestId): Promise<Note[]>; // pinned DESC, then createdAt DESC
  insert(note: NewNote): Promise<Note>;
  update(id: NoteId, patch: Partial<Pick<Note, 'title' | 'body' | 'pinned'>>): Promise<Note>;
  remove(id: NoteId): Promise<void>;
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
| **2** | Guided Interest Setup | Optionally enrich interests: type, time/location/supplies/social/weather+seasonal requirements via a card-based flow. Energy/focus is modeled and stored but has no question card until a later phase. All fields optional. |
| **2.5** | Interest Shapes (Tasks) | Remodel the three types into three genuinely different container shapes. Adds the `Task` entity (`repeatable` / `sequenced`), derives type from behavioral answers instead of asking it, replaces the single guided-setup flow with a **per-type** flow, moves constraints to whichever level the type implies, and adds Task completion with re-arm. Replaces the sketched `Step` entity. **Blocks Phase 3.** |
| **3** | Recommendation Engine (v1) | Deterministic feasibility filter (load candidates → evaluate per-dimension: hard blocks exclude, soft blocks warn → order feasibility-first → return). Request recommendations from current circumstances. Candidates are **Tasks** for umbrella interests and the **Interest itself** for `OneTimeProject`; constraints are evaluated at the effective (Task-then-umbrella) level. |
| **4** | Sessions | Start/end session, record duration, optional notes. A session attaches to the **Task** where one exists, and to the Interest for `OneTimeProject`. |
| **5** | Reflections | Fulfillment, satisfaction, mood, would-do-again, notes. Offered on **any** completion — Task or Interest — and never required. |
| **6** | Impact Reflections | Delayed reflections; lasting impact associated with completed interests. Concluding an umbrella is now a real, meaningful moment, so impact capture has a natural trigger for interests that never "finish." |
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

- **The three Interest types are three container shapes, not one shape with three
  labels** _(2026-08-20, Phase 2.5)_ — raised after Phase 2 UAT, where the types read as
  "three different kinds of thing bundled into the same questionnaire and data box and
  slapped with a label to differentiate them." `OneTimeProject` *is* its own unit of
  work; `UnstructuredLearning` and `StructuredLearning` are **umbrellas** over `Task`
  children — repeatable and unordered for the former, sequenced and finite for the
  latter. One `Task` entity with two modes, not two entities; `Step` becomes the
  `sequenced` mode. Completion moves **down** to the Task, which makes guilt-free
  Conclude/Resting structural instead of special-case copy. `OneTimeProject`
  deliberately has **no** Tasks — forcing uniformity onto all three types is the
  original error in the opposite direction. See [Domain Model](#domain-model).
- **Type is derived from behavioral answers, never asked** _(2026-08-20, Phase 2.5)_ —
  asking "is this a one-time project?" makes the user do the app's classifying for it,
  inverting the product's whole purpose. Two behavioral questions ("can this be finished
  in one sitting?", "is there a set order of steps to get there?") determine the type,
  which is stored as a consequence. Type therefore stops being a free-standing editable
  field, and `typeSkippedAt` simplifies: there is nothing to skip, only not-yet-enough
  answered to determine it.
- **The guided flow is per-type, not one flow with a branch** _(2026-08-20, Phase 2.5)_
  — a single questionnaire serving all three shapes forces a choice between asking every
  axis at both the umbrella and Task level (a 30-plus-question flow that destroys the
  low-friction goal) and asking umbrella-level questions that read as incoherent for an
  umbrella ("how long does *Learn the Violin* take?"). Both problems are artifacts of the
  uniform flow, not of the model. Each type gets a flow shaped to it: a Cutting answers
  the axes directly, an Evergreen captures Tasks and answers axes per Task, a Trellis
  captures ordered Tasks and answers axes once at the umbrella. Shared cards still exist;
  the *structure* differs.
- **Constraint level is a property of the type** _(2026-08-20, Phase 2.5)_ — constraints
  attach to an Interest or a Task, resolved by **per-dimension override** (Task's answer,
  falling back to the umbrella's) with no merge or union semantics anywhere. Where the
  answers live differs per type by design; a Task needing the umbrella's answer plus one
  more item is handled by **pre-filling the editor**, not by a merge rule. See
  [Domain Model](#domain-model).
- **Recommendation is a feasibility filter, not a preference model** _(2026-07-16)_ —
  the engine surfaces backlog interests that are actionable right now and never uses
  historical fulfillment, reflections, or analytics to rank or hide them. See
  [Recommendation Engine](#recommendation-engine).
- **Hard vs. soft blocks are computed, not stored** _(2026-07-16)_ — both are kept for
  v1. Severity is derived per-dimension at evaluation time by comparing the current
  context to the interest's requirements. Soft = shown with a warning; hard = excluded
  from recommendations (still in the backlog). Constraint storage shape is left to
  Phase 2 (see Open Questions).
- **Each Interest has a journal, not a notes field** _(2026-07-28)_ — raised during
  Phase 2 UAT; notes had no prior home in the spec (they existed only on `Session` and
  `Reflection`). A `Note` entity attaches many entries to an Interest — optional title,
  body, `pinned` flag — on **its own screen** reached from Interest Detail. Deliberately
  *not* a single mutable `notes` column: a note is an observation made at a moment, and
  one blob loses when each was written. The journal exists because the app cannot
  anticipate every detail an interest needs; it is open space the user owns, so nobody
  is blocked by a field we failed to imagine. Notes carry no semantics — the engine
  never reads them. The questionnaire is not a notes surface: it stays fast and
  structured, and prose lives in the journal.
- **`Weather`, `Season`, and `TimeOfDay` are three dimensions, not one** _(2026-07-30)_
  — raised during Phase 2 UAT. These axes co-occur: an interest can be weather-dependent
  *and* time-of-day-dependent at once, and the branching single value forced a false
  either/or that discarded a real requirement. Splits `WeatherSeason` into three stored
  `ConstraintDimension` values with flat multi-select payloads, taking the `CHECK`-widening
  migration that the 2026-07-28 decision below was written to avoid. Reverses that
  decision's structure while keeping its substance (structured answers, and `TimeOfDay`
  never colliding with `Time`). Question flow goes from six cards to eight. See
  [Constraint](#constraint).
- **Constraint answers must be structured, never free text** _(2026-07-28)_ — the
  original `WeatherSeason` shape (`{ matters, note? }`) captured prose the engine could
  not use and the user could not scan. Replaced with a discriminated union over
  `Weather` / `TimeOfDay` / `Season`. The questionnaire exists to produce queryable data
  and a readable one-place reference — free text serves neither. _(The union's **shape**
  was superseded 2026-07-30 — see the entry above. The structured-not-prose principle
  stands.)_
- **`dueBy` orders, never pushes** _(2026-07-28)_ — an optional due date on Interest,
  captured inside the `Season`/`TimeOfDay` branches but stored once on the Interest.
  Proximity raises an interest within the feasible set. This does not reverse the
  feasibility-filter decision: it ranks by how soon an opportunity closes, not by how
  much the user liked something before. No notifications, badges, or reminders, and a
  missed date never flags or hides anything.
- **Archive = soft-delete flag** _(2026-07-16)_ — `archivedAt` timestamp, orthogonal
  to the `Backlog/InProgress/Complete` lifecycle; archived interests are hidden from
  default views but recoverable. Delete is a separate, permanent hard removal.
- **Steps for structured interests — un-defers Milestones** _(2026-07-16; superseded
  2026-08-20)_ — a `Step` entity models the itinerary of `StructuredLearning` interests
  (ordered, incrementally added, own done-state); the engine recommends the next Step.
  This narrowly reversed the earlier deferral — the cybersecurity-cert case showed
  Sessions alone can't represent a curriculum. **Superseded by Phase 2.5:** the insight
  holds, but `Step` is now the `sequenced` mode of `Task` rather than its own entity,
  since `UnstructuredLearning` needs the same child-of-an-umbrella structure with
  different child behavior.
- **Per-type shape & completion** _(2026-07-16; revised 2026-08-20)_ — one-time = user
  marks done; unstructured = guilt-free Conclude/Resting (never "finished"); structured
  = Tasks done or user declares. Always user-declared, never auto-forced. **Revised by
  Phase 2.5:** completion moves down to the Task for both umbrella types, so
  Conclude/Resting is now a structural consequence rather than special-case copy.
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
  dimensions** _(2026-07-19; dimension list superseded 2026-07-30)_ — Phase 2 stores
  `ConstraintDimension` as six
  values (`Time`, `Supplies`, `Location`, `Social`, `WeatherSeason`,
  `EnergyFocus`), merging weather+seasonal and energy+focus to match the
  design-intent doc's six-question v1 set. One row per (interest, dimension)
  with a `UNIQUE` constraint, `ConstraintStatus` of `Unknown | None | Set`, a
  JSON-encoded value, and `ON DELETE CASCADE` from the parent interest.
  Resolves the former Open Question "Constraint storage shape." See
  [Constraint](#constraint). _(`WeatherSeason` was split into `Weather`, `Season`, and
  `TimeOfDay` on 2026-07-30, making eight stored dimensions; the row/status/value/cascade
  mechanics here are unchanged.)_
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

## Open Questions

- **Per-dimension thresholds & tolerance bands** — the exact numbers that separate
  OK / soft / hard per dimension (e.g. the 5-minute session minimum, how many minutes
  under budget still counts as soft). Tuning work; settle during Phase 3.
- **What counts as "choosing"** — the exact interaction recorded as a Session (acting on
  a recommendation or an explicit "start" vs. merely opening details), so
  revealed-interest data isn't inflated by browsing. Settle when Sessions land (Phase 4).
- **Type display names** — `Cuttings` / `Trellises` / `Evergreens` (the garden-metaphor
  labels surfaced by `displayLabel`) still read awkwardly, particularly the latter two.
  The underlying `InterestType` identifiers and the Phase 2.5 container shapes are
  settled and are **not** blocked on this; only the user-facing wording is open. Revisit
  once the per-type flows have been used in anger — the right names are likelier to be
  obvious after the shapes are real than before.
- **Task state model** — the precise state a `Task` carries (done / not-done for
  `sequenced`; armed / completed-count for `repeatable`), and whether completing an
  Interest's first Task should flip the umbrella from `Backlog` to `InProgress`
  automatically or leave it to the user. Settle during Phase 2.5 planning.
- **Task-level enrichment timing** — Task constraints are answered lazily rather than in
  the setup flow (see Phase 2.5's per-type flows), but the exact trigger — on demand when
  editing a Task, via the just-in-time enrichment pattern, or both — is unsettled.
  Settle during Phase 2.5 planning.

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

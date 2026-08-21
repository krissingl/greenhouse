# Greenhouse — UX & Interaction Design Intent

_Last updated: 2026-07-16 | Status: ACTIVE (living design doc)_

> This is a **living** design-intent document, not a frozen planning artifact. It
> captures the *how* and *why* behind the interaction design so a planning agent
> expanding a phase into tickets has the design constraints in hand and doesn't
> re-derive (or lose) them. The authoritative *what* — entities, contracts,
> architecture, engine behavior — lives in [`spec/PROJECT_SPEC.md`](../../spec/PROJECT_SPEC.md);
> when this doc and the spec disagree on a decision, the spec wins. New design
> conversations for future phases should append here.

---

## Guiding spirit (applies to everything below)

Greenhouse is a fulfillment tool, not a productivity tool. Every interaction is
judged against the product's Decision Filters (see spec). In UX terms that means:

- **No obligation, no guilt, no completion pressure.** Nothing nags. Nothing shows
  a percentage-done. Unpursued interests are dormant seeds, not failures.
- **Trust the user's past self.** Adding an interest is the statement of desire; the
  app never second-guesses *whether* they want something — only helps with *whether
  they can do it now*.
- **Friction is the enemy.** The most valuable feature (feasibility filtering) is
  starved if capture and enrichment feel like work. Optimize relentlessly for the
  lightest possible touch.

---

## Guided Setup (Phase 2)

The make-or-break flow: enriching an interest with the requirement data that powers
recommendations, **without** it feeling like a form.

### Capability, not completion — the core reframe

A progress bar ("3 of 9 fields complete") is a subtle guilt machine — it implies an
obligation to reach 100%. **Do not use one.** Instead, every answer visibly gives the
interest a new *ability*:

- 0 answers → "I can only find this if you go looking for it."
- + time → "I can suggest this when you have 15 minutes."
- + location → "…when you're at home with 15 minutes."
- + supplies → "…and I'll know if you're missing anything first."

The reward is intrinsic and future-facing (future-me benefits), never gamified. A
dormant seed *waking up* into something the app can actively surface — that is the
dopamine. Frame setup as **"teaching Greenhouse how to hand this back to you at the
right moment,"** never as a task to finish.

### Flow mechanics

- **Title first, alone.** Capture is one field + save. Done. Everything else is always
  optional and never gates the save.
- **One question per card, conversational.** Not a multi-field form — a gentle stack of
  cards, big tap targets, chips/sliders over typing. Feels like a friendly chat.
- **Autosave per answer ⇒ resumable for free.** Each answer commits independently, so
  there is no "form in progress" to lose. Leave after one card or after nine. "Resume"
  is just the interest quietly remembering which cards are still blank and offering them
  again, gently.
- **Editing is the same UI as entry.** The interest detail shows answers as tappable
  chips; tapping one re-opens *that single card*. No separate "edit mode." Blank axes
  appear as soft "＋ add" invitations, never red "missing!" badges.

### Skip vs. "Doesn't apply" (a semantic, not just UX)

Every card offers two guilt-free, one-tap escape hatches, and they mean different
things to the engine:

- **"Not sure / later"** → *unknown* → engine treats as **non-blocking** (interest stays
  eligible, optionally lower-confidence).
- **"None / doesn't apply"** → an *actual answer* (e.g. needs no supplies) → engine knows
  the interest is **unconstrained** on that dimension (always OK).

These two states must be **stored distinctly** — this is reflected in the spec's
Recommendation Engine section. Conflating them breaks feasibility filtering.

### Just-in-time enrichment (the anti-form weapon)

The best form is the one you never sit down to fill out. Let enrichment trickle in, one
relevant question at the exact moment it pays off:

- A recommendation **soft-blocks** on time → "I wasn't sure how long violin takes — want
  to tell me?" One card, right there.
- A **session** ends → "That ran 20 min. Should I remember that as its usual length?"
  Enrichment as a byproduct of use.
- Idle browsing → an optional, dismissible "Got a minute? 3 seeds could tell me more."
- **Never** a push notification to finish setup (a non-goal regardless).

### The flow is per-type, not one flow with a branch _(revised 2026-08-20, Phase 2.5)_

**This supersedes the single-flow assumption in the mechanics above.** The three
interest types are three different container shapes (see spec Domain Model), and the
setup flow has to *match the shape* rather than force all three through one
questionnaire with a branch bolted on.

Two failures come from the uniform flow, and both dissolve once the flow is
type-shaped:

- **Question volume.** Asking every axis at both the umbrella and the Task level makes
  a three-Task interest a thirty-plus-question flow — the exact friction this app
  exists to remove.
- **Incoherent questions.** "How long does a good session take?" is a sensible question
  about *build garage shelves* and a meaningless one about *Learn the Violin*. You do
  not do the umbrella; you do its Tasks.

**Type comes first, and is inferred — never asked.** The flow opens with a couple of
behavioral questions ("Can this be finished in one sitting?", "Is there a set order of
steps to get there?"). The user never sees the words Cutting, Trellis, or Evergreen as
a *choice*. Naming the taxonomy makes the user do the classifying, which is the app's
job, not theirs.

Then the flow forks:

| Type | What the flow asks | Constraints answered at |
|---|---|---|
| **Cutting** (`OneTimeProject`) | the axes, directly — the Interest *is* the unit of work, so every question reads correctly about it. **The existing card flow is already right here; leave it alone.** | the Interest |
| **Evergreen** (`UnstructuredLearning`) | *"What kinds of things will you do?"* → capture Tasks by name. Axes attach to **Tasks**, because that is the level where they genuinely differ. | mostly the Task |
| **Trellis** (`StructuredLearning`) | *"What are the steps, in order?"* → capture ordered Tasks, names only. Requirements don't vary across steps, so the axes are asked **once**, at the umbrella. | mostly the umbrella |

**Setup stays short; specificity accrues.** Tasks are captured with **a name and
nothing else**. Task-level axes are filled in **lazily** — on demand when the user
edits a Task, and through the just-in-time enrichment pattern above. This is also more
honest: you usually don't know a Task's real requirements until you've done it once.

**Where a Task needs the umbrella's answer plus one more thing** (a Trellis step that
also needs a textbook), pre-fill the editor with the umbrella's values so the user
amends rather than retypes. This is a UI convenience, not an inheritance rule — the
engine only ever does per-dimension override.

### Question set (v1)

All chip/slider inputs; minimal typing. Every card has "Not sure" and "Doesn't apply."
Which of these are asked, and at which level, depends on the type — see the fork above.

| Axis | Question | Input |
|---|---|---|
| Time | "How long does a good session usually want?" | 5–15 · 15–30 · 30–60 · 1hr+ · Varies |
| Supplies | "Need any gear or supplies?" | None · Yes → light "have it / need it" list |
| Location | "Where can you do this?" | Home · Somewhere specific · Anywhere |
| Social | "Need anyone else?" | Solo · Needs people |
| Weather/Season | "Does weather or time of year matter?" | No · Yes → simple pick |
| Energy/Focus *(later)* | "How much does it ask of you?" | Low · Medium · High |

### Guardrails (the "never" list)

- Never a completion percentage, "incomplete" badge, or red nag.
- Never block saving or using an interest on missing data.
- Never push-notify to finish setup.
- Never make "skip" feel like failure — it's a valid, permanent-until-changed state.

---

## Interest Shapes & Structured Itineraries

The three interest types have genuinely different shapes (see spec Domain Model), and
_(revised 2026-08-20, Phase 2.5)_ two of them are **umbrellas over Tasks** rather than
units of work in their own right. UX implications:

- **Cutting (dragon):** no ceremony, no Tasks. Do it, tap **Complete**, get the one
  reflection. The Interest is the thing.
- **Evergreen (violin):** an umbrella over **repeatable** Tasks — "practice 15 minutes",
  "read sheet music", "follow a tutorial". You never do the umbrella. Completing a Task
  is the real, frequent closure: **complete → (optionally reflect) → close it out, or
  re-arm it** so the next instance is lined up while the finished one still counts.
  Concluding the *umbrella* is the rare guilt-free **Conclude / Resting** action
  (satisfied or paused, never "finished").
- **Trellis (cyber cert):** an umbrella over an ordered, finite list of **sequenced**
  Tasks. Added **incrementally** — quick-add as you go, paste a list, or track loosely
  ("~Module 4 of 30") — **never** a mandatory full-curriculum upfront. Granularity is the
  user's choice (a video+assignment can be one Task or two). Only the **next** Task is
  actionable; the rest wait under the umbrella instead of cluttering the board.

**Why completion moving down matters.** Guilt-free completion stops being copy we write
carefully and becomes something the structure guarantees. The user banks closure
constantly at the Task level; the pursuit above it is simply never asked to be finished.

**Payoff:** the recommender surfaces the *next concrete Task*, time-fitted ("You have 15
min → next cyber step is a 10-min video + 5-min assignment"), turning a vague pursuit
into an actionable suggestion.

**Completion is always user-declared**, never auto-forced — the app only *offers* it at
the natural moment (all Tasks checked → "Mark complete?"). **Reflection is offered on
every completion at either level and is never required.** Interests can be re-opened and
Tasks added after a "completion."

---

## Fulfillment Capture (Phases 5–7)

Fulfillment is measured two ways, and the UX must keep the second one invisible-as-a-count.

### Two signals

- **Stated** — what the user says. Lightweight, optional reflections, invited
  *periodically* ("How's violin feeling lately?") and at conclusion — **not** per session.
- **Revealed** — what the user does: how often they *chose* an interest. Repeatedly
  choosing violin is behavioural proof of genuine interest (people self-report this
  poorly). Derived from Session records.

### Capture the choice, not a log

To keep revealed-interest data reliable *without* asking the user to log anything, the
**act of choosing/starting an interest is itself the record** — captured silently when
the user acts on a recommendation or explicitly starts. The user never logs a session;
the app notices the choice. (Open question in spec: exactly which interaction counts as
"choosing" vs. mere browsing — must not inflate the signal.)

### The scoreboard line (critical)

The count is data for the *system*, never a display for the *user*. Same number, opposite
meaning:

- ❌ "47 sessions! 🔥" → productivity pressure. Forbidden.
- ✅ "Violin genuinely draws you back" → self-understanding. This is the goal.

Raw counts and streaks are **never** surfaced. Frequency appears only as *qualitative
insight* inside the fulfillment review. This is the same discipline as the guided-setup
guardrails: reflect meaning, never measurement.

---

## Visual Design & Theming

Seed design tokens **already exist** and should be adopted as the basis of the Phase 0
design system — do **not** regenerate them from scratch:

- `catchAll/light_theme.ts`, `catchAll/dark_theme.ts` — a light/dark palette
  (greenhouse-green `#5F8F62` primary, warm secondary, blue tertiary, semantic
  success/warning/error/info, layered surfaces, tiered text, borders). These define the
  app's look and the light/dark contract the UI must honour.

**Two Phase 0 tasks to finish them:**

1. **Missing type.** Both files `import { Theme } from "./types"`, but no `Theme` type
   exists anywhere in the repo yet. Phase 0 must define it (shape ≈ `{ dark: boolean;
   colors: { … } }`) so the themes compile.
2. **Relocate out of `catchAll/`.** That folder is a temporary drop, not a home. Phase 0
   should move these into the real design-system location (e.g. `src/theme/`), add the
   `Theme` type, and wire theme selection to follow the system light/dark preference
   (offline, on-device).

## Related

- [`spec/PROJECT_SPEC.md`](../../spec/PROJECT_SPEC.md) — authoritative domain model,
  contracts, architecture, and recommendation-engine behavior.
- Feature Roadmap (in the spec) — phase sequencing; this doc supplies the design intent
  for Phases 2 (guided setup), 2.5 (interest shapes & per-type flows), 3 (next-Task
  recommendations), and 5–7 (fulfillment).

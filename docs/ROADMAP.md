# Greenhouse Implementation Roadmap

> **Historical planning document — superseded by [`spec/PROJECT_SPEC.md`](../spec/PROJECT_SPEC.md) as the single source of truth.** Frozen; do not edit for current truth.

The project will be developed as a series of **vertical slices**, with each phase delivering a complete, usable feature that exercises the presentation, application, domain, and persistence layers.

---

# Phase 0 — Foundation

**Goal:** Establish the application's technical foundation.

## Tasks

- Initialize Expo + React Native project
- Configure TypeScript
- Configure ESLint and Prettier
- Set up navigation
- Establish design system and theming
- Configure SQLite
- Implement database migrations
- Establish repository infrastructure
- Configure logging
- Configure testing framework
- (Optional) Configure CI

## Deliverable

A running application that initializes the database successfully and provides the basic application shell.

---

# Phase 1 — Interest Backlog (MVP)

**Goal:** Build the core functionality for managing interests.

## Features

- Create interest (title only)
- List interests
- View interest details
- Edit interests
- Archive or delete interests
- Search interests
- Filter by state

## Deliverable

A usable personal backlog of interests.

---

# Phase 2 — Guided Interest Setup

**Goal:** Allow users to gradually enrich interests with recommendation data.

## Features

- Interest type
- Time requirements
- Energy requirements
- Focus requirements
- Location requirements
- Required supplies
- Social requirements
- Weather requirements
- Seasonal requirements

All fields remain optional to preserve low capture friction.

## Deliverable

Interests contain enough contextual information to support meaningful recommendations.

---

# Phase 3 — Recommendation Engine (v1)

**Goal:** Deliver Greenhouse's primary differentiating feature.

## Recommendation Pipeline

1. Load candidate interests
2. Evaluate hard constraints
3. Evaluate soft constraints
4. Calculate recommendation scores
5. Rank recommendations
6. Return recommendations

The initial implementation should remain deterministic and intentionally simple.

Future versions can improve scoring without changing the surrounding architecture.

## Deliverable

Users can request recommendations based on their current circumstances.

---

# Phase 4 — Sessions

**Goal:** Record participation in interests.

## Features

- Start session
- End session
- Record duration
- Optional session notes

## Deliverable

Users can record when they engage with an interest.

---

# Phase 5 — Reflections

**Goal:** Capture immediate impressions after participating.

## Features

- Fulfillment
- Satisfaction
- Mood
- Would do again
- Reflection notes

## Deliverable

Greenhouse begins collecting information about which interests create meaningful experiences.

---

# Phase 6 — Impact Reflections

**Goal:** Capture long-term value created by an interest.

## Features

- Record delayed reflections
- Capture lasting positive impacts
- Associate impacts with completed interests

Examples:

- A home improvement project continues improving daily life.
- A learned skill becomes useful later.
- A completed experience becomes more meaningful over time.

## Deliverable

The application can distinguish between immediate fulfillment and lasting impact.

---

# Phase 7 — Dashboard & Analytics

**Goal:** Surface meaningful patterns from accumulated data.

## Features

- In Progress interests
- Fulfillment trends
- High-impact interests
- Fulfillment by category
- Recommendation entry point
- Reflection summaries

Analytics should remain descriptive rather than prescriptive.

Avoid productivity-oriented metrics.

## Deliverable

Users gain insights into which interests consistently provide fulfillment.

---

# Phase 8 — Polish

**Goal:** Refine the application for everyday use.

## Improvements

- Search improvements
- Performance optimization
- Empty states
- Accessibility
- Animations
- Import/export
- Backup workflows
- General UX polish

## Deliverable

A polished Version 1 release.

---

# Future Backlog

Potential future enhancements include:

- Cloud synchronization
- Web client
- Encrypted backups
- Improved recommendation heuristics
- AI-assisted organization
- Richer analytics

These features should remain outside the Version 1 scope.

---

# Definition of Done

A phase is considered complete when:

- The feature works end-to-end.
- Data persists correctly.
- Critical business logic is tested.
- The user experience is complete enough for real-world use.
- The application remains in a runnable, releasable state.
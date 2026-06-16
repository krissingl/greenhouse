# Greenhouse Product Requirements Document (PRD)

## Document Status

Draft

## Version

1.0

## Date

2026-06-12

---

# Overview

Greenhouse is a local-first personal enrichment application designed to help users manage a backlog of interests, hobbies, projects, and experiences they wish to pursue.

The application helps users identify barriers to participation ahead of time, organize interests based on their real-world requirements, and receive recommendations based on their current circumstances.

Greenhouse is not intended to increase productivity, optimize performance, or encourage goal completion.

Its purpose is to help users spend their limited free time on interests that are accessible, meaningful, and fulfilling.

---

# Problem Statement

The user has a large and constantly growing collection of interests, hobbies, projects, and experiences they would like to pursue.

Examples include:

- Learning violin
- Voice acting
- Painting
- Game design
- Home improvement projects
- Professional certifications
- Creative pursuits

When free time becomes available, selecting an interest often becomes overwhelming.

Even after selecting an interest, hidden barriers frequently prevent immediate participation:

- Required supplies are unavailable.
- Necessary stores are closed.
- The interest requires more time than is currently available.
- The interest can only be performed in a specific location.
- The interest requires more energy or focus than the user currently has.

The effort required to identify barriers, prepare an interest, and determine what is possible often exceeds the motivation available to begin.

Users frequently find themselves repeating the same planning and preparation process each time they return to an interest. The effort required to identify barriers can become a barrier itself.

As a result, the user frequently spends free time deciding what to do rather than doing something they genuinely enjoy.

---

# Vision

Greenhouse helps users answer a simple question:

> What would I enjoy doing right now that I can actually start right now?

The application should reduce decision fatigue, surface realistic options, and help users better understand which interests create lasting fulfillment.

---

# Target User

## Primary User

The product is initially designed for a single user with:

- Many hobbies and interests
- Limited free time
- Frequent decision paralysis when selecting interests
- A desire to better understand what creates personal fulfillment

## Future Users

Future versions may support users with similar behavioral patterns, but v1 is explicitly optimized for the author's personal workflow and needs.

---

# Product Principles

## Fulfillment Over Productivity

Greenhouse exists to support fulfillment, enjoyment, curiosity, and enrichment.

The application does not exist to maximize output, efficiency, achievement, or measurable productivity.

---

## Curiosity Without Obligation

Adding an interest should feel like planting a seed, not creating a commitment.

Interests are opportunities, not obligations.

Users should never feel guilty about unfinished interests.

---

## Minimize Capture Friction

Users should be able to capture an interest immediately when inspiration strikes.

Only a title is required.

All additional information should be optional and may be added later.

Capturing an interest should never require significant planning, categorization, or data entry.

---

## Reduce Activation Energy

The application should help users identify barriers before they are ready to begin.

When motivation becomes available, the user should be able to start quickly and confidently.

---

## Reality-Based Recommendations

Recommendations should be based on the user's current circumstances.

The system should prioritize what is realistically achievable right now.

---

## Reflection Over Performance

The application should help users learn about themselves.

Insights should focus on fulfillment and personal patterns rather than performance metrics.

---

# Goals

## Goal 1

Maintain a structured backlog of interests the user wishes to explore, pursue, or complete.

---

## Goal 2

Capture barriers, requirements, and constraints associated with interests.

---

## Goal 3

Recommend interests based on current circumstances.

---

## Goal 4

Track personal fulfillment and satisfaction after participation.

---

## Goal 5

Provide meaningful insights into which interests consistently create positive experiences.

---

# Non-Goals

The following are explicitly outside the scope of Greenhouse.

## Productivity Tracking

The application will not track productivity.

---

## Goal Management

The application will not manage personal goals.

---

## Performance Optimization

The application will not attempt to optimize user output.

---

## Habit Tracking

The application will not encourage recurring habits through streaks or similar mechanisms.

---

## Gamification

The application will not include:

- Points
- Levels
- Badges
- Achievement systems
- Streaks

---

## Social Features

The application will not include:

- Public profiles
- Interest feeds
- Social sharing
- Competition
- Community features

---

## Scheduling

The application will not function as a calendar or scheduling tool.

---

# Core Features

## Interest Backlog

Users can create interests they wish to pursue.

Only an interest title is required.

All additional information is optional and may be added later.

---

## Guided Interest Setup

The application will guide users through identifying barriers and requirements.

Example questions may include:

- How much time does this require?
- Where can this be done?
- Does it require supplies?
- Are supplies easily accessible?
- Does this require other people?
- How much energy does this require?
- How much focus does this require?
- Does weather matter?
- Does seasonality matter?

All responses must remain editable.

---

## Interest Types

Interests may be categorized as:

### One-Time Project

Example:

- Build garage shelves
- Paint a room

### Structured Learning

Example:

- Online certification course
- Formal training program

### Unstructured Learning

Example:

- Learn violin
- Learn painting

Long-term interests may contain smaller sessions or milestones.

---

## Recommendation Engine

Users can request interest recommendations based on current circumstances.

Examples:

- I have 20 minutes.
- I have low energy.
- I am away from home.
- I am by myself.
- I want something creative.

The system should identify interests that are currently achievable.

---

## In Progress Interests

The dashboard should prominently display interests currently being pursued.

---

## Reflection Tracking

Users may record impressions after participating in an interest.

Potential reflection inputs include:

- Fulfillment
- Mood
- Satisfaction
- Would do again

Reflection should remain lightweight and optional.

---

## Lasting Impact Tracking

Users may optionally record follow-up impressions after completion.

Example:

A home organization project may continue providing value long after completion.

The application should allow users to record these ongoing positive impacts.

---

## Analytics

The application should surface patterns including:

- Highest fulfillment interests
- Fulfillment by category
- Fulfillment trends over time
- Interests with strong long-term impact

Analytics should remain descriptive rather than prescriptive.

---

# Interest States

## Backlog

Interests the user wishes to pursue.

---

## In Progress

Interests currently being explored or worked on.

---

## Complete

Interests the user considers complete.

Completion is determined by the user.

---

# Dashboard Requirements

The dashboard should prioritize:

1. Recommend an Interest
2. Create New Interest
3. View In Progress Interests

Secondary information may include:

- Backlog overview
- Completed interests
- Reflection summaries
- Analytics entry points

---

# Success Criteria

The product is successful if it helps users:

- Spend less time deciding what to do.
- Spend less time discovering barriers.
- Spend more time engaging with meaningful interests.
- Better understand which interests create fulfillment.
- Rediscover interests that would otherwise be forgotten.

The application is not measured by:

- Number of completed interests
- Productivity gains
- Goal completion percentages
- User streaks
- Engagement metrics

---

# Technical Constraints

- Local-first architecture
- Offline functionality
- Single-user design
- SQLite persistence
- React Native application
- Expo runtime
- TypeScript codebase

Cloud services are not required for v1.

# Decision Filters

When evaluating a feature, ask:

1. Does this reduce activation energy?
2. Does this help users engage with interests they genuinely want to do?
3. Does this improve self-understanding?
4. Could this introduce guilt, obligation, or performance pressure?
5. Would this make Greenhouse feel more like a productivity app?

If a feature primarily serves productivity, accountability, optimization, or engagement metrics, it should generally be rejected.
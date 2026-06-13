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

The application helps users identify barriers to participation ahead of time, organize activities based on their real-world requirements, and receive recommendations based on their current circumstances.

Greenhouse is not intended to increase productivity, optimize performance, or encourage goal completion.

Its purpose is to help users spend their limited free time on activities that are accessible, meaningful, and fulfilling.

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

When free time becomes available, selecting an activity often becomes overwhelming.

Even after selecting an activity, hidden barriers frequently prevent immediate participation:

- Required supplies are unavailable.
- Necessary stores are closed.
- The activity requires more time than is currently available.
- The activity can only be performed in a specific location.
- The activity requires more energy or focus than the user currently has.

The effort required to determine what is possible often exceeds the motivation available to begin.

As a result, the user frequently spends free time deciding what to do rather than doing something they genuinely enjoy.

---

# Vision

Greenhouse helps users answer a simple question:

> What would I enjoy doing right now that I can actually start right now?

The application should reduce decision fatigue, surface realistic options, and help users better understand which activities create lasting fulfillment.

---

# Target User

## Primary User

The product is initially designed for a single user with:

- Many hobbies and interests
- Limited free time
- Frequent decision paralysis when selecting activities
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

Adding an activity should feel like planting a seed, not creating a commitment.

Activities are opportunities, not obligations.

Users should never feel guilty about unfinished activities.

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

Maintain a structured backlog of activities, hobbies, projects, and interests.

---

## Goal 2

Capture barriers, requirements, and constraints associated with activities.

---

## Goal 3

Recommend activities based on current circumstances.

---

## Goal 4

Track personal fulfillment and satisfaction after participation.

---

## Goal 5

Provide meaningful insights into which activities consistently create positive experiences.

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
- Activity feeds
- Social sharing
- Competition
- Community features

---

## Scheduling

The application will not function as a calendar or scheduling tool.

---

# Core Features

## Activity Backlog

Users can create activities they wish to pursue.

Only an activity title is required.

All additional information is optional and may be added later.

---

## Guided Activity Setup

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

## Activity Types

Activities may be categorized as:

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

Long-term activities may contain smaller sessions or sub-activities.

---

## Recommendation Engine

Users can request activity recommendations based on current circumstances.

Examples:

- I have 20 minutes.
- I have low energy.
- I am away from home.
- I am by myself.
- I want something creative.

The system should identify activities that are currently achievable.

---

## In Progress Activities

The dashboard should prominently display activities currently being pursued.

---

## Reflection Tracking

Users may record impressions after participating in an activity.

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

- Highest fulfillment activities
- Fulfillment by category
- Fulfillment trends over time
- Activities with strong long-term impact

Analytics should remain descriptive rather than prescriptive.

---

# Activity States

## Backlog

Activities the user wishes to pursue.

---

## In Progress

Activities currently being explored or worked on.

---

## Complete

Activities the user considers complete.

Completion is determined by the user.

---

# Dashboard Requirements

The dashboard should prioritize:

1. Recommend an Activity
2. Create New Activity
3. View In Progress Activities

Secondary information may include:

- Backlog overview
- Completed activities
- Reflection summaries
- Analytics entry points

---

# Success Criteria

The product is successful if it helps users:

- Spend less time deciding what to do.
- Spend less time discovering barriers.
- Spend more time engaging with meaningful activities.
- Better understand which activities create fulfillment.
- Rediscover interests that would otherwise be forgotten.

The application is not measured by:

- Number of completed activities
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
2. Does this help users engage with activities they genuinely want to do?
3. Does this improve self-understanding?
4. Could this introduce guilt, obligation, or performance pressure?
5. Would this make Greenhouse feel more like a productivity app?

If a feature primarily serves productivity, accountability, optimization, or engagement metrics, it should generally be rejected.
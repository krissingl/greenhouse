# Greenhouse Domain Model

## Purpose

This document defines the core concepts used throughout Greenhouse.

It intentionally focuses on product concepts rather than implementation details.

Database design and application architecture should be derived from these concepts rather than defining them.

---

# Core Concept

## Interest

An Interest represents something the user wants in their life.

Examples:

- Learn violin
- Earn a cybersecurity certification
- Paint a landscape
- Build garage shelves
- Explore voice acting

An Interest is the primary entity in Greenhouse.

Interests are opportunities rather than obligations.

---

# Interest Types

## One-Time Project

A finite endeavor with a user-defined completion point.

Examples:

- Build garage shelves
- Paint a room
- Organize a workshop

Characteristics:

- Usually completable
- May or may not involve multiple sessions
- Completion is determined by the user

---

## Structured Learning

An educational pursuit with an external or internally defined progression path.

Examples:

- Certification programs
- Online courses
- Formal training

Characteristics:

- Session based
- Has a completion state
- Often follows a defined curriculum

---

## Unstructured Learning

An ongoing pursuit without a definitive endpoint.

Examples:

- Learn violin
- Learn painting
- Learn photography

Characteristics:

- Session based
- No natural completion state
- Intended for long-term exploration

---

# Constraints

## Constraint

A Constraint is a condition that affects whether an Interest can be pursued.

Examples:

- Time requirements
- Supply requirements
- Location requirements
- Social requirements
- Weather requirements
- Seasonal requirements
- Energy requirements
- Focus requirements

Constraints exist to reduce future activation energy.

---

# Sessions

## Session

A Session represents a single engagement with an Interest.

Examples:

- Practice violin for 20 minutes
- Complete a certification lesson
- Spend an hour painting

Sessions help users resume activities without repeating planning work.

Sessions are not intended to function as productivity tracking.

---

# Reflections

## Reflection

A Reflection captures a user's impressions immediately after engaging with an Interest.

Potential inputs:

- Fulfillment
- Satisfaction
- Mood
- Would do again
- Notes

Reflections exist to improve self-understanding.

---

## Impact Reflection

An optional reflection recorded after time has passed.

Examples:

- A home improvement project continues providing value.
- A learned skill becomes useful later.
- An experience becomes more meaningful over time.

Impact Reflections help identify long-term fulfillment.

---

# States

## Backlog

The Interest exists but is not currently active.

---

## In Progress

The Interest is currently being explored or pursued.

---

## Complete

The user considers the Interest complete.

Completion is always determined by the user.
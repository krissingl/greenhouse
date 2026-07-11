# Greenhouse System Architecture

## Document Status

Draft

## Version

1.0

## Date

2026-07-10

---

# Purpose

This document defines the software architecture of Greenhouse.

It describes the major architectural components, their responsibilities, how data flows through the application, and how architectural decisions support the product goals described in the Product Requirements Document.

This document intentionally focuses on implementation architecture rather than product behavior.

Detailed feature requirements are defined in the PRD.

---

# Architectural Goals

The architecture should satisfy the following goals.

## Local-First

The application must provide complete functionality without internet connectivity.

All core features—including interest management, recommendations, analytics, and reflections—must execute entirely on the user's device.

---

## Simplicity

Greenhouse is intentionally designed as a single-user application.

The architecture should minimize unnecessary abstraction and avoid introducing infrastructure that does not directly improve the user experience.

---

## Maintainability

Business logic should remain isolated from user interface code.

Recommendation logic, analytics, persistence, and presentation should evolve independently.

---

## Extensibility

Although Greenhouse is initially a local-only application, the architecture should not prevent future additions such as:

- Cloud backup
- Synchronization
- Web deployment
- Enhanced recommendation models

---

## Performance

User interactions should feel immediate.

Recommendation generation, searching, filtering, and analytics should execute locally with minimal latency.

---

# Architectural Principles

Greenhouse follows several architectural principles.

## Domain-Driven Design

The application architecture is organized around the domain model rather than UI screens or database tables.

Core concepts include:

- Interest
- Constraint
- Session
- Reflection
- Impact Reflection

Business rules belong to these domain concepts rather than individual screens.

---

## Layered Architecture

The application is divided into distinct layers.

```text
Presentation
      │
      ▼
Application
      │
      ▼
Domain
      │
      ▼
Persistence
```

Each layer communicates only with the layer directly below it.

---

## Offline First

The application assumes network access is unavailable.

Internet connectivity is treated as an optional enhancement rather than a dependency.

---

## Type Safety

Domain entities, services, repositories, and API contracts should be strongly typed using TypeScript.

---

# High-Level Architecture

```text
                 React Native UI
                       │
                       ▼
               Screen Components
                       │
                       ▼
           Application Services Layer
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
 Interest Service  Recommendation  Analytics
                        Service
        └──────────────┼──────────────┘
                       ▼
               Repository Layer
                       │
                       ▼
                    SQLite
```

---

# Major Components

## Presentation Layer

Responsible for:

- Screens
- Navigation
- User input
- Form validation
- Displaying recommendations
- Displaying analytics

This layer contains no business logic.

Business decisions should always be delegated to application services.

---

## Application Layer

Coordinates application workflows.

Examples include:

- Creating an Interest
- Recording a Session
- Logging a Reflection
- Generating Recommendations
- Producing Dashboard data

This layer orchestrates domain objects and repositories.

---

## Domain Layer

Contains the business rules of Greenhouse.

Major domain concepts include:

- Interest
- Constraint
- Session
- Reflection
- Recommendation

The recommendation engine lives primarily within this layer.

This layer contains no UI code and no database implementation details.

---

## Persistence Layer

Responsible for:

- SQLite access
- Database migrations
- Repository implementations
- Query optimization

Persistence concerns should not leak into domain logic.

---

# Data Flow

## Creating an Interest

```text
UI
 │
 ▼
Interest Service
 │
 ▼
Interest Repository
 │
 ▼
SQLite
```

Only a title is required.

Additional information may be added incrementally.

---

## Requesting Recommendations

```text
User Context
      │
      ▼
Recommendation Service
      │
      ▼
Load Candidate Interests
      │
      ▼
Evaluate Constraints
      │
      ▼
Calculate Recommendation Score
      │
      ▼
Rank Results
      │
      ▼
Return Recommendations
```

---

## Recording Reflection

```text
Reflection Screen
      │
      ▼
Reflection Service
      │
      ▼
Reflection Repository
      │
      ▼
SQLite
      │
      ▼
Analytics Updated Automatically
```

---

# Recommendation Engine Architecture

The recommendation engine is implemented as a deterministic rule-based system.

Its primary responsibility is determining whether an Interest is realistically achievable under the user's current circumstances.

## Inputs

User context:

- Available time
- Energy
- Focus
- Location
- Available supplies
- Weather
- Season

Interest metadata:

- Constraints
- Type
- State
- Historical reflections

---

## Processing Pipeline

### Step 1

Load candidate Interests.

Exclude completed Interests unless explicitly requested.

---

### Step 2

Evaluate hard constraints.

Examples:

- Unavailable supplies
- Insufficient time
- Incompatible location

---

### Step 3

Evaluate soft constraints.

Examples:

- Preferred creativity
- Desired challenge
- Novelty

---

### Step 4

Calculate recommendation confidence.

Missing data reduces confidence.

Missing data never excludes an Interest.

---

### Step 5

Sort recommendations.

Primary ordering:

1. Feasibility
2. Activation energy
3. User preference
4. Historical fulfillment

---

# Data Architecture

SQLite serves as the system of record.

Major entities include:

- Interest
- Constraint
- Session
- Reflection
- Impact Reflection

Relationships should preserve the domain model rather than optimize prematurely.

---

# State Management

Application state consists of two categories.

## Persistent State

Stored in SQLite.

Examples:

- Interests
- Sessions
- Reflections

---

## Derived State

Calculated as needed.

Examples:

- Dashboard statistics
- Recommendation rankings
- Analytics summaries

Derived state should not be permanently stored unless performance requires caching.

---

# Error Handling

The application should fail gracefully.

Examples include:

- Invalid database state
- Migration failures
- Malformed user input

Errors should never cause permanent data loss.

---

# Security

Greenhouse stores all personal data locally.

No authentication is required.

Security focuses on:

- Preventing accidental corruption
- Preserving user privacy
- Safe database migrations
- Reliable backups and exports

---

# Performance Considerations

Expected data volume is relatively small.

Typical users are unlikely to exceed:

- Hundreds of Interests
- Thousands of Sessions
- Thousands of Reflections

SQLite is expected to comfortably support these workloads without additional optimization.

Performance efforts should prioritize:

- Recommendation responsiveness
- Dashboard rendering
- Search and filtering

---

# Future Architecture

The architecture intentionally leaves room for future enhancements.

Potential additions include:

- Cloud synchronization
- Encrypted backups
- Web client
- Richer analytics
- Import/export workflows

These capabilities should integrate without requiring fundamental changes to the existing domain model.

---

# Out of Scope

The architecture explicitly excludes:

- User authentication
- Multi-user support
- Cloud-hosted databases
- Social networking
- Notification systems
- Scheduling and calendar functionality
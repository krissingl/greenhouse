# ADR-001: Technology Stack Selection

## Status

Accepted

## Date

2026-06-12

## Context

Greenhouse is a personal hobby and interest management application designed to help users organize activities they want to try, understand barriers preventing participation, and discover which activities provide the highest sense of fulfillment.

Unlike traditional productivity applications, Greenhouse focuses on personal enrichment and decision support. Users maintain a backlog of interests and activities, answer guided questions about requirements and barriers, receive activity recommendations based on their current circumstances, and record fulfillment outcomes after participation.

The project has two primary goals:

1. Create a mobile application for personal daily use.
2. Create a web-based demonstration version suitable for portfolio presentation.

The selected technology stack must:

- Support rapid solo development.
- Leverage existing expertise.
- Enable mobile-first development.
- Minimize infrastructure complexity.
- Support local-first data storage.
- Allow future expansion into a web deployment.
- Require minimal operational cost.

## Decision

The application will be built using:

- React Native
- Expo
- TypeScript
- SQLite

### React Native

React Native will be used as the primary application framework.

The author has extensive professional experience building React-based applications, allowing reuse of existing knowledge regarding component architecture, state management, testing practices, and UI composition.

React Native enables development of both iOS and Android applications using a shared codebase while maintaining a native user experience.

### Expo

Expo will be used as the development platform and runtime.

Expo simplifies mobile development by providing:

- Local development tooling
- Device testing workflows
- Native API integrations
- Simplified build and deployment processes

Because Greenhouse is initially a personal project, Expo reduces setup complexity and allows focus on product development rather than mobile platform configuration.

### TypeScript

TypeScript will be used throughout the application.

Benefits include:

- Strong typing
- Improved refactoring support
- Better IDE tooling
- Reduced runtime errors
- Self-documenting interfaces and domain models

Since the application relies heavily on structured questionnaire data and recommendation logic, type safety is expected to improve maintainability as the domain model evolves.

### SQLite

SQLite will be used as the primary persistence layer.

Greenhouse is designed as a local-first application where all user data is stored directly on the device.

Benefits include:

- No backend infrastructure requirements
- Fast local queries
- Offline support
- Low operational cost
- Simple backup and migration strategy

The application's recommendation engine and analytics features can be executed locally without requiring cloud services.

## Consequences

### Positive

- Fast development using familiar technologies.
- Minimal infrastructure costs.
- Full offline functionality.
- Strong type safety.
- Shared codebase across platforms.
- Easy portfolio deployment through Expo web support.
- Reduced operational overhead.

### Negative

- SQLite may require migration planning if multi-device synchronization is added later.
- Expo introduces some constraints compared to fully native React Native development.
- Web deployment may require platform-specific UI adjustments.
- Future cloud synchronization features would require additional architectural work.

## Alternatives Considered

### Native iOS and Android Development

Rejected due to increased development effort and duplication of application logic.

### Flutter

Rejected because the author has significantly more experience with React and TypeScript, reducing the productivity benefits of Flutter.

### Backend-Driven Architecture

Rejected for the initial version because the application's primary use case is personal and local-first. Introducing a backend would increase infrastructure complexity without providing immediate user value.

## Notes

The architecture intentionally prioritizes simplicity and maintainability over scalability. Future ADRs may introduce synchronization, cloud backup, authentication, or machine-learning based recommendation features if the application evolves beyond a personal-use tool.
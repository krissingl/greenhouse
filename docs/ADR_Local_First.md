# ADR-002: Adopt a Local-First Architecture

## Status

Accepted

## Date

2026-06-12

## Context

Greenhouse is a personal hobby and interest management application designed to help users organize activities they wish to pursue, understand barriers preventing participation, and discover which activities provide the greatest sense of fulfillment.

The primary user of the application is the application author. The initial version is intended for personal use and portfolio demonstration rather than broad public adoption.

The application stores highly personal information, including:

- Activities and interests
- Personal motivations
- Perceived barriers
- Energy levels
- Fulfillment ratings
- Reflection notes

The application must provide a responsive user experience while minimizing operational complexity and infrastructure costs.

## Decision

Greenhouse will adopt a Local-First architecture.

All application data will be stored and processed on the user's device using SQLite as the primary persistence layer.

Core application functionality, including:

- Activity management
- Activity recommendation
- Barrier analysis
- Fulfillment tracking
- Data visualization

will operate entirely without a network connection.

The application will not require:

- User accounts
- Authentication
- Cloud databases
- Remote APIs
- Internet connectivity

Future synchronization capabilities may be introduced as optional enhancements but will not be foundational requirements for the system.

## Rationale

### Privacy

The application captures personal behavioral and emotional data.

Storing information locally reduces privacy concerns and eliminates the need to transmit sensitive data to external services.

### Simplicity

A local-first architecture significantly reduces implementation complexity.

The project avoids:

- Authentication flows
- Backend services
- API design
- Infrastructure management
- Database hosting
- Data synchronization challenges

This allows development effort to remain focused on user experience and recommendation features.

### Reliability

Application functionality should not depend on network availability.

Users can:

- Create activities
- Log sessions
- Record reflections
- Receive recommendations
- Review analytics

regardless of internet connectivity.

### Performance

Recommendation logic and analytics can execute directly against local SQLite data.

This avoids network latency and provides immediate feedback to the user.

### Cost

A local-first architecture eliminates recurring infrastructure expenses during the project's early stages.

No cloud hosting, database hosting, or authentication services are required.

## Consequences

### Positive

- Complete offline functionality.
- Faster user interactions.
- Reduced privacy concerns.
- No infrastructure costs.
- Simpler architecture.
- Easier development and maintenance.
- No account creation or onboarding requirements.
- Full user ownership of data.

### Negative

- Data is limited to a single device.
- Device loss may result in data loss if backups are not implemented.
- Multi-device synchronization is not available.
- Sharing data between devices requires manual export and import workflows.
- Future cloud synchronization will require additional architectural work.

## Alternatives Considered

### Cloud-First Architecture

Store all user data in a hosted database with authentication and synchronization.

Rejected because:

- Introduces significant implementation complexity.
- Requires ongoing infrastructure costs.
- Provides limited value for a single-user application.
- Creates privacy considerations for personal data.

### Hybrid Local and Cloud Storage

Store data locally while synchronizing to a remote backend.

Rejected for the initial version because:

- Synchronization introduces significant complexity.
- Conflict resolution strategies would be required.
- Additional infrastructure would be necessary.
- The benefits do not justify the increased implementation effort for an early-stage personal project.

## Future Considerations

The local-first architecture should not prevent future enhancements.

Potential future additions include:

- Cloud backup
- Multi-device synchronization
- Data export and import
- Shared activity recommendations
- Web application synchronization

Any future cloud functionality should remain optional and preserve the application's ability to function entirely offline.

## Notes

Local-first is considered a product philosophy rather than a technical implementation detail.

Greenhouse prioritizes personal ownership, privacy, reliability, and simplicity over cloud-connected functionality.

The system should continue to provide meaningful value even when completely disconnected from the internet.
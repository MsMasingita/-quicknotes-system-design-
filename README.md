# QuickNotes System Design & Client Prototype

QuickNotes is a full-stack system architecture designed to scale a note-taking application from a browser-only tool to a cloud service supporting 1,000,000 users. This repository contains both the architectural design specifications and an interactive API client prototype proving frontend-to-API communication.

## Running the API Client Prototype

1. Open `index.html` in any modern web browser, or launch it with a local development server (such as VS Code Live Server).
2. Click **Load notes** to fetch the initial 10 notes from the mock API.
3. Use the **Create a Note** form to submit a new note with required title validation (maximum 100 characters).
4. Click the **Delete** button on any note card to trigger a DELETE request and remove it from the page.

## System Design Documentation

The complete technical design documentation is located in the `docs/` folder:

- [API Design Specification](docs/api-design.md): RESTful endpoints, HTTP methods, status codes, and request/response JSON schemas.
- [Data Model Specification](docs/data-model.md): Relational schema design, entity relationships, CREATE TABLE statements, indexes, and SQL justification.
- [Architecture Specification](docs/architecture.md): Scalability estimates for 1,000,000 users, architecture diagram, component roles, request flows, and single point of failure (SPOF) solutions.

## What I Learned

1. **System Scalability Planning**: Calculating queries per second (QPS) and storage estimates revealed how read-to-write ratios dictate database indexing and replica strategies.
2. **Resilient UI State Management**: Explicitly managing loading, success, error, and empty states while disabling buttons during network calls provides a smooth and predictable user experience.
3. **Decoupled Backend Architecture**: Using asynchronous message queues and background workers prevents resource-heavy operations (like indexing and analytics) from blocking client API responses.

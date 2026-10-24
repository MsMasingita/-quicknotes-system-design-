# QuickNotes API Design Specification

## Overview

This document specifies the official RESTful HTTP API for the multi-tenant QuickNotes backend service. All request and response bodies use standard application/json serialization with UTF-8 encoding. All authenticated routes require a bearer token in the Authorization header.

## Endpoints

| HTTP Method | Path               | Description                                                                    | Success Status |
| :---------- | :----------------- | :----------------------------------------------------------------------------- | :------------- |
| GET         | /api/v1/notes      | Retrieves a paginated list of notes owned by the authenticated user.           | 200 OK         |
| POST        | /api/v1/notes      | Creates a new note with required title, optional body, and associated tag IDs. | 201 Created    |
| GET         | /api/v1/notes/{id} | Retrieves a single note by its unique identifier.                              | 200 OK         |
| PUT         | /api/v1/notes/{id} | Replaces or completely updates an existing note.                               | 200 OK         |
| DELETE      | /api/v1/notes/{id} | Permanently deletes a note record.                                             | 204 No Content |
| GET         | /api/v1/tags       | Retrieves all tags created or used by the authenticated user.                  | 200 OK         |

## Request and Response Examples

### 1. Create a Note (POST /api/v1/notes)

Example Request Body:

```json
{
  "title": "System Architecture Review",
  "body": "Finalize database indexing and cache invalidation policies before Friday.",
  "tagIds": [1, 4]
}
```

Example Response Body (201 Created):

```json
{
  "id": 402,
  "userId": 12,
  "title": "System Architecture Review",
  "body": "Finalize database indexing and cache invalidation policies before Friday.",
  "tags": [
    { "id": 1, "name": "Work" },
    { "id": 4, "name": "Architecture" }
  ],
  "createdAt": "2026-10-24T14:30:00Z",
  "updatedAt": "2026-10-24T14:30:00Z"
}
```

### 2. List Notes (GET /api/v1/notes)

Example Response Body (200 OK):

```json
{
  "data": [
    {
      "id": 402,
      "userId": 12,
      "title": "System Architecture Review",
      "body": "Finalize database indexing and cache invalidation policies before Friday.",
      "tags": [
        { "id": 1, "name": "Work" },
        { "id": 4, "name": "Architecture" }
      ],
      "createdAt": "2026-10-24T14:30:00Z",
      "updatedAt": "2026-10-24T14:30:00Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "totalCount": 1
  }
}
```

## Error Handling & Status Codes

- 400 Bad Request: Missing required title or title exceeds 100 characters.
- 401 Unauthorized: Missing or invalid authentication token.
- 403 Forbidden: User attempts to access or modify someone else's note.
- 404 Not Found: Note or endpoint does not exist.
- 500 Internal Server Error: Unhandled server or database failure.

Example Error Response Body (400 Bad Request):

```json
{
  "error": {
    "status": 400,
    "message": "Title is required and must not exceed 100 characters."
  }
}
```

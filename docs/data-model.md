# QuickNotes Data Model Specification

## 1. Overview and Design Decisions

The QuickNotes application uses a relational data model (PostgreSQL). A relational structure ensures strict schema enforcement, ACID guarantees for note updates, and referential integrity between users, notes, and tags through foreign key constraints.

A many-to-many relationship links notes and tags using an associative junction table (`note_tags`). Soft deletes via a `deleted_at` timestamp are supported on notes to prevent accidental data loss.

## 2. Entity-Relationship Diagram

```text
+------------------+          +------------------+          +------------------+
|      users       |          |      notes       |          |       tags       |
+------------------+          +------------------+          +------------------+
| id (PK)          |<---+     | id (PK)          |<---+     | id (PK)          |<---+
| email            |    |     | user_id (FK) ----+    |     | user_id (FK)     |    |
| password_hash    |    +-----| title            |    |     | name             |    |
| created_at       |          | body             |    |     | created_at       |    |
| updated_at       |          | created_at       |    |     +------------------+    |
+------------------+          | updated_at       |    |                             |
                              | deleted_at       |    |     +------------------+    |
                              +------------------+    |     |    note_tags     |    |
                                                      |     +------------------+    |
                                                      +-----| note_id (PK, FK) |    |
                                                            | tag_id (PK, FK)  +----+
                                                            +------------------+
```

### Entities Description

- **users**: Represents registered accounts authenticated via email and hashed credentials.
- **notes**: Core multi-tenant note entities owned by a user.
- **tags**: User-defined labels for categorizing notes.
- **note_tags**: Junction table establishing the many-to-many relationship between notes and tags.

## 3. Database Schema (PostgreSQL DDL)

```sql
-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Notes Table
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 3. Tags Table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_tag UNIQUE (user_id, name)
);

-- 4. Note Tags (Junction Table for Many-to-Many)
CREATE TABLE note_tags (
    note_id INT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);
```

## 4. Indexing and Performance Strategy

```sql
-- Fast lookups for active notes owned by a specific user (ordered by update date)
CREATE INDEX idx_notes_user_updated ON notes(user_id, updated_at DESC) WHERE deleted_at IS NULL;

-- Fast lookups for user tags
CREATE INDEX idx_tags_user_id ON tags(user_id);

-- Speed up junction queries when filtering notes by tag
CREATE INDEX idx_note_tags_tag_id ON note_tags(tag_id);
```

### Rationale

- `idx_notes_user_updated`: A composite, partial index ensures that listing a user's active notes avoids scanning soft-deleted records and eliminates separate sorting overhead.
- `idx_note_tags_tag_id`: Speeds up reverse lookups when finding all notes associated with a given tag.

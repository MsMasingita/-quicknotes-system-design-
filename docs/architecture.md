That was my mistake—having nested boxes inside the text was confusing.

The box below contains **only the exact text** you need to put into that file.

Copy everything inside this box, paste it into your `docs/architecture.md` file, and save it:

```
# QuickNotes System Architecture Specification

## 1. Requirements

### Functional Requirements
- Users can create, view, update, and soft-delete personal notes.
- Users can assign one or more tags to categorize notes.
- Notes must be searchable by keyword and filterable by tag.
- Multi-tenancy isolation: users can only access their own notes.

### Non-Functional Requirements
- High Availability: 99.9% uptime target across services.
- Low Latency: Read operations under 50ms; write operations under 150ms.
- Scalability: Capable of supporting 1,000,000 registered users.
- Data Durability: Zero data loss for committed notes.

---

## 2. Load Estimates (1,000,000 Users)

- Active Users: 200,000 daily active users (DAU).
- Read/Write Ratio: 10:1 (read-heavy workflow).
- Writes per Day: 400,000 writes/day.
- Writes per Second: ~5 writes per second (peak 20).
- Reads per Day: 4,000,000 reads/day.
- Reads per Second: ~46 reads per second (peak 200).
- Storage per Year: ~146 GB raw text (~205 GB with indexes and overhead).

---

## 3. System Architecture Diagram

[ Clients: Web / Mobile ]
           |
       [ DNS ]
           |
     +-----+-----+
     |           |
 [ CDN ]    [ Load Balancer ]
 (Static)        |
           +-----+-----+
           |           |
     [ App Server 1 ] [ App Server 2 ]
           |                 |
     +-----+-----------------+-----+
     |                             |
 [ Cache: Redis ]          [ Message Queue ]
                                   |
                           [ Async Worker ]
                                   |
                 +-----------------+
                 |
        [ Primary Database: PostgreSQL ]
                 |
        [ Read Replica Database ]

---

## 4. Component Explanations

- Client: The web interface used to create and read notes.
- DNS: Translates hostnames into IP addresses to direct web traffic.
- CDN: Caches static frontend assets close to users for fast loading.
- Load Balancer: Distributes incoming traffic across healthy app servers.
- App Servers: Stateless servers that run API logic and check authentication.
- Cache (Redis): Stores recent notes in memory to reduce database read load.
- Primary Database (PostgreSQL): Handles all new notes, updates, and relational data.
- Read Replica Database: Handles read requests to keep the primary database fast.
- Message Queue: Holds background tasks so API requests finish quickly.
- Async Worker: Processes queued background jobs such as search indexing.

---

## 5. Step-by-Step Request Flows

### Flow 1: GET /notes
1. Client sends a request to GET /notes with an authorization token.
2. Load Balancer forwards the request to an available App Server.
3. App Server checks Redis cache for the user's note list.
4. If found in cache, App Server returns the list immediately.
5. If not in cache, App Server reads from the Read Replica Database.
6. App Server updates the Redis cache and returns the notes with status 200 OK.

### Flow 2: POST /notes
1. Client sends a POST /notes request with the new note's title and body.
2. Load Balancer forwards the request to an App Server.
3. App Server validates the title length and user access.
4. App Server writes the note into the Primary PostgreSQL database.
5. App Server removes the stale cached list from Redis.
6. App Server queues a background task to index the new note.
7. App Server returns the created note with status 201 Created.

---

## 6. Trade-Offs and Single Points of Failure

- SQL vs. NoSQL Trade-off: PostgreSQL was chosen for strict data integrity and relations between users, notes, and tags, accepting that scaling requires read replicas rather than simple horizontal partitioning.
- Caching Trade-off: Redis gives very fast reads, but requires extra logic to keep cached data from becoming outdated when a note changes.
- Eliminating Failure Points: Multiple app servers prevent a total outage if one crashes; a database read replica allows fast failover if the primary database fails.

```

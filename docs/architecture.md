# QuickNotes Architecture (1 Million Users)

## 1. Requirements

**Functional**

- Users can sign up and log in.
- Users can create, read, update, delete and search their notes.
- Notes sync across all of a user's devices.

**Non-functional**

- Note lists load in under 300 ms for most requests.
- 99.9% availability (under ~9 hours of downtime per year).
- Notes are never lost (backups + replication).
- Users can only ever see their own notes (security).

## 2. Load estimate

- 1,000,000 users, 20% daily active = 200,000 DAU.
- Writes: 200,000 × 5 notes = 1,000,000/day ≈ 10/s (peak ≈ 50/s).
- Reads: 200,000 × 20 loads = 4,000,000/day ≈ 40/s (peak ≈ 200/s).
- Storage: 1,000,000 notes/day × 500 bytes = 500 MB/day ≈ 180 GB/year.
- Conclusion: read-heavy (4:1), so caching and read replicas help most.

## 3. Architecture diagram

    Client (browser / phone)
       │  1. DNS: api.quicknotes.com → load balancer IP
       ├──────────────> CDN  (index.html, style.css, script.js)
       │
       v  HTTPS + JSON
    Load balancer  (x2, active/standby)
       │
       ├──> App server 1 ──┐
       ├──> App server 2 ──┼──> Cache (Redis)
       └──> App server 3 ──┘
                 │
          writes │ reads            jobs
                 v                  v
    Primary DB ──replicates──> Read replica(s)     Queue ──> Worker
    (PostgreSQL)                                  (emails, exports)
       │
       └──> Nightly backups (object storage)

## 4. Components and the problem each solves

| Component                   | Problem it solves                                             |
| --------------------------- | ------------------------------------------------------------- |
| DNS                         | Turns quicknotes.com into the IP addresses of our services.   |
| CDN                         | Static files load fast worldwide and do not load our servers. |
| Load balancer (x2)          | Spreads traffic, skips failed servers; standby avoids SPOF.   |
| App servers (3+, stateless) | Add servers for more traffic; one can fail safely.            |
| Cache (Redis)               | Frequent reads (note lists) return in ~1 ms and spare the DB. |
| Primary database            | Single source of truth for all writes.                        |
| Read replica(s)             | Take read load off the primary; can be promoted if it fails.  |
| Queue + worker              | Slow jobs (emails, exports) run in the background.            |
| Backups                     | Recover data after mistakes, bugs or disasters.               |

## 5. Request flows

**GET /notes (load my notes)**

1. The client sends `GET /notes` with its token to the load balancer.
2. The load balancer forwards it to a healthy app server.
3. The app server checks the token and finds the user id (e.g. 1).
4. It looks in the cache for `notes:user:1`.
5. Cache hit: return the notes immediately (200 OK).
6. Cache miss: query a read replica, store the result in the cache for 5 minutes (TTL), then return it (200 OK).

**POST /notes (create a note)**

1. The client sends `POST /notes` with the JSON body and token.
2. The load balancer forwards it to a healthy app server.
3. The app server checks the token and validates the data (400 Bad Request if invalid).
4. It inserts the note into the **primary** database.
5. It deletes `notes:user:1` from the cache so the next read is fresh.
6. It returns 201 Created with the new note.

## 6. Trade-offs

1. **Freshness vs speed.** Reads come from the cache and replicas, which can be a moment behind the primary. For a notes app this is acceptable. To avoid confusion, the app shows the user's own new note immediately from the POST response.
2. **Simplicity vs scale.** We chose read replicas and a cache rather than sharding. Sharding is not needed at 180 GB/year and would add a lot of complexity; we will revisit it if data grows 20-50×.
3. **Cost vs reliability.** Running two load balancers, three app servers and a replica costs more than one server, but meets our 99.9% availability target.

## 7. Avoiding single points of failure

- Load balancers run as an active/standby pair.
- At least 3 stateless app servers; failed ones are removed by health checks.
- The primary database has a replica that can be promoted (failover).
- Nightly backups are stored separately from the database servers.
- The cache is an optimisation: if Redis fails, the app reads from the database (slower, but still working).

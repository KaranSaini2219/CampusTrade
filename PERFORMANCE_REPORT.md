# CampusTrade Performance Report

## Applied optimizations

- Removed two unused `countDocuments()` calls from every public listings request.
- Replaced the public feed's banned-user ID scan with a filtered, projected seller populate. Banned/deleted sellers are filtered before response serialization.
- Reduced saved listing, admin user, listing detail, inbox, message, and avatar queries to the fields their callers use.
- Reused the authenticated seller after listing create/update instead of reading and populating the same listing again.
- Converted mark-sold to one authorized `findOneAndUpdate()`.
- Made account/listing deletion cleanup use lean ID reads and concurrent independent deletes.
- Reworked chat start to use an exact ordered participant array and an atomic `findOneAndUpdate(..., { upsert: true })`. This prevents duplicate chats without a find/create race and runs seller validation concurrently.
- Chat notifications are fire-and-forget after the HTTP response; SMTP no longer delays chat startup.
- Initial message fetch is newest-first, index-backed, capped at 50 by default (100 maximum), then ordered chronologically for the existing UI. It accepts `before=<ISO timestamp>` and emits `X-Has-More` / `X-Next-Before` headers for backward-compatible infinite scroll.
- Message send paths no longer re-read a message merely to populate its sender. They compose the required sender projection and atomically update last message/unread counts.
- Socket delivery now targets only participant user rooms; unused chat-room joins were removed from the client. One active socket is kept per user, stale duplicates are disconnected, and polling/compression overhead is disabled.
- Added a bounded Mongo connection pool, API rate limiting, and cacheable static upload responses.
- Added a bounded in-memory, five-second public-listing cache (100 keys maximum). All listing, seller-ban, and account/listing deletion mutations invalidate it; private `mine` results are never cached.

## Indexes

| Collection | Index | Why |
| --- | --- | --- |
| `listings` | `{ isSold, category, createdAt: -1 }` | Public category feed, newest first. |
| `listings` | `{ isSold, createdAt: -1 }` | Default public feed. |
| `listings` | `{ isSold, category, price }` | Filtered price sorting. |
| `chats` | `{ participants, updatedAt: -1 }` | Participant inbox ordered by recent activity. |
| `chats` | `{ listingId }` | Listing deletion cleanup. |
| `messages` | `{ chatId, createdAt: -1, _id: -1 }` | Recent-message page and cursor pagination. |
| `messages` | `{ senderId }` | Defensive user-deletion cleanup. |
| `savedlistings` | `{ userId, createdAt: -1 }` | Saved-list page order. |
| `reports` | `{ reporterId, listingId, status }` | Duplicate open-report check. |
| `reports` | `{ status, createdAt: -1 }` | Admin status queues. |
| `blocklogs` | `{ userId, createdAt: -1 }` | User cleanup and audit history. |

The redundant standalone `chats.updatedAt` schema index and inefficient `messages.{chatId, seenBy}` schema index were removed. Run `npm run sync-indexes` from `server` once during deployment to create new indexes and remove obsolete ones. Review the command's output first on a staging database; index builds should be scheduled during low traffic for large collections.

## Expected impact

- Public listings: eliminates two collection counts and one banned-user scan per request; lower allocations and database work grow substantially as data grows.
- Chat start: typical database round trips reduce from 3–4 serial operations to one listing read plus two parallel indexed operations; email is off the critical path.
- Message open: bounded from all historical messages to 50 documents, so payload size and query time stay stable as chats grow.
- Message send: removes one populate/read-after-write and avoids lost unread-count increments under concurrent sends.
- Socket transport: eliminates polling traffic and avoids duplicate broadcast fan-out.

Actual latency gains depend on document size, MongoDB tier, network RTT, and index selectivity. Measure with MongoDB `explain('executionStats')`, APM, and a production-like load test before assigning a numeric SLA.

## Remaining bottlenecks and 10k+ user plan

- The current process-local rate limiter, socket map, and cache headers are per Node process. For multiple instances, use Redis for Socket.IO's adapter, distributed rate limiting, and short-lived shared feed/avatar caching.
- Profile images are stored as base64 in MongoDB. Move them to Cloudinary/object storage and store only URLs; this is the largest remaining payload risk.
- Regex title/description search still cannot use the text index while preserving substring-search behavior. At scale, move search to MongoDB Atlas Search or a dedicated search service.
- Add client infinite-scroll consumption of the existing message cursor headers before conversations regularly exceed 50 messages.
- Run MongoDB replicas, monitor slow-query logs/index usage, set alerts for pool saturation, and load-test WebSocket connection churn. Use sticky sessions or the Redis Socket.IO adapter when horizontally scaling.

# Architecture Document - Real-Time Collaborative Document Editor

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Next.js    │  │   TipTap     │  │   Socket.io Client   │  │
│  │   React UI   │  │   Editor     │  │   (WebSocket)        │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
└─────────┼─────────────────┼──────────────────────┼──────────────┘
          │                 │                      │
          │ HTTP/REST       │                      │ WebSocket
          │                 │                      │
┌─────────▼─────────────────▼──────────────────────▼──────────────┐
│                    NEXT.JS CUSTOM SERVER                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Node.js HTTP Server                         │   │
│  │  ┌────────────────┐         ┌──────────────────────┐    │   │
│  │  │  Next.js App   │         │  Socket.io Server    │    │   │
│  │  │  (SSR/API)     │         │  (WebSocket Handler) │    │   │
│  │  └────────────────┘         └──────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               │ PostgreSQL Protocol
                               │
                    ┌──────────▼──────────┐
                    │   SUPABASE          │
                    │  ┌──────────────┐   │
                    │  │  PostgreSQL  │   │
                    │  │   Database   │   │
                    │  └──────────────┘   │
                    └─────────────────────┘
```

## Sync Strategy

### Chosen Approach: **Operational Transformation (OT) - Simplified Last-Write-Wins with Optimistic Updates**

I chose a **simplified OT approach** with last-write-wins conflict resolution for this weekend build. Here's why:

#### Why This Strategy?

1. **Time Constraint**: Full CRDT implementation (like Yjs) would require deep integration and testing. For a 54-hour build, a simpler approach ensures completion.

2. **Good Enough for Most Cases**: For typical collaborative editing (2-5 users, not typing in exact same spot), this works well with minimal conflicts.

3. **Clear Trade-offs**: I know exactly what breaks (see Failure Modes section) and can explain it.

#### How It Works:

1. **User types** → Editor updates locally (optimistic update)
2. **Client emits** → `document-update` event via WebSocket with full document content
3. **Server broadcasts** → All other connected clients receive the update
4. **Clients apply** → Other users see the change, preserving their cursor position
5. **Debounced save** → After 2 seconds of inactivity, content saves to Supabase

#### What I Considered But Didn't Use:

- **Full CRDT (Yjs)**: Would handle conflicts perfectly but adds complexity. I started with Yjs dependencies but simplified to meet deadline.
- **Operational Transformation (Google Docs style)**: Requires tracking operations and transforming them. Too complex for weekend build.
- **Version vectors**: Adds overhead and still needs conflict resolution logic.

#### What Breaks:

- If two users type in the exact same position simultaneously, one edit may be lost
- The last update to reach the server wins
- No automatic merge of concurrent edits

#### What Would I Do With More Time:

- Implement full Yjs CRDT integration
- Add operation-based sync instead of full document sync
- Implement proper conflict resolution with merge strategies

## State Management

### Document State Lives in Three Places:

#### 1. **Client State (TipTap Editor)**
- **What**: The current document content in the editor
- **Why**: Provides instant feedback for typing (optimistic updates)
- **Lifecycle**: Exists while user has document open

#### 2. **Server Memory (Socket.io)**
- **What**: Active connections and user presence
- **Why**: Tracks who's online, routes messages between clients
- **Lifecycle**: Exists while server is running
- **Data Lost on Restart**: User presence, active connections

#### 3. **Database (Supabase PostgreSQL)**
- **What**: Persistent document content
- **Why**: Survives server restarts, browser closes
- **Lifecycle**: Permanent until explicitly deleted

### State Reconciliation Flow:

```
User Opens Document:
1. Client fetches from Supabase (source of truth)
2. Loads content into TipTap editor
3. Connects to WebSocket server
4. Joins document room

User Types:
1. Editor updates immediately (local state)
2. Emits update via WebSocket (server memory)
3. Server broadcasts to other clients
4. After 2s idle, saves to Supabase (persistent state)

User Reconnects:
1. Fetches latest from Supabase
2. Overwrites local state
3. Rejoins WebSocket room
```

### Why This Approach?

- **Fast**: Local updates feel instant
- **Reliable**: Database is source of truth
- **Scalable**: WebSocket handles real-time, DB handles persistence
- **Simple**: Clear separation of concerns

## Data Model

### Database Schema (PostgreSQL via Supabase)

```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,              -- Random generated ID (e.g., "a3f9k2m")
  title TEXT NOT NULL,              -- Document title (default: "Untitled Document")
  content JSONB NOT NULL,           -- TipTap JSON format
  created_at TIMESTAMP,             -- When document was created
  updated_at TIMESTAMP              -- Last modification time
);
```

#### Why This Schema?

1. **`id` as TEXT**: 
   - Random string IDs are shareable and URL-friendly
   - No sequential IDs = no enumeration attacks
   - Easy to generate client-side

2. **`content` as JSONB**:
   - TipTap uses JSON format for document structure
   - JSONB allows querying if needed (future: search within documents)
   - Stores rich text structure, not just plain text

3. **No user/auth tables**:
   - Time constraint: Auth is a bonus feature
   - Current: Anonymous editing with localStorage usernames
   - Future: Add `user_id` foreign key when auth is implemented

4. **No version history table**:
   - Would require `document_versions` table with snapshots
   - Bonus feature I didn't have time for
   - Future: Add versioning with event sourcing

#### Example Document Content (JSONB):

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Hello, this is collaborative editing!"
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "marks": [{"type": "bold"}],
          "text": "Bold text works too"
        }
      ]
    }
  ]
}
```

### In-Memory Data Structures (Server)

```typescript
// Active connections per document
connections: Map<documentId, Map<socketId, username>>

// Example:
{
  "a3f9k2m": {
    "socket_abc123": "User 1",
    "socket_def456": "User 2"
  }
}
```

## WebSocket Protocol

### Connection Flow:

```
Client                          Server
  │                               │
  ├──── connect ─────────────────>│
  │<──── connection event ────────┤
  │                               │
  ├──── join-document ───────────>│
  │     (documentId, username)    │
  │                               │
  │<──── user-joined ─────────────┤
  │     (userId, username, users) │
  │                               │
```

### Message Formats:

#### 1. **join-document** (Client → Server)
```typescript
{
  event: 'join-document',
  data: {
    documentId: string,  // e.g., "a3f9k2m"
    username: string     // e.g., "User 1"
  }
}
```

#### 2. **user-joined** (Server → All Clients in Room)
```typescript
{
  event: 'user-joined',
  data: {
    userId: string,      // Socket ID of new user
    username: string,    // Display name
    users: Array<{       // All current users
      id: string,
      username: string
    }>
  }
}
```

#### 3. **document-update** (Client → Server → Other Clients)
```typescript
{
  event: 'document-update',
  data: {
    documentId: string,
    content: object,     // Full TipTap JSON document
    userId: string       // Who made the change (added by server)
  }
}
```

#### 4. **typing-indicator** (Client → Server → Other Clients)
```typescript
{
  event: 'typing-indicator',
  data: {
    documentId: string,
    isTyping: boolean,
    username: string,
    userId: string       // Added by server
  }
}
```

#### 5. **user-left** (Server → All Clients in Room)
```typescript
{
  event: 'user-left',
  data: {
    userId: string,
    users: Array<{id, username}>  // Remaining users
  }
}
```

### Why This Protocol Design?

- **Room-based**: Socket.io rooms isolate documents (no cross-document leaks)
- **Full document sync**: Simple but bandwidth-heavy (trade-off for time)
- **Server adds userId**: Prevents spoofing, server is source of truth for identity
- **Broadcast pattern**: Server doesn't store document, just routes messages

## Failure Modes

### 1. User Disconnects Mid-Edit

**What Happens:**
- User's socket connection closes
- Server emits `user-left` event
- Other users see them disappear from active users list
- Their unsaved changes (< 2 seconds old) are LOST

**Why:**
- No offline queue or local persistence beyond editor state
- Debounced save means recent edits might not have reached DB

**Mitigation:**
- Reduce save debounce to 500ms (trade-off: more DB writes)
- Add beforeunload handler to force save on tab close
- Implement local storage backup

### 2. Server Restarts

**What Happens:**
- All WebSocket connections drop
- Active user presence is LOST
- In-memory connection map is cleared
- Documents in database are SAFE

**What Users Experience:**
- "Connection lost" (if we added that UI)
- Must refresh page to reconnect
- Document content persists (loaded from DB)

**Mitigation:**
- Client auto-reconnect logic (Socket.io has this built-in)
- Show connection status indicator
- Graceful degradation: allow offline editing, sync on reconnect

### 3. Two Users Type in Same Spot Simultaneously

**What Happens:**
- Both users see their own changes immediately (optimistic)
- Both emit `document-update` events
- Last update to reach server wins
- One user's edit is overwritten
- No merge, no conflict resolution

**Example:**
```
Initial: "Hello |world"
User A types: "Hello beautiful |world"
User B types: "Hello amazing |world"
Result: Whichever update arrives last wins
```

**Why This Breaks:**
- No operational transformation
- No CRDT conflict-free merging
- Full document replacement, not delta-based

**Mitigation:**
- Implement Yjs CRDT
- Use OT library like ShareDB
- Add conflict detection and user notification

### 4. Network Partition (User Thinks They're Connected)

**What Happens:**
- User keeps typing (optimistic updates work)
- WebSocket is disconnected but client doesn't know
- Changes don't broadcast to others
- Debounced save might fail silently

**Mitigation:**
- Add connection status indicator
- Implement heartbeat/ping-pong
- Show "Offline" mode with queue

### 5. Database Connection Fails

**What Happens:**
- Real-time editing still works (WebSocket independent)
- Saves fail silently (no error handling in current code)
- Data loss if server restarts before DB reconnects

**Mitigation:**
- Add error handling to Supabase calls
- Implement retry logic with exponential backoff
- Show save errors to user

### 6. 50,000 Character Paste

**What Happens:**
- Editor handles it fine (TipTap is robust)
- WebSocket message is HUGE (50KB+ JSON)
- Broadcasts to all users (bandwidth spike)
- Might hit WebSocket message size limits

**Mitigation:**
- Implement delta-based sync (only send changes)
- Add rate limiting on server
- Compress large messages
- Set max document size

## Trade-offs

### What I Skipped Due to Time:

1. **Full CRDT Implementation**
   - Would have used Yjs for proper conflict resolution
   - Ran out of time integrating it properly
   - Chose working simple solution over broken complex one

2. **Authentication**
   - No Google OAuth or magic links
   - Using localStorage for anonymous usernames
   - Would add: Supabase Auth, user_id in documents table

3. **Rich Text Formatting**
   - TipTap supports bold/italic/headings
   - Didn't add toolbar UI
   - Would add: Formatting buttons, keyboard shortcuts

4. **Version History**
   - No undo timeline or snapshots
   - Would add: Event sourcing, snapshot every N edits

5. **Proper Error Handling**
   - Many silent failures (DB errors, WebSocket errors)
   - Would add: Toast notifications, retry logic, error boundaries

6. **Rate Limiting**
   - No protection against spam or abuse
   - Would add: Per-user rate limits, document size limits

7. **Cursor Positions**
   - Show "User 2 is typing" but not exact cursor location
   - Would add: Colored cursors at exact positions (complex with TipTap)

8. **Offline Mode**
   - No local persistence or sync queue
   - Would add: IndexedDB cache, conflict resolution on reconnect

9. **Mobile Optimization**
   - Basic responsive CSS but not tested thoroughly
   - Would add: Touch gestures, mobile keyboard handling

10. **Tests**
    - No automated tests
    - Would add: Playwright for multi-user scenarios, unit tests

### What Would I Do Differently With 2 More Weeks:

#### Week 1: Robustness
- Implement Yjs CRDT properly
- Add comprehensive error handling
- Build offline mode with sync queue
- Add authentication (Supabase Auth)
- Implement rate limiting and abuse prevention
- Add end-to-end tests (Playwright)

#### Week 2: Features
- Rich text toolbar (bold, italic, headings, lists)
- Version history with snapshots
- Document permissions (view/edit/owner)
- Export to Markdown/PDF
- Real-time cursor positions
- Comments and suggestions
- Document search
- Mobile app (React Native)

### Architectural Decisions I'd Reconsider:

1. **Full Document Sync**
   - Current: Send entire document on every change
   - Better: Delta-based sync (only changes)
   - Why: Bandwidth and performance at scale

2. **Debounced Database Saves**
   - Current: Save after 2 seconds idle
   - Better: Event sourcing with operation log
   - Why: No data loss, enables version history

3. **In-Memory Connection Tracking**
   - Current: Lost on server restart
   - Better: Redis for distributed state
   - Why: Horizontal scaling, persistence

4. **Single Server**
   - Current: One Node.js process
   - Better: Multiple servers with Redis pub/sub
   - Why: High availability, load balancing

## AI Usage Log

### AI-Generated Code (with modifications):

1. **TipTap Editor Setup** (~60% AI)
   - Used AI to generate initial TipTap configuration
   - Modified: Added custom styling, cursor position preservation
   - Why: TipTap docs are good but AI sped up boilerplate

2. **Socket.io Server** (~70% AI)
   - AI generated basic WebSocket server structure
   - Modified: Added room management, user tracking, typing indicators
   - Why: Socket.io patterns are well-known, AI got it mostly right

3. **Supabase Integration** (~50% AI)
   - AI provided Supabase client setup
   - Modified: Added error handling, debounced saves, schema design
   - Why: Supabase docs are clear, but AI helped with TypeScript types

4. **UI Components** (~80% AI)
   - AI generated Tailwind CSS styling
   - Modified: Color scheme, layout adjustments, responsive tweaks
   - Why: Tailwind is verbose, AI speeds up styling significantly

### Code I Wrote Myself:

1. **Architecture Document** (100% me)
   - All explanations, trade-offs, and diagrams
   - AI helped with formatting but content is mine

2. **State Management Logic** (100% me)
   - How state flows between client/server/database
   - Debouncing strategy, reconciliation logic
   - Why: This is the core architecture, needed to understand deeply

3. **Conflict Resolution Strategy** (100% me)
   - Decision to use last-write-wins
   - Understanding of what breaks and why
   - Why: Critical to explain in review call

4. **Database Schema** (100% me)
   - Table design, JSONB choice, indexing
   - Why: Data modeling is fundamental, can't delegate

5. **WebSocket Protocol Design** (100% me)
   - Message formats, event flow, room structure
   - Why: Protocol design requires understanding of system behavior

### What I Learned:

- AI is great for boilerplate and well-known patterns
- AI struggles with architectural decisions and trade-offs
- I had to understand every line to modify and debug
- Writing this document forced me to understand what AI generated

### Honesty Check:

- I used AI heavily for code generation (~60% of code)
- I wrote all architectural decisions and explanations (100%)
- I debugged and modified all AI code to make it work
- I can explain every line in a review call

## Technology Choices

### Frontend:
- **Next.js 14**: App router, server components, easy deployment
- **React 19**: Latest features, concurrent rendering
- **TipTap**: Headless editor, extensible, good docs
- **Tailwind CSS**: Fast styling, responsive utilities
- **Socket.io Client**: Reliable WebSocket with fallbacks

### Backend:
- **Node.js**: JavaScript everywhere, fast for I/O
- **Next.js Custom Server**: Combines SSR + WebSocket in one process
- **Socket.io**: Rooms, broadcasting, auto-reconnect built-in
- **Supabase**: PostgreSQL + REST API + real-time (though I used WebSocket instead)

### Database:
- **PostgreSQL (via Supabase)**: 
  - JSONB for flexible document storage
  - ACID transactions
  - Free tier with generous limits
  - Built-in auth (not used yet)

### Deployment:
- **Vercel**: Next.js optimized, free tier, easy setup
- **Supabase**: Free PostgreSQL hosting
- **Note**: WebSocket requires persistent connection, may need Railway/Render for production

## Setup Instructions

See README.md for detailed setup steps.

## Conclusion

This is a working real-time collaborative editor built in a weekend. It handles the core requirements but has known limitations. I chose simplicity over perfection to meet the deadline, and I can explain every decision and trade-off.

The system works well for small teams (2-5 users) editing different parts of a document. It breaks down with heavy concurrent editing in the same location. With more time, I'd implement proper CRDTs and add the bonus features.

I'm proud of what I built and ready to defend it in the review call.

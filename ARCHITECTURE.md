# Architecture Document

## System Overview

This is a real-time collaborative document editor where multiple users can edit the same document simultaneously. The system uses a centralized server architecture where the backend maintains the authoritative state and broadcasts updates to all connected clients via WebSocket connections.

```
┌─────────────┐         ┌─────────────────────────────┐         ┌──────────┐
│   Client A  │◄───────►│   Backend Server            │◄───────►│ SQLite   │
│  (Browser)  │         │  - HTTP API (REST)          │         │ Database │
└─────────────┘         │  - WebSocket (Socket.io)    │         └──────────┘
                        │  - Document State Manager   │
┌─────────────┐         │                             │
│   Client B  │◄───────►│                             │
│  (Browser)  │         └─────────────────────────────┘
└─────────────┘
        ▲
        │
┌─────────────┐
│   Client C  │
│  (Browser)  │
└─────────────┘
```

**Data Flow:**
1. User types in the editor (Client A)
2. Client sends update via WebSocket to server
3. Server broadcasts update to all other clients in the same document room
4. Clients B and C receive update and apply changes to their editors
5. Server auto-saves to database every 2 seconds

## Synchronization Strategy

The system uses a **server-authoritative last-write-wins** approach for synchronization. When a user makes an edit, the change is immediately sent to the server via WebSocket. The server then broadcasts this change to all other connected clients in the same document room.

**Why This Approach:**
- Simple to implement and reason about
- Server maintains single source of truth
- No complex conflict resolution algorithms needed
- Predictable behavior that's easy to debug
- Sufficient for documents with <10 concurrent editors

**How It Works:**
1. User types → Editor captures change
2. Change sent to server via `document-update` event
3. Server broadcasts to all clients except sender
4. Receiving clients apply update to their editor
5. Client uses `isRemoteUpdate` flag to prevent echo loops

**Limitations:**
- Concurrent edits at the exact same position may overwrite each other
- No operational transformation or CRDT for fine-grained merging
- Works best when users edit different sections
- Not optimized for 100+ simultaneous editors

This trade-off was intentional—the system prioritizes simplicity and understandability over handling edge cases that rarely occur in typical usage.

## State Management

**Client-Side State:**
- Editor content (TipTap document model)
- Connected users list
- Typing indicators
- UI state (modals, loading states)
- localStorage cache for offline access

**Server-Side State:**
- Active WebSocket connections per document
- User metadata (name, email) per connection
- Document rooms (mapping of document ID to connected users)

**Database State:**
- Documents table: Stores current document content
- Users table: Authentication and user profiles
- Document versions table: Version history snapshots

**Update Propagation:**
1. User edits trigger `editor.on('update')` event
2. Content extracted as JSON via `editor.getJSON()`
3. Sent to server: `socket.emit('document-update', { documentId, content })`
4. Server broadcasts: `socket.to(documentId).emit('document-update', { content, userId })`
5. Clients receive and apply: `editor.commands.setContent(content)`

The `isRemoteUpdate` ref prevents infinite loops by skipping broadcast when applying remote changes.

## Data Model

**Documents Table:**
```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,           -- Random unique ID
  title TEXT DEFAULT 'Untitled',
  content TEXT NOT NULL,         -- JSON stringified TipTap document
  created_at DATETIME,
  updated_at DATETIME
);
```

**Users Table:**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,   -- bcrypt hashed
  full_name TEXT NOT NULL,
  created_at DATETIME
);
```

**Document Versions Table:**
```sql
CREATE TABLE document_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id TEXT NOT NULL,
  content TEXT NOT NULL,         -- Snapshot of document at save time
  user_id TEXT,                  -- Who saved this version
  created_at DATETIME,
  FOREIGN KEY (document_id) REFERENCES documents(id)
);
```

**Why This Schema:**
- Simple and easy to query
- JSON content storage allows flexible document structure
- Version history enables undo/restore functionality
- Minimal joins needed for common operations

## WebSocket Communication

**Connection Flow:**
```
Client                          Server
  |                               |
  |--- socket.connect() --------->|
  |<-- 'connect' event ----------|
  |                               |
  |--- 'join-document' ---------->|
  |    { docId, userData }        |
  |                               |
  |<-- 'user-joined' ------------|
  |    { userId, users[] }        |
```

**Event Types:**

1. **join-document**
   - Sent when user opens a document
   - Payload: `{ documentId, fullName, email, userId, firstName }`
   - Server adds user to room and broadcasts to others

2. **document-update**
   - Sent on every editor change
   - Payload: `{ documentId, content }`
   - Server broadcasts to all clients in room except sender

3. **typing-indicator**
   - Sent when user is typing
   - Payload: `{ documentId, isTyping, firstName }`
   - Debounced to 1 second
   - Server broadcasts to show "User is typing..."

4. **user-joined / user-left**
   - Server-initiated events
   - Payload: `{ userId, fullName, email, users[] }`
   - Updates active users list

**Example Message:**
```javascript
// Client sends
socket.emit('document-update', {
  documentId: 'abc123',
  content: {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }
    ]
  }
});

// Server broadcasts
socket.to('abc123').emit('document-update', {
  content: { /* same content */ },
  userId: 'socket-id-xyz'
});
```

## Failure Handling

**User Disconnects During Editing:**
- WebSocket connection closes
- Server removes user from active users list
- Other clients receive `user-left` event
- User's last changes are already saved (auto-save every 2 seconds)
- On reconnect, user loads latest document from database

**Server Restarts:**
- All WebSocket connections drop
- Clients automatically attempt to reconnect (Socket.io default behavior)
- On reconnect, clients rejoin document room
- Latest document content loaded from database
- No data loss due to auto-save

**Temporary Network Issues:**
- Socket.io handles reconnection automatically
- Offline mode queues updates in localStorage
- When connection restored, queued updates sync to server
- User sees offline indicator during disconnection

**Concurrent Edits at Same Position:**
- Last update received by server wins
- Earlier edit may be overwritten
- Acceptable trade-off for simplicity
- Users typically edit different sections

## Trade-offs

**What Was Simplified:**

1. **Conflict Resolution**: Used last-write-wins instead of operational transformation or CRDTs. This is simpler to implement and understand, but means concurrent edits at the exact same position may overwrite each other.

2. **Cursor Positions**: Show typing indicators instead of exact cursor positions. Tracking precise cursor locations for all users adds significant complexity for minimal benefit.

3. **Offline Editing**: Basic queue-and-sync approach rather than full offline-first architecture. Works for temporary disconnections but not extended offline sessions.

4. **Scalability**: Single server instance with in-memory connection tracking. Would need Redis or similar for multi-server deployment.

**What Could Be Improved:**

1. **Operational Transformation**: Implement OT or CRDT for better concurrent edit handling. Would require significant additional complexity.

2. **Database**: Migrate from SQLite to PostgreSQL for production. SQLite is fine for demo but not ideal for concurrent writes.

3. **Presence**: Add real-time cursor positions and selections. Requires tracking cursor state and rendering remote cursors.

4. **Performance**: Implement delta updates instead of sending full document on every change. Would reduce bandwidth for large documents.

5. **Testing**: Add more edge case tests for network failures and race conditions.

## AI Usage Log

**AI-Assisted Development:**
- Initial project scaffolding and boilerplate setup
- TipTap editor integration and configuration
- Socket.io WebSocket setup and event handling
- Database schema design and SQL queries
- Authentication flow with JWT and bcrypt
- Export utilities (Markdown/PDF conversion)
- Offline sync queue implementation
- Rate limiting logic
- Playwright test suite structure

**Manual Implementation and Decisions:**
- Synchronization strategy (chose last-write-wins over CRDT)
- State management approach (client vs server state split)
- WebSocket event design and message formats
- Version history save/restore logic
- Auto-save vs manual save distinction
- Database schema relationships
- Error handling and edge cases
- UI/UX decisions for editor toolbar and modals

**Understanding and Ownership:**
All code was reviewed, tested, and modified to fit the specific requirements of this project. I can explain any part of the system, including why certain approaches were chosen over alternatives. The architecture decisions were made with clear trade-offs in mind, prioritizing simplicity and maintainability over handling rare edge cases.

The AI tools helped accelerate development, but all architectural decisions, trade-off analysis, and system design were done with full understanding of the implications. I'm prepared to defend these choices and discuss alternative approaches in a technical interview.

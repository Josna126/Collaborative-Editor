# Real-Time Collaborative Document Editor

## Project Overview

This is a real-time collaborative document editor built for the **HelloAria / Reality Rift Weekend Intern Challenge**. The application allows multiple users to edit the same document simultaneously, with changes appearing instantly across all connected clients. Users can see who else is editing, create shareable document links, and save version snapshots. The system uses WebSockets for real-time communication and persists all changes to a database. This project demonstrates practical understanding of real-time synchronization, state management, and full-stack development.

## Core Features

### Real-Time Collaborative Editing
- Multiple users can edit the same document simultaneously
- Changes propagate to all connected clients in under 1 second
- Uses WebSocket connections for bidirectional communication
- Server broadcasts updates to all users in the same document room

### User Presence and Awareness
- Shows list of active users with colored avatars
- Displays typing indicators ("User is typing...")
- Real-time join/leave notifications
- Hover tooltips show user details (name and email)

### Persistent Document Storage
- Documents auto-save to SQLite database every 2 seconds
- Manual "Save Version" button creates version history snapshots
- Version history allows restoring previous document states
- Documents persist across browser sessions and server restarts

### Conflict Handling
- Last-write-wins strategy for concurrent edits
- Server-authoritative updates prevent data corruption
- Optimistic UI updates with server reconciliation
- Client-side flag prevents infinite update loops

### Shareable Document URLs
- Each document has a unique URL (`/doc/[id]`)
- Copy button for easy link sharing
- Anyone with the link can join and collaborate
- Authentication required to access documents

## Technology Stack

**Frontend**
- Next.js 16 (React 19) with App Router
- TipTap rich text editor
- Tailwind CSS for styling
- Socket.io Client for WebSocket connections

**Backend**
- Node.js with custom Next.js server
- Socket.io for WebSocket handling
- Next.js API routes for REST endpoints

**Real-Time Communication**
- Socket.io (WebSocket with fallback to polling)
- Room-based broadcasting for document isolation
- Event-driven architecture

**Database**
- SQLite (better-sqlite3)
- Stores users, documents, and version history
- Simple schema with JSON content storage

**Deployment**
- Ready for Railway, Render, or similar platforms
- Environment variables for configuration
- Production build with `npm run build`

## Local Setup

```bash
# Clone the repository
git clone <repository-url>
cd collab-editor

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

The application will create a local SQLite database (`collab-editor.db`) automatically on first run.

## Deployment

This application is designed to be deployed on platforms like Railway or Render that support WebSocket connections. The free tier of these services is sufficient for demonstration purposes.

**Deployment Requirements:**
- Node.js 20+
- Persistent storage for SQLite database
- WebSocket support (not compatible with Vercel serverless)

**Environment Variables:**
- `JWT_SECRET` - Secret key for authentication tokens (set in production)

## Reviewer Notes

This system was intentionally kept simple and understandable. The focus was on building a working real-time collaborative editor with clear, maintainable code rather than implementing complex distributed algorithms. The last-write-wins conflict resolution strategy is straightforward to explain and reason about, even though more sophisticated approaches exist. All architectural decisions prioritize clarity and reliability over complexity. The codebase is structured to be easily understood in a code review or interview setting.

## Bonus Features Implemented

- **Rich Text Editing**: Bold, italic, headings, lists, blockquotes, code blocks
- **Authentication**: Email/password signup and login with JWT tokens
- **Version History**: Manual save creates snapshots, restore previous versions
- **Export**: Download as Markdown or PDF
- **Rate Limiting**: Prevents abuse on authentication endpoints
- **Offline Mode**: Queues updates when offline, syncs on reconnect
- **Mobile Responsive**: Works on all screen sizes
- **End-to-End Tests**: Playwright test suite for critical flows
- **Docker Support**: Dockerfile and docker-compose.yml included

## Project Structure

```
collab-editor/
├── app/                    # Next.js app directory
│   ├── api/               # REST API routes
│   ├── auth/              # Authentication pages
│   ├── doc/[id]/          # Document editor page
│   └── page.tsx           # Home page
├── components/            # React components
│   └── Editor.tsx         # Main editor component
├── lib/                   # Utility libraries
│   ├── db.ts             # Database functions
│   ├── export-utils.ts   # Export functionality
│   ├── offline-sync.ts   # Offline queue
│   └── rate-limiter.ts   # Rate limiting
├── server.js             # Custom server with Socket.io
└── collab-editor.db      # SQLite database (created on first run)
```

## License

Built for the HelloAria / Reality Rift Weekend Intern Challenge.

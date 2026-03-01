# Quick Start Guide

Get the collaborative editor running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier)

## Setup Steps

### 1. Install Dependencies (1 minute)

```bash
npm install
```

### 2. Configure Supabase (2 minutes)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project (or use existing)
3. Go to **SQL Editor** and run this:

```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content JSONB NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on documents" ON documents
  FOR ALL USING (true) WITH CHECK (true);
```

4. Go to **Settings > API**
5. Copy your **Project URL** and **Anon Key**

### 3. Set Environment Variables (1 minute)

The `.env.local` file is already created with default values. Update it with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_WS_URL=http://localhost:3000
WS_PORT=3001
```

### 4. Start Development Server (1 minute)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Test Collaboration

1. Click **"Create New Document"**
2. Copy the URL from address bar
3. Open the same URL in another browser window (or incognito mode)
4. Start typing in either window
5. Watch changes appear in both! 🎉

## Common Issues

### Port Already in Use

```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
# Edit server.js and change port to 3001
```

### WebSocket Connection Failed

- Check if dev server is running
- Verify `NEXT_PUBLIC_WS_URL` in `.env.local`
- Check browser console for errors

### Database Errors

- Verify Supabase credentials in `.env.local`
- Ensure SQL schema was applied
- Check Supabase dashboard for errors

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) to understand how it works
- Use [TEST_CHECKLIST.md](./TEST_CHECKLIST.md) to verify all features
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment

## Quick Commands

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build            # Build for production
npm start                # Start production server

# Utilities
npm run lint             # Run linter
npm run type-check       # Check TypeScript types
```

## Features to Try

- ✅ Create multiple documents
- ✅ Share document links
- ✅ Edit with multiple users
- ✅ Watch typing indicators
- ✅ See user presence (avatars)
- ✅ Test auto-save (wait 2 seconds)
- ✅ Close and reopen (persistence)

## Need Help?

- Check [README.md](./README.md) for detailed setup
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for how it works
- Review [TEST_CHECKLIST.md](./TEST_CHECKLIST.md) for testing
- Open an issue on GitHub

---

**Time to First Run**: ~5 minutes
**Difficulty**: Easy
**Status**: Ready to use! 🚀

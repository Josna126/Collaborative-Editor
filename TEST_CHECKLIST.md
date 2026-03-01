# Testing Checklist

Use this checklist to verify all features are working correctly.

## Pre-Testing Setup

- [ ] Supabase database schema applied
- [ ] `.env.local` file configured with correct credentials
- [ ] Dependencies installed (`npm install`)
- [ ] Development server running (`npm run dev`)

## Core Requirements Testing

### R1: Real-Time Collaborative Editing

- [ ] Open app in Browser 1
- [ ] Create new document
- [ ] Copy document URL
- [ ] Open same URL in Browser 2 (or incognito)
- [ ] Type in Browser 1 → Changes appear in Browser 2 within 1 second
- [ ] Type in Browser 2 → Changes appear in Browser 1 within 1 second
- [ ] Type simultaneously in both → Both changes appear (may conflict)

**Expected**: Changes sync in real-time, no page refresh needed

### R2: Cursor/Presence Awareness

- [ ] Open document in 2+ browsers
- [ ] Check top-right corner for user avatars
- [ ] Each browser shows different colored avatar
- [ ] Count matches number of open browsers
- [ ] Close one browser
- [ ] Avatar disappears from other browsers

**Expected**: See who's online with colored avatars

### R3: Persistent Storage

- [ ] Create new document
- [ ] Type some content (e.g., "Hello World")
- [ ] Wait 3 seconds (for auto-save)
- [ ] Check for "Saved" indicator
- [ ] Close all browser windows
- [ ] Reopen the same document URL
- [ ] Content is still there

**Expected**: Document persists after closing browsers

### R4: Conflict Handling

- [ ] Open document in 2 browsers
- [ ] Position cursor at same spot in both
- [ ] Type different text simultaneously
- [ ] Observe result

**Expected**: App doesn't crash, one edit wins (last-write-wins)

### R5: Shareable Document Links

- [ ] Create new document
- [ ] Copy URL from address bar
- [ ] Share URL with another person (or open in different device)
- [ ] Other person can access and edit

**Expected**: Unique URL per document, shareable

## Bonus Features Testing

### Typing Indicators (+5 points)

- [ ] Open document in 2 browsers
- [ ] Type in Browser 1
- [ ] Browser 2 shows "User X is typing..." at bottom-left
- [ ] Stop typing in Browser 1
- [ ] Indicator disappears after ~1 second

**Expected**: Real-time typing indicators

### Mobile Responsive UI (+5 points)

- [ ] Open app on mobile device (or use browser dev tools)
- [ ] Resize to mobile width (375px)
- [ ] UI adapts to smaller screen
- [ ] Editor is usable
- [ ] Avatars still visible

**Expected**: Works on mobile screens

### Auto-Save

- [ ] Type in editor
- [ ] Watch save indicator
- [ ] Shows "Saving..." while typing
- [ ] Shows "Saved [time]" after 2 seconds idle
- [ ] Refresh page
- [ ] Content is preserved

**Expected**: Auto-saves every 2 seconds after typing stops

## Edge Cases & Failure Modes

### User Disconnects Mid-Edit

- [ ] Open document
- [ ] Start typing
- [ ] Immediately close browser (before 2 second save)
- [ ] Reopen document
- [ ] Recent changes (< 2 seconds) are lost

**Expected**: Unsaved changes lost (known limitation)

### Server Restart Simulation

- [ ] Open document in 2 browsers
- [ ] Stop the dev server (Ctrl+C)
- [ ] Try typing in browsers
- [ ] Changes don't sync
- [ ] Restart server (`npm run dev`)
- [ ] Refresh browsers
- [ ] Reconnect and sync works again

**Expected**: Connection lost, manual refresh needed

### Large Content Paste

- [ ] Copy large text (1000+ words)
- [ ] Paste into editor
- [ ] Wait for sync
- [ ] Check other browser

**Expected**: Handles large content (may be slow)

### Rapid Typing

- [ ] Type very fast in one browser
- [ ] Watch other browser
- [ ] Changes should still appear

**Expected**: Handles rapid updates

### Multiple Documents

- [ ] Create Document A
- [ ] Create Document B
- [ ] Open both in different tabs
- [ ] Edit Document A → Only Document A updates
- [ ] Edit Document B → Only Document B updates

**Expected**: Documents are isolated

## Performance Testing

### Latency

- [ ] Type in one browser
- [ ] Measure time until appears in other browser
- [ ] Should be < 1 second

**Expected**: Sub-second latency

### Multiple Users

- [ ] Open document in 3+ browsers
- [ ] All type simultaneously
- [ ] All see each other's changes
- [ ] Check CPU/memory usage

**Expected**: Handles 3-5 users smoothly

## Browser Compatibility

Test in multiple browsers:

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

**Expected**: Works in all modern browsers

## Database Verification

### Check Supabase Dashboard

- [ ] Go to Supabase dashboard
- [ ] Open Table Editor
- [ ] Select `documents` table
- [ ] See created documents
- [ ] Verify content is JSON format
- [ ] Check timestamps update

**Expected**: Data persists in database

## Known Issues to Verify

- [ ] Concurrent edits in same spot → Last write wins (one may be lost)
- [ ] No offline mode → Changes while disconnected are lost
- [ ] No undo/redo → Can't revert to previous versions
- [ ] No authentication → Anyone with link can edit

**Expected**: These are known limitations, not bugs

## Review Call Preparation

Be ready to explain:

- [ ] How real-time sync works (WebSocket flow)
- [ ] Why you chose last-write-wins strategy
- [ ] Where document state lives (client/server/database)
- [ ] What happens when server restarts
- [ ] What happens with concurrent edits
- [ ] Which parts AI generated vs. you wrote
- [ ] What you'd do differently with more time

## Deployment Testing (After Deploy)

- [ ] Deployed URL is accessible
- [ ] Create document on production
- [ ] Test real-time sync on production
- [ ] Test persistence on production
- [ ] Keep deployment live for 30+ hours

---

## Test Results

**Date Tested**: _______________
**Tester**: _______________
**Environment**: Local / Production
**Browser**: _______________

**Core Requirements**: ☐ All Pass ☐ Some Fail
**Bonus Features**: ☐ All Pass ☐ Some Fail
**Edge Cases**: ☐ Handled ☐ Issues Found

**Notes**:
_______________________________________
_______________________________________
_______________________________________

**Ready for Review**: ☐ Yes ☐ No

---

**Testing Status**: Use this checklist before submission
**Estimated Time**: 30-45 minutes for full testing
**Difficulty**: Easy to Moderate

# Deployment Instructions

This guide will help you deploy your collaborative document editor to Railway (recommended for WebSocket support).

## Prerequisites

- GitHub account
- Railway account (sign up at https://railway.app)
- Git installed on your computer

## Step 1: Prepare Your Code

### 1.1 Create .gitignore (if not exists)

Make sure you have a `.gitignore` file with:

```
node_modules/
.next/
.env.local
*.db
*.log
.DS_Store
```

### 1.2 Update next.config.ts for Production

Your `next.config.ts` should have:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

## Step 2: Push to GitHub

### 2.1 Initialize Git Repository (if not done)

```bash
cd collab-editor
git init
git add .
git commit -m "Initial commit: Real-time collaborative editor"
```

### 2.2 Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., "collab-editor")
3. Don't initialize with README (you already have one)

### 2.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/collab-editor.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Railway

### 3.1 Sign Up / Log In to Railway

1. Go to https://railway.app
2. Sign up with GitHub (recommended)
3. Authorize Railway to access your repositories

### 3.2 Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `collab-editor` repository
4. Railway will automatically detect it's a Node.js project

### 3.3 Configure Environment Variables

1. In your Railway project, go to "Variables" tab
2. Add the following variable:

```
JWT_SECRET=your-super-secret-key-change-this-to-something-random
```

Generate a secure secret:
```bash
# On Mac/Linux
openssl rand -base64 32

# Or use any random string (at least 32 characters)
```

### 3.4 Configure Build Settings

Railway should auto-detect these, but verify:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Node Version**: 20.x (should be automatic)

### 3.5 Add Port Configuration

Railway automatically assigns a PORT. Your server.js should use:

```javascript
const port = process.env.PORT || 3000;
```

Let me check if this is already configured:

## Step 4: Wait for Deployment

1. Railway will start building your app
2. Watch the deployment logs in real-time
3. Build takes 2-5 minutes typically
4. Once complete, you'll see "Deployment successful"

### 4.6 Get Your Public URL

1. In Railway project, click "Settings"
2. Scroll to "Domains"
3. Click "Generate Domain"
4. You'll get a URL like: `https://your-app.up.railway.app`

## Step 5: Update WebSocket URL

### 5.1 Update Editor Component

In `components/Editor.tsx`, find the WebSocket connection:

```typescript
const newSocket = io('http://localhost:3000', {
```

Change to use environment variable:

```typescript
const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || window.location.origin, {
```

### 5.2 Add Environment Variable to Railway

In Railway Variables tab, add:

```
NEXT_PUBLIC_WS_URL=https://your-app.up.railway.app
```

Replace with your actual Railway URL.

### 5.3 Commit and Push

```bash
git add .
git commit -m "Update WebSocket URL for production"
git push
```

Railway will automatically redeploy.

## Step 6: Test Your Deployment

1. Open your Railway URL in a browser
2. Sign up for a new account
3. Create a new document
4. Copy the document URL
5. Open it in another browser/incognito window
6. Test real-time collaboration!

## Troubleshooting

### Build Fails

**Error: "Cannot find module 'better-sqlite3'"**

Solution: Railway needs to compile native modules. Add to `package.json`:

```json
"scripts": {
  "postinstall": "npm rebuild better-sqlite3"
}
```

### WebSocket Connection Fails

**Error: "WebSocket connection failed"**

1. Check Railway logs for errors
2. Verify `NEXT_PUBLIC_WS_URL` is set correctly
3. Make sure you're using HTTPS (not HTTP) in production

### Database Issues

**Error: "SQLITE_CANTOPEN"**

Railway provides ephemeral storage. For persistent database:

1. In Railway, add a "Volume"
2. Mount path: `/app/data`
3. Update `lib/db.ts` to use `/app/data/collab-editor.db`

Or migrate to PostgreSQL (recommended for production).

## Alternative: Deploy to Render

If Railway doesn't work, try Render:

### Render Deployment

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your repository
5. Configure:
   - **Name**: collab-editor
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free
6. Add environment variable:
   - `JWT_SECRET`: (your secret key)
7. Click "Create Web Service"

## Post-Deployment Checklist

- [ ] App loads successfully
- [ ] Can sign up and log in
- [ ] Can create new documents
- [ ] Real-time editing works across browsers
- [ ] Documents persist after refresh
- [ ] Version history works
- [ ] Export features work

## Monitoring

### Check Logs

**Railway:**
- Click on your service
- Go to "Deployments" tab
- Click on latest deployment
- View logs in real-time

**Render:**
- Go to your service dashboard
- Click "Logs" tab

### Common Issues

1. **500 Error**: Check server logs for errors
2. **WebSocket fails**: Verify URL and CORS settings
3. **Database errors**: Check file permissions and paths

## Cost

**Railway Free Tier:**
- $5 free credit per month
- Enough for demo/testing
- Sleeps after inactivity

**Render Free Tier:**
- Free for web services
- Sleeps after 15 minutes of inactivity
- Wakes up on first request (may take 30 seconds)

## Next Steps

1. Add custom domain (optional)
2. Set up monitoring/alerts
3. Configure automatic backups
4. Add SSL certificate (automatic on Railway/Render)

## Support

If you encounter issues:
1. Check Railway/Render documentation
2. Review deployment logs
3. Test locally first with `npm run build && npm start`
4. Verify all environment variables are set

## Success!

Once deployed, share your URL:
- Add it to your README.md
- Include it in your challenge submission
- Test with friends to demo real-time collaboration!

Your app is now live at: `https://your-app.up.railway.app` 🎉

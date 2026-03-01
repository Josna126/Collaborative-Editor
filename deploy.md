# Quick Deployment Guide

## Option 1: Railway (Recommended - Best for WebSockets)

### Step-by-Step:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "feat: Real-time collaborative document editor"
   git remote add origin https://github.com/YOUR_USERNAME/collab-editor.git
   git push -u origin main
   ```

2. **Deploy to Railway**
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Node.js

3. **Add Environment Variable**
   - In Railway dashboard, go to "Variables"
   - Add: `JWT_SECRET` = `your-random-secret-key-here`
   - Generate secret: `openssl rand -base64 32`

4. **Get Your URL**
   - Go to "Settings" → "Domains"
   - Click "Generate Domain"
   - Copy your URL (e.g., `https://collab-editor-production.up.railway.app`)

5. **Update WebSocket URL** (Optional - already configured to auto-detect)
   - Add variable: `NEXT_PUBLIC_WS_URL` = `your-railway-url`

6. **Done!** 
   - Your app is live!
   - Test it by opening in 2 browsers

---

## Option 2: Render

### Step-by-Step:

1. **Push to GitHub** (same as above)

2. **Deploy to Render**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   
3. **Configure**
   - Name: `collab-editor`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: `Free`

4. **Add Environment Variable**
   - Add: `JWT_SECRET` = `your-random-secret-key`

5. **Deploy**
   - Click "Create Web Service"
   - Wait 3-5 minutes for build

6. **Get Your URL**
   - Copy the URL from Render dashboard
   - Format: `https://collab-editor.onrender.com`

---

## Testing Your Deployment

1. Open your deployed URL
2. Sign up for an account
3. Create a new document
4. Open the same document URL in another browser/tab
5. Type in one browser - see it appear in the other!

---

## Troubleshooting

### Build Fails
- Check Railway/Render logs
- Verify `package.json` has correct scripts
- Make sure all dependencies are in `dependencies` (not `devDependencies`)

### WebSocket Connection Fails
- Verify you're using HTTPS (not HTTP)
- Check that Railway/Render supports WebSockets (both do)
- Look for CORS errors in browser console

### Database Issues
- Railway/Render have ephemeral storage
- Database resets on redeploy
- For production, migrate to PostgreSQL

---

## Quick Commands

```bash
# Generate JWT secret
openssl rand -base64 32

# Test production build locally
npm run build
npm start

# Check for errors
npm run lint
npm run type-check

# View logs (after deployment)
# Railway: Click deployment → View logs
# Render: Dashboard → Logs tab
```

---

## Success Checklist

- [ ] Code pushed to GitHub
- [ ] Deployed to Railway or Render
- [ ] Environment variables set
- [ ] Public URL works
- [ ] Can sign up and log in
- [ ] Real-time editing works
- [ ] Documents persist
- [ ] Tested in multiple browsers

---

## Your Deployment URL

Once deployed, add your URL here:

**Live Demo**: `https://your-app-url-here.up.railway.app`

Share this URL in your challenge submission!

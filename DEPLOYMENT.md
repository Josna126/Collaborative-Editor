# Deployment Guide

This guide covers deploying the collaborative editor to production.

## Option 1: Vercel + Railway (Recommended)

This setup uses Vercel for the Next.js app and Railway for the WebSocket server.

### Step 1: Deploy Database (Supabase)

1. Your Supabase project is already set up
2. Ensure the schema from `supabase-schema.sql` is applied
3. Note your credentials:
   - Project URL: `https://bboyzvyhvwtatqnnyted.supabase.co`
   - Anon Key: (your key)

### Step 2: Deploy WebSocket Server (Railway)

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables:
   ```
   NODE_ENV=production
   PORT=3000
   ```
5. Railway will auto-detect Node.js and run `npm start`
6. Note your Railway URL (e.g., `https://your-app.railway.app`)

### Step 3: Deploy Frontend (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "New Project" → Import your GitHub repository
3. Configure:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://bboyzvyhvwtatqnnyted.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   NEXT_PUBLIC_WS_URL=https://your-app.railway.app
   ```
5. Deploy!

### Step 4: Test Production

1. Open your Vercel URL
2. Create a new document
3. Open the same URL in incognito/another browser
4. Test real-time editing

## Option 2: Railway Only (Simpler)

Deploy everything to Railway (supports WebSocket natively).

### Steps:

1. Push code to GitHub
2. Go to [Railway.app](https://railway.app)
3. Create new project from GitHub repo
4. Add environment variables:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_SUPABASE_URL=https://bboyzvyhvwtatqnnyted.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   NEXT_PUBLIC_WS_URL=https://your-app.railway.app
   PORT=3000
   ```
5. Railway will:
   - Install dependencies
   - Run `npm run build`
   - Run `npm start` (which uses `server.js`)
6. Your app will be live at `https://your-app.railway.app`

## Option 3: Render

Similar to Railway, Render supports WebSocket connections.

### Steps:

1. Go to [Render.com](https://render.com)
2. Create new "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Add environment variables (same as Railway)
6. Deploy!

## Option 4: Fly.io

For more control and better performance.

### Steps:

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Create `fly.toml` in project root:

```toml
app = "collab-editor"

[build]
  builder = "heroku/buildpacks:20"

[env]
  PORT = "8080"
  NODE_ENV = "production"

[[services]]
  http_checks = []
  internal_port = 8080
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20
    type = "connections"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.tcp_checks]]
    grace_period = "1s"
    interval = "15s"
    restart_limit = 0
    timeout = "2s"
```

4. Set secrets:
```bash
fly secrets set NEXT_PUBLIC_SUPABASE_URL=your_url
fly secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
fly secrets set NEXT_PUBLIC_WS_URL=https://your-app.fly.dev
```

5. Deploy: `fly deploy`

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL | `https://your-app.railway.app` |
| `NODE_ENV` | Environment (production/development) | `production` |
| `PORT` | Server port (set by platform) | `3000` |

## Post-Deployment Checklist

- [ ] Database schema applied in Supabase
- [ ] Environment variables set correctly
- [ ] WebSocket connection works (check browser console)
- [ ] Test with 2+ browser windows
- [ ] Check auto-save functionality
- [ ] Verify document persistence
- [ ] Test typing indicators
- [ ] Check user presence (avatars)

## Troubleshooting

### WebSocket Connection Fails

**Symptom**: Users can't see each other's changes

**Solutions**:
1. Check `NEXT_PUBLIC_WS_URL` points to correct server
2. Ensure WebSocket server is running (Railway/Render/Fly)
3. Check browser console for connection errors
4. Verify CORS settings in `server.js`

### Database Errors

**Symptom**: Documents don't save or load

**Solutions**:
1. Verify Supabase credentials in environment variables
2. Check RLS policies in Supabase dashboard
3. Ensure schema is applied correctly
4. Check Supabase logs for errors

### Build Fails

**Symptom**: Deployment fails during build

**Solutions**:
1. Run `npm run build` locally to test
2. Check Node.js version (needs 18+)
3. Ensure all dependencies are in `package.json`
4. Check build logs for specific errors

### High Latency

**Symptom**: Changes take >2 seconds to appear

**Solutions**:
1. Deploy WebSocket server closer to users
2. Use CDN for static assets
3. Optimize database queries
4. Consider Redis for caching

## Monitoring

### Recommended Tools:
- **Vercel Analytics**: Built-in performance monitoring
- **Supabase Dashboard**: Database queries and performance
- **Railway Logs**: Server logs and errors
- **Sentry**: Error tracking (add if needed)

## Scaling Considerations

### Current Limitations:
- Single WebSocket server (no horizontal scaling)
- In-memory connection tracking (lost on restart)
- Full document sync (bandwidth-heavy)

### To Scale Beyond 100 Users:
1. Add Redis for distributed state
2. Implement Redis pub/sub for multi-server WebSocket
3. Use delta-based sync instead of full document
4. Add load balancer
5. Implement connection pooling for database

## Cost Estimates (Free Tier)

- **Supabase**: Free (500MB database, 2GB bandwidth)
- **Railway**: $5/month after free trial
- **Vercel**: Free (100GB bandwidth)
- **Total**: ~$5/month for production deployment

## Security Notes

⚠️ **Important**: This is a demo app with minimal security:
- No authentication (anyone with link can edit)
- No rate limiting (vulnerable to spam)
- No input validation (XSS possible)
- RLS policy allows all operations

**For production**, add:
- Supabase Auth for user management
- Rate limiting middleware
- Input sanitization
- Proper RLS policies
- HTTPS only
- Content Security Policy headers

## Support

If deployment fails:
1. Check platform-specific logs
2. Verify all environment variables
3. Test locally first with `npm run dev`
4. Check GitHub Issues for similar problems

---

**Deployment Status**: Ready for production with caveats above
**Estimated Setup Time**: 30-45 minutes
**Difficulty**: Intermediate

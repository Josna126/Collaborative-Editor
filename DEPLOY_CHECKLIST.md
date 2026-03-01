# Deployment Checklist

## Pre-Deployment

- [x] Server.js uses PORT environment variable
- [x] WebSocket URL uses environment variable
- [x] .gitignore file created
- [x] railway.json configuration added
- [ ] Test build locally: `npm run build && npm start`
- [ ] Verify no errors in console

## GitHub Setup

- [ ] Create GitHub repository
- [ ] Initialize git: `git init`
- [ ] Add files: `git add .`
- [ ] Commit: `git commit -m "Initial commit"`
- [ ] Add remote: `git remote add origin YOUR_REPO_URL`
- [ ] Push: `git push -u origin main`

## Railway Deployment

- [ ] Sign up at https://railway.app
- [ ] Create new project from GitHub repo
- [ ] Add environment variable: `JWT_SECRET`
- [ ] Generate domain
- [ ] Copy deployment URL
- [ ] Test the live site

## Post-Deployment Testing

- [ ] Open deployed URL
- [ ] Sign up works
- [ ] Login works
- [ ] Create document works
- [ ] Real-time editing works (test in 2 browsers)
- [ ] Documents persist after refresh
- [ ] Version history works
- [ ] Export features work

## Final Steps

- [ ] Update README.md with live URL
- [ ] Test all features one more time
- [ ] Take screenshots for submission
- [ ] Submit project URL

## Commands Reference

```bash
# Test locally
npm run build
npm start

# Generate JWT secret
openssl rand -base64 32

# Git commands
git init
git add .
git commit -m "feat: Collaborative editor"
git remote add origin YOUR_URL
git push -u origin main
```

## Your Deployment Info

**GitHub Repo**: ___________________________

**Railway URL**: ___________________________

**JWT Secret**: (keep this private!)

**Deployment Date**: ___________________________

## Support

If you get stuck:
1. Check DEPLOYMENT_INSTRUCTIONS.md for detailed steps
2. Check Railway logs for errors
3. Test locally first with `npm start`
4. Verify all environment variables are set

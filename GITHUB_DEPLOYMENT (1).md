# Setting Up on GitHub & Deploying

This guide walks you through creating a GitHub repository and deploying your tracker online.

## Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `antisemitic-incidents-tracker`
3. Description: "Track and monitor antisemitic incidents in the United States"
4. Make it **Public** (so others can see it)
5. Check "Add a README file"
6. Choose MIT License
7. Click "Create repository"

## Step 2: Upload Your Code

### Option A: Using Git (Recommended)

1. **Initialize git locally** (if not done):
```bash
cd antisemitic-incidents-tracker
git init
git add .
git commit -m "Initial commit: add tracker application"
```

2. **Add remote and push**:
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/antisemitic-incidents-tracker.git
git push -u origin main
```

### Option B: Upload via GitHub Web UI

1. Go to your new repository
2. Click "Add file" → "Upload files"
3. Drag and drop all files (except node_modules)
4. Commit changes

## Step 3: Create `.gitignore`

Add to prevent uploading sensitive files:

```
node_modules/
.env
.env.local
.DS_Store
*.log
```

## Step 4: Deploy to Heroku (Free Option)

### Heroku Setup:

1. Go to [heroku.com](https://heroku.com) and create a free account
2. Create a new app
3. **Connect to GitHub**:
   - In Deploy tab → "Connect to GitHub"
   - Search for your repository
   - Click "Connect"

4. **Add Environment Variables**:
   - Go to Settings → Config Vars
   - Add: `NEWS_API_KEY` = your_api_key

5. **Deploy**:
   - In Deploy tab → "Deploy Branch"
   - Wait for build to complete
   - Click "Open app" to view live

### Create `Procfile` for Heroku:

```
web: npm start
```

(Add this file to your repository)

## Step 5: Deploy to Railway or Render (Alternative)

### Railway (Recommended for beginners):

1. Go to [railway.app](https://railway.app)
2. Login with GitHub
3. Click "New Project" → "Deploy from GitHub"
4. Select your repository
5. Add environment variables (NEWS_API_KEY)
6. Railway will auto-deploy on each push

### Render:

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub account
4. Select your repository
5. Set build command: `npm install`
6. Set start command: `npm start`
7. Add environment variables
8. Deploy

## Step 6: Make It Look Professional

### Add to Your Repository:

**`CONTRIBUTING.md`** - Guide for contributors
**`CODE_OF_CONDUCT.md`** - Community standards
**`LICENSE`** - Open source license (already added by GitHub)

### Update GitHub Settings:

1. Go to Settings → General
2. Add Topics: `antisemitism`, `hate-crimes`, `open-data`, `social-justice`
3. Enable Discussions
4. Enable Wiki

### Create GitHub Badges (Optional)

Add to top of README.md:

```markdown
[![Deploy Status](https://img.shields.io/badge/status-active-brightgreen)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node.js-14+-green)]()
```

## Step 7: Monitor Your Deployment

### Check Logs:

**Heroku**:
```bash
heroku logs --tail
```

**Railway**: View in dashboard

**Render**: View in dashboard

### Common Issues:

| Error | Solution |
|-------|----------|
| `Cannot find module` | Run `npm install` locally, commit `node_modules` or use Heroku buildpacks |
| `NEWS_API_KEY undefined` | Add environment variable in hosting dashboard |
| `Port already in use` | Server is using dynamic port (handled automatically) |
| `App crashes on start` | Check logs for errors |

## Step 8: Share Your Project

Once deployed, share the link:

- Post on social media
- Add to relevant GitHub lists
- Submit to HackerNews if appropriate
- Share with advocacy organizations

## Step 9: Continuous Improvements

### Track Issues:
- Go to Issues tab
- Create issues for features or bugs
- Use labels (`enhancement`, `bug`, `documentation`)

### Create a Project Board:
- Projects tab → New project
- Use Kanban board
- Track development progress

## Example Deployment URLs

After deployment, your app will be live at:

- **Heroku**: `https://your-app-name.herokuapp.com`
- **Railway**: `https://your-app-name.up.railway.app`
- **Render**: `https://your-app-name.onrender.com`

## Environment Variables Reference

Make sure these are set in your hosting platform:

```
NEWS_API_KEY=abc123xyz...    # Required: Your News API key
PORT=5000                     # Optional: Usually auto-set by host
NODE_ENV=production           # Optional: Auto-set by most hosts
```

## Keeping It Updated

### Regular Maintenance:

1. Update dependencies monthly:
```bash
npm update
```

2. Check for security vulnerabilities:
```bash
npm audit
npm audit fix
```

3. Review and merge pull requests
4. Monitor error logs
5. Update documentation

## Troubleshooting Deployment

### If the app won't start:

1. Check logs in hosting dashboard
2. Verify all environment variables are set
3. Test locally: `npm start`
4. Ensure `server.js` exists in root
5. Check `package.json` has correct `"start"` script

### If News API calls fail:

1. Verify API key is valid at newsapi.org
2. Check API rate limits (free: 500/day)
3. Ensure `axios` is installed

### If frontend doesn't load:

1. Check that `public/index.html` exists
2. Verify Express is serving static files
3. Check browser console for JavaScript errors

## Next Steps

1. ✅ Deploy your app
2. 📢 Announce it to the community
3. 👥 Encourage contributions
4. 📊 Add analytics to track usage
5. 🔄 Collect feedback and iterate
6. 💾 Consider upgrading storage (database) for persistence

---

**Questions?** Check the GitHub Docs: https://docs.github.com

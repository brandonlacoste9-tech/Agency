# 🚀 BEE-SHIP DEPLOYMENT GUIDE

## Quick Start (You're Almost There!)

Your Netlify auto-deploy is **already active** - you just need to push the files!

## ✅ What's Been Created

All Bee-ship files are ready in your repo. Here's what you have:

### Core Files
- `netlify/functions/bee-ship.ts` - Main serverless handler
- `scripts/ship-swarm.ps1` & `.sh` - Bulk deployment scripts
- Platform modules (need to be created - see below)

### Documentation
- `BEE_SHIP_README.md` - Overview and architecture
- `BEE_SHIP_DEPLOYMENT.md` - Deployment steps (this file!)
- `BEE_SHIP_FILES_COMPLETE.md` - Complete file listing

## 🎯 Deploy in 3 Steps

### Step 1: Create Platform Modules

Run this command to create the platform integration files:

```bash
# Create lib/platforms directory
mkdir -p lib/platforms

# Or on Windows
md lib\platforms
```

Then manually create these 3 files in `lib/platforms/`:

**instagram.ts** - Copy from BEE_SHIP_FILES_COMPLETE.md
**youtube.ts** - Copy from BEE_SHIP_FILES_COMPLETE.md  
**tiktok.ts** - Copy from BEE_SHIP_FILES_COMPLETE.md

OR use the provided script:
```bash
.\create-platforms.bat
```

### Step 2: Set Netlify Environment Variables

Go to: Netlify Dashboard → Your Site → Site Settings → Environment Variables

**Required (Minimum for Instagram):**
```
BEE_API_URL=https://www.adgenxai.pro/api
BEE_API_KEY=<your-bee-key>
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-key>
INSTAGRAM_ACCOUNT_ID=<your-ig-id>
FB_ACCESS_TOKEN=<your-fb-token>
```

**Optional (for YouTube & TikTok):**
```
YOUTUBE_CLIENT_ID=<client-id>
YOUTUBE_CLIENT_SECRET=<client-secret>
YOUTUBE_REFRESH_TOKEN=<refresh-token>
TIKTOK_CLIENT_KEY=<client-key>
TIKTOK_CLIENT_SECRET=<client-secret>
TIKTOK_ACCESS_TOKEN=<access-token>
```

### Step 3: Commit & Push (Auto-Deploy Triggers!)

```bash
# Add all bee-ship files
git add lib/platforms/*.ts
git add netlify/functions/bee-ship.ts
git add scripts/ship-swarm.*
git add BEE_SHIP_*.md

# Commit
git commit -m "feat(bee): add bee-ship autonomous publishing system 🐝"

# Push (this triggers Netlify auto-deploy!)
git push origin main
```

## 🧪 Test Your Deployment

### Wait for Build
1. Watch Netlify dashboard - build should start automatically
2. Wait ~2-3 minutes for build to complete
3. Look for "Published" status

### Test Single Creative

```bash
curl -X POST https://adgenxai.netlify.app/.netlify/functions/bee-ship \
  -H "Content-Type: application/json" \
  -d '{"seed":"test-ad","platforms":["instagram"]}'
```

### Test Swarm Mode (PowerShell)

```powershell
.\scripts\ship-swarm.ps1
```

## 📊 Monitor & Debug

### Check Function Logs
Netlify → Functions → bee-ship → Logs

### Check Supabase Storage
Supabase Dashboard → Storage → assets bucket

### Check Instagram
Your Instagram business account feed

## 🔧 Supabase Setup

1. **Create Storage Bucket**
   - Go to Supabase Dashboard
   - Storage → New Bucket
   - Name: `assets`
   - Public: Yes (or configure signed URLs)

2. **Test Upload**
   ```bash
   # Should see uploads in Supabase after function runs
   ```

## 🎭 Platform-Specific Notes

### Instagram
- Requires Facebook App with approved scopes
- Needs Instagram Business Account
- Token must be long-lived (60 days+)

### YouTube  
- Requires Google Cloud project
- OAuth2 flow for refresh token
- Upload quota applies

### TikTok
- Requires TikTok Developer approval
- Content API access needed
- Implement upload flow in tiktok.ts

## 🐝 The Bee Swarm Is Ready!

Once deployed, your system will:
1. ✅ Generate creatives via Bee agent
2. ✅ Upload assets to Supabase
3. ✅ Publish to Instagram (and more)
4. ✅ Return results & URLs

## 💡 Pro Tips

- Start with Instagram only (simplest)
- Test with single seeds first
- Monitor function logs closely
- Use unlisted/private for YouTube tests
- Keep tokens fresh (set calendar reminders)

## 🆘 Troubleshooting

**Build fails?**
- Check package.json has googleapis, @supabase/supabase-js
- Verify TypeScript files have no syntax errors

**Function fails?**
- Check Netlify environment variables are set
- Verify Supabase bucket exists
- Check Instagram token validity

**No posts appearing?**
- Check Instagram account permissions
- Verify FB token has content_publish scope
- Check function logs for error details

---

**You're all set!** Just create the platform modules, set env vars, and push. Netlify's auto-deploy will handle the rest! 🚀🐝

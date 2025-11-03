# 🚀 BEE-SHIP LAUNCH CHECKLIST

---

## PRE-LAUNCH ✓

### 1. Local Setup
- [x] Repository cloned
- [x] Node.js installed (18+)
- [x] Git configured
- [x] Netlify CLI installed (`npm i -g netlify-cli`)

### 2. Accounts Ready
- [ ] Netlify account connected
- [ ] Supabase project created
- [ ] Facebook Developer account
- [ ] Instagram Business account linked

---

## DEPLOYMENT ✓

### Step 1: Run Deployment Script
```
Double-click: SHIP_BEE_SWARM_NOW.bat
```

**Expected output**:
```
[STEP 1/6] Creating directory structure... ✓
[STEP 2/6] Creating Instagram platform module... ✓
[STEP 3/6] Creating TikTok platform stub... ✓
[STEP 4/6] Creating YouTube platform stub... ✓
[STEP 5/6] Installing dependencies... ✓
[STEP 6/6] Committing and pushing... ✓
```

- [ ] Script completed without errors
- [ ] Files created in `lib/platforms/`
- [ ] Committed to git
- [ ] Pushed to GitHub

### Step 2: Verify Netlify Deploy
**Check**: https://app.netlify.com

- [ ] Build started automatically
- [ ] Build completed (2-3 minutes)
- [ ] No build errors
- [ ] Function `bee-ship` appears in Functions tab

---

## CONFIGURATION ✓

### Step 3: Set Environment Variables
**Go to**: `netlify.com/sites/YOUR_SITE/settings/env`

**Core Bee-ship** (Required):
- [ ] `BEE_API_URL` = https://www.adgenxai.pro/api
- [ ] `BEE_API_KEY` = your_bee_agent_key

**Supabase** (Required):
- [ ] `SUPABASE_URL` = https://xxx.supabase.co
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = eyJxxx...

**Instagram** (Required for IG publishing):
- [ ] `INSTAGRAM_ACCOUNT_ID` = 17841xxxxxxxxx
- [ ] `FB_ACCESS_TOKEN` = EAABxxx... (long-lived page token)

**TikTok** (Optional):
- [ ] `TIKTOK_CLIENT_KEY` = xxx
- [ ] `TIKTOK_CLIENT_SECRET` = xxx
- [ ] `TIKTOK_ACCESS_TOKEN` = xxx

**YouTube** (Optional):
- [ ] `YOUTUBE_CLIENT_ID` = xxx.apps.googleusercontent.com
- [ ] `YOUTUBE_CLIENT_SECRET` = xxx
- [ ] `YOUTUBE_REFRESH_TOKEN` = 1//xxx

### Step 4: Supabase Storage Setup
**Go to**: Supabase Dashboard → Storage

- [ ] Created bucket: `assets`
- [ ] Set bucket to Public
- [ ] Tested upload works

---

## TESTING ✓

### Step 5: Test Single Publish
```powershell
Invoke-RestMethod -Uri "https://YOUR_SITE.netlify.app/.netlify/functions/bee-ship" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"seed":"test-launch","platforms":["instagram"]}'
```

**Verify**:
- [ ] Got 200 OK response
- [ ] Response has `"ok": true`
- [ ] Asset uploaded to Supabase
- [ ] Instagram post published
- [ ] No errors in Netlify function logs

### Step 6: Test Bulk Publish (Swarm Mode)
```powershell
.\scripts\ship-swarm.ps1
```

**Verify**:
- [ ] 4 campaigns processed
- [ ] All returned success
- [ ] Instagram shows 4 new posts
- [ ] Supabase has 4 new assets

---

## POST-LAUNCH ✓

### Step 7: Monitor & Verify
- [ ] Check Netlify function logs (no errors)
- [ ] Verify Instagram posts are live
- [ ] Check Supabase storage usage
- [ ] Test error handling (bad seed, invalid platform)

### Step 8: Document
- [ ] Update team on new endpoint
- [ ] Share API docs
- [ ] Add to monitoring dashboard
- [ ] Schedule first production swarm

---

## INSTAGRAM SETUP (DETAILED)

If Instagram tokens not ready, complete these:

### Get Long-Lived Page Token
1. [ ] Created Facebook App
2. [ ] Added Instagram product
3. [ ] Got short-lived user token
4. [ ] Exchanged for long-lived user token
5. [ ] Got page access token
6. [ ] Verified token never expires

### Get Instagram Account ID
```bash
curl -X GET "https://graph.facebook.com/v17.0/PAGE_ID" \
  -d "fields=instagram_business_account" \
  -d "access_token=PAGE_ACCESS_TOKEN"
```
7. [ ] Got Instagram business account ID
8. [ ] Added to Netlify env vars

### Permissions
9. [ ] `instagram_basic` granted
10. [ ] `instagram_content_publish` granted
11. [ ] Tested with Graph API Explorer

---

## ROLLBACK PLAN (If Needed)

### If deployment fails:
```powershell
# Revert last commit
git reset --hard HEAD~1
git push origin main --force

# Or revert specific files
git checkout HEAD~1 -- lib/platforms netlify/functions
git commit -m "revert: rollback bee-ship"
git push
```

### If function errors in production:
1. Check Netlify function logs
2. Verify all env vars set correctly
3. Test Bee API endpoint manually
4. Check Supabase connection
5. Roll back to previous deploy if needed

---

## SUCCESS CRITERIA ✅

**Bee-ship is LIVE when**:
- ✅ Netlify function deployed and responding
- ✅ Instagram publishes successfully
- ✅ Assets upload to Supabase
- ✅ Swarm mode processes multiple campaigns
- ✅ No errors in logs
- ✅ Team can trigger via API

---

## NEXT PHASE (Future)

After successful launch:
- [ ] Implement TikTok publishing
- [ ] Implement YouTube publishing
- [ ] Add scheduler (cron jobs)
- [ ] Build analytics dashboard
- [ ] Add A/B testing
- [ ] Auto-optimization based on performance

---

## SUPPORT CONTACTS

- **Netlify**: app.netlify.com/support
- **Supabase**: supabase.com/support
- **Instagram API**: developers.facebook.com/support
- **GitHub Issues**: github.com/brandonlacoste9-tech/Beehive/issues

---

## TIMELINE

```
T+0:00   Run SHIP_BEE_SWARM_NOW.bat
T+0:02   Files created, git push complete
T+0:05   Netlify build complete
T+0:10   Environment variables set
T+0:12   Supabase bucket created
T+0:15   Test single publish - SUCCESS
T+0:20   Test swarm mode - SUCCESS
T+0:25   Monitor for 5 min - ALL CLEAR
T+0:30   🚀 BEE-SHIP IS LIVE!
```

---

**Ready to launch?**

```
👉 Double-click: SHIP_BEE_SWARM_NOW.bat
```

Then check off each item in this checklist! 🐝✨

**Questions?** See `BEE_SHIP_COMPLETE_GUIDE.md`

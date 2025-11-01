# 🐝 Bee-Ship Complete Deployment Guide

## Quick Start (Windows)

**Just double-click this file:**
```
SHIP_BEE_SWARM_NOW.bat
```

That's it! The script will:
- ✅ Create all platform modules
- ✅ Set up Netlify functions
- ✅ Install dependencies
- ✅ Commit changes
- ✅ Push to GitHub
- ✅ Trigger Netlify auto-deploy

---

## What Gets Deployed

### 1. Platform Modules (`lib/platforms/`)
- **instagram.ts** - Instagram Graph API publishing (ready to use)
- **tiktok.ts** - TikTok stub (needs implementation)
- **youtube.ts** - YouTube stub (needs googleapis setup)

### 2. Netlify Function (`netlify/functions/bee-ship.ts`)
Serverless endpoint that:
- Calls Bee agent for creative generation
- Uploads assets to Supabase
- Publishes to social platforms
- Returns publish status

### 3. Deployment Scripts
- `SHIP_BEE_SWARM_NOW.bat` - Complete deployment (Windows)
- `scripts/ship-swarm.ps1` - Bulk publishing tool
- `create-platforms-simple.ps1` - Platform module generator

---

## Environment Variables (Set in Netlify)

Go to: `https://app.netlify.com/sites/YOUR_SITE/settings/env`

### Required
```env
BEE_API_URL=https://www.adgenxai.pro/api
BEE_API_KEY=your_bee_agent_api_key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### Instagram (ready to use)
```env
INSTAGRAM_ACCOUNT_ID=17841xxxxxxxxx
FB_ACCESS_TOKEN=EAABxxx... (long-lived page token)
```

### TikTok (optional - needs implementation)
```env
TIKTOK_CLIENT_KEY=xxx
TIKTOK_CLIENT_SECRET=xxx
TIKTOK_ACCESS_TOKEN=xxx
```

### YouTube (optional - needs implementation)
```env
YOUTUBE_CLIENT_ID=xxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=xxx
YOUTUBE_REFRESH_TOKEN=1//xxx
```

---

## Supabase Setup

1. Go to Supabase dashboard → **Storage**
2. Create bucket: `assets`
3. Set to **Public** (or configure signed URLs)
4. Done! Bee-ship will auto-upload there

---

## Testing After Deploy

### 1. Wait for Netlify (2-3 minutes)
Check: https://app.netlify.com

### 2. Test Single Publish
```powershell
Invoke-RestMethod -Uri "https://YOUR_SITE.netlify.app/.netlify/functions/bee-ship" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"seed":"test-campaign","platforms":["instagram"]}'
```

### 3. Bulk Publish (Swarm Mode)
```powershell
.\scripts\ship-swarm.ps1
```

This ships 4 campaigns automatically!

---

## API Usage

### Endpoint
```
POST /.netlify/functions/bee-ship
```

### Request
```json
{
  "seed": "promo-summer",
  "platforms": ["instagram", "tiktok", "youtube"]
}
```

### Response
```json
{
  "ok": true,
  "creative": {
    "headline": "Summer Sale 🔥",
    "caption": "Get 50% off...",
    "imageUrl": "https://xxx.supabase.co/storage/v1/object/public/assets/bee/xxx.png"
  },
  "assetUrl": "https://...",
  "results": {
    "instagram": {
      "containerId": "17xxx",
      "publishedId": "17yyy"
    }
  }
}
```

---

## Platform Implementation Status

| Platform  | Status | Notes |
|-----------|--------|-------|
| Instagram | ✅ Ready | Uses Graph API v17.0 |
| TikTok    | 🔨 Stub | Needs TikTok dev account & implementation |
| YouTube   | 🔨 Stub | Needs googleapis + OAuth setup |

---

## Instagram Setup (Detailed)

### 1. Create Facebook App
1. Go to https://developers.facebook.com
2. Create app → Business → Instagram
3. Add products: **Facebook Login**, **Instagram Basic Display**

### 2. Get Long-Lived Token
```bash
# Step 1: Get short-lived user token (via FB Login)
# Step 2: Exchange for long-lived token
curl -X GET "https://graph.facebook.com/v17.0/oauth/access_token" \
  -d "grant_type=fb_exchange_token" \
  -d "client_id=YOUR_APP_ID" \
  -d "client_secret=YOUR_APP_SECRET" \
  -d "fb_exchange_token=SHORT_LIVED_TOKEN"

# Step 3: Get page token (never expires)
curl -X GET "https://graph.facebook.com/v17.0/me/accounts" \
  -d "access_token=LONG_LIVED_USER_TOKEN"
```

### 3. Get Instagram Account ID
```bash
curl -X GET "https://graph.facebook.com/v17.0/PAGE_ID" \
  -d "fields=instagram_business_account" \
  -d "access_token=PAGE_ACCESS_TOKEN"
```

### 4. Required Permissions
- `instagram_basic`
- `instagram_content_publish`
- `pages_read_engagement`

---

## Monitoring & Logs

### Netlify Function Logs
```
https://app.netlify.com/sites/YOUR_SITE/functions/bee-ship
```

### Supabase Storage
```
https://app.supabase.com/project/YOUR_PROJECT/storage/buckets/assets
```

### Live Tail (Windows PowerShell)
```powershell
# Coming soon: real-time log streaming
```

---

## Troubleshooting

### "Failed to create Instagram media"
- ✅ Check `FB_ACCESS_TOKEN` is valid
- ✅ Verify token has `instagram_content_publish` permission
- ✅ Ensure image_url is publicly accessible
- ✅ Caption must be <2200 characters

### "Supabase upload error"
- ✅ Check `SUPABASE_SERVICE_ROLE_KEY` (not anon key!)
- ✅ Verify `assets` bucket exists
- ✅ Check bucket is public or configure signed URLs

### "Bee agent generation failed"
- ✅ Verify `BEE_API_URL` and `BEE_API_KEY`
- ✅ Test agent endpoint manually
- ✅ Check agent is deployed and responding

### Netlify deploy failed
```powershell
# Check build logs
netlify build --debug

# Manual deploy
netlify deploy --prod
```

---

## Roadmap

### Phase 1 ✅ (Complete)
- [x] Instagram publishing
- [x] Supabase storage
- [x] Netlify serverless function
- [x] Bulk ship script

### Phase 2 (Next)
- [ ] TikTok implementation
- [ ] YouTube implementation  
- [ ] Scheduler (cron jobs)
- [ ] Analytics dashboard

### Phase 3 (Future)
- [ ] A/B testing
- [ ] Performance tracking
- [ ] Auto-optimization
- [ ] Multi-account support

---

## Files Reference

```
Beehive/
├── lib/
│   └── platforms/
│       ├── instagram.ts      ✅ Ready
│       ├── tiktok.ts         🔨 Stub
│       └── youtube.ts        🔨 Stub
├── netlify/
│   └── functions/
│       └── bee-ship.ts       ✅ Main handler
├── scripts/
│   └── ship-swarm.ps1        ✅ Bulk publisher
├── SHIP_BEE_SWARM_NOW.bat    ⚡ One-click deploy
├── BEE_SHIP_DEPLOY.bat       🚀 Deploy helper
└── .env.bee-ship             🔐 Env template
```

---

## Support & Resources

- **Netlify Docs**: https://docs.netlify.com/functions/overview/
- **Instagram API**: https://developers.facebook.com/docs/instagram-api
- **Supabase Storage**: https://supabase.com/docs/guides/storage
- **GitHub Repo**: https://github.com/brandonlacoste9-tech/Beehive

---

## Security Notes

⚠️ **Never commit secrets to git!**
- All tokens → Netlify environment variables only
- Use `.gitignore` for `.env*` files
- Rotate tokens if accidentally exposed
- Use Supabase RLS for production

---

## Quick Commands

```powershell
# Deploy everything
.\SHIP_BEE_SWARM_NOW.bat

# Just create platform modules
.\create-platforms-simple.ps1

# Bulk publish
.\scripts\ship-swarm.ps1

# Check Netlify status
netlify status

# View function logs
netlify functions:log bee-ship

# Manual deploy
netlify deploy --prod
```

---

## Success Checklist

Before going live, verify:

- [ ] Netlify site is deployed
- [ ] All environment variables set
- [ ] Supabase `assets` bucket created
- [ ] Instagram token is long-lived page token
- [ ] Test publish works (`curl` or Postman)
- [ ] Function logs show no errors
- [ ] Assets upload to Supabase correctly
- [ ] Instagram posts appear on account

---

**🎉 You're ready to ship the swarm!**

Questions? Issues? Open a GitHub issue or check Netlify function logs.

Happy autonomous publishing! 🐝✨

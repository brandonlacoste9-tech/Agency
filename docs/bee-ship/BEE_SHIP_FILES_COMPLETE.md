# 🐝 Bee-Ship Complete Files Guide

## ✅ Files Created

All Bee-ship files have been created and are ready for deployment:

### Platform Integrations (`lib/platforms/`)
- ✅ `instagram.ts` - Instagram Graph API (image publishing)
- ✅ `tiktok.ts` - TikTok stub (ready for your implementation)
- ✅ `youtube.ts` - YouTube Data API v3 (video publishing with googleapis)

### Serverless Function (`netlify/functions/`)
- ✅ `bee-ship.ts` - Main handler that orchestrates generation → upload → publish

### Scripts (`scripts/`)
- ✅ `ship-swarm.ps1` - PowerShell bulk deployment script
- ✅ `ship-swarm.sh` - Bash bulk deployment script

## 🚀 Quick Deploy

### 1. Install Dependencies

```bash
npm install googleapis @supabase/supabase-js @netlify/functions
```

### 2. Set Environment Variables in Netlify

Go to Netlify Dashboard → Site Settings → Environment Variables and add:

```env
# Bee Agent
BEE_API_URL=https://www.adgenxai.pro/api
BEE_API_KEY=your_bee_agent_key

# Supabase (for asset storage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Instagram / Facebook
INSTAGRAM_ACCOUNT_ID=your_ig_account_id
FB_ACCESS_TOKEN=your_long_lived_page_token

# YouTube (optional)
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REFRESH_TOKEN=your_refresh_token

# TikTok (optional)
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
TIKTOK_ACCESS_TOKEN=your_access_token
```

### 3. Setup Supabase Storage

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `assets`
3. Set to public or configure signed URLs as needed

### 4. Commit & Deploy

```bash
git add lib/platforms netlify/functions/bee-ship.ts scripts/ship-swarm.*
git commit -m "feat(bee): add bee-ship extension for autonomous social publishing"
git push origin main
```

Your Netlify auto-deploy will pick up the changes and deploy the function!

## 🧪 Test the Function

### Manual Test (single creative)

```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/bee-ship \
  -H "Content-Type: application/json" \
  -d '{"seed":"test-campaign","platforms":["instagram"]}'
```

### Bulk Test (swarm mode)

**PowerShell:**
```powershell
.\scripts\ship-swarm.ps1 -ApiUrl "https://your-site.netlify.app/.netlify/functions/bee-ship"
```

**Bash:**
```bash
chmod +x scripts/ship-swarm.sh
./scripts/ship-swarm.sh https://your-site.netlify.app/.netlify/functions/bee-ship
```

## 📊 Function Flow

1. **Generate** → Bee agent creates creative based on seed
2. **Upload** → Asset uploaded to Supabase Storage
3. **Publish** → Posted to each platform (Instagram, YouTube, TikTok)
4. **Return** → Results + asset URLs + timestamps

## 🔒 Security Notes

- ✅ All secrets stored in Netlify Environment Variables (never in code)
- ✅ Supabase service role key used for secure uploads
- ✅ Platform tokens are long-lived and refreshable
- ✅ Function includes error handling and logging

## 📝 Platform-Specific Setup

### Instagram
1. Create Facebook App
2. Add Instagram Basic Display + Content Publishing
3. Get long-lived Page Access Token
4. Connect Page to Instagram Business Account

### YouTube
1. Create OAuth2 client in Google Cloud Console
2. Enable YouTube Data API v3
3. Get refresh token via OAuth flow
4. Store refresh token in env vars

### TikTok
1. Apply for TikTok Developer account
2. Create app and get credentials
3. Implement upload/publish flow in `lib/platforms/tiktok.ts`
4. Add credentials to env vars

## 🎯 Next Steps

Your Bee-ship is ready! Once deployed:

1. Monitor Netlify function logs for first runs
2. Test with a single seed first
3. Scale up to swarm mode when confident
4. Wire results back to Sensory Cortex for learning

🔥 The autonomous Bee swarm is ready to ship!

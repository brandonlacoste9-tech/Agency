# 🐝 BEE-SHIP: Autonomous Social Publishing System

## What Is Bee-Ship?

Bee-Ship is your **autonomous creative swarm** - a serverless system that:
- 🤖 Generates ad creatives using your Bee AI agent
- 📸 Uploads assets to Supabase Storage  
- 📱 Publishes to Instagram, YouTube, TikTok
- 🔄 Returns results for learning feedback loop

Think of it as your **24/7 creative team** that never sleeps.

## Architecture

```
[Trigger] → [bee-ship function] → [Bee Agent] → [Generate Creative]
                ↓
           [Upload to Supabase]
                ↓
           [Publish to Platforms]
                ↓
           [Return Results]
```

## Key Components

### 1. Bee-Ship Function (`netlify/functions/bee-ship.ts`)
Main serverless handler that orchestrates the entire flow.

### 2. Platform Integrations (`lib/platforms/`)
- **instagram.ts** - Instagram Graph API (images)
- **youtube.ts** - YouTube Data API v3 (videos)
- **tiktok.ts** - TikTok Content API (stub)

### 3. Deployment Scripts (`scripts/`)
- **ship-swarm.ps1** - PowerShell bulk deploy
- **ship-swarm.sh** - Bash bulk deploy

## Quick Example

### Single Creative
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/bee-ship \
  -H "Content-Type: application/json" \
  -d '{
    "seed": "summer-sale-2025",
    "platforms": ["instagram"]
  }'
```

### Response
```json
{
  "ok": true,
  "creative": {
    "headline": "☀️ Summer Flash Sale",
    "caption": "Limited time: 40% off...",
    "imageUrl": "https://supabase.co/storage/v1/object/public/assets/bee/..."
  },
  "assetUrl": "https://...",
  "results": {
    "instagram": {
      "containerId": "123456",
      "publishedId": "789012"
    }
  },
  "timestamp": "2025-01-31T10:00:00.000Z"
}
```

## Swarm Mode

Deploy multiple creatives at once:

```powershell
# PowerShell
.\scripts\ship-swarm.ps1 -Seeds @("promo-a", "promo-b", "event-launch")
```

```bash
# Bash (edit script for custom seeds)
./scripts/ship-swarm.sh
```

## Environment Variables

Set these in **Netlify Dashboard → Site Settings → Environment**:

### Required
```env
BEE_API_URL=https://www.adgenxai.pro/api
BEE_API_KEY=your_bee_key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
INSTAGRAM_ACCOUNT_ID=xxx
FB_ACCESS_TOKEN=xxx
```

### Optional
```env
YOUTUBE_CLIENT_ID=xxx
YOUTUBE_CLIENT_SECRET=xxx
YOUTUBE_REFRESH_TOKEN=xxx
TIKTOK_CLIENT_KEY=xxx
TIKTOK_CLIENT_SECRET=xxx
```

## Platform Setup

### Instagram
1. Create Facebook App
2. Add "Instagram Basic Display" & "Instagram Content Publishing"
3. Get long-lived Page Access Token (60 days)
4. Link to Instagram Business Account

### YouTube
1. Google Cloud Console → Create OAuth2 Client
2. Enable YouTube Data API v3
3. Get refresh token via OAuth flow
4. Store refresh token in env

### TikTok
1. Apply for TikTok Developer account
2. Create app → get credentials
3. Implement upload flow in `lib/platforms/tiktok.ts`

## Security

✅ All tokens stored in Netlify Environment (never in code)  
✅ Supabase service role key for secure uploads  
✅ Error handling with detailed logs  
✅ Platform rate limiting respected  

## Monitoring

### Function Logs
Netlify → Functions → bee-ship → View logs

### Storage
Supabase Dashboard → Storage → assets bucket

### Platform Status
- Instagram: Business Suite insights
- YouTube: YouTube Studio analytics
- TikTok: Creator Center stats

## Feedback Loop (Future)

Wire results back to Sensory Cortex:
```typescript
// After publish, record metrics
await recordToSensoryCortex({
  creative_id: creative.id,
  platform: 'instagram',
  published_id: results.instagram.publishedId,
  impressions: 0, // fetch later
  engagement: 0,  // fetch later
});
```

## Use Cases

### 1. Campaign Launch
Ship 10 variants simultaneously to test messaging

### 2. Evergreen Content
Schedule daily posts with rotating themes

### 3. Event Marketing
Rapid-fire creative bursts during live events

### 4. A/B Testing
Generate competing creatives, measure performance

## Best Practices

- ✅ Start small (1-3 seeds) to verify flow
- ✅ Use descriptive seeds ("promo-flash-sale" not "test1")
- ✅ Monitor first few runs closely
- ✅ Keep Instagram tokens fresh
- ✅ Set up Supabase storage policies
- ✅ Use private/unlisted for YouTube tests

## Dependencies

```json
{
  "dependencies": {
    "@netlify/functions": "^2.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "googleapis": "^130.0.0"
  }
}
```

## File Structure

```
Beehive/
├── netlify/
│   └── functions/
│       └── bee-ship.ts          # Main handler
├── lib/
│   └── platforms/
│       ├── instagram.ts         # IG Graph API
│       ├── youtube.ts           # YouTube API
│       └── tiktok.ts            # TikTok stub
├── scripts/
│   ├── ship-swarm.ps1          # PowerShell script
│   └── ship-swarm.sh           # Bash script
└── BEE_SHIP_*.md               # Documentation
```

## Next Steps

1. ✅ Files created (you have them!)
2. ⏳ Create `lib/platforms/` modules  
3. ⏳ Set Netlify environment variables
4. ⏳ Push to trigger auto-deploy
5. ⏳ Test with single creative
6. ⏳ Scale to swarm mode
7. 🚀 Ship it!

---

**The Bee swarm is ready to fly!** 🐝✨

See `BEE_SHIP_DEPLOYMENT_COMPLETE.md` for step-by-step deployment instructions.

# 🚀 BEE-SHIP QUICK REFERENCE

## ONE-CLICK DEPLOY
```
Double-click: SHIP_BEE_SWARM_NOW.bat
```
✅ Creates files → Commits → Pushes → Auto-deploys

---

## WHAT YOU GET

### Files Created
- `lib/platforms/instagram.ts` - Instagram publishing ✅
- `lib/platforms/tiktok.ts` - TikTok stub 🔨
- `lib/platforms/youtube.ts` - YouTube stub 🔨  
- `netlify/functions/bee-ship.ts` - Main handler
- `scripts/ship-swarm.ps1` - Bulk publisher

### Deployment Flow
```
Local → GitHub → Netlify → LIVE (2-3 min)
```

---

## REQUIRED SECRETS (Netlify Dashboard)

```env
BEE_API_URL=https://www.adgenxai.pro/api
BEE_API_KEY=your_key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
INSTAGRAM_ACCOUNT_ID=17841xxx
FB_ACCESS_TOKEN=EAABxxx
```

**Set at**: `netlify.com/sites/YOUR_SITE/settings/env`

---

## TEST AFTER DEPLOY

### Single Publish
```powershell
Invoke-RestMethod `
  -Uri "https://YOUR_SITE.netlify.app/.netlify/functions/bee-ship" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"seed":"test","platforms":["instagram"]}'
```

### Bulk Publish (Swarm)
```powershell
.\scripts\ship-swarm.ps1
```

---

## TROUBLESHOOTING

| Issue | Fix |
|-------|-----|
| Instagram publish fails | Check FB_ACCESS_TOKEN permissions |
| Supabase upload fails | Use SERVICE_ROLE_KEY, not anon key |
| Function timeout | Check BEE_API_URL responds < 10s |
| Build fails | Run `npm install @supabase/supabase-js` |

---

## LOGS & MONITORING

```powershell
# Netlify function logs
netlify functions:log bee-ship

# Site status
netlify status

# Supabase storage
# → app.supabase.com/project/YOUR_PROJECT/storage
```

---

## API USAGE

**Endpoint**: `POST /.netlify/functions/bee-ship`

**Body**:
```json
{
  "seed": "campaign-name",
  "platforms": ["instagram"]
}
```

**Response**:
```json
{
  "ok": true,
  "assetUrl": "https://...",
  "results": {
    "instagram": {
      "publishedId": "17xxx"
    }
  }
}
```

---

## PLATFORM STATUS

| Platform | Status | Setup Required |
|----------|--------|----------------|
| Instagram | ✅ Ready | FB app + long-lived token |
| TikTok | 🔨 Stub | Dev account + implementation |
| YouTube | 🔨 Stub | googleapis + OAuth |

---

## INSTAGRAM SETUP (FAST)

1. Create FB app → Instagram product
2. Get page access token (never expires)
3. Get Instagram business account ID
4. Add to Netlify env vars
5. Test!

**Scopes needed**:
- `instagram_basic`
- `instagram_content_publish`

---

## NEXT STEPS

1. ✅ Run `SHIP_BEE_SWARM_NOW.bat`
2. ⏳ Wait 2-3 min for Netlify deploy
3. 🔐 Add secrets in Netlify dashboard
4. 🧪 Test with single publish
5. 🚀 Run swarm mode!

---

## SCRIPTS REFERENCE

```powershell
# Full deployment
.\SHIP_BEE_SWARM_NOW.bat

# Platform modules only
.\create-platforms-simple.ps1

# Bulk publish 4 campaigns
.\scripts\ship-swarm.ps1

# Manual Netlify deploy
netlify deploy --prod
```

---

## SUPPORT

- **Full Guide**: `BEE_SHIP_COMPLETE_GUIDE.md`
- **Netlify Dashboard**: https://app.netlify.com
- **GitHub**: github.com/brandonlacoste9-tech/Beehive

---

**🐝 Ready to ship? Double-click `SHIP_BEE_SWARM_NOW.bat`**

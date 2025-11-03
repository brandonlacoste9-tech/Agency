# 🐝 Bee-Ship Complete Deployment Package

## Quick Start - Run These Commands

```powershell
# Create directory structure
mkdir -p lib\platforms
mkdir -p netlify\functions
mkdir -p scripts
mkdir -p data

# The files below need to be created - copy content from sections below
```

---

## 1️⃣ Platform Modules

### File: `lib/platforms/instagram.ts`

```typescript
// Instagram Graph API publishing helpers (image flow)
export type InstagramConfig = {
  accountId: string;
  accessToken: string;
};

export async function publishImage(
  config: InstagramConfig,
  imageUrl: string,
  caption: string
): Promise<{ containerId: string; publishedId: string }> {
  const { accountId, accessToken } = config;

  const createRes = await fetch(
    `https://graph.facebook.com/v17.0/${accountId}/media`,
    {
      method: "POST",
      body: new URLSearchParams({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      }),
    }
  );

  const createData = await createRes.json();
  if (!createData.id) {
    throw new Error(`Failed to create Instagram media: ${JSON.stringify(createData)}`);
  }

  const publishRes = await fetch(
    `https://graph.facebook.com/v17.0/${accountId}/media_publish`,
    {
      method: "POST",
      body: new URLSearchParams({
        creation_id: createData.id,
        access_token: accessToken,
      }),
    }
  );

  const publishData = await publishRes.json();
  if (!publishData.id) {
    throw new Error(`Failed to publish Instagram media: ${JSON.stringify(publishData)}`);
  }

  return { containerId: createData.id, publishedId: publishData.id };
}
```

### File: `lib/platforms/tiktok.ts`

```typescript
// TikTok Content Posting API stub
export type TikTokConfig = {
  clientKey: string;
  clientSecret: string;
  accessToken: string;
  openId?: string;
};

export async function publishVideo(
  config: TikTokConfig,
  videoUrl: string,
  title: string
): Promise<{ shareId: string }> {
  throw new Error("TikTok publishing not implemented. Add TikTok Content Posting API flow.");
}
```

### File: `lib/platforms/youtube.ts`

```typescript
import fs from "fs";
import os from "os";
import path from "path";
import { google } from "googleapis";

export type YouTubeConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

export async function publishVideo(
  config: YouTubeConfig,
  videoBuffer: Buffer,
  metadata: {
    title: string;
    description?: string;
    tags?: string[];
    privacyStatus?: "public" | "private" | "unlisted";
  }
): Promise<{ videoId: string }> {
  const { clientId, clientSecret, refreshToken } = config;

  const oAuth2 = new google.auth.OAuth2(clientId, clientSecret);
  oAuth2.setCredentials({ refresh_token: refreshToken });

  const youtube = google.youtube({ version: "v3", auth: oAuth2 });

  const tmpDir = os.tmpdir();
  const filename = `upload-${Date.now()}.mp4`;
  const filepath = path.join(tmpDir, filename);
  await fs.promises.writeFile(filepath, videoBuffer);

  try {
    const res = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: metadata.title,
          description: metadata.description || "",
          tags: metadata.tags || [],
        },
        status: {
          privacyStatus: metadata.privacyStatus || "public",
        },
      },
      media: {
        body: fs.createReadStream(filepath),
      },
    });

    const videoId = res.data.id!;
    return { videoId };
  } finally {
    try { await fs.promises.unlink(filepath); } catch (e) { /* ignore */ }
  }
}
```

---

## 2️⃣ Netlify Function - Bee Ship

### File: `netlify/functions/bee-ship.ts`

```typescript
import { createClient } from "@supabase/supabase-js";
import { publishImage as publishInstagram } from "../../lib/platforms/instagram";
import { publishVideo as publishYouTube } from "../../lib/platforms/youtube";
import { publishVideo as publishTikTok } from "../../lib/platforms/tiktok";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BEE_API_URL = process.env.BEE_API_URL!;
const BEE_API_KEY = process.env.BEE_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type CreativeResp = {
  headline?: string;
  caption?: string;
  imageUrl?: string;
  assets?: { filename: string; base64?: string; remoteUrl?: string }[];
};

async function askBeeAgent(seed: string, platforms: string[]): Promise<CreativeResp> {
  const resp = await fetch(`${BEE_API_URL}/agents/creative/run`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${BEE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ seed, platforms }),
  });
  if (!resp.ok) {
    throw new Error(`Bee agent generation failed: ${await resp.text()}`);
  }
  return resp.json();
}

async function uploadToSupabase(buffer: Buffer, path: string, contentType = "image/png") {
  const res = await supabase.storage.from("assets").upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (res.error) throw res.error;
  const pub = supabase.storage.from("assets").getPublicUrl(path);
  return pub.data.publicUrl;
}

export const handler = async (event: any) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const seed = body.seed || "default campaign";
    const platforms: string[] = body.platforms || ["instagram"];

    const creative = await askBeeAgent(seed, platforms);

    let assetUrl = creative.imageUrl || null;
    if (!assetUrl && creative.assets && creative.assets.length > 0) {
      const a = creative.assets[0];
      if (a.base64) {
        const buf = Buffer.from(a.base64, "base64");
        const uploadPath = `bee/${Date.now()}-${a.filename || "asset"}`;
        assetUrl = await uploadToSupabase(buf, uploadPath, "image/png");
      } else if (a.remoteUrl) {
        assetUrl = a.remoteUrl;
      }
    }

    if (!assetUrl) throw new Error("No asset available to publish");

    const results: Record<string, any> = {};
    for (const p of platforms) {
      if (p === "instagram") {
        const IG_ID = process.env.INSTAGRAM_ACCOUNT_ID!;
        const FB_TOKEN = process.env.FB_ACCESS_TOKEN!;
        results.instagram = await publishInstagram(
          { accountId: IG_ID, accessToken: FB_TOKEN },
          assetUrl,
          creative.caption || creative.headline || ""
        );
      } else if (p === "youtube") {
        results.youtube = { note: "YouTube publishing requires video buffer" };
      } else if (p === "tiktok") {
        results.tiktok = { note: "TikTok stub - not implemented" };
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, creative, assetUrl, results }),
    };
  } catch (err: any) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err?.message || String(err) }),
    };
  }
};
```

---

## 3️⃣ Environment Variables

Add these to **Netlify** (Site Settings → Environment Variables):

```env
# Bee Agent
BEE_API_URL=https://www.adgenxai.pro/api
BEE_API_KEY=your_bee_agent_api_key

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Instagram / Facebook
INSTAGRAM_ACCOUNT_ID=your_instagram_account_id
FB_ACCESS_TOKEN=your_long_lived_page_token

# YouTube (optional)
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REFRESH_TOKEN=your_youtube_refresh_token

# TikTok (optional)
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_ACCESS_TOKEN=your_tiktok_access_token
```

---

## 4️⃣ Package.json Dependencies

Add these to your `package.json`:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "googleapis": "^128.0.0"
  }
}
```

---

## 5️⃣ Deploy Commands

```bash
# Install dependencies
npm install

# Create Supabase bucket (in Supabase dashboard)
# 1. Go to Storage
# 2. Create bucket named "assets"
# 3. Set to public if you want public URLs

# Commit and push
git add .
git commit -m "feat(bee): add bee-ship platform integrations"
git push origin main

# Netlify will auto-deploy
```

---

## 6️⃣ Test the Function

```bash
# Local test with Netlify CLI
npx netlify dev

# Test the function
curl -X POST http://localhost:8888/.netlify/functions/bee-ship \
  -H "Content-Type: application/json" \
  -d '{"seed":"test-campaign","platforms":["instagram"]}'

# Production test
curl -X POST https://your-site.netlify.app/.netlify/functions/bee-ship \
  -H "Content-Type: application/json" \
  -d '{"seed":"summer-promo","platforms":["instagram"]}'
```

---

## 7️⃣ Next Steps

1. ✅ Copy all file contents from sections above into your repo
2. ✅ Add environment variables to Netlify
3. ✅ Run `npm install`
4. ✅ Create Supabase "assets" bucket
5. ✅ Commit and push
6. ✅ Test the function
7. ✅ Monitor Netlify function logs

---

## 🎯 Ready to Ship!

Your Bee swarm is ready to autonomously:
- Generate creatives via Bee agents
- Upload assets to Supabase
- Publish to Instagram (and YouTube/TikTok when configured)
- Scale with Netlify's serverless infrastructure

**The future is autonomous. Ship it! 🚀**

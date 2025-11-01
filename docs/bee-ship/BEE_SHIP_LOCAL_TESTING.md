# 🐝 BEE-SHIP Local Testing Guide

How to test your social media posting functions locally before deploying to production.

## 🚀 Quick Start

### 1. Install Netlify CLI

```bash
npm install -g netlify-cli
```

Or install locally in your project:

```bash
npm install --save-dev netlify-cli
```

### 2. Set Up Environment Variables

Create a `.env` file in your project root (already in `.gitignore`):

```bash
# .env
# Instagram
INSTAGRAM_ACCOUNT_ID=your_account_id_here
INSTAGRAM_ACCESS_TOKEN=your_access_token_here

# YouTube
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_REFRESH_TOKEN=your_refresh_token_here

# TikTok (optional)
TIKTOK_CLIENT_KEY=your_client_key_here
TIKTOK_CLIENT_SECRET=your_client_secret_here
TIKTOK_ACCESS_TOKEN=your_access_token_here
```

**⚠️ NEVER commit this file to git!**

### 3. Run Netlify Dev Server

```bash
netlify dev
```

This will:
- Start a local dev server (usually at `http://localhost:8888`)
- Load your environment variables from `.env`
- Run your functions at `http://localhost:8888/.netlify/functions/[function-name]`
- Hot-reload when you make changes

---

## 🎯 Testing Methods

### Option 1: Using VS Code Debugger

You already have the launch configurations set up in `.vscode/launch.json`!

**To debug:**
1. Press `F5` or go to **Run and Debug** panel
2. Select **"netlify dev"** from the dropdown
3. Click the green play button
4. Set breakpoints in your function code
5. Make requests to trigger the functions

### Option 2: Using the Demo HTML Page

1. Start the dev server: `netlify dev`
2. Open: `http://localhost:8888/examples/social-posting-demo.html`
3. Test each platform using the UI

### Option 3: Using cURL

**Test Instagram:**
```bash
curl -X POST http://localhost:8888/.netlify/functions/post-to-instagram \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://picsum.photos/1080",
    "caption": "Test post from local dev!"
  }'
```

**Test YouTube:**
```bash
# First, convert a small test video to base64
VIDEO_BASE64=$(base64 -w 0 test-video.mp4)  # Linux/WSL
# Or on Mac: base64 -i test-video.mp4

curl -X POST http://localhost:8888/.netlify/functions/post-to-youtube \
  -H "Content-Type: application/json" \
  -d "{
    \"videoBase64\": \"$VIDEO_BASE64\",
    \"title\": \"Test Upload from Local\",
    \"privacyStatus\": \"private\"
  }"
```

**Test TikTok (will return not implemented):**
```bash
curl -X POST http://localhost:8888/.netlify/functions/post-to-tiktok \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://example.com/video.mp4",
    "title": "Test TikTok Post"
  }'
```

### Option 4: Using Postman

1. Start dev server: `netlify dev`
2. Create a new request in Postman
3. Set method to `POST`
4. Set URL to `http://localhost:8888/.netlify/functions/[function-name]`
5. Set Headers: `Content-Type: application/json`
6. Set Body (raw JSON) with test data
7. Click **Send**

### Option 5: Using the TypeScript Client

Create a test file:

```typescript
// test-local.ts
import { postToInstagram, postToYouTube } from './examples/social-posting-client';

// Override the base URL for local testing
const LOCAL_BASE = 'http://localhost:8888';

async function testLocal() {
  try {
    // Test Instagram
    console.log('Testing Instagram...');
    const igResult = await fetch(`${LOCAL_BASE}/.netlify/functions/post-to-instagram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: 'https://picsum.photos/1080',
        caption: 'Local test! 🚀'
      })
    });
    console.log('Instagram result:', await igResult.json());

    console.log('Tests complete!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLocal();
```

Run with:
```bash
npx ts-node test-local.ts
```

---

## 🔍 Debugging Tips

### View Function Logs

When running `netlify dev`, you'll see logs in the terminal:

```
◈ Request from ::1: POST /.netlify/functions/post-to-instagram
◈ Response with status 200 in 234 ms.
```

### Check for TypeScript Errors

Build your functions before testing:

```bash
npm run build
# or
tsc
```

### Test Environment Variables

Create a test function to verify your `.env` is loaded:

```typescript
// netlify/functions/test-env.ts
export const handler = async () => ({
  statusCode: 200,
  body: JSON.stringify({
    instagram: !!process.env.INSTAGRAM_ACCESS_TOKEN,
    youtube: !!process.env.YOUTUBE_CLIENT_ID,
    tiktok: !!process.env.TIKTOK_CLIENT_KEY,
    node_version: process.version,
  })
});
```

Test:
```bash
curl http://localhost:8888/.netlify/functions/test-env
```

Should return:
```json
{
  "instagram": true,
  "youtube": true,
  "tiktok": false,
  "node_version": "v18.20.8"
}
```

---

## 🧪 Mock Testing (Without Real API Calls)

To test without actually posting to social media, modify the platform files temporarily:

**Mock Instagram** ([lib/platforms/instagram.ts:9](lib/platforms/instagram.ts#L9)):
```typescript
export async function publishImage(config, imageUrl, caption) {
  // MOCK MODE - Remove this in production!
  console.log('MOCK: Would post to Instagram:', { imageUrl, caption });
  return {
    containerId: 'mock-container-123',
    publishedId: 'mock-published-456'
  };

  // Original code commented out:
  // const { accountId, accessToken } = config;
  // ... rest of implementation
}
```

**Mock YouTube** ([lib/platforms/youtube.ts:15](lib/platforms/youtube.ts#L15)):
```typescript
export async function publishVideo(config, videoBuffer, metadata) {
  // MOCK MODE - Remove this in production!
  console.log('MOCK: Would upload to YouTube:', {
    title: metadata.title,
    size: videoBuffer.length,
  });
  return { videoId: 'mock-video-xyz789' };

  // Original code commented out:
  // ... rest of implementation
}
```

---

## 📦 Project Structure

```
AdGenXAI/
├── .env                              # Local environment variables (DO NOT COMMIT)
├── .vscode/
│   └── launch.json                   # VS Code debugger config
├── lib/
│   └── platforms/
│       ├── instagram.ts              # Instagram platform module
│       ├── youtube.ts                # YouTube platform module
│       └── tiktok.ts                 # TikTok platform module (stub)
├── netlify/
│   └── functions/
│       ├── post-to-instagram.ts      # Instagram function
│       ├── post-to-youtube.ts        # YouTube function
│       └── post-to-tiktok.ts         # TikTok function
├── examples/
│   ├── social-posting-client.ts      # TypeScript client library
│   └── social-posting-demo.html      # Interactive demo page
└── BEE_SHIP_API_DOCS.md             # API documentation
```

---

## 🚨 Common Issues

### "Module not found" errors

```bash
npm install googleapis @supabase/supabase-js @netlify/functions
```

### Environment variables not loading

1. Make sure `.env` is in the project root
2. Restart `netlify dev` after changing `.env`
3. Check `.env` file format (no quotes needed usually)

### Functions not found (404)

1. Make sure TypeScript is compiled: `npm run build`
2. Check function file name matches URL
3. Ensure function exports a `handler`

### CORS errors in browser

Add CORS headers to your functions:

```typescript
return {
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
  body: JSON.stringify(data)
};
```

---

## ✅ Pre-Deploy Checklist

Before pushing to production:

- [ ] All TypeScript compiles without errors (`npm run build`)
- [ ] Environment variables added to Netlify dashboard
- [ ] Functions tested locally with real API credentials
- [ ] Removed any mock/debug code
- [ ] Error handling works as expected
- [ ] API rate limits considered
- [ ] Security: No secrets exposed in code
- [ ] Documentation updated if needed

---

## 🎓 Learn More

- [Netlify Dev Docs](https://docs.netlify.com/cli/local-development/)
- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)

---

**Happy local testing!** 🐝🧪

# 🐝 BEE-SHIP API Documentation

Complete guide to using the AdGenXAI autonomous social publishing platform.

## 📋 Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [API Endpoints](#api-endpoints)
- [Frontend Integration](#frontend-integration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

BEE-SHIP provides serverless functions for publishing content to social media platforms:

- **Instagram**: Post images with captions
- **YouTube**: Upload videos with metadata
- **TikTok**: Post videos (coming soon)

All functions are deployed as Netlify serverless functions accessible at:
```
https://yourdomain.com/.netlify/functions/[function-name]
```

---

## Setup

### 1. Install Dependencies

The platform requires the following npm packages:

```bash
npm install googleapis @supabase/supabase-js @netlify/functions
```

### 2. Configure Environment Variables

Add these to your Netlify dashboard ([Settings > Environment Variables](https://app.netlify.com/sites/adgenxai/settings/deploys#environment)):

#### Instagram
```env
INSTAGRAM_ACCOUNT_ID=your_instagram_business_account_id
INSTAGRAM_ACCESS_TOKEN=your_facebook_graph_api_token
```

**How to get credentials:**
1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com)
2. Add Instagram Graph API product
3. Get a User Access Token with `instagram_basic`, `instagram_content_publish` permissions
4. Get your Instagram Business Account ID

#### YouTube
```env
YOUTUBE_CLIENT_ID=your_google_oauth_client_id
YOUTUBE_CLIENT_SECRET=your_google_oauth_client_secret
YOUTUBE_REFRESH_TOKEN=your_oauth_refresh_token
```

**How to get credentials:**
1. Create a project at [Google Cloud Console](https://console.cloud.google.com)
2. Enable YouTube Data API v3
3. Create OAuth 2.0 credentials
4. Use OAuth Playground to get refresh token with `https://www.googleapis.com/auth/youtube.upload` scope

#### TikTok (Optional - not yet implemented)
```env
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_ACCESS_TOKEN=your_tiktok_access_token
TIKTOK_OPEN_ID=your_tiktok_open_id
```

---

## API Endpoints

### 1. POST /post-to-instagram

Publish an image to Instagram.

**Endpoint:**
```
POST /.netlify/functions/post-to-instagram
```

**Request Body:**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "caption": "Check out this amazing content! 🚀 #adgenxai"
}
```

**Requirements:**
- `imageUrl`: Must be a publicly accessible URL
- Image must be JPG or PNG format
- Recommended size: 1080x1080px (square) or 1080x1350px (portrait)

**Response (Success - 200):**
```json
{
  "success": true,
  "platform": "instagram",
  "containerId": "17234567890",
  "publishedId": "17987654321",
  "message": "Successfully published to Instagram"
}
```

**Response (Error - 400/500):**
```json
{
  "error": "Missing required fields: imageUrl and caption"
}
```

---

### 2. POST /post-to-youtube

Upload a video to YouTube.

**Endpoint:**
```
POST /.netlify/functions/post-to-youtube
```

**Request Body:**
```json
{
  "videoBase64": "base64_encoded_video_content",
  "title": "My Awesome Video Title",
  "description": "This is an amazing video",
  "tags": ["adgenxai", "automation", "ai"],
  "privacyStatus": "public"
}
```

**Parameters:**
- `videoBase64` (required): Base64-encoded video file
- `title` (required): Video title (max 100 characters)
- `description` (optional): Video description
- `tags` (optional): Array of tags
- `privacyStatus` (optional): "public", "private", or "unlisted" (default: "public")

**Response (Success - 200):**
```json
{
  "success": true,
  "platform": "youtube",
  "videoId": "dQw4w9WgXcQ",
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "message": "Successfully uploaded to YouTube"
}
```

**Response (Error - 400/500):**
```json
{
  "error": "Failed to upload to YouTube",
  "details": "Invalid credentials"
}
```

**Notes:**
- Maximum file size: ~100MB (Netlify function limit)
- Supported formats: MP4, MOV, AVI, WMV
- Processing may take several minutes for large files

---

### 3. POST /post-to-tiktok

Publish a video to TikTok.

**Endpoint:**
```
POST /.netlify/functions/post-to-tiktok
```

**Status:** ⚠️ Not yet implemented

**Request Body:**
```json
{
  "videoUrl": "https://example.com/video.mp4",
  "title": "Amazing content!"
}
```

**Response (501):**
```json
{
  "error": "TikTok publishing not yet implemented",
  "details": "The TikTok Content Posting API integration needs to be completed"
}
```

---

## Frontend Integration

### Option 1: Using Fetch API

```javascript
// Post to Instagram
async function postToInstagram(imageUrl, caption) {
  const response = await fetch('/.netlify/functions/post-to-instagram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl, caption })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Upload to YouTube
async function uploadToYouTube(videoFile, title, options = {}) {
  // Convert file to base64
  const videoBase64 = await fileToBase64(videoFile);

  const response = await fetch('/.netlify/functions/post-to-youtube', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      videoBase64,
      title,
      description: options.description || '',
      tags: options.tags || [],
      privacyStatus: options.privacyStatus || 'public'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Helper: Convert File to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### Option 2: Using the Client Library

Import the pre-built client from `examples/social-posting-client.ts`:

```typescript
import { postToInstagram, postToYouTube, postToTikTok } from './examples/social-posting-client';

// Instagram
const igResult = await postToInstagram(
  'https://example.com/image.jpg',
  'My caption 🚀'
);

// YouTube
const videoFile = document.querySelector('input[type="file"]').files[0];
const ytResult = await postToYouTube(videoFile, 'Video Title', {
  description: 'Video description',
  tags: ['tag1', 'tag2'],
  privacyStatus: 'public'
});
```

---

## Testing

### 1. Using the Demo Page

Open `examples/social-posting-demo.html` in your browser after deploying:

```
https://yourdomain.com/examples/social-posting-demo.html
```

The demo provides a UI to test all three platforms.

### 2. Using cURL

**Instagram:**
```bash
curl -X POST https://yourdomain.com/.netlify/functions/post-to-instagram \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://picsum.photos/1080",
    "caption": "Test post from cURL!"
  }'
```

**YouTube:**
```bash
# First, convert your video to base64
VIDEO_BASE64=$(base64 -i video.mp4)

curl -X POST https://yourdomain.com/.netlify/functions/post-to-youtube \
  -H "Content-Type: application/json" \
  -d "{
    \"videoBase64\": \"$VIDEO_BASE64\",
    \"title\": \"Test Upload\",
    \"privacyStatus\": \"private\"
  }"
```

### 3. Using Postman

1. Create a new POST request
2. Set URL to `https://yourdomain.com/.netlify/functions/[function-name]`
3. Set Headers: `Content-Type: application/json`
4. Set Body (raw JSON) with required fields
5. Click Send

---

## Troubleshooting

### Common Errors

#### "Instagram credentials not configured"
- **Solution**: Add `INSTAGRAM_ACCOUNT_ID` and `INSTAGRAM_ACCESS_TOKEN` to Netlify environment variables
- Restart your deployment after adding variables

#### "Failed to create Instagram media"
- **Cause**: Image URL is not publicly accessible
- **Solution**: Ensure the image URL returns a valid image when accessed in a browser
- Use HTTPS URLs only

#### "YouTube credentials not configured"
- **Solution**: Add all three YouTube environment variables (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN)
- Make sure to use a refresh token, not an access token

#### "Failed to upload to YouTube: Invalid credentials"
- **Cause**: Refresh token expired or invalid
- **Solution**: Generate a new refresh token using OAuth Playground

#### Function timeout
- **Cause**: Large video files take too long to upload
- **Solution**: Compress videos before uploading, or increase Netlify function timeout (Pro plan)

### Testing Environment Variables

Create a test function to verify your variables are set:

```typescript
// netlify/functions/test-env.ts
export const handler = async () => ({
  statusCode: 200,
  body: JSON.stringify({
    instagram: !!process.env.INSTAGRAM_ACCESS_TOKEN,
    youtube: !!process.env.YOUTUBE_CLIENT_ID,
    tiktok: !!process.env.TIKTOK_CLIENT_KEY,
  })
});
```

Access at: `/.netlify/functions/test-env`

### Debug Mode

Check Netlify function logs for detailed error messages:
1. Go to Netlify Dashboard
2. Click on your site
3. Navigate to **Functions** tab
4. Click on the function name
5. View recent invocations and logs

---

## Rate Limits

### Instagram
- 25 API calls per user per hour
- 200 API calls per user per day

### YouTube
- 10,000 quota units per day
- 1 video upload = 1,600 units

### TikTok
- TBD (not yet implemented)

---

## Security Best Practices

1. **Never expose environment variables** to the frontend
2. **Validate all inputs** on the server side
3. **Implement authentication** before allowing uploads
4. **Rate limit** your functions to prevent abuse
5. **Use HTTPS** for all image/video URLs
6. **Rotate access tokens** regularly

---

## Support

- **Documentation**: See `BEE_SHIP_*.md` files
- **Issues**: Check Netlify function logs
- **Platform-specific docs**:
  - [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
  - [YouTube Data API](https://developers.google.com/youtube/v3)
  - [TikTok Content Posting API](https://developers.tiktok.com)

---

**Built with ❤️ using AdGenXAI BEE-SHIP Platform** 🐝

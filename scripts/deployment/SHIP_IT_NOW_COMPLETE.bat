@echo off
REM BEE-SHIP COMPLETE DEPLOYMENT PACKAGE
REM This creates ALL platform files and prepares for deployment

echo.
echo ========================================================
echo    BEE-SHIP: Complete Deployment Package Creator
echo ========================================================
echo.

REM Create lib\platforms directory
if not exist lib\platforms mkdir lib\platforms
echo Created lib\platforms directory

echo.
echo Creating platform integration files...
echo.

REM ========== INSTAGRAM.TS ==========
echo Creating instagram.ts...
(
echo // lib/platforms/instagram.ts
echo // Instagram Graph API publishing helpers
echo.
echo export type InstagramConfig = {
echo   accountId: string;
echo   accessToken: string;
echo };
echo.
echo export async function publishImage^(
echo   config: InstagramConfig,
echo   imageUrl: string,
echo   caption: string
echo ^): Promise^<{ containerId: string; publishedId: string }^> {
echo   const { accountId, accessToken } = config;
echo.
echo   const createRes = await fetch^(
echo     `https://graph.facebook.com/v17.0/${ accountId}/media`,
echo     {
echo       method: "POST",
echo       body: new URLSearchParams^({
echo         image_url: imageUrl,
echo         caption,
echo         access_token: accessToken,
echo       }^),
echo     }
echo   ^);
echo.
echo   const createData = await createRes.json^(^);
echo   if ^(!createData.id^) {
echo     throw new Error^(`Failed to create Instagram media: ${ JSON.stringify^(createData^)}`^);
echo   }
echo.
echo   const publishRes = await fetch^(
echo     `https://graph.facebook.com/v17.0/${ accountId}/media_publish`,
echo     {
echo       method: "POST",
echo       body: new URLSearchParams^({
echo         creation_id: createData.id,
echo         access_token: accessToken,
echo       }^),
echo     }
echo   ^);
echo.
echo   const publishData = await publishRes.json^(^);
echo   if ^(!publishData.id^) {
echo     throw new Error^(`Failed to publish Instagram media: ${ JSON.stringify^(publishData^)}`^);
echo   }
echo.
echo   return { containerId: createData.id, publishedId: publishData.id };
echo }
) > lib\platforms\instagram.ts

REM ========== TIKTOK.TS ==========
echo Creating tiktok.ts...
(
echo // lib/platforms/tiktok.ts
echo // TikTok Content Posting API stub
echo.
echo export type TikTokConfig = {
echo   clientKey: string;
echo   clientSecret: string;
echo   accessToken: string;
echo   openId?: string;
echo };
echo.
echo export async function publishVideo^(
echo   config: TikTokConfig,
echo   videoUrl: string,
echo   title: string
echo ^): Promise^<{ shareId: string }^> {
echo   throw new Error^("TikTok publishing not implemented. Add TikTok Content Posting API flow."^);
echo }
) > lib\platforms\tiktok.ts

REM ========== YOUTUBE.TS (simplified version) ==========
echo Creating youtube.ts...
(
echo // lib/platforms/youtube.ts
echo // YouTube Data API v3 publish helper
echo.
echo import fs from "fs";
echo import os from "os";
echo import path from "path";
echo import { google } from "googleapis";
echo.
echo export type YouTubeConfig = {
echo   clientId: string;
echo   clientSecret: string;
echo   refreshToken: string;
echo };
echo.
echo export async function publishVideo^(
echo   config: YouTubeConfig,
echo   videoBuffer: Buffer,
echo   metadata: {
echo     title: string;
echo     description?: string;
echo     tags?: string[];
echo     privacyStatus?: "public" ^| "private" ^| "unlisted";
echo   }
echo ^): Promise^<{ videoId: string }^> {
echo   const { clientId, clientSecret, refreshToken } = config;
echo   const oAuth2 = new google.auth.OAuth2^(clientId, clientSecret^);
echo   oAuth2.setCredentials^({ refresh_token: refreshToken }^);
echo   const youtube = google.youtube^({ version: "v3", auth: oAuth2 }^);
echo   const tmpDir = os.tmpdir^(^);
echo   const filename = `upload-${ Date.now^(^)}.mp4`;
echo   const filepath = path.join^(tmpDir, filename^);
echo   await fs.promises.writeFile^(filepath, videoBuffer^);
echo   try {
echo     const res = await youtube.videos.insert^({
echo       part: ["snippet", "status"],
echo       requestBody: {
echo         snippet: {
echo           title: metadata.title,
echo           description: metadata.description ^|^| "",
echo           tags: metadata.tags ^|^| [],
echo         },
echo         status: { privacyStatus: metadata.privacyStatus ^|^| "public" },
echo       },
echo       media: { body: fs.createReadStream^(filepath^) },
echo     }^);
echo     return { videoId: res.data.id! };
echo   } finally {
echo     try { await fs.promises.unlink^(filepath^); } catch ^(e^) { }
echo   }
echo }
) > lib\platforms\youtube.ts

echo.
echo ========================================================
echo    SUCCESS! All platform files created
echo ========================================================
echo.
echo Files created:
echo   - lib\platforms\instagram.ts
echo   - lib\platforms\tiktok.ts  
echo   - lib\platforms\youtube.ts
echo.
echo Next steps:
echo.
echo 1. Install dependencies:
echo    npm install googleapis @supabase/supabase-js @netlify/functions
echo.
echo 2. Set Netlify environment variables
echo    (See BEE_SHIP_DEPLOYMENT_COMPLETE.md^)
echo.
echo 3. Run deployment check:
echo    powershell -File deploy-bee-ship-final.ps1
echo.
echo 4. Commit and push:
echo    git add lib/platforms/*.ts
echo    git commit -m "feat(bee): add bee-ship platform modules"
echo    git push origin main
echo.
echo The swarm is ready to fly! 🐝
echo.
pause

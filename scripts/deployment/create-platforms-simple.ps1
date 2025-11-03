#!/usr/bin/env powershell
# create-platforms-simple.ps1 - Works with Windows PowerShell 5.1+

Write-Host "Creating platform modules..." -ForegroundColor Green

# Create directory
$platformDir = "lib\platforms"
if (!(Test-Path $platformDir)) {
    New-Item -ItemType Directory -Path $platformDir -Force | Out-Null
    Write-Host "Created directory: $platformDir" -ForegroundColor Cyan
}

# Instagram module
$instagramContent = @'
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
'@

Set-Content -Path "$platformDir\instagram.ts" -Value $instagramContent -Encoding UTF8
Write-Host "✅ Created instagram.ts" -ForegroundColor Green

# TikTok stub
$tiktokContent = @'
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
'@

Set-Content -Path "$platformDir\tiktok.ts" -Value $tiktokContent -Encoding UTF8
Write-Host "✅ Created tiktok.ts" -ForegroundColor Green

# YouTube module
$youtubeContent = @'
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
    try { await fs.promises.unlink(filepath); } catch (e) { }
  }
}
'@

Set-Content -Path "$platformDir\youtube.ts" -Value $youtubeContent -Encoding UTF8
Write-Host "✅ Created youtube.ts" -ForegroundColor Green

Write-Host "`n🎉 Platform modules created successfully!" -ForegroundColor Yellow
Write-Host "Location: $platformDir" -ForegroundColor Cyan
Get-ChildItem -Path $platformDir | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor White
}

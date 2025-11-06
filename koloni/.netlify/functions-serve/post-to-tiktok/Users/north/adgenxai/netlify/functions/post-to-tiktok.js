"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../netlify/functions/post-to-tiktok.ts
var post_to_tiktok_exports = {};
__export(post_to_tiktok_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(post_to_tiktok_exports);

// ../lib/platforms/tiktok.ts
async function publishVideo(config, videoUrl, title) {
  throw new Error("TikTok publishing not implemented. Add TikTok Content Posting API flow.");
}

// ../netlify/functions/post-to-tiktok.ts
var handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed. Use POST." })
    };
  }
  try {
    const body = JSON.parse(event.body || "{}");
    const { videoUrl, title } = body;
    if (!videoUrl || !title) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing required fields: videoUrl and title"
        })
      };
    }
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
    const openId = process.env.TIKTOK_OPEN_ID;
    if (!clientKey || !clientSecret || !accessToken) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "TikTok credentials not configured. Set TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, and TIKTOK_ACCESS_TOKEN environment variables."
        })
      };
    }
    const result = await publishVideo(
      { clientKey, clientSecret, accessToken, openId },
      videoUrl,
      title
    );
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        platform: "tiktok",
        shareId: result.shareId,
        message: "Successfully published to TikTok"
      })
    };
  } catch (error) {
    console.error("TikTok posting error:", error);
    if (error.message.includes("not implemented")) {
      return {
        statusCode: 501,
        body: JSON.stringify({
          error: "TikTok publishing not yet implemented",
          details: "The TikTok Content Posting API integration needs to be completed. See lib/platforms/tiktok.ts"
        })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to post to TikTok",
        details: error.message
      })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=post-to-tiktok.js.map

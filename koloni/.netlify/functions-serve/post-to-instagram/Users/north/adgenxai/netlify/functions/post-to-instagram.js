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

// ../netlify/functions/post-to-instagram.ts
var post_to_instagram_exports = {};
__export(post_to_instagram_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(post_to_instagram_exports);

// ../lib/platforms/instagram.ts
async function publishImage(config, imageUrl, caption) {
  const { accountId, accessToken } = config;
  const createRes = await fetch(
    `https://graph.facebook.com/v17.0/${accountId}/media`,
    {
      method: "POST",
      body: new URLSearchParams({
        image_url: imageUrl,
        caption,
        access_token: accessToken
      })
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
        access_token: accessToken
      })
    }
  );
  const publishData = await publishRes.json();
  if (!publishData.id) {
    throw new Error(`Failed to publish Instagram media: ${JSON.stringify(publishData)}`);
  }
  return { containerId: createData.id, publishedId: publishData.id };
}

// ../netlify/functions/post-to-instagram.ts
var handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed. Use POST." })
    };
  }
  try {
    const body = JSON.parse(event.body || "{}");
    const { imageUrl, caption } = body;
    if (!imageUrl || !caption) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing required fields: imageUrl and caption"
        })
      };
    }
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!accountId || !accessToken) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Instagram credentials not configured. Set INSTAGRAM_ACCOUNT_ID and INSTAGRAM_ACCESS_TOKEN environment variables."
        })
      };
    }
    const result = await publishImage(
      { accountId, accessToken },
      imageUrl,
      caption
    );
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        platform: "instagram",
        containerId: result.containerId,
        publishedId: result.publishedId,
        message: "Successfully published to Instagram"
      })
    };
  } catch (error) {
    console.error("Instagram posting error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to post to Instagram",
        details: error.message
      })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=post-to-instagram.js.map

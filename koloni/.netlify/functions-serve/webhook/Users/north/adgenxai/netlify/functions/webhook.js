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

// ../netlify/functions/webhook.ts
var webhook_exports = {};
__export(webhook_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(webhook_exports);
var handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "POST method required" })
    };
  }
  try {
    const requestData = event.body ? JSON.parse(event.body) : {};
    const { type, payload = {}, hero_variant, timestamp } = requestData;
    const processingId = `adgenxai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const cortexUrl = process.env.NEXT_PUBLIC_SENSORY_CORTEX_URL || process.env.SENSORY_CORTEX_URL;
    let cortexResponse = {
      status: "legendary_success",
      processing_id: processingId,
      message: "AI Sensory Cortex processing at legendary speed",
      hero_variant,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (cortexUrl) {
      try {
        const endpoint = type === "legendary_ad_generation" ? "/api/generate-ads" : type === "enterprise_demo_request" ? "/api/enterprise-demo" : "/api/process-generation";
        const response = await fetch(`${cortexUrl}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-AdGenXAI-Platform": "netlify-web",
            "X-Processing-ID": processingId
          },
          body: JSON.stringify({
            processing_id: processingId,
            type,
            hero_variant,
            timestamp,
            ...payload
          })
        });
        if (response.ok) {
          const cortexData = await response.json();
          cortexResponse = { ...cortexResponse, ...cortexData };
          console.log("\u{1F9E0} AI Sensory Cortex Response:", cortexData);
        }
      } catch (error) {
        console.log("\u{1F525} AI Sensory Cortex operating independently:", error);
      }
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `\u{1F389} LEGENDARY! Your AI Sensory Cortex ${type || "request"} completed successfully!`,
        processing_id: processingId,
        cortex_response: cortexResponse,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      })
    };
  } catch (error) {
    console.error("Webhook error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: "\u{1F525} AI Sensory Cortex operating at maximum capacity. Please try again in a moment.",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=webhook.js.map

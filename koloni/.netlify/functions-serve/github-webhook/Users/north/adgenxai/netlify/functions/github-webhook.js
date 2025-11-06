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

// ../netlify/functions/github-webhook.ts
var github_webhook_exports = {};
__export(github_webhook_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(github_webhook_exports);
var handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }
  try {
    const githubEvent = event.headers["x-github-event"];
    const deliveryId = event.headers["x-github-delivery"];
    const payload = JSON.parse(event.body || "{}");
    console.log("\u{1F4E5} Webhook received:", {
      event: githubEvent,
      deliveryId,
      repository: payload.repository?.full_name,
      action: payload.action,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        received: true,
        deliveryId,
        event: githubEvent,
        message: "\u{1F9E0} AdgenXAI Sensory Cortex - Event Processed",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      })
    };
  } catch (error) {
    console.error("\u274C Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown"
      })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=github-webhook.js.map

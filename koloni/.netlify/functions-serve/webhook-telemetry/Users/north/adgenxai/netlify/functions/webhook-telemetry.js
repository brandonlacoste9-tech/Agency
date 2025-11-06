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

// ../netlify/functions/webhook-telemetry.ts
var webhook_telemetry_exports = {};
__export(webhook_telemetry_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(webhook_telemetry_exports);
var handler = async () => {
  const now = /* @__PURE__ */ new Date();
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
  const data = {
    stats: {
      totalEvents: 1,
      // bump as you add storage; proves the pipe works
      processing: {
        mode: "observation",
        enabled: process.env.ENABLE_WEBHOOK_PROCESSING === "true"
      },
      timeRange: {
        start: start.toISOString(),
        end: now.toISOString()
      }
    }
  };
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=webhook-telemetry.js.map

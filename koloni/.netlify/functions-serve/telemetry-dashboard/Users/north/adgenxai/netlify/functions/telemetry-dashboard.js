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

// ../netlify/functions/telemetry-dashboard.ts
var telemetry_dashboard_exports = {};
__export(telemetry_dashboard_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(telemetry_dashboard_exports);
var handler = async () => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>AdgenXAI Sensory Cortex</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 800px;
      padding: 3rem;
    }
    h1 { font-size: 2.5rem; color: #333; margin-bottom: 1rem; }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #e8f5e9;
      border: 2px solid #4caf50;
      border-radius: 8px;
      color: #2e7d32;
      font-weight: 600;
      margin: 1.5rem 0;
    }
    .pulse {
      width: 12px;
      height: 12px;
      background: #4caf50;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .section {
      background: #f5f5f5;
      border-radius: 12px;
      padding: 1.5rem;
      margin: 1.5rem 0;
    }
    .section h2 { font-size: 1.3rem; margin-bottom: 1rem; color: #555; }
    code {
      background: #e0e0e0;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-family: monospace;
    }
    ul { margin-left: 2rem; line-height: 1.8; }
    a { color: #667eea; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <h1>\u{1F9E0} AdgenXAI Sensory Cortex</h1>
    <div class="status"><div class="pulse"></div>System Online</div>
    <div class="section">
      <h2>\u{1F4E1} Webhook Receiver</h2>
      <p>Ready to process GitHub events in real-time.</p>
      <p style="margin-top:1rem"><code>/.netlify/functions/github-webhook</code></p>
    </div>
    <div class="section">
      <h2>\u{1F517} Setup</h2>
      <ol style="margin-left:2rem;line-height:1.8">
        <li>Go to repository settings</li>
        <li>Add webhook</li>
        <li>Paste function URL</li>
        <li>Select events</li>
        <li>Save!</li>
      </ol>
    </div>
    <div style="text-align:center;margin-top:2rem;color:#999">
        <p>Generated: ${(/* @__PURE__ */ new Date()).toISOString()}</p>
      </div>
    </div>
  </body>
  </html>
  `;
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: html
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=telemetry-dashboard.js.map

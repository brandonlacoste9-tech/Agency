
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// ../.netlify/functions-internal/official-launchdarkly_edge-config-test.mts
var edge_config_test_default = async (req) => {
  const requestKey = req.headers.get("Authorization")?.split(" ")[1];
  const sharedKey = Netlify.env.get("LAUNCHDARKLY_SHARED_SECRET");
  if (sharedKey === void 0 || sharedKey === "" || requestKey !== sharedKey) {
    return new Response("Authorization missing.", { status: 401 });
  }
  return new Response(JSON.stringify({ success: true }));
};
var config = {
  method: "GET",
  path: "/.official-launchdarkly/edge-config-test"
};
export {
  config,
  edge_config_test_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLm5ldGxpZnkvZnVuY3Rpb25zLWludGVybmFsL29mZmljaWFsLWxhdW5jaGRhcmtseV9lZGdlLWNvbmZpZy10ZXN0Lm10cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gc3JjL2Z1bmN0aW9ucy9lZGdlLWNvbmZpZy10ZXN0Lm10c1xudmFyIGVkZ2VfY29uZmlnX3Rlc3RfZGVmYXVsdCA9IGFzeW5jIChyZXEpID0+IHtcbiAgY29uc3QgcmVxdWVzdEtleSA9IHJlcS5oZWFkZXJzLmdldChcIkF1dGhvcml6YXRpb25cIik/LnNwbGl0KFwiIFwiKVsxXTtcbiAgY29uc3Qgc2hhcmVkS2V5ID0gTmV0bGlmeS5lbnYuZ2V0KFwiTEFVTkNIREFSS0xZX1NIQVJFRF9TRUNSRVRcIik7XG4gIGlmIChzaGFyZWRLZXkgPT09IHZvaWQgMCB8fCBzaGFyZWRLZXkgPT09IFwiXCIgfHwgcmVxdWVzdEtleSAhPT0gc2hhcmVkS2V5KSB7XG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZShcIkF1dGhvcml6YXRpb24gbWlzc2luZy5cIiwgeyBzdGF0dXM6IDQwMSB9KTtcbiAgfVxuICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSB9KSk7XG59O1xudmFyIGNvbmZpZyA9IHtcbiAgbWV0aG9kOiBcIkdFVFwiLFxuICBwYXRoOiBcIi8ub2ZmaWNpYWwtbGF1bmNoZGFya2x5L2VkZ2UtY29uZmlnLXRlc3RcIlxufTtcbmV4cG9ydCB7XG4gIGNvbmZpZyxcbiAgZWRnZV9jb25maWdfdGVzdF9kZWZhdWx0IGFzIGRlZmF1bHRcbn07XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7O0FBQ0EsSUFBSSwyQkFBMkIsT0FBTyxRQUFRO0FBQzVDLFFBQU0sYUFBYSxJQUFJLFFBQVEsSUFBSSxlQUFlLEdBQUcsTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUNqRSxRQUFNLFlBQVksUUFBUSxJQUFJLElBQUksNEJBQTRCO0FBQzlELE1BQUksY0FBYyxVQUFVLGNBQWMsTUFBTSxlQUFlLFdBQVc7QUFDeEUsV0FBTyxJQUFJLFNBQVMsMEJBQTBCLEVBQUUsUUFBUSxJQUFJLENBQUM7QUFBQSxFQUMvRDtBQUNBLFNBQU8sSUFBSSxTQUFTLEtBQUssVUFBVSxFQUFFLFNBQVMsS0FBSyxDQUFDLENBQUM7QUFDdkQ7QUFDQSxJQUFJLFNBQVM7QUFBQSxFQUNYLFFBQVE7QUFBQSxFQUNSLE1BQU07QUFDUjsiLAogICJuYW1lcyI6IFtdCn0K

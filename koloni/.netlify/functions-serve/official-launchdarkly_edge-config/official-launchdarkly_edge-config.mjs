
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// ../.netlify/functions-internal/official-launchdarkly_edge-config.mts
var NF_ERROR = "x-nf-error";
var NF_REQUEST_ID = "x-nf-request-id";
var BlobsInternalError = class extends Error {
  constructor(res) {
    let details = res.headers.get(NF_ERROR) || `${res.status} status code`;
    if (res.headers.has(NF_REQUEST_ID)) {
      details += `, ID: ${res.headers.get(NF_REQUEST_ID)}`;
    }
    super(`Netlify Blobs has generated an internal error (${details})`);
    this.name = "BlobsInternalError";
  }
};
var collectIterator = async (iterator) => {
  const result = [];
  for await (const item of iterator) {
    result.push(item);
  }
  return result;
};
var base64Decode = (input) => {
  const { Buffer } = globalThis;
  if (Buffer) {
    return Buffer.from(input, "base64").toString();
  }
  return atob(input);
};
var base64Encode = (input) => {
  const { Buffer } = globalThis;
  if (Buffer) {
    return Buffer.from(input).toString("base64");
  }
  return btoa(input);
};
var getEnvironment = () => {
  const { Deno, Netlify: Netlify2, process } = globalThis;
  return Netlify2?.env ?? Deno?.env ?? {
    delete: (key) => delete process?.env[key],
    get: (key) => process?.env[key],
    has: (key) => Boolean(process?.env[key]),
    set: (key, value) => {
      if (process?.env) {
        process.env[key] = value;
      }
    },
    toObject: () => process?.env ?? {}
  };
};
var getEnvironmentContext = () => {
  const context = globalThis.netlifyBlobsContext || getEnvironment().get("NETLIFY_BLOBS_CONTEXT");
  if (typeof context !== "string" || !context) {
    return {};
  }
  const data = base64Decode(context);
  try {
    return JSON.parse(data);
  } catch {
  }
  return {};
};
var MissingBlobsEnvironmentError = class extends Error {
  constructor(requiredProperties) {
    super(
      `The environment has not been configured to use Netlify Blobs. To use it manually, supply the following properties when creating a store: ${requiredProperties.join(
        ", "
      )}`
    );
    this.name = "MissingBlobsEnvironmentError";
  }
};
var BASE64_PREFIX = "b64;";
var METADATA_HEADER_INTERNAL = "x-amz-meta-user";
var METADATA_HEADER_EXTERNAL = "netlify-blobs-metadata";
var METADATA_MAX_SIZE = 2 * 1024;
var encodeMetadata = (metadata) => {
  if (!metadata) {
    return null;
  }
  const encodedObject = base64Encode(JSON.stringify(metadata));
  const payload = `b64;${encodedObject}`;
  if (METADATA_HEADER_EXTERNAL.length + payload.length > METADATA_MAX_SIZE) {
    throw new Error("Metadata object exceeds the maximum size");
  }
  return payload;
};
var decodeMetadata = (header) => {
  if (!header || !header.startsWith(BASE64_PREFIX)) {
    return {};
  }
  const encodedData = header.slice(BASE64_PREFIX.length);
  const decodedData = base64Decode(encodedData);
  const metadata = JSON.parse(decodedData);
  return metadata;
};
var getMetadataFromResponse = (response) => {
  if (!response.headers) {
    return {};
  }
  const value = response.headers.get(METADATA_HEADER_EXTERNAL) || response.headers.get(METADATA_HEADER_INTERNAL);
  try {
    return decodeMetadata(value);
  } catch {
    throw new Error(
      "An internal error occurred while trying to retrieve the metadata for an entry. Please try updating to the latest version of the Netlify Blobs client."
    );
  }
};
var BlobsConsistencyError = class extends Error {
  constructor() {
    super(
      `Netlify Blobs has failed to perform a read using strong consistency because the environment has not been configured with a 'uncachedEdgeURL' property`
    );
    this.name = "BlobsConsistencyError";
  }
};
var regions = {
  "us-east-1": true,
  "us-east-2": true
};
var isValidRegion = (input) => Object.keys(regions).includes(input);
var InvalidBlobsRegionError = class extends Error {
  constructor(region) {
    super(
      `${region} is not a supported Netlify Blobs region. Supported values are: ${Object.keys(regions).join(", ")}.`
    );
    this.name = "InvalidBlobsRegionError";
  }
};
var DEFAULT_RETRY_DELAY = getEnvironment().get("NODE_ENV") === "test" ? 1 : 5e3;
var MIN_RETRY_DELAY = 1e3;
var MAX_RETRY = 5;
var RATE_LIMIT_HEADER = "X-RateLimit-Reset";
var fetchAndRetry = async (fetch, url, options, attemptsLeft = MAX_RETRY) => {
  try {
    const res = await fetch(url, options);
    if (attemptsLeft > 0 && (res.status === 429 || res.status >= 500)) {
      const delay = getDelay(res.headers.get(RATE_LIMIT_HEADER));
      await sleep(delay);
      return fetchAndRetry(fetch, url, options, attemptsLeft - 1);
    }
    return res;
  } catch (error) {
    if (attemptsLeft === 0) {
      throw error;
    }
    const delay = getDelay();
    await sleep(delay);
    return fetchAndRetry(fetch, url, options, attemptsLeft - 1);
  }
};
var getDelay = (rateLimitReset) => {
  if (!rateLimitReset) {
    return DEFAULT_RETRY_DELAY;
  }
  return Math.max(Number(rateLimitReset) * 1e3 - Date.now(), MIN_RETRY_DELAY);
};
var sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});
var SIGNED_URL_ACCEPT_HEADER = "application/json;type=signed-url";
var Client = class {
  constructor({ apiURL, consistency, edgeURL, fetch, region, siteID, token, uncachedEdgeURL }) {
    this.apiURL = apiURL;
    this.consistency = consistency ?? "eventual";
    this.edgeURL = edgeURL;
    this.fetch = fetch ?? globalThis.fetch;
    this.region = region;
    this.siteID = siteID;
    this.token = token;
    this.uncachedEdgeURL = uncachedEdgeURL;
    if (!this.fetch) {
      throw new Error(
        "Netlify Blobs could not find a `fetch` client in the global scope. You can either update your runtime to a version that includes `fetch` (like Node.js 18.0.0 or above), or you can supply your own implementation using the `fetch` property."
      );
    }
  }
  async getFinalRequest({
    consistency: opConsistency,
    key,
    metadata,
    method,
    parameters = {},
    storeName
  }) {
    const encodedMetadata = encodeMetadata(metadata);
    const consistency = opConsistency ?? this.consistency;
    let urlPath = `/${this.siteID}`;
    if (storeName) {
      urlPath += `/${storeName}`;
    }
    if (key) {
      urlPath += `/${key}`;
    }
    if (this.edgeURL) {
      if (consistency === "strong" && !this.uncachedEdgeURL) {
        throw new BlobsConsistencyError();
      }
      const headers = {
        authorization: `Bearer ${this.token}`
      };
      if (encodedMetadata) {
        headers[METADATA_HEADER_INTERNAL] = encodedMetadata;
      }
      if (this.region) {
        urlPath = `/region:${this.region}${urlPath}`;
      }
      const url2 = new URL(urlPath, consistency === "strong" ? this.uncachedEdgeURL : this.edgeURL);
      for (const key2 in parameters) {
        url2.searchParams.set(key2, parameters[key2]);
      }
      return {
        headers,
        url: url2.toString()
      };
    }
    const apiHeaders = { authorization: `Bearer ${this.token}` };
    const url = new URL(`/api/v1/blobs${urlPath}`, this.apiURL ?? "https://api.netlify.com");
    for (const key2 in parameters) {
      url.searchParams.set(key2, parameters[key2]);
    }
    if (this.region) {
      url.searchParams.set("region", this.region);
    }
    if (storeName === void 0 || key === void 0) {
      return {
        headers: apiHeaders,
        url: url.toString()
      };
    }
    if (encodedMetadata) {
      apiHeaders[METADATA_HEADER_EXTERNAL] = encodedMetadata;
    }
    if (method === "head" || method === "delete") {
      return {
        headers: apiHeaders,
        url: url.toString()
      };
    }
    const res = await this.fetch(url.toString(), {
      headers: { ...apiHeaders, accept: SIGNED_URL_ACCEPT_HEADER },
      method
    });
    if (res.status !== 200) {
      throw new BlobsInternalError(res);
    }
    const { url: signedURL } = await res.json();
    const userHeaders = encodedMetadata ? { [METADATA_HEADER_INTERNAL]: encodedMetadata } : void 0;
    return {
      headers: userHeaders,
      url: signedURL
    };
  }
  async makeRequest({
    body,
    consistency,
    headers: extraHeaders,
    key,
    metadata,
    method,
    parameters,
    storeName
  }) {
    const { headers: baseHeaders = {}, url } = await this.getFinalRequest({
      consistency,
      key,
      metadata,
      method,
      parameters,
      storeName
    });
    const headers = {
      ...baseHeaders,
      ...extraHeaders
    };
    if (method === "put") {
      headers["cache-control"] = "max-age=0, stale-while-revalidate=60";
    }
    const options = {
      body,
      headers,
      method
    };
    if (body instanceof ReadableStream) {
      options.duplex = "half";
    }
    return fetchAndRetry(this.fetch, url, options);
  }
};
var getClientOptions = (options, contextOverride) => {
  const context = contextOverride ?? getEnvironmentContext();
  const siteID = context.siteID ?? options.siteID;
  const token = context.token ?? options.token;
  if (!siteID || !token) {
    throw new MissingBlobsEnvironmentError(["siteID", "token"]);
  }
  if (options.region !== void 0 && !isValidRegion(options.region)) {
    throw new InvalidBlobsRegionError(options.region);
  }
  const clientOptions = {
    apiURL: context.apiURL ?? options.apiURL,
    consistency: options.consistency,
    edgeURL: context.edgeURL ?? options.edgeURL,
    fetch: options.fetch,
    region: options.region,
    siteID,
    token,
    uncachedEdgeURL: context.uncachedEdgeURL ?? options.uncachedEdgeURL
  };
  return clientOptions;
};
var DEPLOY_STORE_PREFIX = "deploy:";
var LEGACY_STORE_INTERNAL_PREFIX = "netlify-internal/legacy-namespace/";
var SITE_STORE_PREFIX = "site:";
var Store = class _Store {
  constructor(options) {
    this.client = options.client;
    if ("deployID" in options) {
      _Store.validateDeployID(options.deployID);
      let name = DEPLOY_STORE_PREFIX + options.deployID;
      if (options.name) {
        name += `:${options.name}`;
      }
      this.name = name;
    } else if (options.name.startsWith(LEGACY_STORE_INTERNAL_PREFIX)) {
      const storeName = options.name.slice(LEGACY_STORE_INTERNAL_PREFIX.length);
      _Store.validateStoreName(storeName);
      this.name = storeName;
    } else {
      _Store.validateStoreName(options.name);
      this.name = SITE_STORE_PREFIX + options.name;
    }
  }
  async delete(key) {
    const res = await this.client.makeRequest({ key, method: "delete", storeName: this.name });
    if (![200, 204, 404].includes(res.status)) {
      throw new BlobsInternalError(res);
    }
  }
  async get(key, options) {
    const { consistency, type } = options ?? {};
    const res = await this.client.makeRequest({ consistency, key, method: "get", storeName: this.name });
    if (res.status === 404) {
      return null;
    }
    if (res.status !== 200) {
      throw new BlobsInternalError(res);
    }
    if (type === void 0 || type === "text") {
      return res.text();
    }
    if (type === "arrayBuffer") {
      return res.arrayBuffer();
    }
    if (type === "blob") {
      return res.blob();
    }
    if (type === "json") {
      return res.json();
    }
    if (type === "stream") {
      return res.body;
    }
    throw new BlobsInternalError(res);
  }
  async getMetadata(key, { consistency } = {}) {
    const res = await this.client.makeRequest({ consistency, key, method: "head", storeName: this.name });
    if (res.status === 404) {
      return null;
    }
    if (res.status !== 200 && res.status !== 304) {
      throw new BlobsInternalError(res);
    }
    const etag = res?.headers.get("etag") ?? void 0;
    const metadata = getMetadataFromResponse(res);
    const result = {
      etag,
      metadata
    };
    return result;
  }
  async getWithMetadata(key, options) {
    const { consistency, etag: requestETag, type } = options ?? {};
    const headers = requestETag ? { "if-none-match": requestETag } : void 0;
    const res = await this.client.makeRequest({
      consistency,
      headers,
      key,
      method: "get",
      storeName: this.name
    });
    if (res.status === 404) {
      return null;
    }
    if (res.status !== 200 && res.status !== 304) {
      throw new BlobsInternalError(res);
    }
    const responseETag = res?.headers.get("etag") ?? void 0;
    const metadata = getMetadataFromResponse(res);
    const result = {
      etag: responseETag,
      metadata
    };
    if (res.status === 304 && requestETag) {
      return { data: null, ...result };
    }
    if (type === void 0 || type === "text") {
      return { data: await res.text(), ...result };
    }
    if (type === "arrayBuffer") {
      return { data: await res.arrayBuffer(), ...result };
    }
    if (type === "blob") {
      return { data: await res.blob(), ...result };
    }
    if (type === "json") {
      return { data: await res.json(), ...result };
    }
    if (type === "stream") {
      return { data: res.body, ...result };
    }
    throw new Error(`Invalid 'type' property: ${type}. Expected: arrayBuffer, blob, json, stream, or text.`);
  }
  list(options = {}) {
    const iterator = this.getListIterator(options);
    if (options.paginate) {
      return iterator;
    }
    return collectIterator(iterator).then(
      (items) => items.reduce(
        (acc, item) => ({
          blobs: [...acc.blobs, ...item.blobs],
          directories: [...acc.directories, ...item.directories]
        }),
        { blobs: [], directories: [] }
      )
    );
  }
  async set(key, data, { metadata } = {}) {
    _Store.validateKey(key);
    const res = await this.client.makeRequest({
      body: data,
      key,
      metadata,
      method: "put",
      storeName: this.name
    });
    if (res.status !== 200) {
      throw new BlobsInternalError(res);
    }
  }
  async setJSON(key, data, { metadata } = {}) {
    _Store.validateKey(key);
    const payload = JSON.stringify(data);
    const headers = {
      "content-type": "application/json"
    };
    const res = await this.client.makeRequest({
      body: payload,
      headers,
      key,
      metadata,
      method: "put",
      storeName: this.name
    });
    if (res.status !== 200) {
      throw new BlobsInternalError(res);
    }
  }
  static formatListResultBlob(result) {
    if (!result.key) {
      return null;
    }
    return {
      etag: result.etag,
      key: result.key
    };
  }
  static validateKey(key) {
    if (key === "") {
      throw new Error("Blob key must not be empty.");
    }
    if (key.startsWith("/") || key.startsWith("%2F")) {
      throw new Error("Blob key must not start with forward slash (/).");
    }
    if (new TextEncoder().encode(key).length > 600) {
      throw new Error(
        "Blob key must be a sequence of Unicode characters whose UTF-8 encoding is at most 600 bytes long."
      );
    }
  }
  static validateDeployID(deployID) {
    if (!/^\w{1,24}$/.test(deployID)) {
      throw new Error(`'${deployID}' is not a valid Netlify deploy ID.`);
    }
  }
  static validateStoreName(name) {
    if (name.includes("/") || name.includes("%2F")) {
      throw new Error("Store name must not contain forward slashes (/).");
    }
    if (new TextEncoder().encode(name).length > 64) {
      throw new Error(
        "Store name must be a sequence of Unicode characters whose UTF-8 encoding is at most 64 bytes long."
      );
    }
  }
  getListIterator(options) {
    const { client, name: storeName } = this;
    const parameters = {};
    if (options?.prefix) {
      parameters.prefix = options.prefix;
    }
    if (options?.directories) {
      parameters.directories = "true";
    }
    return {
      [Symbol.asyncIterator]() {
        let currentCursor = null;
        let done = false;
        return {
          async next() {
            if (done) {
              return { done: true, value: void 0 };
            }
            const nextParameters = { ...parameters };
            if (currentCursor !== null) {
              nextParameters.cursor = currentCursor;
            }
            const res = await client.makeRequest({
              method: "get",
              parameters: nextParameters,
              storeName
            });
            let blobs = [];
            let directories = [];
            if (![200, 204, 404].includes(res.status)) {
              throw new BlobsInternalError(res);
            }
            if (res.status === 404) {
              done = true;
            } else {
              const page = await res.json();
              if (page.next_cursor) {
                currentCursor = page.next_cursor;
              } else {
                done = true;
              }
              blobs = (page.blobs ?? []).map(_Store.formatListResultBlob).filter(Boolean);
              directories = page.directories ?? [];
            }
            return {
              done: false,
              value: {
                blobs,
                directories
              }
            };
          }
        };
      }
    };
  }
};
var getStore = (input) => {
  if (typeof input === "string") {
    const clientOptions = getClientOptions({});
    const client = new Client(clientOptions);
    return new Store({ client, name: input });
  }
  if (typeof input?.name === "string") {
    const { name } = input;
    const clientOptions = getClientOptions(input);
    if (!name) {
      throw new MissingBlobsEnvironmentError(["name"]);
    }
    const client = new Client(clientOptions);
    return new Store({ client, name });
  }
  if (typeof input?.deployID === "string") {
    const clientOptions = getClientOptions(input);
    const { deployID } = input;
    if (!deployID) {
      throw new MissingBlobsEnvironmentError(["deployID"]);
    }
    const client = new Client(clientOptions);
    return new Store({ client, deployID });
  }
  throw new Error(
    "The `getStore` method requires the name of the store as a string or as the `name` property of an options object"
  );
};
var edge_config_default = async (req) => {
  const requestKey = req.headers.get("Authorization")?.split(" ")[1];
  const sharedKey = Netlify.env.get("LAUNCHDARKLY_SHARED_SECRET");
  if (sharedKey === void 0 || sharedKey === "" || requestKey !== sharedKey) {
    return new Response("Authorization missing.", { status: 401 });
  }
  const blobs = getStore("official-launchdarkly");
  await blobs.set("default", await req.text(), {
    metadata: { updatedAt: (/* @__PURE__ */ new Date()).toISOString() }
  });
  return new Response("OK");
};
var config = {
  method: "PUT",
  path: "/.official-launchdarkly/edge-config"
};
export {
  config,
  edge_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLm5ldGxpZnkvZnVuY3Rpb25zLWludGVybmFsL29mZmljaWFsLWxhdW5jaGRhcmtseV9lZGdlLWNvbmZpZy5tdHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIG5vZGVfbW9kdWxlcy8ucG5wbS9AbmV0bGlmeStibG9ic0A4LjAuMS9ub2RlX21vZHVsZXMvQG5ldGxpZnkvYmxvYnMvZGlzdC9jaHVuay1HVUVXMzRDUC5qc1xudmFyIE5GX0VSUk9SID0gXCJ4LW5mLWVycm9yXCI7XG52YXIgTkZfUkVRVUVTVF9JRCA9IFwieC1uZi1yZXF1ZXN0LWlkXCI7XG52YXIgQmxvYnNJbnRlcm5hbEVycm9yID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHJlcykge1xuICAgIGxldCBkZXRhaWxzID0gcmVzLmhlYWRlcnMuZ2V0KE5GX0VSUk9SKSB8fCBgJHtyZXMuc3RhdHVzfSBzdGF0dXMgY29kZWA7XG4gICAgaWYgKHJlcy5oZWFkZXJzLmhhcyhORl9SRVFVRVNUX0lEKSkge1xuICAgICAgZGV0YWlscyArPSBgLCBJRDogJHtyZXMuaGVhZGVycy5nZXQoTkZfUkVRVUVTVF9JRCl9YDtcbiAgICB9XG4gICAgc3VwZXIoYE5ldGxpZnkgQmxvYnMgaGFzIGdlbmVyYXRlZCBhbiBpbnRlcm5hbCBlcnJvciAoJHtkZXRhaWxzfSlgKTtcbiAgICB0aGlzLm5hbWUgPSBcIkJsb2JzSW50ZXJuYWxFcnJvclwiO1xuICB9XG59O1xudmFyIGNvbGxlY3RJdGVyYXRvciA9IGFzeW5jIChpdGVyYXRvcikgPT4ge1xuICBjb25zdCByZXN1bHQgPSBbXTtcbiAgZm9yIGF3YWl0IChjb25zdCBpdGVtIG9mIGl0ZXJhdG9yKSB7XG4gICAgcmVzdWx0LnB1c2goaXRlbSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG52YXIgYmFzZTY0RGVjb2RlID0gKGlucHV0KSA9PiB7XG4gIGNvbnN0IHsgQnVmZmVyIH0gPSBnbG9iYWxUaGlzO1xuICBpZiAoQnVmZmVyKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKGlucHV0LCBcImJhc2U2NFwiKS50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiBhdG9iKGlucHV0KTtcbn07XG52YXIgYmFzZTY0RW5jb2RlID0gKGlucHV0KSA9PiB7XG4gIGNvbnN0IHsgQnVmZmVyIH0gPSBnbG9iYWxUaGlzO1xuICBpZiAoQnVmZmVyKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKGlucHV0KS50b1N0cmluZyhcImJhc2U2NFwiKTtcbiAgfVxuICByZXR1cm4gYnRvYShpbnB1dCk7XG59O1xudmFyIGdldEVudmlyb25tZW50ID0gKCkgPT4ge1xuICBjb25zdCB7IERlbm8sIE5ldGxpZnk6IE5ldGxpZnkyLCBwcm9jZXNzIH0gPSBnbG9iYWxUaGlzO1xuICByZXR1cm4gTmV0bGlmeTI/LmVudiA/PyBEZW5vPy5lbnYgPz8ge1xuICAgIGRlbGV0ZTogKGtleSkgPT4gZGVsZXRlIHByb2Nlc3M/LmVudltrZXldLFxuICAgIGdldDogKGtleSkgPT4gcHJvY2Vzcz8uZW52W2tleV0sXG4gICAgaGFzOiAoa2V5KSA9PiBCb29sZWFuKHByb2Nlc3M/LmVudltrZXldKSxcbiAgICBzZXQ6IChrZXksIHZhbHVlKSA9PiB7XG4gICAgICBpZiAocHJvY2Vzcz8uZW52KSB7XG4gICAgICAgIHByb2Nlc3MuZW52W2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHRvT2JqZWN0OiAoKSA9PiBwcm9jZXNzPy5lbnYgPz8ge31cbiAgfTtcbn07XG52YXIgZ2V0RW52aXJvbm1lbnRDb250ZXh0ID0gKCkgPT4ge1xuICBjb25zdCBjb250ZXh0ID0gZ2xvYmFsVGhpcy5uZXRsaWZ5QmxvYnNDb250ZXh0IHx8IGdldEVudmlyb25tZW50KCkuZ2V0KFwiTkVUTElGWV9CTE9CU19DT05URVhUXCIpO1xuICBpZiAodHlwZW9mIGNvbnRleHQgIT09IFwic3RyaW5nXCIgfHwgIWNvbnRleHQpIHtcbiAgICByZXR1cm4ge307XG4gIH1cbiAgY29uc3QgZGF0YSA9IGJhc2U2NERlY29kZShjb250ZXh0KTtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShkYXRhKTtcbiAgfSBjYXRjaCB7XG4gIH1cbiAgcmV0dXJuIHt9O1xufTtcbnZhciBNaXNzaW5nQmxvYnNFbnZpcm9ubWVudEVycm9yID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHJlcXVpcmVkUHJvcGVydGllcykge1xuICAgIHN1cGVyKFxuICAgICAgYFRoZSBlbnZpcm9ubWVudCBoYXMgbm90IGJlZW4gY29uZmlndXJlZCB0byB1c2UgTmV0bGlmeSBCbG9icy4gVG8gdXNlIGl0IG1hbnVhbGx5LCBzdXBwbHkgdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzIHdoZW4gY3JlYXRpbmcgYSBzdG9yZTogJHtyZXF1aXJlZFByb3BlcnRpZXMuam9pbihcbiAgICAgICAgXCIsIFwiXG4gICAgICApfWBcbiAgICApO1xuICAgIHRoaXMubmFtZSA9IFwiTWlzc2luZ0Jsb2JzRW52aXJvbm1lbnRFcnJvclwiO1xuICB9XG59O1xudmFyIEJBU0U2NF9QUkVGSVggPSBcImI2NDtcIjtcbnZhciBNRVRBREFUQV9IRUFERVJfSU5URVJOQUwgPSBcIngtYW16LW1ldGEtdXNlclwiO1xudmFyIE1FVEFEQVRBX0hFQURFUl9FWFRFUk5BTCA9IFwibmV0bGlmeS1ibG9icy1tZXRhZGF0YVwiO1xudmFyIE1FVEFEQVRBX01BWF9TSVpFID0gMiAqIDEwMjQ7XG52YXIgZW5jb2RlTWV0YWRhdGEgPSAobWV0YWRhdGEpID0+IHtcbiAgaWYgKCFtZXRhZGF0YSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IGVuY29kZWRPYmplY3QgPSBiYXNlNjRFbmNvZGUoSlNPTi5zdHJpbmdpZnkobWV0YWRhdGEpKTtcbiAgY29uc3QgcGF5bG9hZCA9IGBiNjQ7JHtlbmNvZGVkT2JqZWN0fWA7XG4gIGlmIChNRVRBREFUQV9IRUFERVJfRVhURVJOQUwubGVuZ3RoICsgcGF5bG9hZC5sZW5ndGggPiBNRVRBREFUQV9NQVhfU0laRSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk1ldGFkYXRhIG9iamVjdCBleGNlZWRzIHRoZSBtYXhpbXVtIHNpemVcIik7XG4gIH1cbiAgcmV0dXJuIHBheWxvYWQ7XG59O1xudmFyIGRlY29kZU1ldGFkYXRhID0gKGhlYWRlcikgPT4ge1xuICBpZiAoIWhlYWRlciB8fCAhaGVhZGVyLnN0YXJ0c1dpdGgoQkFTRTY0X1BSRUZJWCkpIHtcbiAgICByZXR1cm4ge307XG4gIH1cbiAgY29uc3QgZW5jb2RlZERhdGEgPSBoZWFkZXIuc2xpY2UoQkFTRTY0X1BSRUZJWC5sZW5ndGgpO1xuICBjb25zdCBkZWNvZGVkRGF0YSA9IGJhc2U2NERlY29kZShlbmNvZGVkRGF0YSk7XG4gIGNvbnN0IG1ldGFkYXRhID0gSlNPTi5wYXJzZShkZWNvZGVkRGF0YSk7XG4gIHJldHVybiBtZXRhZGF0YTtcbn07XG52YXIgZ2V0TWV0YWRhdGFGcm9tUmVzcG9uc2UgPSAocmVzcG9uc2UpID0+IHtcbiAgaWYgKCFyZXNwb25zZS5oZWFkZXJzKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG4gIGNvbnN0IHZhbHVlID0gcmVzcG9uc2UuaGVhZGVycy5nZXQoTUVUQURBVEFfSEVBREVSX0VYVEVSTkFMKSB8fCByZXNwb25zZS5oZWFkZXJzLmdldChNRVRBREFUQV9IRUFERVJfSU5URVJOQUwpO1xuICB0cnkge1xuICAgIHJldHVybiBkZWNvZGVNZXRhZGF0YSh2YWx1ZSk7XG4gIH0gY2F0Y2gge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIFwiQW4gaW50ZXJuYWwgZXJyb3Igb2NjdXJyZWQgd2hpbGUgdHJ5aW5nIHRvIHJldHJpZXZlIHRoZSBtZXRhZGF0YSBmb3IgYW4gZW50cnkuIFBsZWFzZSB0cnkgdXBkYXRpbmcgdG8gdGhlIGxhdGVzdCB2ZXJzaW9uIG9mIHRoZSBOZXRsaWZ5IEJsb2JzIGNsaWVudC5cIlxuICAgICk7XG4gIH1cbn07XG52YXIgQmxvYnNDb25zaXN0ZW5jeUVycm9yID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgYE5ldGxpZnkgQmxvYnMgaGFzIGZhaWxlZCB0byBwZXJmb3JtIGEgcmVhZCB1c2luZyBzdHJvbmcgY29uc2lzdGVuY3kgYmVjYXVzZSB0aGUgZW52aXJvbm1lbnQgaGFzIG5vdCBiZWVuIGNvbmZpZ3VyZWQgd2l0aCBhICd1bmNhY2hlZEVkZ2VVUkwnIHByb3BlcnR5YFxuICAgICk7XG4gICAgdGhpcy5uYW1lID0gXCJCbG9ic0NvbnNpc3RlbmN5RXJyb3JcIjtcbiAgfVxufTtcbnZhciByZWdpb25zID0ge1xuICBcInVzLWVhc3QtMVwiOiB0cnVlLFxuICBcInVzLWVhc3QtMlwiOiB0cnVlXG59O1xudmFyIGlzVmFsaWRSZWdpb24gPSAoaW5wdXQpID0+IE9iamVjdC5rZXlzKHJlZ2lvbnMpLmluY2x1ZGVzKGlucHV0KTtcbnZhciBJbnZhbGlkQmxvYnNSZWdpb25FcnJvciA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZWdpb24pIHtcbiAgICBzdXBlcihcbiAgICAgIGAke3JlZ2lvbn0gaXMgbm90IGEgc3VwcG9ydGVkIE5ldGxpZnkgQmxvYnMgcmVnaW9uLiBTdXBwb3J0ZWQgdmFsdWVzIGFyZTogJHtPYmplY3Qua2V5cyhyZWdpb25zKS5qb2luKFwiLCBcIil9LmBcbiAgICApO1xuICAgIHRoaXMubmFtZSA9IFwiSW52YWxpZEJsb2JzUmVnaW9uRXJyb3JcIjtcbiAgfVxufTtcbnZhciBERUZBVUxUX1JFVFJZX0RFTEFZID0gZ2V0RW52aXJvbm1lbnQoKS5nZXQoXCJOT0RFX0VOVlwiKSA9PT0gXCJ0ZXN0XCIgPyAxIDogNWUzO1xudmFyIE1JTl9SRVRSWV9ERUxBWSA9IDFlMztcbnZhciBNQVhfUkVUUlkgPSA1O1xudmFyIFJBVEVfTElNSVRfSEVBREVSID0gXCJYLVJhdGVMaW1pdC1SZXNldFwiO1xudmFyIGZldGNoQW5kUmV0cnkgPSBhc3luYyAoZmV0Y2gsIHVybCwgb3B0aW9ucywgYXR0ZW1wdHNMZWZ0ID0gTUFYX1JFVFJZKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2godXJsLCBvcHRpb25zKTtcbiAgICBpZiAoYXR0ZW1wdHNMZWZ0ID4gMCAmJiAocmVzLnN0YXR1cyA9PT0gNDI5IHx8IHJlcy5zdGF0dXMgPj0gNTAwKSkge1xuICAgICAgY29uc3QgZGVsYXkgPSBnZXREZWxheShyZXMuaGVhZGVycy5nZXQoUkFURV9MSU1JVF9IRUFERVIpKTtcbiAgICAgIGF3YWl0IHNsZWVwKGRlbGF5KTtcbiAgICAgIHJldHVybiBmZXRjaEFuZFJldHJ5KGZldGNoLCB1cmwsIG9wdGlvbnMsIGF0dGVtcHRzTGVmdCAtIDEpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChhdHRlbXB0c0xlZnQgPT09IDApIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgICBjb25zdCBkZWxheSA9IGdldERlbGF5KCk7XG4gICAgYXdhaXQgc2xlZXAoZGVsYXkpO1xuICAgIHJldHVybiBmZXRjaEFuZFJldHJ5KGZldGNoLCB1cmwsIG9wdGlvbnMsIGF0dGVtcHRzTGVmdCAtIDEpO1xuICB9XG59O1xudmFyIGdldERlbGF5ID0gKHJhdGVMaW1pdFJlc2V0KSA9PiB7XG4gIGlmICghcmF0ZUxpbWl0UmVzZXQpIHtcbiAgICByZXR1cm4gREVGQVVMVF9SRVRSWV9ERUxBWTtcbiAgfVxuICByZXR1cm4gTWF0aC5tYXgoTnVtYmVyKHJhdGVMaW1pdFJlc2V0KSAqIDFlMyAtIERhdGUubm93KCksIE1JTl9SRVRSWV9ERUxBWSk7XG59O1xudmFyIHNsZWVwID0gKG1zKSA9PiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKTtcbn0pO1xudmFyIFNJR05FRF9VUkxfQUNDRVBUX0hFQURFUiA9IFwiYXBwbGljYXRpb24vanNvbjt0eXBlPXNpZ25lZC11cmxcIjtcbnZhciBDbGllbnQgPSBjbGFzcyB7XG4gIGNvbnN0cnVjdG9yKHsgYXBpVVJMLCBjb25zaXN0ZW5jeSwgZWRnZVVSTCwgZmV0Y2gsIHJlZ2lvbiwgc2l0ZUlELCB0b2tlbiwgdW5jYWNoZWRFZGdlVVJMIH0pIHtcbiAgICB0aGlzLmFwaVVSTCA9IGFwaVVSTDtcbiAgICB0aGlzLmNvbnNpc3RlbmN5ID0gY29uc2lzdGVuY3kgPz8gXCJldmVudHVhbFwiO1xuICAgIHRoaXMuZWRnZVVSTCA9IGVkZ2VVUkw7XG4gICAgdGhpcy5mZXRjaCA9IGZldGNoID8/IGdsb2JhbFRoaXMuZmV0Y2g7XG4gICAgdGhpcy5yZWdpb24gPSByZWdpb247XG4gICAgdGhpcy5zaXRlSUQgPSBzaXRlSUQ7XG4gICAgdGhpcy50b2tlbiA9IHRva2VuO1xuICAgIHRoaXMudW5jYWNoZWRFZGdlVVJMID0gdW5jYWNoZWRFZGdlVVJMO1xuICAgIGlmICghdGhpcy5mZXRjaCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIk5ldGxpZnkgQmxvYnMgY291bGQgbm90IGZpbmQgYSBgZmV0Y2hgIGNsaWVudCBpbiB0aGUgZ2xvYmFsIHNjb3BlLiBZb3UgY2FuIGVpdGhlciB1cGRhdGUgeW91ciBydW50aW1lIHRvIGEgdmVyc2lvbiB0aGF0IGluY2x1ZGVzIGBmZXRjaGAgKGxpa2UgTm9kZS5qcyAxOC4wLjAgb3IgYWJvdmUpLCBvciB5b3UgY2FuIHN1cHBseSB5b3VyIG93biBpbXBsZW1lbnRhdGlvbiB1c2luZyB0aGUgYGZldGNoYCBwcm9wZXJ0eS5cIlxuICAgICAgKTtcbiAgICB9XG4gIH1cbiAgYXN5bmMgZ2V0RmluYWxSZXF1ZXN0KHtcbiAgICBjb25zaXN0ZW5jeTogb3BDb25zaXN0ZW5jeSxcbiAgICBrZXksXG4gICAgbWV0YWRhdGEsXG4gICAgbWV0aG9kLFxuICAgIHBhcmFtZXRlcnMgPSB7fSxcbiAgICBzdG9yZU5hbWVcbiAgfSkge1xuICAgIGNvbnN0IGVuY29kZWRNZXRhZGF0YSA9IGVuY29kZU1ldGFkYXRhKG1ldGFkYXRhKTtcbiAgICBjb25zdCBjb25zaXN0ZW5jeSA9IG9wQ29uc2lzdGVuY3kgPz8gdGhpcy5jb25zaXN0ZW5jeTtcbiAgICBsZXQgdXJsUGF0aCA9IGAvJHt0aGlzLnNpdGVJRH1gO1xuICAgIGlmIChzdG9yZU5hbWUpIHtcbiAgICAgIHVybFBhdGggKz0gYC8ke3N0b3JlTmFtZX1gO1xuICAgIH1cbiAgICBpZiAoa2V5KSB7XG4gICAgICB1cmxQYXRoICs9IGAvJHtrZXl9YDtcbiAgICB9XG4gICAgaWYgKHRoaXMuZWRnZVVSTCkge1xuICAgICAgaWYgKGNvbnNpc3RlbmN5ID09PSBcInN0cm9uZ1wiICYmICF0aGlzLnVuY2FjaGVkRWRnZVVSTCkge1xuICAgICAgICB0aHJvdyBuZXcgQmxvYnNDb25zaXN0ZW5jeUVycm9yKCk7XG4gICAgICB9XG4gICAgICBjb25zdCBoZWFkZXJzID0ge1xuICAgICAgICBhdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dGhpcy50b2tlbn1gXG4gICAgICB9O1xuICAgICAgaWYgKGVuY29kZWRNZXRhZGF0YSkge1xuICAgICAgICBoZWFkZXJzW01FVEFEQVRBX0hFQURFUl9JTlRFUk5BTF0gPSBlbmNvZGVkTWV0YWRhdGE7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5yZWdpb24pIHtcbiAgICAgICAgdXJsUGF0aCA9IGAvcmVnaW9uOiR7dGhpcy5yZWdpb259JHt1cmxQYXRofWA7XG4gICAgICB9XG4gICAgICBjb25zdCB1cmwyID0gbmV3IFVSTCh1cmxQYXRoLCBjb25zaXN0ZW5jeSA9PT0gXCJzdHJvbmdcIiA/IHRoaXMudW5jYWNoZWRFZGdlVVJMIDogdGhpcy5lZGdlVVJMKTtcbiAgICAgIGZvciAoY29uc3Qga2V5MiBpbiBwYXJhbWV0ZXJzKSB7XG4gICAgICAgIHVybDIuc2VhcmNoUGFyYW1zLnNldChrZXkyLCBwYXJhbWV0ZXJzW2tleTJdKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHVybDogdXJsMi50b1N0cmluZygpXG4gICAgICB9O1xuICAgIH1cbiAgICBjb25zdCBhcGlIZWFkZXJzID0geyBhdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dGhpcy50b2tlbn1gIH07XG4gICAgY29uc3QgdXJsID0gbmV3IFVSTChgL2FwaS92MS9ibG9icyR7dXJsUGF0aH1gLCB0aGlzLmFwaVVSTCA/PyBcImh0dHBzOi8vYXBpLm5ldGxpZnkuY29tXCIpO1xuICAgIGZvciAoY29uc3Qga2V5MiBpbiBwYXJhbWV0ZXJzKSB7XG4gICAgICB1cmwuc2VhcmNoUGFyYW1zLnNldChrZXkyLCBwYXJhbWV0ZXJzW2tleTJdKTtcbiAgICB9XG4gICAgaWYgKHRoaXMucmVnaW9uKSB7XG4gICAgICB1cmwuc2VhcmNoUGFyYW1zLnNldChcInJlZ2lvblwiLCB0aGlzLnJlZ2lvbik7XG4gICAgfVxuICAgIGlmIChzdG9yZU5hbWUgPT09IHZvaWQgMCB8fCBrZXkgPT09IHZvaWQgMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaGVhZGVyczogYXBpSGVhZGVycyxcbiAgICAgICAgdXJsOiB1cmwudG9TdHJpbmcoKVxuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKGVuY29kZWRNZXRhZGF0YSkge1xuICAgICAgYXBpSGVhZGVyc1tNRVRBREFUQV9IRUFERVJfRVhURVJOQUxdID0gZW5jb2RlZE1ldGFkYXRhO1xuICAgIH1cbiAgICBpZiAobWV0aG9kID09PSBcImhlYWRcIiB8fCBtZXRob2QgPT09IFwiZGVsZXRlXCIpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGhlYWRlcnM6IGFwaUhlYWRlcnMsXG4gICAgICAgIHVybDogdXJsLnRvU3RyaW5nKClcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuZmV0Y2godXJsLnRvU3RyaW5nKCksIHtcbiAgICAgIGhlYWRlcnM6IHsgLi4uYXBpSGVhZGVycywgYWNjZXB0OiBTSUdORURfVVJMX0FDQ0VQVF9IRUFERVIgfSxcbiAgICAgIG1ldGhvZFxuICAgIH0pO1xuICAgIGlmIChyZXMuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgIHRocm93IG5ldyBCbG9ic0ludGVybmFsRXJyb3IocmVzKTtcbiAgICB9XG4gICAgY29uc3QgeyB1cmw6IHNpZ25lZFVSTCB9ID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICBjb25zdCB1c2VySGVhZGVycyA9IGVuY29kZWRNZXRhZGF0YSA/IHsgW01FVEFEQVRBX0hFQURFUl9JTlRFUk5BTF06IGVuY29kZWRNZXRhZGF0YSB9IDogdm9pZCAwO1xuICAgIHJldHVybiB7XG4gICAgICBoZWFkZXJzOiB1c2VySGVhZGVycyxcbiAgICAgIHVybDogc2lnbmVkVVJMXG4gICAgfTtcbiAgfVxuICBhc3luYyBtYWtlUmVxdWVzdCh7XG4gICAgYm9keSxcbiAgICBjb25zaXN0ZW5jeSxcbiAgICBoZWFkZXJzOiBleHRyYUhlYWRlcnMsXG4gICAga2V5LFxuICAgIG1ldGFkYXRhLFxuICAgIG1ldGhvZCxcbiAgICBwYXJhbWV0ZXJzLFxuICAgIHN0b3JlTmFtZVxuICB9KSB7XG4gICAgY29uc3QgeyBoZWFkZXJzOiBiYXNlSGVhZGVycyA9IHt9LCB1cmwgfSA9IGF3YWl0IHRoaXMuZ2V0RmluYWxSZXF1ZXN0KHtcbiAgICAgIGNvbnNpc3RlbmN5LFxuICAgICAga2V5LFxuICAgICAgbWV0YWRhdGEsXG4gICAgICBtZXRob2QsXG4gICAgICBwYXJhbWV0ZXJzLFxuICAgICAgc3RvcmVOYW1lXG4gICAgfSk7XG4gICAgY29uc3QgaGVhZGVycyA9IHtcbiAgICAgIC4uLmJhc2VIZWFkZXJzLFxuICAgICAgLi4uZXh0cmFIZWFkZXJzXG4gICAgfTtcbiAgICBpZiAobWV0aG9kID09PSBcInB1dFwiKSB7XG4gICAgICBoZWFkZXJzW1wiY2FjaGUtY29udHJvbFwiXSA9IFwibWF4LWFnZT0wLCBzdGFsZS13aGlsZS1yZXZhbGlkYXRlPTYwXCI7XG4gICAgfVxuICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICBib2R5LFxuICAgICAgaGVhZGVycyxcbiAgICAgIG1ldGhvZFxuICAgIH07XG4gICAgaWYgKGJvZHkgaW5zdGFuY2VvZiBSZWFkYWJsZVN0cmVhbSkge1xuICAgICAgb3B0aW9ucy5kdXBsZXggPSBcImhhbGZcIjtcbiAgICB9XG4gICAgcmV0dXJuIGZldGNoQW5kUmV0cnkodGhpcy5mZXRjaCwgdXJsLCBvcHRpb25zKTtcbiAgfVxufTtcbnZhciBnZXRDbGllbnRPcHRpb25zID0gKG9wdGlvbnMsIGNvbnRleHRPdmVycmlkZSkgPT4ge1xuICBjb25zdCBjb250ZXh0ID0gY29udGV4dE92ZXJyaWRlID8/IGdldEVudmlyb25tZW50Q29udGV4dCgpO1xuICBjb25zdCBzaXRlSUQgPSBjb250ZXh0LnNpdGVJRCA/PyBvcHRpb25zLnNpdGVJRDtcbiAgY29uc3QgdG9rZW4gPSBjb250ZXh0LnRva2VuID8/IG9wdGlvbnMudG9rZW47XG4gIGlmICghc2l0ZUlEIHx8ICF0b2tlbikge1xuICAgIHRocm93IG5ldyBNaXNzaW5nQmxvYnNFbnZpcm9ubWVudEVycm9yKFtcInNpdGVJRFwiLCBcInRva2VuXCJdKTtcbiAgfVxuICBpZiAob3B0aW9ucy5yZWdpb24gIT09IHZvaWQgMCAmJiAhaXNWYWxpZFJlZ2lvbihvcHRpb25zLnJlZ2lvbikpIHtcbiAgICB0aHJvdyBuZXcgSW52YWxpZEJsb2JzUmVnaW9uRXJyb3Iob3B0aW9ucy5yZWdpb24pO1xuICB9XG4gIGNvbnN0IGNsaWVudE9wdGlvbnMgPSB7XG4gICAgYXBpVVJMOiBjb250ZXh0LmFwaVVSTCA/PyBvcHRpb25zLmFwaVVSTCxcbiAgICBjb25zaXN0ZW5jeTogb3B0aW9ucy5jb25zaXN0ZW5jeSxcbiAgICBlZGdlVVJMOiBjb250ZXh0LmVkZ2VVUkwgPz8gb3B0aW9ucy5lZGdlVVJMLFxuICAgIGZldGNoOiBvcHRpb25zLmZldGNoLFxuICAgIHJlZ2lvbjogb3B0aW9ucy5yZWdpb24sXG4gICAgc2l0ZUlELFxuICAgIHRva2VuLFxuICAgIHVuY2FjaGVkRWRnZVVSTDogY29udGV4dC51bmNhY2hlZEVkZ2VVUkwgPz8gb3B0aW9ucy51bmNhY2hlZEVkZ2VVUkxcbiAgfTtcbiAgcmV0dXJuIGNsaWVudE9wdGlvbnM7XG59O1xuXG4vLyBub2RlX21vZHVsZXMvLnBucG0vQG5ldGxpZnkrYmxvYnNAOC4wLjEvbm9kZV9tb2R1bGVzL0BuZXRsaWZ5L2Jsb2JzL2Rpc3QvbWFpbi5qc1xudmFyIERFUExPWV9TVE9SRV9QUkVGSVggPSBcImRlcGxveTpcIjtcbnZhciBMRUdBQ1lfU1RPUkVfSU5URVJOQUxfUFJFRklYID0gXCJuZXRsaWZ5LWludGVybmFsL2xlZ2FjeS1uYW1lc3BhY2UvXCI7XG52YXIgU0lURV9TVE9SRV9QUkVGSVggPSBcInNpdGU6XCI7XG52YXIgU3RvcmUgPSBjbGFzcyBfU3RvcmUge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgdGhpcy5jbGllbnQgPSBvcHRpb25zLmNsaWVudDtcbiAgICBpZiAoXCJkZXBsb3lJRFwiIGluIG9wdGlvbnMpIHtcbiAgICAgIF9TdG9yZS52YWxpZGF0ZURlcGxveUlEKG9wdGlvbnMuZGVwbG95SUQpO1xuICAgICAgbGV0IG5hbWUgPSBERVBMT1lfU1RPUkVfUFJFRklYICsgb3B0aW9ucy5kZXBsb3lJRDtcbiAgICAgIGlmIChvcHRpb25zLm5hbWUpIHtcbiAgICAgICAgbmFtZSArPSBgOiR7b3B0aW9ucy5uYW1lfWA7XG4gICAgICB9XG4gICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5uYW1lLnN0YXJ0c1dpdGgoTEVHQUNZX1NUT1JFX0lOVEVSTkFMX1BSRUZJWCkpIHtcbiAgICAgIGNvbnN0IHN0b3JlTmFtZSA9IG9wdGlvbnMubmFtZS5zbGljZShMRUdBQ1lfU1RPUkVfSU5URVJOQUxfUFJFRklYLmxlbmd0aCk7XG4gICAgICBfU3RvcmUudmFsaWRhdGVTdG9yZU5hbWUoc3RvcmVOYW1lKTtcbiAgICAgIHRoaXMubmFtZSA9IHN0b3JlTmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgX1N0b3JlLnZhbGlkYXRlU3RvcmVOYW1lKG9wdGlvbnMubmFtZSk7XG4gICAgICB0aGlzLm5hbWUgPSBTSVRFX1NUT1JFX1BSRUZJWCArIG9wdGlvbnMubmFtZTtcbiAgICB9XG4gIH1cbiAgYXN5bmMgZGVsZXRlKGtleSkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuY2xpZW50Lm1ha2VSZXF1ZXN0KHsga2V5LCBtZXRob2Q6IFwiZGVsZXRlXCIsIHN0b3JlTmFtZTogdGhpcy5uYW1lIH0pO1xuICAgIGlmICghWzIwMCwgMjA0LCA0MDRdLmluY2x1ZGVzKHJlcy5zdGF0dXMpKSB7XG4gICAgICB0aHJvdyBuZXcgQmxvYnNJbnRlcm5hbEVycm9yKHJlcyk7XG4gICAgfVxuICB9XG4gIGFzeW5jIGdldChrZXksIG9wdGlvbnMpIHtcbiAgICBjb25zdCB7IGNvbnNpc3RlbmN5LCB0eXBlIH0gPSBvcHRpb25zID8/IHt9O1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuY2xpZW50Lm1ha2VSZXF1ZXN0KHsgY29uc2lzdGVuY3ksIGtleSwgbWV0aG9kOiBcImdldFwiLCBzdG9yZU5hbWU6IHRoaXMubmFtZSB9KTtcbiAgICBpZiAocmVzLnN0YXR1cyA9PT0gNDA0KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKHJlcy5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgdGhyb3cgbmV3IEJsb2JzSW50ZXJuYWxFcnJvcihyZXMpO1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gdm9pZCAwIHx8IHR5cGUgPT09IFwidGV4dFwiKSB7XG4gICAgICByZXR1cm4gcmVzLnRleHQoKTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09IFwiYXJyYXlCdWZmZXJcIikge1xuICAgICAgcmV0dXJuIHJlcy5hcnJheUJ1ZmZlcigpO1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gXCJibG9iXCIpIHtcbiAgICAgIHJldHVybiByZXMuYmxvYigpO1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gXCJqc29uXCIpIHtcbiAgICAgIHJldHVybiByZXMuanNvbigpO1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gXCJzdHJlYW1cIikge1xuICAgICAgcmV0dXJuIHJlcy5ib2R5O1xuICAgIH1cbiAgICB0aHJvdyBuZXcgQmxvYnNJbnRlcm5hbEVycm9yKHJlcyk7XG4gIH1cbiAgYXN5bmMgZ2V0TWV0YWRhdGEoa2V5LCB7IGNvbnNpc3RlbmN5IH0gPSB7fSkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuY2xpZW50Lm1ha2VSZXF1ZXN0KHsgY29uc2lzdGVuY3ksIGtleSwgbWV0aG9kOiBcImhlYWRcIiwgc3RvcmVOYW1lOiB0aGlzLm5hbWUgfSk7XG4gICAgaWYgKHJlcy5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmIChyZXMuc3RhdHVzICE9PSAyMDAgJiYgcmVzLnN0YXR1cyAhPT0gMzA0KSB7XG4gICAgICB0aHJvdyBuZXcgQmxvYnNJbnRlcm5hbEVycm9yKHJlcyk7XG4gICAgfVxuICAgIGNvbnN0IGV0YWcgPSByZXM/LmhlYWRlcnMuZ2V0KFwiZXRhZ1wiKSA/PyB2b2lkIDA7XG4gICAgY29uc3QgbWV0YWRhdGEgPSBnZXRNZXRhZGF0YUZyb21SZXNwb25zZShyZXMpO1xuICAgIGNvbnN0IHJlc3VsdCA9IHtcbiAgICAgIGV0YWcsXG4gICAgICBtZXRhZGF0YVxuICAgIH07XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBhc3luYyBnZXRXaXRoTWV0YWRhdGEoa2V5LCBvcHRpb25zKSB7XG4gICAgY29uc3QgeyBjb25zaXN0ZW5jeSwgZXRhZzogcmVxdWVzdEVUYWcsIHR5cGUgfSA9IG9wdGlvbnMgPz8ge307XG4gICAgY29uc3QgaGVhZGVycyA9IHJlcXVlc3RFVGFnID8geyBcImlmLW5vbmUtbWF0Y2hcIjogcmVxdWVzdEVUYWcgfSA6IHZvaWQgMDtcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLmNsaWVudC5tYWtlUmVxdWVzdCh7XG4gICAgICBjb25zaXN0ZW5jeSxcbiAgICAgIGhlYWRlcnMsXG4gICAgICBrZXksXG4gICAgICBtZXRob2Q6IFwiZ2V0XCIsXG4gICAgICBzdG9yZU5hbWU6IHRoaXMubmFtZVxuICAgIH0pO1xuICAgIGlmIChyZXMuc3RhdHVzID09PSA0MDQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAocmVzLnN0YXR1cyAhPT0gMjAwICYmIHJlcy5zdGF0dXMgIT09IDMwNCkge1xuICAgICAgdGhyb3cgbmV3IEJsb2JzSW50ZXJuYWxFcnJvcihyZXMpO1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZUVUYWcgPSByZXM/LmhlYWRlcnMuZ2V0KFwiZXRhZ1wiKSA/PyB2b2lkIDA7XG4gICAgY29uc3QgbWV0YWRhdGEgPSBnZXRNZXRhZGF0YUZyb21SZXNwb25zZShyZXMpO1xuICAgIGNvbnN0IHJlc3VsdCA9IHtcbiAgICAgIGV0YWc6IHJlc3BvbnNlRVRhZyxcbiAgICAgIG1ldGFkYXRhXG4gICAgfTtcbiAgICBpZiAocmVzLnN0YXR1cyA9PT0gMzA0ICYmIHJlcXVlc3RFVGFnKSB7XG4gICAgICByZXR1cm4geyBkYXRhOiBudWxsLCAuLi5yZXN1bHQgfTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09IHZvaWQgMCB8fCB0eXBlID09PSBcInRleHRcIikge1xuICAgICAgcmV0dXJuIHsgZGF0YTogYXdhaXQgcmVzLnRleHQoKSwgLi4ucmVzdWx0IH07XG4gICAgfVxuICAgIGlmICh0eXBlID09PSBcImFycmF5QnVmZmVyXCIpIHtcbiAgICAgIHJldHVybiB7IGRhdGE6IGF3YWl0IHJlcy5hcnJheUJ1ZmZlcigpLCAuLi5yZXN1bHQgfTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09IFwiYmxvYlwiKSB7XG4gICAgICByZXR1cm4geyBkYXRhOiBhd2FpdCByZXMuYmxvYigpLCAuLi5yZXN1bHQgfTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09IFwianNvblwiKSB7XG4gICAgICByZXR1cm4geyBkYXRhOiBhd2FpdCByZXMuanNvbigpLCAuLi5yZXN1bHQgfTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09IFwic3RyZWFtXCIpIHtcbiAgICAgIHJldHVybiB7IGRhdGE6IHJlcy5ib2R5LCAuLi5yZXN1bHQgfTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkICd0eXBlJyBwcm9wZXJ0eTogJHt0eXBlfS4gRXhwZWN0ZWQ6IGFycmF5QnVmZmVyLCBibG9iLCBqc29uLCBzdHJlYW0sIG9yIHRleHQuYCk7XG4gIH1cbiAgbGlzdChvcHRpb25zID0ge30pIHtcbiAgICBjb25zdCBpdGVyYXRvciA9IHRoaXMuZ2V0TGlzdEl0ZXJhdG9yKG9wdGlvbnMpO1xuICAgIGlmIChvcHRpb25zLnBhZ2luYXRlKSB7XG4gICAgICByZXR1cm4gaXRlcmF0b3I7XG4gICAgfVxuICAgIHJldHVybiBjb2xsZWN0SXRlcmF0b3IoaXRlcmF0b3IpLnRoZW4oXG4gICAgICAoaXRlbXMpID0+IGl0ZW1zLnJlZHVjZShcbiAgICAgICAgKGFjYywgaXRlbSkgPT4gKHtcbiAgICAgICAgICBibG9iczogWy4uLmFjYy5ibG9icywgLi4uaXRlbS5ibG9ic10sXG4gICAgICAgICAgZGlyZWN0b3JpZXM6IFsuLi5hY2MuZGlyZWN0b3JpZXMsIC4uLml0ZW0uZGlyZWN0b3JpZXNdXG4gICAgICAgIH0pLFxuICAgICAgICB7IGJsb2JzOiBbXSwgZGlyZWN0b3JpZXM6IFtdIH1cbiAgICAgIClcbiAgICApO1xuICB9XG4gIGFzeW5jIHNldChrZXksIGRhdGEsIHsgbWV0YWRhdGEgfSA9IHt9KSB7XG4gICAgX1N0b3JlLnZhbGlkYXRlS2V5KGtleSk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy5jbGllbnQubWFrZVJlcXVlc3Qoe1xuICAgICAgYm9keTogZGF0YSxcbiAgICAgIGtleSxcbiAgICAgIG1ldGFkYXRhLFxuICAgICAgbWV0aG9kOiBcInB1dFwiLFxuICAgICAgc3RvcmVOYW1lOiB0aGlzLm5hbWVcbiAgICB9KTtcbiAgICBpZiAocmVzLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICB0aHJvdyBuZXcgQmxvYnNJbnRlcm5hbEVycm9yKHJlcyk7XG4gICAgfVxuICB9XG4gIGFzeW5jIHNldEpTT04oa2V5LCBkYXRhLCB7IG1ldGFkYXRhIH0gPSB7fSkge1xuICAgIF9TdG9yZS52YWxpZGF0ZUtleShrZXkpO1xuICAgIGNvbnN0IHBheWxvYWQgPSBKU09OLnN0cmluZ2lmeShkYXRhKTtcbiAgICBjb25zdCBoZWFkZXJzID0ge1xuICAgICAgXCJjb250ZW50LXR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcbiAgICB9O1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuY2xpZW50Lm1ha2VSZXF1ZXN0KHtcbiAgICAgIGJvZHk6IHBheWxvYWQsXG4gICAgICBoZWFkZXJzLFxuICAgICAga2V5LFxuICAgICAgbWV0YWRhdGEsXG4gICAgICBtZXRob2Q6IFwicHV0XCIsXG4gICAgICBzdG9yZU5hbWU6IHRoaXMubmFtZVxuICAgIH0pO1xuICAgIGlmIChyZXMuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgIHRocm93IG5ldyBCbG9ic0ludGVybmFsRXJyb3IocmVzKTtcbiAgICB9XG4gIH1cbiAgc3RhdGljIGZvcm1hdExpc3RSZXN1bHRCbG9iKHJlc3VsdCkge1xuICAgIGlmICghcmVzdWx0LmtleSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBldGFnOiByZXN1bHQuZXRhZyxcbiAgICAgIGtleTogcmVzdWx0LmtleVxuICAgIH07XG4gIH1cbiAgc3RhdGljIHZhbGlkYXRlS2V5KGtleSkge1xuICAgIGlmIChrZXkgPT09IFwiXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkJsb2Iga2V5IG11c3Qgbm90IGJlIGVtcHR5LlwiKTtcbiAgICB9XG4gICAgaWYgKGtleS5zdGFydHNXaXRoKFwiL1wiKSB8fCBrZXkuc3RhcnRzV2l0aChcIiUyRlwiKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmxvYiBrZXkgbXVzdCBub3Qgc3RhcnQgd2l0aCBmb3J3YXJkIHNsYXNoICgvKS5cIik7XG4gICAgfVxuICAgIGlmIChuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoa2V5KS5sZW5ndGggPiA2MDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJCbG9iIGtleSBtdXN0IGJlIGEgc2VxdWVuY2Ugb2YgVW5pY29kZSBjaGFyYWN0ZXJzIHdob3NlIFVURi04IGVuY29kaW5nIGlzIGF0IG1vc3QgNjAwIGJ5dGVzIGxvbmcuXCJcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIHN0YXRpYyB2YWxpZGF0ZURlcGxveUlEKGRlcGxveUlEKSB7XG4gICAgaWYgKCEvXlxcd3sxLDI0fSQvLnRlc3QoZGVwbG95SUQpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCcke2RlcGxveUlEfScgaXMgbm90IGEgdmFsaWQgTmV0bGlmeSBkZXBsb3kgSUQuYCk7XG4gICAgfVxuICB9XG4gIHN0YXRpYyB2YWxpZGF0ZVN0b3JlTmFtZShuYW1lKSB7XG4gICAgaWYgKG5hbWUuaW5jbHVkZXMoXCIvXCIpIHx8IG5hbWUuaW5jbHVkZXMoXCIlMkZcIikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlN0b3JlIG5hbWUgbXVzdCBub3QgY29udGFpbiBmb3J3YXJkIHNsYXNoZXMgKC8pLlwiKTtcbiAgICB9XG4gICAgaWYgKG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShuYW1lKS5sZW5ndGggPiA2NCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIlN0b3JlIG5hbWUgbXVzdCBiZSBhIHNlcXVlbmNlIG9mIFVuaWNvZGUgY2hhcmFjdGVycyB3aG9zZSBVVEYtOCBlbmNvZGluZyBpcyBhdCBtb3N0IDY0IGJ5dGVzIGxvbmcuXCJcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIGdldExpc3RJdGVyYXRvcihvcHRpb25zKSB7XG4gICAgY29uc3QgeyBjbGllbnQsIG5hbWU6IHN0b3JlTmFtZSB9ID0gdGhpcztcbiAgICBjb25zdCBwYXJhbWV0ZXJzID0ge307XG4gICAgaWYgKG9wdGlvbnM/LnByZWZpeCkge1xuICAgICAgcGFyYW1ldGVycy5wcmVmaXggPSBvcHRpb25zLnByZWZpeDtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnM/LmRpcmVjdG9yaWVzKSB7XG4gICAgICBwYXJhbWV0ZXJzLmRpcmVjdG9yaWVzID0gXCJ0cnVlXCI7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCkge1xuICAgICAgICBsZXQgY3VycmVudEN1cnNvciA9IG51bGw7XG4gICAgICAgIGxldCBkb25lID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgYXN5bmMgbmV4dCgpIHtcbiAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgIHJldHVybiB7IGRvbmU6IHRydWUsIHZhbHVlOiB2b2lkIDAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG5leHRQYXJhbWV0ZXJzID0geyAuLi5wYXJhbWV0ZXJzIH07XG4gICAgICAgICAgICBpZiAoY3VycmVudEN1cnNvciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICBuZXh0UGFyYW1ldGVycy5jdXJzb3IgPSBjdXJyZW50Q3Vyc29yO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgY2xpZW50Lm1ha2VSZXF1ZXN0KHtcbiAgICAgICAgICAgICAgbWV0aG9kOiBcImdldFwiLFxuICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiBuZXh0UGFyYW1ldGVycyxcbiAgICAgICAgICAgICAgc3RvcmVOYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGxldCBibG9icyA9IFtdO1xuICAgICAgICAgICAgbGV0IGRpcmVjdG9yaWVzID0gW107XG4gICAgICAgICAgICBpZiAoIVsyMDAsIDIwNCwgNDA0XS5pbmNsdWRlcyhyZXMuc3RhdHVzKSkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgQmxvYnNJbnRlcm5hbEVycm9yKHJlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVzLnN0YXR1cyA9PT0gNDA0KSB7XG4gICAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY29uc3QgcGFnZSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgICAgICAgIGlmIChwYWdlLm5leHRfY3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudEN1cnNvciA9IHBhZ2UubmV4dF9jdXJzb3I7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZG9uZSA9IHRydWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYmxvYnMgPSAocGFnZS5ibG9icyA/PyBbXSkubWFwKF9TdG9yZS5mb3JtYXRMaXN0UmVzdWx0QmxvYikuZmlsdGVyKEJvb2xlYW4pO1xuICAgICAgICAgICAgICBkaXJlY3RvcmllcyA9IHBhZ2UuZGlyZWN0b3JpZXMgPz8gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBkb25lOiBmYWxzZSxcbiAgICAgICAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICAgICAgICBibG9icyxcbiAgICAgICAgICAgICAgICBkaXJlY3Rvcmllc1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG59O1xudmFyIGdldFN0b3JlID0gKGlucHV0KSA9PiB7XG4gIGlmICh0eXBlb2YgaW5wdXQgPT09IFwic3RyaW5nXCIpIHtcbiAgICBjb25zdCBjbGllbnRPcHRpb25zID0gZ2V0Q2xpZW50T3B0aW9ucyh7fSk7XG4gICAgY29uc3QgY2xpZW50ID0gbmV3IENsaWVudChjbGllbnRPcHRpb25zKTtcbiAgICByZXR1cm4gbmV3IFN0b3JlKHsgY2xpZW50LCBuYW1lOiBpbnB1dCB9KTtcbiAgfVxuICBpZiAodHlwZW9mIGlucHV0Py5uYW1lID09PSBcInN0cmluZ1wiKSB7XG4gICAgY29uc3QgeyBuYW1lIH0gPSBpbnB1dDtcbiAgICBjb25zdCBjbGllbnRPcHRpb25zID0gZ2V0Q2xpZW50T3B0aW9ucyhpbnB1dCk7XG4gICAgaWYgKCFuYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgTWlzc2luZ0Jsb2JzRW52aXJvbm1lbnRFcnJvcihbXCJuYW1lXCJdKTtcbiAgICB9XG4gICAgY29uc3QgY2xpZW50ID0gbmV3IENsaWVudChjbGllbnRPcHRpb25zKTtcbiAgICByZXR1cm4gbmV3IFN0b3JlKHsgY2xpZW50LCBuYW1lIH0pO1xuICB9XG4gIGlmICh0eXBlb2YgaW5wdXQ/LmRlcGxveUlEID09PSBcInN0cmluZ1wiKSB7XG4gICAgY29uc3QgY2xpZW50T3B0aW9ucyA9IGdldENsaWVudE9wdGlvbnMoaW5wdXQpO1xuICAgIGNvbnN0IHsgZGVwbG95SUQgfSA9IGlucHV0O1xuICAgIGlmICghZGVwbG95SUQpIHtcbiAgICAgIHRocm93IG5ldyBNaXNzaW5nQmxvYnNFbnZpcm9ubWVudEVycm9yKFtcImRlcGxveUlEXCJdKTtcbiAgICB9XG4gICAgY29uc3QgY2xpZW50ID0gbmV3IENsaWVudChjbGllbnRPcHRpb25zKTtcbiAgICByZXR1cm4gbmV3IFN0b3JlKHsgY2xpZW50LCBkZXBsb3lJRCB9KTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgXCJUaGUgYGdldFN0b3JlYCBtZXRob2QgcmVxdWlyZXMgdGhlIG5hbWUgb2YgdGhlIHN0b3JlIGFzIGEgc3RyaW5nIG9yIGFzIHRoZSBgbmFtZWAgcHJvcGVydHkgb2YgYW4gb3B0aW9ucyBvYmplY3RcIlxuICApO1xufTtcblxuLy8gc3JjL2Z1bmN0aW9ucy9lZGdlLWNvbmZpZy5tdHNcbnZhciBlZGdlX2NvbmZpZ19kZWZhdWx0ID0gYXN5bmMgKHJlcSkgPT4ge1xuICBjb25zdCByZXF1ZXN0S2V5ID0gcmVxLmhlYWRlcnMuZ2V0KFwiQXV0aG9yaXphdGlvblwiKT8uc3BsaXQoXCIgXCIpWzFdO1xuICBjb25zdCBzaGFyZWRLZXkgPSBOZXRsaWZ5LmVudi5nZXQoXCJMQVVOQ0hEQVJLTFlfU0hBUkVEX1NFQ1JFVFwiKTtcbiAgaWYgKHNoYXJlZEtleSA9PT0gdm9pZCAwIHx8IHNoYXJlZEtleSA9PT0gXCJcIiB8fCByZXF1ZXN0S2V5ICE9PSBzaGFyZWRLZXkpIHtcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKFwiQXV0aG9yaXphdGlvbiBtaXNzaW5nLlwiLCB7IHN0YXR1czogNDAxIH0pO1xuICB9XG4gIGNvbnN0IGJsb2JzID0gZ2V0U3RvcmUoXCJvZmZpY2lhbC1sYXVuY2hkYXJrbHlcIik7XG4gIGF3YWl0IGJsb2JzLnNldChcImRlZmF1bHRcIiwgYXdhaXQgcmVxLnRleHQoKSwge1xuICAgIG1ldGFkYXRhOiB7IHVwZGF0ZWRBdDogKC8qIEBfX1BVUkVfXyAqLyBuZXcgRGF0ZSgpKS50b0lTT1N0cmluZygpIH1cbiAgfSk7XG4gIHJldHVybiBuZXcgUmVzcG9uc2UoXCJPS1wiKTtcbn07XG52YXIgY29uZmlnID0ge1xuICBtZXRob2Q6IFwiUFVUXCIsXG4gIHBhdGg6IFwiLy5vZmZpY2lhbC1sYXVuY2hkYXJrbHkvZWRnZS1jb25maWdcIlxufTtcbmV4cG9ydCB7XG4gIGNvbmZpZyxcbiAgZWRnZV9jb25maWdfZGVmYXVsdCBhcyBkZWZhdWx0XG59O1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7OztBQUNBLElBQUksV0FBVztBQUNmLElBQUksZ0JBQWdCO0FBQ3BCLElBQUkscUJBQXFCLGNBQWMsTUFBTTtBQUFBLEVBQzNDLFlBQVksS0FBSztBQUNmLFFBQUksVUFBVSxJQUFJLFFBQVEsSUFBSSxRQUFRLEtBQUss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

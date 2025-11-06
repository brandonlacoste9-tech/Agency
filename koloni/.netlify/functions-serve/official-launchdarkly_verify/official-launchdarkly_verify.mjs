
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// ../.netlify/functions-internal/official-launchdarkly_verify.mts
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
var verify_default = async (req) => {
  const requestKey = req.headers.get("Authorization")?.split(" ")[1];
  const sharedKey = Netlify.env.get("LAUNCHDARKLY_SHARED_SECRET");
  if (sharedKey === void 0 || sharedKey === "" || requestKey !== sharedKey) {
    return new Response("Authorization missing.", { status: 401 });
  }
  const blobs = getStore("official-launchdarkly");
  const metadata = await blobs.getMetadata("default", {
    consistency: "strong"
  });
  const updateDate = metadata?.metadata["updatedAt"];
  return new Response(JSON.stringify({ updateDate }));
};
var config = {
  method: "GET",
  path: "/.official-launchdarkly/verify"
};
export {
  config,
  verify_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLm5ldGxpZnkvZnVuY3Rpb25zLWludGVybmFsL29mZmljaWFsLWxhdW5jaGRhcmtseV92ZXJpZnkubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyBub2RlX21vZHVsZXMvLnBucG0vQG5ldGxpZnkrYmxvYnNAOC4wLjEvbm9kZV9tb2R1bGVzL0BuZXRsaWZ5L2Jsb2JzL2Rpc3QvY2h1bmstR1VFVzM0Q1AuanNcbnZhciBORl9FUlJPUiA9IFwieC1uZi1lcnJvclwiO1xudmFyIE5GX1JFUVVFU1RfSUQgPSBcIngtbmYtcmVxdWVzdC1pZFwiO1xudmFyIEJsb2JzSW50ZXJuYWxFcnJvciA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZXMpIHtcbiAgICBsZXQgZGV0YWlscyA9IHJlcy5oZWFkZXJzLmdldChORl9FUlJPUikgfHwgYCR7cmVzLnN0YXR1c30gc3RhdHVzIGNvZGVgO1xuICAgIGlmIChyZXMuaGVhZGVycy5oYXMoTkZfUkVRVUVTVF9JRCkpIHtcbiAgICAgIGRldGFpbHMgKz0gYCwgSUQ6ICR7cmVzLmhlYWRlcnMuZ2V0KE5GX1JFUVVFU1RfSUQpfWA7XG4gICAgfVxuICAgIHN1cGVyKGBOZXRsaWZ5IEJsb2JzIGhhcyBnZW5lcmF0ZWQgYW4gaW50ZXJuYWwgZXJyb3IgKCR7ZGV0YWlsc30pYCk7XG4gICAgdGhpcy5uYW1lID0gXCJCbG9ic0ludGVybmFsRXJyb3JcIjtcbiAgfVxufTtcbnZhciBjb2xsZWN0SXRlcmF0b3IgPSBhc3luYyAoaXRlcmF0b3IpID0+IHtcbiAgY29uc3QgcmVzdWx0ID0gW107XG4gIGZvciBhd2FpdCAoY29uc3QgaXRlbSBvZiBpdGVyYXRvcikge1xuICAgIHJlc3VsdC5wdXNoKGl0ZW0pO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59O1xudmFyIGJhc2U2NERlY29kZSA9IChpbnB1dCkgPT4ge1xuICBjb25zdCB7IEJ1ZmZlciB9ID0gZ2xvYmFsVGhpcztcbiAgaWYgKEJ1ZmZlcikge1xuICAgIHJldHVybiBCdWZmZXIuZnJvbShpbnB1dCwgXCJiYXNlNjRcIikudG9TdHJpbmcoKTtcbiAgfVxuICByZXR1cm4gYXRvYihpbnB1dCk7XG59O1xudmFyIGJhc2U2NEVuY29kZSA9IChpbnB1dCkgPT4ge1xuICBjb25zdCB7IEJ1ZmZlciB9ID0gZ2xvYmFsVGhpcztcbiAgaWYgKEJ1ZmZlcikge1xuICAgIHJldHVybiBCdWZmZXIuZnJvbShpbnB1dCkudG9TdHJpbmcoXCJiYXNlNjRcIik7XG4gIH1cbiAgcmV0dXJuIGJ0b2EoaW5wdXQpO1xufTtcbnZhciBnZXRFbnZpcm9ubWVudCA9ICgpID0+IHtcbiAgY29uc3QgeyBEZW5vLCBOZXRsaWZ5OiBOZXRsaWZ5MiwgcHJvY2VzcyB9ID0gZ2xvYmFsVGhpcztcbiAgcmV0dXJuIE5ldGxpZnkyPy5lbnYgPz8gRGVubz8uZW52ID8/IHtcbiAgICBkZWxldGU6IChrZXkpID0+IGRlbGV0ZSBwcm9jZXNzPy5lbnZba2V5XSxcbiAgICBnZXQ6IChrZXkpID0+IHByb2Nlc3M/LmVudltrZXldLFxuICAgIGhhczogKGtleSkgPT4gQm9vbGVhbihwcm9jZXNzPy5lbnZba2V5XSksXG4gICAgc2V0OiAoa2V5LCB2YWx1ZSkgPT4ge1xuICAgICAgaWYgKHByb2Nlc3M/LmVudikge1xuICAgICAgICBwcm9jZXNzLmVudltrZXldID0gdmFsdWU7XG4gICAgICB9XG4gICAgfSxcbiAgICB0b09iamVjdDogKCkgPT4gcHJvY2Vzcz8uZW52ID8/IHt9XG4gIH07XG59O1xudmFyIGdldEVudmlyb25tZW50Q29udGV4dCA9ICgpID0+IHtcbiAgY29uc3QgY29udGV4dCA9IGdsb2JhbFRoaXMubmV0bGlmeUJsb2JzQ29udGV4dCB8fCBnZXRFbnZpcm9ubWVudCgpLmdldChcIk5FVExJRllfQkxPQlNfQ09OVEVYVFwiKTtcbiAgaWYgKHR5cGVvZiBjb250ZXh0ICE9PSBcInN0cmluZ1wiIHx8ICFjb250ZXh0KSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG4gIGNvbnN0IGRhdGEgPSBiYXNlNjREZWNvZGUoY29udGV4dCk7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UoZGF0YSk7XG4gIH0gY2F0Y2gge1xuICB9XG4gIHJldHVybiB7fTtcbn07XG52YXIgTWlzc2luZ0Jsb2JzRW52aXJvbm1lbnRFcnJvciA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZXF1aXJlZFByb3BlcnRpZXMpIHtcbiAgICBzdXBlcihcbiAgICAgIGBUaGUgZW52aXJvbm1lbnQgaGFzIG5vdCBiZWVuIGNvbmZpZ3VyZWQgdG8gdXNlIE5ldGxpZnkgQmxvYnMuIFRvIHVzZSBpdCBtYW51YWxseSwgc3VwcGx5IHRoZSBmb2xsb3dpbmcgcHJvcGVydGllcyB3aGVuIGNyZWF0aW5nIGEgc3RvcmU6ICR7cmVxdWlyZWRQcm9wZXJ0aWVzLmpvaW4oXG4gICAgICAgIFwiLCBcIlxuICAgICAgKX1gXG4gICAgKTtcbiAgICB0aGlzLm5hbWUgPSBcIk1pc3NpbmdCbG9ic0Vudmlyb25tZW50RXJyb3JcIjtcbiAgfVxufTtcbnZhciBCQVNFNjRfUFJFRklYID0gXCJiNjQ7XCI7XG52YXIgTUVUQURBVEFfSEVBREVSX0lOVEVSTkFMID0gXCJ4LWFtei1tZXRhLXVzZXJcIjtcbnZhciBNRVRBREFUQV9IRUFERVJfRVhURVJOQUwgPSBcIm5ldGxpZnktYmxvYnMtbWV0YWRhdGFcIjtcbnZhciBNRVRBREFUQV9NQVhfU0laRSA9IDIgKiAxMDI0O1xudmFyIGVuY29kZU1ldGFkYXRhID0gKG1ldGFkYXRhKSA9PiB7XG4gIGlmICghbWV0YWRhdGEpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBjb25zdCBlbmNvZGVkT2JqZWN0ID0gYmFzZTY0RW5jb2RlKEpTT04uc3RyaW5naWZ5KG1ldGFkYXRhKSk7XG4gIGNvbnN0IHBheWxvYWQgPSBgYjY0OyR7ZW5jb2RlZE9iamVjdH1gO1xuICBpZiAoTUVUQURBVEFfSEVBREVSX0VYVEVSTkFMLmxlbmd0aCArIHBheWxvYWQubGVuZ3RoID4gTUVUQURBVEFfTUFYX1NJWkUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZXRhZGF0YSBvYmplY3QgZXhjZWVkcyB0aGUgbWF4aW11bSBzaXplXCIpO1xuICB9XG4gIHJldHVybiBwYXlsb2FkO1xufTtcbnZhciBkZWNvZGVNZXRhZGF0YSA9IChoZWFkZXIpID0+IHtcbiAgaWYgKCFoZWFkZXIgfHwgIWhlYWRlci5zdGFydHNXaXRoKEJBU0U2NF9QUkVGSVgpKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG4gIGNvbnN0IGVuY29kZWREYXRhID0gaGVhZGVyLnNsaWNlKEJBU0U2NF9QUkVGSVgubGVuZ3RoKTtcbiAgY29uc3QgZGVjb2RlZERhdGEgPSBiYXNlNjREZWNvZGUoZW5jb2RlZERhdGEpO1xuICBjb25zdCBtZXRhZGF0YSA9IEpTT04ucGFyc2UoZGVjb2RlZERhdGEpO1xuICByZXR1cm4gbWV0YWRhdGE7XG59O1xudmFyIGdldE1ldGFkYXRhRnJvbVJlc3BvbnNlID0gKHJlc3BvbnNlKSA9PiB7XG4gIGlmICghcmVzcG9uc2UuaGVhZGVycykge1xuICAgIHJldHVybiB7fTtcbiAgfVxuICBjb25zdCB2YWx1ZSA9IHJlc3BvbnNlLmhlYWRlcnMuZ2V0KE1FVEFEQVRBX0hFQURFUl9FWFRFUk5BTCkgfHwgcmVzcG9uc2UuaGVhZGVycy5nZXQoTUVUQURBVEFfSEVBREVSX0lOVEVSTkFMKTtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZGVjb2RlTWV0YWRhdGEodmFsdWUpO1xuICB9IGNhdGNoIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBcIkFuIGludGVybmFsIGVycm9yIG9jY3VycmVkIHdoaWxlIHRyeWluZyB0byByZXRyaWV2ZSB0aGUgbWV0YWRhdGEgZm9yIGFuIGVudHJ5LiBQbGVhc2UgdHJ5IHVwZGF0aW5nIHRvIHRoZSBsYXRlc3QgdmVyc2lvbiBvZiB0aGUgTmV0bGlmeSBCbG9icyBjbGllbnQuXCJcbiAgICApO1xuICB9XG59O1xudmFyIEJsb2JzQ29uc2lzdGVuY3lFcnJvciA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIGBOZXRsaWZ5IEJsb2JzIGhhcyBmYWlsZWQgdG8gcGVyZm9ybSBhIHJlYWQgdXNpbmcgc3Ryb25nIGNvbnNpc3RlbmN5IGJlY2F1c2UgdGhlIGVudmlyb25tZW50IGhhcyBub3QgYmVlbiBjb25maWd1cmVkIHdpdGggYSAndW5jYWNoZWRFZGdlVVJMJyBwcm9wZXJ0eWBcbiAgICApO1xuICAgIHRoaXMubmFtZSA9IFwiQmxvYnNDb25zaXN0ZW5jeUVycm9yXCI7XG4gIH1cbn07XG52YXIgcmVnaW9ucyA9IHtcbiAgXCJ1cy1lYXN0LTFcIjogdHJ1ZSxcbiAgXCJ1cy1lYXN0LTJcIjogdHJ1ZVxufTtcbnZhciBpc1ZhbGlkUmVnaW9uID0gKGlucHV0KSA9PiBPYmplY3Qua2V5cyhyZWdpb25zKS5pbmNsdWRlcyhpbnB1dCk7XG52YXIgSW52YWxpZEJsb2JzUmVnaW9uRXJyb3IgPSBjbGFzcyBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IocmVnaW9uKSB7XG4gICAgc3VwZXIoXG4gICAgICBgJHtyZWdpb259IGlzIG5vdCBhIHN1cHBvcnRlZCBOZXRsaWZ5IEJsb2JzIHJlZ2lvbi4gU3VwcG9ydGVkIHZhbHVlcyBhcmU6ICR7T2JqZWN0LmtleXMocmVnaW9ucykuam9pbihcIiwgXCIpfS5gXG4gICAgKTtcbiAgICB0aGlzLm5hbWUgPSBcIkludmFsaWRCbG9ic1JlZ2lvbkVycm9yXCI7XG4gIH1cbn07XG52YXIgREVGQVVMVF9SRVRSWV9ERUxBWSA9IGdldEVudmlyb25tZW50KCkuZ2V0KFwiTk9ERV9FTlZcIikgPT09IFwidGVzdFwiID8gMSA6IDVlMztcbnZhciBNSU5fUkVUUllfREVMQVkgPSAxZTM7XG52YXIgTUFYX1JFVFJZID0gNTtcbnZhciBSQVRFX0xJTUlUX0hFQURFUiA9IFwiWC1SYXRlTGltaXQtUmVzZXRcIjtcbnZhciBmZXRjaEFuZFJldHJ5ID0gYXN5bmMgKGZldGNoLCB1cmwsIG9wdGlvbnMsIGF0dGVtcHRzTGVmdCA9IE1BWF9SRVRSWSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwgb3B0aW9ucyk7XG4gICAgaWYgKGF0dGVtcHRzTGVmdCA+IDAgJiYgKHJlcy5zdGF0dXMgPT09IDQyOSB8fCByZXMuc3RhdHVzID49IDUwMCkpIHtcbiAgICAgIGNvbnN0IGRlbGF5ID0gZ2V0RGVsYXkocmVzLmhlYWRlcnMuZ2V0KFJBVEVfTElNSVRfSEVBREVSKSk7XG4gICAgICBhd2FpdCBzbGVlcChkZWxheSk7XG4gICAgICByZXR1cm4gZmV0Y2hBbmRSZXRyeShmZXRjaCwgdXJsLCBvcHRpb25zLCBhdHRlbXB0c0xlZnQgLSAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBpZiAoYXR0ZW1wdHNMZWZ0ID09PSAwKSB7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gICAgY29uc3QgZGVsYXkgPSBnZXREZWxheSgpO1xuICAgIGF3YWl0IHNsZWVwKGRlbGF5KTtcbiAgICByZXR1cm4gZmV0Y2hBbmRSZXRyeShmZXRjaCwgdXJsLCBvcHRpb25zLCBhdHRlbXB0c0xlZnQgLSAxKTtcbiAgfVxufTtcbnZhciBnZXREZWxheSA9IChyYXRlTGltaXRSZXNldCkgPT4ge1xuICBpZiAoIXJhdGVMaW1pdFJlc2V0KSB7XG4gICAgcmV0dXJuIERFRkFVTFRfUkVUUllfREVMQVk7XG4gIH1cbiAgcmV0dXJuIE1hdGgubWF4KE51bWJlcihyYXRlTGltaXRSZXNldCkgKiAxZTMgLSBEYXRlLm5vdygpLCBNSU5fUkVUUllfREVMQVkpO1xufTtcbnZhciBzbGVlcCA9IChtcykgPT4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgc2V0VGltZW91dChyZXNvbHZlLCBtcyk7XG59KTtcbnZhciBTSUdORURfVVJMX0FDQ0VQVF9IRUFERVIgPSBcImFwcGxpY2F0aW9uL2pzb247dHlwZT1zaWduZWQtdXJsXCI7XG52YXIgQ2xpZW50ID0gY2xhc3Mge1xuICBjb25zdHJ1Y3Rvcih7IGFwaVVSTCwgY29uc2lzdGVuY3ksIGVkZ2VVUkwsIGZldGNoLCByZWdpb24sIHNpdGVJRCwgdG9rZW4sIHVuY2FjaGVkRWRnZVVSTCB9KSB7XG4gICAgdGhpcy5hcGlVUkwgPSBhcGlVUkw7XG4gICAgdGhpcy5jb25zaXN0ZW5jeSA9IGNvbnNpc3RlbmN5ID8/IFwiZXZlbnR1YWxcIjtcbiAgICB0aGlzLmVkZ2VVUkwgPSBlZGdlVVJMO1xuICAgIHRoaXMuZmV0Y2ggPSBmZXRjaCA/PyBnbG9iYWxUaGlzLmZldGNoO1xuICAgIHRoaXMucmVnaW9uID0gcmVnaW9uO1xuICAgIHRoaXMuc2l0ZUlEID0gc2l0ZUlEO1xuICAgIHRoaXMudG9rZW4gPSB0b2tlbjtcbiAgICB0aGlzLnVuY2FjaGVkRWRnZVVSTCA9IHVuY2FjaGVkRWRnZVVSTDtcbiAgICBpZiAoIXRoaXMuZmV0Y2gpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJOZXRsaWZ5IEJsb2JzIGNvdWxkIG5vdCBmaW5kIGEgYGZldGNoYCBjbGllbnQgaW4gdGhlIGdsb2JhbCBzY29wZS4gWW91IGNhbiBlaXRoZXIgdXBkYXRlIHlvdXIgcnVudGltZSB0byBhIHZlcnNpb24gdGhhdCBpbmNsdWRlcyBgZmV0Y2hgIChsaWtlIE5vZGUuanMgMTguMC4wIG9yIGFib3ZlKSwgb3IgeW91IGNhbiBzdXBwbHkgeW91ciBvd24gaW1wbGVtZW50YXRpb24gdXNpbmcgdGhlIGBmZXRjaGAgcHJvcGVydHkuXCJcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIGFzeW5jIGdldEZpbmFsUmVxdWVzdCh7XG4gICAgY29uc2lzdGVuY3k6IG9wQ29uc2lzdGVuY3ksXG4gICAga2V5LFxuICAgIG1ldGFkYXRhLFxuICAgIG1ldGhvZCxcbiAgICBwYXJhbWV0ZXJzID0ge30sXG4gICAgc3RvcmVOYW1lXG4gIH0pIHtcbiAgICBjb25zdCBlbmNvZGVkTWV0YWRhdGEgPSBlbmNvZGVNZXRhZGF0YShtZXRhZGF0YSk7XG4gICAgY29uc3QgY29uc2lzdGVuY3kgPSBvcENvbnNpc3RlbmN5ID8/IHRoaXMuY29uc2lzdGVuY3k7XG4gICAgbGV0IHVybFBhdGggPSBgLyR7dGhpcy5zaXRlSUR9YDtcbiAgICBpZiAoc3RvcmVOYW1lKSB7XG4gICAgICB1cmxQYXRoICs9IGAvJHtzdG9yZU5hbWV9YDtcbiAgICB9XG4gICAgaWYgKGtleSkge1xuICAgICAgdXJsUGF0aCArPSBgLyR7a2V5fWA7XG4gICAgfVxuICAgIGlmICh0aGlzLmVkZ2VVUkwpIHtcbiAgICAgIGlmIChjb25zaXN0ZW5jeSA9PT0gXCJzdHJvbmdcIiAmJiAhdGhpcy51bmNhY2hlZEVkZ2VVUkwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEJsb2JzQ29uc2lzdGVuY3lFcnJvcigpO1xuICAgICAgfVxuICAgICAgY29uc3QgaGVhZGVycyA9IHtcbiAgICAgICAgYXV0aG9yaXphdGlvbjogYEJlYXJlciAke3RoaXMudG9rZW59YFxuICAgICAgfTtcbiAgICAgIGlmIChlbmNvZGVkTWV0YWRhdGEpIHtcbiAgICAgICAgaGVhZGVyc1tNRVRBREFUQV9IRUFERVJfSU5URVJOQUxdID0gZW5jb2RlZE1ldGFkYXRhO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMucmVnaW9uKSB7XG4gICAgICAgIHVybFBhdGggPSBgL3JlZ2lvbjoke3RoaXMucmVnaW9ufSR7dXJsUGF0aH1gO1xuICAgICAgfVxuICAgICAgY29uc3QgdXJsMiA9IG5ldyBVUkwodXJsUGF0aCwgY29uc2lzdGVuY3kgPT09IFwic3Ryb25nXCIgPyB0aGlzLnVuY2FjaGVkRWRnZVVSTCA6IHRoaXMuZWRnZVVSTCk7XG4gICAgICBmb3IgKGNvbnN0IGtleTIgaW4gcGFyYW1ldGVycykge1xuICAgICAgICB1cmwyLnNlYXJjaFBhcmFtcy5zZXQoa2V5MiwgcGFyYW1ldGVyc1trZXkyXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICBoZWFkZXJzLFxuICAgICAgICB1cmw6IHVybDIudG9TdHJpbmcoKVxuICAgICAgfTtcbiAgICB9XG4gICAgY29uc3QgYXBpSGVhZGVycyA9IHsgYXV0aG9yaXphdGlvbjogYEJlYXJlciAke3RoaXMudG9rZW59YCB9O1xuICAgIGNvbnN0IHVybCA9IG5ldyBVUkwoYC9hcGkvdjEvYmxvYnMke3VybFBhdGh9YCwgdGhpcy5hcGlVUkwgPz8gXCJodHRwczovL2FwaS5uZXRsaWZ5LmNvbVwiKTtcbiAgICBmb3IgKGNvbnN0IGtleTIgaW4gcGFyYW1ldGVycykge1xuICAgICAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoa2V5MiwgcGFyYW1ldGVyc1trZXkyXSk7XG4gICAgfVxuICAgIGlmICh0aGlzLnJlZ2lvbikge1xuICAgICAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoXCJyZWdpb25cIiwgdGhpcy5yZWdpb24pO1xuICAgIH1cbiAgICBpZiAoc3RvcmVOYW1lID09PSB2b2lkIDAgfHwga2V5ID09PSB2b2lkIDApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGhlYWRlcnM6IGFwaUhlYWRlcnMsXG4gICAgICAgIHVybDogdXJsLnRvU3RyaW5nKClcbiAgICAgIH07XG4gICAgfVxuICAgIGlmIChlbmNvZGVkTWV0YWRhdGEpIHtcbiAgICAgIGFwaUhlYWRlcnNbTUVUQURBVEFfSEVBREVSX0VYVEVSTkFMXSA9IGVuY29kZWRNZXRhZGF0YTtcbiAgICB9XG4gICAgaWYgKG1ldGhvZCA9PT0gXCJoZWFkXCIgfHwgbWV0aG9kID09PSBcImRlbGV0ZVwiKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBoZWFkZXJzOiBhcGlIZWFkZXJzLFxuICAgICAgICB1cmw6IHVybC50b1N0cmluZygpXG4gICAgICB9O1xuICAgIH1cbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLmZldGNoKHVybC50b1N0cmluZygpLCB7XG4gICAgICBoZWFkZXJzOiB7IC4uLmFwaUhlYWRlcnMsIGFjY2VwdDogU0lHTkVEX1VSTF9BQ0NFUFRfSEVBREVSIH0sXG4gICAgICBtZXRob2RcbiAgICB9KTtcbiAgICBpZiAocmVzLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICB0aHJvdyBuZXcgQmxvYnNJbnRlcm5hbEVycm9yKHJlcyk7XG4gICAgfVxuICAgIGNvbnN0IHsgdXJsOiBzaWduZWRVUkwgfSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgY29uc3QgdXNlckhlYWRlcnMgPSBlbmNvZGVkTWV0YWRhdGEgPyB7IFtNRVRBREFUQV9IRUFERVJfSU5URVJOQUxdOiBlbmNvZGVkTWV0YWRhdGEgfSA6IHZvaWQgMDtcbiAgICByZXR1cm4ge1xuICAgICAgaGVhZGVyczogdXNlckhlYWRlcnMsXG4gICAgICB1cmw6IHNpZ25lZFVSTFxuICAgIH07XG4gIH1cbiAgYXN5bmMgbWFrZVJlcXVlc3Qoe1xuICAgIGJvZHksXG4gICAgY29uc2lzdGVuY3ksXG4gICAgaGVhZGVyczogZXh0cmFIZWFkZXJzLFxuICAgIGtleSxcbiAgICBtZXRhZGF0YSxcbiAgICBtZXRob2QsXG4gICAgcGFyYW1ldGVycyxcbiAgICBzdG9yZU5hbWVcbiAgfSkge1xuICAgIGNvbnN0IHsgaGVhZGVyczogYmFzZUhlYWRlcnMgPSB7fSwgdXJsIH0gPSBhd2FpdCB0aGlzLmdldEZpbmFsUmVxdWVzdCh7XG4gICAgICBjb25zaXN0ZW5jeSxcbiAgICAgIGtleSxcbiAgICAgIG1ldGFkYXRhLFxuICAgICAgbWV0aG9kLFxuICAgICAgcGFyYW1ldGVycyxcbiAgICAgIHN0b3JlTmFtZVxuICAgIH0pO1xuICAgIGNvbnN0IGhlYWRlcnMgPSB7XG4gICAgICAuLi5iYXNlSGVhZGVycyxcbiAgICAgIC4uLmV4dHJhSGVhZGVyc1xuICAgIH07XG4gICAgaWYgKG1ldGhvZCA9PT0gXCJwdXRcIikge1xuICAgICAgaGVhZGVyc1tcImNhY2hlLWNvbnRyb2xcIl0gPSBcIm1heC1hZ2U9MCwgc3RhbGUtd2hpbGUtcmV2YWxpZGF0ZT02MFwiO1xuICAgIH1cbiAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgYm9keSxcbiAgICAgIGhlYWRlcnMsXG4gICAgICBtZXRob2RcbiAgICB9O1xuICAgIGlmIChib2R5IGluc3RhbmNlb2YgUmVhZGFibGVTdHJlYW0pIHtcbiAgICAgIG9wdGlvbnMuZHVwbGV4ID0gXCJoYWxmXCI7XG4gICAgfVxuICAgIHJldHVybiBmZXRjaEFuZFJldHJ5KHRoaXMuZmV0Y2gsIHVybCwgb3B0aW9ucyk7XG4gIH1cbn07XG52YXIgZ2V0Q2xpZW50T3B0aW9ucyA9IChvcHRpb25zLCBjb250ZXh0T3ZlcnJpZGUpID0+IHtcbiAgY29uc3QgY29udGV4dCA9IGNvbnRleHRPdmVycmlkZSA/PyBnZXRFbnZpcm9ubWVudENvbnRleHQoKTtcbiAgY29uc3Qgc2l0ZUlEID0gY29udGV4dC5zaXRlSUQgPz8gb3B0aW9ucy5zaXRlSUQ7XG4gIGNvbnN0IHRva2VuID0gY29udGV4dC50b2tlbiA/PyBvcHRpb25zLnRva2VuO1xuICBpZiAoIXNpdGVJRCB8fCAhdG9rZW4pIHtcbiAgICB0aHJvdyBuZXcgTWlzc2luZ0Jsb2JzRW52aXJvbm1lbnRFcnJvcihbXCJzaXRlSURcIiwgXCJ0b2tlblwiXSk7XG4gIH1cbiAgaWYgKG9wdGlvbnMucmVnaW9uICE9PSB2b2lkIDAgJiYgIWlzVmFsaWRSZWdpb24ob3B0aW9ucy5yZWdpb24pKSB7XG4gICAgdGhyb3cgbmV3IEludmFsaWRCbG9ic1JlZ2lvbkVycm9yKG9wdGlvbnMucmVnaW9uKTtcbiAgfVxuICBjb25zdCBjbGllbnRPcHRpb25zID0ge1xuICAgIGFwaVVSTDogY29udGV4dC5hcGlVUkwgPz8gb3B0aW9ucy5hcGlVUkwsXG4gICAgY29uc2lzdGVuY3k6IG9wdGlvbnMuY29uc2lzdGVuY3ksXG4gICAgZWRnZVVSTDogY29udGV4dC5lZGdlVVJMID8/IG9wdGlvbnMuZWRnZVVSTCxcbiAgICBmZXRjaDogb3B0aW9ucy5mZXRjaCxcbiAgICByZWdpb246IG9wdGlvbnMucmVnaW9uLFxuICAgIHNpdGVJRCxcbiAgICB0b2tlbixcbiAgICB1bmNhY2hlZEVkZ2VVUkw6IGNvbnRleHQudW5jYWNoZWRFZGdlVVJMID8/IG9wdGlvbnMudW5jYWNoZWRFZGdlVVJMXG4gIH07XG4gIHJldHVybiBjbGllbnRPcHRpb25zO1xufTtcblxuLy8gbm9kZV9tb2R1bGVzLy5wbnBtL0BuZXRsaWZ5K2Jsb2JzQDguMC4xL25vZGVfbW9kdWxlcy9AbmV0bGlmeS9ibG9icy9kaXN0L21haW4uanNcbnZhciBERVBMT1lfU1RPUkVfUFJFRklYID0gXCJkZXBsb3k6XCI7XG52YXIgTEVHQUNZX1NUT1JFX0lOVEVSTkFMX1BSRUZJWCA9IFwibmV0bGlmeS1pbnRlcm5hbC9sZWdhY3ktbmFtZXNwYWNlL1wiO1xudmFyIFNJVEVfU1RPUkVfUFJFRklYID0gXCJzaXRlOlwiO1xudmFyIFN0b3JlID0gY2xhc3MgX1N0b3JlIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgIHRoaXMuY2xpZW50ID0gb3B0aW9ucy5jbGllbnQ7XG4gICAgaWYgKFwiZGVwbG95SURcIiBpbiBvcHRpb25zKSB7XG4gICAgICBfU3RvcmUudmFsaWRhdGVEZXBsb3lJRChvcHRpb25zLmRlcGxveUlEKTtcbiAgICAgIGxldCBuYW1lID0gREVQTE9ZX1NUT1JFX1BSRUZJWCArIG9wdGlvbnMuZGVwbG95SUQ7XG4gICAgICBpZiAob3B0aW9ucy5uYW1lKSB7XG4gICAgICAgIG5hbWUgKz0gYDoke29wdGlvbnMubmFtZX1gO1xuICAgICAgfVxuICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMubmFtZS5zdGFydHNXaXRoKExFR0FDWV9TVE9SRV9JTlRFUk5BTF9QUkVGSVgpKSB7XG4gICAgICBjb25zdCBzdG9yZU5hbWUgPSBvcHRpb25zLm5hbWUuc2xpY2UoTEVHQUNZX1NUT1JFX0lOVEVSTkFMX1BSRUZJWC5sZW5ndGgpO1xuICAgICAgX1N0b3JlLnZhbGlkYXRlU3RvcmVOYW1lKHN0b3JlTmFtZSk7XG4gICAgICB0aGlzLm5hbWUgPSBzdG9yZU5hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIF9TdG9yZS52YWxpZGF0ZVN0b3JlTmFtZShvcHRpb25zLm5hbWUpO1xuICAgICAgdGhpcy5uYW1lID0gU0lURV9TVE9SRV9QUkVGSVggKyBvcHRpb25zLm5hbWU7XG4gICAgfVxuICB9XG4gIGFzeW5jIGRlbGV0ZShrZXkpIHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLmNsaWVudC5tYWtlUmVxdWVzdCh7IGtleSwgbWV0aG9kOiBcImRlbGV0ZVwiLCBzdG9yZU5hbWU6IHRoaXMubmFtZSB9KTtcbiAgICBpZiAoIVsyMDAsIDIwNCwgNDA0XS5pbmNsdWRlcyhyZXMuc3RhdHVzKSkge1xuICAgICAgdGhyb3cgbmV3IEJsb2JzSW50ZXJuYWxFcnJvcihyZXMpO1xuICAgIH1cbiAgfVxuICBhc3luYyBnZXQoa2V5LCBvcHRpb25zKSB7XG4gICAgY29uc3QgeyBjb25zaXN0ZW5jeSwgdHlwZSB9ID0gb3B0aW9ucyA/PyB7fTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLmNsaWVudC5tYWtlUmVxdWVzdCh7IGNvbnNpc3RlbmN5LCBrZXksIG1ldGhvZDogXCJnZXRcIiwgc3RvcmVOYW1lOiB0aGlzLm5hbWUgfSk7XG4gICAgaWYgKHJlcy5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmIChyZXMuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgIHRocm93IG5ldyBCbG9ic0ludGVybmFsRXJyb3IocmVzKTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09IHZvaWQgMCB8fCB0eXBlID09PSBcInRleHRcIikge1xuICAgICAgcmV0dXJuIHJlcy50ZXh0KCk7XG4gICAgfVxuICAgIGlmICh0eXBlID09PSBcImFycmF5QnVmZmVyXCIpIHtcbiAgICAgIHJldHVybiByZXMuYXJyYXlCdWZmZXIoKTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09IFwiYmxvYlwiKSB7XG4gICAgICByZXR1cm4gcmVzLmJsb2IoKTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09IFwianNvblwiKSB7XG4gICAgICByZXR1cm4gcmVzLmpzb24oKTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09IFwic3RyZWFtXCIpIHtcbiAgICAgIHJldHVybiByZXMuYm9keTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEJsb2JzSW50ZXJuYWxFcnJvcihyZXMpO1xuICB9XG4gIGFzeW5jIGdldE1ldGFkYXRhKGtleSwgeyBjb25zaXN0ZW5jeSB9ID0ge30pIHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLmNsaWVudC5tYWtlUmVxdWVzdCh7IGNvbnNpc3RlbmN5LCBrZXksIG1ldGhvZDogXCJoZWFkXCIsIHN0b3JlTmFtZTogdGhpcy5uYW1lIH0pO1xuICAgIGlmIChyZXMuc3RhdHVzID09PSA0MDQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAocmVzLnN0YXR1cyAhPT0gMjAwICYmIHJlcy5zdGF0dXMgIT09IDMwNCkge1xuICAgICAgdGhyb3cgbmV3IEJsb2JzSW50ZXJuYWxFcnJvcihyZXMpO1xuICAgIH1cbiAgICBjb25zdCBldGFnID0gcmVzPy5oZWFkZXJzLmdldChcImV0YWdcIikgPz8gdm9pZCAwO1xuICAgIGNvbnN0IG1ldGFkYXRhID0gZ2V0TWV0YWRhdGFGcm9tUmVzcG9uc2UocmVzKTtcbiAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICBldGFnLFxuICAgICAgbWV0YWRhdGFcbiAgICB9O1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgYXN5bmMgZ2V0V2l0aE1ldGFkYXRhKGtleSwgb3B0aW9ucykge1xuICAgIGNvbnN0IHsgY29uc2lzdGVuY3ksIGV0YWc6IHJlcXVlc3RFVGFnLCB0eXBlIH0gPSBvcHRpb25zID8/IHt9O1xuICAgIGNvbnN0IGhlYWRlcnMgPSByZXF1ZXN0RVRhZyA/IHsgXCJpZi1ub25lLW1hdGNoXCI6IHJlcXVlc3RFVGFnIH0gOiB2b2lkIDA7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy5jbGllbnQubWFrZVJlcXVlc3Qoe1xuICAgICAgY29uc2lzdGVuY3ksXG4gICAgICBoZWFkZXJzLFxuICAgICAga2V5LFxuICAgICAgbWV0aG9kOiBcImdldFwiLFxuICAgICAgc3RvcmVOYW1lOiB0aGlzLm5hbWVcbiAgICB9KTtcbiAgICBpZiAocmVzLnN0YXR1cyA9PT0gNDA0KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKHJlcy5zdGF0dXMgIT09IDIwMCAmJiByZXMuc3RhdHVzICE9PSAzMDQpIHtcbiAgICAgIHRocm93IG5ldyBCbG9ic0ludGVybmFsRXJyb3IocmVzKTtcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2VFVGFnID0gcmVzPy5oZWFkZXJzLmdldChcImV0YWdcIikgPz8gdm9pZCAwO1xuICAgIGNvbnN0IG1ldGFkYXRhID0gZ2V0TWV0YWRhdGFGcm9tUmVzcG9uc2UocmVzKTtcbiAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICBldGFnOiByZXNwb25zZUVUYWcsXG4gICAgICBtZXRhZGF0YVxuICAgIH07XG4gICAgaWYgKHJlcy5zdGF0dXMgPT09IDMwNCAmJiByZXF1ZXN0RVRhZykge1xuICAgICAgcmV0dXJuIHsgZGF0YTogbnVsbCwgLi4ucmVzdWx0IH07XG4gICAgfVxuICAgIGlmICh0eXBlID09PSB2b2lkIDAgfHwgdHlwZSA9PT0gXCJ0ZXh0XCIpIHtcbiAgICAgIHJldHVybiB7IGRhdGE6IGF3YWl0IHJlcy50ZXh0KCksIC4uLnJlc3VsdCB9O1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gXCJhcnJheUJ1ZmZlclwiKSB7XG4gICAgICByZXR1cm4geyBkYXRhOiBhd2FpdCByZXMuYXJyYXlCdWZmZXIoKSwgLi4ucmVzdWx0IH07XG4gICAgfVxuICAgIGlmICh0eXBlID09PSBcImJsb2JcIikge1xuICAgICAgcmV0dXJuIHsgZGF0YTogYXdhaXQgcmVzLmJsb2IoKSwgLi4ucmVzdWx0IH07XG4gICAgfVxuICAgIGlmICh0eXBlID09PSBcImpzb25cIikge1xuICAgICAgcmV0dXJuIHsgZGF0YTogYXdhaXQgcmVzLmpzb24oKSwgLi4ucmVzdWx0IH07XG4gICAgfVxuICAgIGlmICh0eXBlID09PSBcInN0cmVhbVwiKSB7XG4gICAgICByZXR1cm4geyBkYXRhOiByZXMuYm9keSwgLi4ucmVzdWx0IH07XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCAndHlwZScgcHJvcGVydHk6ICR7dHlwZX0uIEV4cGVjdGVkOiBhcnJheUJ1ZmZlciwgYmxvYiwganNvbiwgc3RyZWFtLCBvciB0ZXh0LmApO1xuICB9XG4gIGxpc3Qob3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3QgaXRlcmF0b3IgPSB0aGlzLmdldExpc3RJdGVyYXRvcihvcHRpb25zKTtcbiAgICBpZiAob3B0aW9ucy5wYWdpbmF0ZSkge1xuICAgICAgcmV0dXJuIGl0ZXJhdG9yO1xuICAgIH1cbiAgICByZXR1cm4gY29sbGVjdEl0ZXJhdG9yKGl0ZXJhdG9yKS50aGVuKFxuICAgICAgKGl0ZW1zKSA9PiBpdGVtcy5yZWR1Y2UoXG4gICAgICAgIChhY2MsIGl0ZW0pID0+ICh7XG4gICAgICAgICAgYmxvYnM6IFsuLi5hY2MuYmxvYnMsIC4uLml0ZW0uYmxvYnNdLFxuICAgICAgICAgIGRpcmVjdG9yaWVzOiBbLi4uYWNjLmRpcmVjdG9yaWVzLCAuLi5pdGVtLmRpcmVjdG9yaWVzXVxuICAgICAgICB9KSxcbiAgICAgICAgeyBibG9iczogW10sIGRpcmVjdG9yaWVzOiBbXSB9XG4gICAgICApXG4gICAgKTtcbiAgfVxuICBhc3luYyBzZXQoa2V5LCBkYXRhLCB7IG1ldGFkYXRhIH0gPSB7fSkge1xuICAgIF9TdG9yZS52YWxpZGF0ZUtleShrZXkpO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuY2xpZW50Lm1ha2VSZXF1ZXN0KHtcbiAgICAgIGJvZHk6IGRhdGEsXG4gICAgICBrZXksXG4gICAgICBtZXRhZGF0YSxcbiAgICAgIG1ldGhvZDogXCJwdXRcIixcbiAgICAgIHN0b3JlTmFtZTogdGhpcy5uYW1lXG4gICAgfSk7XG4gICAgaWYgKHJlcy5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgdGhyb3cgbmV3IEJsb2JzSW50ZXJuYWxFcnJvcihyZXMpO1xuICAgIH1cbiAgfVxuICBhc3luYyBzZXRKU09OKGtleSwgZGF0YSwgeyBtZXRhZGF0YSB9ID0ge30pIHtcbiAgICBfU3RvcmUudmFsaWRhdGVLZXkoa2V5KTtcbiAgICBjb25zdCBwYXlsb2FkID0gSlNPTi5zdHJpbmdpZnkoZGF0YSk7XG4gICAgY29uc3QgaGVhZGVycyA9IHtcbiAgICAgIFwiY29udGVudC10eXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiXG4gICAgfTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLmNsaWVudC5tYWtlUmVxdWVzdCh7XG4gICAgICBib2R5OiBwYXlsb2FkLFxuICAgICAgaGVhZGVycyxcbiAgICAgIGtleSxcbiAgICAgIG1ldGFkYXRhLFxuICAgICAgbWV0aG9kOiBcInB1dFwiLFxuICAgICAgc3RvcmVOYW1lOiB0aGlzLm5hbWVcbiAgICB9KTtcbiAgICBpZiAocmVzLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICB0aHJvdyBuZXcgQmxvYnNJbnRlcm5hbEVycm9yKHJlcyk7XG4gICAgfVxuICB9XG4gIHN0YXRpYyBmb3JtYXRMaXN0UmVzdWx0QmxvYihyZXN1bHQpIHtcbiAgICBpZiAoIXJlc3VsdC5rZXkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgZXRhZzogcmVzdWx0LmV0YWcsXG4gICAgICBrZXk6IHJlc3VsdC5rZXlcbiAgICB9O1xuICB9XG4gIHN0YXRpYyB2YWxpZGF0ZUtleShrZXkpIHtcbiAgICBpZiAoa2V5ID09PSBcIlwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCbG9iIGtleSBtdXN0IG5vdCBiZSBlbXB0eS5cIik7XG4gICAgfVxuICAgIGlmIChrZXkuc3RhcnRzV2l0aChcIi9cIikgfHwga2V5LnN0YXJ0c1dpdGgoXCIlMkZcIikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkJsb2Iga2V5IG11c3Qgbm90IHN0YXJ0IHdpdGggZm9yd2FyZCBzbGFzaCAoLykuXCIpO1xuICAgIH1cbiAgICBpZiAobmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKGtleSkubGVuZ3RoID4gNjAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiQmxvYiBrZXkgbXVzdCBiZSBhIHNlcXVlbmNlIG9mIFVuaWNvZGUgY2hhcmFjdGVycyB3aG9zZSBVVEYtOCBlbmNvZGluZyBpcyBhdCBtb3N0IDYwMCBieXRlcyBsb25nLlwiXG4gICAgICApO1xuICAgIH1cbiAgfVxuICBzdGF0aWMgdmFsaWRhdGVEZXBsb3lJRChkZXBsb3lJRCkge1xuICAgIGlmICghL15cXHd7MSwyNH0kLy50ZXN0KGRlcGxveUlEKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAnJHtkZXBsb3lJRH0nIGlzIG5vdCBhIHZhbGlkIE5ldGxpZnkgZGVwbG95IElELmApO1xuICAgIH1cbiAgfVxuICBzdGF0aWMgdmFsaWRhdGVTdG9yZU5hbWUobmFtZSkge1xuICAgIGlmIChuYW1lLmluY2x1ZGVzKFwiL1wiKSB8fCBuYW1lLmluY2x1ZGVzKFwiJTJGXCIpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTdG9yZSBuYW1lIG11c3Qgbm90IGNvbnRhaW4gZm9yd2FyZCBzbGFzaGVzICgvKS5cIik7XG4gICAgfVxuICAgIGlmIChuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUobmFtZSkubGVuZ3RoID4gNjQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJTdG9yZSBuYW1lIG11c3QgYmUgYSBzZXF1ZW5jZSBvZiBVbmljb2RlIGNoYXJhY3RlcnMgd2hvc2UgVVRGLTggZW5jb2RpbmcgaXMgYXQgbW9zdCA2NCBieXRlcyBsb25nLlwiXG4gICAgICApO1xuICAgIH1cbiAgfVxuICBnZXRMaXN0SXRlcmF0b3Iob3B0aW9ucykge1xuICAgIGNvbnN0IHsgY2xpZW50LCBuYW1lOiBzdG9yZU5hbWUgfSA9IHRoaXM7XG4gICAgY29uc3QgcGFyYW1ldGVycyA9IHt9O1xuICAgIGlmIChvcHRpb25zPy5wcmVmaXgpIHtcbiAgICAgIHBhcmFtZXRlcnMucHJlZml4ID0gb3B0aW9ucy5wcmVmaXg7XG4gICAgfVxuICAgIGlmIChvcHRpb25zPy5kaXJlY3Rvcmllcykge1xuICAgICAgcGFyYW1ldGVycy5kaXJlY3RvcmllcyA9IFwidHJ1ZVwiO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpIHtcbiAgICAgICAgbGV0IGN1cnJlbnRDdXJzb3IgPSBudWxsO1xuICAgICAgICBsZXQgZG9uZSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGFzeW5jIG5leHQoKSB7XG4gICAgICAgICAgICBpZiAoZG9uZSkge1xuICAgICAgICAgICAgICByZXR1cm4geyBkb25lOiB0cnVlLCB2YWx1ZTogdm9pZCAwIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBuZXh0UGFyYW1ldGVycyA9IHsgLi4ucGFyYW1ldGVycyB9O1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRDdXJzb3IgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgbmV4dFBhcmFtZXRlcnMuY3Vyc29yID0gY3VycmVudEN1cnNvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGNsaWVudC5tYWtlUmVxdWVzdCh7XG4gICAgICAgICAgICAgIG1ldGhvZDogXCJnZXRcIixcbiAgICAgICAgICAgICAgcGFyYW1ldGVyczogbmV4dFBhcmFtZXRlcnMsXG4gICAgICAgICAgICAgIHN0b3JlTmFtZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBsZXQgYmxvYnMgPSBbXTtcbiAgICAgICAgICAgIGxldCBkaXJlY3RvcmllcyA9IFtdO1xuICAgICAgICAgICAgaWYgKCFbMjAwLCAyMDQsIDQwNF0uaW5jbHVkZXMocmVzLnN0YXR1cykpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEJsb2JzSW50ZXJuYWxFcnJvcihyZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlcy5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgICAgICAgICBkb25lID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICAgICAgICBpZiAocGFnZS5uZXh0X2N1cnNvcikge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRDdXJzb3IgPSBwYWdlLm5leHRfY3Vyc29yO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGJsb2JzID0gKHBhZ2UuYmxvYnMgPz8gW10pLm1hcChfU3RvcmUuZm9ybWF0TGlzdFJlc3VsdEJsb2IpLmZpbHRlcihCb29sZWFuKTtcbiAgICAgICAgICAgICAgZGlyZWN0b3JpZXMgPSBwYWdlLmRpcmVjdG9yaWVzID8/IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgZG9uZTogZmFsc2UsXG4gICAgICAgICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgICAgICAgYmxvYnMsXG4gICAgICAgICAgICAgICAgZGlyZWN0b3JpZXNcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfTtcbiAgfVxufTtcbnZhciBnZXRTdG9yZSA9IChpbnB1dCkgPT4ge1xuICBpZiAodHlwZW9mIGlucHV0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgY29uc3QgY2xpZW50T3B0aW9ucyA9IGdldENsaWVudE9wdGlvbnMoe30pO1xuICAgIGNvbnN0IGNsaWVudCA9IG5ldyBDbGllbnQoY2xpZW50T3B0aW9ucyk7XG4gICAgcmV0dXJuIG5ldyBTdG9yZSh7IGNsaWVudCwgbmFtZTogaW5wdXQgfSk7XG4gIH1cbiAgaWYgKHR5cGVvZiBpbnB1dD8ubmFtZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGNvbnN0IHsgbmFtZSB9ID0gaW5wdXQ7XG4gICAgY29uc3QgY2xpZW50T3B0aW9ucyA9IGdldENsaWVudE9wdGlvbnMoaW5wdXQpO1xuICAgIGlmICghbmFtZSkge1xuICAgICAgdGhyb3cgbmV3IE1pc3NpbmdCbG9ic0Vudmlyb25tZW50RXJyb3IoW1wibmFtZVwiXSk7XG4gICAgfVxuICAgIGNvbnN0IGNsaWVudCA9IG5ldyBDbGllbnQoY2xpZW50T3B0aW9ucyk7XG4gICAgcmV0dXJuIG5ldyBTdG9yZSh7IGNsaWVudCwgbmFtZSB9KTtcbiAgfVxuICBpZiAodHlwZW9mIGlucHV0Py5kZXBsb3lJRCA9PT0gXCJzdHJpbmdcIikge1xuICAgIGNvbnN0IGNsaWVudE9wdGlvbnMgPSBnZXRDbGllbnRPcHRpb25zKGlucHV0KTtcbiAgICBjb25zdCB7IGRlcGxveUlEIH0gPSBpbnB1dDtcbiAgICBpZiAoIWRlcGxveUlEKSB7XG4gICAgICB0aHJvdyBuZXcgTWlzc2luZ0Jsb2JzRW52aXJvbm1lbnRFcnJvcihbXCJkZXBsb3lJRFwiXSk7XG4gICAgfVxuICAgIGNvbnN0IGNsaWVudCA9IG5ldyBDbGllbnQoY2xpZW50T3B0aW9ucyk7XG4gICAgcmV0dXJuIG5ldyBTdG9yZSh7IGNsaWVudCwgZGVwbG95SUQgfSk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgIFwiVGhlIGBnZXRTdG9yZWAgbWV0aG9kIHJlcXVpcmVzIHRoZSBuYW1lIG9mIHRoZSBzdG9yZSBhcyBhIHN0cmluZyBvciBhcyB0aGUgYG5hbWVgIHByb3BlcnR5IG9mIGFuIG9wdGlvbnMgb2JqZWN0XCJcbiAgKTtcbn07XG5cbi8vIHNyYy9mdW5jdGlvbnMvdmVyaWZ5Lm10c1xudmFyIHZlcmlmeV9kZWZhdWx0ID0gYXN5bmMgKHJlcSkgPT4ge1xuICBjb25zdCByZXF1ZXN0S2V5ID0gcmVxLmhlYWRlcnMuZ2V0KFwiQXV0aG9yaXphdGlvblwiKT8uc3BsaXQoXCIgXCIpWzFdO1xuICBjb25zdCBzaGFyZWRLZXkgPSBOZXRsaWZ5LmVudi5nZXQoXCJMQVVOQ0hEQVJLTFlfU0hBUkVEX1NFQ1JFVFwiKTtcbiAgaWYgKHNoYXJlZEtleSA9PT0gdm9pZCAwIHx8IHNoYXJlZEtleSA9PT0gXCJcIiB8fCByZXF1ZXN0S2V5ICE9PSBzaGFyZWRLZXkpIHtcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKFwiQXV0aG9yaXphdGlvbiBtaXNzaW5nLlwiLCB7IHN0YXR1czogNDAxIH0pO1xuICB9XG4gIGNvbnN0IGJsb2JzID0gZ2V0U3RvcmUoXCJvZmZpY2lhbC1sYXVuY2hkYXJrbHlcIik7XG4gIGNvbnN0IG1ldGFkYXRhID0gYXdhaXQgYmxvYnMuZ2V0TWV0YWRhdGEoXCJkZWZhdWx0XCIsIHtcbiAgICBjb25zaXN0ZW5jeTogXCJzdHJvbmdcIlxuICB9KTtcbiAgY29uc3QgdXBkYXRlRGF0ZSA9IG1ldGFkYXRhPy5tZXRhZGF0YVtcInVwZGF0ZWRBdFwiXTtcbiAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IHVwZGF0ZURhdGUgfSkpO1xufTtcbnZhciBjb25maWcgPSB7XG4gIG1ldGhvZDogXCJHRVRcIixcbiAgcGF0aDogXCIvLm9mZmljaWFsLWxhdW5jaGRhcmtseS92ZXJpZnlcIlxufTtcbmV4cG9ydCB7XG4gIGNvbmZpZyxcbiAgdmVyaWZ5X2RlZmF1bHQgYXMgZGVmYXVsdFxufTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7QUFDQSxJQUFJLFdBQVc7QUFDZixJQUFJLGdCQUFnQjtBQUNwQixJQUFJLHFCQUFxQixjQUFjLE1BQU07QUFBQSxFQUMzQyxZQUFZLEtBQUs7QUFDZixRQUFJLFVBQVUsSUFBSSxR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

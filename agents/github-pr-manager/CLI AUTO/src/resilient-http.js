import axios from 'axios';
import axiosRetry from 'axios-retry';

// Configure axios with retry logic for all outbound calls
axiosRetry(axios, {
  retries: 4,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors or 5xx server errors
    return axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error);
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.warn(`Retrying request (attempt ${retryCount}): ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`);
  }
});

// Create GitHub API client with retry capability
export function createGitHubClient(token) {
  const client = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'AdGenXAI-PR-Manager/1.0'
    },
    timeout: 30000 // 30 second timeout
  });

  // Add response interceptor for better error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const { config, response } = error;
      console.error(`GitHub API error: ${config?.method?.toUpperCase()} ${config?.url} - ${response?.status} ${response?.statusText}`);
      
      // Add additional context for debugging
      if (response?.data?.message) {
        console.error(`GitHub API message: ${response.data.message}`);
      }
      
      return Promise.reject(error);
    }
  );

  return client;
}

// Resilient HTTP client for external services
export function createResilientHttpClient(baseURL, options = {}) {
  const client = axios.create({
    baseURL,
    timeout: options.timeout || 15000,
    headers: {
      'User-Agent': 'AdGenXAI-Agent/1.0',
      ...options.headers
    }
  });

  // Add request interceptor for logging
  client.interceptors.request.use(
    (config) => {
      console.debug(`Making request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('Request setup error:', error.message);
      return Promise.reject(error);
    }
  );

  return client;
}

// Export the configured axios instance for direct use
export { axios as resilientAxios };

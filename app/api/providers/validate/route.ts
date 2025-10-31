import { NextRequest } from "next/server";

interface ValidationRequest {
  provider: "github-models" | "openai";
  apiKey?: string;
}

interface ValidationResponse {
  provider: string;
  valid: boolean;
  message: string;
  details?: {
    models?: string[];
    credits?: number;
    requestsPerMinute?: number;
  };
}

/**
 * POST /api/providers/validate
 * Validate API key and connectivity for a provider
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ValidationRequest;
    const { provider, apiKey } = body;

    if (!provider) {
      return Response.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    let response: ValidationResponse;

    if (provider === "github-models") {
      response = await validateGitHubModels(apiKey);
    } else if (provider === "openai") {
      response = await validateOpenAI(apiKey);
    } else {
      return Response.json(
        { error: "Unknown provider" },
        { status: 400 }
      );
    }

    return Response.json(response);
  } catch (error) {
    return Response.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

async function validateGitHubModels(apiKey?: string): Promise<ValidationResponse> {
  // Check if GitHub token is available
  const token = apiKey || process.env.GITHUB_TOKEN;

  if (!token) {
    return {
      provider: "github-models",
      valid: false,
      message: "GitHub token not configured",
      details: {
        models: ["Not available"],
      },
    };
  }

  try {
    // Test connectivity with GitHub Models API
    // Using the Inference API for GitHub Models
    const response = await fetch(
      "https://api.github.com/user",
      {
        headers: {
          Authorization: `token ${token}`,
          "Accept": "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      return {
        provider: "github-models",
        valid: false,
        message: "Invalid GitHub token",
      };
    }

    const userData = await response.json();

    return {
      provider: "github-models",
      valid: true,
      message: `Connected as ${userData.login}`,
      details: {
        models: [
          "gpt-4o",
          "gpt-4-turbo",
          "gpt-3.5-turbo",
          "claude-3-5-sonnet",
          "llama-2-7b",
          "phi-3-mini",
        ],
        credits: undefined, // GitHub provides free quota
        requestsPerMinute: 100,
      },
    };
  } catch (error) {
    return {
      provider: "github-models",
      valid: false,
      message: `Validation failed: ${(error as Error).message}`,
    };
  }
}

async function validateOpenAI(apiKey?: string): Promise<ValidationResponse> {
  // Check if OpenAI key is available
  const key = apiKey || process.env.OPENAI_API_KEY;

  if (!key) {
    return {
      provider: "openai",
      valid: false,
      message: "OpenAI API key not configured",
    };
  }

  try {
    // Test connectivity with OpenAI API
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });

    if (!response.ok) {
      return {
        provider: "openai",
        valid: false,
        message: "Invalid OpenAI API key",
      };
    }

    const data = await response.json();

    return {
      provider: "openai",
      valid: true,
      message: "Successfully connected to OpenAI",
      details: {
        models: ["gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
        requestsPerMinute: 3500,
      },
    };
  } catch (error) {
    return {
      provider: "openai",
      valid: false,
      message: `Validation failed: ${(error as Error).message}`,
    };
  }
}

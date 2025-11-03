"use client";

import { useState } from "react";

interface ProviderStatus {
  provider: string;
  valid: boolean;
  message: string;
  details?: {
    models?: string[];
    credits?: number;
    requestsPerMinute?: number;
  };
}

export default function SettingsPage() {
  const [providers, setProviders] = useState({
    github: { configured: false, validating: false },
    openai: { configured: false, validating: false },
  });

  const [apiKeys, setApiKeys] = useState({
    github: "",
    openai: "",
  });

  const [validationResults, setValidationResults] = useState<
    Record<string, ProviderStatus | null>
  >({
    github: null,
    openai: null,
  });

  const handleValidate = async (provider: "github" | "openai") => {
    setProviders((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], validating: true },
    }));

    try {
      const response = await fetch("/api/providers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: provider === "github" ? "github-models" : "openai",
          apiKey: apiKeys[provider] || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setValidationResults((prev) => ({
          ...prev,
          [provider]: result,
        }));

        if (result.valid) {
          setProviders((prev) => ({
            ...prev,
            [provider]: { ...prev[provider], configured: true },
          }));
        }
      }
    } catch (error) {
      console.error("Validation failed:", error);
      setValidationResults((prev) => ({
        ...prev,
        [provider]: {
          provider,
          valid: false,
          message: "Validation request failed",
        },
      }));
    } finally {
      setProviders((prev) => ({
        ...prev,
        [provider]: { ...prev[provider], validating: false },
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>
          Settings
        </h1>
        <p className="opacity-70" style={{ color: "var(--text)" }}>
          Configure your AI provider integrations
        </p>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GitHub Models */}
        <ProviderCard
          title="GitHub Models (Free)"
          description="Use GitHub's free AI model inference API via GitHub Copilot"
          icon="🐙"
          provider="github"
          configured={providers.github.configured}
          validating={providers.github.validating}
          apiKey={apiKeys.github}
          onApiKeyChange={(value) => setApiKeys((prev) => ({ ...prev, github: value }))}
          onValidate={() => handleValidate("github")}
          validationResult={validationResults.github}
          setup={
            <>
              <h4 className="font-semibold mb-2" style={{ color: "var(--text)" }}>
                Setup Steps:
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm opacity-70 mb-4" style={{ color: "var(--text)" }}>
                <li>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-50">GitHub Settings → Tokens</a></li>
                <li>Create a new fine-grained personal access token</li>
                <li>Grant "Copilot" scope</li>
                <li>Paste token below</li>
              </ol>
            </>
          }
          features={[
            "✅ Free tier available",
            "✅ Multiple models supported",
            "✅ No credit card required",
            "✅ Fast inference",
          ]}
        />

        {/* OpenAI */}
        <ProviderCard
          title="OpenAI (Paid)"
          description="Access to GPT-4, GPT-4 Turbo, and other OpenAI models"
          icon="🤖"
          provider="openai"
          configured={providers.openai.configured}
          validating={providers.openai.validating}
          apiKey={apiKeys.openai}
          onApiKeyChange={(value) => setApiKeys((prev) => ({ ...prev, openai: value }))}
          onValidate={() => handleValidate("openai")}
          validationResult={validationResults.openai}
          setup={
            <>
              <h4 className="font-semibold mb-2" style={{ color: "var(--text)" }}>
                Setup Steps:
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm opacity-70 mb-4" style={{ color: "var(--text)" }}>
                <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-50">OpenAI API Keys</a></li>
                <li>Create a new API key</li>
                <li>Copy the key</li>
                <li>Paste it below</li>
                <li>Set up billing at <a href="https://platform.openai.com/account/billing/overview" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-50">Billing Settings</a></li>
              </ol>
            </>
          }
          features={[
            "✅ Most capable models",
            "✅ GPT-4 Turbo support",
            "✅ Higher rate limits",
            "✅ Advanced features",
          ]}
        />
      </div>

      {/* Provider Comparison */}
      <div
        className="rounded-xl border p-6"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <h2 className="font-bold text-lg mb-4" style={{ color: "var(--text)" }}>
          Provider Comparison
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="text-left py-2 px-4" style={{ color: "var(--text)" }}>
                  Feature
                </th>
                <th className="text-center py-2 px-4" style={{ color: "var(--text)" }}>
                  GitHub Models
                </th>
                <th className="text-center py-2 px-4" style={{ color: "var(--text)" }}>
                  OpenAI
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Cost", "Free", "Pay-as-you-go"],
                ["Best Models", "GPT-4o, Claude 3.5", "GPT-4 Turbo"],
                ["Speed", "Fast", "Very Fast"],
                ["Rate Limit", "100 req/min", "3,500 req/min"],
                ["Recommended For", "Development", "Production"],
              ].map((row) => (
                <tr key={row[0]} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="py-3 px-4" style={{ color: "var(--text)" }}>
                    {row[0]}
                  </td>
                  <td className="text-center py-3 px-4 opacity-70" style={{ color: "var(--text)" }}>
                    {row[1]}
                  </td>
                  <td className="text-center py-3 px-4 opacity-70" style={{ color: "var(--text)" }}>
                    {row[2]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      <div
        className="rounded-xl border p-6"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <h2 className="font-bold text-lg mb-4" style={{ color: "var(--text)" }}>
          Recommendations
        </h2>
        <div className="space-y-3 text-sm">
          <div className="p-3 rounded-lg" style={{ background: "var(--bg)" }}>
            <div className="font-semibold mb-1" style={{ color: "var(--text)" }}>
              🚀 For Getting Started
            </div>
            <p className="opacity-70" style={{ color: "var(--text)" }}>
              Use GitHub Models - it's free and provides access to GPT-4o, Claude 3.5, and other capable models. Perfect for development and experimentation.
            </p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: "var(--bg)" }}>
            <div className="font-semibold mb-1" style={{ color: "var(--text)" }}>
              ⚡ For Production
            </div>
            <p className="opacity-70" style={{ color: "var(--text)" }}>
              Use OpenAI for production workloads - you get higher rate limits (3,500 req/min), faster response times, and access to the most advanced models.
            </p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: "var(--bg)" }}>
            <div className="font-semibold mb-1" style={{ color: "var(--text)" }}>
              🔄 For Failover
            </div>
            <p className="opacity-70" style={{ color: "var(--text)" }}>
              Set up both providers - AdGenXAI automatically falls back to GitHub Models if OpenAI is unavailable or rate-limited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProviderCardProps {
  title: string;
  description: string;
  icon: string;
  provider: string;
  configured: boolean;
  validating: boolean;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  onValidate: () => void;
  validationResult: ProviderStatus | null;
  setup: React.ReactNode;
  features: string[];
}

function ProviderCard({
  title,
  description,
  icon,
  provider,
  configured,
  validating,
  apiKey,
  onApiKeyChange,
  onValidate,
  validationResult,
  setup,
  features,
}: ProviderCardProps) {
  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>
              {title}
            </h3>
            <p className="text-sm opacity-70" style={{ color: "var(--text)" }}>
              {description}
            </p>
          </div>
        </div>
        {configured && (
          <span className="text-sm font-semibold px-3 py-1 rounded-full bg-green-500/20 text-green-400">
            ✓ Configured
          </span>
        )}
      </div>

      {/* Setup Instructions */}
      <div className="mb-4 text-sm">{setup}</div>

      {/* API Key Input */}
      <div className="mb-4">
        <label
          className="block text-sm font-medium mb-2 opacity-70"
          style={{ color: "var(--text)" }}
        >
          API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder={`Enter your ${title.split(" ")[0].toLowerCase()} API key`}
          className="w-full px-4 py-2 rounded-lg border focus:outline-none text-sm"
          style={{
            background: "var(--bg)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        />
        <p className="text-xs opacity-50 mt-1" style={{ color: "var(--text)" }}>
          Your API key is only used for validation and never stored locally
        </p>
      </div>

      {/* Validation Result */}
      {validationResult && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            validationResult.valid
              ? "bg-green-500/10 border border-green-500/30"
              : "bg-red-500/10 border border-red-500/30"
          }`}
        >
          <div
            className={
              validationResult.valid ? "text-green-400" : "text-red-400"
            }
          >
            {validationResult.valid ? "✓" : "✗"} {validationResult.message}
          </div>
          {validationResult.details?.models && (
            <div className="text-xs opacity-70 mt-2" style={{ color: "var(--text)" }}>
              Available models: {validationResult.details.models.join(", ")}
            </div>
          )}
        </div>
      )}

      {/* Features */}
      <div className="mb-4 space-y-1">
        {features.map((feature) => (
          <div key={feature} className="text-sm opacity-70" style={{ color: "var(--text)" }}>
            {feature}
          </div>
        ))}
      </div>

      {/* Validate Button */}
      <button
        onClick={onValidate}
        disabled={!apiKey || validating}
        className="w-full px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
        style={{
          background: "var(--accent)",
          color: "var(--text)",
        }}
      >
        {validating ? "Validating..." : "Validate & Save"}
      </button>
    </div>
  );
}

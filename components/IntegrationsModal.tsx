"use client";

import React, { useState, useEffect, useCallback } from "react";

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PlatformStatus {
  hasClientId: boolean;
  connected: boolean;
  maskedToken?: string | null;
  maskedKey?: string | null;
}

interface PlatformConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  devUrl: string;
  devInstructions: string[];
  clientIdField: string;
  clientSecretField: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "facebook",
    name: "Facebook",
    icon: "fb",
    color: "#1877f2",
    devUrl: "https://developers.facebook.com/apps/",
    devInstructions: [
      "Click 'Create App' → Choose 'Business' type",
      "Name your app (e.g., 'Volts Calendar')",
      "Go to Settings → Basic",
      "Copy your App ID (this is your Client ID)",
      "Copy your App Secret (this is your Client Secret)",
      "Under 'Valid OAuth Redirect URIs', add: http://localhost:3000/api/auth/callback/facebook",
    ],
    clientIdField: "facebookClientId",
    clientSecretField: "facebookClientSecret",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "ig",
    color: "#e4405f",
    devUrl: "https://developers.facebook.com/apps/",
    devInstructions: [
      "Instagram uses the same Meta Developer App as Facebook",
      "In your Meta app, go to 'Add Products' → Instagram Graph API",
      "Go to Settings → Basic",
      "Use the same App ID and App Secret as Facebook",
      "Add redirect URI: http://localhost:3000/api/auth/callback/instagram",
    ],
    clientIdField: "facebookClientId",
    clientSecretField: "facebookClientSecret",
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: "X",
    color: "#0f1419",
    devUrl: "https://developer.x.com/en/portal/dashboard",
    devInstructions: [
      "Sign in to the Developer Portal → Create a new Project + App",
      "Go to 'Keys and tokens' tab",
      "Under 'OAuth 2.0 Client ID and Client Secret':",
      "Copy the Client ID",
      "Copy the Client Secret",
      "Set callback URL to: http://localhost:3000/api/auth/callback/twitter",
      "Enable OAuth 2.0 with 'Authorization code with PKCE'",
    ],
    clientIdField: "twitterClientId",
    clientSecretField: "twitterClientSecret",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "in",
    color: "#0a66c2",
    devUrl: "https://www.linkedin.com/developers/apps",
    devInstructions: [
      "Click 'Create app' → Fill in the details",
      "Go to the 'Auth' tab",
      "Copy the Client ID",
      "Copy the Client Secret",
      "Under 'Authorized redirect URLs', add: http://localhost:3000/api/auth/callback/linkedin",
      "Go to 'Products' tab → Request access to 'Share on LinkedIn'",
    ],
    clientIdField: "linkedinClientId",
    clientSecretField: "linkedinClientSecret",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: "yt",
    color: "#ff0000",
    devUrl: "https://console.cloud.google.com/apis/credentials",
    devInstructions: [
      "Go to Google Cloud Console → Create a new project",
      "Enable 'YouTube Data API v3'",
      "Go to Credentials → Create OAuth 2.0 Client ID",
      "Choose 'Web application'",
      "Add redirect URI: http://localhost:3000/api/auth/callback/youtube",
      "Copy your Client ID and Client Secret",
    ],
    clientIdField: "youtubeClientId",
    clientSecretField: "youtubeClientSecret",
  },
];

const AI_PROVIDERS = [
  {
    id: "gemini",
    name: "Google Gemini",
    icon: "ai",
    color: "#2b7bfb",
    devUrl: "https://aistudio.google.com/app/apikey",
    devInstructions: [
      "Follow the link to Google AI Studio",
      "Sign in with your Google account",
      "Click 'Create API key' at the top left",
      "Copy your key and paste it below",
    ],
    keyField: "geminiApiKey",
  },
  {
    id: "fal",
    name: "Fal.ai (Image AI)",
    icon: "img",
    color: "#a855f7",
    devUrl: "https://fal.ai/dashboard/keys",
    devInstructions: [
      "Click the link above to open the Fal.ai Dashboard",
      "Log in with GitHub or Email",
      "Go to 'Keys' and create a new key",
      ],
    keyField: "falApiKey",
  },
  {
    id: "groq",
    name: "Groq (Fast LLM)",
    icon: "ai",
    color: "#f55036",
    devUrl: "https://console.groq.com/keys",
    devInstructions: [
      "Click the link above to open the Groq Console",
      "Log in with your account",
      "Click 'Create API Key'",
      "Copy the key and paste it below",
    ],
    keyField: "groqApiKey",
  },
  {
    id: "apify",
    name: "Apify (Social Scraper)",
    icon: "api",
    color: "#00c853",
    devUrl: "https://console.apify.com/account/integrations",
    devInstructions: [
      "Sign up for a free Apify account",
      "Go to Settings → Integrations",
      "Copy your Personal API token",
      "Paste the key below to enable the AI Content Cloner",
    ],
    keyField: "apifyApiKey",
  },
];

export default function IntegrationsModal({ isOpen, onClose }: IntegrationsModalProps) {
  const [statuses, setStatuses] = useState<Record<string, PlatformStatus>>({});
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setStatuses(data);
    } catch (e) {
      console.error("Failed to load integration statuses:", e);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchStatuses();

    // Listen for OAuth popup success messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "oauth-success") {
        fetchStatuses();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isOpen, fetchStatuses]);

  if (!isOpen) return null;

  const handleSaveCredentials = async (platform: PlatformConfig) => {
    if (!clientId.trim() || !clientSecret.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [platform.clientIdField]: clientId,
          [platform.clientSecretField]: clientSecret,
        }),
      });
      await fetchStatuses();
      setClientId("");
      setClientSecret("");
      setExpandedPlatform(null);
    } catch (e) {
      console.error("Failed to save credentials:", e);
    }
    setSaving(false);
  };

  const handleSaveApiKey = async (provider: typeof AI_PROVIDERS[0]) => {
    if (!apiKeyInput.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [provider.keyField]: apiKeyInput,
        }),
      });
      await fetchStatuses();
      setApiKeyInput("");
      setExpandedPlatform(null);
    } catch (e) {
      console.error("Failed to save API key:", e);
    }
    setSaving(false);
  };

  const handleConnect = (platformId: string) => {
    // Open the OAuth flow in a popup window
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      `/api/auth/${platformId}`,
      `oauth-${platformId}`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );
  };

  const handleDisconnect = async (platformId: string) => {
    await fetch(`/api/settings?platform=${platformId}`, { method: "DELETE" });
    await fetchStatuses();
  };

  const handleOpenDevPortal = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">System Integrations</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Connect your accounts for automated publishing and AI insights.
          </p>
        </div>

        {/* Platforms List */}
        <div className="p-5 space-y-4 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-slate-200">
          {PLATFORMS.map((platform) => {
            const status = statuses[platform.id] || { hasClientId: false, connected: false, maskedToken: null };
            const isExpanded = expandedPlatform === platform.id;

            return (
              <div
                key={platform.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all shadow-sm"
              >
                {/* Platform Header Row */}
                <div className="flex items-center justify-between p-4 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold uppercase tracking-wider border border-slate-200 shadow-sm bg-white"
                      style={{ color: platform.color }}
                    >
                      {platform.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{platform.name}</p>
                      <p className="text-xs font-semibold mt-0.5">
                        {status.connected ? (
                          <span className="text-emerald-600 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            Connected
                          </span>
                        ) : status.hasClientId ? (
                          <span className="text-amber-600 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                            Ready to connect
                          </span>
                        ) : (
                          <span className="text-slate-400">Not set up</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center gap-2">
                    {status.connected ? (
                      <button
                        onClick={() => handleDisconnect(platform.id)}
                        className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors px-3 py-2"
                      >
                        Disconnect
                      </button>
                    ) : status.hasClientId ? (
                      <button
                        onClick={() => handleConnect(platform.id)}
                        className="px-4 py-2 text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-all focus:ring-2 focus:ring-offset-1 focus:ring-slate-300"
                        style={{ backgroundColor: platform.color }}
                      >
                        Connect
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setExpandedPlatform(isExpanded ? null : platform.id);
                          setClientId("");
                          setClientSecret("");
                        }}
                        className="px-4 py-2 bg-white text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition-all border border-slate-200 shadow-sm"
                      >
                        {isExpanded ? "Cancel" : "Set Up"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Setup Guide */}
                {isExpanded && !status.hasClientId && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-white">
                    {/* Step 1: Instructions */}
                    <div className="mt-3 mb-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Setup Guide</p>
                        <button
                          onClick={() => handleOpenDevPortal(platform.devUrl)}
                          className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-90 text-white shadow-sm"
                          style={{ backgroundColor: platform.color }}
                        >
                          Open Developer Portal →
                        </button>
                      </div>
                      <ol className="space-y-1.5 pl-4 mb-4">
                        {platform.devInstructions.map((step, i) => (
                          <li key={i} className="text-xs font-medium text-slate-600 leading-relaxed list-decimal">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Step 2: Input fields */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Client ID</label>
                        <input
                          type="text"
                          value={clientId}
                          onChange={(e) => setClientId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          placeholder="Paste your Client ID here"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Client Secret</label>
                        <input
                          type="password"
                          value={clientSecret}
                          onChange={(e) => setClientSecret(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          placeholder="Paste your Client Secret here"
                        />
                      </div>
                      <button
                        onClick={() => handleSaveCredentials(platform)}
                        disabled={saving || !clientId.trim() || !clientSecret.trim()}
                        className="w-full py-2.5 text-white text-xs font-bold rounded-lg transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 mt-2"
                        style={{ backgroundColor: platform.color }}
                      >
                        {saving ? "Saving..." : "Save Credentials"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Show "Ready to connect" info when credentials saved but not yet authorized */}
                {status.hasClientId && !status.connected && !isExpanded && (
                  <div className="px-5 py-3 border-t border-slate-100 bg-amber-50">
                    <p className="text-[11px] font-semibold text-amber-700">
                      ✓ Credentials saved. Click <strong className="text-amber-900">Connect</strong> to authorize with {platform.name}.
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-4 pb-2 border-t border-slate-200 mt-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mt-2">AI Providers & Plugins</h3>
            <p className="text-xs font-medium text-slate-500 pl-1 mt-1 mb-2">Configure models for content reverse-engineering and generation.</p>
          </div>

          {AI_PROVIDERS.map((provider) => {
            const status = statuses[provider.id] || { connected: false, maskedKey: null };
            const isExpanded = expandedPlatform === provider.id;

            return (
              <div
                key={provider.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all shadow-sm"
              >
                {/* Provider Header Row */}
                <div className="flex items-center justify-between p-4 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold uppercase tracking-wider border border-slate-200 shadow-sm bg-white"
                      style={{ color: provider.color }}
                    >
                      {provider.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{provider.name}</p>
                      <p className="text-xs font-semibold mt-0.5">
                        {status.connected ? (
                          <span className="text-emerald-600 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            Connected {status.maskedKey ? `(${status.maskedKey})` : ""}
                          </span>
                        ) : (
                          <span className="text-slate-400">Not set up (Using generic fallback)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center gap-2">
                    {status.connected ? (
                      <button
                        onClick={() => handleDisconnect(provider.id)}
                        className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors px-3 py-2"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setExpandedPlatform(isExpanded ? null : provider.id);
                          setApiKeyInput("");
                        }}
                        className="px-4 py-2 bg-white text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition-all border border-slate-200 shadow-sm"
                      >
                        {isExpanded ? "Cancel" : "Provide Key"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Setup Guide */}
                {isExpanded && !status.connected && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-white">
                    {/* Instructions */}
                    <div className="mt-3 mb-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">How to get a key</p>
                        <button
                          onClick={() => handleOpenDevPortal(provider.devUrl)}
                          className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-90 text-white shadow-sm"
                          style={{ backgroundColor: provider.color }}
                        >
                          Get API Key Here →
                        </button>
                      </div>
                      <ol className="space-y-1.5 pl-4 mb-4">
                        {provider.devInstructions.map((step, i) => (
                          <li key={i} className="text-xs font-medium text-slate-600 leading-relaxed list-decimal">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Input field */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Secret API Key</label>
                        <input
                          type="password"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          placeholder="Paste your API Key here..."
                        />
                      </div>
                      <button
                        onClick={() => handleSaveApiKey(provider)}
                        disabled={saving || !apiKeyInput.trim()}
                        className="w-full py-2.5 text-white text-xs font-bold rounded-lg transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 mt-2"
                        style={{ backgroundColor: provider.color }}
                      >
                        {saving ? "Saving..." : "Save API Key"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex-shrink-0 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500">
            Credentials are stored locally and encrypted.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-white text-slate-700 text-sm font-bold shadow-sm hover:bg-slate-100 transition-colors border border-slate-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

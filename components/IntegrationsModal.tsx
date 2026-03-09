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

interface AIProviderConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  devUrl: string;
  devInstructions: string[];
  keyField: string;
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

const AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: "together",
    name: "Together.ai (Free Images)",
    icon: "img",
    color: "#6366f1",
    devUrl: "https://api.together.ai/settings/api-keys",
    devInstructions: [
      "Sign up at together.ai (FREE, no credit card)",
      "Go to Settings → API Keys",
      "Create a new key and copy it",
      "60,000 free images/month included!",
    ],
    keyField: "togetherApiKey",
  },
  {
    id: "pexels",
    name: "Pexels (Free B-Roll)",
    icon: "vid",
    color: "#05a081",
    devUrl: "https://www.pexels.com/api/new/",
    devInstructions: [
      "Sign up for a free Pexels account",
      "Click the link above to go to the API section",
      "Get your free API Key",
      "This provides unlimited aesthetic B-Roll videos!",
    ],
    keyField: "pexelsApiKey",
  },
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
    id: "elevenlabs",
    name: "ElevenLabs (TTS)",
    icon: "mic",
    color: "#83a8f5",
    devUrl: "https://elevenlabs.io/app/api-keys",
    devInstructions: [
      "Sign in to ElevenLabs",
      "Click your profile picture in the bottom left, then 'Profile'",
      "Click the API Keys tab",
      "Copy your Secret API Key",
    ],
    keyField: "elevenLabsApiKey",
  },
  {
    id: "fal",
    name: "Fal.ai (Optional/Legacy)",
    icon: "img",
    color: "#a855f7",
    devUrl: "https://fal.ai/dashboard/keys",
    devInstructions: [
      "Optional — Together.ai is now the primary image provider",
      "Only needed if you prefer Fal.ai for premium models",
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
    id: "rapid",
    name: "RapidAPI (Scraper)",
    icon: "api",
    color: "#00c853",
    devUrl: "https://rapidapi.com/developer/dashboard",
    devInstructions: [
      "Sign up for a RapidAPI account",
      "Go to your Dashboard",
      "Copy your 'X-RapidAPI-Key'",
      "Paste the key below to enable the AI Content Cloner",
    ],
    keyField: "rapidApiKey",
  },
];

export default function IntegrationsModal({ isOpen, onClose }: IntegrationsModalProps) {
  const [statuses, setStatuses] = useState<Record<string, PlatformStatus>>({});
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [groqApiKey, setGroqApiKey] = useState("");
  const [falApiKey, setFalApiKey] = useState("");
  const [togetherApiKey, setTogetherApiKey] = useState("");
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState("");
  const [rapidApiKey, setRapidApiKey] = useState("");
  const [youtubeApiKey, setYoutubeApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      // The API returns statuses directly at the root level (e.g., data.facebook, data.groq)
      setStatuses(data || {});
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

  const handleSaveApiKey = async (provider: AIProviderConfig) => {
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

  const getApiKeyInputState = (providerId: string) => {
    switch (providerId) {
      case "gemini": return geminiApiKey;
      case "groq": return groqApiKey;
      case "fal": return falApiKey;
      case "together": return togetherApiKey;
      case "elevenlabs": return elevenLabsApiKey;
      case "rapid": return rapidApiKey;
      case "youtube": return youtubeApiKey;
      default: return "";
    }
  };

  const setApiKeyInputState = (providerId: string, value: string) => {
    switch (providerId) {
      case "gemini": setGeminiApiKey(value); break;
      case "groq": setGroqApiKey(value); break;
      case "fal": setFalApiKey(value); break;
      case "together": setTogetherApiKey(value); break;
      case "elevenlabs": setElevenLabsApiKey(value); break;
      case "rapid": setRapidApiKey(value); break;
      case "youtube": setYoutubeApiKey(value); break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div
        className="bg-zinc-950/90 w-full max-w-lg rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col max-h-[85vh] backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex-shrink-0 bg-white/[0.02]">
          <h2 className="text-2xl font-bold text-white tracking-wide">System Integrations</h2>
          <p className="text-sm text-zinc-400 mt-2 font-medium">
            Connect your accounts for automated publishing and AI insights.
          </p>
        </div>

        {/* Platforms List */}
        <div className="p-6 space-y-5 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-zinc-700">
          {PLATFORMS.map((platform) => {
            const status = statuses[platform.id] || { hasClientId: false, connected: false, maskedToken: null };
            const isExpanded = expandedPlatform === platform.id;

            return (
              <div
                key={platform.id}
                className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden transition-all shadow-lg hover:border-white/20"
              >
                {/* Platform Header Row */}
                <div className="flex items-center justify-between p-5 bg-black/20">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-[11px] font-bold uppercase tracking-wider border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] bg-white/5"
                      style={{ color: platform.color, borderColor: `${platform.color}40`, boxShadow: `0 0 20px ${platform.color}20` }}
                    >
                      {platform.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white tracking-wide">{platform.name}</p>
                      <p className="text-xs font-semibold mt-1">
                        {status.connected ? (
                          <span className="text-emerald-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] inline-block" />
                            Connected
                          </span>
                        ) : status.hasClientId ? (
                          <span className="text-amber-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] inline-block" />
                            Ready to connect
                          </span>
                        ) : (
                          <span className="text-zinc-500">Not set up</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {/* Action Button */}
                  <div className="flex items-center gap-3">
                    {status.connected ? (
                      <button
                        onClick={() => handleDisconnect(platform.id)}
                        className="text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors px-4 py-2 border border-transparent hover:border-red-500/20"
                      >
                        Disconnect
                      </button>
                    ) : status.hasClientId ? (
                      <button
                        onClick={() => handleConnect(platform.id)}
                        className="px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 transition-all focus:ring-2 focus:ring-offset-1 focus:ring-zinc-700"
                        style={{ backgroundColor: platform.color, boxShadow: `0 0 20px ${platform.color}40` }}
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
                        className="px-5 py-2.5 bg-white/5 text-white text-xs font-bold rounded-xl hover:bg-white/10 transition-all border border-white/10 shadow-lg"
                      >
                        {isExpanded ? "Cancel" : "Setup"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Setup Guide */}
                {isExpanded && !status.hasClientId && (
                  <div className="px-5 pb-5 pt-3 border-t border-white/5 bg-black/40">
                    {/* Step 1: Instructions */}
                    <div className="mt-3 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Setup Guide</p>
                        <button
                          onClick={() => handleOpenDevPortal(platform.devUrl)}
                          className="text-[10px] font-bold px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                          style={{ backgroundColor: platform.color, boxShadow: `0 0 20px ${platform.color}40` }}
                        >
                          Open Developer Portal →
                        </button>
                      </div>
                      <ol className="space-y-2 pl-4 mb-5">
                        {platform.devInstructions.map((step, i) => (
                          <li key={i} className="text-xs font-semibold text-zinc-400 leading-relaxed list-decimal">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Step 2: Input fields */}
                    <div className="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/10 shadow-inner">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Client ID</label>
                        <input
                          type="text"
                          value={clientId}
                          onChange={(e) => setClientId(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
                          placeholder="Paste your Client ID here"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Client Secret</label>
                        <input
                          type="password"
                          value={clientSecret}
                          onChange={(e) => setClientSecret(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
                          placeholder="Paste your Client Secret here"
                        />
                      </div>
                      <button
                        onClick={() => handleSaveCredentials(platform)}
                        disabled={saving || !clientId.trim() || !clientSecret.trim()}
                        className="w-full py-3.5 text-white text-xs font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 mt-3"
                        style={{ backgroundColor: platform.color, boxShadow: `0 0 20px ${platform.color}40` }}
                      >
                        {saving ? "Saving..." : "Save Credentials"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Show "Ready to connect" info when credentials saved but not yet authorized */}
                {status.hasClientId && !status.connected && !isExpanded && (
                  <div className="px-5 py-3.5 border-t border-white/5 bg-amber-500/10">
                    <p className="text-[11px] font-semibold text-amber-400">
                      ✓ Credentials saved. Click <strong className="text-amber-300">Connect</strong> to authorize with {platform.name}.
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-6 pb-2 border-t border-white/10 mt-4">
            <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] pl-1">AI Providers & Plugins</h3>
            <p className="text-xs font-semibold text-zinc-400 pl-1 mt-1.5 mb-3">Configure models for content reverse-engineering and generation.</p>
          </div>

          {AI_PROVIDERS.map((provider) => {
            const status = statuses[provider.id] || { connected: false, maskedKey: null };
            const isExpanded = expandedPlatform === provider.id;

            return (
              <div
                key={provider.id}
                className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden transition-all shadow-lg hover:border-white/20"
              >
                {/* Provider Header Row */}
                <div className="flex items-center justify-between p-5 bg-black/20">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-[11px] font-bold uppercase tracking-wider border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] bg-white/5"
                      style={{ color: provider.color, borderColor: `${provider.color}40`, boxShadow: `0 0 20px ${provider.color}20` }}
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
                  <div className="flex items-center gap-3">
                    {status.connected ? (
                      <button
                        onClick={() => handleDisconnect(provider.id)}
                        className="text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors px-4 py-2 border border-transparent hover:border-red-500/20"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setExpandedPlatform(isExpanded ? null : provider.id);
                          setApiKeyInput("");
                        }}
                        className="px-5 py-2.5 bg-white/5 text-white text-xs font-bold rounded-xl hover:bg-white/10 transition-all border border-white/10 shadow-lg"
                      >
                        {isExpanded ? "Cancel" : "Provide Key"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Setup Guide */}
                {isExpanded && !status.connected && (
                  <div className="px-5 pb-5 pt-3 border-t border-white/5 bg-black/40">
                    {/* Instructions */}
                    <div className="mt-3 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em]">How to get a key</p>
                        <button
                          onClick={() => handleOpenDevPortal(provider.devUrl)}
                          className="text-[10px] font-bold px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                          style={{ backgroundColor: provider.color, boxShadow: `0 0 20px ${provider.color}40` }}
                        >
                          Get API Key Here →
                        </button>
                      </div>
                      <ol className="space-y-2 pl-4 mb-5">
                        {provider.devInstructions.map((step, i) => (
                          <li key={i} className="text-xs font-semibold text-zinc-400 leading-relaxed list-decimal">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Input field */}
                    <div className="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/10 shadow-inner">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Secret API Key</label>
                        <input
                          type="password"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
                          placeholder="Paste your API Key here..."
                        />
                      </div>
                      <button
                        onClick={() => handleSaveApiKey(provider)}
                        disabled={saving || !apiKeyInput.trim()}
                        className="w-full py-3.5 text-white text-xs font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 mt-3"
                        style={{ backgroundColor: provider.color, boxShadow: `0 0 20px ${provider.color}40` }}
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
        <div className="p-6 border-t border-white/5 bg-white/[0.02] flex-shrink-0 flex items-center justify-between rounded-b-3xl">
          <p className="text-xs font-semibold text-zinc-500">
            Credentials are stored locally and encrypted.
          </p>
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl bg-white text-black text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-zinc-200 transition-all hover:-translate-y-0.5"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

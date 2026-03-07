"use client";

import React, { useState } from "react";

export interface BusinessProfile {
  businessName: string;
  industry: string;
  targetAudience: string;
  platforms: string[];
  brandVoice: string;
  monthlyTheme: string;
}

interface BusinessProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: BusinessProfile) => void;
  existingProfile?: BusinessProfile | null;
}

const INDUSTRIES = [
  { name: "AI & Technology", audience: "Tech founders, developers, early adopters" },
  { name: "Real Estate", audience: "Home buyers, property investors, renters" },
  { name: "Finance & Trading", audience: "Retail investors, day traders, financially savvy individuals" },
  { name: "Marketing & Advertising", audience: "Small business owners, CMOs, digital entrepreneurs" },
  { name: "E-Commerce", audience: "Online shoppers, direct-to-consumer buyers" },
  { name: "Health & Fitness", audience: "Fitness enthusiasts, gym goers, health-conscious individuals" },
  { name: "Education & Coaching", audience: "Students, professionals seeking growth, lifelong learners" },
  { name: "Legal & Consulting", audience: "Corporate executives, enterprise businesses, startups" },
  { name: "SaaS / Software", audience: "B2B businesses, agency owners, software operators" },
  { name: "Other", audience: "General public, broad audience" },
];

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", icon: "in" },
  { id: "twitter", label: "Twitter / X", icon: "X" },
  { id: "instagram", label: "Instagram", icon: "ig" },
  { id: "facebook", label: "Facebook", icon: "fb" },
  { id: "tiktok", label: "TikTok", icon: "tt" },
  { id: "youtube", label: "YouTube", icon: "yt" },
];

const VOICES = [
  { id: "professional", label: "Professional", desc: "Formal, authoritative, data-driven" },
  { id: "casual", label: "Casual & Friendly", desc: "Approachable, warm, conversational" },
  { id: "bold", label: "Bold & Provocative", desc: "Opinionated, daring, attention-grabbing" },
  { id: "inspirational", label: "Inspirational", desc: "Motivating, uplifting, story-driven" },
];

export default function BusinessProfileModal({
  isOpen,
  onClose,
  onSave,
  existingProfile,
}: BusinessProfileModalProps) {
  const [step, setStep] = useState(1);
  const [suggestingName, setSuggestingName] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile>(
    existingProfile || {
      businessName: "",
      industry: "",
      targetAudience: "",
      platforms: [],
      brandVoice: "professional",
      monthlyTheme: "",
    }
  );

  if (!isOpen) return null;

  const fetchSuggestedName = async (industry: string) => {
    // Only auto-suggest if the name field is empty
    if (profile.businessName.trim()) return;
    setSuggestingName(true);
    try {
      const res = await fetch("/api/suggest-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry }),
      });
      const data = await res.json();
      if (data.name) {
        setProfile(prev => ({ ...prev, businessName: data.name }));
      }
    } catch (e) {
      // Silently ignore
    }
    setSuggestingName(false);
  };

  const togglePlatform = (platformId: string) => {
    setProfile((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter((p) => p !== platformId)
        : [...prev.platforms, platformId],
    }));
  };

  const handleSave = () => {
    onSave(profile);
    onClose();
  };

  const canProceed = () => {
    if (step === 1) return profile.businessName && profile.industry;
    if (step === 2) return profile.targetAudience && profile.platforms.length > 0;
    if (step === 3) return profile.brandVoice;
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Business Profile</h2>
          <p className="text-sm text-slate-500 mt-1">Help the AI understand your brand</p>
          
          {/* Step indicator */}
          <div className="flex gap-2 mt-5">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-blue-600" : "bg-slate-100"}`} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 flex-grow overflow-y-auto max-h-[60vh] min-h-[300px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Business Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.businessName}
                    onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    placeholder={suggestingName ? "AI is suggesting a name..." : "e.g., Volts Design Agency"}
                  />
                  {suggestingName && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Industry</label>
                <div className="grid grid-cols-2 gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind.name}
                      onClick={() => {
                        setProfile({ ...profile, industry: ind.name, targetAudience: ind.audience });
                        fetchSuggestedName(ind.name);
                      }}
                      className={`text-left px-3 py-2.5 rounded-lg text-sm transition-all font-medium ${
                        profile.industry === ind.name
                          ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                          : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {ind.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Target Audience</label>
                <input
                  type="text"
                  value={profile.targetAudience}
                  onChange={(e) => setProfile({ ...profile, targetAudience: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  placeholder="e.g., Small business owners, Tech founders"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Platforms</label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all font-medium ${
                        profile.platforms.includes(p.id)
                          ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                          : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div className="w-6 h-6 rounded flex items-center justify-center bg-slate-200/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        {p.icon}
                      </div>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Brand Voice</label>
                <div className="flex flex-col gap-2">
                  {VOICES.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setProfile({ ...profile, brandVoice: v.id })}
                      className={`flex flex-col text-left px-4 py-3 rounded-lg transition-all ${
                        profile.brandVoice === v.id
                          ? "bg-blue-50 border border-blue-200 shadow-sm"
                          : "bg-slate-50 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className={`text-sm font-bold ${profile.brandVoice === v.id ? "text-blue-700" : "text-slate-700"}`}>{v.label}</span>
                      <span className="text-xs text-slate-500 mt-0.5 font-medium">{v.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Monthly Theme (optional)</label>
                <input
                  type="text"
                  value={profile.monthlyTheme}
                  onChange={(e) => setProfile({ ...profile, monthlyTheme: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  placeholder="e.g., AI tools for productivity"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="py-2.5 px-5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Back
            </button>
          )}
          <div className="flex-grow" />
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="py-2.5 px-6 bg-slate-900 text-white shadow-md rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!canProceed()}
              className="py-2.5 px-6 bg-blue-600 text-white shadow-md rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

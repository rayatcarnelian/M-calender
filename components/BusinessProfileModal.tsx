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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-950/90 border border-white/10 w-full max-w-xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col font-sans backdrop-blur-2xl">
        {/* Header */}
        <div className="px-5 sm:px-8 py-4 sm:py-6 border-b border-white/5 flex items-center bg-white/[0.02]">
          <h2 className="text-xl font-bold text-white tracking-wide">
            {existingProfile ? "Edit Profile" : "Set Up Business Profile"}
          </h2>
          <div className="flex-grow" />
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        {/* Step indicator */}
        <div className="flex gap-2 mt-4 sm:mt-5 px-5 sm:px-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-indigo-500" : "bg-zinc-700"}`} />
          ))}
        </div>

        {/* Body */}
        <div className="px-5 sm:px-8 py-4 sm:py-6 flex-grow overflow-y-auto max-h-[75vh] min-h-[300px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
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
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Industry</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind.name}
                      onClick={() => {
                        setProfile({ ...profile, industry: ind.name, targetAudience: ind.audience });
                        fetchSuggestedName(ind.name);
                      }}
                      className={`text-left px-4 py-3 rounded-xl text-sm transition-all font-medium border ${
                        profile.industry === ind.name
                          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                          : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white"
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
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Target Audience</label>
                <input
                  type="text"
                  value={profile.targetAudience}
                  onChange={(e) => setProfile({ ...profile, targetAudience: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
                  placeholder="e.g., Small business owners, Tech founders"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-3">Platforms</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all font-medium border ${
                        profile.platforms.includes(p.id)
                          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                          : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-zinc-500 text-[10px] font-bold uppercase tracking-wider border border-white/5">
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
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-3">Brand Voice</label>
                <div className="flex flex-col gap-3">
                  {VOICES.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setProfile({ ...profile, brandVoice: v.id })}
                      className={`flex flex-col text-left px-5 py-4 rounded-xl transition-all border ${
                        profile.brandVoice === v.id
                          ? "bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <span className={`text-sm font-bold tracking-wide ${profile.brandVoice === v.id ? "text-indigo-300" : "text-white"}`}>{v.label}</span>
                      <span className="text-xs text-zinc-500 mt-1 font-medium">{v.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Monthly Theme (optional)</label>
                <input
                  type="text"
                  value={profile.monthlyTheme}
                  onChange={(e) => setProfile({ ...profile, monthlyTheme: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
                  placeholder="e.g., AI tools for productivity"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-8 pb-5 sm:pb-8 pt-4 flex items-center gap-3 bg-white/[0.02] border-t border-white/5">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="py-3 px-6 text-sm font-semibold text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-white/10 rounded-xl hover:bg-white/5"
            >
              Back
            </button>
          )}
          <div className="flex-grow" />
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="py-3 px-8 bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] rounded-xl text-sm font-bold hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!canProceed()}
              className="py-3 px-8 bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(79,70,229,0.6)]"
            >
              Save Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

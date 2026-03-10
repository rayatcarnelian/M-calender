"use client";

import React, { useState } from "react";
import { BusinessProfile } from "./BusinessProfileModal";
import { GeneratedPost } from "./ContentGeneratorModal";

interface CompetitorSpyModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BusinessProfile | null;
  onAddPosts: (posts: GeneratedPost[]) => void;
}

export default function CompetitorSpyModal({
  isOpen,
  onClose,
  profile,
  onAddPosts,
}: CompetitorSpyModalProps) {
  const [url, setUrl] = useState("");
  const [numPosts, setNumPosts] = useState(3);
  const [phase, setPhase] = useState<"input" | "scraping" | "analyzing" | "results">("input");
  const [error, setError] = useState<string | null>(null);
  
  const [analysis, setAnalysis] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [counterPosts, setCounterPosts] = useState<(GeneratedPost & { strategy: string })[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const handleSpy = async () => {
    if (!url.trim()) return;
    setError(null);
    setPhase("scraping");

    try {
      // Step 1: Scrape the competitor's website
      const scrapeRes = await fetch("/api/spy/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, numPosts }),
      });

      if (!scrapeRes.ok) {
        const errorData = await scrapeRes.json();
        throw new Error(errorData.error || "Failed to scrape URL");
      }

      const scrapedData = await scrapeRes.json();
      
      // Step 2: Send scraped text + user profile to Gemini
      setPhase("analyzing");
      
      const activeProfile = profile || {
        businessName: "My Brand",
        industry: "General Industry",
        targetAudience: "Broad Audience",
        brandVoice: "Professional, engaging, and authoritative",
        platforms: ["linkedin", "twitter", "instagram"]
      };
      
      const analyzeRes = await fetch("/api/spy/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scrapedData, profile: activeProfile }),
      });

      if (!analyzeRes.ok) {
        const errorData = await analyzeRes.json();
        throw new Error(errorData.error || "AI Analysis failed");
      }

      const result = await analyzeRes.json();
      
      if (!result.posts || !Array.isArray(result.posts)) {
        throw new Error("AI returned an invalid post format.");
      }

      setAnalysis(result.analysis);
      setTechStack(result.techStack || []);
      setCounterPosts(result.posts.map((p: any, i: number) => ({
        ...p,
        day: i + 1, // temporary day assignment
        type: "social"
      })));
      
      // Auto-select all by default
      setSelectedPosts(new Set(result.posts.map((_: any, i: number) => i)));
      setPhase("results");

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unknown error occurred");
      setPhase("input");
    }
  };

  const toggleSelect = (index: number) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPosts(newSelected);
  };

  const handleApprove = () => {
    const postsToAdd = counterPosts.filter((_, i) => selectedPosts.has(i));
    onAddPosts(postsToAdd.map(({ strategy, ...post }) => post));
    handleClose();
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setPhase("input");
      setUrl("");
      setError(null);
      setCounterPosts([]);
      setTechStack([]);
      setAnalysis("");
      setSelectedPosts(new Set());
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={handleClose}>
      <div 
        className="bg-zinc-950/90 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-3xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] backdrop-blur-2xl" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-8 py-5 sm:py-8 border-b border-white/5 flex items-center gap-5 bg-white/[0.02]">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-wide">AI Competitor Spy</h2>
            <p className="text-sm text-zinc-400 mt-1 font-medium">Scrape, reverse-engineer prompts, and generate superior counter-content.</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-8 py-5 sm:py-8 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-zinc-700">
          
          {phase === "input" && (
            <div className="space-y-8">
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-6 shadow-inner">
                <h3 className="text-sm font-bold text-indigo-300 mb-3 tracking-wide">How it works:</h3>
                <ul className="text-sm font-medium text-indigo-200/80 space-y-2.5 list-disc pl-5">
                  <li>Paste a link to a competitor's YouTube Video or Instagram Post.</li>
                  <li>Our scraping engine extracts the raw transcript or captions.</li>
                  <li>The AI reverse-engineers their master prompts, visual style, and tech stack.</li>
                  <li>It instantly writes <strong className="text-indigo-400 font-bold">superior counter-content</strong> tailored to your brand voice.</li>
                </ul>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-5 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
                      Competitor Target URL
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSpy()}
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full bg-black/20 border border-white/10 focus:border-indigo-500 rounded-xl px-5 py-3.5 pl-12 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium shadow-inner"
                      />
                      <span className="absolute left-4 top-4 text-zinc-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
                      Outputs
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={numPosts}
                      onChange={(e) => setNumPosts(parseInt(e.target.value) || 1)}
                      className="w-full bg-black/20 border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-bold shadow-inner"
                    />
                  </div>
                </div>
                {error && <p className="text-red-400 text-xs font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}
              </div>
            </div>
          )}

          {phase === "scraping" && (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              <div className="text-center">
                <h3 className="text-white font-bold text-xl tracking-wide">Infiltrating Target...</h3>
                <p className="text-zinc-400 font-medium text-sm mt-2">{url || "Extracting source data"}</p>
              </div>
            </div>
          )}

          {phase === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              <div className="text-center">
                <h3 className="text-white font-bold text-xl tracking-wide">Reverse-Engineering Prompts</h3>
                <p className="text-zinc-400 font-medium text-sm mt-2">Extracting strategy and generating counter-content...</p>
              </div>
            </div>
          )}

          {phase === "results" && (
            <div className="space-y-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
                <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Reverse-Engineered Logic & Strategy</h3>
                <p className="text-sm font-medium text-zinc-300 leading-relaxed italic border-l-2 border-indigo-500 pl-5 py-2">
                  "{analysis}"
                </p>
                {techStack.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Detected AI Tech Stack</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {techStack.map(tech => (
                        <span key={tech} className="px-3 py-1.5 text-xs font-bold text-indigo-300 bg-indigo-500/10 rounded-lg shadow-sm border border-indigo-500/20">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Generated Clones</h3>
                  <span className="text-[10px] font-bold text-white bg-indigo-600 px-2.5 py-1 rounded-md shadow-[0_0_10px_rgba(79,70,229,0.4)]">{selectedPosts.size} selected</span>
                </div>
                
                {counterPosts.map((post, i) => (
                  <div 
                    key={i} 
                    onClick={() => toggleSelect(i)}
                    className={`relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer shadow-lg hover:-translate-y-1 ${
                      selectedPosts.has(i) 
                        ? "bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]" 
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    {/* Checkbox */}
                    <div className={`absolute top-6 right-6 w-5 h-5 rounded-md overflow-hidden flex items-center justify-center border transition-all duration-300 ${
                      selectedPosts.has(i) ? "bg-indigo-500 border-indigo-500" : "border-zinc-600 bg-black/20"
                    }`}>
                      {selectedPosts.has(i) && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      )}
                    </div>

                    <div className="pr-12">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/10 text-zinc-300 border border-white/5 uppercase tracking-wide">
                          {post.platform}
                        </span>
                        <h4 className="text-base font-bold text-white tracking-wide">{post.title}</h4>
                      </div>
                      
                      <div className="bg-black/20 border border-white/5 rounded-xl p-5 mb-4 shadow-inner">
                        <p className="text-sm font-medium text-zinc-300 whitespace-pre-wrap">{post.content}</p>
                      </div>

                      <div className="flex flex-col gap-1.5 bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.15em]">Extracted Prompt Overlay</span>
                        </div>
                        <p className="text-xs font-medium text-indigo-300/80 leading-relaxed">{post.strategy}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 border-t border-white/5 bg-white/[0.02] flex justify-between items-center rounded-b-3xl">
          <button 
            onClick={handleClose} 
            className="px-6 py-3 text-sm font-semibold text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-white/10 rounded-xl hover:bg-white/5"
          >
            {phase === "results" ? "Cancel" : "Close"}
          </button>
          
          {phase === "input" && (
            <button
              onClick={handleSpy}
              disabled={!url.trim()}
              className="px-8 py-3 bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.4)] text-white text-sm font-bold rounded-xl hover:bg-indigo-500 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] flex items-center gap-2"
            >
              Analyze Target
            </button>
          )}

          {phase === "results" && (
            <button
              onClick={handleApprove}
              disabled={selectedPosts.size === 0}
              className="px-8 py-3 bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] text-sm font-bold rounded-xl hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              Add {selectedPosts.size} Posts to Calendar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

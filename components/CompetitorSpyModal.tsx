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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={handleClose}>
      <div 
        className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">AI Content Reverse-Engineer</h2>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">Scrape, reverse-engineer prompts, and generate superior counter-content.</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-slate-200">
          
          {phase === "input" && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-indigo-900 mb-2">How it works:</h3>
                <ul className="text-sm font-medium text-indigo-700/80 space-y-2 list-disc pl-4">
                  <li>Paste a link to a competitor's social media page (e.g. Instagram).</li>
                  <li>Our Apify integration scrapes their recent posts.</li>
                  <li>The AI reverse-engineers their master prompts and messaging angle.</li>
                  <li>It instantly writes <strong className="text-indigo-600 font-bold">superior counter-posts</strong> using the extracted prompts in your brand's voice.</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Competitor Target URL
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSpy()}
                        placeholder="https://instagram.com/competitor"
                        className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 pl-11 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium shadow-sm"
                      />
                      <span className="absolute left-4 top-3.5 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Posts to Scrape
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={numPosts}
                      onChange={(e) => setNumPosts(parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold shadow-sm"
                    />
                  </div>
                </div>
                {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>}
              </div>
            </div>
          )}

          {phase === "scraping" && (
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-sm" />
              <div className="text-center">
                <h3 className="text-slate-800 font-bold text-lg">Infiltrating Target...</h3>
                <p className="text-slate-500 font-medium text-sm mt-1">{url || "Extracting website data via Apify"}</p>
              </div>
            </div>
          )}

          {phase === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-sm" />
              <div className="text-center">
                <h3 className="text-slate-800 font-bold text-lg">Reverse-Engineering Prompts</h3>
                <p className="text-slate-500 font-medium text-sm mt-1">Extracting strategies and generating counter-content...</p>
              </div>
            </div>
          )}

          {phase === "results" && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Reverse-Engineered Logic & Strategy</h3>
                <p className="text-sm font-medium text-slate-700 leading-relaxed italic border-l-2 border-indigo-500 pl-4 py-1">
                  "{analysis}"
                </p>
                {techStack.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Detected AI Tech Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {techStack.map(tech => (
                        <span key={tech} className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-100 rounded-md shadow-sm border border-indigo-200">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Generated Clones</h3>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{selectedPosts.size} selected</span>
                </div>
                
                {counterPosts.map((post, i) => (
                  <div 
                    key={i} 
                    onClick={() => toggleSelect(i)}
                    className={`relative p-5 rounded-xl border transition-all cursor-pointer shadow-sm ${
                      selectedPosts.has(i) 
                        ? "bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-500" 
                        : "bg-white border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    {/* Checkbox */}
                    <div className={`absolute top-5 right-5 w-5 h-5 rounded overflow-hidden flex items-center justify-center border transition-all ${
                      selectedPosts.has(i) ? "bg-indigo-600 border-indigo-600" : "border-slate-300 bg-slate-50"
                    }`}>
                      {selectedPosts.has(i) && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      )}
                    </div>

                    <div className="pr-10">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                          {post.platform}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{post.title}</h4>
                      </div>
                      
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mb-3">
                        <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{post.content}</p>
                      </div>

                      <div className="flex flex-col gap-1 bg-indigo-50/50 border border-indigo-100/50 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
                          <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wide">Extracted Prompt Overlay</span>
                        </div>
                        <p className="text-xs font-medium text-indigo-700/80 leading-relaxed">{post.strategy}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center rounded-b-2xl">
          <button 
            onClick={handleClose} 
            className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            {phase === "results" ? "Cancel" : "Close"}
          </button>
          
          {phase === "input" && (
            <button
              onClick={handleSpy}
              disabled={!url.trim()}
              className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg text-white text-sm font-bold rounded-lg transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Analyze Content
            </button>
          )}

          {phase === "results" && (
            <button
              onClick={handleApprove}
              disabled={selectedPosts.size === 0}
              className="px-8 py-2.5 bg-slate-900 hover:bg-slate-800 text-white shadow-md text-sm font-bold rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              Add {selectedPosts.size} Posts to Calendar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

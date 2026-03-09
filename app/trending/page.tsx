"use client";

import { useState, useEffect } from "react";

interface TrendingVideo {
  id: string;
  platform: string;
  url: string;
  author: string;
  title: string;
  thumbnailUrl: string;
  views: number;
  likes: number;
  comments: number;
  isAnalyzed: boolean;
  hookExposed?: string;
  visualStyle?: string;
  masterPrompt?: string;
  toolsIdentified?: string;
  stepByStepGuide?: string;
  costBreakdown?: string;
}

export default function TrendingDashboard() {
  const [videos, setVideos] = useState<TrendingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Search parameters
  const [keyword, setKeyword] = useState("#AItools");
  const [platform] = useState("youtube");
  const [dataDepth, setDataDepth] = useState(10);
  const [sortBy, setSortBy] = useState("views");

  // Fetch cached videos on load
  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/trending/fetch");
      const data = await res.json();
      if (data.videos) {
        setVideos(data.videos);
      }
    } catch (err) {
      console.error("Failed to load videos", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setScraping(true);
    setVideos([]); // Clear previous results
    try {
      const res = await fetch("/api/trending/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, platform, count: dataDepth })
      });
      const data = await res.json();
      if (data.success && data.videos) {
        setVideos(data.videos);
      } else {
        alert(data.error || "Failed to scrape videos");
      }
    } catch (err) {
      console.error("Scrape failed", err);
      alert("Failed to initiate search.");
    } finally {
      setScraping(false);
    }
  };

  const handleAnalyze = async (videoId: string) => {
    setAnalyzingId(videoId);
    try {
      const res = await fetch("/api/trending/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId })
      });
      const data = await res.json();
      if (data.success) {
        // Update the video in state
        setVideos(videos.map(v => v.id === videoId ? data.data : v));
      } else {
        alert(data.error || "Failed to analyze video");
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setAnalyzingId(null);
    }
  };

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    alert("Master Prompt copied! Paste this into your Video Generator Agent.");
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <main className="min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-[#050505] to-[#050505] text-white p-10 font-sans selection:bg-indigo-500/30 overflow-y-auto">
      
      {/* Header & Search */}
      <div className="max-w-6xl mx-auto mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
          Global Trends Analyzer
        </h1>
        <p className="text-zinc-400 text-lg mb-8 max-w-2xl">
          Search the highest velocity videos globally. Reverse-engineer them to generate a 
          Master Prompts for your AI Video Generator.
        </p>

        {/* Search Bar */}
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="flex-1">
            <input 
              type="text" 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter a keyword or hashtag (e.g. #Motivation)"
              className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div className="w-40">
            <select
               value={dataDepth}
               onChange={(e) => setDataDepth(Number(e.target.value))}
               className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer font-bold"
            >
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
            </select>
          </div>
          <button
            onClick={handleSearch}
            disabled={scraping}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:-translate-y-1"
          >
            {scraping ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Scraping...
              </>
            ) : (
              "Deep Search"
            )}
          </button>
        </div>
        
        {/* Dynamic Sorting Row */}
        <div className="mt-8 flex items-center justify-between">
            <div className="text-zinc-400 font-medium">
               Displaying <span className="text-white font-bold">{videos.length}</span> cached viral concepts
            </div>
            <div className="flex items-center gap-3">
               <span className="text-zinc-500 font-medium text-sm">Sort By:</span>
               <select
                 value={sortBy}
                 onChange={(e) => setSortBy(e.target.value)}
                 className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
               >
                 <option value="views">Absolute Virality (Most Views)</option>
                 <option value="engagement">Highest Engagement (Likes + Comments)</option>
                 <option value="velocity">Algorithm Velocity (Likes/Views Ratio)</option>
               </select>
            </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
            <p className="text-zinc-500 text-lg">No trending videos cached yet. Run a deep search to start.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[...videos]
              .sort((a, b) => {
                 if (sortBy === "views") return b.views - a.views;
                 if (sortBy === "engagement") return (b.likes + b.comments) - (a.likes + a.comments);
                 if (sortBy === "velocity") {
                    const aVel = a.views > 0 ? (a.likes + a.comments) / a.views : 0;
                    const bVel = b.views > 0 ? (b.likes + b.comments) / b.views : 0;
                    return bVel - aVel;
                 }
                 return 0;
              })
              .map(video => (
              <div 
                key={video.id} 
                onClick={() => window.open(video.url, '_blank')}
                className="bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden hover:bg-white/[0.05] transition-all hover:border-white/20 flex flex-col group hover:-translate-y-1 hover:shadow-2xl cursor-pointer"
              >
                
                {/* Media/Thumbnail area */}
                <div className="relative aspect-[9/16] bg-black/50 overflow-hidden">
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt="thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-600">No Img</div>
                  )}
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  
                  {/* Metrics Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-sm font-bold bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                        <span className="text-indigo-400">▶</span> {formatNumber(video.views)}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-bold bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                        <span className="text-pink-400">♥</span> {formatNumber(video.likes)}
                      </div>
                    </div>
                  </div>
                  {/* Platform Badge */}
                  <div className="absolute top-4 right-4">
                     <span className="text-xs font-black uppercase tracking-widest bg-white text-black px-3 py-1.5 rounded-lg shadow-lg">
                       {video.platform}
                     </span>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-6 flex flex-col flex-grow">
                  <p className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-widest">@{video.author}</p>
                  <p className="text-sm text-zinc-300 line-clamp-2 mb-6 leading-relaxed flex-grow">
                    {video.title || "No caption provided."}
                  </p>

                  {/* AI Analysis Section */}
                  <div className="mt-auto">
                    {video.isAnalyzed ? (
                      <div className="space-y-3">
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Hook Strategy</p>
                          <p className="text-xs text-zinc-400 leading-relaxed font-medium">{video.hookExposed}</p>
                        </div>

                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === video.id ? null : video.id); }}
                          className="w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/20 transition-all"
                        >
                          {expandedId === video.id ? "▼ Hide Full Analysis" : "▶ Tools · Steps · Costs"}
                        </button>

                        {expandedId === video.id && (
                          <div className="space-y-3 animate-in fade-in">
                            {/* Tools Identified */}
                            {video.toolsIdentified && (() => {
                              try {
                                const tools = JSON.parse(video.toolsIdentified);
                                return (
                                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">🧰 Tools Identified</p>
                                    <div className="space-y-1.5">
                                      {Object.entries(tools).map(([key, val]) => (
                                        <div key={key} className="flex gap-2">
                                          <span className="text-[10px] font-bold text-zinc-500 uppercase w-14 shrink-0">{key}</span>
                                          <span className="text-xs text-zinc-300 leading-relaxed">{val as string}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              } catch { return null; }
                            })()}

                            {/* Step-by-Step Guide */}
                            {video.stepByStepGuide && (() => {
                              try {
                                const steps = JSON.parse(video.stepByStepGuide);
                                return (
                                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                                    <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2">📋 Recreation Guide</p>
                                    <div className="space-y-2">
                                      {(steps as string[]).map((step: string, i: number) => (
                                        <p key={i} className="text-xs text-zinc-300 leading-relaxed">{step}</p>
                                      ))}
                                    </div>
                                  </div>
                                );
                              } catch { return null; }
                            })()}

                            {/* Cost Breakdown */}
                            {video.costBreakdown && (() => {
                              try {
                                const costs = JSON.parse(video.costBreakdown);
                                return (
                                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                                    <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-2">💰 Cost Breakdown</p>
                                    <div className="space-y-2">
                                      <div className="flex items-start gap-2">
                                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md shrink-0">FREE</span>
                                        <span className="text-xs text-zinc-300">{costs.free}</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md shrink-0">BUDGET</span>
                                        <span className="text-xs text-zinc-300">{costs.budget}</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-[10px] font-black text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md shrink-0">PREMIUM</span>
                                        <span className="text-xs text-zinc-300">{costs.premium}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              } catch { return null; }
                            })()}
                          </div>
                        )}

                        <button
                          onClick={(e) => { e.stopPropagation(); copyPrompt(video.masterPrompt || ""); }}
                          className="w-full py-3.5 bg-zinc-100 hover:bg-white text-black text-sm font-bold rounded-xl transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                          Copy Video AI Prompt
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAnalyze(video.id); }}
                        disabled={analyzingId === video.id}
                        className="w-full py-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-sm font-bold rounded-2xl border border-indigo-500/20 transition-all shadow-inner disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      >
                        {analyzingId === video.id ? (
                          <span className="flex items-center justify-center gap-2">
                             <div className="w-4 h-4 border-2 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin" />
                             Analyzing Blueprint...
                          </span>
                        ) : (
                          "Reverse-Engineer with AI"
                        )}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </main>
  );
}

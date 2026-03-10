"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface ContentPackage {
  title: string;
  script: string;
  captions: string[];
  hashtags: string[];
  imagePrompt: string;
}

interface GeneratedImage {
  url: string;
  index: number;
}

const STYLE_PRESETS = [
  { id: "cinematic", label: "Cinematic", emoji: "🎬" },
  { id: "3d-render", label: "3D Render", emoji: "🧊" },
  { id: "anime", label: "Anime", emoji: "🌸" },
  { id: "watercolor", label: "Watercolor", emoji: "🎨" },
  { id: "cyberpunk", label: "Neon Cyberpunk", emoji: "💜" },
  { id: "minimalist", label: "Minimalist", emoji: "◻️" },
  { id: "photorealistic", label: "Photorealistic", emoji: "📷" },
  { id: "dark-luxury", label: "Dark Luxury", emoji: "🖤" },
  { id: "vintage-film", label: "Vintage Film", emoji: "📽️" },
];

const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1 Square", desc: "Instagram Feed", icon: "⬜" },
  { id: "9:16", label: "9:16 Vertical", desc: "Reels / Stories", icon: "📱" },
  { id: "16:9", label: "16:9 Landscape", desc: "YouTube / LinkedIn", icon: "🖥️" },
  { id: "4:5", label: "4:5 Portrait", desc: "Instagram Portrait", icon: "📐" },
];

export default function ContentStudio() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] text-white flex items-center justify-center"><div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>}>
      <ContentStudioInner />
    </Suspense>
  );
}

function ContentStudioInner() {
  const searchParams = useSearchParams();
  const importedVideoId = searchParams.get("videoId");

  // Content generation state
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("Instagram Reels");
  const [format, setFormat] = useState("Talking Head Script");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ContentPackage | null>(null);
  const [copiedField, setCopiedField] = useState("");
  const [scheduling, setScheduling] = useState(false);

  // Image generation state
  const [selectedStyle, setSelectedStyle] = useState("cinematic");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [imageCount, setImageCount] = useState(4);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  useEffect(() => {
    if (importedVideoId) {
      setTopic(`Trending Video Analysis (ID: ${importedVideoId})`);
    }
  }, [importedVideoId]);

  // ─── Content Generation ───
  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setResult(null);
    setGeneratedImages([]);
    setSelectedImageUrl("");
    try {
      const res = await fetch("/api/create/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, platform, format, trendingVideoId: importedVideoId || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        // Pre-fill the custom prompt with AI's suggestion
        if (data.data.imagePrompt) {
          setCustomPrompt(data.data.imagePrompt);
        }
      } else {
        alert(data.error || "Failed to generate content.");
      }
    } catch (err) {
      alert("Content generation failed. Please check your Groq API key.");
    } finally {
      setGenerating(false);
    }
  };

  // ─── Image Generation ───
  const handleGenerateImages = async () => {
    const prompt = showCustomPrompt && customPrompt.trim() 
      ? customPrompt 
      : result?.imagePrompt || topic;
    
    if (!prompt) return;
    setGeneratingImages(true);
    setGeneratedImages([]);
    setSelectedImageUrl("");

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          style: selectedStyle,
          aspectRatio: selectedRatio,
          count: imageCount,
        }),
      });
      const data = await res.json();
      if (data.success && data.images) {
        setGeneratedImages(data.images);
      } else {
        alert(data.error || "Image generation failed.");
      }
    } catch (err) {
      alert("Image generation failed. Check your API key in Integrations.");
    } finally {
      setGeneratingImages(false);
    }
  };

  // ─── Schedule ───
  const handleSchedule = async (imageUrl?: string) => {
    if (!result) return;
    setScheduling(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.title || topic,
          start: tomorrow.toISOString(),
          type: "social",
          platform: platform.toLowerCase().split(" ")[0],
          content: result.script,
          imageUrl: imageUrl || selectedImageUrl || null,
        }),
      });
      const data = await res.json();
      if (data.id) {
        alert("✅ Content scheduled to your calendar! Check tomorrow at 10 AM.");
      }
    } catch (err) {
      alert("Failed to schedule. Please try again.");
    } finally {
      setScheduling(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const downloadImage = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.download = `volts-image-${Date.now()}.png`;
    a.click();
  };

  const formats = ["Talking Head Script", "Faceless Narration", "Carousel Post", "Story / Reel Caption", "Twitter Thread"];
  const platforms = ["Instagram Reels", "YouTube Shorts", "LinkedIn", "Twitter / X", "Facebook"];

  return (
    <main className="min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-[#050505] to-[#050505] text-white p-6 md:p-10 font-sans selection:bg-violet-500/30 overflow-y-auto">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <a href="/" className="text-zinc-500 hover:text-white text-sm font-medium transition-colors">&larr; Back to Calendar</a>
          <h1 className="text-4xl font-extrabold tracking-tight mt-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-violet-400">
            AI Content Studio
          </h1>
          <p className="text-zinc-400 text-lg mt-2 max-w-2xl">
            Transform any idea into a complete content package — script, captions, hashtags, and stunning AI-generated cover images. Powered by AI, costs nothing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ═══ LEFT COLUMN: Brief Builder ═══ */}
          <div className="space-y-6">
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 text-sm font-black">1</span>
                Content Brief
              </h2>

              <label className="block text-sm font-semibold text-zinc-400 mb-2">Topic or Idea</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. 5 AI tools that will replace your entire marketing team in 2026"
                rows={3}
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none mb-5"
              />

              <label className="block text-sm font-semibold text-zinc-400 mb-2">Target Platform</label>
              <div className="flex flex-wrap gap-2 mb-5">
                {platforms.map(p => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                      platform === p
                        ? "bg-violet-500/20 border-violet-500/40 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                        : "bg-white/[0.03] border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <label className="block text-sm font-semibold text-zinc-400 mb-2">Content Format</label>
              <div className="flex flex-wrap gap-2 mb-6">
                {formats.map(f => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                      format === f
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        : "bg-white/[0.03] border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !topic.trim()}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl transition-all disabled:opacity-40 shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 text-lg"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Content Package...
                  </span>
                ) : (
                  "Generate Content Package"
                )}
              </button>
            </div>

            {/* ═══ AI IMAGE STUDIO ═══ */}
            {result && (
              <div className="bg-white/[0.03] border border-pink-500/20 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
                
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                  <span className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 text-sm font-black">✦</span>
                  AI Image Studio
                </h2>

                {/* Style Presets */}
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Visual Style</label>
                <div className="flex flex-wrap gap-2 mb-6">
                  {STYLE_PRESETS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStyle(s.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                        selectedStyle === s.id
                          ? "bg-pink-500/20 border-pink-500/40 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.2)]"
                          : "bg-white/[0.03] border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <span>{s.emoji}</span> {s.label}
                    </button>
                  ))}
                </div>

                {/* Aspect Ratio */}
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Aspect Ratio</label>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {ASPECT_RATIOS.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRatio(r.id)}
                      className={`px-4 py-3 rounded-xl text-left transition-all border ${
                        selectedRatio === r.id
                          ? "bg-indigo-500/20 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                          : "bg-white/[0.03] border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{r.icon}</span>
                        <span className={`text-xs font-bold ${selectedRatio === r.id ? "text-indigo-300" : "text-zinc-300"}`}>{r.label}</span>
                      </div>
                      <p className={`text-[10px] mt-0.5 ml-7 ${selectedRatio === r.id ? "text-indigo-400" : "text-zinc-500"}`}>{r.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Image Count */}
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Number of Images</label>
                <div className="flex gap-2 mb-6">
                  {[1, 2, 3, 4].map(n => (
                    <button
                      key={n}
                      onClick={() => setImageCount(n)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                        imageCount === n
                          ? "bg-pink-500/20 border-pink-500/40 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.2)]"
                          : "bg-white/[0.03] border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                {/* Custom Prompt Toggle */}
                <button
                  onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                  className="text-xs font-bold text-zinc-500 hover:text-zinc-300 mb-3 transition-colors flex items-center gap-1.5"
                >
                  {showCustomPrompt ? "▼" : "▶"} Advanced: Edit Prompt
                </button>
                {showCustomPrompt && (
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Describe your ideal image..."
                    rows={3}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none mb-4"
                  />
                )}

                {/* Generate Button */}
                <button
                  onClick={handleGenerateImages}
                  disabled={generatingImages}
                  className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-2xl transition-all disabled:opacity-40 shadow-[0_0_25px_rgba(236,72,153,0.3)] hover:shadow-[0_0_35px_rgba(236,72,153,0.5)] hover:-translate-y-0.5 text-base"
                >
                  {generatingImages ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating {imageCount === 1 ? "Image" : `${imageCount} Images`}...
                    </span>
                  ) : (
                    `✨ Generate ${imageCount === 1 ? "Cover Image" : `${imageCount} Cover Images`}`
                  )}
                </button>

                {/* Generated Images Grid */}
                {generatedImages.length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Pick Your Favorite</p>
                    <div className={`grid ${generatedImages.length === 1 ? 'grid-cols-1 max-w-sm' : 'grid-cols-2'} gap-3`}>
                      {generatedImages.map((img) => (
                        <div
                          key={img.index}
                          className={`relative group rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                            selectedImageUrl === img.url
                              ? "border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.3)] scale-[1.02]"
                              : "border-white/10 hover:border-white/30"
                          }`}
                          onClick={() => setSelectedImageUrl(img.url)}
                        >
                          <div className={`aspect-square ${selectedRatio === "9:16" ? "aspect-[9/16]" : selectedRatio === "16:9" ? "aspect-video" : selectedRatio === "4:5" ? "aspect-[4/5]" : "aspect-square"} bg-black`}>
                            <img src={img.url} alt={`Generated ${img.index + 1}`} className="w-full h-full object-cover" />
                          </div>
                          
                          {/* Overlay actions */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); downloadImage(img.url); }}
                                className="flex-1 py-2 bg-white/10 backdrop-blur-md text-white text-xs font-bold rounded-lg hover:bg-white/20 transition-colors border border-white/10"
                              >
                                Download
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setExpandedImage(img.url); }}
                                className="py-2 px-3 bg-white/10 backdrop-blur-md text-white text-xs font-bold rounded-lg hover:bg-white/20 transition-colors border border-white/10"
                              >
                                🔍
                              </button>
                            </div>
                          </div>

                          {/* Selected badge */}
                          {selectedImageUrl === img.url && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg">
                              ✓
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Schedule with selected image */}
                    {selectedImageUrl && (
                      <button
                        onClick={() => handleSchedule(selectedImageUrl)}
                        disabled={scheduling}
                        className="w-full mt-4 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 text-sm"
                      >
                        {scheduling ? "Scheduling..." : "📅 Schedule to Calendar with This Image"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══ RIGHT COLUMN: Generated Content ═══ */}
          <div className="space-y-6">
            {!result && !generating && (
              <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-3xl h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-4 opacity-20">✦</div>
                  <p className="text-zinc-600 text-lg font-medium">Your AI content package will appear here</p>
                  <p className="text-zinc-700 text-sm mt-1">Fill in the brief and hit Generate</p>
                </div>
              </div>
            )}

            {generating && (
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-zinc-400 text-lg font-medium">Crafting your content package...</p>
                  <p className="text-zinc-600 text-sm mt-1">Script, captions, hashtags, and image prompt</p>
                </div>
              </div>
            )}

            {result && (
              <>
                {/* Title */}
                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                  <h3 className="text-sm font-bold text-violet-400 uppercase tracking-widest mb-2">Content Title</h3>
                  <p className="text-xl font-bold text-white">{result.title}</p>
                </div>

                {/* Script */}
                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Script</h3>
                    <button
                      onClick={() => copyToClipboard(result.script, "script")}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      {copiedField === "script" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono bg-black/30 rounded-2xl p-5 border border-white/5 max-h-80 overflow-y-auto">
                    {result.script}
                  </div>
                </div>

                {/* Captions */}
                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-4">Platform Captions</h3>
                  <div className="space-y-3">
                    {result.captions?.map((caption, i) => (
                      <div key={i} className="bg-black/30 rounded-2xl p-4 border border-white/5 flex items-start gap-3">
                        <span className="text-xs font-black text-zinc-600 bg-white/5 px-2 py-1 rounded-lg shrink-0">#{i+1}</span>
                        <p className="text-sm text-zinc-300 leading-relaxed flex-1">{caption}</p>
                        <button
                          onClick={() => copyToClipboard(caption, `caption-${i}`)}
                          className="text-xs font-bold px-2 py-1 rounded-lg bg-white/5 text-zinc-500 hover:text-white transition-all shrink-0"
                        >
                          {copiedField === `caption-${i}` ? "✓" : "Copy"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hashtags */}
                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest">Hashtags</h3>
                    <button
                      onClick={() => copyToClipboard(result.hashtags.map(h => `#${h}`).join(" "), "hashtags")}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      {copiedField === "hashtags" ? "Copied!" : "Copy All"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.hashtags?.map((tag, i) => (
                      <span key={i} className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-300 text-xs font-bold">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Schedule without image */}
                <button
                  onClick={() => handleSchedule()}
                  disabled={scheduling}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl transition-all disabled:opacity-40 shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:-translate-y-0.5"
                >
                  {scheduling ? "Scheduling..." : "📅 Schedule to Calendar"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Fullscreen Image Preview Modal ═══ */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={expandedImage} alt="Full preview" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-white/10 object-contain" />
            <div className="flex gap-3 mt-4 justify-center">
              <button
                onClick={() => downloadImage(expandedImage)}
                className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all text-sm shadow-lg"
              >
                Download HD
              </button>
              <button
                onClick={() => { setSelectedImageUrl(expandedImage); setExpandedImage(null); }}
                className="px-6 py-3 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-400 transition-all text-sm shadow-lg"
              >
                Use as Cover
              </button>
              <button
                onClick={() => setExpandedImage(null)}
                className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all text-sm border border-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

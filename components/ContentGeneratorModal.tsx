"use client";

import React, { useState } from "react";
import { BusinessProfile } from "./BusinessProfileModal";

interface ContentGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BusinessProfile | null;
  onGenerate: (posts: GeneratedPost[]) => void;
}

export interface GeneratedPost {
  title: string;
  content: string;
  platform: string;
  day: number;
  type: "social";
  imageUrl?: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "in LinkedIn",
  twitter: "X Twitter",
  instagram: "ig Instagram",
  facebook: "fb Facebook",
  tiktok: "tt TikTok",
  youtube: "yt YouTube",
};

export default function ContentGeneratorModal({
  isOpen,
  onClose,
  profile,
  onGenerate,
}: ContentGeneratorModalProps) {
  const [phase, setPhase] = useState<"confirm" | "generating" | "generatingImages" | "preview">("confirm");
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [previewPage, setPreviewPage] = useState(0);
  const [withImages, setWithImages] = useState(true);
  const [imageProgress, setImageProgress] = useState(0);
  const [totalImages, setTotalImages] = useState(0);

  if (!isOpen || !profile) return null;

  const generateImagesForPosts = async (posts: GeneratedPost[]): Promise<GeneratedPost[]> => {
    setPhase("generatingImages");
    setTotalImages(posts.length);
    setImageProgress(0);

    const updatedPosts = [...posts];

    // Generate images in batches of 3 for speed
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const imagePrompt = `Professional social media post image for ${profile!.industry}: ${post.title}. Modern, clean, high quality, ${profile!.brandVoice} style. No text overlay.`;

      try {
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: imagePrompt, index: i }),
        });

        if (res.ok) {
          const data = await res.json();
          updatedPosts[i] = { ...updatedPosts[i], imageUrl: data.imageUrl };
        }
      } catch (e) {
        console.error(`Failed to generate image for post ${i + 1}:`, e);
      }

      setImageProgress(i + 1);
    }

    return updatedPosts;
  };

  const handleGenerate = async () => {
    setPhase("generating");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!res.ok) throw new Error("Generation failed");

      const data = await res.json();
      let posts: GeneratedPost[] = data.posts;

      // If user wants images, generate them
      if (withImages) {
        posts = await generateImagesForPosts(posts);
      }

      setGeneratedPosts(posts);
      setPhase("preview");
    } catch (err) {
      console.error("Failed to generate posts:", err);
      setPhase("confirm");
      alert("AI generation failed. Please check the server logs.");
    }
  };

  const handleApprove = () => {
    onGenerate(generatedPosts);
    onClose();
    setPhase("confirm");
    setGeneratedPosts([]);
    setPreviewPage(0);
    setImageProgress(0);
  };

  const postsPerPage = 5;
  const currentPosts = generatedPosts.slice(
    previewPage * postsPerPage,
    (previewPage + 1) * postsPerPage
  );
  const totalPages = Math.ceil(generatedPosts.length / postsPerPage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-8 pt-8 pb-2">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {phase === "confirm" && "Generate 30-Day Content Plan"}
            {phase === "generating" && "Generating Content..."}
            {phase === "generatingImages" && "Generating Images..."}
            {phase === "preview" && "Your 30-Day Content Plan"}
          </h2>
        </div>

        {/* Body */}
        <div className="px-8 py-6 flex-grow overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {phase === "confirm" && (
            <div className="space-y-6">
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                The AI will generate <span className="text-slate-900 font-bold">30 unique posts</span> tailored to your business profile:
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
                <div className="flex justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business</span>
                  <span className="text-sm font-bold text-slate-800">{profile.businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Industry</span>
                  <span className="text-sm font-bold text-slate-800">{profile.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audience</span>
                  <span className="text-sm font-bold text-slate-800">{profile.targetAudience}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platforms</span>
                  <span className="text-sm font-bold text-slate-800">{profile.platforms.map((p) => PLATFORM_LABELS[p]?.split(" ")[0] || p).join(" ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Voice</span>
                  <span className="text-sm font-bold text-slate-800 capitalize">{profile.brandVoice}</span>
                </div>
                {profile.monthlyTheme && (
                  <div className="flex justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Theme</span>
                    <span className="text-sm font-bold text-blue-600">{profile.monthlyTheme}</span>
                  </div>
                )}
              </div>

              {/* Image Generation Toggle */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-indigo-900">AI Image Generation</p>
                      <p className="text-[11px] font-medium text-indigo-700/70 mt-0.5">Generate a custom AI image for each post</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setWithImages(!withImages)}
                    className={`w-12 h-6 rounded-full transition-all relative ${
                      withImages ? "bg-indigo-600" : "bg-slate-300"
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${
                      withImages ? "left-[26px]" : "left-0.5"
                    }`} />
                  </button>
                </div>
                {withImages && (
                  <p className="text-[10px] font-semibold text-indigo-800/60 mt-3 pl-[56px]">
                    Uses AI image generation • FLUX Schnell model • ~30 images
                  </p>
                )}
              </div>
            </div>
          )}

          {phase === "generating" && (
            <div className="flex flex-col items-center justify-center py-16 gap-5">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-sm" />
              <p className="text-sm font-bold text-slate-600">Analyzing your brand and crafting 30 posts...</p>
            </div>
          )}

          {phase === "generatingImages" && (
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-sm" />
              <div className="text-center">
                <p className="text-base font-bold text-slate-800">Generating AI Images</p>
                <p className="text-sm font-semibold text-slate-500 mt-1">
                  {imageProgress} of {totalImages} images complete
                </p>
              </div>
              {/* Progress bar */}
              <div className="w-72 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${totalImages > 0 ? (imageProgress / totalImages) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs font-medium text-slate-400">Using AI FLUX Schnell model • This may take a few minutes</p>
            </div>
          )}

          {phase === "preview" && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">
                Showing {previewPage * postsPerPage + 1}–{Math.min((previewPage + 1) * postsPerPage, 30)} of 30 posts
              </p>
              {currentPosts.map((post) => (
                <div key={post.day} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 items-start shadow-sm">
                  {/* Image thumbnail */}
                  {post.imageUrl && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 shadow-sm">
                      <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wide">Day {post.day}</span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="text-[11px] font-semibold text-slate-500">{PLATFORM_LABELS[post.platform] || post.platform}</span>
                    </div>
                    <p className="text-sm text-slate-900 font-bold mt-2 truncate leading-snug">{post.title}</p>
                    <p className="text-xs text-slate-600 font-medium mt-1 truncate">{post.content?.slice(0, 80)}...</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setPreviewPage(Math.max(0, previewPage - 1))}
                  disabled={previewPage === 0}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                >
                  ← Previous
                </button>
                <span className="text-xs font-bold text-slate-400">{previewPage + 1} / {totalPages}</span>
                <button
                  onClick={() => setPreviewPage(Math.min(totalPages - 1, previewPage + 1))}
                  disabled={previewPage === totalPages - 1}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 pt-4 flex items-center gap-3 justify-end border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="py-2.5 px-6 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
            Cancel
          </button>
          {phase === "confirm" && (
            <button
              onClick={handleGenerate}
              className="py-2.5 px-6 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all"
            >
              Generate 30 Posts{withImages ? " + Images" : ""}
            </button>
          )}
          {phase === "preview" && (
            <button
              onClick={handleApprove}
              className="py-2.5 px-8 bg-slate-900 text-white shadow-md rounded-lg text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              Add All to Calendar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

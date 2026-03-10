"use client";

import React, { useState } from "react";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onAddEvent: (event: {
    title: string;
    start: Date;
    type: "meeting" | "social";
    backgroundColor: string;
    borderColor: string;
    videoUrl?: string;
  }) => void;
}

export default function EventModal({
  isOpen,
  onClose,
  selectedDate,
  onAddEvent,
}: EventModalProps) {
  const [tab, setTab] = useState<"meeting" | "social">("meeting");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prefix = tab === "meeting" ? "Meeting:" : "Post:";
    onAddEvent({
      title: `${prefix} ${title}`,
      start: new Date(selectedDate),
      type: tab,
      backgroundColor: tab === "meeting" ? "#10b981" : "#3b82f6",
      borderColor: tab === "meeting" ? "#059669" : "#2563eb",
      videoUrl: tab === "social" && videoUrl.trim() ? videoUrl : undefined,
    });
    onClose();
    setTitle("");
    setDescription("");
    setVideoUrl("");
  };

  const meetingTabClass =
    tab === "meeting"
      ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-950/20"
      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50";

  const socialTabClass =
    tab === "social"
      ? "text-blue-400 border-b-2 border-blue-400 bg-blue-950/20"
      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50";

  const submitBtnClass =
    tab === "meeting"
      ? "bg-emerald-600 hover:bg-emerald-500"
      : "bg-blue-600 hover:bg-blue-500";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setTab("meeting")}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${meetingTabClass}`}
          >
            🤝 Client Meeting
          </button>
          <button
            onClick={() => setTab("social")}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${socialTabClass}`}
          >
            📱 Social Post
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          <p className="text-xs text-gray-500 mb-4">
            Scheduling for:{" "}
            <span className="text-blue-400 font-medium">{selectedDate}</span>
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                {tab === "meeting"
                  ? "Client Name / Subject"
                  : "Post Topic / Headline"}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder={
                  tab === "meeting"
                    ? "e.g., John Doe - Q1 Strategy Sync"
                    : "e.g., Top 5 AI Tools for SMBs"
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5 flex justify-between items-center">
                <span>
                  {tab === "meeting" ? "Meeting Agenda" : "Post Content"}
                </span>
                {tab === "social" && (
                  <button
                    type="button"
                    className="text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full hover:bg-indigo-500/30 transition-colors"
                  >
                    ✨ Generate with AI
                  </button>
                )}
              </label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none transition-all"
                placeholder={
                  tab === "meeting"
                    ? "Discuss Q1 revenue targets, marketing budget allocation..."
                    : "Draft your social media copy here..."
                }
              />
            </div>

            {tab === "social" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Attach Video (CapCut Export)
                </label>
                
                {!videoUrl ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 bg-[#0a0a0a] border-2 border-dashed border-gray-800 rounded-xl cursor-pointer hover:border-blue-500/50 hover:bg-[#111] transition-all relative overflow-hidden">
                    {uploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        <span className="text-sm font-medium text-blue-400">Uploading Video...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-3 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-1 text-sm text-gray-400"><span className="font-semibold text-white">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-500">MP4, WebM (Max 50MB)</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="video/*" 
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        try {
                          const formData = new FormData();
                          formData.append("file", file);
                          const res = await fetch("/api/upload", {
                            method: "POST",
                            body: formData,
                          });
                          const data = await res.json();
                          if (data.url) {
                            setVideoUrl(data.url);
                          } else {
                            alert(data.error || "Upload failed");
                          }
                        } catch (err) {
                          alert("Failed to upload video.");
                        } finally {
                          setUploading(false);
                        }
                      }}
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-semibold text-white truncate">Video Attached</p>
                        <p className="text-xs text-blue-400 truncate">{videoUrl.split('/').pop()}</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setVideoUrl("")}
                      className="text-gray-400 hover:text-red-400 p-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Upload your finished video from the AI Content Factory to schedule it.
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className={`flex-1 py-3 px-4 text-white rounded-xl font-medium transition-all ${uploading ? 'opacity-50 cursor-not-allowed bg-gray-600' : submitBtnClass}`}
              >
                {tab === "meeting" ? "Schedule Meeting" : "Schedule Post"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

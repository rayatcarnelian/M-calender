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
    });
    onClose();
    setTitle("");
    setDescription("");
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
        <div className="p-6">
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

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex-1 py-3 px-4 text-white rounded-xl font-medium transition-all ${submitBtnClass}`}
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

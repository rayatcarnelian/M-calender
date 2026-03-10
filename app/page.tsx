"use client";

import React, { useState, useEffect, useCallback } from "react";
import SmartCalendar from "@/components/SmartCalendar";
import BusinessProfileModal, { BusinessProfile } from "@/components/BusinessProfileModal";
import ContentGeneratorModal, { GeneratedPost } from "@/components/ContentGeneratorModal";
import IntegrationsModal from "@/components/IntegrationsModal";
import CompetitorSpyModal from "@/components/CompetitorSpyModal";
import Link from "next/link";

export default function Home() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [showSpyModal, setShowSpyModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [dbEvents, setDbEvents] = useState<any[]>([]);

  // Load events from DB on mount
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setDbEvents(data.map((e: any) => ({
          id: e.id,
          title: e.status === "published" ? `✅ ${e.title}` : e.title,
          start: new Date(e.start),
          allDay: e.type === "social",
          type: e.type,
          status: e.status,
          content: e.content || "",
          imageUrl: e.imageUrl || "",
          platform: e.platform || "",
          originalTitle: e.title || "",
          backgroundColor: e.type === "meeting" ? "#10b981" : e.status === "published" ? "#0f766e" : "#3b82f6",
          borderColor: e.type === "meeting" ? "#059669" : e.status === "published" ? "#0d9488" : "#2563eb",
        })));
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Save generated content to DB
  const handleGenerateContent = async (posts: GeneratedPost[]) => {
    const today = new Date();
    const newEvents = posts.map((post) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + post.day);
      return {
        title: `Post: ${post.title}`,
        start: date.toISOString(),
        type: "social",
        platform: post.platform,
        content: post.content,
        color: "#3b82f6",
        imageUrl: post.imageUrl || null,
      };
    });

    try {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvents),
      });
      fetchEvents(); // Reload from DB
    } catch (err) {
      console.error("Failed to save events:", err);
    }
  };

  // Save single event from modal to DB
  const handleAddEvent = async (event: any) => {
    try {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: event.title,
          start: new Date(event.start).toISOString(),
          type: event.type,
          color: event.backgroundColor,
          videoUrl: event.videoUrl,
        }),
      });
      fetchEvents();
    } catch (err) {
      console.error("Failed to save event:", err);
    }
  };

  // Sync drag-and-drop event changes to the database
  const handleUpdateEvent = async (eventInfo: any) => {
    try {
      await fetch("/api/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: eventInfo.id,
          start: eventInfo.start?.toISOString(),
          end: eventInfo.end?.toISOString()
        }),
      });
      fetchEvents();
    } catch (err) {
      console.error("Failed to update event dates:", err);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await fetch(`/api/events?id=${id}`, { method: "DELETE" });
      setSelectedEvent(null);
      fetchEvents();
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  const handleGenerate30Day = () => {
    if (!profile) {
      setShowProfileModal(true);
    } else {
      setShowContentModal(true);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-[#050505] to-[#050505] text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Navbar */}
      <nav className="h-20 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl flex items-center px-10 flex-shrink-0 z-40 relative">
        <div className="flex items-center gap-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 flex items-center justify-center text-lg font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] border border-white/10">
            V
          </div>
          <span className="text-lg font-bold text-white tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">Volts</span>
        </div>

        <div className="flex-grow" />

        <div className="flex items-center gap-10">
          {profile && (
            <button
              onClick={() => setShowProfileModal(true)}
              className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
            >
              {profile.businessName}
            </button>
          )}
          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-700 shadow-sm">
            R
          </div>
        </div>
      </nav>

      <div className="flex flex-grow overflow-hidden">
        {/* Left Sidebar */}
        {/* Left Sidebar */}
        <aside className="w-80 flex-shrink-0 border-r border-white/10 flex flex-col bg-white/[0.02] backdrop-blur-2xl relative z-10">
          {/* Quick Actions */}
          <div className="p-8 flex flex-col gap-5 flex-grow">
            <button
              onClick={handleGenerate30Day}
              className="w-full py-4 px-6 bg-white text-black rounded-2xl text-sm font-bold hover:bg-zinc-200 transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:-translate-y-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"></path><path d="M12 18v4"></path><path d="M4.93 4.93l2.83 2.83"></path><path d="M16.24 16.24l2.83 2.83"></path><path d="M2 12h4"></path><path d="M18 12h4"></path><path d="M4.93 19.07l2.83-2.83"></path><path d="M16.24 7.76l2.83-2.83"></path></svg>
              Generate 30-Day Content
            </button>

            {!profile && (
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-full py-4 px-6 bg-white/5 text-zinc-300 rounded-2xl text-sm font-semibold hover:bg-white/10 hover:text-white transition-all duration-300 border border-white/10 hover:border-white/20"
              >
                Set Up Business Profile
              </button>
            )}

            <button
               onClick={() => setShowIntegrationsModal(true)}
               className="w-full py-4 px-6 bg-white/5 text-zinc-300 rounded-2xl text-sm font-semibold hover:bg-white/10 hover:text-white transition-all duration-300 border border-white/10 hover:border-white/20 flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              Social Integrations
            </button>

            <button
              onClick={() => setShowSpyModal(true)}
              className="w-full mt-4 py-4 px-6 bg-indigo-500/10 text-indigo-300 rounded-2xl text-sm font-semibold hover:bg-indigo-500/20 hover:text-indigo-200 transition-all duration-300 border border-indigo-500/20 hover:border-indigo-500/40 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              AI Competitor Spy
            </button>

            <Link href="/trending">
              <button className="w-full mt-4 py-4 px-6 bg-pink-500/10 text-pink-300 rounded-2xl text-sm font-semibold hover:bg-pink-500/20 hover:text-pink-200 transition-all duration-300 border border-pink-500/20 hover:border-pink-500/40 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(236,72,153,0.15)] flex items-center justify-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                Viral Trend Analyzer
              </button>
            </Link>

            <Link href="/create">
              <button className="w-full mt-2 py-4 px-6 bg-violet-500/10 text-violet-300 rounded-2xl text-sm font-semibold hover:bg-violet-500/20 hover:text-violet-200 transition-all duration-300 border border-violet-500/20 hover:border-violet-500/40 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] flex items-center justify-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                AI Content Studio
              </button>
            </Link>
          </div>

          {/* Profile badge */}
          {profile && (
            <div className="p-6 m-8 border border-white/10 bg-white/5 rounded-3xl shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                  {profile.businessName.charAt(0)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-base text-white font-bold tracking-wide truncate">{profile.businessName}</p>
                  <p className="text-sm text-zinc-400 font-medium mt-1 truncate">{profile.industry}</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Calendar Area */}
        <div className="flex-grow flex flex-col p-5 overflow-hidden">
          <SmartCalendar 
            externalEvents={dbEvents} 
            onAddEvent={handleAddEvent} 
            onUpdateEvent={handleUpdateEvent}
            onEventClick={setSelectedEvent}
          />
        </div>
      </div>

      {/* Modals */}
      <BusinessProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSave={(p) => {
          setProfile(p);
          setShowContentModal(true);
        }}
        existingProfile={profile}
      />

      <ContentGeneratorModal
        isOpen={showContentModal}
        onClose={() => setShowContentModal(false)}
        profile={profile}
        onGenerate={handleGenerateContent}
      />

      <IntegrationsModal
        isOpen={showIntegrationsModal}
        onClose={() => setShowIntegrationsModal(false)}
      />

      <CompetitorSpyModal
        isOpen={showSpyModal}
        onClose={() => setShowSpyModal(false)}
        profile={profile}
        onAddPosts={handleGenerateContent}
      />

      {/* Event Details / Delete Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-[#0a0b0f] w-full max-w-md rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            
            {/* Image Preview */}
            {selectedEvent.extendedProps?.imageUrl && (
              <div className="w-full aspect-video relative bg-black overflow-hidden">
                <img src={selectedEvent.extendedProps.imageUrl} alt="Post image" className="w-full h-full object-cover opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0f] via-transparent to-transparent" />
              </div>
            )}

            <div className="p-6">
              {/* Platform Badge + Date */}
              <div className="flex items-center gap-2 mb-3">
                {selectedEvent.extendedProps?.platform && (
                  <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                    {selectedEvent.extendedProps.platform}
                  </span>
                )}
                <span className="text-[10px] font-bold text-zinc-500">
                  {new Date(selectedEvent.start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
                {selectedEvent.extendedProps?.status && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    selectedEvent.extendedProps.status === "published" 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {selectedEvent.extendedProps.status === "published" ? "Published" : "Pending"}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-white mb-3 leading-snug">{selectedEvent.title}</h3>
              
              {/* Content/Caption */}
              {selectedEvent.extendedProps?.content && (
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 mb-4 max-h-48 overflow-y-auto">
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{selectedEvent.extendedProps.content}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-white text-sm font-semibold rounded-xl transition-colors border border-white/10"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-semibold rounded-xl transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

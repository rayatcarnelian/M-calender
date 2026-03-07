"use client";

import React, { useState, useEffect, useCallback } from "react";
import SmartCalendar from "@/components/SmartCalendar";
import BusinessProfileModal, { BusinessProfile } from "@/components/BusinessProfileModal";
import ContentGeneratorModal, { GeneratedPost } from "@/components/ContentGeneratorModal";
import IntegrationsModal from "@/components/IntegrationsModal";
import CompetitorSpyModal from "@/components/CompetitorSpyModal";

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
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-slate-200 bg-white flex items-center px-8 flex-shrink-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
            V
          </div>
          <span className="text-base font-bold text-slate-800 tracking-tight">Volts Calendar</span>
        </div>

        <div className="flex-grow" />

        <div className="flex items-center gap-8">
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
        <aside className="w-72 flex-shrink-0 border-r border-slate-200 flex flex-col bg-white">
          {/* Quick Actions */}
          <div className="p-6 space-y-3 border-b border-slate-100">
            <button
              onClick={handleGenerate30Day}
              className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"></path><path d="M12 18v4"></path><path d="M4.93 4.93l2.83 2.83"></path><path d="M16.24 16.24l2.83 2.83"></path><path d="M2 12h4"></path><path d="M18 12h4"></path><path d="M4.93 19.07l2.83-2.83"></path><path d="M16.24 7.76l2.83-2.83"></path></svg>
              Generate 30-Day Content
            </button>

            {!profile && (
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-full py-2.5 px-4 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-all border border-slate-200"
              >
                Set Up Business Profile
              </button>
            )}

            <button
               onClick={() => setShowIntegrationsModal(true)}
               className="w-full py-2.5 px-4 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-all border border-slate-200 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              Integrations
            </button>

            <button
              onClick={() => setShowSpyModal(true)}
              className="w-full mt-3 py-2.5 px-4 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-all border border-indigo-200 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              AI Competitor Spy
            </button>
          </div>

          {/* Event Types */}
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              Event Types
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span className="text-sm font-medium text-slate-600">Client Meetings</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                <span className="text-sm font-medium text-slate-600">Social Media Posts</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span className="text-sm font-medium text-slate-600">Tasks & Deadlines</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              This Month
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col items-center justify-center text-center shadow-sm">
                <p className="text-3xl font-extrabold text-slate-800 mb-1">12</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Meetings</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col items-center justify-center text-center shadow-sm">
                <p className="text-3xl font-extrabold text-slate-800 mb-1">24</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Scheduled</p>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="p-6 flex-grow overflow-y-auto">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              AI Insights
            </h3>
            <div className="space-y-3">
              <div className="p-4 bg-blue-50/50 hover:bg-blue-50 transition-colors border border-blue-100 rounded-xl">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  <span className="font-bold text-blue-700">#AIAutomation</span> is trending. Draft a post to capitalize on this.
                </p>
              </div>
              <div className="p-4 bg-emerald-50/50 hover:bg-emerald-50 transition-colors border border-emerald-100 rounded-xl">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  <span className="font-bold text-emerald-700">Market +2.3%</span> — Consider a commentary post.
                </p>
              </div>
              <div className="p-4 bg-amber-50/50 hover:bg-amber-50 transition-colors border border-amber-100 rounded-xl">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  You have <span className="font-bold text-amber-700">3 empty days</span> next week. Fill them with content?
                </p>
              </div>
            </div>
          </div>

          {/* Profile badge */}
          {profile && (
            <div className="p-4 m-4 border border-slate-200 bg-slate-50 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
                  {profile.businessName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm text-slate-800 font-bold">{profile.businessName}</p>
                  <p className="text-xs text-slate-500 font-medium">{profile.industry}</p>
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
          <div className="bg-[#0a0b0f] w-full max-w-sm rounded-2xl border border-white/[0.08] shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">{selectedEvent.title}</h3>
            <p className="text-sm text-gray-400 mb-6 font-mono">
              {new Date(selectedEvent.start).toLocaleString()}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 text-sm font-semibold rounded-lg transition-colors"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import EventModal from "@/components/EventModal";

interface CalendarEvent {
  title: string;
  start: Date;
  type: "meeting" | "social";
  backgroundColor?: string;
  borderColor?: string;
}

interface SmartCalendarProps {
  externalEvents?: CalendarEvent[];
  onAddEvent?: (event: CalendarEvent) => void;
  onUpdateEvent?: (event: any) => void;
  onEventClick?: (event: any) => void;
}

export default function SmartCalendar({ externalEvents = [], onAddEvent, onUpdateEvent, onEventClick }: SmartCalendarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  const handleDateClick = (arg: { dateStr: string }) => {
    setSelectedDate(arg.dateStr);
    setIsModalOpen(true);
  };

  const handleAddEvent = (newEvent: CalendarEvent) => {
    if (onAddEvent) onAddEvent(newEvent);
  };

  return (
    <div className="w-full h-full calendar-container">
      <style>{`
        .fc {
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: #f8fafc;
          --fc-neutral-text-color: #64748b;
          --fc-border-color: #e2e8f0;
          --fc-button-text-color: #475569;
          --fc-button-bg-color: #f1f5f9;
          --fc-button-border-color: #e2e8f0;
          --fc-button-hover-bg-color: #e2e8f0;
          --fc-button-hover-border-color: #cbd5e1;
          --fc-button-active-bg-color: #3b82f6;
          --fc-button-active-border-color: #3b82f6;
          --fc-event-bg-color: #2563eb;
          --fc-event-border-color: #1d4ed8;
          --fc-event-text-color: #ffffff;
          --fc-today-bg-color: rgba(59, 130, 246, 0.05);
          --fc-now-indicator-color: #ef4444;
          font-family: 'Inter', sans-serif;
        }

        .fc .fc-toolbar-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: #1e293b;
          letter-spacing: -0.02em;
        }

        .fc .fc-button {
          border-radius: 8px !important;
          font-weight: 600;
          font-size: 0.8rem;
          padding: 8px 16px;
          text-transform: capitalize;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .fc .fc-button-active {
          color: white !important;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }

        .fc .fc-button-group .fc-button {
          border-radius: 0 !important;
        }
        .fc .fc-button-group .fc-button:first-child {
          border-radius: 8px 0 0 8px !important;
        }
        .fc .fc-button-group .fc-button:last-child {
          border-radius: 0 8px 8px 0 !important;
        }

        .fc .fc-col-header-cell-cushion {
          padding: 12px 4px;
          color: #64748b;
          font-weight: 700;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .fc .fc-daygrid-day-number {
          padding: 8px 10px;
          color: #64748b;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          color: #2563eb;
          font-weight: 800;
        }

        .fc .fc-event {
          border-radius: 6px !important;
          padding: 4px 8px;
          font-size: 0.78rem;
          font-weight: 600;
          border: none !important;
          cursor: pointer;
          transition: transform 0.1s ease, box-shadow 0.15s ease;
        }

        .fc .fc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59,130,246,0.25);
        }

        .fc .fc-daygrid-day:hover {
          background: #f8fafc;
          cursor: pointer;
        }

        .fc th, .fc td {
          border-color: #e2e8f0 !important;
        }

        .fc .fc-scrollgrid {
          border-color: #e2e8f0 !important;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
          background: white;
        }

        .fc .fc-timegrid-slot {
          height: 48px;
        }

        .fc .fc-timegrid-slot-label-cushion {
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 500;
        }
      `}</style>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={externalEvents}
        dateClick={handleDateClick}
        eventClick={(info) => onEventClick?.(info.event)}
        eventDrop={(info) => onUpdateEvent?.(info.event)}
        eventResize={(info) => onUpdateEvent?.(info.event)}
        editable={true}
        droppable={true}
        selectable={true}
        height="100%"
      />

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        onAddEvent={handleAddEvent}
      />
    </div>
  );
}

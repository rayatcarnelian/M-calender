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
  extendedProps?: {
    imageUrl?: string;
    platform?: string;
    content?: string;
    status?: string;
    originalTitle?: string;
  };
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

  // Custom render for calendar events (shows image, platform, title)
  const renderEventContent = (eventInfo: any) => {
    const props = eventInfo.event.extendedProps;
    const hasImage = !!props?.imageUrl;
    
    const bgGradient = props?.status === 'published' 
      ? 'linear-gradient(to bottom right, rgba(15, 118, 110, 0.6), rgba(13, 148, 136, 0.6))'
      : props?.type === 'meeting' 
        ? 'linear-gradient(to bottom right, rgba(16, 185, 129, 0.6), rgba(5, 150, 105, 0.6))'
        : 'linear-gradient(to bottom right, rgba(79, 70, 229, 0.6), rgba(147, 51, 234, 0.6))';

    return (
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: '70px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '6px 8px',
        overflow: 'hidden',
        borderRadius: '8px',
        background: hasImage ? 'transparent' : bgGradient,
      }}>
        {/* Background Image */}
        {hasImage && (
          <>
            <img 
              src={props.imageUrl} 
              alt=""
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                width: '100%', height: '100%', objectFit: 'cover',
                zIndex: 0, opacity: 0.9, pointerEvents: 'none',
              }}
            />
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.3), rgba(0,0,0,0.1))',
              zIndex: 0,
            }} />
          </>
        )}
        
        <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>
          {/* Platform Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '3px' }}>
            {props?.platform && (
              <span style={{
                fontSize: '8px', fontWeight: 900, textTransform: 'uppercase' as const,
                letterSpacing: '0.1em', backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white', padding: '2px 5px', borderRadius: '3px',
                backdropFilter: 'blur(8px)',
              }}>
                {props.platform}
              </span>
            )}
            {eventInfo.timeText && (
              <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                {eventInfo.timeText}
              </span>
            )}
          </div>
          {/* Title */}
          <div style={{
            fontSize: '10px', fontWeight: 700, color: 'white',
            lineHeight: 1.3, overflow: 'hidden',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            wordBreak: 'break-word',
          }}>
            {eventInfo.event.title}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full calendar-container">
      <style>{`
        .fc {
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: rgba(255, 255, 255, 0.02);
          --fc-neutral-text-color: #a1a1aa;
          --fc-border-color: rgba(255, 255, 255, 0.08);
          --fc-button-text-color: #d4d4d8;
          --fc-button-bg-color: rgba(255, 255, 255, 0.05);
          --fc-button-border-color: rgba(255, 255, 255, 0.1);
          --fc-button-hover-bg-color: rgba(255, 255, 255, 0.1);
          --fc-button-hover-border-color: rgba(255, 255, 255, 0.2);
          --fc-button-active-bg-color: rgba(99, 102, 241, 0.2);
          --fc-button-active-border-color: rgba(99, 102, 241, 0.4);
          --fc-event-bg-color: #6366f1;
          --fc-event-border-color: #4f46e5;
          --fc-event-text-color: #ffffff;
          --fc-today-bg-color: rgba(99, 102, 241, 0.08);
          --fc-now-indicator-color: #ec4899;
          font-family: 'Inter', sans-serif;
        }

        .fc .fc-toolbar-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: #f4f4f5;
          letter-spacing: 0.02em;
        }

        .fc .fc-button {
          border-radius: 10px !important;
          font-weight: 600;
          font-size: 0.8rem;
          padding: 8px 16px;
          text-transform: capitalize;
          transition: all 0.3s ease;
          backdrop-filter: blur(8px);
        }
        
        .fc .fc-button-active {
          color: white !important;
          box-shadow: 0 0 15px rgba(99,102,241,0.3) !important;
        }

        .fc .fc-button-group .fc-button {
          border-radius: 0 !important;
        }
        .fc .fc-button-group .fc-button:first-child {
          border-radius: 10px 0 0 10px !important;
        }
        .fc .fc-button-group .fc-button:last-child {
          border-radius: 0 10px 10px 0 !important;
        }

        @media (max-width: 640px) {
          .fc .fc-toolbar-title {
            font-size: 1.1rem;
          }
          .fc .fc-button {
            padding: 4px 8px;
            font-size: 0.7rem;
          }
          .fc-header-toolbar {
            flex-direction: column !important;
            gap: 10px !important;
          }
          .fc .fc-col-header-cell-cushion {
            font-size: 0.6rem;
            padding: 8px 2px;
          }
          .fc .fc-daygrid-day-number {
            font-size: 0.7rem;
            padding: 4px;
          }
          .fc .fc-event {
            min-height: 40px !important;
          }
        }

        .fc .fc-col-header-cell-cushion {
          padding: 12px 4px;
          color: #71717a;
          font-weight: 700;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .fc .fc-daygrid-day-number {
          padding: 8px 10px;
          color: #71717a;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          color: #818cf8;
          font-weight: 800;
          text-shadow: 0 0 10px rgba(129,140,248,0.4);
        }

        .fc .fc-event {
          border-radius: 8px !important;
          border: none !important;
          cursor: pointer;
          overflow: hidden !important;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          background-color: transparent !important;
          min-height: 80px !important;
          position: relative;
        }

        .fc .fc-event-main {
          padding: 0 !important;
          height: 100% !important;
          width: 100% !important;
        }

        .fc .fc-daygrid-event-harness {
          margin-bottom: 8px !important;
        }

        .fc .fc-event:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(99,102,241,0.4);
        }

        .fc .fc-daygrid-day:hover {
          background: rgba(255,255,255,0.02);
          cursor: pointer;
        }

        .fc th, .fc td {
          border-color: rgba(255,255,255,0.05) !important;
        }

        .fc .fc-scrollgrid {
          border-color: rgba(255,255,255,0.08) !important;
          border-radius: 16px;
          overflow: hidden;
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(16px);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05), 0 10px 40px rgba(0,0,0,0.5);
        }

        .fc .fc-timegrid-slot {
          height: 48px;
        }

        .fc .fc-timegrid-slot-label-cushion {
          color: #71717a;
          font-size: 0.75rem;
          font-weight: 500;
        }

        /* Mobile Formatting */
        @media (max-width: 640px) {
          .fc .fc-toolbar {
            flex-direction: column;
            gap: 12px;
          }
          .fc .fc-toolbar-title {
            font-size: 1.1rem;
            text-align: center;
          }
          .fc .fc-button {
            padding: 6px 12px;
            font-size: 0.7rem;
          }
          .fc .fc-event {
            min-height: 50px !important;
          }
          .calendar-container {
             min-height: 80vh;
          }
        }
      `}</style>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        contentHeight="auto"
        height="auto"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={externalEvents}
        dateClick={handleDateClick}
        eventContent={renderEventContent}
        eventClick={(info) => onEventClick?.(info.event)}
        eventDrop={(info) => onUpdateEvent?.(info.event)}
        eventResize={(info) => onUpdateEvent?.(info.event)}
        editable={true}
        droppable={true}
        selectable={true}
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

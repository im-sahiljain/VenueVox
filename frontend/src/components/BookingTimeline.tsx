"use client";

import React, { useState } from "react";
import { to12h, toLocalISOString } from "@/lib/utils";
import { Calendar as CalendarIcon, Clock, MapPin, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

interface BookingTimelineProps {
  bookings: any[];
  venues?: any[]; // Passed if Organization
  viewType: "organization" | "performer";
}

export function BookingTimeline({ bookings, venues = [], viewType }: BookingTimelineProps) {
  // We'll manage a scrolling 7-day window. Start offset in days.
  const [dayOffset, setDayOffset] = useState(0);

  // Generate the 7 days array
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + dayOffset + i);
    const dateStr = toLocalISOString(d);
    const dayName = d.toLocaleString("default", { weekday: "short" });
    const dayNum = d.getDate();
    return { dateStr, label: `${dayName} ${dayNum}`, isToday: i + dayOffset === 0 };
  });

  // Calculate left and width percentages based on HH:MM
  const getPositionStyles = (startTime: string, endTime: string) => {
    const parseTime = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h + (m || 0) / 60;
    };
    
    const startHour = parseTime(startTime);
    const endHour = parseTime(endTime);
    
    // Safety check if endHour < startHour (overnight)
    const duration = endHour >= startHour ? endHour - startHour : 24 - startHour + endHour;

    return {
      left: `${(startHour / 24) * 100}%`,
      width: `${(duration / 24) * 100}%`,
    };
  };

  // Build the Y-axis rows
  let rows: { id: string; name: string }[] = [];
  
  if (viewType === "organization") {
    rows = venues.map(v => ({ id: v.id, name: v.name }));
  } else {
    // For performers, extract unique venues from their bookings
    const uniqueVenueIds = Array.from(new Set(bookings.map(b => b.venueId)));
    rows = uniqueVenueIds.map(vid => {
      // Find one booking to grab venue name, or fallback
      const match = bookings.find(b => b.venueId === vid);
      return { id: vid, name: match?.venue?.name || "Venue" };
    });
    
    // If empty schedule, provide an empty row
    if (rows.length === 0) {
      rows = [{ id: "empty", name: "No upcoming venues" }];
    }
  }

  const handlePrevWeek = () => setDayOffset(prev => prev - 7);
  const handleNextWeek = () => setDayOffset(prev => prev + 7);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-850">
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-rose-500" />
            Booking Timeline
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {viewType === "organization" ? "Schedule across all venues" : "Your upcoming gigs schedule"}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrevWeek} className="h-8 px-3 rounded-lg text-xs">
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous 7 Days
          </Button>
          <Button variant="outline" onClick={handleNextWeek} className="h-8 px-3 rounded-lg text-xs">
            Next 7 Days <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[2800px]">
          
          {/* Timeline Header (Days) */}
          <div className="flex border-b border-slate-100 dark:border-slate-700">
            <div className="w-48 shrink-0 border-r border-slate-100 dark:border-slate-700 p-4 font-bold text-sm text-slate-700 dark:text-slate-300 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
              {viewType === "organization" ? "Venues" : "Locations"}
            </div>
            
            <div className="flex-1 grid grid-cols-7 divide-x divide-slate-100 dark:divide-slate-700">
              {days.map((day, idx) => (
                <div key={idx} className={`text-center flex flex-col ${day.isToday ? 'bg-rose-50 dark:bg-rose-950/20' : ''}`}>
                  <div className="p-2 border-b border-slate-100 dark:border-slate-700 flex-1 flex flex-col justify-center items-center">
                    <span className={`text-sm font-bold block ${day.isToday ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                      {day.label}
                    </span>
                    {day.isToday && <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-0.5 block">Today</span>}
                  </div>
                  <div className="flex text-[9px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/20">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="flex-1 py-1 border-r border-slate-100 dark:border-slate-700 last:border-r-0">
                        {i * 2}h
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {rows.map((row) => (
              <div key={row.id} className="flex group hover:bg-slate-50/50 dark:hover:bg-slate-750/50 transition-colors">
                {/* Row Label (Venue) */}
                <div className="w-48 shrink-0 border-r border-slate-100 dark:border-slate-700 p-4 font-semibold text-xs text-slate-600 dark:text-slate-400 flex items-center bg-white dark:bg-slate-800">
                  <span className="truncate" title={row.name}>{row.name}</span>
                </div>

                {/* Row Cells (Days) */}
                <div className="flex-1 grid grid-cols-7 divide-x divide-slate-100 dark:divide-slate-700 relative">
                  {days.map((day, colIdx) => {
                    // Find bookings for this venue on this day
                    const cellBookings = bookings.filter(
                      (b) => b.venueId === row.id && b.date === day.dateStr && b.status !== "Rejected"
                    );

                    // Sort by start time so earlier bookings appear at the top of the cell
                    cellBookings.sort((a, b) => a.startTime.localeCompare(b.startTime));

                    // Calculate max height for this specific cell to stretch the row if needed
                    const cellHeight = Math.max(80, cellBookings.length * 44 + 16);

                    return (
                      <div key={colIdx} className={`relative p-1 border-t-0 ${day.isToday ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''}`} style={{ minHeight: `${cellHeight}px` }}>
                        
                        {/* 2-hour grid lines */}
                        <div className="absolute inset-0 flex pointer-events-none opacity-30 dark:opacity-20">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="flex-1 border-r border-slate-200 dark:border-slate-600 border-dashed last:border-r-0" />
                          ))}
                        </div>

                        {/* Render Bookings as Absolute Bars */}
                        {cellBookings.map((booking, idx) => {
                          const { left, width } = getPositionStyles(booking.startTime, booking.endTime);
                          const isConfirmed = booking.status === "Confirmed";
                          const topOffset = 8 + idx * 44; // Stack them vertically
                          
                          return (
                            <div
                              key={booking.id}
                              className={`absolute rounded-md shadow-sm border py-1 flex flex-col justify-center overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-offset-1 hover:z-20 group/gig ${
                                isConfirmed
                                  ? "bg-emerald-100 border-emerald-200 text-emerald-800 hover:ring-emerald-400 dark:bg-emerald-950/50 dark:border-emerald-800/50 dark:text-emerald-300"
                                  : "bg-amber-100 border-amber-200 text-amber-800 hover:ring-amber-400 dark:bg-amber-950/50 dark:border-amber-800/50 dark:text-amber-300"
                              }`}
                              style={{ left, width, top: `${topOffset}px`, height: '36px', minWidth: '40px' }}
                              title={`${to12h(booking.startTime)} - ${to12h(booking.endTime)}\n${viewType === 'organization' ? booking.performer?.name : row.name}\nStatus: ${booking.status}`}
                            >
                              <div className="px-2 text-[10px] font-black uppercase tracking-wider truncate flex items-center gap-1 opacity-70">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                {to12h(booking.startTime)}
                              </div>
                              <div className="px-2 text-xs font-bold leading-tight truncate">
                                {viewType === "organization" ? (booking.performer?.name || "Performer") : "Gig"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

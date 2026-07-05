"use client";

import React, { useState } from "react";
import { useAppDispatch, useAppSelector, RootState } from "@/lib/store/store";
import {
  createSlotThunk,
  deleteSlotThunk,
  setSelectedCalendarVenue,
  setIsBulkCreateMode,
  OrganizationState,
} from "@/lib/store/organizationSlice";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toLocalISOString, to12h } from "@/lib/utils";

export default function OrganizationCalendar() {
  const dispatch = useAppDispatch();
  const { venuesList, slotsList, selectedCalendarVenue, isBulkCreateMode } =
    useAppSelector((state: any) => state.organization as OrganizationState);

  const [selectedDate, setSelectedDate] = useState<string>(
    toLocalISOString(new Date()),
  );
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [newSlotData, setNewSlotData] = useState({
    startTime: "19:00",
    endTime: "22:00",
    budget: 5000,
    status: "AVAILABLE",
  });

  const handlePrevMonth = () => {
    const current = selectedDate ? new Date(selectedDate) : new Date();
    current.setMonth(current.getMonth() - 1);
    current.setDate(1);
    setSelectedDate(toLocalISOString(current));
  };

  const handleNextMonth = () => {
    const current = selectedDate ? new Date(selectedDate) : new Date();
    current.setMonth(current.getMonth() + 1);
    current.setDate(1);
    setSelectedDate(toLocalISOString(current));
  };

  const getDaysInMonth = () => {
    const now = selectedDate ? new Date(selectedDate) : new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCalendarVenue) return;

    dispatch(
      createSlotThunk({
        venueId: selectedCalendarVenue,
        date: selectedDate,
        startTime: newSlotData.startTime,
        endTime: newSlotData.endTime,
        budget: newSlotData.budget,
        status: newSlotData.status,
      }),
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        setShowAddSlotModal(false);
      }
    });
  };

  const handleDeleteSlot = (slotId: string) => {
    if (!confirm("Are you sure you want to delete this slot?")) return;
    dispatch(deleteSlotThunk(slotId));
  };

  // Filter slots for active venue
  const selectedVenueSlots = slotsList.filter(
    (s) => s.venueId === selectedCalendarVenue,
  );

  // Slots on selected day
  const selectedDaySlots = selectedVenueSlots.filter(
    (s) => s.date === selectedDate,
  );

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Availability Calendar
        </h1>
        <p className="text-slate-500 mt-1 dark:text-slate-400">
          Configure slot times and booking budget on dates to accept requests.
        </p>
      </div>

      {/* Venue Selector and Bulk Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <label className="font-bold text-sm">Active Venue:</label>
            <select
              value={selectedCalendarVenue || ""}
              onChange={(e) =>
                dispatch(setSelectedCalendarVenue(e.target.value))
              }
              className="p-2.5 rounded-xl border border-slate-300 text-slate-850 focus:outline-none bg-slate-50 font-medium dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm"
            >
              {venuesList.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bulk Create Toggle */}
          {/* <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-450">
              Bulk create mode:
            </span>
            <div
              onClick={() => dispatch(setIsBulkCreateMode(!isBulkCreateMode))}
              className={`w-8 h-4 rounded-full relative cursor-pointer group transition-colors ${
                isBulkCreateMode ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <div
                className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
                  isBulkCreateMode ? 'translate-x-4' : 'translate-x-0.5 group-hover:scale-110'
                }`}
              ></div>
            </div>
            <span className="text-[10px] text-slate-400 ml-1">(Drag across dates)</span>
          </div> */}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddSlotModal(true)}
            disabled={!selectedCalendarVenue}
            className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold shadow cursor-pointer h-10 px-4"
          >
            <Plus className="w-4 h-4" /> Create Calendar Slot
          </Button>
        </div>
      </div>

      {/* Calendar Legend */}
      <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-650 dark:text-slate-400 px-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>{" "}
          Available
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> Pending
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Booked
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div> Blocked
        </div>
      </div>

      {/* Split Screen Calendar and Slot details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 hidden md:block"></div>

            <div className="flex items-center justify-center gap-3 flex-shrink-0">
              <Button
                variant="ghost"
                onClick={handlePrevMonth}
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-750 dark:hover:text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h3 className="font-bold text-lg whitespace-nowrap text-center min-w-[130px]">
                {new Date(selectedDate || Date.now()).toLocaleString(
                  "default",
                  {
                    month: "long",
                    year: "numeric",
                  },
                )}
              </h3>
              <Button
                variant="ghost"
                onClick={handleNextMonth}
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-750 dark:hover:text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center justify-end gap-2 flex-1">
              {selectedDate && (
                <Button
                  variant="ghost"
                  onClick={() => setSelectedDate("")}
                  className="text-xs text-rose-500 hover:text-rose-600 h-8 px-2 hidden sm:block"
                >
                  Clear Selection
                </Button>
              )}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="p-2 rounded-lg border border-slate-350 text-slate-850 dark:bg-slate-900 dark:border-slate-700 dark:text-white text-xs max-w-[140px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Padding empty days */}
            {Array.from({
              length: new Date(
                new Date(selectedDate || Date.now()).getFullYear(),
                new Date(selectedDate || Date.now()).getMonth(),
                1,
              ).getDay(),
            }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="h-16 border border-transparent"
              ></div>
            ))}

            {/* Active month days */}
            {getDaysInMonth().map((dayDate) => {
              const dayStr = toLocalISOString(dayDate);
              const slotsForDay = selectedVenueSlots.filter(
                (s) => s.date === dayStr,
              );
              const isSelected = selectedDate === dayStr;

              return (
                <button
                  key={dayStr}
                  onClick={() => setSelectedDate(dayStr)}
                  className={`h-16 border rounded-2xl flex flex-col items-center justify-between p-1.5 transition text-left ${
                    isSelected
                      ? "border-rose-500 bg-rose-50/30 ring-1 ring-rose-500"
                      : "border-slate-200 hover:border-slate-400 dark:border-slate-700"
                  }`}
                >
                  <span
                    className={`text-xs font-bold ${
                      isSelected
                        ? "text-rose-600"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {dayDate.getDate()}
                  </span>

                  {/* Status Dots */}
                  <div className="flex gap-1">
                    {slotsForDay.map((slot) => (
                      <span
                        key={slot.id}
                        className={`w-2.5 h-2.5 rounded-full ${
                          slot.status?.toUpperCase() === "AVAILABLE"
                            ? "bg-emerald-500"
                            : slot.status?.toUpperCase() === "PENDING"
                              ? "bg-amber-500"
                              : slot.status?.toUpperCase() === "BOOKED"
                                ? "bg-blue-500"
                                : "bg-slate-400"
                        }`}
                        title={`${slot.status}: ${to12h(slot.startTime)}-${to12h(slot.endTime)}`}
                      ></span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day slot Details side panel (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between dark:bg-slate-800 dark:border-slate-700">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 dark:border-slate-700">
              <h3 className="font-bold text-slate-850 dark:text-white text-base">
                {selectedDate ? `Slots for ${selectedDate}` : "Next 7 Days"}
              </h3>
              <span className="text-xs text-slate-400">
                {selectedDate
                  ? "Manage calendar times for this day"
                  : "Upcoming slots overview"}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
              {!selectedDate ? (
                // Next 7 Days Summary View
                selectedVenueSlots
                  .filter((s) => {
                    const d = new Date(s.date);
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    const limit = new Date(
                      now.getTime() + 7 * 24 * 60 * 60 * 1000,
                    );
                    return d >= now && d <= limit;
                  })
                  .sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime(),
                  )
                  .map((slot) => (
                    <div
                      key={slot.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl dark:bg-slate-900 dark:border-slate-700"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold">{slot.date}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            slot.status?.toUpperCase() === "AVAILABLE"
                              ? "bg-emerald-500"
                              : slot.status?.toUpperCase() === "PENDING"
                                ? "bg-amber-500"
                                : slot.status?.toUpperCase() === "BOOKED"
                                  ? "bg-blue-500"
                                  : "bg-slate-400"
                          }`}
                        />
                      </div>
                      <div className="text-xs text-slate-550 dark:text-slate-400">
                        {to12h(slot.startTime)} - {to12h(slot.endTime)} • ₹
                        {slot.budget}
                      </div>
                    </div>
                  ))
              ) : selectedDaySlots.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <CalendarIcon className="w-8 h-8 text-slate-300" />
                  <span>No bookable slots on this day.</span>
                </div>
              ) : (
                selectedDaySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2 dark:bg-slate-900 dark:border-slate-700"
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          slot.status?.toUpperCase() === "AVAILABLE"
                            ? "bg-emerald-100 text-emerald-800"
                            : slot.status?.toUpperCase() === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : slot.status?.toUpperCase() === "BOOKED"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {slot.status}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-white">
                        ₹{slot.budget} budget
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 font-medium dark:text-slate-400">
                      {to12h(slot.startTime)} - {to12h(slot.endTime)}
                    </div>

                    <div className="flex justify-end gap-1.5 mt-2">
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteSlot(slot.id)}
                        disabled={slot.status?.toUpperCase() === "BOOKED"}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 text-xs font-semibold px-2 py-1 rounded transition cursor-pointer h-7"
                      >
                        Delete slot
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button
              onClick={() => setShowAddSlotModal(true)}
              className="w-full bg-slate-900 text-white font-bold py-6 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              Add Slot to Selected Date
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showAddSlotModal} onOpenChange={setShowAddSlotModal}>
        <DialogContent
          className="max-w-sm w-full p-6 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-750 rounded-3xl"
          showCloseButton={true}
        >
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-left">
              Add Slot: {selectedDate}
            </DialogTitle>
          </DialogHeader>

          {showAddSlotModal && (
            <form onSubmit={handleCreateSlot} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newSlotData.startTime}
                    onChange={(e) =>
                      setNewSlotData({
                        ...newSlotData,
                        startTime: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={newSlotData.endTime}
                    onChange={(e) =>
                      setNewSlotData({
                        ...newSlotData,
                        endTime: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Gig Budget Offered (₹)
                </label>
                <input
                  type="number"
                  required
                  value={newSlotData.budget}
                  onChange={(e) =>
                    setNewSlotData({
                      ...newSlotData,
                      budget: Number(e.target.value),
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-350 bg-white text-slate-850 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Initial Status
                </label>
                <select
                  value={newSlotData.status}
                  onChange={(e) =>
                    setNewSlotData({ ...newSlotData, status: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-350 bg-white text-slate-850 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                >
                  <option value="AVAILABLE">Available for booking</option>
                  <option value="BLOCKED">Blocked / Unavailable</option>
                </select>
              </div>

              <Button
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-6 rounded-xl transition mt-2 text-sm shadow cursor-pointer"
              >
                Save Slot
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

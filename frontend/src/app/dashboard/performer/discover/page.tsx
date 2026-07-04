'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import {
  setSearchFilters,
  requestBookingThunk,
  loadPerformerDataThunk,
} from '@/lib/store/performerSlice';
import { Search, MapPin, Calendar as CalendarIcon, Mic, Info, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageSlideshow } from '@/components/ImageSlideshow';
import { to12h } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function PerformerDiscover() {
  const dispatch = useAppDispatch();
  const { user, performer, slotsList, searchFilters } = useAppSelector(
    (state) => state.performer
  );

  // Grouped venue dialog state
  const [selectedVenueSlots, setSelectedVenueSlots] = useState<any | null>(null); // { venue, slots[] }
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !performer) return;
    dispatch(
      loadPerformerDataThunk({
        userId: user.id,
        performerId: performer.id,
        performerState: searchFilters.state,
        performerCity: searchFilters.city,
      })
    );
  };

  const handleBookSelected = async () => {
    if (!performer || selectedSlotIds.length === 0) return;

    let succeeded = 0;
    for (const slotId of selectedSlotIds) {
      const slot = selectedVenueSlots.slots.find((s: any) => s.id === slotId);
      if (!slot) continue;

      try {
        const res = await dispatch(
          requestBookingThunk({
            slotId,
            performerId: performer.id,
            venueId: slot.venueId || selectedVenueSlots.venue.id,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            budget: slot.budget,
          })
        );
        if (res.meta.requestStatus === 'fulfilled') succeeded++;
      } catch (err) {
        // continue
      }
    }

    if (succeeded === selectedSlotIds.length) {
      toast.success(`${succeeded} slot request(s) sent successfully!`);
    } else if (succeeded > 0) {
      toast.warning(`${succeeded}/${selectedSlotIds.length} requests sent. Some may have failed.`);
    } else {
      toast.error('Failed to send slot requests.');
    }

    setSelectedVenueSlots(null);
    setSelectedSlotIds([]);

    // Reload lists
    dispatch(
      loadPerformerDataThunk({
        userId: user.id,
        performerId: performer.id,
        performerState: performer.state,
        performerCity: performer.city,
      })
    );
  };

  // Group slots by venueId
  const venueMap = new Map<string, { venue: any; slots: any[] }>();
  slotsList.forEach((slot: any) => {
    const vid = slot.venueId ?? slot.venue?.id;
    if (!vid) return;
    if (!venueMap.has(vid)) {
      venueMap.set(vid, { venue: slot.venue, slots: [] });
    }
    venueMap.get(vid)!.slots.push(slot);
  });
  const venueGroups = Array.from(venueMap.values());

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Discover Available Slots</h1>
        <p className="text-slate-500 mt-1 dark:text-slate-400">
          Scan open venue slots, filter by capacity and gear, and apply to perform.
        </p>
      </div>

      {/* Filter Bar */}
      <form
        onSubmit={handleSearch}
        className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm dark:bg-slate-800 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs font-semibold"
      >
        <div>
          <label className="block text-slate-400 mb-1">STATE</label>
          <select
            value={searchFilters.state}
            onChange={(e) =>
              dispatch(
                setSearchFilters({
                  state: e.target.value,
                  city: 'All',
                })
              )
            }
            className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none dark:bg-slate-900 dark:border-slate-700 text-sm"
          >
            <option value="All">All States</option>
            <option value="Punjab">Punjab</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Maharashtra">Maharashtra</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1">CITY</label>
          <select
            value={searchFilters.city}
            onChange={(e) => dispatch(setSearchFilters({ city: e.target.value }))}
            disabled={searchFilters.state === 'All'}
            className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none dark:bg-slate-900 dark:border-slate-700 text-sm"
          >
            <option value="All">All Cities</option>
            {searchFilters.state === 'Punjab' && <option value="Chandigarh">Chandigarh</option>}
            {searchFilters.state === 'Karnataka' && <option value="Bengaluru">Bengaluru</option>}
            {searchFilters.state === 'Maharashtra' && <option value="Mumbai">Mumbai</option>}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1">VENUE TYPE</label>
          <select
            value={searchFilters.type}
            onChange={(e) => dispatch(setSearchFilters({ type: e.target.value }))}
            className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none dark:bg-slate-900 dark:border-slate-700 text-sm"
          >
            <option value="All">All Types</option>
            {['Café', 'Restaurant', 'Hotel', 'Club', 'Brewery', 'Resort', 'Banquet Hall'].map(
              (v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1">
            BUDGET UP TO (₹{searchFilters.budget || 'Any'})
          </label>
          <input
            type="number"
            value={searchFilters.budget}
            onChange={(e) => dispatch(setSearchFilters({ budget: e.target.value }))}
            placeholder="Min Budget Offer"
            className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none dark:bg-slate-900 dark:border-slate-700 text-sm bg-white dark:text-white"
          />
        </div>

        <div className="flex items-end">
          <Button
            type="submit"
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-6 rounded-xl transition shadow cursor-pointer text-sm h-11"
          >
            Filter Slots
          </Button>
        </div>
      </form>

      {/* Venues Grid */}
      {(() => {
        if (venueGroups.length === 0) {
          return (
            <div className="py-16 bg-white border border-slate-200 rounded-3xl text-center text-slate-500 dark:bg-slate-800 dark:border-slate-700 text-sm">
              No available slots found. Try adjusting your filters.
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {venueGroups.map(({ venue, slots }) => {
              const minPayout = Math.min(...slots.map((s: any) => s.budget));
              const maxPayout = Math.max(...slots.map((s: any) => s.budget));
              const availableCount = slots.filter(
                (s: any) => s.status?.toUpperCase() === 'AVAILABLE'
              ).length;
              const pendingCount = slots.filter(
                (s: any) => s.status?.toUpperCase() === 'PENDING'
              ).length;

              return (
                <div
                  key={venue?.id ?? slots[0]?.venueId}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between dark:bg-slate-800 dark:border-slate-700 group"
                >
                  <div className="relative h-44 bg-slate-100 dark:bg-slate-900">
                    <img
                      src={
                        venue?.imageUrl ||
                        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800'
                      }
                      alt={venue?.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-extrabold shadow">
                      {minPayout === maxPayout
                        ? `₹${minPayout}`
                        : `₹${minPayout}–₹${maxPayout}`}{' '}
                      Payout
                    </span>
                    <span className="absolute bottom-4 left-4 bg-white/90 backdrop-blur text-slate-900 text-[11px] font-bold px-3 py-1.5 rounded-full shadow flex items-center gap-1.5 dark:bg-slate-900/90 dark:text-white">
                      <CalendarIcon className="w-3.5 h-3.5 text-rose-500" />
                      {slots.length} slot{slots.length !== 1 ? 's' : ''} open
                    </span>
                  </div>

                  <div className="p-5 flex-1 space-y-3 text-xs font-semibold text-slate-550 dark:text-slate-350">
                    <div>
                      <span className="text-[10px] text-rose-500 font-bold block mb-0.5">
                        {venue?.type}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                        {venue?.name}
                      </h3>
                      {venue?.hasVoiceAssistant && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-955/30 dark:text-indigo-400 dark:border-indigo-900/50">
                          <Mic className="w-2.5 h-2.5" /> AI Receptionist Active
                        </span>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1 flex flex-wrap items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span>{venue?.address}</span>
                      </p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {availableCount > 0 && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 text-[10px] font-bold px-2.5 py-1 rounded-full dark:bg-emerald-955/20 dark:text-emerald-400 dark:border-emerald-900">
                          {availableCount} Available
                        </span>
                      )}
                      {pendingCount > 0 && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-full dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900">
                          {pendingCount} Pending
                        </span>
                      )}
                    </div>

                    <p className="font-medium text-slate-500 leading-relaxed line-clamp-2 dark:text-slate-400">
                      {venue?.description}
                    </p>
                  </div>

                  <div className="p-5 border-t border-slate-100 dark:border-slate-700">
                    <Button
                      onClick={() => {
                        setSelectedVenueSlots({ venue, slots });
                        setSelectedSlotIds([]);
                      }}
                      className="w-full bg-slate-900 text-white font-bold py-6 rounded-xl hover:bg-slate-800 transition text-xs cursor-pointer"
                    >
                      View {slots.length} Slot{slots.length !== 1 ? 's' : ''} & Apply
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* VENUE + SLOTS DIALOG (grouped, checkbox-based) */}
      <Dialog
        open={!!selectedVenueSlots}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedVenueSlots(null);
            setSelectedSlotIds([]);
          }
        }}
      >
        <DialogContent
          className="max-w-xl w-full max-h-[90vh] overflow-y-auto p-8 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-750 rounded-3xl"
          showCloseButton={true}
        >
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold text-left">
              Venue details &amp; Gig Offers
            </DialogTitle>
          </DialogHeader>

          {selectedVenueSlots && (
            <div className="space-y-6 text-sm">
              <div className="relative rounded-2xl overflow-hidden bg-slate-955 h-64">
                <ImageSlideshow
                  images={[
                    selectedVenueSlots.venue?.imageUrl,
                    ...(selectedVenueSlots.venue?.photos || []),
                  ].filter(Boolean)}
                />
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 block mb-0.5">
                  {selectedVenueSlots.venue?.type}
                </span>
                <h4 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {selectedVenueSlots.venue?.name}
                </h4>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {selectedVenueSlots.venue?.address}
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">
                  About the Venue
                </span>
                <p className="text-slate-600 dark:text-slate-350 leading-relaxed text-xs">
                  {selectedVenueSlots.venue?.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 text-xs border-y border-slate-105 py-4 dark:border-slate-700">
                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-1.5">
                    Policies &amp; Guidelines
                  </span>
                  <ul className="space-y-1 text-slate-650 dark:text-slate-300 font-medium">
                    {selectedVenueSlots.venue?.policies?.map((p: string, i: number) => (
                      <li key={i} className="flex items-start gap-1">
                        <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-1.5">
                    Technical Gear Provided
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedVenueSlots.venue?.equipment?.map((eq: string) => (
                      <span
                        key={eq}
                        className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold dark:bg-slate-700 dark:text-slate-305"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Slot checkbox list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Select Slots to Apply
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const available = selectedVenueSlots.slots.filter(
                        (s: any) => s.status?.toUpperCase() === 'AVAILABLE'
                      );
                      setSelectedSlotIds(
                        selectedSlotIds.length === available.length
                          ? []
                          : available.map((s: any) => s.id)
                      );
                    }}
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-600 underline cursor-pointer"
                  >
                    {selectedSlotIds.length ===
                    selectedVenueSlots.slots.filter(
                      (s: any) => s.status?.toUpperCase() === 'AVAILABLE'
                    ).length
                      ? 'Deselect all'
                      : 'Select all available'}
                  </button>
                </div>

                <div className="space-y-2">
                  {[...selectedVenueSlots.slots]
                    .sort((a: any, b: any) => {
                      const da = a.date + 'T' + a.startTime;
                      const db = b.date + 'T' + b.startTime;
                      return da < db ? -1 : da > db ? 1 : 0;
                    })
                    .map((slot: any) => {
                      const isAvailable = slot.status?.toUpperCase() === 'AVAILABLE';
                      const isChecked = selectedSlotIds.includes(slot.id);
                      return (
                        <label
                          key={slot.id}
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            !isAvailable
                              ? 'opacity-50 cursor-not-allowed border-slate-150 bg-slate-50 dark:bg-slate-900 dark:border-slate-750'
                              : isChecked
                              ? 'border-rose-400 bg-rose-50 dark:bg-rose-955/20 dark:border-rose-700'
                              : 'border-slate-200 bg-white hover:border-rose-300 dark:bg-slate-850 dark:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={!isAvailable}
                            checked={isChecked}
                            onChange={() => {
                              if (!isAvailable) return;
                              setSelectedSlotIds((prev) =>
                                prev.includes(slot.id)
                                  ? prev.filter((id) => id !== slot.id)
                                  : [...prev, slot.id]
                              );
                            }}
                            className="accent-rose-500 w-4 h-4 flex-shrink-0 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800 dark:text-white font-sans">
                                {slot.date} &nbsp;·&nbsp; {to12h(slot.startTime)} – {to12h(slot.endTime)}
                              </span>
                              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                                ₹{slot.budget}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold mt-0.5 block ${
                                slot.status?.toUpperCase() === 'AVAILABLE'
                                  ? 'text-emerald-500'
                                  : slot.status?.toUpperCase() === 'PENDING'
                                  ? 'text-amber-500'
                                  : 'text-slate-400'
                              }`}
                            >
                              {slot.status}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Book button */}
              <Button
                disabled={selectedSlotIds.length === 0}
                onClick={handleBookSelected}
                className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-6 rounded-xl shadow transition text-sm flex items-center justify-center gap-2 cursor-pointer h-12"
              >
                <Check className="w-4 h-4" />
                {selectedSlotIds.length === 0
                  ? 'Select at least one slot'
                  : `Request ${selectedSlotIds.length} Slot${selectedSlotIds.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

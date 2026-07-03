'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import { setActivePerformerId } from '@/lib/store/organizationSlice';
import { Search, Send, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageSlideshow } from '@/components/ImageSlideshow';

export default function OrganizationDiscover() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, performersList } = useAppSelector((state) => state.organization);

  // Filters
  const [performerSearchQuery, setPerformerSearchQuery] = useState('');
  const [performerGenreFilter, setPerformerGenreFilter] = useState('All');
  const [performerStateFilter, setPerformerStateFilter] = useState('All');
  const [performerCityFilter, setPerformerCityFilter] = useState('All');
  const [performerMaxRate, setPerformerMaxRate] = useState(10000);

  // Detail Modal
  const [performerDetailsModal, setPerformerDetailsModal] = useState<any | null>(null);

  const startChat = (perf: any) => {
    if (!user) return;
    dispatch(setActivePerformerId(perf.id));
    router.push('/dashboard/organization/messages');
  };

  const filteredPerformers = performersList.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(performerSearchQuery.toLowerCase()) ||
      (p.biography && p.biography.toLowerCase().includes(performerSearchQuery.toLowerCase()));
    const matchGenre = performerGenreFilter === 'All' || p.genres.includes(performerGenreFilter);
    const matchRate = p.pricing <= performerMaxRate;
    const matchState = performerStateFilter === 'All' || p.state === performerStateFilter;
    const matchCity = performerCityFilter === 'All' || p.city === performerCityFilter;
    return matchSearch && matchGenre && matchRate && matchState && matchCity;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Find Performers</h1>
        <p className="text-slate-500 mt-1 dark:text-slate-400">
          Discover and invite artists for your upcoming gigs.
        </p>
      </div>

      {/* Discover Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or biography..."
            value={performerSearchQuery}
            onChange={(e) => setPerformerSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
          />
        </div>
        <div className="w-full md:w-48">
          <select
            value={performerGenreFilter}
            onChange={(e) => setPerformerGenreFilter(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
          >
            <option value="All">All Genres</option>
            <option value="Acoustic">Acoustic</option>
            <option value="Jazz">Jazz</option>
            <option value="Rock">Rock</option>
            <option value="Pop">Pop</option>
            <option value="Classical">Classical</option>
            <option value="Electronic">Electronic</option>
          </select>
        </div>
        <div className="w-full md:w-48">
          <select
            value={performerStateFilter}
            onChange={(e) => {
              setPerformerStateFilter(e.target.value);
              setPerformerCityFilter('All');
            }}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
          >
            <option value="All">All States</option>
            <option value="Punjab">Punjab</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Maharashtra">Maharashtra</option>
          </select>
        </div>
        <div className="w-full md:w-48">
          <select
            value={performerCityFilter}
            onChange={(e) => setPerformerCityFilter(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            disabled={performerStateFilter === 'All'}
          >
            <option value="All">All Cities</option>
            {performerStateFilter === 'Punjab' && <option value="Chandigarh">Chandigarh</option>}
            {performerStateFilter === 'Karnataka' && <option value="Bengaluru">Bengaluru</option>}
            {performerStateFilter === 'Maharashtra' && <option value="Mumbai">Mumbai</option>}
          </select>
        </div>
        <div className="w-full md:w-48 flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
          <span className="text-xs font-semibold text-slate-505 dark:text-slate-400 w-16">
            Max: ₹{performerMaxRate}
          </span>
          <input
            type="range"
            min="500"
            max="10000"
            step="500"
            value={performerMaxRate}
            onChange={(e) => setPerformerMaxRate(Number(e.target.value))}
            className="flex-1 accent-rose-500"
          />
        </div>
      </div>

      {/* Performers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredPerformers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-550 dark:text-slate-400">
            No performers match your search filters.
          </div>
        ) : (
          filteredPerformers.map((perf) => (
            <div
              key={perf.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between group dark:bg-slate-800 dark:border-slate-700"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={perf.imageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800'}
                  alt={perf.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl font-bold truncate">{perf.name}</h3>
                  <p className="text-xs text-white/80 truncate mt-1 flex justify-between items-center">
                    <span>{perf.genres.join(', ')}</span>
                    {perf.city && perf.state && (
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {perf.city}, {perf.state}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                  {perf.biography || 'No biography provided.'}
                </p>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500">Rate</span>
                  <span className="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                    ₹{perf.pricing}/hr
                  </span>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setPerformerDetailsModal(perf)}
                  className="w-full rounded-xl text-xs font-semibold cursor-pointer h-9"
                >
                  View Bio
                </Button>
                <Button
                  onClick={() => startChat(perf)}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold cursor-pointer h-9 px-0"
                >
                  <Send className="w-3.5 h-3.5 mr-1" /> Invite
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PERFORMER PORTFOLIO VIEW MODAL */}
      <Dialog
        open={!!performerDetailsModal}
        onOpenChange={(open) => {
          if (!open) setPerformerDetailsModal(null);
        }}
      >
        <DialogContent
          className="max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-750 rounded-3xl"
          showCloseButton={true}
        >
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold text-left">Artist Portfolio</DialogTitle>
          </DialogHeader>

          {performerDetailsModal && (
            <div className="space-y-6 text-sm">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 h-64">
                <ImageSlideshow
                  images={[
                    performerDetailsModal.imageUrl,
                    ...(performerDetailsModal.photos || []),
                  ].filter(Boolean)}
                />
              </div>

              <div>
                <h4 className="text-xl font-extrabold">{performerDetailsModal.name}</h4>
                <p className="text-sm text-rose-500 font-bold mt-0.5">
                  ₹{performerDetailsModal.pricing} / Gig rate
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Biography
                </span>
                <p className="text-slate-600 dark:text-slate-350 leading-relaxed text-xs">
                  {performerDetailsModal.biography}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                    Genres
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(performerDetailsModal.genres)
                      ? performerDetailsModal.genres
                      : [performerDetailsModal.genres]
                    ).map((g: string) => (
                      <span
                        key={g}
                        className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded font-semibold dark:bg-rose-950/20 dark:text-rose-400"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                    Experience
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {performerDetailsModal.experience}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                    Languages
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {Array.isArray(performerDetailsModal.languages)
                      ? performerDetailsModal.languages.join(', ')
                      : performerDetailsModal.languages}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                    Travel Radius
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {performerDetailsModal.travelRadius} miles max
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                  Technical Gear Requested
                </span>
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(performerDetailsModal.equipmentNeeded)
                    ? performerDetailsModal.equipmentNeeded
                    : [performerDetailsModal.equipmentNeeded]
                  ).map((eq: string) => (
                    <span
                      key={eq}
                      className="bg-slate-100 text-slate-650 px-2.5 py-0.5 rounded text-[10px] font-semibold dark:bg-slate-700 dark:text-slate-300"
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

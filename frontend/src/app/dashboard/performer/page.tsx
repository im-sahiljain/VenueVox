'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import { setActiveVenueId } from '@/lib/store/performerSlice';
import { Briefcase, Compass, Star, MapPin, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { to12h } from '@/lib/utils';

export default function PerformerOverview() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { performer, bookingsList, slotsList, reviewsList } = useAppSelector(
    (state) => state.performer
  );

  const confirmedBookings = bookingsList.filter(
    (b) => b.status?.toUpperCase() === 'CONFIRMED'
  );

  const startChat = (venue: any) => {
    dispatch(setActiveVenueId(venue.id));
    router.push('/dashboard/performer/messages');
  };

  const averageRating =
    reviewsList.length > 0
      ? (reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length).toFixed(1)
      : 'N/A';

  return (
    <div className="space-y-8 animate-fade-in text-slate-800 dark:text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome, {performer?.name || 'Artist'}
          </h1>
          <p className="text-slate-500 mt-1 dark:text-slate-400">
            Here is a quick look at your profile completion and gig calendar.
          </p>
        </div>

        {/* Portfolio completes status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-slate-800 dark:border-slate-700">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-bold">Portfolio Completion</span>
            <span className="text-sm font-extrabold text-rose-500">
              {performer?.completionPercentage || 0}% Completed
            </span>
          </div>
          <div className="w-16 bg-slate-100 h-2.5 rounded-full overflow-hidden dark:bg-slate-900">
            <div
              className="bg-rose-500 h-full"
              style={{ width: `${performer?.completionPercentage || 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <Briefcase className="w-8 h-8 text-rose-500 mb-4" />
          <h3 className="text-2xl font-bold">{confirmedBookings.length}</h3>
          <span className="text-slate-550 text-xs dark:text-slate-400">Confirmed Gigs Scheduled</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <Compass className="w-8 h-8 text-emerald-500 mb-4" />
          <h3 className="text-2xl font-bold">{slotsList.length}</h3>
          <span className="text-slate-550 text-xs dark:text-slate-400">Open booking slots available now</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <Star className="w-8 h-8 text-amber-500 mb-4" />
          <h3 className="text-2xl font-bold">{averageRating}</h3>
          <span className="text-slate-550 text-xs dark:text-slate-400">
            Average gig rating ({reviewsList.length} reviews)
          </span>
        </div>
      </div>

      {/* Scheduled Confirmed Gigs */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-700">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Your Upcoming Gig Calendar</h3>
          <Button
            variant="link"
            onClick={() => router.push('/dashboard/performer/bookings')}
            className="text-rose-500 font-semibold text-xs flex items-center gap-1 hover:underline h-auto p-0 cursor-pointer"
          >
            View Gig Log <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {confirmedBookings.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm dark:text-slate-400">
              No confirmed gigs on your calendar yet. Use Discover to request slots.
            </div>
          ) : (
            confirmedBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{booking.venue?.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" /> {booking.venue?.address}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    Date: {booking.date} | Time: {to12h(booking.startTime)} – {to12h(booking.endTime)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 dark:bg-emerald-950/20 dark:text-emerald-405">
                    Payout: ₹{booking.budget}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => startChat(booking.venue)}
                    className="rounded-xl text-xs font-semibold cursor-pointer h-9 px-4"
                  >
                    Message Host
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

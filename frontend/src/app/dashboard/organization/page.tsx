'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import {
  approveBookingThunk,
  rejectBookingThunk,
  OrganizationState,
} from '@/lib/store/organizationSlice';
import {
  Building,
  Calendar as CalendarIcon,
  Briefcase,
  Check,
  X,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import {
  RevenueChart,
  TopPerformerCard,
  OccupancyHeatmap,
  BookingFunnel,
} from '@/components/Analytics';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageSlideshow } from '@/components/ImageSlideshow';
import { to12h } from '@/lib/utils';

export default function OrganizationOverview() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Selector
  const { user, venuesList, slotsList, bookingsList } = useAppSelector(
    (state: any) => state.organization as OrganizationState
  );

  const [performerDetailsModal, setPerformerDetailsModal] = useState<any | null>(null);

  const handleApproveBooking = (id: string) => {
    dispatch(approveBookingThunk(id));
  };

  const handleRejectBooking = (id: string) => {
    dispatch(rejectBookingThunk(id));
  };

  const pendingBookings = bookingsList.filter(
    (b) => b.status?.toUpperCase() === 'PENDING'
  );
  const availableSlotsCount = slotsList.filter(
    (s) => s.status?.toUpperCase() === 'AVAILABLE'
  ).length;
  const confirmedBookingsCount = bookingsList.filter(
    (b) => b.status?.toUpperCase() === 'CONFIRMED'
  ).length;

  return (
    <div className="space-y-8 animate-fade-in text-slate-800 dark:text-slate-100">
      <OnboardingChecklist
        venuesCount={venuesList.length}
        slotsCount={slotsList.length}
        hasProfileImage={false}
      />

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Welcome, {user?.name}
        </h1>
        <p className="text-slate-500 mt-1 dark:text-slate-400">
          Here is a quick glance at your hospitality booking metrics.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <Building className="w-8 h-8 text-rose-500 mb-4" />
          <h3 className="text-2xl font-bold">{venuesList.length}</h3>
          <span className="text-slate-500 text-xs dark:text-slate-400">
            Active Venues managed
          </span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <CalendarIcon className="w-8 h-8 text-emerald-500 mb-4" />
          <h3 className="text-2xl font-bold">{availableSlotsCount}</h3>
          <span className="text-slate-500 text-xs dark:text-slate-400">
            Open slots listed
          </span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <Briefcase className="w-8 h-8 text-amber-500 mb-4" />
          <h3 className="text-2xl font-bold">{pendingBookings.length}</h3>
          <span className="text-slate-500 text-xs dark:text-slate-400">
            Pending gig requests
          </span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <Check className="w-8 h-8 text-blue-500 mb-4" />
          <h3 className="text-2xl font-bold">{confirmedBookingsCount}</h3>
          <span className="text-slate-500 text-xs dark:text-slate-400">
            Confirmed upcoming events
          </span>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart bookings={bookingsList} />
        </div>
        <div className="flex flex-col gap-6">
          <TopPerformerCard performers={[]} />
          <OccupancyHeatmap slots={slotsList} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <BookingFunnel />
        </div>

        {/* Recent Booking Requests */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-700">
            <h3 className="font-bold text-lg">Active Gig Requests</h3>
            <Button
              variant="link"
              onClick={() => router.push('/dashboard/organization/bookings')}
              className="text-rose-500 font-semibold text-xs flex items-center gap-1 hover:underline h-auto p-0 cursor-pointer"
            >
              View Bookings Panel <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {pendingBookings.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm dark:text-slate-400">
                No pending gig requests at this time.
              </div>
            ) : (
              pendingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      {booking.performer?.name || 'Performer'} at {booking.venue?.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                      Date: {booking.date} | Time: {to12h(booking.startTime)} -{' '}
                      {to12h(booking.endTime)} | Offer: ₹{booking.budget}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApproveBooking(booking.id)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold cursor-pointer h-9 px-4"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </Button>
                    <Button
                      onClick={() => handleRejectBooking(booking.id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold cursor-pointer h-9 px-4 border border-rose-200 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 dark:border-rose-900/50"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setPerformerDetailsModal(booking.performer)}
                      className="rounded-xl text-xs font-semibold cursor-pointer h-9 px-4"
                    >
                      View Bio
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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
            <DialogTitle className="text-xl font-bold text-left">
              Artist Portfolio
            </DialogTitle>
          </DialogHeader>

          {performerDetailsModal && (
            <div className="space-y-6 text-sm">
              {/* Slideshow */}
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
                      className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded text-[10px] font-semibold dark:bg-slate-700 dark:text-slate-300"
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

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import {
  approveBookingThunk,
  rejectBookingThunk,
  loadAllDataThunk,
  setActivePerformerId,
  OrganizationState,
} from '@/lib/store/organizationSlice';
import {
  Check,
  X,
  Star,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BookingTimeline } from '@/components/BookingTimeline';
import { ImageSlideshow } from '@/components/ImageSlideshow';
import { api } from '@/lib/api';
import { toLocalISOString, to12h } from '@/lib/utils';
import { toast } from 'sonner';

export default function OrganizationBookings() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Selector
  const { user, venuesList, bookingsList, reviewsList } = useAppSelector(
    (state: any) => state.organization as OrganizationState
  );

  // Filters & Modal States
  const [bookingStatusFilter, setBookingStatusFilter] = useState('All');
  const [bookingSort, setBookingSort] = useState('dateAsc');
  const [performerDetailsModal, setPerformerDetailsModal] = useState<any | null>(null);
  const [showAddReviewModal, setShowAddReviewModal] = useState<any | null>(null);

  // Review inputs
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const handleApproveBooking = (id: string) => {
    dispatch(approveBookingThunk(id));
  };

  const handleRejectBooking = (id: string) => {
    dispatch(rejectBookingThunk(id));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !showAddReviewModal) return;

    try {
      const data = {
        bookingId: showAddReviewModal.id,
        reviewerId: user.id,
        revieweeId: showAddReviewModal.performerId,
        rating: reviewRating,
        comment: reviewComment,
      };

      const res = await api.createReview(data);
      if (res.success) {
        toast.success('Review submitted successfully!');
        setShowAddReviewModal(null);
        setReviewRating(5);
        setReviewComment('');
        // Reload all data to refresh lists
        const queryOrgId = user.isManager ? user.parentOrgId : user.id;
        dispatch(loadAllDataThunk({ loggedUser: user, queryOrgId }));
      }
    } catch (err: any) {
      toast.error('Failed to submit review: ' + err.message);
    }
  };

  const startChat = (performer: any) => {
    if (!user) return;
    dispatch(setActivePerformerId(performer.id));
    router.push('/dashboard/organization/messages');
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Performers Bookings</h1>
        <p className="text-slate-500 mt-1 dark:text-slate-400">
          Manage scheduled performer gigs and review incoming requests.
        </p>
      </div>

      <BookingTimeline
        bookings={bookingsList}
        venues={venuesList}
        viewType="organization"
      />

      {/* Earnings Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-500 rounded-3xl p-6 text-white shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-emerald-100 font-semibold mb-1">Total Payouts</h3>
            <div className="text-4xl font-black">₹45,000</div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm font-semibold">
            <span>This Month</span>
            <span className="bg-white/20 px-2 py-1 rounded-lg">+12%</span>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between dark:bg-slate-800 dark:border-slate-700">
          <h3 className="text-slate-500 font-semibold mb-1">Pending Budget</h3>
          <div className="text-4xl font-black text-slate-800 dark:text-white">₹12,500</div>
          <div className="mt-4 text-sm font-semibold text-slate-550 dark:text-slate-405">
            Across {bookingsList.filter((b) => b.status === 'PENDING').length} pending gigs
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between dark:bg-slate-800 dark:border-slate-700">
          <h3 className="text-slate-500 font-semibold mb-1">Completed Gigs</h3>
          <div className="text-4xl font-black text-slate-800 dark:text-white">
            {bookingsList.filter((b) => b.status === 'CONFIRMED' && b.date < toLocalISOString(new Date())).length || 24}
          </div>
          <div className="mt-4 text-sm font-semibold text-emerald-500">98% positive reviews</div>
        </div>
      </div>

      {/* Filter and Sort Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="flex-1 flex gap-4">
          <select
            className="w-full md:w-48 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            value={bookingStatusFilter}
            onChange={(e) => setBookingStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select
            className="w-full md:w-48 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            value={bookingSort}
            onChange={(e) => setBookingSort(e.target.value)}
          >
            <option value="dateAsc">Date (Earliest First)</option>
            <option value="dateDesc">Date (Latest First)</option>
          </select>
        </div>
      </div>

      {/* List Bookings */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {bookingsList.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm dark:text-slate-400">
              No bookings or gig logs found.
            </div>
          ) : (
            bookingsList
              .filter(
                (b) =>
                  bookingStatusFilter === 'All' ||
                  b.status?.toUpperCase() === bookingStatusFilter.toUpperCase()
              )
              .sort((a, b) => {
                if (bookingSort === 'dateAsc')
                  return new Date(a.date).getTime() - new Date(b.date).getTime();
                if (bookingSort === 'dateDesc')
                  return new Date(b.date).getTime() - new Date(a.date).getTime();
                return 0;
              })
              .map((booking) => {
                const todayStr = toLocalISOString(new Date());
                const isPast =
                  booking.date <= todayStr && booking.status?.toUpperCase() === 'CONFIRMED';
                const hasOrgReview = reviewsList.some(
                  (r) => r.bookingId === booking.id && r.reviewerId === user?.id
                );

                return (
                  <div
                    key={booking.id}
                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-slate-900 dark:text-white text-base">
                            {booking.performer?.name || 'Performer Profile'}
                          </h4>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              booking.status?.toUpperCase() === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : booking.status?.toUpperCase() === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : booking.status?.toUpperCase() === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-200'
                            }`}
                          >
                            {booking.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                          Venue:{' '}
                          <strong className="text-slate-850 dark:text-white">
                            {booking.venue?.name}
                          </strong>{' '}
                          | Date: {booking.date} | Time: {to12h(booking.startTime)} -{' '}
                          {to12h(booking.endTime)}
                        </p>
                        <span className="inline-block mt-2 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full dark:bg-emerald-950/20 dark:text-emerald-400">
                          Offer: ₹{booking.budget}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {booking.status?.toUpperCase() === 'PENDING' && (
                        <>
                          <Button
                            onClick={() => handleApproveBooking(booking.id)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold cursor-pointer h-9 px-3.5"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </Button>
                          <Button
                            onClick={() => handleRejectBooking(booking.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold cursor-pointer h-9 px-3.5 border border-rose-200 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 dark:border-rose-900/50"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </Button>
                        </>
                      )}

                      {isPast && !hasOrgReview && (
                        <Button
                          onClick={() => setShowAddReviewModal(booking)}
                          className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold cursor-pointer h-9 px-3.5"
                        >
                          <Star className="w-3.5 h-3.5" /> Review Artist
                        </Button>
                      )}
                      {isPast && hasOrgReview && (
                        <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                          Already Reviewed
                        </span>
                      )}

                      <Button
                        variant="secondary"
                        onClick={() => startChat(booking.performer)}
                        className="rounded-xl text-xs font-semibold cursor-pointer h-9 px-3.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Chat
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={() => setPerformerDetailsModal(booking.performer)}
                        className="rounded-xl text-xs font-semibold cursor-pointer h-9 px-3.5"
                      >
                        Portfolio
                      </Button>
                    </div>
                  </div>
                );
              })
          )}
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

      {/* LEAVE REVIEW MODAL */}
      <Dialog
        open={!!showAddReviewModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddReviewModal(null);
            setReviewRating(5);
            setReviewComment('');
          }
        }}
      >
        <DialogContent
          className="max-w-sm w-full p-6 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-750 rounded-3xl"
          showCloseButton={true}
        >
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-left">Review Artist</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold mb-1.5">Rating (1 to 5 Stars)</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setReviewRating(starVal)}
                    className="p-1 hover:scale-110 transition cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        starVal <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1.5">Feedback / Comments</label>
              <textarea
                rows={4}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Tell other hosts how this performer did..."
                className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-6 rounded-xl transition mt-2 text-sm shadow cursor-pointer"
            >
              Submit Review
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

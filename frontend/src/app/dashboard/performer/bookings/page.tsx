'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import { setActiveVenueId, loadPerformerDataThunk } from '@/lib/store/performerSlice';
import { MessageSquare, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BookingTimeline } from '@/components/BookingTimeline';
import { api } from '@/lib/api';
import { toLocalISOString, to12h } from '@/lib/utils';
import { toast } from 'sonner';

export default function PerformerBookings() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, performer, bookingsList, reviewsList } = useAppSelector(
    (state) => state.performer
  );

  // Review modal state
  const [showAddReviewModal, setShowAddReviewModal] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const startChat = (venue: any) => {
    dispatch(setActiveVenueId(venue.id));
    router.push('/dashboard/performer/messages');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !showAddReviewModal) return;

    try {
      const data = {
        bookingId: showAddReviewModal.id,
        reviewerId: user.id,
        revieweeId: showAddReviewModal.venue?.organizationId,
        rating: reviewRating,
        comment: reviewComment,
      };

      const res = await api.createReview(data);
      if (res.success) {
        toast.success('Review submitted successfully!');
        setShowAddReviewModal(null);
        setReviewRating(5);
        setReviewComment('');
        // Reload all data to refresh
        dispatch(
          loadPerformerDataThunk({
            userId: user.id,
            performerId: performer.id,
            performerState: performer.state,
            performerCity: performer.city,
          })
        );
      }
    } catch (err: any) {
      toast.error('Failed to submit review: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Your Scheduled Gigs</h1>
        <p className="text-slate-500 mt-1 dark:text-slate-400">
          Track the approval progress of requested slots and leave reviews post-show.
        </p>
      </div>

      <BookingTimeline bookings={bookingsList} viewType="performer" />

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {bookingsList.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm dark:text-slate-400">
              You have not requested or booked any slots yet.
            </div>
          ) : (
            bookingsList.map((booking) => {
              const todayStr = toLocalISOString(new Date());
              const isPast =
                booking.date <= todayStr && booking.status?.toUpperCase() === 'CONFIRMED';
              const hasReviewed = reviewsList.some(
                (r) => r.bookingId === booking.id && r.reviewerId === user?.id
              );

              return (
                <div
                  key={booking.id}
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {booking.venue?.name}
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
                      Address: {booking.venue?.address} | Date: {booking.date} | Time:{' '}
                      {to12h(booking.startTime)} – {to12h(booking.endTime)}
                    </p>
                    <span className="inline-block mt-2 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full dark:bg-emerald-950/20 dark:text-emerald-400 font-sans">
                      Offer: ₹{booking.budget}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {isPast && !hasReviewed && (
                      <Button
                        onClick={() => setShowAddReviewModal(booking)}
                        className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold cursor-pointer h-9 px-3.5"
                      >
                        <Star className="w-3.5 h-3.5" /> Review Venue
                      </Button>
                    )}
                    {isPast && hasReviewed && (
                      <span className="text-xs text-emerald-650 font-bold bg-emerald-55 px-2.5 py-1.5 rounded-xl dark:bg-emerald-950/20 dark:text-emerald-400">
                        Already Reviewed
                      </span>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => startChat(booking.venue)}
                      className="rounded-xl text-xs font-semibold cursor-pointer h-9 px-3.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Chat Host
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* REVIEW VENUE MODAL */}
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
            <DialogTitle className="text-lg font-bold text-left">Review Venue</DialogTitle>
          </DialogHeader>

          {showAddReviewModal && (
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
                          starVal <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
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
                  placeholder="Tell other artists about the sound system, staff, and overall experience..."
                  className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-6 rounded-xl transition mt-2 text-sm shadow cursor-pointer h-12"
              >
                Submit Review
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

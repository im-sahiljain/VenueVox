'use client';

import React from 'react';
import { useAppSelector } from '@/lib/store/store';
import { Star } from 'lucide-react';

export default function PerformerReviews() {
  const { reviewsList } = useAppSelector((state) => state.performer);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Artist Reviews</h1>
        <p className="text-slate-505 mt-1 dark:text-slate-400">
          Reviews submitted by hosts and venue coordinators after you performed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviewsList.length === 0 ? (
          <div className="col-span-2 py-12 bg-white border border-slate-200 rounded-3xl text-center text-slate-500 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
            No reviews submitted for your performances yet.
          </div>
        ) : (
          reviewsList.map((review) => (
            <div
              key={review.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 dark:bg-slate-800 dark:border-slate-700"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-305 dark:text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p className="text-sm text-slate-650 dark:text-slate-300 italic font-medium">
                "{review.comment}"
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 dark:border-slate-700">
                <span>Booking Gig ID: {review.bookingId.substring(0, 8)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

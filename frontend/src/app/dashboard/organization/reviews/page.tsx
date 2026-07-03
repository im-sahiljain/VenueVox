'use client';

import React from 'react';
import { useAppSelector } from '@/lib/store/store';
import { Star } from 'lucide-react';

export default function OrganizationReviews() {
  const { reviewsList } = useAppSelector((state) => state.organization);

  const averageRating =
    reviewsList.length > 0
      ? (reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Venue Reviews</h1>
        <p className="text-slate-500 mt-1 dark:text-slate-400">
          Feedback left by artists and performers you have booked.
        </p>
      </div>

      {/* Reviews Analytics Card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 dark:bg-slate-800 dark:border-slate-700 flex flex-col md:flex-row gap-8">
        <div className="flex flex-col items-center justify-center min-w-[150px]">
          <div className="text-5xl font-black text-slate-900 dark:text-white">{averageRating}</div>
          <div className="flex items-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(Number(averageRating))
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-350 dark:text-slate-600'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-slate-505 dark:text-slate-400 font-semibold">
            {reviewsList.length} total reviews
          </span>
        </div>

        <div className="flex-1 space-y-3">
          <h4 className="font-bold text-slate-850 dark:text-white text-sm">Rating Distribution</h4>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = reviewsList.filter((r) => r.rating === rating).length;
            const pct = reviewsList.length > 0 ? (count / reviewsList.length) * 100 : 0;
            return (
              <div key={rating} className="flex items-center gap-3 text-xs">
                <span className="w-12 text-slate-500 font-bold">{rating} Star</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-700">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-slate-500 text-right font-bold">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-4">
        {reviewsList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            No reviews received yet. Reviews appear after successful event payouts.
          </div>
        ) : (
          reviewsList.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm dark:bg-slate-800 dark:border-slate-700 space-y-3"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    {review.reviewer?.name || 'Performer'}
                  </h4>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-655 dark:text-slate-350 leading-relaxed">
                {review.comment}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import { markPerformerNotificationReadThunk } from '@/lib/store/performerSlice';
import { Bell, Calendar as CalendarIcon, MessageSquare, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PerformerNotifications() {
  const dispatch = useAppDispatch();
  const { notificationsList } = useAppSelector((state) => state.performer);

  const [notificationFilter, setNotificationFilter] = useState('All');

  const handleMarkRead = (id: string) => {
    dispatch(markPerformerNotificationReadThunk(id));
  };

  const handleMarkAllRead = () => {
    const unread = notificationsList.filter((n) => !n.isRead);
    unread.forEach((n) => {
      dispatch(markPerformerNotificationReadThunk(n.id));
    });
  };

  const filteredNotifications = notificationsList.filter((n) => {
    if (notificationFilter === 'Unread') return !n.isRead;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Notifications</h1>
        <p className="text-slate-505 mt-1 dark:text-slate-400">
          Stay updated on your booking requests, approvals, and reviews.
        </p>
      </div>

      {/* Filter Tabs and Mark All As Read */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700 gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setNotificationFilter('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              notificationFilter === 'All'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:bg-slate-55 dark:hover:bg-slate-800/50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setNotificationFilter('Unread')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              notificationFilter === 'Unread'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:bg-slate-55 dark:hover:bg-slate-800/50'
            }`}
          >
            Unread
          </button>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-2 text-xs font-bold text-rose-500 hover:text-rose-600 px-4 py-2 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          Mark all as read
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-slate-550 text-sm dark:text-slate-400">
              No notifications received.
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                className={`p-5 flex items-center justify-between gap-4 transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                  notif.isRead ? 'opacity-70 bg-transparent' : 'bg-rose-50/10 dark:bg-rose-955/5'
                }`}
              >
                <div className="flex gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      notif.type === 'booking'
                        ? 'bg-blue-100 text-blue-500'
                        : notif.type === 'message'
                        ? 'bg-amber-100 text-amber-500'
                        : 'bg-emerald-100 text-emerald-500'
                    }`}
                  >
                    {notif.type === 'booking' ? (
                      <CalendarIcon className="w-5 h-5" />
                    ) : notif.type === 'message' ? (
                      <MessageSquare className="w-5 h-5" />
                    ) : (
                      <Bell className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm ${
                          notif.isRead
                            ? 'font-semibold text-slate-700 dark:text-slate-300'
                            : 'font-extrabold text-slate-900 dark:text-white'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.isRead && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                    </div>
                    <p
                      className={`mt-0.5 text-xs ${
                        notif.isRead ? 'text-slate-400' : 'text-slate-655 dark:text-slate-400'
                      }`}
                    >
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                      {new Date(notif.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {!notif.isRead && (
                  <Button
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead(notif.id);
                    }}
                    className="rounded-lg transition font-semibold cursor-pointer h-8 px-3 text-xs"
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

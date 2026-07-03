'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import {
  setActivePerformerId,
  sendMessageThunk,
  refreshNotificationsAndMessagesThunk,
} from '@/lib/store/organizationSlice';
import { Search, ChevronLeft, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrganizationMessages() {
  const dispatch = useAppDispatch();
  const {
    user,
    performersList,
    chatMessages,
    activePerformerId,
    venuesList,
  } = useAppSelector((state) => state.organization);

  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [newMessageText, setNewMessageText] = useState('');

  const startChat = (perf: any) => {
    if (!user) return;
    dispatch(setActivePerformerId(perf.id));
    const queryOrgId = user.isManager ? user.parentOrgId : user.id;

    // Immediately trigger a fetch for messages
    dispatch(
      refreshNotificationsAndMessagesThunk({
        loggedUser: user,
        queryOrgId,
        activePerformerId: perf.id,
        performersList,
        venuesList,
      })
    );
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !user || !activePerformerId) return;

    const perf = performersList.find((p) => p.id === activePerformerId);
    if (!perf) return;

    const queryOrgId = user.isManager ? user.parentOrgId : user.id;

    dispatch(
      sendMessageThunk({
        senderId: queryOrgId,
        receiverId: perf.userId,
        text: newMessageText,
      })
    ).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        setNewMessageText('');
      }
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm dark:bg-slate-800 dark:border-slate-700 w-full min-w-0 text-slate-800 dark:text-slate-100">
      {/* Chats List sidebar */}
      <div
        className={`w-full md:w-80 flex flex-col bg-slate-50/50 dark:bg-slate-900/10 ${
          activePerformerId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 space-y-3 flex-shrink-0">
          <h3 className="font-bold text-slate-850 dark:text-white">Performers Chats</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              value={messageSearchQuery}
              onChange={(e) => setMessageSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {performersList
            .filter((p) => p.name.toLowerCase().includes(messageSearchQuery.toLowerCase()))
            .map((perf) => {
              const isActive = activePerformerId === perf.id;
              return (
                <button
                  key={perf.id}
                  onClick={() => startChat(perf)}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3 ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 shadow-md border-l-4 border-rose-500 scale-[1.01]'
                      : 'hover:bg-white/80 dark:hover:bg-slate-800/40 hover:shadow-sm'
                  }`}
                >
                  <div className="w-10 h-10 bg-slate-250 rounded-full overflow-hidden flex-shrink-0">
                    <img src={perf.imageUrl} alt={perf.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-xs truncate text-slate-900 dark:text-white">
                      {perf.name}
                    </h4>
                    <p className="text-[10px] text-slate-505 truncate mt-0.5 dark:text-slate-400">
                      {perf.genres.join(', ')}
                    </p>
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* Active chat window */}
      <div
        className={`flex-1 flex flex-col justify-between bg-slate-100/30 dark:bg-slate-950/10 min-w-0 ${
          activePerformerId ? 'flex' : 'hidden md:flex'
        }`}
      >
        {activePerformerId ? (
          <>
            {/* Chat header */}
            <div className="px-6 py-4 bg-white flex items-center justify-between dark:bg-slate-800 shadow-sm z-10 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => dispatch(setActivePerformerId(null))}
                  className="md:hidden text-slate-500 hover:text-slate-900 p-1 mr-1 rounded-md hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 flex-shrink-0"
                  title="Back to Chats"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm md:text-base">
                  {performersList.find((p) => p.id === activePerformerId)?.name}
                </h4>
              </div>
            </div>

            {/* Chat Message feed */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {chatMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Send a message to begin conversation about the gig.
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const queryOrgId = user.isManager ? user.parentOrgId : user.id;
                  const isMe = msg.senderId === queryOrgId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] p-3.5 rounded-2xl text-xs font-medium shadow-sm leading-relaxed ${
                          isMe
                            ? 'bg-rose-500 text-white rounded-br-none'
                            : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <span
                          className={`block text-[9px] mt-1.5 ${
                            isMe ? 'text-white/60' : 'text-slate-400'
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat input form */}
            <div className="p-4 bg-white dark:bg-slate-800 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-10 flex-shrink-0">
              {/* Quick Replies */}
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                {[
                  'Sure, sounds good!',
                  'Can we negotiate the price?',
                  'Please send me your portfolio.',
                  'Are you available on that date?',
                ].map((reply, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setNewMessageText(reply)}
                    className="whitespace-nowrap px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-[10px] font-semibold transition dark:bg-slate-750 dark:text-slate-300 dark:hover:bg-slate-600"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!newMessageText.trim()}
                  className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white p-3 rounded-xl transition shadow flex items-center justify-center cursor-pointer h-10 w-10"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
            <MessageSquare className="w-12 h-12 text-slate-350" />
            <span>Select a performer on the left sidebar to start messaging.</span>
          </div>
        )}
      </div>
    </div>
  );
}

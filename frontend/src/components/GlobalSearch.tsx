"use client";

import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search, Calendar, Briefcase, User, Building, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface GlobalSearchProps {
  venues?: any[];
  performers?: any[];
  onSelectTab?: (tab: any) => void;
}

export default function GlobalSearch({ venues = [], performers = [], onSelectTab }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
        <Command label="Global Search" className="flex flex-col w-full bg-transparent" onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}>
          <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-4">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <Command.Input 
              autoFocus
              placeholder="Search venues, performers, or jump to a tab..." 
              className="flex-1 px-4 py-4 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2 space-y-1">
            <Command.Empty className="py-6 text-center text-sm text-slate-500">No results found.</Command.Empty>

            <Command.Group heading="Quick Navigation" className="text-xs font-semibold text-slate-500 px-2 py-1.5 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-slate-400">
              <Command.Item 
                onSelect={() => { onSelectTab?.("overview"); setOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-xl aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-white cursor-pointer transition-colors"
              >
                <Building className="w-4 h-4 text-rose-500" /> Go to Overview
              </Command.Item>
              <Command.Item 
                onSelect={() => { onSelectTab?.("bookings"); setOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-xl aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-white cursor-pointer transition-colors"
              >
                <Briefcase className="w-4 h-4 text-emerald-500" /> View Bookings
              </Command.Item>
              <Command.Item 
                onSelect={() => { onSelectTab?.("venues"); setOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-xl aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-white cursor-pointer transition-colors"
              >
                <Calendar className="w-4 h-4 text-blue-500" /> Manage Venues
              </Command.Item>
            </Command.Group>

            {venues.length > 0 && (
              <Command.Group heading="Venues" className="text-xs font-semibold text-slate-500 px-2 py-1.5 mt-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-slate-400">
                {venues.map(venue => (
                  <Command.Item 
                    key={venue.id}
                    onSelect={() => { onSelectTab?.("venues"); setOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-xl aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-white cursor-pointer transition-colors"
                  >
                    <Building className="w-4 h-4 text-slate-400" /> {venue.name}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {performers.length > 0 && (
              <Command.Group heading="Performers" className="text-xs font-semibold text-slate-500 px-2 py-1.5 mt-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-slate-400">
                {performers.map(performer => (
                  <Command.Item 
                    key={performer.id}
                    onSelect={() => { onSelectTab?.("discovery"); setOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-xl aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-white cursor-pointer transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" /> {performer.name}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

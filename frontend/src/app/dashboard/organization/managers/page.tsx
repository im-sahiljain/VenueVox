'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import { loadAllDataThunk } from '@/lib/store/organizationSlice';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';

export default function OrganizationManagers() {
  const dispatch = useAppDispatch();
  const { user, venuesList, managersList } = useAppSelector((state) => state.organization);

  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  const [newManagerData, setNewManagerData] = useState({
    name: '',
    email: '',
    venueId: '',
  });

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newManagerData.venueId) {
      alert('Please select a venue to assign the manager to.');
      return;
    }

    try {
      const res = await api.createManager(user.id, newManagerData);
      if (res.success) {
        alert('Venue Manager created successfully!');
        setShowAddManagerModal(false);
        setNewManagerData({ name: '', email: '', venueId: '' });
        // Reload all data to fetch updated managers list
        const queryOrgId = user.isManager ? user.parentOrgId : user.id;
        dispatch(loadAllDataThunk({ loggedUser: user, queryOrgId }));
      }
    } catch (err: any) {
      alert('Failed to add manager: ' + err.message);
    }
  };

  if (user?.isManager) {
    return (
      <div className="p-8 text-center text-slate-500 font-semibold dark:text-slate-400">
        Access Denied: Only organization owners can manage venue managers.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Venue Managers</h1>
          <p className="text-slate-500 mt-1 dark:text-slate-400">
            Add local managers and assign them to oversee specific venues.
          </p>
        </div>
        <Button
          onClick={() => {
            setNewManagerData({
              name: '',
              email: '',
              venueId: venuesList[0]?.id || '',
            });
            setShowAddManagerModal(true);
          }}
          className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold shadow-md cursor-pointer h-11 px-5"
        >
          <Plus className="w-4 h-4" /> Add Venue Manager
        </Button>
      </div>

      {/* List of Managers */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Active Managers</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-750">
          {managersList.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm dark:text-slate-400">
              No managers registered yet. Click the button above to add one.
            </div>
          ) : (
            managersList.map((mgr) => (
              <div
                key={mgr.id}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">{mgr.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Email: {mgr.email}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-1">Assigned Venues:</span>
                  <div className="flex flex-wrap gap-1">
                    {mgr.assignedVenues && mgr.assignedVenues.length > 0 ? (
                      mgr.assignedVenues.map((v: any) => (
                        <span
                          key={v.id}
                          className="bg-rose-50 text-rose-650 px-2.5 py-0.5 rounded-full text-xs font-semibold dark:bg-rose-950/20 dark:text-rose-400"
                        >
                          {v.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">None</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={showAddManagerModal} onOpenChange={setShowAddManagerModal}>
        <DialogContent
          className="max-w-sm w-full p-6 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-750 rounded-3xl"
          showCloseButton={true}
        >
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-left">Add Venue Manager</DialogTitle>
          </DialogHeader>

          {showAddManagerModal && (
            <form onSubmit={handleCreateManager} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Manager Name *</label>
                <input
                  type="text"
                  required
                  value={newManagerData.name}
                  onChange={(e) => setNewManagerData({ ...newManagerData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full p-2.5 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newManagerData.email}
                  onChange={(e) => setNewManagerData({ ...newManagerData, email: e.target.value })}
                  placeholder="e.g. manager@example.com"
                  className="w-full p-2.5 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Assign to Venue *</label>
                <select
                  value={newManagerData.venueId}
                  onChange={(e) => setNewManagerData({ ...newManagerData, venueId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-350 bg-white text-slate-850 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                >
                  <option value="">-- Select a Venue --</option>
                  {venuesList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-6 rounded-xl transition mt-4 cursor-pointer"
              >
                Create Manager Account
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

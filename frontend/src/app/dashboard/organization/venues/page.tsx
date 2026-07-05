"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/store";
import {
  createVenueThunk,
  updateVenueThunk,
  deleteVenueThunk,
  deleteVenuePhotoThunk,
  setPrimaryVenuePhotoThunk,
  OrganizationState,
} from "@/lib/store/organizationSlice";
import {
  Plus,
  Search,
  Building,
  MapPin,
  Edit3,
  Trash2,
  BookOpen,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageSlideshow } from "@/components/ImageSlideshow";
import { toast } from "sonner";

export default function VenuesManagement() {
  const dispatch = useAppDispatch();
  const { user, venuesList, slotsList, isUploadingVenuePhoto } = useAppSelector(
    (state: any) => state.organization as OrganizationState,
  );

  // Search & Filter
  const [venueSearchQuery, setVenueSearchQuery] = useState("");
  const [venueTypeFilter, setVenueTypeFilter] = useState("All");

  // Modals & Editing
  const [showAddVenueModal, setShowAddVenueModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState<any | null>(null);
  const [selectedVenueDetails, setSelectedVenueDetails] = useState<any | null>(
    null,
  );

  // Pending Upload Queues
  const [pendingVenueProfileFile, setPendingVenueProfileFile] =
    useState<File | null>(null);
  const [pendingVenueGalleryFiles, setPendingVenueGalleryFiles] = useState<
    File[]
  >([]);

  const [newVenueData, setNewVenueData] = useState({
    name: "",
    address: "",
    description: "",
    capacity: 50,
    type: "Café",
    equipment: "",
    policies: "",
    imageUrl: "",
    state: "Punjab",
    city: "Chandigarh",
  });

  // Sync editing venue with updated list on delete/set primary photo
  useEffect(() => {
    if (editingVenue) {
      const latest = venuesList.find((v) => v.id === editingVenue.id);
      if (latest) {
        setEditingVenue(latest);
      }
    }
  }, [venuesList, editingVenue]);

  const handleCreateVenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const queryOrgId = user.isManager ? user.parentOrgId : user.id;

    const formattedData = {
      ...newVenueData,
      organizationId: queryOrgId,
      equipment: newVenueData.equipment
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      policies: newVenueData.policies
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    };

    dispatch(createVenueThunk(formattedData)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        setShowAddVenueModal(false);
        setNewVenueData({
          name: "",
          address: "",
          description: "",
          capacity: 50,
          type: "Café",
          equipment: "",
          policies: "",
          imageUrl: "",
          state: "Punjab",
          city: "Chandigarh",
        });
      }
    });
  };

  const handleUpdateVenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVenue || !user) return;
    const queryOrgId = user.isManager ? user.parentOrgId : user.id;

    const data = {
      id: editingVenue.id,
      name: editingVenue.name,
      address: editingVenue.address,
      description: editingVenue.description,
      capacity: editingVenue.capacity,
      type: editingVenue.type,
      equipment: Array.isArray(editingVenue.equipment)
        ? editingVenue.equipment
        : editingVenue.equipment
            .split(",")
            .map((x: string) => x.trim())
            .filter(Boolean),
      policies: Array.isArray(editingVenue.policies)
        ? editingVenue.policies
        : editingVenue.policies
            .split(",")
            .map((x: string) => x.trim())
            .filter(Boolean),
      imageUrl: editingVenue.imageUrl,
      photos: editingVenue.photos || [],
      pendingVenueProfileFile,
      pendingVenueGalleryFiles,
      orgId: queryOrgId,
    };

    dispatch(updateVenueThunk(data)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        setEditingVenue(null);
        setPendingVenueProfileFile(null);
        setPendingVenueGalleryFiles([]);
      }
    });
  };

  const handleDeleteVenue = (id: string) => {
    if (!confirm("Are you sure you want to delete this venue?")) return;
    dispatch(deleteVenueThunk(id));
  };

  const handleVenuePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Max size is 1MB.`);
        continue;
      }
      newFiles.push(file);
    }
    setPendingVenueGalleryFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDeleteVenuePhoto = (photoUrl: string) => {
    if (!editingVenue) return;
    if (
      !confirm(
        "Are you sure you want to delete this venue photo permanently? This will also remove it from Cloudinary.",
      )
    )
      return;

    dispatch(
      deleteVenuePhotoThunk({
        venueId: editingVenue.id,
        photoUrl,
        currentPhotos: editingVenue.photos || [],
        currentImageUrl: editingVenue.imageUrl,
      }),
    );
  };

  const handleSetPrimaryVenuePhoto = (photoUrl: string) => {
    if (!editingVenue) return;
    dispatch(
      setPrimaryVenuePhotoThunk({
        venueId: editingVenue.id,
        photoUrl,
      }),
    );
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Venues Management
          </h1>
          <p className="text-slate-500 mt-1 dark:text-slate-400">
            Add, edit, or remove your organizational booking venues.
          </p>
        </div>
        {!user?.isManager && (
          <Button
            onClick={() => {
              setEditingVenue(null);
              setShowAddVenueModal(true);
            }}
            className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold shadow-md cursor-pointer h-11 px-5"
          >
            <Plus className="w-4 h-4" /> Add New Venue
          </Button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search venues by name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            value={venueSearchQuery}
            onChange={(e) => setVenueSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <select
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            value={venueTypeFilter}
            onChange={(e) => setVenueTypeFilter(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Café">Café</option>
            <option value="Club">Club</option>
            <option value="Restaurant">Restaurant</option>
            <option value="Resort">Resort</option>
          </select>
        </div>
      </div>

      {/* List of Venues */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {venuesList
          .filter((v) => {
            const matchesSearch = v.name
              .toLowerCase()
              .includes(venueSearchQuery.toLowerCase());
            const matchesType =
              venueTypeFilter === "All" || v.type === venueTypeFilter;
            return matchesSearch && matchesType;
          })
          .map((venue) => {
            const venueSlots = slotsList.filter((s) => s.venueId === venue.id);
            const availableCount = venueSlots.filter(
              (s) => s.status?.toUpperCase() === "AVAILABLE",
            ).length;
            const pendingCount = venueSlots.filter(
              (s) => s.status?.toUpperCase() === "PENDING",
            ).length;
            const bookedCount = venueSlots.filter(
              (s) => s.status?.toUpperCase() === "BOOKED",
            ).length;

            return (
              <div
                key={venue.id}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between dark:bg-slate-800 dark:border-slate-700"
              >
                <div className="relative h-48 bg-slate-100 dark:bg-slate-900">
                  <img
                    src={
                      venue.imageUrl ||
                      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800"
                    }
                    alt={venue.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-4 right-4 bg-white/90 backdrop-blur text-slate-850 px-3 py-1 rounded-full text-sm font-bold shadow dark:bg-slate-900/90 dark:text-white">
                    {venue.type}
                  </span>
                  {availableCount > 0 && (
                    <span className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow">
                      {availableCount} Available Slots
                    </span>
                  )}
                </div>

                <div className="p-6 flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {venue.name}
                    </h3>
                    <div className="text-[10px] font-semibold text-slate-500 mt-1 flex gap-2">
                      <span>{availableCount} available</span>
                      <span>•</span>
                      <span>{pendingCount} pending</span>
                      <span>•</span>
                      <span>{bookedCount} booked</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-2 flex items-center gap-1">
                      <span className="text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span>{venue?.address}</span>
                        <span>
                          {venue?.city}, {venue?.state}
                        </span>
                      </span>
                    </p>
                  </div>

                  <p className="text-sm text-slate-550 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {venue.description}
                  </p>

                  <div className="text-sm font-semibold text-slate-500">
                    Capacity:{" "}
                    <strong className="text-slate-800 dark:text-white">
                      {venue.capacity} guests
                    </strong>
                  </div>

                  {venue.equipment && venue.equipment.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Equipment Provided:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {venue.equipment.map((eq: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold dark:bg-slate-700 dark:text-slate-350"
                          >
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-750 flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedVenueDetails(venue)}
                    className="flex-1 rounded-xl text-sm font-semibold cursor-pointer h-9"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-rose-500" /> View
                    details
                  </Button>
                  {!user?.isManager && (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => setEditingVenue(venue)}
                        className="flex-1 rounded-xl text-sm font-semibold cursor-pointer h-9"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteVenue(venue.id)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2.5 rounded-xl transition dark:bg-rose-950/20 dark:hover:bg-rose-900/30 cursor-pointer h-9 w-9"
                        title="Delete Venue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* CREATE VENUE MODAL */}
      <Dialog open={showAddVenueModal} onOpenChange={setShowAddVenueModal}>
        <DialogContent
          className="max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-750 rounded-3xl"
          showCloseButton={true}
        >
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold text-left">
              Add New Venue
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateVenue} className="space-y-4 text-sm">
            <div>
              <label className="block font-semibold mb-1">Venue Name *</label>
              <input
                type="text"
                required
                value={newVenueData.name}
                onChange={(e) =>
                  setNewVenueData({ ...newVenueData, name: e.target.value })
                }
                placeholder="e.g. Sector 17 Cafe"
                className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Venue Type *</label>
              <select
                value={newVenueData.type}
                onChange={(e) =>
                  setNewVenueData({ ...newVenueData, type: e.target.value })
                }
                className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
              >
                {[
                  "Café",
                  "Restaurant",
                  "Hotel",
                  "Club",
                  "Brewery",
                  "Resort",
                  "Banquet Hall",
                  "Corporate",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Address *</label>
              <input
                type="text"
                required
                value={newVenueData.address}
                onChange={(e) =>
                  setNewVenueData({ ...newVenueData, address: e.target.value })
                }
                placeholder="e.g. 1024 Market St, Cityville"
                className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">State *</label>
                <select
                  value={newVenueData.state}
                  onChange={(e) => {
                    const s = e.target.value;
                    let c = "Chandigarh";
                    if (s === "Karnataka") c = "Bengaluru";
                    else if (s === "Maharashtra") c = "Mumbai";
                    setNewVenueData({ ...newVenueData, state: s, city: c });
                  }}
                  className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                >
                  <option value="Punjab">Punjab</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Maharashtra">Maharashtra</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">City *</label>
                <select
                  value={newVenueData.city}
                  onChange={(e) =>
                    setNewVenueData({ ...newVenueData, city: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                >
                  {newVenueData.state === "Punjab" && (
                    <option value="Chandigarh">Chandigarh</option>
                  )}
                  {newVenueData.state === "Karnataka" && (
                    <option value="Bengaluru">Bengaluru</option>
                  )}
                  {newVenueData.state === "Maharashtra" && (
                    <option value="Mumbai">Mumbai</option>
                  )}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">
                  Capacity (guests) *
                </label>
                <input
                  type="number"
                  required
                  value={newVenueData.capacity}
                  onChange={(e) =>
                    setNewVenueData({
                      ...newVenueData,
                      capacity: Number(e.target.value),
                    })
                  }
                  className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Featured Photo URL
                </label>
                <input
                  type="text"
                  value={newVenueData.imageUrl}
                  onChange={(e) =>
                    setNewVenueData({
                      ...newVenueData,
                      imageUrl: e.target.value,
                    })
                  }
                  placeholder="https://unsplash.com/..."
                  className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">Description</label>
              <textarea
                rows={3}
                value={newVenueData.description}
                onChange={(e) =>
                  setNewVenueData({
                    ...newVenueData,
                    description: e.target.value,
                  })
                }
                placeholder="Brief bio about the venue experience..."
                className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Technical Equipment (comma-separated)
              </label>
              <input
                type="text"
                value={newVenueData.equipment}
                onChange={(e) =>
                  setNewVenueData({
                    ...newVenueData,
                    equipment: e.target.value,
                  })
                }
                placeholder="PA System, Vocal Mics, DJ Deck"
                className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Policies / Rules (comma-separated)
              </label>
              <input
                type="text"
                value={newVenueData.policies}
                onChange={(e) =>
                  setNewVenueData({ ...newVenueData, policies: e.target.value })
                }
                placeholder="Sound cap 85dB, CURFEW 11PM"
                className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-6 rounded-xl transition mt-4 cursor-pointer"
            >
              Save Venue
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT VENUE MODAL */}
      <Dialog
        open={!!editingVenue}
        onOpenChange={(open) => {
          if (!open) {
            setEditingVenue(null);
            setPendingVenueProfileFile(null);
            setPendingVenueGalleryFiles([]);
          }
        }}
      >
        <DialogContent
          className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-750 rounded-3xl"
          showCloseButton={true}
        >
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold text-left">
              Edit Venue Details
            </DialogTitle>
          </DialogHeader>
          {editingVenue && (
            <form onSubmit={handleUpdateVenue} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold mb-1">Venue Name *</label>
                <input
                  type="text"
                  required
                  value={editingVenue.name}
                  onChange={(e) =>
                    setEditingVenue({ ...editingVenue, name: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Venue Type *</label>
                <select
                  value={editingVenue.type}
                  onChange={(e) =>
                    setEditingVenue({ ...editingVenue, type: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                >
                  {[
                    "Café",
                    "Restaurant",
                    "Hotel",
                    "Club",
                    "Brewery",
                    "Resort",
                    "Banquet Hall",
                    "Corporate",
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Address *</label>
                <input
                  type="text"
                  required
                  value={editingVenue.address}
                  onChange={(e) =>
                    setEditingVenue({
                      ...editingVenue,
                      address: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">
                    Capacity (guests)
                  </label>
                  <input
                    type="number"
                    required
                    value={editingVenue.capacity}
                    onChange={(e) =>
                      setEditingVenue({
                        ...editingVenue,
                        capacity: Number(e.target.value),
                      })
                    }
                    className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 flex items-center justify-between">
                    <span>Photo / Cover Image</span>
                    {pendingVenueProfileFile && (
                      <span className="text-[10px] text-rose-500 font-bold animate-pulse">
                        Pending Upload
                      </span>
                    )}
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-750">
                        <img
                          src={
                            pendingVenueProfileFile
                              ? URL.createObjectURL(pendingVenueProfileFile)
                              : editingVenue.imageUrl ||
                                "/avatar-placeholder.png"
                          }
                          alt="Venue Profile Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-semibold rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 transition">
                          <span>
                            {pendingVenueProfileFile
                              ? "Change Image"
                              : "Upload Image"}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 1024 * 1024) {
                                  toast.error(
                                    "Cover image size exceeds the 1MB limit.",
                                  );
                                  return;
                                }
                                setPendingVenueProfileFile(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      {pendingVenueProfileFile && (
                        <button
                          type="button"
                          onClick={() => setPendingVenueProfileFile(null)}
                          className="text-sm font-bold text-rose-500 hover:text-rose-600 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={
                        pendingVenueProfileFile
                          ? `[Queued for upload: ${pendingVenueProfileFile.name}]`
                          : editingVenue.imageUrl
                      }
                      disabled={!!pendingVenueProfileFile}
                      onChange={(e) =>
                        setEditingVenue({
                          ...editingVenue,
                          imageUrl: e.target.value,
                        })
                      }
                      placeholder="Or paste an image URL here..."
                      className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-850 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingVenue.description}
                  onChange={(e) =>
                    setEditingVenue({
                      ...editingVenue,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Technical Equipment (comma-separated)
                </label>
                <input
                  type="text"
                  value={
                    Array.isArray(editingVenue.equipment)
                      ? editingVenue.equipment.join(", ")
                      : editingVenue.equipment
                  }
                  onChange={(e) =>
                    setEditingVenue({
                      ...editingVenue,
                      equipment: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Policies / Rules (comma-separated)
                </label>
                <input
                  type="text"
                  value={
                    Array.isArray(editingVenue.policies)
                      ? editingVenue.policies.join(", ")
                      : editingVenue.policies
                  }
                  onChange={(e) =>
                    setEditingVenue({
                      ...editingVenue,
                      policies: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                />
              </div>

              {/* Venue Gallery Section */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6">
                <h3 className="text-base font-bold tracking-tight mb-2">
                  Venue Gallery
                </h3>
                <p className="text-slate-550 dark:text-slate-400 mb-4 text-sm">
                  Add photos. Upload will happen when you save the form.
                </p>

                {/* Upload Dropzone */}
                <div className="mb-4">
                  <label className="flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-xl p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition dark:border-slate-750">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      {isUploadingVenuePhoto ? (
                        <div className="flex flex-col items-center space-y-1">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-rose-500"></div>
                          <span className="text-sm text-slate-500">
                            Processing images...
                          </span>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="h-5 w-5 text-slate-400" />
                          <span className="text-sm font-semibold text-rose-500">
                            Choose gallery photos
                          </span>
                          <span className="text-[10px] text-slate-400">
                            PNG, JPG or WEBP up to 1MB (Multiple allowed)
                          </span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      disabled={isUploadingVenuePhoto}
                      onChange={handleVenuePhotoUpload}
                    />
                  </label>
                </div>

                {/* Image Grid (Saved + Pending) */}
                {(editingVenue.photos && editingVenue.photos.length > 0) ||
                pendingVenueGalleryFiles.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {/* Saved Photos */}
                    {editingVenue.photos.map((photo: string, index: number) => {
                      const isPrimary = editingVenue.imageUrl === photo;
                      return (
                        <div
                          key={`saved-${index}`}
                          className="group relative aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm"
                        >
                          <img
                            src={photo}
                            alt={`Venue photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {isPrimary && (
                            <div className="absolute top-1 left-1 bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                              Primary
                            </div>
                          )}
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col justify-end p-1.5 space-y-1">
                            {!isPrimary && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSetPrimaryVenuePhoto(photo)
                                }
                                className="w-full text-center text-[10px] font-semibold py-0.5 bg-white hover:bg-slate-100 text-slate-800 rounded shadow-sm transition cursor-pointer"
                              >
                                Primary
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteVenuePhoto(photo)}
                              className="w-full text-center text-[10px] font-semibold py-0.5 bg-rose-500 hover:bg-rose-600 text-white rounded shadow-sm transition cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Pending Photos */}
                    {pendingVenueGalleryFiles.map(
                      (file: File, index: number) => {
                        const localUrl = URL.createObjectURL(file);
                        return (
                          <div
                            key={`pending-${index}`}
                            className="group relative aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-rose-400 shadow-sm"
                          >
                            <img
                              src={localUrl}
                              alt={`Pending photo ${index + 1}`}
                              className="w-full h-full object-cover opacity-80"
                            />
                            <div className="absolute top-1 left-1 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                              Pending
                            </div>
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col justify-end p-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setPendingVenueGalleryFiles((prev) =>
                                    prev.filter((_, idx) => idx !== index),
                                  )
                                }
                                className="w-full text-center text-[10px] font-semibold py-0.5 bg-rose-500 hover:bg-rose-600 text-white rounded shadow-sm transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    <ImageIcon className="h-6 w-6 text-slate-350 mx-auto mb-1" />
                    <p className="text-slate-400 text-sm">
                      No venue photos uploaded yet.
                    </p>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isUploadingVenuePhoto}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-6 rounded-xl transition mt-4 cursor-pointer disabled:bg-slate-400"
              >
                {isUploadingVenuePhoto
                  ? "Updating & Uploading..."
                  : "Update Details"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* VIEW VENUE DETAILS MODAL */}
      <Dialog
        open={!!selectedVenueDetails}
        onOpenChange={(open) => {
          if (!open) setSelectedVenueDetails(null);
        }}
      >
        <DialogContent
          className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-750 rounded-3xl"
          showCloseButton={true}
        >
          {selectedVenueDetails && (
            <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-left">
                  {selectedVenueDetails.name}
                </DialogTitle>
              </DialogHeader>

              {/* Photos Slideshow */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 h-72">
                <ImageSlideshow
                  images={[
                    selectedVenueDetails.imageUrl,
                    ...(selectedVenueDetails.photos || []),
                  ].filter(Boolean)}
                />
              </div>

              <div>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Description
                </span>
                <p className="leading-relaxed text-slate-600 dark:text-slate-350">
                  {selectedVenueDetails.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 border-y border-slate-100 dark:border-slate-700 py-4 font-semibold text-sm">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Venue Type
                  </span>
                  <span className="text-slate-800 dark:text-white">
                    {selectedVenueDetails.type}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Capacity
                  </span>
                  <span className="text-slate-800 dark:text-white">
                    {selectedVenueDetails.capacity} guests
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Technical Equipment
                  </span>
                  {selectedVenueDetails.equipment?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedVenueDetails.equipment.map(
                        (eq: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded text-[10px] font-semibold dark:bg-slate-750 dark:text-slate-300"
                          >
                            {eq}
                          </span>
                        ),
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm">
                      No equipment listed
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    House Rules & Policies
                  </span>
                  {selectedVenueDetails.policies?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedVenueDetails.policies.map(
                        (p: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-rose-50 text-rose-650 px-2 py-0.5 rounded text-[10px] font-semibold dark:bg-rose-950/20 dark:text-rose-450"
                          >
                            {p}
                          </span>
                        ),
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm">
                      No rules specified
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

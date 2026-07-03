"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  User as UserIcon,
  Compass,
  Briefcase,
  MessageSquare,
  Bell,
  Star,
  LogOut,
  Check,
  X,
  Send,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  MapPin,
  DollarSign,
  ShieldCheck,
  BookOpen,
  Calendar as CalendarIcon,
  Info,
  ShieldAlert,
  Search,
  Paperclip,
  Mic,
  Menu,
} from "lucide-react";
import { api, uploadImageToCloudinary } from "@/lib/api";
import { to12h, toLocalISOString } from "@/lib/utils";
import Sidebar, { SidebarItem } from "@/components/Sidebar";
import GlobalSearch from "@/components/GlobalSearch";
import { BookingTimeline } from "@/components/BookingTimeline";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageSlideshow } from "@/components/ImageSlideshow";

export default function PerformerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [performer, setPerformer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "portfolio"
    | "discover"
    | "bookings"
    | "messages"
    | "notifications"
    | "reviews"
  >("overview");

  // Data State
  const [slotsList, setSlotsList] = useState<any[]>([]); // Search results
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [reviewsList, setReviewsList] = useState<any[]>([]);

  // Messaging state
  const [venuesList, setVenuesList] = useState<any[]>([]);
  const [activeVenueId, setActiveVenueId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [notificationFilter, setNotificationFilter] = useState("All");

  // Discover Filter states
  const [searchFilters, setSearchFilters] = useState({
    location: "",
    date: "",
    budget: 1000,
    genre: "",
    venueType: "",
    equipment: "",
    state: "All",
    city: "All",
  });

  // Modal / Detail states
  const [selectedSlotDetails, setSelectedSlotDetails] = useState<any | null>(
    null,
  );
  // Grouped venue dialog state
  const [selectedVenueSlots, setSelectedVenueSlots] = useState<any | null>(
    null,
  ); // { venue, slots[] }
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [showAddReviewModal, setShowAddReviewModal] = useState<any | null>(
    null,
  ); // booking object
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // Portfolio Form state
  const [portfolioData, setPortfolioData] = useState({
    name: "",
    biography: "",
    genres: "",
    pricing: 100,
    languages: "English",
    experience: "",
    travelRadius: 25,
    equipmentNeeded: "",
    imageUrl: "",
    state: "Punjab",
    city: "Chandigarh",
    photos: [] as string[],
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isOpenOnMobile, setIsOpenOnMobile] = useState(false);

  // Authentication check
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const loggedUser = JSON.parse(userStr);
    if (loggedUser.role !== "performer") {
      if (loggedUser.role === "organization") {
        router.push("/dashboard/organization");
      } else {
        localStorage.clear();
        router.push("/login");
      }
      return;
    }
    setUser(loggedUser);

    const perfStr = localStorage.getItem("performer");
    if (perfStr) {
      const p = JSON.parse(perfStr);
      setPerformer(p);
      setPortfolioData({
        name: p.name || "",
        biography: p.biography || "",
        genres: Array.isArray(p.genres) ? p.genres.join(", ") : p.genres || "",
        pricing: p.pricing || 100,
        languages: Array.isArray(p.languages)
          ? p.languages.join(", ")
          : p.languages || "English",
        experience: p.experience || "",
        travelRadius: p.travelRadius || 25,
        equipmentNeeded: Array.isArray(p.equipmentNeeded)
          ? p.equipmentNeeded.join(", ")
          : p.equipmentNeeded || "",
        imageUrl: p.imageUrl || "",
        state: p.state || "Punjab",
        city: p.city || "Chandigarh",
        photos: p.photos || [],
      });
      setSearchFilters(prev => ({
        ...prev,
        state: p.state || "All",
        city: p.city || "All"
      }));
      loadAllData(loggedUser.id, p.id, p.state, p.city);
    } else {
      setErrorMsg("Performer profile could not be loaded.");
      setLoading(false);
    }

    // Removed polling interval for stability testing
    // const interval = setInterval(() => {
    //   if (perfStr) {
    //     const p = JSON.parse(perfStr);
    //     refreshNotificationsAndMessages(loggedUser.id, p.id);
    //   }
    // }, 5000);

    // return () => clearInterval(interval);
  }, [router]);

  const loadAllData = async (userId: string, performerId: string, performerState?: string, performerCity?: string) => {
    setLoading(true);
    try {
      // Slots discover (default search scoped to performer's location)
      const resSlots = await api.discoverSlots({
        state: performerState && performerState !== 'All' ? performerState : undefined,
        city: performerCity && performerCity !== 'All' ? performerCity : undefined
      });
      setSlotsList(resSlots.data);

      // Bookings for this performer
      const resBookings = await api.getBookings({ performerId });
      setBookingsList(resBookings.data);

      // Notifications
      const resNotif = await api.getNotifications(userId);
      setNotificationsList(resNotif.data);

      // Venues list for messaging scoped to performer's location
      const resVenues = await api.getVenues({
        state: performerState && performerState !== 'All' ? performerState : undefined,
        city: performerCity && performerCity !== 'All' ? performerCity : undefined
      });
      setVenuesList(resVenues.data);

      // Reviews received
      const resReviews = await api.getReviews(performerId);
      setReviewsList(resReviews.data);
    } catch (err: any) {
      setErrorMsg("Failed to load dashboard data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshNotificationsAndMessages = async (
    userId: string,
    performerId: string,
  ) => {
    try {
      const resNotif = await api.getNotifications(userId);
      setNotificationsList(resNotif.data);

      if (activeVenueId) {
        const venue = venuesList.find((v) => v.id === activeVenueId);
        if (venue) {
          const otherId = (venue.managerIds && venue.managerIds.length > 0) ? venue.managerIds[0] : venue.organizationId;
          const resMsgs = await api.getMessages(userId, otherId);
          setChatMessages(resMsgs.data);
        }
      }
    } catch (e) {
      // silent
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  // -------------------------------------------------------------
  // PORTFOLIO UPDATE
  // -------------------------------------------------------------
  const [pendingProfileFile, setPendingProfileFile] = useState<File | null>(null);
  const [pendingGalleryFiles, setPendingGalleryFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpdatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!performer) return;
    setErrorMsg("");
    setSuccessMsg("");
    setIsUploading(true);

    try {
      let finalImageUrl = portfolioData.imageUrl;
      const performerFolder = `VenueVox/Performer/${performer.id}/images`;

      // 1. Upload pending profile photo to Cloudinary
      if (pendingProfileFile) {
        finalImageUrl = await uploadImageToCloudinary(pendingProfileFile, performerFolder);
      }

      // 2. Upload pending gallery files to Cloudinary
      let finalPhotos = [...(portfolioData.photos || [])];
      if (pendingGalleryFiles.length > 0) {
        const uploadPromises = pendingGalleryFiles.map(file =>
          uploadImageToCloudinary(file, performerFolder)
        );
        const uploadedUrls = await Promise.all(uploadPromises);
        finalPhotos = [...finalPhotos, ...uploadedUrls];
      }

      const formattedData = {
        name: portfolioData.name,
        biography: portfolioData.biography,
        genres: portfolioData.genres
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
        pricing: Number(portfolioData.pricing),
        languages: portfolioData.languages
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
        experience: portfolioData.experience,
        travelRadius: Number(portfolioData.travelRadius),
        equipmentNeeded: portfolioData.equipmentNeeded
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
        imageUrl: finalImageUrl,
        photos: finalPhotos,
        state: portfolioData.state,
        city: portfolioData.city,
      };

      const res = await api.updatePerformer(performer.id, formattedData);
      if (res.success) {
        setPerformer(res.data);
        localStorage.setItem("performer", JSON.stringify(res.data));
        setPortfolioData({
          name: res.data.name || "",
          biography: res.data.biography || "",
          genres: (res.data.genres || []).join(", "),
          pricing: String(res.data.pricing || ""),
          languages: (res.data.languages || []).join(", "),
          experience: res.data.experience || "",
          travelRadius: String(res.data.travelRadius || ""),
          equipmentNeeded: (res.data.equipmentNeeded || []).join(", "),
          imageUrl: res.data.imageUrl || "",
          photos: res.data.photos || [],
          state: res.data.state || "",
          city: res.data.city || "",
        });
        setPendingProfileFile(null);
        setPendingGalleryFiles([]);
        setSuccessMsg("Portfolio updated successfully!");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update portfolio.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setErrorMsg("");
    setSuccessMsg("");
    
    const newFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 1024 * 1024) {
        setErrorMsg(`File "${file.name}" exceeds the 1MB limit.`);
        continue;
      }
      newFiles.push(file);
    }
    setPendingGalleryFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    if (!performer) return;
    if (!confirm("Are you sure you want to delete this photo permanently? This will also remove it from Cloudinary.")) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      setIsUploading(true);
      // 1. Delete from Cloudinary
      await api.deleteMedia(photoUrl);

      // 2. Remove from database
      const currentPhotos = portfolioData.photos || [];
      const updatedPhotos = currentPhotos.filter(p => p !== photoUrl);

      let newImageUrl = portfolioData.imageUrl;
      if (portfolioData.imageUrl === photoUrl) {
        newImageUrl = updatedPhotos.length > 0 ? updatedPhotos[0] : "";
      }

      const res = await api.updatePerformer(performer.id, {
        photos: updatedPhotos,
        imageUrl: newImageUrl
      });

      if (res.success) {
        setPerformer(res.data);
        localStorage.setItem("performer", JSON.stringify(res.data));
        setPortfolioData(prev => ({
          ...prev,
          photos: res.data.photos || [],
          imageUrl: res.data.imageUrl || ""
        }));
        setSuccessMsg("Photo deleted successfully from database and Cloudinary!");
      }
    } catch (err: any) {
      setErrorMsg("Failed to delete photo: " + (err.message || err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetPrimaryPhoto = async (photoUrl: string) => {
    if (!performer) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.updatePerformer(performer.id, {
        imageUrl: photoUrl
      });

      if (res.success) {
        setPerformer(res.data);
        localStorage.setItem("performer", JSON.stringify(res.data));
        setPortfolioData(prev => ({
          ...prev,
          imageUrl: res.data.imageUrl || ""
        }));
        setSuccessMsg("Primary photo updated successfully!");
      }
    } catch (err: any) {
      setErrorMsg("Failed to set primary photo: " + err.message);
    }
  };

  // -------------------------------------------------------------
  // DISCOVER & SEARCH
  // -------------------------------------------------------------
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await api.discoverSlots(searchFilters);
      setSlotsList(res.data);
    } catch (err: any) {
      setErrorMsg("Search failed: " + err.message);
    }
  };

  const handleRequestBooking = async (slotId: string) => {
    if (!performer) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.requestBooking(slotId, performer.id);
      if (res.success) {
        setSelectedSlotDetails(null);
        setSuccessMsg("Gig requested! Host will notify you once approved.");
        const resBookings = await api.getBookings({
          performerId: performer.id,
        });
        setBookingsList(resBookings.data);
        const resSlots = await api.discoverSlots(searchFilters);
        setSlotsList(resSlots.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleBookSelected = async () => {
    if (!performer || selectedSlotIds.length === 0) return;
    setErrorMsg("");
    setSuccessMsg("");
    let succeeded = 0;
    for (const slotId of selectedSlotIds) {
      try {
        const res = await api.requestBooking(slotId, performer.id);
        if (res.success) succeeded++;
      } catch {
        // continue for other slots
      }
    }
    setSelectedVenueSlots(null);
    setSelectedSlotIds([]);
    setSuccessMsg(
      succeeded === selectedSlotIds.length
        ? `${succeeded} slot request${succeeded > 1 ? "s" : ""} sent! Awaiting host approval.`
        : `${succeeded}/${selectedSlotIds.length} requests sent. Some may have failed.`,
    );
    const resBookings = await api.getBookings({ performerId: performer.id });
    setBookingsList(resBookings.data);
    const resSlots = await api.discoverSlots(searchFilters);
    setSlotsList(resSlots.data);
  };

  // -------------------------------------------------------------
  // MESSAGING
  // -------------------------------------------------------------
  const startChat = async (venue: any) => {
    if (!user) return;
    setActiveVenueId(venue.id);
    try {
      const otherId = (venue.managerIds && venue.managerIds.length > 0) ? venue.managerIds[0] : venue.organizationId;
      const res = await api.getMessages(user.id, otherId);
      setChatMessages(res.data);
    } catch (err: any) {
      setErrorMsg("Failed to load chat history");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !user || !activeVenueId) return;

    const venue = venuesList.find((v) => v.id === activeVenueId);
    if (!venue) return;

    const otherId = (venue.managerIds && venue.managerIds.length > 0) ? venue.managerIds[0] : venue.organizationId;
    try {
      const res = await api.sendMessage(
        user.id,
        otherId,
        newMessageText.trim(),
      );
      if (res.success) {
        setChatMessages([...chatMessages, res.data]);
        setNewMessageText("");
      }
    } catch (err: any) {
      setErrorMsg("Failed to send message");
    }
  };

  // -------------------------------------------------------------
  // REVIEWS
  // -------------------------------------------------------------
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !showAddReviewModal) return;
    setErrorMsg("");
    setSuccessMsg("");

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
        setShowAddReviewModal(null);
        setReviewComment("");
        setReviewRating(5);
        setSuccessMsg("Review submitted successfully!");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // -------------------------------------------------------------
  // NOTIFICATION UTILS
  // -------------------------------------------------------------
  const handleMarkRead = async (notifId: string) => {
    try {
      await api.markNotificationRead(notifId);
      setNotificationsList(
        notificationsList.map((n) =>
          n.id === notifId ? { ...n, read: true } : n,
        ),
      );
    } catch (e) {
      // silent
    }
  };

  const unreadNotifCount = notificationsList.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading your Artist Hub...</p>
        </div>
      </div>
    );
  }

  const sidebarItems: SidebarItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    {
      id: "portfolio",
      label: "My Portfolio",
      icon: UserIcon,
      badge: `${performer?.completionPercentage || 0}%`,
      badgeColor: "bg-rose-500/20 text-rose-400",
    },
    {
      id: "discover",
      label: "Discover Slots",
      icon: Compass,
      badge: slotsList.length,
    },
    { id: "bookings", label: "Gigs Booked", icon: Briefcase },
    { id: "messages", label: "Messages", icon: MessageSquare },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      badge: unreadNotifCount || undefined,
      badgeColor: "bg-rose-500 text-white",
      isPendingDot: unreadNotifCount > 0,
    },
    { id: "reviews", label: "Reviews", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-slate-55 text-slate-800 flex flex-col md:flex-row font-sans dark:bg-slate-955 dark:text-slate-100">
      <GlobalSearch
        venues={venuesList}
        performers={[]}
        onSelectTab={setActiveTab}
      />
      {/* Sidebar Navigation */}
      <Sidebar
        user={user}
        userAvatar={performer?.imageUrl}
        userSubtitle={`₹${performer?.pricing || 0}/Gig Rate`}
        items={sidebarItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        handleLogout={handleLogout}
        title="VenueVox Performer"
        logo={Compass}
        isOpenOnMobile={isOpenOnMobile}
        setIsOpenOnMobile={setIsOpenOnMobile}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden h-16 bg-slate-900 text-white flex items-center justify-between px-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpenOnMobile(true)}
              className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-base">VenueVox</span>
          </div>
          <div className="w-8 h-8 bg-rose-500 text-white font-bold flex items-center justify-center rounded-lg uppercase text-xs">
            {user?.name?.substring(0, 2) || "U"}
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 bg-slate-50 overflow-y-auto p-4 md:p-8 dark:bg-slate-900">
        {/* Banner Messages */}
        {errorMsg && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3 text-sm dark:bg-rose-955/20 dark:border-rose-900/50 dark:text-rose-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3 text-sm dark:bg-emerald-955/20 dark:border-emerald-900/50 dark:text-emerald-400">
            <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: OVERVIEW
            ------------------------------------------------------------- */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  Welcome, {performer?.name}
                </h1>
                <p className="text-slate-500 mt-1">
                  Here is a quick look at your profile completion and gig
                  calendar.
                </p>
              </div>

              {/* Portfolio completes status */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-slate-800 dark:border-slate-700">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-bold">
                    Portfolio Completion
                  </span>
                  <span className="text-sm font-extrabold text-rose-500">
                    {performer?.completionPercentage}% Completed
                  </span>
                </div>
                <div className="w-16 bg-slate-100 h-2.5 rounded-full overflow-hidden dark:bg-slate-900">
                  <div
                    className="bg-rose-500 h-full"
                    style={{ width: `${performer?.completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                <Briefcase className="w-8 h-8 text-rose-500 mb-4" />
                <h3 className="text-2xl font-bold">
                  {
                    bookingsList.filter(
                      (b) => b.status?.toUpperCase() === "CONFIRMED",
                    ).length
                  }
                </h3>
                <span className="text-slate-500 text-xs">
                  Confirmed Gigs Scheduled
                </span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                <Compass className="w-8 h-8 text-emerald-500 mb-4" />
                <h3 className="text-2xl font-bold">{slotsList.length}</h3>
                <span className="text-slate-500 text-xs">
                  Open booking slots available now
                </span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                <Star className="w-8 h-8 text-amber-500 mb-4" />
                <h3 className="text-2xl font-bold">
                  {reviewsList.length > 0
                    ? (
                        reviewsList.reduce((acc, r) => acc + r.rating, 0) /
                        reviewsList.length
                      ).toFixed(1)
                    : "N/A"}
                </h3>
                <span className="text-slate-500 text-xs">
                  Average gig rating ({reviewsList.length} reviews)
                </span>
              </div>
            </div>

            {/* Scheduled Confirmed Gigs */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-700">
                <h3 className="font-bold text-lg">
                  Your Upcoming Gig Calendar
                </h3>
                <Button
                  variant="link"
                  onClick={() => setActiveTab("bookings")}
                  className="text-rose-500 font-semibold text-xs flex items-center gap-1 hover:underline h-auto p-0 cursor-pointer"
                >
                  View Gig Log <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {bookingsList.filter(
                  (b) => b.status?.toUpperCase() === "CONFIRMED",
                ).length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    No confirmed gigs on your calendar yet. Use Discover to
                    request slots.
                  </div>
                ) : (
                  bookingsList
                    .filter((b) => b.status?.toUpperCase() === "CONFIRMED")
                    .map((booking) => (
                      <div
                        key={booking.id}
                        className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">
                            {booking.venue?.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />{" "}
                            {booking.venue?.address}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-2 block">
                            Date: {booking.date} | Time:{" "}
                            {to12h(booking.startTime)} –{" "}
                            {to12h(booking.endTime)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 dark:bg-emerald-950/20 dark:text-emerald-400">
                            Payout: ₹{booking.budget}
                          </span>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setActiveTab("messages");
                              startChat(booking.venue);
                            }}
                            className="rounded-xl text-xs font-semibold cursor-pointer h-9 px-4"
                          >
                            Message Host
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: PORTFOLIO
            ------------------------------------------------------------- */}
        {activeTab === "portfolio" && (
          <div className="max-w-3xl space-y-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Edit Portfolio
              </h1>
              <p className="text-slate-500 mt-1">
                Make your professional profile stand out to premium venue
                coordinators.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm dark:bg-slate-800 dark:border-slate-700">
              <form
                onSubmit={handleUpdatePortfolio}
                className="space-y-6 text-sm text-slate-700 dark:text-slate-300"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-semibold mb-1">
                      Artist Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={portfolioData.name}
                      onChange={(e) =>
                        setPortfolioData({
                          ...portfolioData,
                          name: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-850 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      Standard Gig rate (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={portfolioData.pricing}
                      onChange={(e) =>
                        setPortfolioData({
                          ...portfolioData,
                          pricing: Number(e.target.value),
                        })
                      }
                      className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-850 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-semibold mb-1 flex items-center justify-between">
                      <span>Profile Photo</span>
                      {pendingProfileFile && (
                        <span className="text-[10px] text-rose-500 font-bold animate-pulse">
                          Pending Upload
                        </span>
                      )}
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-750">
                          <img
                            src={pendingProfileFile ? URL.createObjectURL(pendingProfileFile) : (portfolioData.imageUrl || "/avatar-placeholder.png")}
                            alt="Profile Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 transition">
                            <span>{pendingProfileFile ? "Change Image" : "Upload Image"}</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 1024 * 1024) {
                                    setErrorMsg("Profile image size exceeds the 1MB limit.");
                                    return;
                                  }
                                  setPendingProfileFile(file);
                                  setErrorMsg("");
                                }
                              }}
                            />
                          </label>
                        </div>
                        {pendingProfileFile && (
                          <button
                            type="button"
                            onClick={() => setPendingProfileFile(null)}
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 transition"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={pendingProfileFile ? `[Queued for upload: ${pendingProfileFile.name}]` : portfolioData.imageUrl}
                        disabled={!!pendingProfileFile}
                        onChange={(e) =>
                          setPortfolioData({
                            ...portfolioData,
                            imageUrl: e.target.value,
                          })
                        }
                        placeholder="Or paste an image URL here..."
                        className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      Travel Radius (miles) *
                    </label>
                    <input
                      type="number"
                      required
                      value={portfolioData.travelRadius}
                      onChange={(e) =>
                        setPortfolioData({
                          ...portfolioData,
                          travelRadius: Number(e.target.value),
                        })
                      }
                      className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-850 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Biography / About
                  </label>
                  <textarea
                    rows={4}
                    value={portfolioData.biography}
                    onChange={(e) =>
                      setPortfolioData({
                        ...portfolioData,
                        biography: e.target.value,
                      })
                    }
                    placeholder="Tell venues about your style, gig history, and what makes your performance unique..."
                    className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-850 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-semibold mb-1">
                      Genres (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={portfolioData.genres}
                      onChange={(e) =>
                        setPortfolioData({
                          ...portfolioData,
                          genres: e.target.value,
                        })
                      }
                      placeholder="Folk, Pop, Acoustic"
                      className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-850 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      Languages (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={portfolioData.languages}
                      onChange={(e) =>
                        setPortfolioData({
                          ...portfolioData,
                          languages: e.target.value,
                        })
                      }
                      placeholder="English, Spanish"
                      className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-850 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-semibold mb-1">State</label>
                    <select
                      value={portfolioData.state}
                      onChange={(e) => {
                        const s = e.target.value;
                        let c = "Chandigarh";
                        if (s === "Karnataka") c = "Bengaluru";
                        else if (s === "Maharashtra") c = "Mumbai";
                        setPortfolioData({
                          ...portfolioData,
                          state: s,
                          city: c,
                        });
                      }}
                      className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-850 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    >
                      <option value="Punjab">Punjab</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Maharashtra">Maharashtra</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">City</label>
                    <select
                      value={portfolioData.city}
                      onChange={(e) =>
                        setPortfolioData({
                          ...portfolioData,
                          city: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-850 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    >
                      {portfolioData.state === "Punjab" && (
                        <option value="Chandigarh">Chandigarh</option>
                      )}
                      {portfolioData.state === "Karnataka" && (
                        <option value="Bengaluru">Bengaluru</option>
                      )}
                      {portfolioData.state === "Maharashtra" && (
                        <option value="Mumbai">Mumbai</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-semibold mb-1">
                      Experience Level
                    </label>
                    <input
                      type="text"
                      value={portfolioData.experience}
                      onChange={(e) =>
                        setPortfolioData({
                          ...portfolioData,
                          experience: e.target.value,
                        })
                      }
                      placeholder="e.g. 5+ years doing lounges"
                      className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-850 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      Technical Gear Requested (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={portfolioData.equipmentNeeded}
                      onChange={(e) =>
                        setPortfolioData({
                          ...portfolioData,
                          equipmentNeeded: e.target.value,
                        })
                      }
                      placeholder="2x Vocal Mics, DI box"
                      className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-850 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Gallery Section inside the form */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 dark:bg-slate-900/50 dark:border-slate-800">
                  <h3 className="text-lg font-bold tracking-tight mb-1">Media & Gallery</h3>
                  <p className="text-slate-500 mb-4 text-xs">
                    Add photos from your live performances. Upload will occur when you save the form.
                  </p>

                  {/* Upload Dropzone */}
                  <div className="mb-6">
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition dark:border-slate-700">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        {isUploading ? (
                          <div className="flex flex-col items-center space-y-1">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-500"></div>
                            <span className="text-xs font-medium text-slate-500">Processing images...</span>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="h-6 w-6 text-slate-400" />
                            <span className="text-xs font-semibold text-rose-500">Choose gallery photos</span>
                            <span className="text-[10px] text-slate-400">PNG, JPG or WEBP up to 1MB (Multiple allowed)</span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        disabled={isUploading}
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  </div>

                  {/* Image Grid (Saved + Pending) */}
                  {((portfolioData.photos && portfolioData.photos.length > 0) || pendingGalleryFiles.length > 0) ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {/* Saved Photos */}
                      {portfolioData.photos.map((photo: string, index: number) => {
                        const isPrimary = portfolioData.imageUrl === photo;
                        return (
                          <div key={`saved-${index}`} className="group relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <img
                              src={photo}
                              alt={`Portfolio photo ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {isPrimary && (
                              <div className="absolute top-2 left-2 bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                Primary
                              </div>
                            )}
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col justify-end p-2 space-y-1">
                              {!isPrimary && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryPhoto(photo)}
                                  className="w-full text-center text-[10px] font-semibold py-1 bg-white hover:bg-slate-100 text-slate-800 rounded shadow-sm transition cursor-pointer"
                                >
                                  Make Primary
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeletePhoto(photo)}
                                className="w-full text-center text-[10px] font-semibold py-1 bg-rose-500 hover:bg-rose-600 text-white rounded shadow-sm transition cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Pending Photos */}
                      {pendingGalleryFiles.map((file: File, index: number) => {
                        const localUrl = URL.createObjectURL(file);
                        return (
                          <div key={`pending-${index}`} className="group relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-rose-400 shadow-sm">
                            <img
                              src={localUrl}
                              alt={`Pending photo ${index + 1}`}
                              className="w-full h-full object-cover opacity-80"
                            />
                            <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                              Pending Upload
                            </div>
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col justify-end p-2">
                              <button
                                type="button"
                                onClick={() => setPendingGalleryFiles(prev => prev.filter((_, idx) => idx !== index))}
                                className="w-full text-center text-[10px] font-semibold py-1 bg-rose-500 hover:bg-rose-600 text-white rounded shadow-sm transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
                      <ImageIcon className="h-8 w-8 text-slate-300 mx-auto mb-1" />
                      <p className="text-slate-400 text-xs">No photos queued or uploaded yet.</p>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isUploading}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-6 rounded-xl transition shadow cursor-pointer disabled:bg-slate-400"
                >
                  {isUploading ? "Saving and Uploading..." : "Save Portfolio Details"}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: DISCOVER SLOTS (AIRBNB SEARCH)
            ------------------------------------------------------------- */}
        {activeTab === "discover" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Discover Available Slots
              </h1>
              <p className="text-slate-500 mt-1">
                Scan open venue slots, filter by capacity and gear, and apply to
                perform.
              </p>
            </div>

            {/* Airbnb Style Filter Bar */}
            <form
              onSubmit={handleSearch}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm dark:bg-slate-800 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-8 gap-4 text-xs font-semibold"
            >
              <div>
                <label className="block text-slate-400 mb-1">LOCATION</label>
                <input
                  type="text"
                  value={searchFilters.location}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      location: e.target.value,
                    })
                  }
                  placeholder="Where?"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none dark:bg-slate-900 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">DATE</label>
                <input
                  type="date"
                  value={searchFilters.date}
                  onChange={(e) =>
                    setSearchFilters({ ...searchFilters, date: e.target.value })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none dark:bg-slate-900 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  BUDGET UP TO (${searchFilters.budget})
                </label>
                <input
                  type="range"
                  min="100"
                  max="1500"
                  step="50"
                  value={searchFilters.budget}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      budget: Number(e.target.value),
                    })
                  }
                  className="w-full mt-2 accent-rose-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">VENUE TYPE</label>
                <select
                  value={searchFilters.venueType}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      venueType: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none dark:bg-slate-900 dark:border-slate-700"
                >
                  <option value="">All Types</option>
                  {[
                    "Café",
                    "Restaurant",
                    "Hotel",
                    "Club",
                    "Brewery",
                    "Resort",
                    "Banquet Hall",
                  ].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  EQUIPMENT SEARCH
                </label>
                <input
                  type="text"
                  value={searchFilters.equipment}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      equipment: e.target.value,
                    })
                  }
                  placeholder="e.g. Mic, DJ"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none dark:bg-slate-900 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">STATE</label>
                <select
                  value={searchFilters.state}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      state: e.target.value,
                      city: "All",
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none dark:bg-slate-900 dark:border-slate-700"
                >
                  <option value="All">All States</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Maharashtra">Maharashtra</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">CITY</label>
                <select
                  value={searchFilters.city}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      city: e.target.value,
                    })
                  }
                  disabled={searchFilters.state === "All"}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none dark:bg-slate-900 dark:border-slate-700"
                >
                  <option value="All">All Cities</option>
                  {searchFilters.state === "Punjab" && (
                    <option value="Chandigarh">Chandigarh</option>
                  )}
                  {searchFilters.state === "Karnataka" && (
                    <option value="Bengaluru">Bengaluru</option>
                  )}
                  {searchFilters.state === "Maharashtra" && (
                    <option value="Mumbai">Mumbai</option>
                  )}
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  type="submit"
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-6 rounded-xl transition shadow cursor-pointer"
                >
                  Filter Slots
                </Button>
              </div>
            </form>

            {/* Venues Grid — one card per venue, slots grouped */}
            {(() => {
              // Group slots by venueId
              const venueMap = new Map<string, { venue: any; slots: any[] }>();
              slotsList.forEach((slot: any) => {
                const vid = slot.venueId ?? slot.venue?.id;
                if (!venueMap.has(vid)) {
                  venueMap.set(vid, { venue: slot.venue, slots: [] });
                }
                venueMap.get(vid)!.slots.push(slot);
              });
              const venueGroups = Array.from(venueMap.values());

              if (venueGroups.length === 0) {
                return (
                  <div className="py-16 bg-white border border-slate-200 rounded-3xl text-center text-slate-500 dark:bg-slate-800 dark:border-slate-700 text-sm">
                    No available slots found. Try adjusting your filters.
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {venueGroups.map(({ venue, slots }) => {
                    const minPayout = Math.min(
                      ...slots.map((s: any) => s.budget),
                    );
                    const maxPayout = Math.max(
                      ...slots.map((s: any) => s.budget),
                    );
                    const availableCount = slots.filter(
                      (s: any) => s.status?.toUpperCase() === "AVAILABLE",
                    ).length;
                    const pendingCount = slots.filter(
                      (s: any) => s.status?.toUpperCase() === "PENDING",
                    ).length;

                    return (
                      <div
                        key={venue?.id ?? slots[0]?.venueId}
                        className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between dark:bg-slate-800 dark:border-slate-700 group"
                      >
                        {/* Venue Image */}
                        <div className="relative h-44 bg-slate-100">
                          <img
                            src={venue?.imageUrl}
                            alt={venue?.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Payout badge */}
                          <span className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-extrabold shadow">
                            {minPayout === maxPayout
                              ? `₹${minPayout}`
                              : `₹${minPayout}–₹${maxPayout}`}{" "}
                            Payout
                          </span>
                          {/* Slot count bubble */}
                          <span className="absolute bottom-4 left-4 bg-white/90 backdrop-blur text-slate-900 text-[11px] font-bold px-3 py-1.5 rounded-full shadow flex items-center gap-1.5">
                            <CalendarIcon className="w-3.5 h-3.5 text-rose-500" />
                            {slots.length} slot{slots.length !== 1 ? "s" : ""}{" "}
                            open
                          </span>
                        </div>

                        {/* Info */}
                        <div className="p-5 flex-1 space-y-3 text-xs font-semibold text-slate-550 dark:text-slate-300">
                          <div>
                            <span className="text-[10px] text-rose-500 font-bold block mb-0.5">
                              {venue?.type}
                            </span>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                              {venue?.name}
                            </h3>
                            {venue?.hasVoiceAssistant && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50">
                                <Mic className="w-2.5 h-2.5" /> AI Receptionist
                                Active
                              </span>
                            )}
                            <p className="text-[10px] text-slate-400 mt-1 flex flex-wrap items-center gap-1 font-medium">
                              <MapPin className="w-3 h-3 text-rose-500" />
                              <span>{venue?.address}</span>
                              {slots[0]?.organization?.city &&
                                slots[0]?.organization?.state && (
                                  <span className="ml-1 text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full dark:bg-slate-700 dark:text-slate-300">
                                    {slots[0].organization.city},{" "}
                                    {slots[0].organization.state}
                                  </span>
                                )}
                            </p>
                          </div>

                          {/* Slot status chips */}
                          <div className="flex gap-2 flex-wrap">
                            {availableCount > 0 && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full dark:bg-emerald-955/20 dark:text-emerald-400 dark:border-emerald-900">
                                {availableCount} Available
                              </span>
                            )}
                            {pendingCount > 0 && (
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-full dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900">
                                {pendingCount} Pending
                              </span>
                            )}
                          </div>

                          <p className="font-medium text-slate-500 leading-relaxed line-clamp-2">
                            {venue?.description}
                          </p>
                        </div>

                        {/* CTA */}
                        <div className="p-5 border-t border-slate-100 dark:border-slate-700">
                          <Button
                            onClick={() => {
                              setSelectedVenueSlots({ venue, slots });
                              setSelectedSlotIds([]);
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-6 rounded-xl transition text-xs cursor-pointer"
                          >
                            View {slots.length} Slot
                            {slots.length !== 1 ? "s" : ""} & Apply
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: GIGS BOOKED / BOOKINGS
            ------------------------------------------------------------- */}
        {activeTab === "bookings" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Your Scheduled Gigs
              </h1>
              <p className="text-slate-500 mt-1">
                Track the approval progress of requested slots and leave reviews
                post-show.
              </p>
            </div>

            <BookingTimeline bookings={bookingsList} viewType="performer" />

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {bookingsList.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-sm">
                    You have not requested or booked any slots yet.
                  </div>
                ) : (
                  bookingsList.map((booking) => {
                    const todayStr = toLocalISOString(new Date());
                    const isPast =
                      booking.date <= todayStr &&
                      booking.status?.toUpperCase() === "CONFIRMED";

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
                                booking.status?.toUpperCase() === "CONFIRMED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : booking.status?.toUpperCase() === "PENDING"
                                    ? "bg-amber-100 text-amber-800"
                                    : booking.status?.toUpperCase() ===
                                        "REJECTED"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-slate-200"
                              }`}
                            >
                              {booking.status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 mt-1">
                            Address: {booking.venue?.address} | Date:{" "}
                            {booking.date} | Time: {to12h(booking.startTime)} –{" "}
                            {to12h(booking.endTime)}
                          </p>
                          <span className="inline-block mt-2 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full dark:bg-emerald-950/20 dark:text-emerald-400">
                            Offer: ₹{booking.budget}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          {isPast && (
                            <Button
                              onClick={() => setShowAddReviewModal(booking)}
                              className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold cursor-pointer h-9 px-3.5"
                            >
                              <Star className="w-3.5 h-3.5" /> Review Venue
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setActiveTab("messages");
                              startChat(booking.venue);
                            }}
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
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: MESSAGES / CHAT
            ------------------------------------------------------------- */}
        {activeTab === "messages" && (
          <div className="h-[calc(100vh-8rem)] flex bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm dark:bg-slate-800 dark:border-slate-700 w-full min-w-0">
            {/* Host Chats List sidebar */}
            <div className={`w-full md:w-80 flex flex-col bg-slate-50/50 dark:bg-slate-900/10 ${activeVenueId ? "hidden md:flex" : "flex"}`}>
              <div className="p-4 space-y-3 flex-shrink-0">
                <h3 className="font-bold text-slate-855 dark:text-white">
                  Venue Hosts Chats
                </h3>
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
                {venuesList
                  .filter((v) =>
                    v.name
                      .toLowerCase()
                      .includes(messageSearchQuery.toLowerCase()),
                  )
                  .map((venue) => {
                    const isActive = activeVenueId === venue.id;
                    return (
                      <button
                        key={venue.id}
                        onClick={() => startChat(venue)}
                        className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3 ${
                          isActive
                            ? "bg-white dark:bg-slate-800 shadow-md border-l-4 border-rose-500 scale-[1.01]"
                            : "hover:bg-white/80 dark:hover:bg-slate-800/40 hover:shadow-sm"
                        }`}
                      >
                        <div className="w-10 h-10 bg-slate-200 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={venue.imageUrl}
                            alt={venue.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-xs truncate text-slate-900 dark:text-white">
                            {venue.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {venue.address}
                          </p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Active chat window */}
            <div className={`flex-1 flex flex-col justify-between bg-slate-100/30 dark:bg-slate-950/10 min-w-0 ${activeVenueId ? "flex" : "hidden md:flex"}`}>
              {activeVenueId ? (
                <>
                  {/* Chat header */}
                  <div className="px-6 py-4 bg-white flex items-center justify-between dark:bg-slate-800 shadow-sm z-10 flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => setActiveVenueId(null)}
                        className="md:hidden text-slate-500 hover:text-slate-900 p-1 mr-1 rounded-md hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 flex-shrink-0"
                        title="Back to Chats"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm md:text-base min-w-0 flex-1 font-sans">
                        {venuesList.find((v) => v.id === activeVenueId)?.name}{" "}
                        (Host Coordinator)
                      </h4>
                    </div>
                  </div>

                  {/* Chat Message feed */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                        Send a message to sync with the venue host coordinator.
                      </div>
                    ) : (
                      chatMessages.map((msg) => {
                        const isMe = msg.senderId === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] p-3.5 rounded-2xl text-xs font-medium shadow-sm leading-relaxed ${
                                isMe
                                  ? "bg-rose-500 text-white rounded-br-none"
                                  : "bg-white text-slate-850 rounded-bl-none border border-slate-200 dark:bg-slate-800 dark:text-slate-250 dark:border-slate-700"
                              }`}
                            >
                              <p>{msg.content}</p>
                              <span
                                className={`block text-[9px] mt-1.5 ${isMe ? "text-white/60" : "text-slate-450"}`}
                              >
                                {new Date(msg.timestamp).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
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
                        "Sure, I can do that.",
                        "Can you send the tech rider?",
                        "What time is soundcheck?",
                        "Yes, the rate works for me.",
                      ].map((reply, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNewMessageText(reply)}
                          className="whitespace-nowrap px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-[10px] font-semibold transition dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
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
                  <MessageSquare className="w-12 h-12 text-slate-355" />
                  <span>
                    Select a venue host on the left sidebar to start messaging.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: NOTIFICATIONS FEED
            ------------------------------------------------------------- */}
        {activeTab === "notifications" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Notifications
              </h1>
              <p className="text-slate-550 mt-1">
                Stay updated on your booking requests, approvals, and reviews.
              </p>
            </div>

            {/* Filter Tabs and Mark All As Read */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <div className="flex gap-2">
                <button
                  onClick={() => setNotificationFilter("All")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${notificationFilter === "All" ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                >
                  All
                </button>
                <button
                  onClick={() => setNotificationFilter("Unread")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${notificationFilter === "Unread" ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                >
                  Unread
                </button>
              </div>
              <button
                onClick={() =>
                  setNotificationsList(
                    notificationsList.map((n) => ({ ...n, read: true })),
                  )
                }
                className="flex items-center gap-2 text-xs font-bold text-rose-500 hover:text-rose-600 px-4 py-2"
              >
                <Check className="w-4 h-4" />
                Mark all as read
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {notificationsList.filter(
                  (n) => notificationFilter === "All" || !n.read,
                ).length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-sm">
                    No notifications received.
                  </div>
                ) : (
                  notificationsList
                    .filter((n) => notificationFilter === "All" || !n.read)
                    .map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-5 flex items-center justify-between gap-4 transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                          notif.read
                            ? "opacity-70 bg-transparent"
                            : "bg-rose-50/10"
                        }`}
                      >
                        <div className="flex gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                              notif.type === "booking"
                                ? "bg-blue-100 text-blue-500"
                                : notif.type === "message"
                                  ? "bg-amber-100 text-amber-500"
                                  : "bg-emerald-100 text-emerald-500"
                            }`}
                          >
                            {notif.type === "booking" ? (
                              <CalendarIcon className="w-5 h-5" />
                            ) : notif.type === "message" ? (
                              <MessageSquare className="w-5 h-5" />
                            ) : (
                              <Bell className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4
                                className={`text-sm ${notif.read ? "font-semibold text-slate-700 dark:text-slate-300" : "font-extrabold text-slate-900 dark:text-white"}`}
                              >
                                {notif.title}
                              </h4>
                              {!notif.read && (
                                <div className="w-2 h-2 rounded-full bg-rose-500" />
                              )}
                            </div>
                            <p
                              className={`mt-0.5 text-xs ${notif.read ? "text-slate-400" : "text-slate-600 dark:text-slate-400"}`}
                            >
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-slate-400 block mt-1">
                              {new Date(notif.createdAt).toLocaleDateString()}{" "}
                              at{" "}
                              {new Date(notif.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                        </div>

                        {!notif.read && (
                          <Button
                            variant="secondary"
                            onClick={() => handleMarkRead(notif.id)}
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
        )}

        {/* -------------------------------------------------------------
            TAB: REVIEWS RECEIVED
            ------------------------------------------------------------- */}
        {activeTab === "reviews" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Artist Reviews
              </h1>
              <p className="text-slate-550 mt-1">
                Reviews submitted by hosts and venue coordinators after you
                performed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviewsList.length === 0 ? (
                <div className="col-span-2 py-12 bg-white border border-slate-200 rounded-3xl text-center text-slate-500 text-sm dark:bg-slate-800 dark:border-slate-700">
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
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 fill-amber-400 text-amber-400"
                          />
                        ))}
                        {Array.from({ length: 5 - review.rating }).map(
                          (_, i) => (
                            <Star key={i} className="w-4 h-4 text-slate-300" />
                          ),
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm text-slate-650 dark:text-slate-300 italic font-medium">
                      "{review.comment}"
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 dark:border-slate-700">
                      <span>
                        Booking Gig ID: {review.bookingId.substring(0, 8)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* VENUE + SLOTS DIALOG (grouped, checkbox-based) */}
      <Dialog
        open={!!selectedVenueSlots}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedVenueSlots(null);
            setSelectedSlotIds([]);
          }
        }}
      >
        <DialogContent
          className="max-w-xl w-full max-h-[90vh] overflow-y-auto p-8 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-750 rounded-3xl"
          showCloseButton={true}
        >
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold text-left">
              Venue details &amp; Gig Offers
            </DialogTitle>
          </DialogHeader>

          {selectedVenueSlots && (
            <div className="space-y-6 text-sm">
              {/* Venue hero with Slideshow */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950">
                <ImageSlideshow
                  images={[
                    selectedVenueSlots.venue?.imageUrl,
                    ...(selectedVenueSlots.venue?.photos || [])
                  ].filter(Boolean)}
                />
                <div className="absolute bottom-4 left-4 pointer-events-none z-10">
                  <span className="text-[10px] text-rose-300 font-bold uppercase block drop-shadow-sm">
                    {selectedVenueSlots.venue?.type}
                  </span>
                  <h4 className="text-xl font-extrabold text-white leading-tight drop-shadow-md">
                    {selectedVenueSlots.venue?.name}
                  </h4>
                  <p className="text-xs text-white/90 mt-0.5 flex items-center gap-1 drop-shadow-md">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    {selectedVenueSlots.venue?.address}
                  </p>
                </div>
              </div>

              {/* About */}
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">
                  About the Venue
                </span>
                <p className="text-slate-600 dark:text-slate-350 leading-relaxed text-xs">
                  {selectedVenueSlots.venue?.description}
                </p>
              </div>

              {/* Policies + Equipment */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-1.5">
                    Policies &amp; Guidelines
                  </span>
                  <ul className="space-y-1 text-slate-650 dark:text-slate-300 font-medium">
                    {selectedVenueSlots.venue?.policies?.map(
                      (p: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <span>{p}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-1.5">
                    Technical Gear Provided
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedVenueSlots.venue?.equipment?.map((eq: string) => (
                      <span
                        key={eq}
                        className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold dark:bg-slate-700 dark:text-slate-300"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Slot checkbox list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Select Slots to Apply
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const available = selectedVenueSlots.slots.filter(
                        (s: any) => s.status?.toUpperCase() === "AVAILABLE",
                      );
                      setSelectedSlotIds(
                        selectedSlotIds.length === available.length
                          ? []
                          : available.map((s: any) => s.id),
                      );
                    }}
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-600 underline cursor-pointer"
                  >
                    {selectedSlotIds.length ===
                    selectedVenueSlots.slots.filter(
                      (s: any) => s.status?.toUpperCase() === "AVAILABLE",
                    ).length
                      ? "Deselect all"
                      : "Select all available"}
                  </button>
                </div>

                <div className="space-y-2">
                  {[...selectedVenueSlots.slots]
                    .sort((a: any, b: any) => {
                      const da = a.date + "T" + a.startTime;
                      const db = b.date + "T" + b.startTime;
                      return da < db ? -1 : da > db ? 1 : 0;
                    })
                    .map((slot: any) => {
                      const isAvailable =
                        slot.status?.toUpperCase() === "AVAILABLE";
                      const isChecked = selectedSlotIds.includes(slot.id);
                      return (
                        <label
                          key={slot.id}
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            !isAvailable
                              ? "opacity-50 cursor-not-allowed border-slate-150 bg-slate-50 dark:bg-slate-900 dark:border-slate-750"
                              : isChecked
                                ? "border-rose-400 bg-rose-50 dark:bg-rose-955/20 dark:border-rose-700"
                                : "border-slate-200 bg-white hover:border-rose-300 dark:bg-slate-850 dark:border-slate-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={!isAvailable}
                            checked={isChecked}
                            onChange={() => {
                              if (!isAvailable) return;
                              setSelectedSlotIds((prev) =>
                                prev.includes(slot.id)
                                  ? prev.filter((id) => id !== slot.id)
                                  : [...prev, slot.id],
                              );
                            }}
                            className="accent-rose-500 w-4 h-4 flex-shrink-0 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800 dark:text-white">
                                {slot.date} &nbsp;·&nbsp;{" "}
                                {to12h(slot.startTime)} – {to12h(slot.endTime)}
                              </span>
                              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                                ₹{slot.budget}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold mt-0.5 block ${
                                slot.status?.toUpperCase() === "AVAILABLE"
                                  ? "text-emerald-500"
                                  : slot.status?.toUpperCase() === "PENDING"
                                    ? "text-amber-500"
                                    : "text-slate-400"
                              }`}
                            >
                              {slot.status}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Book button */}
              <Button
                disabled={selectedSlotIds.length === 0}
                onClick={handleBookSelected}
                className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-6 rounded-xl shadow transition text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {selectedSlotIds.length === 0
                  ? "Select at least one slot"
                  : `Request ${selectedSlotIds.length} Slot${selectedSlotIds.length > 1 ? "s" : ""}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* REVIEW VENUE MODAL */}
      <Dialog
        open={!!showAddReviewModal}
        onOpenChange={(open) => {
          if (!open) setShowAddReviewModal(null);
        }}
      >
        <DialogContent
          className="max-w-sm w-full p-6 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-750 rounded-3xl"
          showCloseButton={true}
        >
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-left">
              Review Venue
            </DialogTitle>
          </DialogHeader>

          {showAddReviewModal && (
            <form
              onSubmit={handleSubmitReview}
              className="space-y-4 text-xs text-slate-755 dark:text-slate-300"
            >
              <div>
                <label className="block font-bold mb-1.5">
                  Rating (1 to 5 Stars)
                </label>
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
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1.5">
                  Feedback / Comments
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell other artists about the sound system, staff, and overall experience..."
                  className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-850 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-6 rounded-xl transition mt-2 text-sm shadow cursor-pointer"
              >
                Submit Review
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

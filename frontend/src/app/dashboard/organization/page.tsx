"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building,
  Calendar as CalendarIcon,
  Briefcase,
  MessageSquare,
  Bell,
  Star,
  LogOut,
  Plus,
  Edit3,
  Trash2,
  Users,
  Check,
  X,
  Send,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  MapPin,
  DollarSign,
  ShieldAlert,
  BookOpen,
  Search,
  Paperclip,
  Mic,
} from "lucide-react";
import { api } from "@/lib/api";
import { to12h, toLocalISOString } from "@/lib/utils";
import Sidebar, { SidebarItem } from "@/components/Sidebar";
import GlobalSearch from "@/components/GlobalSearch";
import OnboardingChecklist from "@/components/OnboardingChecklist";
import VoiceAITab from "@/components/VoiceAITab";
import {
  RevenueChart,
  BookingFunnel,
  TopPerformerCard,
  OccupancyHeatmap,
} from "@/components/Analytics";
import { BookingTimeline } from "@/components/BookingTimeline";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function OrganizationDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "venues"
    | "calendar"
    | "bookings"
    | "messages"
    | "notifications"
    | "reviews"
    | "managers"
    | "discover"
    | "voiceai"
  >("overview");

  // Data State
  const [venuesList, setVenuesList] = useState<any[]>([]);
  const [slotsList, setSlotsList] = useState<any[]>([]);
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [reviewsList, setReviewsList] = useState<any[]>([]);

  // UI states
  const [isBulkCreateMode, setIsBulkCreateMode] = useState(false);

  // Messaging state
  const [performersList, setPerformersList] = useState<any[]>([]);
  const [activePerformerId, setActivePerformerId] = useState<string | null>(
    null,
  );
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [notificationFilter, setNotificationFilter] = useState("All");
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | null>(
    null,
  );
  const [performerSearchQuery, setPerformerSearchQuery] = useState("");
  const [performerGenreFilter, setPerformerGenreFilter] = useState("All");
  const [performerMaxRate, setPerformerMaxRate] = useState(1000);

  // Form states
  const [venueSearchQuery, setVenueSearchQuery] = useState("");
  const [venueTypeFilter, setVenueTypeFilter] = useState("All");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("All");
  const [bookingSort, setBookingSort] = useState("dateAsc");
  const [showAddVenueModal, setShowAddVenueModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState<any | null>(null);
  const [newVenueData, setNewVenueData] = useState({
    name: "",
    address: "",
    description: "",
    capacity: 50,
    type: "Café",
    equipment: "",
    policies: "",
    imageUrl: "",
  });

  const [selectedCalendarVenue, setSelectedCalendarVenue] =
    useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    toLocalISOString(new Date()),
  );
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [newSlotData, setNewSlotData] = useState({
    startTime: "19:00",
    endTime: "22:00",
    budget: 150,
    status: "Available" as "Available" | "Blocked",
  });

  const [performerDetailsModal, setPerformerDetailsModal] = useState<
    any | null
  >(null);
  const [selectedVenueDetails, setSelectedVenueDetails] = useState<any | null>(
    null,
  );
  const [showAddReviewModal, setShowAddReviewModal] = useState<any | null>(
    null,
  ); // booking object
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // Managers State
  const [managersList, setManagersList] = useState<any[]>([]);
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  const [newManagerData, setNewManagerData] = useState({
    name: "",
    email: "",
    venueId: "",
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Authentication check
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const loggedUser = JSON.parse(userStr);
    if (loggedUser.role !== "organization") {
      if (loggedUser.role === "performer") {
        router.push("/dashboard/performer");
      } else {
        localStorage.clear();
        router.push("/login");
      }
      return;
    }
    setUser(loggedUser);
    const queryOrgId = loggedUser.isManager
      ? loggedUser.parentOrgId
      : loggedUser.id;
    loadAllData(loggedUser, queryOrgId);

    // Removed polling interval for stability testing
    // const interval = setInterval(() => {
    //   refreshNotificationsAndMessages(loggedUser, queryOrgId);
    // }, 5000);

    // return () => clearInterval(interval);
  }, [router]);

  const loadAllData = async (loggedUser: any, queryOrgId: string) => {
    setLoading(true);
    try {
      // Venues
      const resVenues = await api.getVenues();
      let orgVenues = resVenues.data.filter(
        (v) => v.organizationId === queryOrgId,
      );
      if (loggedUser.isManager) {
        orgVenues = orgVenues.filter(
          (v) => v.managerIds && v.managerIds.includes(loggedUser.id),
        );
      }
      setVenuesList(orgVenues);
      if (orgVenues.length > 0) {
        setSelectedCalendarVenue(orgVenues[0].id);
      }

      // Slots
      const resSlots = await api.getSlots();
      let orgSlots = resSlots.data;
      if (loggedUser.isManager) {
        const managedVenueIds = orgVenues.map((v) => v.id);
        orgSlots = orgSlots.filter((s: any) =>
          managedVenueIds.includes(s.venueId),
        );
      }
      setSlotsList(orgSlots);

      // Bookings
      const resBookings = await api.getBookings({ organizationId: queryOrgId });
      let orgBookings = resBookings.data;
      if (loggedUser.isManager) {
        const managedVenueIds = orgVenues.map((v) => v.id);
        orgBookings = orgBookings.filter((b: any) =>
          managedVenueIds.includes(b.venueId),
        );
      }
      setBookingsList(orgBookings);

      // Notifications
      const resNotif = await api.getNotifications(queryOrgId);
      let orgNotif = resNotif.data;
      if (loggedUser.isManager) {
        const managedVenueNames = orgVenues.map((v) => v.name.toLowerCase());
        orgNotif = orgNotif.filter((n: any) =>
          managedVenueNames.some((name) =>
            n.message.toLowerCase().includes(name),
          ),
        );
      }
      setNotificationsList(orgNotif);

      // Performers list for messaging
      const resPerf = await api.getPerformers();
      setPerformersList(resPerf.data);

      // Reviews
      const resReviews = await api.getReviews(queryOrgId);
      let orgReviews = resReviews.data;
      if (loggedUser.isManager) {
        const managedVenueIds = orgVenues.map((v) => v.id);
        orgReviews = orgReviews.filter((r: any) => {
          const booking = resBookings.data.find(
            (b: any) => b.id === r.bookingId,
          );
          return booking && managedVenueIds.includes(booking.venueId);
        });
      }
      setReviewsList(orgReviews);

      // Load managers if Owner
      if (!loggedUser.isManager) {
        loadManagersList(queryOrgId);
      }
    } catch (err: any) {
      setErrorMsg("Failed to load dashboard data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadManagersList = async (orgId: string) => {
    try {
      const res = await api.getManagers(orgId);
      setManagersList(res.data);
    } catch (e) {
      // silent fail
    }
  };

  const refreshNotificationsAndMessages = async (
    loggedUser: any,
    queryOrgId: string,
  ) => {
    try {
      const resNotif = await api.getNotifications(queryOrgId);
      let orgNotif = resNotif.data;
      if (loggedUser.isManager) {
        const managedVenueNames = venuesList.map((v) => v.name.toLowerCase());
        orgNotif = orgNotif.filter((n: any) =>
          managedVenueNames.some((name) =>
            n.message.toLowerCase().includes(name),
          ),
        );
      }
      setNotificationsList(orgNotif);

      if (activePerformerId) {
        const perf = performersList.find((p) => p.id === activePerformerId);
        if (perf) {
          const resMsgs = await api.getMessages(queryOrgId, perf.userId);
          setChatMessages(resMsgs.data);
        }
      }
    } catch (e) {
      // silent fail during polling
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  // -------------------------------------------------------------
  // VENUE CRUD FUNCTIONS
  // -------------------------------------------------------------
  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const formattedData = {
        organizationId: user.id,
        name: newVenueData.name,
        address: newVenueData.address,
        description: newVenueData.description,
        capacity: Number(newVenueData.capacity),
        type: newVenueData.type,
        equipment: newVenueData.equipment
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
        policies: newVenueData.policies
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
        imageUrl: newVenueData.imageUrl,
      };

      const res = await api.createVenue(formattedData);
      if (res.success) {
        setVenuesList([...venuesList, res.data]);
        if (!selectedCalendarVenue) {
          setSelectedCalendarVenue(res.data.id);
        }
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
        });
        setSuccessMsg("Venue created successfully!");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleUpdateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVenue) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const formattedData = {
        name: editingVenue.name,
        address: editingVenue.address,
        description: editingVenue.description,
        capacity: Number(editingVenue.capacity),
        type: editingVenue.type,
        equipment: Array.isArray(editingVenue.equipment)
          ? editingVenue.equipment
          : editingVenue.equipment
              .split(",")
              .map((i: string) => i.trim())
              .filter(Boolean),
        policies: Array.isArray(editingVenue.policies)
          ? editingVenue.policies
          : editingVenue.policies
              .split(",")
              .map((i: string) => i.trim())
              .filter(Boolean),
        imageUrl: editingVenue.imageUrl,
      };

      const res = await api.updateVenue(editingVenue.id, formattedData);
      if (res.success) {
        setVenuesList(
          venuesList.map((v) => (v.id === editingVenue.id ? res.data : v)),
        );
        setEditingVenue(null);
        setSuccessMsg("Venue updated successfully!");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteVenue = async (venueId: string) => {
    if (!confirm("Are you sure you want to delete this venue?")) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.deleteVenue(venueId);
      if (res.success) {
        setVenuesList(venuesList.filter((v) => v.id !== venueId));
        setSuccessMsg("Venue deleted successfully.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg("");
    setSuccessMsg("");

    if (!newManagerData.venueId) {
      setErrorMsg("Please select a venue to assign the manager to.");
      return;
    }

    try {
      const res = await api.createManager(user.id, newManagerData);
      if (res.success) {
        setManagersList([...managersList, res.data]);
        setShowAddManagerModal(false);
        setNewManagerData({ name: "", email: "", venueId: "" });
        setSuccessMsg("Venue Manager created successfully!");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // -------------------------------------------------------------
  // CALENDAR FUNCTIONS
  // -------------------------------------------------------------
  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCalendarVenue) {
      setErrorMsg("Please select a venue first");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const formattedData = {
        venueId: selectedCalendarVenue,
        date: selectedDate,
        startTime: newSlotData.startTime,
        endTime: newSlotData.endTime,
        budget: Number(newSlotData.budget),
        status: newSlotData.status,
      };

      const res = await api.createSlot(formattedData);
      if (res.success) {
        setSlotsList([...slotsList, res.data]);
        setShowAddSlotModal(false);
        setSuccessMsg("Calendar slot created successfully!");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Are you sure you want to delete this availability slot?"))
      return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.deleteSlot(slotId);
      if (res.success) {
        setSlotsList(slotsList.filter((s) => s.id !== slotId));
        setSuccessMsg("Slot deleted successfully.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handlePrevMonth = () => {
    const current = selectedDate ? new Date(selectedDate) : new Date();
    current.setMonth(current.getMonth() - 1);
    current.setDate(1);
    setSelectedDate(toLocalISOString(current));
  };

  const handleNextMonth = () => {
    const current = selectedDate ? new Date(selectedDate) : new Date();
    current.setMonth(current.getMonth() + 1);
    current.setDate(1);
    setSelectedDate(toLocalISOString(current));
  };

  // Render month grid helpers
  const getDaysInMonth = () => {
    const now = selectedDate ? new Date(selectedDate) : new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  // -------------------------------------------------------------
  // BOOKINGS CONTROL
  // -------------------------------------------------------------
  const handleApproveBooking = async (bookingId: string) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.approveBooking(bookingId);
      if (res.success) {
        setBookingsList(
          bookingsList.map((b) =>
            b.id === bookingId ? { ...b, status: "Confirmed" } : b,
          ),
        );
        // refresh slots
        const resSlots = await api.getSlots();
        setSlotsList(resSlots.data);
        setSuccessMsg("Booking confirmed! Slot is now reserved.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.rejectBooking(bookingId);
      if (res.success) {
        setBookingsList(
          bookingsList.map((b) =>
            b.id === bookingId ? { ...b, status: "Rejected" } : b,
          ),
        );
        // refresh slots
        const resSlots = await api.getSlots();
        setSlotsList(resSlots.data);
        setSuccessMsg("Booking request declined. Slot returned to Available.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // -------------------------------------------------------------
  // MESSAGING FUNCTIONS
  // -------------------------------------------------------------
  const startChat = async (performer: any) => {
    if (!user) return;
    setActivePerformerId(performer.id);
    try {
      const res = await api.getMessages(user.id, performer.userId);
      setChatMessages(res.data);
    } catch (err: any) {
      setErrorMsg("Failed to load chat history");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !user || !activePerformerId) return;

    const perf = performersList.find((p) => p.id === activePerformerId);
    if (!perf) return;

    try {
      const res = await api.sendMessage(
        user.id,
        perf.userId,
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
  // REVIEW FUNCTIONS
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
        revieweeId: showAddReviewModal.performerId,
        rating: reviewRating,
        comment: reviewComment,
      };

      const res = await api.createReview(data);
      if (res.success) {
        setReviewsList([...reviewsList, res.data]);
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

  // Filter components
  const selectedVenueSlots = slotsList.filter(
    (s) => s.venueId === selectedCalendarVenue,
  );
  const selectedDaySlots = selectedVenueSlots.filter(
    (s) => s.date === selectedDate,
  );
  const unreadNotifCount = notificationsList.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading your Venue Dashboard...</p>
        </div>
      </div>
    );
  }
  const sidebarItems: SidebarItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    {
      id: "venues",
      label: "My Venues",
      icon: Building,
      badge: venuesList.length,
    },
    { id: "calendar", label: "Availability Slots", icon: CalendarIcon },
    {
      id: "bookings",
      label: "Bookings",
      icon: Briefcase,
      badge:
        bookingsList.filter((b) => b.status === "Pending").length || undefined,
      badgeColor: "bg-amber-500/20 text-amber-400",
      isPendingDot:
        bookingsList.filter((b) => b.status === "Pending").length > 0,
    },
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
    { id: "voiceai", label: "Voice AI", icon: Mic },
    { id: "discover", label: "Find Performers", icon: Search },
    ...(!user?.isManager
      ? [
          {
            id: "managers",
            label: "Venue Managers",
            icon: Users,
            badge: managersList.length,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-55 text-slate-800 flex font-sans dark:bg-slate-955 dark:text-slate-100">
      <GlobalSearch
        venues={venuesList}
        performers={performersList}
        onSelectTab={setActiveTab}
      />
      {/* Sidebar Navigation */}
      <Sidebar
        user={user}
        userSubtitle={user?.isManager ? "Venue Manager" : "Organization Portal"}
        items={sidebarItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        handleLogout={handleLogout}
        title={user?.isManager ? "StageHub Manager" : "StageHub Host"}
        logo={CalendarIcon}
      />

      {/* Main Content Area */}
      <main className="flex-1 bg-slate-50 overflow-y-auto p-8 dark:bg-slate-900">
        {/* Banner Messages */}
        {errorMsg && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3 text-sm dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3 text-sm dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400">
            <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: OVERVIEW
            ------------------------------------------------------------- */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-in">
            <OnboardingChecklist
              venuesCount={venuesList.length}
              slotsCount={slotsList.length}
              hasProfileImage={false}
            />

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Welcome, {user?.name}
              </h1>
              <p className="text-slate-500 mt-1">
                Here is a quick glance at your hospitality booking metrics.
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                <Building className="w-8 h-8 text-rose-500 mb-4" />
                <h3 className="text-2xl font-bold">{venuesList.length}</h3>
                <span className="text-slate-500 text-xs">
                  Active Venues managed
                </span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                <CalendarIcon className="w-8 h-8 text-emerald-500 mb-4" />
                <h3 className="text-2xl font-bold">
                  {slotsList.filter((s) => s.status === "Available").length}
                </h3>
                <span className="text-slate-500 text-xs">
                  Open slots listed
                </span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                <Briefcase className="w-8 h-8 text-amber-500 mb-4" />
                <h3 className="text-2xl font-bold">
                  {bookingsList.filter((b) => b.status === "Pending").length}
                </h3>
                <span className="text-slate-500 text-xs">
                  Pending gig requests
                </span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                <Check className="w-8 h-8 text-blue-500 mb-4" />
                <h3 className="text-2xl font-bold">
                  {bookingsList.filter((b) => b.status === "Confirmed").length}
                </h3>
                <span className="text-slate-500 text-xs">
                  Confirmed upcoming events
                </span>
              </div>
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RevenueChart bookings={bookingsList} />
              </div>
              <div className="flex flex-col gap-6">
                <TopPerformerCard performers={performersList} />
                <OccupancyHeatmap slots={slotsList} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <BookingFunnel />
              </div>

              {/* Recent Booking Requests */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-700">
                  <h3 className="font-bold text-lg">Active Gig Requests</h3>
                  <Button
                    variant="link"
                    onClick={() => setActiveTab("bookings")}
                    className="text-rose-500 font-semibold text-xs flex items-center gap-1 hover:underline h-auto p-0 cursor-pointer"
                  >
                    View Bookings Panel <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {bookingsList.filter((b) => b.status === "Pending").length ===
                  0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">
                      No pending gig requests at this time.
                    </div>
                  ) : (
                    bookingsList
                      .filter((b) => b.status === "Pending")
                      .map((booking) => (
                        <div
                          key={booking.id}
                          className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">
                              {booking.performer?.name || "Performer"} at{" "}
                              {booking.venue?.name}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                              Date: {booking.date} | Time:{" "}
                              {to12h(booking.startTime)} -{" "}
                              {to12h(booking.endTime)} | Offer: ₹
                              {booking.budget}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApproveBooking(booking.id)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold cursor-pointer h-9 px-4"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </Button>
                            <Button
                              onClick={() => handleRejectBooking(booking.id)}
                              className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold cursor-pointer h-9 px-4"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() =>
                                setPerformerDetailsModal(booking.performer)
                              }
                              className="rounded-xl text-xs font-semibold cursor-pointer h-9 px-4"
                            >
                              View Bio
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: VOICE AI
            ------------------------------------------------------------- */}
        {activeTab === "voiceai" && (
          <VoiceAITab user={user} />
        )}

        {/* -------------------------------------------------------------
            TAB: VENUES LIST & CRUD
            ------------------------------------------------------------- */}
        {activeTab === "venues" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  Venues Management
                </h1>
                <p className="text-slate-500 mt-1">
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
            {/* Venues Search & Filter */}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  const venueSlots = slotsList.filter(
                    (s) => s.venueId === venue.id,
                  );
                  const availableCount = venueSlots.filter(
                    (s) => s.status === "Available",
                  ).length;
                  const pendingCount = venueSlots.filter(
                    (s) => s.status === "Pending",
                  ).length;
                  const bookedCount = venueSlots.filter(
                    (s) => s.status === "Booked",
                  ).length;

                  return (
                    <div
                      key={venue.id}
                      className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between dark:bg-slate-800 dark:border-slate-700"
                    >
                      <div className="relative h-48 bg-slate-100">
                        <img
                          src={
                            venue.imageUrl ||
                            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800"
                          }
                          alt={venue.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-4 right-4 bg-white/90 backdrop-blur text-slate-800 px-3 py-1 rounded-full text-xs font-bold shadow dark:bg-slate-900/90 dark:text-white">
                          {venue.type}
                        </span>
                        {availableCount > 0 && (
                          <span className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow">
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
                          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />{" "}
                            {venue.address}
                          </p>
                        </div>

                        <p className="text-sm text-slate-500 leading-relaxed truncate-3-lines">
                          {venue.description}
                        </p>

                        <div className="text-xs font-semibold text-slate-500 flex items-center gap-4">
                          <span>
                            Capacity:{" "}
                            <strong className="text-slate-800 dark:text-white">
                              {venue.capacity} guests
                            </strong>
                          </span>
                        </div>

                        {/* Equipment Provided */}
                        {venue.equipment.length > 0 && (
                          <div>
                            <span className="text-xs font-bold text-slate-400 block mb-1">
                              Equipment Provided:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {venue.equipment.map(
                                (eq: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold dark:bg-slate-700 dark:text-slate-300"
                                  >
                                    {eq}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-6 border-t border-slate-100 flex gap-2 dark:border-slate-700">
                        <Button
                          variant="secondary"
                          onClick={() => setSelectedVenueDetails(venue)}
                          className="flex-1 rounded-xl text-xs font-semibold cursor-pointer h-9"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-rose-500" />{" "}
                          View details
                        </Button>
                        {!user?.isManager && (
                          <>
                            <Button
                              variant="secondary"
                              onClick={() => setEditingVenue(venue)}
                              className="flex-1 rounded-xl text-xs font-semibold cursor-pointer h-9"
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
            <Dialog
              open={showAddVenueModal}
              onOpenChange={setShowAddVenueModal}
            >
              <DialogContent
                className="max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-750 rounded-3xl"
                showCloseButton={true}
              >
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-xl font-bold text-left">
                    Add New Venue
                  </DialogTitle>
                </DialogHeader>

                <form
                  onSubmit={handleCreateVenue}
                  className="space-y-4 text-sm text-slate-700 dark:text-slate-300"
                >
                  <div>
                    <label className="block font-semibold mb-1">
                      Venue Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newVenueData.name}
                      onChange={(e) =>
                        setNewVenueData({
                          ...newVenueData,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g. Sector 17 Cafe"
                      className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      Venue Type *
                    </label>
                    <select
                      value={newVenueData.type}
                      onChange={(e) =>
                        setNewVenueData({
                          ...newVenueData,
                          type: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
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
                    <label className="block font-semibold mb-1">
                      Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={newVenueData.address}
                      onChange={(e) =>
                        setNewVenueData({
                          ...newVenueData,
                          address: e.target.value,
                        })
                      }
                      placeholder="e.g. 1024 Market St, Cityville"
                      className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />
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
                        className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
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
                        className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      Description
                    </label>
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
                      className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
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
                      className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
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
                        setNewVenueData({
                          ...newVenueData,
                          policies: e.target.value,
                        })
                      }
                      placeholder="Sound cap 85dB, CURFEW 11PM"
                      className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
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
                if (!open) setEditingVenue(null);
              }}
            >
              <DialogContent
                className="max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-750 rounded-3xl"
                showCloseButton={true}
              >
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-xl font-bold text-left">
                    Edit Venue Details
                  </DialogTitle>
                </DialogHeader>
                {editingVenue && (
                  <form
                    onSubmit={handleUpdateVenue}
                    className="space-y-4 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <div>
                      <label className="block font-semibold mb-1">
                        Venue Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingVenue.name}
                        onChange={(e) =>
                          setEditingVenue({
                            ...editingVenue,
                            name: e.target.value,
                          })
                        }
                        className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">
                        Venue Type *
                      </label>
                      <select
                        value={editingVenue.type}
                        onChange={(e) =>
                          setEditingVenue({
                            ...editingVenue,
                            type: e.target.value,
                          })
                        }
                        className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
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
                      <label className="block font-semibold mb-1">
                        Address *
                      </label>
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
                        className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
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
                          className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">
                          Photo URL
                        </label>
                        <input
                          type="text"
                          value={editingVenue.imageUrl}
                          onChange={(e) =>
                            setEditingVenue({
                              ...editingVenue,
                              imageUrl: e.target.value,
                            })
                          }
                          className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={editingVenue.description}
                        onChange={(e) =>
                          setEditingVenue({
                            ...editingVenue,
                            description: e.target.value,
                          })
                        }
                        className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">
                        Technical Equipment (comma-separated or list)
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
                        className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">
                        Policies (comma-separated or list)
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
                        className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-6 rounded-xl transition mt-4 cursor-pointer"
                    >
                      Update Details
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: CALENDAR & BOOKABLE SLOTS
            ------------------------------------------------------------- */}
        {activeTab === "calendar" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Availability Calendar
              </h1>
              <p className="text-slate-500 mt-1">
                Configure slot times and booking budget on dates to accept
                requests.
              </p>
            </div>

            {/* Venue Selector and Bulk Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm dark:bg-slate-800 dark:border-slate-700">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <label className="font-bold text-sm">Active Venue:</label>
                  <select
                    value={selectedCalendarVenue}
                    onChange={(e) => setSelectedCalendarVenue(e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-300 text-slate-850 focus:outline-none bg-slate-50 font-medium dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm"
                  >
                    {venuesList.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Drag to select mock toggle */}
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500">
                    Bulk create mode:
                  </span>
                  <div
                    onClick={() => setIsBulkCreateMode(!isBulkCreateMode)}
                    className={`w-8 h-4 rounded-full relative cursor-pointer group transition-colors ${isBulkCreateMode ? "bg-rose-500" : "bg-slate-200 dark:bg-slate-700"}`}
                  >
                    <div
                      className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isBulkCreateMode ? "translate-x-4" : "translate-x-0.5 group-hover:scale-110"}`}
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-400 ml-1">
                    (Drag across dates)
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowAddSlotModal(true)}
                  disabled={!selectedCalendarVenue}
                  className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold shadow cursor-pointer h-10 px-4"
                >
                  <Plus className="w-4 h-4" /> Create Calendar Slot
                </Button>
              </div>
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400 px-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>{" "}
                Available
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>{" "}
                Pending
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>{" "}
                Booked
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>{" "}
                Blocked
              </div>
            </div>

            {/* Split Screen Calendar and Slot details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Calendar Grid (8 cols) */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                  {/* Left Spacer */}
                  <div className="flex-1 hidden md:block"></div>

                  {/* Center Content */}
                  <div className="flex items-center justify-center gap-3 flex-shrink-0">
                    <Button
                      variant="ghost"
                      onClick={handlePrevMonth}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <h3 className="font-bold text-lg whitespace-nowrap text-center min-w-[130px]">
                      {new Date(selectedDate || Date.now()).toLocaleString(
                        "default",
                        {
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </h3>
                    <Button
                      variant="ghost"
                      onClick={handleNextMonth}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Right Content */}
                  <div className="flex items-center justify-end gap-2 flex-1">
                    {selectedDate && (
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedDate("")}
                        className="text-xs text-rose-500 hover:text-rose-600 h-8 px-2 hidden sm:block"
                      >
                        Clear Selection
                      </Button>
                    )}
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="p-2 rounded-lg border border-slate-300 text-slate-850 dark:bg-slate-900 dark:border-slate-700 dark:text-white text-xs max-w-[140px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (d) => (
                      <span key={d}>{d}</span>
                    ),
                  )}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {/* Padding empty days */}
                  {Array.from({
                    length: new Date(
                      new Date(selectedDate || Date.now()).getFullYear(),
                      new Date(selectedDate || Date.now()).getMonth(),
                      1,
                    ).getDay(),
                  }).map((_, idx) => (
                    <div
                      key={`empty-${idx}`}
                      className="h-16 border border-transparent"
                    ></div>
                  ))}

                  {/* Active month days */}
                  {getDaysInMonth().map((dayDate) => {
                    const dayStr = toLocalISOString(dayDate);
                    const slotsForDay = selectedVenueSlots.filter(
                      (s) => s.date === dayStr,
                    );
                    const isSelected = selectedDate === dayStr;

                    return (
                      <button
                        key={dayStr}
                        onClick={() => setSelectedDate(dayStr)}
                        className={`h-16 border rounded-2xl flex flex-col items-center justify-between p-1.5 transition text-left ${
                          isSelected
                            ? "border-rose-500 bg-rose-50/30 ring-1 ring-rose-500"
                            : "border-slate-200 hover:border-slate-400 dark:border-slate-700"
                        }`}
                      >
                        <span
                          className={`text-xs font-bold ${isSelected ? "text-rose-600" : "text-slate-700 dark:text-slate-300"}`}
                        >
                          {dayDate.getDate()}
                        </span>

                        {/* Status Dots */}
                        <div className="flex gap-1">
                          {slotsForDay.map((slot) => (
                            <span
                              key={slot.id}
                              className={`w-2.5 h-2.5 rounded-full ${
                                slot.status === "Available"
                                  ? "bg-emerald-500"
                                  : slot.status === "Pending"
                                    ? "bg-amber-500"
                                    : slot.status === "Booked"
                                      ? "bg-blue-500"
                                      : "bg-slate-400"
                              }`}
                              title={`${slot.status}: ${to12h(slot.startTime)}-${to12h(slot.endTime)}`}
                            ></span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Day slot Details side panel (4 cols) */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between dark:bg-slate-800 dark:border-slate-700">
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3 dark:border-slate-700">
                    <h3 className="font-bold text-slate-850 dark:text-white text-base">
                      {selectedDate
                        ? `Slots for ${selectedDate}`
                        : "Next 7 Days"}
                    </h3>
                    <span className="text-xs text-slate-400">
                      {selectedDate
                        ? "Manage calendar times for this day"
                        : "Upcoming slots overview"}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
                    {!selectedDate ? (
                      // Next 7 Days Summary View
                      selectedVenueSlots
                        .filter(
                          (s) =>
                            new Date(s.date) >= new Date() &&
                            new Date(s.date) <=
                              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        )
                        .sort(
                          (a, b) =>
                            new Date(a.date).getTime() -
                            new Date(b.date).getTime(),
                        )
                        .map((slot) => (
                          <div
                            key={slot.id}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-2xl dark:bg-slate-900 dark:border-slate-700"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold">
                                {slot.date}
                              </span>
                              <span
                                className={`w-2 h-2 rounded-full ${slot.status === "Available" ? "bg-emerald-500" : slot.status === "Pending" ? "bg-amber-500" : "bg-blue-500"}`}
                              />
                            </div>
                            <div className="text-xs text-slate-500">
                              {to12h(slot.startTime)} - {to12h(slot.endTime)} •
                              ₹{slot.budget}
                            </div>
                          </div>
                        ))
                    ) : selectedDaySlots.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                        <CalendarIcon className="w-8 h-8 text-slate-300" />
                        <span>No bookable slots on this day.</span>
                      </div>
                    ) : (
                      selectedDaySlots.map((slot) => (
                        <div
                          key={slot.id}
                          className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2 dark:bg-slate-900 dark:border-slate-700"
                        >
                          <div className="flex justify-between items-center">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                slot.status === "Available"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : slot.status === "Pending"
                                    ? "bg-amber-100 text-amber-800"
                                    : slot.status === "Booked"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-slate-200 text-slate-750"
                              }`}
                            >
                              {slot.status}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-white">
                              ₹{slot.budget} budget
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 font-medium">
                            {to12h(slot.startTime)} - {to12h(slot.endTime)}
                          </div>

                          <div className="flex justify-end gap-1.5 mt-2">
                            <Button
                              variant="ghost"
                              onClick={() => handleDeleteSlot(slot.id)}
                              disabled={slot.status === "Booked"}
                              className="text-rose-500 hover:text-rose-750 hover:bg-rose-50 disabled:opacity-30 text-xs font-semibold px-2 py-1 rounded transition cursor-pointer h-7"
                            >
                              Delete slot
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                  <Button
                    onClick={() => setShowAddSlotModal(true)}
                    className="w-full bg-slate-900 text-white font-bold py-6 rounded-xl hover:bg-slate-800 transition cursor-pointer"
                  >
                    Add Slot to Selected Date
                  </Button>
                </div>
              </div>
            </div>

            <Dialog open={showAddSlotModal} onOpenChange={setShowAddSlotModal}>
              <DialogContent
                className="max-w-sm w-full p-6 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-750 rounded-3xl"
                showCloseButton={true}
              >
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-lg font-bold text-left">
                    Add Slot: {selectedDate}
                  </DialogTitle>
                </DialogHeader>

                {showAddSlotModal && (
                  <form
                    onSubmit={handleCreateSlot}
                    className="space-y-4 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          required
                          value={newSlotData.startTime}
                          onChange={(e) =>
                            setNewSlotData({
                              ...newSlotData,
                              startTime: e.target.value,
                            })
                          }
                          className="w-full p-2.5 rounded-xl border border-slate-350 bg-white text-slate-855 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          required
                          value={newSlotData.endTime}
                          onChange={(e) =>
                            setNewSlotData({
                              ...newSlotData,
                              endTime: e.target.value,
                            })
                          }
                          className="w-full p-2.5 rounded-xl border border-slate-350 bg-white text-slate-855 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">
                        Gig Budget Offered (₹)
                      </label>
                      <input
                        type="number"
                        required
                        value={newSlotData.budget}
                        onChange={(e) =>
                          setNewSlotData({
                            ...newSlotData,
                            budget: Number(e.target.value),
                          })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-350 bg-white text-slate-855 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">
                        Initial Status
                      </label>
                      <select
                        value={newSlotData.status}
                        onChange={(e) =>
                          setNewSlotData({
                            ...newSlotData,
                            status: e.target.value as any,
                          })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-350 bg-white text-slate-855 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      >
                        <option value="Available">Available for booking</option>
                        <option value="Blocked">Blocked / Unavailable</option>
                      </select>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-6 rounded-xl transition mt-2 text-sm shadow cursor-pointer"
                    >
                      Save Slot
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: BOOKINGS MANAGER
            ------------------------------------------------------------- */}
        {activeTab === "bookings" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Performers Bookings
              </h1>
              <p className="text-slate-500 mt-1">
                Manage scheduled performer gigs and review incoming requests.
              </p>
            </div>

            <BookingTimeline bookings={bookingsList} venues={venuesList} viewType="organization" />

            {/* Earnings Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-emerald-500 rounded-3xl p-6 text-white shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-emerald-100 font-semibold mb-1">
                    Total Payouts
                  </h3>
                  <div className="text-4xl font-black">₹45,000</div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm font-semibold">
                  <span>This Month</span>
                  <span className="bg-white/20 px-2 py-1 rounded-lg">+12%</span>
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between dark:bg-slate-800 dark:border-slate-700">
                <h3 className="text-slate-500 font-semibold mb-1">
                  Pending Budget
                </h3>
                <div className="text-4xl font-black text-slate-800 dark:text-white">
                  ₹12,500
                </div>
                <div className="mt-4 text-sm font-semibold text-slate-500">
                  Across 3 pending gigs
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between dark:bg-slate-800 dark:border-slate-700">
                <h3 className="text-slate-500 font-semibold mb-1">
                  Completed Gigs
                </h3>
                <div className="text-4xl font-black text-slate-800 dark:text-white">
                  24
                </div>
                <div className="mt-4 text-sm font-semibold text-emerald-500">
                  98% positive reviews
                </div>
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
                  <option value="Completed">Completed</option>
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
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="text-xs h-9 rounded-xl border-slate-200"
                >
                  Select All
                </Button>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-9 rounded-xl">
                  Bulk Approve
                </Button>
                <Button className="bg-rose-500 hover:bg-rose-600 text-white text-xs h-9 rounded-xl">
                  Bulk Reject
                </Button>
                <Button
                  variant="outline"
                  className="text-xs h-9 rounded-xl border-slate-200 ml-auto"
                >
                  <BookOpen className="w-4 h-4 mr-1" /> Export CSV
                </Button>
              </div>
            </div>

            {/* List Bookings */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {bookingsList.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-sm">
                    No bookings or gig logs found.
                  </div>
                ) : (
                  bookingsList
                    .filter(
                      (b) =>
                        bookingStatusFilter === "All" ||
                        b.status === bookingStatusFilter,
                    )
                    .sort((a, b) => {
                      if (bookingSort === "dateAsc")
                        return (
                          new Date(a.date).getTime() -
                          new Date(b.date).getTime()
                        );
                      if (bookingSort === "dateDesc")
                        return (
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime()
                        );
                      return 0;
                    })
                    .map((booking) => {
                      const todayStr = toLocalISOString(new Date());
                      const isPast =
                        booking.date <= todayStr &&
                        booking.status === "Confirmed";
                      const hasOrgReview = reviewsList.some(
                        (r) =>
                          r.bookingId === booking.id &&
                          r.reviewerId === user?.id,
                      );

                      return (
                        <div
                          key={booking.id}
                          className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex gap-4">
                            <div className="pt-1">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                                  {booking.performer?.name ||
                                    "Performer Profile"}
                                </h4>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                    booking.status === "Confirmed"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : booking.status === "Pending"
                                        ? "bg-amber-100 text-amber-800"
                                        : booking.status === "Rejected"
                                          ? "bg-rose-100 text-rose-800"
                                          : "bg-slate-200"
                                  }`}
                                >
                                  {booking.status}
                                </span>
                              </div>

                              <p className="text-xs text-slate-500 mt-1">
                                Venue:{" "}
                                <strong className="text-slate-800 dark:text-white">
                                  {booking.venue?.name}
                                </strong>{" "}
                                | Date: {booking.date} | Time:{" "}
                                {to12h(booking.startTime)} -{" "}
                                {to12h(booking.endTime)}
                              </p>
                              <span className="inline-block mt-2 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full dark:bg-emerald-950/20 dark:text-emerald-400">
                                Offer: ₹{booking.budget}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {booking.status === "Pending" && (
                              <>
                                <Button
                                  onClick={() =>
                                    handleApproveBooking(booking.id)
                                  }
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold cursor-pointer h-9 px-3.5"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleRejectBooking(booking.id)
                                  }
                                  className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold cursor-pointer h-9 px-3.5"
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
                              onClick={() => {
                                // Go to chat tab and start chat
                                setActiveTab("messages");
                                startChat(booking.performer);
                              }}
                              className="rounded-xl text-xs font-semibold cursor-pointer h-9 px-3.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Chat
                            </Button>

                            <Button
                              variant="secondary"
                              onClick={() =>
                                setPerformerDetailsModal(booking.performer)
                              }
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
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: MESSAGES / CHAT
            ------------------------------------------------------------- */}
        {activeTab === "messages" && (
          <div className="h-[calc(100vh-8rem)] flex bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm dark:bg-slate-800 dark:border-slate-700">
            {/* Chats List sidebar */}
            <div className="w-80 border-r border-slate-150 flex flex-col dark:border-slate-700">
              <div className="p-4 border-b border-slate-150 dark:border-slate-700 space-y-3">
                <h3 className="font-bold text-slate-850 dark:text-white">
                  Performers Chats
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-rose-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    value={messageSearchQuery}
                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-750">
                {performersList
                  .filter((p) =>
                    p.name
                      .toLowerCase()
                      .includes(messageSearchQuery.toLowerCase()),
                  )
                  .map((perf) => (
                    <button
                      key={perf.id}
                      onClick={() => startChat(perf)}
                      className={`w-full text-left p-4 hover:bg-slate-50 transition flex items-center gap-3 ${
                        activePerformerId === perf.id
                          ? "bg-rose-50/40 dark:bg-slate-700/50"
                          : "dark:hover:bg-slate-700/25"
                      }`}
                    >
                      <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden flex-shrink-0">
                        <img
                          src={perf.imageUrl}
                          alt={perf.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-xs truncate text-slate-900 dark:text-white">
                          {perf.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {perf.genres.join(", ")}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Active chat window */}
            <div className="flex-1 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-900/30">
              {activePerformerId ? (
                <>
                  {/* Chat header */}
                  <div className="px-6 py-4 bg-white border-b border-slate-150 flex items-center justify-between dark:bg-slate-800 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {
                          performersList.find((p) => p.id === activePerformerId)
                            ?.name
                        }
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
                                  : "bg-white text-slate-800 rounded-bl-none border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                              }`}
                            >
                              <p>{msg.content}</p>
                              <span
                                className={`block text-[9px] mt-1.5 ${isMe ? "text-white/60" : "text-slate-400"}`}
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
                  <div className="p-4 bg-white border-t border-slate-150 dark:bg-slate-800 dark:border-slate-700">
                    {/* Quick Replies */}
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                      {[
                        "Sure, sounds good!",
                        "Can we negotiate the price?",
                        "Please send me your portfolio.",
                        "Are you available on that date?",
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
                      <button
                        type="button"
                        className="p-3 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-xl border border-slate-200 transition dark:bg-slate-900 dark:border-slate-700 dark:hover:text-white"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessageText}
                          onChange={(e) => setNewMessageText(e.target.value)}
                          placeholder="Type a message..."
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition text-xs pr-10 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                        />
                        {newMessageText.length > 0 && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                          </span>
                        )}
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
                  <span>
                    Select a performer on the left sidebar to start messaging.
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
              <p className="text-slate-500 mt-1">
                Review gig updates, system notices, and booking events.
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
                          <button
                            onClick={() => handleMarkRead(notif.id)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg transition font-semibold dark:bg-slate-700 dark:text-white dark:hover:bg-slate-650"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: REVIEWS
            ------------------------------------------------------------- */}
        {activeTab === "reviews" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Venue Reviews
              </h1>
              <p className="text-slate-500 mt-1">
                Feedback left by artists and performers you have booked.
              </p>
            </div>

            {/* Reviews Analytics Card */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 dark:bg-slate-800 dark:border-slate-700 flex flex-col md:flex-row gap-8">
              <div className="flex flex-col items-center justify-center min-w-[150px]">
                <div className="text-5xl font-black text-slate-900 dark:text-white">
                  {reviewsList.length > 0
                    ? (
                        reviewsList.reduce((acc, r) => acc + r.rating, 0) /
                        reviewsList.length
                      ).toFixed(1)
                    : "0.0"}
                </div>
                <div className="flex items-center gap-1 my-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${reviewsList.length > 0 && star <= Math.round(reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  {reviewsList.length} total reviews
                </span>
              </div>

              <div className="flex-1 border-l border-slate-100 dark:border-slate-700 pl-8 space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviewsList.filter(
                    (r) => r.rating === rating,
                  ).length;
                  const percentage =
                    reviewsList.length > 0
                      ? Math.round((count / reviewsList.length) * 100)
                      : 0;
                  return (
                    <div
                      key={rating}
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() =>
                        setReviewRatingFilter(
                          rating === reviewRatingFilter ? null : rating,
                        )
                      }
                    >
                      <div className="flex items-center gap-1 w-10 text-xs font-bold text-slate-500">
                        {rating}{" "}
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </div>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-700">
                        <div
                          className={`h-full rounded-full transition-all ${reviewRatingFilter === rating ? "bg-amber-500" : "bg-amber-400 group-hover:bg-amber-500"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-8 text-right text-xs font-bold text-slate-600 dark:text-slate-400">
                        {percentage}%
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-l border-slate-100 dark:border-slate-700 pl-8 min-w-[200px]">
                <h4 className="text-sm font-bold mb-3">Top Sentiments</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-xs font-bold dark:bg-emerald-900/30 dark:text-emerald-400">
                    Great acoustics
                  </span>
                  <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-xs font-bold dark:bg-emerald-900/30 dark:text-emerald-400">
                    Friendly staff
                  </span>
                  <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-xs font-bold dark:bg-emerald-900/30 dark:text-emerald-400">
                    Paid on time
                  </span>
                </div>
              </div>
            </div>

            {reviewRatingFilter !== null && (
              <div className="flex items-center justify-between text-sm font-bold text-slate-600">
                <span>Showing {reviewRatingFilter}-star reviews</span>
                <button
                  onClick={() => setReviewRatingFilter(null)}
                  className="text-rose-500 hover:underline text-xs"
                >
                  Clear Filter
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviewsList.filter(
                (r) =>
                  reviewRatingFilter === null ||
                  r.rating === reviewRatingFilter,
              ).length === 0 ? (
                <div className="col-span-2 py-12 bg-white border border-slate-200 rounded-3xl text-center text-slate-500 text-sm dark:bg-slate-800 dark:border-slate-700">
                  No reviews match the selected filter.
                </div>
              ) : (
                reviewsList
                  .filter(
                    (r) =>
                      reviewRatingFilter === null ||
                      r.rating === reviewRatingFilter,
                  )
                  .map((review) => (
                    <div
                      key={review.id}
                      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 dark:bg-slate-800 dark:border-slate-700"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4 fill-amber-400 text-amber-400"
                            />
                          ))}
                          {Array.from({ length: 5 - review.rating }).map(
                            (_, i) => (
                              <Star
                                key={i}
                                className="w-4 h-4 text-slate-300"
                              />
                            ),
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-300 italic">
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

        {/* -------------------------------------------------------------
            TAB: DISCOVER PERFORMERS
            ------------------------------------------------------------- */}
        {activeTab === "discover" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  Find Performers
                </h1>
                <p className="text-slate-500 mt-1">
                  Discover and invite artists for your upcoming gigs.
                </p>
              </div>
            </div>

            {/* Discover Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or biography..."
                  value={performerSearchQuery}
                  onChange={(e) => setPerformerSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div className="w-full md:w-48">
                <select
                  value={performerGenreFilter}
                  onChange={(e) => setPerformerGenreFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                >
                  <option value="All">All Genres</option>
                  <option value="Acoustic">Acoustic</option>
                  <option value="Jazz">Jazz</option>
                  <option value="Rock">Rock</option>
                  <option value="Pop">Pop</option>
                  <option value="Classical">Classical</option>
                  <option value="Electronic">Electronic</option>
                </select>
              </div>
              <div className="w-full md:w-48 flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-500 w-16">
                  Max: ₹{performerMaxRate}
                </span>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="500"
                  value={performerMaxRate}
                  onChange={(e) => setPerformerMaxRate(Number(e.target.value))}
                  className="flex-1 accent-rose-500"
                />
              </div>
            </div>

            {/* Performers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {performersList
                .filter((p) => {
                  const matchSearch =
                    p.name
                      .toLowerCase()
                      .includes(performerSearchQuery.toLowerCase()) ||
                    (p.biography &&
                      p.biography
                        .toLowerCase()
                        .includes(performerSearchQuery.toLowerCase()));
                  const matchGenre =
                    performerGenreFilter === "All" ||
                    p.genres.includes(performerGenreFilter);
                  const matchRate = p.pricing <= performerMaxRate;
                  return matchSearch && matchGenre && matchRate;
                })
                .map((perf) => (
                  <div
                    key={perf.id}
                    className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between group dark:bg-slate-800 dark:border-slate-700"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={
                          perf.imageUrl ||
                          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800"
                        }
                        alt={perf.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h3 className="text-xl font-bold truncate">
                          {perf.name}
                        </h3>
                        <p className="text-xs text-white/80 truncate mt-1">
                          {perf.genres.join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                        {perf.biography || "No biography provided."}
                      </p>
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-500">Rate</span>
                        <span className="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                          ₹{perf.pricing}/hr
                        </span>
                      </div>
                    </div>
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setPerformerDetailsModal(perf)}
                        className="w-full rounded-xl text-xs font-semibold cursor-pointer h-9"
                      >
                        View Bio
                      </Button>
                      <Button
                        onClick={() => {
                          setActiveTab("messages");
                          startChat(perf);
                        }}
                        className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold cursor-pointer h-9 px-0"
                      >
                        <Send className="w-3.5 h-3.5 mr-1" /> Invite
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: MANAGERS MANAGEMENT
            ------------------------------------------------------------- */}
        {activeTab === "managers" && !user?.isManager && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  Venue Managers
                </h1>
                <p className="text-slate-500 mt-1">
                  Add local managers and assign them to oversee specific venues.
                </p>
              </div>
              <Button
                onClick={() => {
                  setNewManagerData({
                    name: "",
                    email: "",
                    venueId: venuesList[0]?.id || "",
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
                <h3 className="font-bold text-lg">Active Managers</h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-750">
                {managersList.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    No managers registered yet. Click the button above to add
                    one.
                  </div>
                ) : (
                  managersList.map((mgr) => (
                    <div
                      key={mgr.id}
                      className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">
                          {mgr.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Email: {mgr.email}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">
                          Assigned Venues:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {mgr.assignedVenues &&
                          mgr.assignedVenues.length > 0 ? (
                            mgr.assignedVenues.map((v: any) => (
                              <span
                                key={v.id}
                                className="bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full text-xs font-semibold dark:bg-rose-950/20 dark:text-rose-400"
                              >
                                {v.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              None
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Dialog
              open={showAddManagerModal}
              onOpenChange={setShowAddManagerModal}
            >
              <DialogContent
                className="max-w-sm w-full p-6 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-750 rounded-3xl"
                showCloseButton={true}
              >
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-lg font-bold text-left">
                    Add Venue Manager
                  </DialogTitle>
                </DialogHeader>

                {showAddManagerModal && (
                  <form
                    onSubmit={handleCreateManager}
                    className="space-y-4 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <div>
                      <label className="block font-semibold mb-1">
                        Manager Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newManagerData.name}
                        onChange={(e) =>
                          setNewManagerData({
                            ...newManagerData,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g. John Doe"
                        className="w-full p-2.5 rounded-xl border border-slate-350 bg-white text-slate-855 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={newManagerData.email}
                        onChange={(e) =>
                          setNewManagerData({
                            ...newManagerData,
                            email: e.target.value,
                          })
                        }
                        placeholder="e.g. manager@example.com"
                        className="w-full p-2.5 rounded-xl border border-slate-350 bg-white text-slate-855 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">
                        Assign to Venue *
                      </label>
                      <select
                        value={newManagerData.venueId}
                        onChange={(e) =>
                          setNewManagerData({
                            ...newManagerData,
                            venueId: e.target.value,
                          })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-355 bg-white text-slate-855 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
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
                      Create Account
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}
      </main>

      {/* VENUE DETAIL VIEW MODAL */}
      <Dialog
        open={!!selectedVenueDetails}
        onOpenChange={(open) => {
          if (!open) setSelectedVenueDetails(null);
        }}
      >
        <DialogContent
          className="max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-750 rounded-3xl"
          showCloseButton={true}
        >
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold text-left">
              Venue Profile Details
            </DialogTitle>
          </DialogHeader>

          {selectedVenueDetails && (
            <div className="space-y-6 text-sm">
              {selectedVenueDetails.imageUrl && (
                <div className="grid grid-cols-2 gap-2 h-48 rounded-2xl overflow-hidden shadow-inner">
                  <div className="col-span-1 h-full relative group cursor-pointer">
                    <img
                      src={selectedVenueDetails.imageUrl}
                      alt={selectedVenueDetails.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="col-span-1 grid grid-rows-2 gap-2 h-full">
                    <div className="row-span-1 relative group cursor-pointer">
                      <img
                        src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800"
                        alt="Venue interior 1"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="row-span-1 relative group cursor-pointer">
                      <img
                        src="https://images.unsplash.com/photo-1470229722913-7c092db656dd?w=800"
                        alt="Venue interior 2"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-semibold text-xs">
                          View all photos
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-2xl font-extrabold tracking-tight">
                  {selectedVenueDetails.name}
                </h4>
                <div className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{selectedVenueDetails.address}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">
                  Description
                </span>
                <p className="text-slate-650 dark:text-slate-350 leading-relaxed">
                  {selectedVenueDetails.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-55 rounded-2xl dark:bg-slate-750">
                  <span className="text-slate-400 font-bold block">
                    CAPACITY
                  </span>
                  <span className="text-sm font-extrabold block mt-0.5">
                    {selectedVenueDetails.capacity} Guests Max
                  </span>
                </div>
                <div className="p-3.5 bg-slate-55 rounded-2xl dark:bg-slate-750">
                  <span className="text-slate-400 font-bold block">
                    VENUE TYPE
                  </span>
                  <span className="text-sm font-extrabold block mt-0.5">
                    {selectedVenueDetails.type}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-2">
                    Policies & Guidelines
                  </span>
                  {selectedVenueDetails.policies &&
                  selectedVenueDetails.policies.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-350">
                      {selectedVenueDetails.policies.map(
                        (p: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-rose-500 mt-0.5">•</span>
                            <span>{p}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      No special policies stated.
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-2">
                    Equipment Provided
                  </span>
                  {selectedVenueDetails.equipment &&
                  selectedVenueDetails.equipment.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedVenueDetails.equipment.map(
                        (eq: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-[10px] font-semibold dark:bg-slate-700 dark:text-slate-300"
                          >
                            {eq}
                          </span>
                        ),
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      No equipment listed.
                    </span>
                  )}
                </div>
              </div>

              {/* Show managers assigned to this venue */}
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-2">
                  Assigned Venue Managers
                </span>
                <div className="flex flex-wrap gap-2">
                  {managersList.filter(
                    (mgr) =>
                      selectedVenueDetails.managerIds &&
                      selectedVenueDetails.managerIds.includes(mgr.id),
                  ).length > 0 ? (
                    managersList
                      .filter(
                        (mgr) =>
                          selectedVenueDetails.managerIds &&
                          selectedVenueDetails.managerIds.includes(mgr.id),
                      )
                      .map((mgr) => (
                        <span
                          key={mgr.id}
                          className="bg-rose-50 text-rose-600 border border-rose-100 px-3 py-1 rounded-full text-xs font-medium dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900"
                        >
                          {mgr.name}
                        </span>
                      ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      No managers assigned. Managed directly by organization.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            <DialogTitle className="text-xl font-bold text-left">
              Artist Portfolio
            </DialogTitle>
          </DialogHeader>

          {performerDetailsModal && (
            <div className="space-y-6 text-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-150 overflow-hidden flex-shrink-0">
                  <img
                    src={performerDetailsModal.imageUrl}
                    alt={performerDetailsModal.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-lg font-bold">
                    {performerDetailsModal.name}
                  </h4>
                  <p className="text-xs text-rose-500 font-bold">
                    ₹{performerDetailsModal.pricing}/Gig rate
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Biography
                </span>
                <p className="text-slate-650 dark:text-slate-350 leading-relaxed text-xs">
                  {performerDetailsModal.biography}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                    Genres
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {performerDetailsModal.genres.map((g: string) => (
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
                  <span className="font-semibold text-slate-750 dark:text-white">
                    {performerDetailsModal.experience}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                    Languages
                  </span>
                  <span className="font-semibold">
                    {performerDetailsModal.languages.join(", ")}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                    Travel Radius
                  </span>
                  <span className="font-semibold">
                    {performerDetailsModal.travelRadius} miles max
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                  Technical Gear Requested
                </span>
                <div className="flex flex-wrap gap-1">
                  {performerDetailsModal.equipmentNeeded.map((eq: string) => (
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
          if (!open) setShowAddReviewModal(null);
        }}
      >
        <DialogContent
          className="max-w-sm w-full p-6 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-750 rounded-3xl"
          showCloseButton={true}
        >
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-left">
              Review Artist
            </DialogTitle>
          </DialogHeader>

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
                placeholder="Tell other hosts how this performer did..."
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
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import {
  setAuthUser,
  setOrganizationDetails,
  loadAllDataThunk,
  refreshNotificationsAndMessagesThunk,
  clearMessages,
} from '@/lib/store/organizationSlice';
import Sidebar from '@/components/Sidebar';
import {
  BarChart3,
  Building,
  Calendar as CalendarIcon,
  Briefcase,
  MessageSquare,
  Bell,
  Star,
  Users,
  Compass,
  Mic,
  AlertCircle,
  Check,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function OrganizationDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  // Redux state selector
  const {
    user,
    organization,
    venuesList,
    bookingsList,
    notificationsList,
    performersList,
    chatMessages,
    activePerformerId,
    errorMsg,
    successMsg,
    loading,
  } = useAppSelector((state) => state.organization);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isOpenOnMobile, setIsOpenOnMobile] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Authenticate and load initial data
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    const loggedUser = JSON.parse(userStr);
    if (loggedUser.role !== 'organization') {
      if (loggedUser.role === 'performer') {
        router.push('/dashboard/performer');
      } else {
        localStorage.clear();
        router.push('/login');
      }
      return;
    }
    dispatch(setAuthUser(loggedUser));

    const orgStr = localStorage.getItem('organization');
    const loggedOrg = orgStr ? JSON.parse(orgStr) : null;
    dispatch(setOrganizationDetails(loggedOrg));

    const queryOrgId = loggedUser.isManager
      ? loggedUser.parentOrgId
      : loggedUser.id;

    dispatch(
      loadAllDataThunk({
        loggedUser,
        queryOrgId,
        orgState: loggedOrg?.state,
        orgCity: loggedOrg?.city,
      })
    ).then(() => {
      setInitialLoaded(true);
    });
  }, [dispatch, router]);

  // Trigger Sonner Toasts for success/error messages
  useEffect(() => {
    if (successMsg) {
      toast.success(successMsg);
      dispatch(clearMessages());
    }
    if (errorMsg) {
      toast.error(errorMsg);
      dispatch(clearMessages());
    }
  }, [successMsg, errorMsg, dispatch]);

  // Clean success/error alerts when navigating tabs
  useEffect(() => {
    dispatch(clearMessages());
  }, [pathname, dispatch]);

  // Polling for notification & message updates
  useEffect(() => {
    if (!user) return;
    const queryOrgId = user.isManager ? user.parentOrgId : user.id;

    const interval = setInterval(() => {
      dispatch(
        refreshNotificationsAndMessagesThunk({
          loggedUser: user,
          queryOrgId,
          activePerformerId,
          performersList,
          venuesList,
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [user, activePerformerId, performersList, venuesList, dispatch]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  // Determine active tab ID from current subpath
  let activeTab = 'overview';
  if (pathname.includes('/organization/venues')) activeTab = 'venues';
  else if (pathname.includes('/organization/calendar')) activeTab = 'calendar';
  else if (pathname.includes('/organization/bookings')) activeTab = 'bookings';
  else if (pathname.includes('/organization/messages')) activeTab = 'messages';
  else if (pathname.includes('/organization/notifications')) activeTab = 'notifications';
  else if (pathname.includes('/organization/reviews')) activeTab = 'reviews';
  else if (pathname.includes('/organization/managers')) activeTab = 'managers';
  else if (pathname.includes('/organization/discover')) activeTab = 'discover';
  else if (pathname.includes('/organization/voiceai')) activeTab = 'voiceai';

  const handleSetActiveTab = (tabId: string) => {
    if (tabId === 'overview') {
      router.push('/dashboard/organization');
    } else {
      router.push(`/dashboard/organization/${tabId}`);
    }
  };

  const pendingBookingsCount = bookingsList.filter(
    (b) => b.status?.toUpperCase() === 'PENDING'
  ).length;
  const unreadNotifCount = notificationsList.filter((n) => !n.isRead).length;

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'venues', label: 'Venues', icon: Building },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: Briefcase,
      badge: pendingBookingsCount || undefined,
      badgeColor: 'bg-rose-500 text-white',
      isPendingDot: pendingBookingsCount > 0,
    },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifCount || undefined,
      badgeColor: 'bg-rose-500 text-white',
      isPendingDot: unreadNotifCount > 0,
    },
    { id: 'reviews', label: 'Reviews', icon: Star },
    ...(!user?.isManager
      ? [{ id: 'managers', label: 'Managers', icon: Users }]
      : []),
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'voiceai', label: 'Voice AI', icon: Mic },
  ];

  if (!initialLoaded || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-semibold dark:text-slate-400">
            Loading your dashboard data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans dark:bg-slate-900 dark:text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        user={user}
        userSubtitle={user.isManager ? 'Venue Manager' : 'Organization Owner'}
        items={sidebarItems}
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        handleLogout={handleLogout}
        title="VenueVox Dashboard"
        logo={Building}
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
            <span className="font-bold tracking-tight">VenueVox</span>
          </div>
        </div>

        {/* Scrollable Child Container */}
        <main className="flex-1 bg-slate-50 overflow-y-auto p-4 md:p-8 dark:bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
}

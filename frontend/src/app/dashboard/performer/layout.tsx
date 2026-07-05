'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import {
  setAuthUser,
  setPerformerProfile,
  loadPerformerDataThunk,
  refreshPerformerNotificationsAndMessagesThunk,
  clearMessages,
} from '@/lib/store/performerSlice';
import {
  LayoutDashboard,
  User as UserIcon,
  Compass,
  Briefcase,
  MessageSquare,
  Bell,
  Star,
  Menu,
  AlertCircle,
  Check,
} from 'lucide-react';
import Sidebar, { SidebarItem } from '@/components/Sidebar';
import GlobalSearch from '@/components/GlobalSearch';

import { toast } from 'sonner';

export default function PerformerDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  // Redux Selectors
  const {
    user,
    performer,
    slotsList,
    notificationsList,
    venuesList,
    activeVenueId,
    errorMsg,
    successMsg,
    loading,
  } = useAppSelector((state) => state.performer);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isOpenOnMobile, setIsOpenOnMobile] = useState(false);

  // Authentication check & initial load
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    const loggedUser = JSON.parse(userStr);
    if (loggedUser.role !== 'performer') {
      if (loggedUser.role === 'organization') {
        router.push('/dashboard/organization');
      } else {
        localStorage.clear();
        router.push('/login');
      }
      return;
    }
    dispatch(setAuthUser(loggedUser));

    const perfStr = localStorage.getItem('performer');
    if (perfStr) {
      const p = JSON.parse(perfStr);
      dispatch(setPerformerProfile(p));
      dispatch(
        loadPerformerDataThunk({
          userId: loggedUser.id,
          performerId: p.id,
          performerState: p.state,
          performerCity: p.city,
        })
      );
    } else {
      router.push('/login');
    }
  }, [router, dispatch]);

  // Polling loop for Notifications and Messages
  useEffect(() => {
    if (!user || !performer) return;

    const interval = setInterval(() => {
      dispatch(
        refreshPerformerNotificationsAndMessagesThunk({
          userId: user.id,
          activeVenueId,
          venuesList,
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [user, performer, activeVenueId, venuesList, dispatch]);

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

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const getActiveTab = () => {
    if (pathname === '/dashboard/performer') return 'overview';
    return pathname.split('/').pop() || 'overview';
  };

  const activeTab = getActiveTab();

  const handleTabSelect = (tabId: string) => {
    dispatch(clearMessages());
    if (tabId === 'overview') {
      router.push('/dashboard/performer');
    } else {
      router.push(`/dashboard/performer/${tabId}`);
    }
  };

  const unreadNotifCount = notificationsList.filter((n) => !n.isRead).length;

  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'portfolio',
      label: 'My Portfolio',
      icon: UserIcon,
      badge: `${performer?.completionPercentage || 0}%`,
      badgeColor: 'bg-rose-500/20 text-rose-400',
    },
    {
      id: 'discover',
      label: 'Discover Slots',
      icon: Compass,
      badge: slotsList.length,
    },
    { id: 'bookings', label: 'Gigs Booked', icon: Briefcase },
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
  ];

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading your Artist Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-55 text-slate-800 flex flex-col md:flex-row font-sans dark:bg-slate-955 dark:text-slate-100">
      <GlobalSearch venues={venuesList} performers={[]} onSelectTab={handleTabSelect} />

      <Sidebar
        user={user}
        userAvatar={performer?.imageUrl}
        userSubtitle={`₹${performer?.pricing || 0}/Gig Rate`}
        items={sidebarItems}
        activeTab={activeTab}
        setActiveTab={handleTabSelect}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        handleLogout={handleLogout}
        title="VenueVoxAI Performer"
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
            <span className="font-bold text-base">VenueVoxAI</span>
          </div>
          <div className="w-8 h-8 bg-rose-500 text-white font-bold flex items-center justify-center rounded-lg uppercase text-xs">
            {user?.name?.substring(0, 2) || 'U'}
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 bg-slate-50 overflow-y-auto p-4 md:p-8 dark:bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
}

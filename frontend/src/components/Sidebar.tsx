"use client";

import React from "react";
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
  Sun,
  Moon,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeColor?: string;
  isPendingDot?: boolean;
}

interface SidebarProps {
  user: any;
  userAvatar?: string;
  userSubtitle?: string;
  items: SidebarItem[];
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  handleLogout: () => void;
  title: string;
  logo: LucideIcon;
  isOpenOnMobile?: boolean;
  setIsOpenOnMobile?: (open: boolean) => void;
}

export default function Sidebar({
  user,
  userAvatar,
  userSubtitle,
  items,
  activeTab,
  setActiveTab,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  handleLogout,
  title,
  logo: LogoIcon,
  isOpenOnMobile,
  setIsOpenOnMobile,
}: SidebarProps) {
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    // Check initial preference from DOM (which is initialized by root layout script)
    if (document.documentElement.classList.contains("dark")) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  const openSearch = () => {
    // Dispatch a keyboard event to trigger GlobalSearch
    const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
    document.dispatchEvent(event);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenOnMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
          onClick={() => setIsOpenOnMobile?.(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 bottom-0 left-0 z-45 md:z-auto flex flex-col bg-slate-900 text-slate-400 border-r border-slate-800 h-screen flex-shrink-0 transition-all duration-300 ${isSidebarCollapsed ? "w-20" : "w-64"} ${isOpenOnMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
      {/* Centered Absolute Toggle Button on the border */}
      <Button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="hidden md:flex absolute z-50 bg-rose-500 text-white p-0 rounded-full shadow-lg border border-slate-700 -right-3 top-5 hover:bg-rose-600 transition items-center justify-center cursor-pointer h-6 w-6"
        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isSidebarCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </Button>

      <div
        className={`h-16 flex items-center border-b border-slate-800 transition-all ${isSidebarCollapsed ? "justify-center px-2" : "justify-between px-4"}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="bg-rose-500 text-white p-1.5 rounded-lg flex-shrink-0">
            <LogoIcon className="w-5 h-5" />
          </div>
          {!isSidebarCollapsed && (
            <span className="text-white font-bold text-base tracking-tight truncate">
              {title}
            </span>
          )}
        </div>
      </div>

      <div className="p-3">
        {isSidebarCollapsed ? (
          <div className="flex justify-center">
            {userAvatar ? (
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-slate-700 shadow-md">
                <img
                  src={userAvatar}
                  alt={user?.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-rose-500 text-white font-bold flex items-center justify-center rounded-lg uppercase flex-shrink-0 shadow-md">
                {user?.name?.substring(0, 2) || "U"}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
            {userAvatar ? (
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-slate-700">
                <img
                  src={userAvatar}
                  alt={user?.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-rose-500 text-white font-bold flex items-center justify-center rounded-lg uppercase flex-shrink-0">
                {user?.name?.substring(0, 2) || "U"}
              </div>
            )}
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold text-white truncate">
                {user?.name}
              </h4>
              <span className="text-xs text-slate-500 truncate block">
                {userSubtitle || "User Portal"}
              </span>
            </div>
          </div>
        )}
      </div>

      <nav
        className={`flex-1 space-y-1 overflow-y-auto overflow-x-hidden ${isSidebarCollapsed ? "px-2" : "px-3"}`}
      >
        {items.map((item) => {
          const ItemIcon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpenOnMobile?.(false);
              }}
              title={isSidebarCollapsed ? item.label : ""}
              variant={isActive ? "default" : "ghost"}
              className={`w-full flex items-center justify-start transition relative group h-10 ${
                isSidebarCollapsed
                  ? "px-1 py-2.5 justify-center"
                  : "gap-3 px-3 py-2.5"
              } rounded-xl text-sm font-semibold cursor-pointer ${
                isActive
                  ? "bg-rose-500 text-white hover:bg-rose-600 hover:text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <ItemIcon className="w-4 h-4 flex-shrink-0" />
              {!isSidebarCollapsed && (
                <>
                  <span>{item.label}</span>
                  {item.badge !== undefined &&
                    item.badge !== null &&
                    item.badge !== "" && (
                      <span
                        className={`ml-auto ${item.badgeColor || "bg-slate-800 text-slate-300"} text-xs px-2 py-0.5 rounded-full font-bold`}
                      >
                        {item.badge}
                      </span>
                    )}
                </>
              )}
              {isSidebarCollapsed && item.isPendingDot && (
                <span
                  className={`absolute top-2 right-2 w-2 h-2 rounded-full ${item.badgeColor?.includes("rose") || item.badgeColor?.includes("red") ? "bg-rose-500" : "bg-amber-500"}`}
                />
              )}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-955 text-white text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 shadow-xl border border-slate-800">
                  {item.label}{" "}
                  {item.badge !== undefined &&
                  item.badge !== null &&
                  item.badge !== "" &&
                  item.badge !== 0
                    ? `(${item.badge})`
                    : ""}
                </div>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Utilities Section */}
      <div
        className={`px-3 py-2 space-y-1 border-t border-slate-800 ${isSidebarCollapsed ? "px-2" : ""}`}
      >
        <Button
          onClick={openSearch}
          title={isSidebarCollapsed ? "Global Search (⌘K)" : ""}
          variant="ghost"
          className={`w-full flex items-center justify-start transition relative group h-10 ${
            isSidebarCollapsed ? "p-2.5 justify-center" : "gap-3 px-3 py-2.5"
          } rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white text-left cursor-pointer`}
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          {!isSidebarCollapsed && (
            <>
              <span>Search</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-500 border border-slate-700 font-mono">
                ⌘K
              </span>
            </>
          )}
          {isSidebarCollapsed && (
            <div className="absolute left-full ml-3 px-2 py-1 bg-slate-955 text-white text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 shadow-xl border border-slate-800">
              Search (⌘K)
            </div>
          )}
        </Button>

        <Button
          onClick={toggleDarkMode}
          title={
            isSidebarCollapsed ? (isDarkMode ? "Light Mode" : "Dark Mode") : ""
          }
          variant="ghost"
          className={`w-full flex items-center justify-start transition relative group h-10 ${
            isSidebarCollapsed ? "p-2.5 justify-center" : "gap-3 px-3 py-2.5"
          } rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white text-left cursor-pointer`}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 flex-shrink-0" />
          ) : (
            <Moon className="w-4 h-4 flex-shrink-0" />
          )}
          {!isSidebarCollapsed && (
            <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
          )}
          {isSidebarCollapsed && (
            <div className="absolute left-full ml-3 px-2 py-1 bg-slate-955 text-white text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 shadow-xl border border-slate-800">
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </div>
          )}
        </Button>
      </div>

      <div className="p-3 border-t border-slate-800">
        <Button
          onClick={handleLogout}
          title={isSidebarCollapsed ? "Sign Out" : ""}
          variant="ghost"
          className={`w-full flex items-center justify-start transition relative group h-10 ${
            isSidebarCollapsed ? "p-2.5 justify-center" : "gap-3 px-3 py-2.5"
          } rounded-xl text-sm font-semibold text-rose-450 hover:bg-rose-500/10 hover:text-rose-450 text-left cursor-pointer`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isSidebarCollapsed && <span>Sign Out</span>}
          {isSidebarCollapsed && (
            <div className="absolute left-full ml-3 px-2 py-1 bg-rose-950 text-rose-200 text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 shadow-xl border border-rose-900">
              Sign Out
            </div>
          )}
        </Button>
      </div>
    </aside>
  </>
  );
}

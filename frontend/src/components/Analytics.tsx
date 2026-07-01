"use client";

import React from "react";
import { toLocalISOString } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Line,
} from "recharts";
import { TrendingUp, Award, User, Zap } from "lucide-react";

// --- Revenue Chart ---
export function RevenueChart({ bookings }: { bookings: any[] }) {
  // Mock data for the last 6 months based on dummy data logic or hardcoded for visualization
  const data = [
    { name: "Jan", revenue: 1200 },
    { name: "Feb", revenue: 1900 },
    { name: "Mar", revenue: 1500 },
    { name: "Apr", revenue: 2200 },
    { name: "May", revenue: 2800 },
    { name: "Jun", revenue: 3500 }, // Current month
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Overview</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monthly payout totals across all venues</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> +25%
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(val) => `₹${val}`} />
            <RechartsTooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#f43f5e', fontWeight: 'bold' }}
              formatter={(value: any) => [`₹${value}`, "Revenue"]}
            />
            <Area type="monotone" dataKey="revenue" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Booking Funnel ---
export function BookingFunnel() {
  const data = [
    { stage: "Listed Slots", count: 45 },
    { stage: "Pending Requests", count: 28 },
    { stage: "Confirmed", count: 18 },
    { stage: "Completed", count: 12 },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Booking Funnel</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Conversion rates this month</p>
      </div>
      <div className="mt-6 space-y-4">
        {data.map((item, i) => {
          const percentage = Math.round((item.count / data[0].count) * 100);
          return (
            <div key={i} className="relative">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700 dark:text-slate-300">{item.stage}</span>
                <span className="text-slate-500">{item.count}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${i === 0 ? 'bg-slate-300 dark:bg-slate-500' : i === 1 ? 'bg-amber-400' : i === 2 ? 'bg-blue-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Top Performer Card ---
export function TopPerformerCard({ performers = [] }: { performers?: any[] }) {
  // Just grab a mock top performer
  const performer = performers.length > 0 ? performers[1] : { name: "DJ Electro", genres: ["Electronic", "House"], imageUrl: "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=800&auto=format&fit=crop&q=80" };

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl border border-indigo-400 shadow-md p-6 text-white flex flex-col justify-between relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-20">
        <Award className="w-24 h-24" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-yellow-300" />
          <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider">Top Performer</span>
        </div>
        <h3 className="text-lg font-bold">Most Booked this Month</h3>
      </div>

      <div className="flex items-center gap-4 mt-6 relative z-10">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/30">
          {performer?.imageUrl ? (
            <img src={performer.imageUrl} alt={performer.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-white/20 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
        <div>
          <h4 className="font-bold text-xl">{performer?.name || "Unknown Artist"}</h4>
          <p className="text-indigo-200 text-sm">{performer?.genres?.[0]} • 8 Bookings</p>
        </div>
      </div>
    </div>
  );
}

// --- Occupancy Heatmap Mock ---
export function OccupancyHeatmap({ slots = [] }: { slots?: any[] }) {
  // Generate the next 28 days starting from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysData = Array.from({ length: 28 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = toLocalISOString(d);

    // count booked or pending slots for this day across all venues
    const activeSlots = slots.filter(
      (s) => s.date === dateStr && (s.status === "Booked" || s.status === "Pending")
    );
    const dayNumber = d.getDate();
    return { date: dateStr, count: activeSlots.length, dayNumber };
  });

  const getIntensity = (count: number) => {
    if (count >= 3) return "bg-rose-500";
    if (count === 2) return "bg-rose-400";
    if (count === 1) return "bg-rose-200";
    return "bg-slate-100 dark:bg-slate-700";
  };

  const weeks = [0, 1, 2, 3];
  const daysOfWeek = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col justify-center">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Occupancy Heatmap</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Next 28 days booking density</p>
      </div>
      
      <div className="mt-4 flex flex-col gap-1.5 items-center">
        {weeks.map((weekIdx) => (
          <div key={weekIdx} className="flex gap-1.5">
            {daysOfWeek.map((dayIdx) => {
              const data = daysData[weekIdx * 7 + dayIdx];
              return (
                <div 
                  key={dayIdx} 
                  className={`w-7 h-7 flex items-center justify-center rounded text-[10px] font-bold ${
                    data.count > 0 ? "text-white" : "text-slate-500 dark:text-slate-400"
                  } ${getIntensity(data.count)} transition-colors duration-300 hover:ring-2 hover:ring-slate-300 cursor-pointer`}
                  title={`${data.date}: ${data.count} bookings`}
                >
                  {data.dayNumber}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-700" />
          <div className="w-3 h-3 rounded-sm bg-rose-200" />
          <div className="w-3 h-3 rounded-sm bg-rose-400" />
          <div className="w-3 h-3 rounded-sm bg-rose-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

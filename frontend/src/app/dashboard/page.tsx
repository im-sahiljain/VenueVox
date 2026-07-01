'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardIndex() {
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role === 'organization') {
        router.push('/dashboard/organization');
      } else if (user.role === 'performer') {
        router.push('/dashboard/performer');
      } else {
        localStorage.clear();
        router.push('/login');
      }
    } catch (e) {
      localStorage.clear();
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-sm font-semibold">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}

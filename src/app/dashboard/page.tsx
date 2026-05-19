'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardHeader from '@/components/DashboardHeader';
import StudentDashboard from '@/components/StudentDashboard';
import TeacherDashboard from '@/components/TeacherDashboard';
import RepDashboard from '@/components/RepDashboard';
import { MessageSquareCode } from 'lucide-react';

export default function DashboardDispatcherPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Loading spinner
  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-950 text-white items-center justify-center p-6 relative">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex flex-col items-center justify-center gap-4 z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-1 animate-pulse">
            <MessageSquareCode className="w-6 h-6 text-white animate-spin-slow" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              Securing active session...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-white">
      {/* Shared sticky glass header */}
      <DashboardHeader />

      {/* Conditional dashboard rendering */}
      <main className="flex-1 flex flex-col">
        {user.role === 'REPRESENTATIVE' && <RepDashboard />}
        {user.role === 'TEACHER' && <TeacherDashboard />}
        {(user.role === 'STUDENT' || user.role === 'ALUMNI') && <StudentDashboard />}
      </main>
    </div>
  );
}

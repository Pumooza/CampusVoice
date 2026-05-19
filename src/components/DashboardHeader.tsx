'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MessageSquareCode, Bell, LogOut, User, Check, Trash } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: 'PUT',
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications?all=true', {
        method: 'PUT',
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'REPRESENTATIVE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.1)]">
            Representative
          </span>
        );
      case 'TEACHER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]">
            Faculty
          </span>
        );
      case 'ALUMNI':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.1)]">
            Alumni
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.1)]">
            Student
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#07080e]/60 border-b border-white/[0.04] backdrop-blur-xl px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-3.5 hover:opacity-90 transition-all duration-300 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/15 group-hover:scale-105 transition-transform duration-300">
            <MessageSquareCode className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white leading-none">CampusVoice</h1>
            <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider mt-1">Feedback Hub</p>
          </div>
        </Link>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications Panel */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={`p-2.5 rounded-xl bg-slate-950/40 border border-white/[0.04] hover:border-indigo-500/40 hover:bg-slate-900/50 transition-all duration-300 text-slate-300 hover:text-white relative ${showDropdown ? 'border-indigo-500/40 bg-slate-900/50 text-white' : ''}`}
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-[9px] font-black text-white flex items-center justify-center animate-pulse border-2 border-[#07080e] shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                  {unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-3 w-80 max-h-[480px] overflow-hidden bg-slate-950/95 border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/80 z-50 flex flex-col backdrop-blur-xl animate-fade-in">
                  <div className="p-4 border-b border-white/[0.04] flex items-center justify-between bg-slate-900/20">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                      Notifications ({unreadCount})
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] max-h-[360px] custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-[11px] font-medium leading-relaxed">
                        No notifications found.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 hover:bg-white/[0.02] transition-all duration-300 relative group ${
                            !n.isRead ? 'bg-indigo-500/[0.02]' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            {n.link ? (
                              <Link
                                href={n.link}
                                onClick={() => {
                                  setShowDropdown(false);
                                  if (!n.isRead) handleMarkAsRead(n.id);
                                }}
                                className="flex-1 text-left"
                              >
                                <p className={`text-xs ${!n.isRead ? 'text-white font-bold' : 'text-slate-300'}`}>
                                  {n.title}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                              </Link>
                            ) : (
                              <div className="flex-1">
                                <p className={`text-xs ${!n.isRead ? 'text-white font-bold' : 'text-slate-300'}`}>
                                  {n.title}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                              </div>
                            )}

                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                              {!n.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead(n.id)}
                                  className="p-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-colors"
                                  title="Mark as read"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteNotification(n.id)}
                                className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
                                title="Delete"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <span className="block text-[9px] text-slate-500 font-bold uppercase mt-1.5">
                            {new Date(n.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-4 border-l border-white/[0.04]">
            <div className="w-9 h-9 rounded-xl bg-slate-950/40 border border-white/[0.04] flex items-center justify-center text-indigo-400">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-none">{user?.name}</span>
              <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                {user && getRoleBadge(user.role)}
                {user?.department && (
                  <span className="text-slate-500 font-medium">({user.department})</span>
                )}
              </span>
            </div>

            <button
              onClick={logout}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-950/40 border border-white/[0.04] hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all duration-300 text-slate-400 disabled:opacity-50"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  </header>
);
}

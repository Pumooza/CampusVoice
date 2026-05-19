'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Lock, Globe, Search, Filter, BookOpen, AlertCircle, FileText, ChevronRight, 
  MessageSquare, Tag, Calendar, Sparkles, Shield, Compass, Sparkle, HelpCircle, CheckCircle
} from 'lucide-react';

interface Attachment {
  filename: string;
  original: string;
  mimeType: string;
  url: string;
}

interface Complaint {
  id: string;
  summary: string;
  description: string;
  categories: string;
  tags: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  isAnonymous: boolean;
  status: 'PENDING' | 'UNDER_REVIEW' | 'AWAITING_STUDENT_RESPONSE' | 'SOLVED' | 'REJECTED' | 'HIDDEN';
  createdAt: string;
  updatedAt: string;
  complainant: {
    name: string;
    role: string;
  };
  targetTeacher?: {
    name: string;
    department: string;
  } | null;
  attachments: Attachment[];
  _count: {
    comments: number;
  };
}

const CATEGORIES = [
  'Academic',
  'Teacher Behavior',
  'Harassment',
  'Attendance',
  'Hostel',
  'Fee Issues',
  'Exam / Result Issues',
  'IT / Lab Issues',
  'University Issues'
];

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<'assigned' | 'public'>('assigned');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, [activeTab, categoryFilter]);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const feedType = activeTab === 'assigned' ? 'assigned' : 'public';
      let url = `/api/complaints?feedType=${feedType}`;
      if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load complaints');
      const data = await res.json();
      
      let list = data.complaints || [];
      if (activeTab === 'assigned') {
        list = list.filter((c: Complaint) => c.visibility === 'PRIVATE');
      } else {
        list = list.filter((c: Complaint) => c.visibility === 'PUBLIC');
      }

      setComplaints(list);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading complaints.');
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = complaints.filter(
    (c) =>
      c.summary.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
            Pending Review
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)] animate-pulse">
            Under Review
          </span>
        );
      case 'AWAITING_STUDENT_RESPONSE':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-pink-500/10 text-pink-400 border border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.05)]">
            Awaiting Response
          </span>
        );
      case 'SOLVED':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
            Resolved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.05)]">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Hidden
          </span>
        );
    }
  };

  // Stat Counters based on loaded complaints
  const totalCount = filteredComplaints.length;
  const pendingCount = filteredComplaints.filter(c => c.status === 'PENDING' || c.status === 'UNDER_REVIEW').length;
  const solvedCount = filteredComplaints.filter(c => c.status === 'SOLVED').length;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4">
        {/* Navigation Glass Panel */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] backdrop-blur-xl flex flex-col gap-2 shadow-2xl shadow-black/40">
          <p className="text-[10px] font-black tracking-widest uppercase text-slate-500 px-3 mb-1">Navigation</p>
          <button
            onClick={() => { setActiveTab('assigned'); setError(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-300 text-left group ${
              activeTab === 'assigned'
                ? 'bg-indigo-600/10 border-indigo-500/30 text-white shadow-inner shadow-indigo-500/5'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02] hover:border-white/[0.04]'
            }`}
          >
            <Lock className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeTab === 'assigned' ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span>Assigned Private Feed</span>
          </button>

          <button
            onClick={() => { setActiveTab('public'); setError(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-300 text-left group ${
              activeTab === 'public'
                ? 'bg-indigo-600/10 border-indigo-500/30 text-white shadow-inner shadow-indigo-500/5'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02] hover:border-white/[0.04]'
            }`}
          >
            <Globe className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeTab === 'public' ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span>Public feed explorer</span>
          </button>
        </div>

        {/* Faculty Policy Panel */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/20 via-indigo-950/5 to-transparent border border-indigo-500/10 text-xs leading-relaxed shadow-xl">
          <h4 className="font-black text-white text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            Faculty Guidelines
          </h4>
          <p className="text-slate-400 mb-4 leading-relaxed">
            In accordance with university anonymity rules, student identity remains hidden for anonymous posts. Responses should be professional and solution-focused.
          </p>
          <h4 className="font-black text-white text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            SLA Commitments
          </h4>
          <div className="space-y-2 text-slate-400 mt-2">
            <div className="flex justify-between items-center py-1 border-b border-indigo-950/40">
              <span>Initial review:</span>
              <span className="text-white font-bold bg-amber-500/10 px-2 py-0.5 rounded text-[10px] border border-amber-500/20">48 Hours</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span>Final resolution:</span>
              <span className="text-white font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] border border-emerald-500/20">7 Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 gap-6">
        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-200 text-xs font-medium flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-rose-400" />
            <p>{error}</p>
          </div>
        )}

        {/* Quick Statistics Metric Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] backdrop-blur-xl relative overflow-hidden shadow-2xl shadow-black/20 group hover:border-indigo-500/30 transition-all duration-300">
            <div className="absolute right-0 bottom-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
            <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Total Items</span>
            <span className="block text-2xl font-black text-white mt-1 leading-none">{totalCount}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] backdrop-blur-xl relative overflow-hidden shadow-2xl shadow-black/20 group hover:border-amber-500/30 transition-all duration-300">
            <div className="absolute right-0 bottom-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
            <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Active / Review</span>
            <span className="block text-2xl font-black text-amber-400 mt-1 leading-none">{pendingCount}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] backdrop-blur-xl relative overflow-hidden shadow-2xl shadow-black/20 group hover:border-emerald-500/30 transition-all duration-300">
            <div className="absolute right-0 bottom-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
            <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Resolved</span>
            <span className="block text-2xl font-black text-emerald-400 mt-1 leading-none">{solvedCount}</span>
          </div>
        </div>

        {/* Header & Filter Controls Card */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] backdrop-blur-xl flex flex-col md:flex-row gap-5 items-stretch md:items-center justify-between shadow-2xl shadow-black/40">
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-white">
              {activeTab === 'assigned' ? 'Assigned Private Room' : 'Public Feed Explorer'}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              {activeTab === 'assigned'
                ? 'Private academic or behavior concerns addressed directly to you'
                : 'Campus-wide discussions shared publicly across all university branches'}
            </p>
          </div>

          {/* Filtering Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search feeds..."
                className="pl-9 pr-4 py-2.5 w-44 sm:w-56 rounded-xl bg-slate-950 border border-white/[0.04] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all duration-300"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/[0.04] text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 focus:shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#080914] text-slate-500">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#080914] text-white">{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Complaints Feed */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4 bg-white/[0.01] border border-white/[0.03] rounded-3xl">
            <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Syncing discussion vault...</span>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="p-20 text-center rounded-3xl bg-white/[0.01] border border-white/[0.03] text-slate-500 text-xs font-semibold uppercase tracking-wider">
            No complaints found in this stream.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filteredComplaints.map((c) => (
              <Link
                key={c.id}
                href={`/complaints/${c.id}`}
                className="group p-5 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:border-indigo-500/30 hover:bg-white/[0.02] transition-all duration-300 shadow-2xl flex flex-col md:flex-row gap-5 items-stretch relative overflow-hidden"
              >
                {/* Glow Overlay */}
                <div className="absolute inset-0 bg-indigo-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Left upvote strip replacement inside social layout */}
                <div className="flex-1 flex flex-col justify-between relative z-10">
                  <div>
                    {/* Header Strip */}
                    <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
                      {getStatusBadge(c.status)}
                      
                      <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-900 text-indigo-400 border border-white/[0.03] flex items-center gap-1.5 shadow">
                        {c.visibility === 'PUBLIC' ? (
                          <>
                            <Compass className="w-3.5 h-3.5 text-indigo-400" /> Public Forum
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-indigo-400" /> Private Room
                          </>
                        )}
                      </span>

                      <span className="text-[10px] text-slate-500 font-bold">
                        • Posted {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Summary */}
                    <h3 className="text-base font-black text-white group-hover:text-indigo-400 transition-colors duration-300 leading-snug">
                      {c.summary}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  </div>

                  {/* Bottom tags & user */}
                  <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-white/[0.03]">
                    {c.categories.split(',').map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 rounded bg-slate-950 border border-white/[0.03] text-[9px] text-indigo-300 font-black uppercase tracking-widest"
                      >
                        c/{cat.replace(/\s+/g, '')}
                      </span>
                    ))}

                    <div className="flex items-center gap-1.5 ml-auto text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>Posted by:</span>
                      <span className="font-extrabold text-slate-300">
                        {c.isAnonymous ? 'anonymous' : c.complainant.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meta details right block */}
                <div className="md:w-56 flex-shrink-0 flex flex-col justify-between p-4 rounded-xl bg-slate-950/60 border border-white/[0.03] text-xs relative z-10 group-hover:border-indigo-500/20 transition-colors duration-300">
                  <div>
                    <span className="block text-[9px] uppercase font-black text-indigo-400 tracking-wider">Investigator Assigned</span>
                    <p className="text-white font-extrabold mt-1 text-xs truncate">
                      {c.targetTeacher ? c.targetTeacher.name : 'General Board'}
                    </p>
                    {c.targetTeacher?.department && (
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 truncate">{c.targetTeacher.department}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-white/[0.03]">
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                      <span>{c._count.comments} {c._count.comments === 1 ? 'reply' : 'replies'}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

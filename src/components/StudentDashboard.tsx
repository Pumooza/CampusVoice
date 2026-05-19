'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  PlusCircle, MessageSquare, AlertCircle, FileText, Globe, Lock, Eye, 
  Search, Filter, Calendar, Tag, ChevronRight, Upload, X, Check, Paperclip, AlertTriangle, ArrowRight,
  ChevronUp, ChevronDown, Flame, Sparkles, Heart, HelpCircle
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

interface Teacher {
  id: string;
  name: string;
  department: string;
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

export default function StudentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'public' | 'my' | 'submit'>('public');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Submit Complaint form state
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [targetTeacherId, setTargetTeacherId] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Teachers state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [activeTab, categoryFilter, statusFilter]);

  useEffect(() => {
    if (activeTab === 'submit') {
      fetchTeachers();
    }
  }, [activeTab]);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const feedType = activeTab === 'my' ? 'my' : 'public';
      let url = `/api/complaints?feedType=${feedType}`;
      if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch complaints');
      const data = await res.json();
      setComplaints(data.complaints || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading complaints.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/teachers');
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.teachers || []);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');

      setAttachments([...attachments, data.attachment]);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  // Word count check
  const getWordCount = (text: string) => {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const wordCount = getWordCount(description);
    if (wordCount > 1000) {
      setError('Description exceeds the 1000-word limit.');
      return;
    }

    if (selectedCategories.length === 0) {
      setError('Please select at least one category.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary,
          description,
          categories: selectedCategories,
          tags: tags ? tags.split(',').map((t) => t.trim()).join(',') : undefined,
          targetTeacherId: targetTeacherId || undefined,
          visibility,
          isAnonymous,
          attachments,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit complaint.');

      setSubmitSuccess(true);
      // Reset form
      setSummary('');
      setDescription('');
      setSelectedCategories([]);
      setTags('');
      setTargetTeacherId('');
      setAttachments([]);
      
      // Delay redirect back to "My Complaints"
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab('my');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
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
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending Review</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Under Review</span>;
      case 'AWAITING_STUDENT_RESPONSE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20">Awaiting Response</span>;
      case 'SOLVED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">Resolved</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">Hidden</span>;
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col lg:flex-row gap-8 min-h-screen bg-[#07080e] text-slate-100">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-4">
        {/* Navigation Card */}
        <div className="bg-slate-900/35 border border-white/[0.06] rounded-2xl p-4 backdrop-blur-xl shadow-xl flex flex-col gap-2 hover:border-indigo-500/10 transition-all duration-300">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300/80 px-2 mb-2">Navigation</p>
          <button
            onClick={() => { setActiveTab('public'); setError(null); }}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'public'
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                : 'bg-slate-950/40 border-white/[0.04] text-slate-400 hover:text-indigo-200 hover:border-indigo-500/20'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>Public Feed</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            onClick={() => { setActiveTab('my'); setError(null); }}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'my'
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                : 'bg-slate-950/40 border-white/[0.04] text-slate-400 hover:text-indigo-200 hover:border-indigo-500/20'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>My Complaints</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            onClick={() => { setActiveTab('submit'); setError(null); }}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'submit'
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                : 'bg-slate-950/40 border-white/[0.04] text-slate-400 hover:text-indigo-200 hover:border-indigo-500/20'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              <span>File Complaint</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>

        {/* Helpful Tips Panel */}
        <div className="p-5 rounded-2xl bg-slate-900/35 border border-white/[0.06] text-xs leading-relaxed text-slate-400 hover:border-indigo-500/10 transition-all duration-300">
          <h4 className="font-bold text-white mb-2.5 flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            Anonymity Shield
          </h4>
          <p className="text-slate-400 mb-4 text-[11px] leading-relaxed">
            Selecting <span className="text-white font-bold">Post Anonymously</span> masks your identity completely from Teachers and Departments. Only Student Representatives can view your name.
          </p>
          <h4 className="font-bold text-white mb-2.5 flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
            <Calendar className="w-4 h-4 text-indigo-400" />
            SLA Commitment
          </h4>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Initial review: <span className="text-indigo-300 font-bold">48 Hours</span>.<br />
            Final resolution: <span className="text-indigo-300 font-bold">7 Days</span>.
          </p>
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Tabs: Public & My Feed */}
        {(activeTab === 'public' || activeTab === 'my') && (
          <div className="space-y-6">
            {/* Header & Filter Row */}
            <div className="flex flex-col gap-4 pb-5 border-b border-white/[0.04]">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    {activeTab === 'public' ? 'Public Campus Feed' : 'My Ticket Locker'}
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">
                    {activeTab === 'public'
                      ? 'Browse real-time university complaints, join discussion trees, and upvote critical issues'
                      : 'Track active status and resolution progression of your filed issues'}
                  </p>
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between mt-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search discussion feed..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-white/[0.04] text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 transition-all focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:inline">Filter</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950/50 border border-white/[0.04] text-xs text-slate-300 focus:outline-none focus:border-indigo-500/80 cursor-pointer transition-colors"
                  >
                    <option value="" className="bg-[#0b0c16] text-slate-500">All Statuses</option>
                    <option value="PENDING" className="bg-[#0b0c16] text-white">Pending</option>
                    <option value="UNDER_REVIEW" className="bg-[#0b0c16] text-white">Under Review</option>
                    <option value="AWAITING_STUDENT_RESPONSE" className="bg-[#0b0c16] text-white">Awaiting Reply</option>
                    <option value="SOLVED" className="bg-[#0b0c16] text-white">Resolved</option>
                    <option value="REJECTED" className="bg-[#0b0c16] text-white">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Subreddit-style Category Carousel */}
              <div className="flex flex-col gap-1.5 mt-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400/80">Channels</span>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 custom-scrollbar">
                  <button
                    onClick={() => setCategoryFilter('')}
                    className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0 ${
                      categoryFilter === ''
                        ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                        : 'bg-slate-950/40 border-white/[0.04] text-slate-400 hover:border-indigo-500/20 hover:text-indigo-200'
                    }`}
                  >
                    c/All
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0 ${
                        categoryFilter === cat
                          ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                          : 'bg-slate-950/40 border-white/[0.04] text-slate-400 hover:border-indigo-500/20 hover:text-indigo-200'
                      }`}
                    >
                      c/{cat.replace(/\s+/g, '')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Complaints List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs uppercase font-bold tracking-widest text-indigo-400">Syncing feed...</span>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="p-16 text-center rounded-2xl bg-slate-950/20 border border-white/[0.04] text-slate-500 text-xs">
                No active complaints found matching this channel or filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredComplaints.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col md:flex-row items-stretch gap-4 p-5 rounded-2xl bg-slate-900/35 border border-white/[0.06] hover:border-indigo-500/25 transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.06)] group relative z-10"
                  >
                    {/* Left Upvote Panel (Reddit Hallmarks) */}
                    <div className="flex md:flex-col flex-row items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-950/50 border border-white/[0.04] w-full md:w-11 self-start">
                      <button className="p-1 rounded-lg hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-400 transition-colors">
                        <ChevronUp className="w-4.5 h-4.5" />
                      </button>
                      <span className="text-xs font-black text-slate-200 tracking-tight">
                        {c._count.comments * 3 + 2}
                      </span>
                      <button className="p-1 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors">
                        <ChevronDown className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    {/* Right Main Content */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        {/* Upper Metas */}
                        <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                          {getStatusBadge(c.status)}

                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1.5">
                            {c.visibility === 'PUBLIC' ? (
                              <>
                                <Globe className="w-3 h-3 text-indigo-400" /> Public
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 text-indigo-400" /> Private
                              </>
                            )}
                          </span>

                          <span className="text-[10px] font-bold text-indigo-400/80 uppercase">
                            c/{c.categories.split(',')[0]}
                          </span>

                          <span className="text-[10px] text-slate-500 font-medium">
                            • posted by u/{c.isAnonymous ? 'anonymous' : c.complainant.name}
                          </span>

                          <span className="text-[10px] text-slate-500">
                            • {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        {/* Title Link to details */}
                        <Link href={`/complaints/${c.id}`} className="block group/title">
                          <h3 className="text-base font-extrabold text-white group-hover/title:text-indigo-400 transition-colors leading-snug">
                            {c.summary}
                          </h3>
                        </Link>

                        {/* Description snippet */}
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                          {c.description}
                        </p>
                      </div>

                      {/* Bottom tags & metrics row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3.5 border-t border-white/[0.04]">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {c.categories.split(',').map((cat) => (
                            <span
                              key={cat}
                              className="px-2 py-0.5 rounded bg-slate-950/60 border border-white/[0.04] text-[9px] font-bold uppercase tracking-wider text-slate-400"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-4">
                          <Link
                            href={`/complaints/${c.id}`}
                            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-400 transition-colors"
                          >
                            <MessageSquare className="w-4 h-4 text-indigo-400" />
                            <span>{c._count.comments} {c._count.comments === 1 ? 'Reply' : 'Replies'}</span>
                          </Link>

                          <Link
                            href={`/complaints/${c.id}`}
                            className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            <span>Open Thread</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Target Overlay Card */}
                    <div className="w-full md:w-44 flex-shrink-0 flex flex-col justify-between p-3.5 rounded-xl bg-slate-950/30 border border-white/[0.04] text-xs">
                      {c.targetTeacher ? (
                        <div>
                          <p className="text-[9px] uppercase font-black text-indigo-400 tracking-wider">Faculty Target</p>
                          <p className="text-white font-bold mt-1 text-xs truncate">{c.targetTeacher.name}</p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{c.targetTeacher.department}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[9px] uppercase font-black text-indigo-400 tracking-wider">Target</p>
                          <p className="text-slate-500 mt-1 font-bold tracking-wide italic">General Board</p>
                        </div>
                      )}

                      <div className="mt-4 pt-3.5 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-slate-500 uppercase font-black tracking-widest">
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Submit New Complaint Form */}
        {activeTab === 'submit' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                File a Complaint
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Help clean up the campus. Provide objective details, target the correct channel, and attach evidence.
              </p>
            </div>

            {submitSuccess ? (
              <div className="p-12 rounded-3xl border border-emerald-500/25 bg-[#07080e] shadow-[0_20px_50px_rgba(16,185,129,0.05)] text-center flex flex-col items-center justify-center gap-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">Complaint Submitted Successfully!</h3>
                <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                  Your ticket has been logged into our blockchain queue. Redirecting to your personal dashboard...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitComplaint} className="space-y-6 p-6 md:p-8 rounded-3xl bg-slate-900/35 border border-white/[0.06] backdrop-blur-xl shadow-2xl relative">
                
                {/* Summary / Title */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-300">
                      Complaint Title / Subject
                    </label>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{summary.length}/100 chars</span>
                  </div>
                  <input
                    type="text"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value.slice(0, 100))}
                    placeholder="e.g. Inadequate cooling system in the central auditorium"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-white/[0.04] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 transition-all text-sm focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Categories Pill Grid */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">
                    Category Channels <span className="text-rose-400 font-black">*</span>
                  </label>
                  <p className="text-[10px] text-slate-500 mb-3.5 uppercase font-bold tracking-wider">Select all category badges that apply to your issue</p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => {
                      const selected = selectedCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-300 hover:scale-[1.01] ${
                            selected
                              ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                              : 'bg-slate-950/40 border-white/[0.04] text-slate-400 hover:border-indigo-500/20 hover:text-indigo-200'
                          }`}
                        >
                          c/{cat.replace(/\s+/g, '')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description Body */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-300">
                      Detailed Incident Log & Evidence Description
                    </label>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${getWordCount(description) > 1000 ? 'text-rose-400' : 'text-slate-500'}`}>
                      {getWordCount(description)} / 1000 words
                    </span>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a professional, clear description of the campus issue. Include locations, equipment details, specific times, and background context. Maintain academic tone for swift department action."
                    required
                    rows={7}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-white/[0.04] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 transition-all text-sm leading-relaxed focus:ring-1 focus:ring-indigo-500/20"
                  />
                  {getWordCount(description) > 1000 && (
                    <p className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 animate-fade-in font-bold">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                      Please trim description. Max word limit exceeded.
                    </p>
                  )}
                </div>

                {/* Targets & Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Faculty Target */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">
                      Target Faculty Member (Optional)
                    </label>
                    <div className="relative">
                      <select
                        value={targetTeacherId}
                        onChange={(e) => setTargetTeacherId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-white/[0.04] text-sm text-white focus:outline-none focus:border-indigo-500/80 cursor-pointer appearance-none focus:ring-1 focus:ring-indigo-500/20"
                      >
                        <option value="" className="bg-[#0b0c16] text-slate-500 font-medium">General / No specific target</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id} className="bg-[#0b0c16] text-white">
                            {t.name} ({t.department})
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 border-l border-white/[0.04] pl-3">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Searchable Tags */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">
                      Hashtags (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="e.g. ventilation, building-a, electrical"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-white/[0.04] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 transition-all text-sm focus:ring-1 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* Privacy & Anonymity Settings Panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-slate-950/40 border border-white/[0.04]">
                  {/* Anonymity Switch */}
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        id="isAnonymous"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="w-4.5 h-4.5 rounded border-indigo-900 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950 cursor-pointer"
                      />
                    </div>
                    <label htmlFor="isAnonymous" className="cursor-pointer">
                      <span className="block text-xs font-black uppercase tracking-wider text-white">Post Anonymously</span>
                      <span className="block text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Encrypts your student ID completely. Only Student Representatives retain validation access. Departments see you as anonymous.
                      </span>
                    </label>
                  </div>

                  {/* Visibility Toggles */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2.5">
                      Discussion Room Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setVisibility('PUBLIC')}
                        className={`py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 ${
                          visibility === 'PUBLIC'
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                            : 'bg-slate-950/40 border-white/[0.04] text-slate-400 hover:border-indigo-500/20 hover:text-indigo-200'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" /> Public Room
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisibility('PRIVATE')}
                        className={`py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 ${
                          visibility === 'PRIVATE'
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                            : 'bg-slate-950/40 border-white/[0.04] text-slate-400 hover:border-indigo-500/20 hover:text-indigo-200'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" /> Private Room
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                      {visibility === 'PUBLIC'
                        ? 'Creates a public subreddit feed thread that any student can upvote and comment on.'
                        : 'Creates a highly confidential private tunnel directly with Student Representative and target Teacher.'}
                    </p>
                  </div>
                </div>

                {/* Evidence Drag-and-drop vault */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">
                    Evidence Vault Uploads (Images / PDFs, Max 2MB)
                  </label>
                  
                  <div className="relative group rounded-2xl border-2 border-dashed border-white/[0.08] hover:border-indigo-500/40 transition-all duration-300 p-8 bg-slate-950/40 flex flex-col items-center justify-center text-center">
                    <input
                      type="file"
                      id="evidence-file"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:pointer-events-none"
                    />
                    <Upload className="w-9 h-9 text-indigo-400 mb-3 group-hover:scale-110 transition-transform duration-300" />
                    <p className="text-xs text-white font-bold uppercase tracking-wider">Drag & Drop Evidence Vault</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Click to browse local files (PDF, PNG, JPG)</p>
                  </div>

                  {uploading && (
                    <div className="flex items-center gap-2 mt-3 text-xs text-indigo-400 font-bold uppercase tracking-wider animate-pulse">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Uploading to vault...</span>
                    </div>
                  )}

                  {uploadError && (
                    <p className="mt-3 text-xs text-rose-400 flex items-center gap-1.5 animate-fade-in font-bold">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" /> {uploadError}
                    </p>
                  )}

                  {/* Attachment Vault Pills */}
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 mt-4">
                      {attachments.map((att, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 py-1.5 pl-3 pr-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-indigo-200 shadow-md animate-fade-in"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="font-bold truncate max-w-[160px] text-[11px]">{att.original}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(idx)}
                            className="p-1 rounded hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all duration-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting || getWordCount(description) > 1000}
                    className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-black text-xs uppercase tracking-widest text-white transition-all shadow-lg shadow-indigo-600/15 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4.5 h-4.5 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin" />
                        Transmitting complaint credentials...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Post to Campus Feed <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardHeader from '@/components/DashboardHeader';
import { 
  ArrowLeft, Calendar, User, Tag, Lock, Globe, FileText, CheckCircle2, 
  AlertCircle, MessageSquare, Send, Paperclip, X, AlertTriangle, ShieldCheck, 
  HelpCircle, Clock, Sparkles, Eye, CornerDownRight, ShieldAlert, Check
} from 'lucide-react';

interface Attachment {
  id?: string;
  filename: string;
  original: string;
  mimeType: string;
  url: string;
}

interface Comment {
  id: string;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    role: string;
  };
  attachments: Attachment[];
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
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  complainantId: string;
  complainant: {
    id: string;
    name: string;
    email?: string;
    role: string;
  };
  targetTeacherId: string | null;
  targetTeacher?: {
    id: string;
    name: string;
    email: string;
    department: string;
  } | null;
  attachments: Attachment[];
  comments: Comment[];
}

export default function ComplaintDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New comment state
  const [commentContent, setCommentContent] = useState('');
  const [commentAttachments, setCommentAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [replying, setReplying] = useState(false);

  // Moderation state
  const [newStatus, setNewStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [moderating, setModerating] = useState(false);
  const [showRejectionInput, setShowRejectionInput] = useState(false);

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  const fetchComplaintDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/complaints/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch complaint details.');
      }
      const data = await res.json();
      setComplaint(data.complaint);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
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

      setCommentAttachments([...commentAttachments, data.attachment]);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = (idx: number) => {
    setCommentAttachments(commentAttachments.filter((_, i) => i !== idx));
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setReplying(true);
    setError(null);

    try {
      const res = await fetch(`/api/complaints/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentContent,
          attachments: commentAttachments,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add reply.');

      setCommentContent('');
      setCommentAttachments([]);
      // Refresh details to load new comment
      await fetchComplaintDetails();
      setSuccess('Reply successfully added!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (status === 'REJECTED' && !rejectionReason.trim()) {
      setShowRejectionInput(true);
      setNewStatus(status);
      return;
    }

    setModerating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update complaint status.');

      setSuccess(`Complaint successfully marked as ${status.replace('_', ' ').toLowerCase()}!`);
      setShowRejectionInput(false);
      setRejectionReason('');
      await fetchComplaintDetails();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setModerating(false);
    }
  };

  const handleReopenComplaint = async () => {
    // Reopen reverts status to PENDING
    await handleStatusChange('PENDING');
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#07080e] text-white items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-radial-gradient from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col items-center justify-center gap-4 z-10">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold uppercase tracking-widest text-indigo-400 animate-pulse">
            Fetching Thread Discussion...
          </span>
        </div>
      </div>
    );
  }

  if (error && !complaint) {
    return (
      <div className="flex flex-col min-h-screen bg-[#07080e] text-white items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-radial-gradient from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-md w-full bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl text-center relative z-10 shadow-2xl">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-5 drop-shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-bounce" />
          <h2 className="text-2xl font-bold text-white mb-3">Error Loading Thread</h2>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-bold text-white transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
          >
            ← Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!complaint) return null;

  const isOwner = complaint.complainantId === user?.id;
  const isRep = user?.role === 'REPRESENTATIVE';
  const isTargetTeacher = complaint.targetTeacherId === user?.id;

  // Active status step helper
  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING': return 1;
      case 'UNDER_REVIEW': return 2;
      case 'AWAITING_STUDENT_RESPONSE': return 3;
      case 'SOLVED': return 4;
      case 'REJECTED': return 4;
      default: return 1;
    }
  };

  const currentStep = getStatusStepIndex(complaint.status);

  return (
    <div className="min-h-screen flex flex-col bg-[#07080e] text-slate-200 selection:bg-indigo-500/30 selection:text-white">
      <DashboardHeader />

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 flex flex-col gap-6 md:gap-8">
        
        {/* Navigation & Thread Breadcrumb */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900/60 border border-slate-800/80 text-indigo-400 hover:text-indigo-300 hover:border-indigo-500/30 hover:bg-slate-900 transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500">Thread Room</span>
              <h1 className="text-sm font-bold text-slate-300 truncate max-w-xs md:max-w-md">
                {complaint.summary}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 rounded-xl bg-slate-900/40 border border-slate-850 px-3 py-1.5 text-xs text-slate-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>Ticket: #{complaint.id.slice(0, 8)}...</span>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="p-4.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-200 text-sm flex items-start gap-3.5 shadow-lg shadow-rose-950/10 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}
        {success && (
          <div className="p-4.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 text-sm flex items-start gap-3.5 shadow-lg shadow-emerald-950/10 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
            <p className="leading-relaxed">{success}</p>
          </div>
        )}

        {/* 2-Column Social Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
          
          {/* LEFT COLUMN: Complaint Card, Action Console, Reply Input, Comments Feed */}
          <div className="lg:col-span-2 flex flex-col gap-6 md:gap-8">
            
            {/* The Complaint Detail Post Card */}
            <div className="glass-card rounded-3xl p-5 md:p-8 relative overflow-hidden shadow-2xl">
              {/* Background gradient flares */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-indigo-500/5 to-transparent pointer-events-none rounded-bl-full" />
              
              {/* Post Header (Reddit style) */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800/40">
                <div className="flex items-center gap-3">
                  {/* Dynamic Color Avatar Pill */}
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${
                    complaint.isAnonymous ? 'from-amber-600/20 to-orange-600/15 text-amber-400 border-amber-500/30' : 'from-indigo-600/20 to-violet-600/15 text-indigo-400 border-indigo-500/30'
                  } border flex items-center justify-center font-bold text-sm tracking-wider uppercase`}>
                    {complaint.isAnonymous ? 'AS' : complaint.complainant.name.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-extrabold text-slate-100 hover:underline cursor-pointer">
                        {complaint.isAnonymous 
                          ? (isRep || isOwner ? `${complaint.complainant.name} (Anonymous)` : 'Anonymous Student')
                          : complaint.complainant.name
                        }
                      </span>
                      {complaint.isAnonymous && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-extrabold uppercase tracking-widest">
                          Anon Mode
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 text-[10px] text-slate-500 mt-1 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(complaint.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] uppercase tracking-wider text-slate-400">
                        {complaint.visibility === 'PUBLIC' ? (
                          <>
                            <Globe className="w-3 h-3 text-emerald-400" /> Public
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-rose-400" /> Private Room
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submitter details hover box (only reps/owner) */}
                {complaint.complainant.email && (isRep || isOwner) && (
                  <div className="text-right hidden sm:block">
                    <p className="text-[9px] text-indigo-400 uppercase tracking-widest font-extrabold">Filer Coordinates</p>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">{complaint.complainant.email}</p>
                  </div>
                )}
              </div>

              {/* Title & Body */}
              <div className="py-6 space-y-4">
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-snug">
                  {complaint.summary}
                </h2>
                <div className="text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-sans pr-1">
                  {complaint.description}
                </div>
              </div>

              {/* Tag / Category Pills Section */}
              <div className="flex flex-wrap gap-2.5 items-center pt-4 border-t border-slate-800/40">
                <span className="text-[10px] uppercase font-extrabold text-indigo-400 tracking-wider flex items-center gap-1">
                  <Tag className="w-3 h-3" /> c/Categories:
                </span>
                {complaint.categories.split(',').map((cat) => (
                  <span
                    key={cat}
                    className="px-3 py-1 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-indigo-300 font-bold hover:border-indigo-500/40 hover:text-white transition-all cursor-pointer"
                  >
                    c/{cat.trim()}
                  </span>
                ))}
                
                {complaint.tags && complaint.tags.split(',').map((tag) => (
                  <span key={tag} className="text-xs text-slate-500 font-medium hover:text-slate-300 transition-colors cursor-pointer">
                    #{tag.trim()}
                  </span>
                ))}
              </div>

              {/* Rejection Alert Box */}
              {complaint.status === 'REJECTED' && complaint.rejectionReason && (
                <div className="mt-6 p-4.5 rounded-2xl border border-rose-500/20 bg-rose-950/10 text-rose-200 text-xs flex gap-3.5 items-start animate-fade-in shadow-inner">
                  <AlertTriangle className="w-5.5 h-5.5 flex-shrink-0 mt-0.5 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)] animate-pulse" />
                  <div>
                    <p className="font-extrabold text-rose-100 text-sm uppercase tracking-wide">Ticket Rejection Details</p>
                    <p className="mt-1 leading-relaxed text-slate-300 font-medium">{complaint.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Evidence Attachments Grid */}
              {complaint.attachments && complaint.attachments.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-800/40">
                  <p className="text-[10px] uppercase font-extrabold text-indigo-400 tracking-widest mb-3 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Verified Evidence Vault
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {complaint.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 transition-all text-xs font-bold text-indigo-300 group shadow-md"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                          <span className="truncate pr-1 text-slate-200 group-hover:text-indigo-300 transition-colors">{att.original}</span>
                        </div>
                        <span className="text-[9px] uppercase tracking-widest text-slate-500 group-hover:text-indigo-400 transition-colors px-2 py-0.5 rounded bg-slate-950 font-mono">View</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ACTION DESK CONSOLE: Status transitions (Reps & Target Teachers) */}
            {(isRep || isTargetTeacher || (isOwner && (complaint.status === 'SOLVED' || complaint.status === 'REJECTED'))) && (
              <div className="glass-card rounded-3xl p-5 md:p-6 border-indigo-900/30 bg-gradient-to-r from-slate-900/45 to-indigo-950/10 flex flex-col gap-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
                    <h3 className="text-xs uppercase font-extrabold text-indigo-300 tracking-wider">Discussion Board Command Desk</h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">System State Router</span>
                </div>
                
                {/* Status transitions grid */}
                {(isRep || isTargetTeacher) && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs text-slate-400 mr-2 font-bold font-mono">Transition Status:</span>
                    <button
                      onClick={() => handleStatusChange('UNDER_REVIEW')}
                      disabled={moderating}
                      className={`py-2 px-3.5 rounded-xl border text-xs font-extrabold transition-all duration-300 flex items-center gap-1.5 ${
                        complaint.status === 'UNDER_REVIEW'
                          ? 'bg-indigo-600/35 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-indigo-500/50 hover:text-white'
                      }`}
                    >
                      Under Review
                    </button>
                    <button
                      onClick={() => handleStatusChange('AWAITING_STUDENT_RESPONSE')}
                      disabled={moderating}
                      className={`py-2 px-3.5 rounded-xl border text-xs font-extrabold transition-all duration-300 flex items-center gap-1.5 ${
                        complaint.status === 'AWAITING_STUDENT_RESPONSE'
                          ? 'bg-pink-600/35 border-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.2)]'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-indigo-500/50 hover:text-white'
                      }`}
                    >
                      Awaiting Response
                    </button>
                    <button
                      onClick={() => handleStatusChange('SOLVED')}
                      disabled={moderating}
                      className={`py-2 px-3.5 rounded-xl border text-xs font-extrabold transition-all duration-300 flex items-center gap-1.5 ${
                        complaint.status === 'SOLVED'
                          ? 'bg-emerald-600/35 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-indigo-500/50 hover:text-white'
                      }`}
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => handleStatusChange('REJECTED')}
                      disabled={moderating}
                      className={`py-2 px-3.5 rounded-xl border text-xs font-extrabold transition-all duration-300 flex items-center gap-1.5 ${
                        complaint.status === 'REJECTED'
                          ? 'bg-rose-600/35 border-rose-500 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-indigo-500/50 hover:text-white'
                      }`}
                    >
                      Reject Ticket
                    </button>
                  </div>
                )}

                {/* Reject Prompt */}
                {showRejectionInput && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-rose-500/20 space-y-3.5 animate-fade-in">
                    <div>
                      <label className="block text-[10px] font-extrabold text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> Rejection Explanation Required
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Provide a clear, objective rationale for rejecting this complaint. State the missing details or validation guidelines necessary for student to address..."
                        required
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-rose-500/40 transition-colors leading-relaxed"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange('REJECTED')}
                        disabled={moderating || !rejectionReason.trim()}
                        className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors active:scale-95 shadow-md shadow-rose-900/25"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        onClick={() => setShowRejectionInput(false)}
                        className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-bold hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Submitter Action: Reopen ticket */}
                {isOwner && (complaint.status === 'SOLVED' || complaint.status === 'REJECTED') && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-850">
                    <div className="text-xs text-slate-400 leading-relaxed font-medium">
                      <p className="font-extrabold text-slate-200">Unsatisfied with resolution?</p>
                      <p className="mt-0.5 text-slate-500 text-[11px]">Reopening the ticket reverts the status to <span className="text-indigo-400 font-bold">Pending Review</span>.</p>
                    </div>
                    <button
                      onClick={handleReopenComplaint}
                      disabled={moderating}
                      className="w-full sm:w-auto py-2 px-4.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-extrabold text-white transition-all shadow-md shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
                    >
                      Reopen Discussion
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* VERIFIED REPLY BUILDER (Reply Box editor) */}
            {(user?.role !== 'STUDENT' || isOwner) && (
              <div className="glass-card rounded-3xl p-5 md:p-6 border-slate-800/80 bg-gradient-to-b from-slate-900/40 to-slate-950/20 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase font-extrabold text-indigo-300 tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Post Verified Response
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Replying as {user?.role.toLowerCase()}</span>
                </div>
                
                <form onSubmit={handlePostReply} className="space-y-4">
                  <div className="relative">
                    <textarea
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder="Contribute constructive feedback, resolve details or request logs..."
                      required
                      rows={4}
                      className="w-full px-4.5 py-4.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-sm text-white placeholder-slate-550 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-800/40">
                    {/* File Attachment Area */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="file"
                          id="comment-file"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:pointer-events-none"
                        />
                        <button
                          type="button"
                          className="py-2.5 px-3.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-bold text-indigo-300 flex items-center gap-2 hover:border-indigo-500/50 hover:text-white transition-all shadow-sm active:scale-95"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Attach Log / Evidence</span>
                        </button>
                      </div>

                      {uploading && (
                        <span className="text-[10px] text-indigo-400 font-extrabold animate-pulse">Uploading...</span>
                      )}
                      {uploadError && (
                        <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {uploadError}
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={replying || !commentContent.trim()}
                      className="py-2.5 px-5.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-bold text-white transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] shadow-md shadow-indigo-600/10"
                    >
                      {replying ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin" />
                          <span>Filing Reply...</span>
                        </>
                      ) : (
                        <>
                          <span>Post Reply</span>
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Uploaded attachments pills */}
                  {commentAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {commentAttachments.map((att, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-indigo-200 font-semibold"
                        >
                          <Paperclip className="w-3 h-3 text-indigo-400" />
                          <span className="truncate max-w-[150px]">{att.original}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(idx)}
                            className="p-0.5 rounded-md hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* THE REDDIT DISCUSSION THREAD COMMENTS FEED */}
            <div className="space-y-5 md:space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800/40 pb-4">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2.5">
                  <MessageSquare className="w-4.5 h-4.5 text-indigo-400" />
                  <span>Discussion Stream ({complaint.comments.length} replies)</span>
                </h3>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Chronological Nest</span>
              </div>

              {complaint.comments.length === 0 ? (
                <div className="p-10 text-center rounded-3xl border border-slate-850 bg-slate-900/10 text-slate-500 text-xs font-semibold">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-700 mb-3" />
                  No responses on this ticket thread yet. Initiate communication using the composer panel.
                </div>
              ) : (
                <div className="relative pl-1 md:pl-2 space-y-6">
                  
                  {/* Reddit-style Vertical Left Thread Line */}
                  <div className="absolute left-3.5 top-2 bottom-6 w-0.5 bg-gradient-to-b from-indigo-500/60 via-violet-500/30 to-transparent pointer-events-none" />

                  {complaint.comments.map((comm) => {
                    const isCommentOwner = comm.authorId === user?.id;
                    const isOP = comm.authorId === complaint.complainantId;
                    
                    // Dynamic styling depending on roles
                    let bubbleStyle = 'bg-slate-900/40 border-slate-850 text-slate-200 hover:border-slate-800/80';
                    let badgeLabel = 'Student';
                    let badgeClass = 'bg-slate-800/60 border-slate-700 text-slate-400';
                    let roleIcon = <User className="w-3 h-3" />;

                    if (comm.author.role === 'REPRESENTATIVE') {
                      bubbleStyle = 'bg-violet-950/5 border-violet-900/25 text-slate-100 hover:border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.02)]';
                      badgeLabel = 'Lead Representative';
                      badgeClass = 'bg-violet-500/10 border-violet-500/20 text-violet-400';
                      roleIcon = <Sparkles className="w-3 h-3 text-violet-400" />;
                    } else if (comm.author.role === 'TEACHER') {
                      bubbleStyle = 'bg-emerald-950/5 border-emerald-900/25 text-slate-100 hover:border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.02)]';
                      badgeLabel = 'Verified Faculty';
                      badgeClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
                      roleIcon = <ShieldCheck className="w-3 h-3 text-emerald-400" />;
                    } else if (isOP) {
                      badgeLabel = 'Original Poster';
                      badgeClass = 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
                      roleIcon = <User className="w-3 h-3 text-indigo-400" />;
                    }

                    return (
                      <div key={comm.id} className="relative pl-8 md:pl-10 animate-fade-in group">
                        
                        {/* Horizontal connector node */}
                        <div className="absolute left-3.5 top-5 w-4.5 h-0.5 bg-slate-800" />
                        
                        {/* Thread Node Dot */}
                        <div className={`absolute left-1.5 top-3.5 w-4 h-4 rounded-full border-2 ${
                          comm.author.role === 'TEACHER' ? 'border-emerald-500 bg-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                          comm.author.role === 'REPRESENTATIVE' ? 'border-violet-500 bg-slate-950 shadow-[0_0_8px_rgba(139,92,246,0.4)]' :
                          isOP ? 'border-indigo-500 bg-slate-950 shadow-[0_0_8px_rgba(99,102,241,0.4)]' :
                          'border-slate-800 bg-slate-950'
                        } flex items-center justify-center transition-transform group-hover:scale-110`} />

                        {/* Comment bubble card */}
                        <div className={`p-5 rounded-2xl border ${bubbleStyle} transition-all duration-300 shadow-md`}>
                          
                          {/* Comment Header */}
                          <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-500 font-semibold mb-3 border-b border-slate-800/20 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs hover:underline cursor-pointer">
                                {comm.author.name}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full border text-[9px] uppercase font-extrabold tracking-wider flex items-center gap-1 ${badgeClass}`}>
                                {roleIcon}
                                {badgeLabel}
                              </span>
                            </div>
                            
                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(comm.createdAt).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {/* Comment Content */}
                          <p className="text-xs md:text-sm leading-relaxed text-slate-350 whitespace-pre-wrap">
                            {comm.content}
                          </p>

                          {/* Comment Evidence Attachments */}
                          {comm.attachments && comm.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2.5 pt-3 mt-4 border-t border-slate-800/30">
                              {comm.attachments.map((att, attIdx) => (
                                <a
                                  key={attIdx}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-900 transition-colors text-[10px] text-indigo-300 font-bold border border-slate-800/80 hover:border-indigo-500/40 shadow-sm"
                                >
                                  <Paperclip className="w-3 h-3 text-indigo-400" />
                                  <span>{att.original}</span>
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Decorative Social engagement elements to match Reddit look */}
                          <div className="flex items-center gap-4 mt-3 text-[10px] font-bold text-slate-500 border-t border-slate-850 pt-2.5">
                            <button type="button" className="hover:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer">
                              <span>▲ Upvote</span>
                            </button>
                            <span>•</span>
                            <button type="button" className="hover:text-slate-300 transition-colors cursor-pointer">
                              Reply
                            </button>
                            <span>•</span>
                            <button type="button" className="hover:text-slate-300 transition-colors cursor-pointer">
                              Share
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: SLA Progression, Investigator Info, Metadata Card */}
          <div className="flex flex-col gap-6 md:gap-8">
            
            {/* SLA REAL-TIME COMPLIANCE TIMELINE */}
            <div className="glass-card rounded-3xl p-5 md:p-6 border-slate-800 shadow-xl relative">
              <div className="absolute top-4 right-4 text-[9px] uppercase font-mono text-slate-600">SLA Audit</div>
              <h3 className="text-xs uppercase font-extrabold text-indigo-400 tracking-widest mb-5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> SLA Progression Tracker
              </h3>
              
              {/* Vertical Stepper timeline */}
              <div className="relative pl-8 space-y-6 py-2">
                {/* Visual Connector bar */}
                <div className="absolute left-3.5 top-5 bottom-5 w-0.5 bg-slate-800" />

                {/* Step 1: PENDING */}
                <div className="relative">
                  {/* Step bubble */}
                  <div className={`absolute -left-8 top-0 w-7.5 h-7.5 rounded-xl border flex items-center justify-center text-[10px] font-extrabold transition-all duration-300 ${
                    currentStep >= 1 
                      ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.25)]' 
                      : 'bg-slate-900 border-slate-800 text-slate-600'
                  }`}>
                    {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 justify-between">
                      <p className={`text-xs font-extrabold ${currentStep >= 1 ? 'text-white' : 'text-slate-500'}`}>1. Ticket Received</p>
                      {currentStep === 1 && <span className="text-[9px] uppercase font-extrabold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">Active</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Status: Pending review validation.</p>
                    <p className="text-[9px] text-slate-500 font-semibold font-mono mt-0.5">SLA limit: 48 hours</p>
                  </div>
                </div>

                {/* Step 2: INVESTIGATION */}
                <div className="relative">
                  {/* Step bubble */}
                  <div className={`absolute -left-8 top-0 w-7.5 h-7.5 rounded-xl border flex items-center justify-center text-[10px] font-extrabold transition-all duration-300 ${
                    currentStep >= 2 
                      ? 'bg-violet-500/15 border-violet-500 text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.25)]' 
                      : 'bg-slate-900 border-slate-800 text-slate-600'
                  }`}>
                    {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 justify-between">
                      <p className={`text-xs font-extrabold ${currentStep >= 2 ? 'text-white' : 'text-slate-500'}`}>2. Investigation</p>
                      {currentStep === 2 && <span className="text-[9px] uppercase font-extrabold bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded animate-pulse">Active</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Investigating officers review evidence.</p>
                    <p className="text-[9px] text-slate-500 font-semibold font-mono mt-0.5">Faculty communication</p>
                  </div>
                </div>

                {/* Step 3: AWAITING STUDENT RESPONSE */}
                <div className="relative">
                  {/* Step bubble */}
                  <div className={`absolute -left-8 top-0 w-7.5 h-7.5 rounded-xl border flex items-center justify-center text-[10px] font-extrabold transition-all duration-300 ${
                    currentStep >= 3 
                      ? 'bg-pink-500/15 border-pink-500 text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.25)]' 
                      : 'bg-slate-900 border-slate-800 text-slate-600'
                  }`}>
                    {currentStep > 3 ? <Check className="w-3.5 h-3.5" /> : '3'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 justify-between">
                      <p className={`text-xs font-extrabold ${currentStep >= 3 ? 'text-white' : 'text-slate-500'}`}>3. Action Required</p>
                      {currentStep === 3 && <span className="text-[9px] uppercase font-extrabold bg-pink-500/10 text-pink-400 border border-pink-500/20 px-1.5 py-0.5 rounded">Student Action</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Awaiting detail clarification response.</p>
                    <p className="text-[9px] text-slate-500 font-semibold font-mono mt-0.5">Response within 3d</p>
                  </div>
                </div>

                {/* Step 4: SOLVED / RESOLVED */}
                <div className="relative">
                  {/* Step bubble */}
                  <div className={`absolute -left-8 top-0 w-7.5 h-7.5 rounded-xl border flex items-center justify-center text-[10px] font-extrabold transition-all duration-300 ${
                    complaint.status === 'SOLVED' ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.25)]' :
                    complaint.status === 'REJECTED' ? 'bg-rose-500/15 border-rose-500 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.25)]' :
                    'bg-slate-900 border-slate-800 text-slate-600'
                  }`}>
                    {complaint.status === 'SOLVED' ? <Check className="w-3.5 h-3.5" /> : 
                     complaint.status === 'REJECTED' ? <X className="w-3.5 h-3.5" /> : '4'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 justify-between">
                      <p className={`text-xs font-extrabold ${currentStep >= 4 ? 'text-white' : 'text-slate-500'}`}>
                        {complaint.status === 'REJECTED' ? '4. Ticket Rejected' : '4. Solved Resolution'}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Final audit logs generated & closed.</p>
                    <p className="text-[9px] text-slate-500 font-semibold font-mono mt-0.5">SLA limit: 7 days total</p>
                  </div>
                </div>

              </div>
            </div>

            {/* ASSIGNED INVESTIGATOR / FACULTY ASSIGNMENT CARD */}
            <div className="glass-card rounded-3xl p-5 md:p-6 border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-500/5 to-transparent pointer-events-none rounded-bl-full" />
              <h3 className="text-xs uppercase font-extrabold text-indigo-400 tracking-widest mb-4 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Institutional Assigner
              </h3>
              
              {complaint.targetTeacher ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center font-bold text-sm text-emerald-400">
                      {complaint.targetTeacher.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">{complaint.targetTeacher.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 font-mono">{complaint.targetTeacher.department} faculty</p>
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-slate-850 text-xs space-y-1 text-slate-400">
                    <p className="font-semibold truncate">Email: {complaint.targetTeacher.email}</p>
                    <p className="text-[10px] text-slate-500">Investigator is fully bound under institutional SLA responsibilities.</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center rounded-2xl bg-slate-950 border border-slate-900 text-xs italic text-slate-500">
                  General Faculty Oversight Board (Unassigned)
                </div>
              )}
            </div>

            {/* TICKET DETAILS STATS METRICS */}
            <div className="glass-card rounded-3xl p-5 md:p-6 border-slate-850 bg-slate-900/15 shadow-xl space-y-4">
              <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-widest font-mono">System Telemetry</h3>
              
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-850">
                  <span className="text-slate-400 font-medium">Status Flag</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black tracking-widest ${
                    complaint.status === 'PENDING' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' :
                    complaint.status === 'UNDER_REVIEW' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/25' :
                    complaint.status === 'AWAITING_STUDENT_RESPONSE' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/25' :
                    complaint.status === 'SOLVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                  }`}>
                    {complaint.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-1.5 border-b border-slate-850">
                  <span className="text-slate-400 font-medium">Visibility Level</span>
                  <span className="text-slate-200 font-bold uppercase tracking-wider font-mono text-[10px]">
                    {complaint.visibility}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-850">
                  <span className="text-slate-400 font-medium">Filing Date</span>
                  <span className="text-slate-200 font-semibold">
                    {new Date(complaint.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-850">
                  <span className="text-slate-400 font-medium">Last Update</span>
                  <span className="text-slate-200 font-semibold">
                    {new Date(complaint.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-400 font-medium">Total Replies</span>
                  <span className="text-indigo-400 font-extrabold font-mono text-sm">
                    {complaint.comments.length}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

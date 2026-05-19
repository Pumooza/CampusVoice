'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Eye, ShieldAlert, BarChart3, AlertCircle, Check, X, Trash2, EyeOff, 
  Search, Filter, ShieldCheck, Mail, UserMinus, Clock, Hourglass, Award, BarChart4,
  Compass, ArrowUpRight, Ban, TrendingUp, AlertTriangle, ShieldCheck as ShieldIcon
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
    email: string;
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

interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  createdAt: string;
}

interface ActiveUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  isApproved: boolean;
  isBanned: boolean;
}

interface AnalyticsStats {
  total: number;
  resolved: number;
  pending: number;
  underReview: number;
  awaitingResponse: number;
  rejected: number;
  hidden: number;
  resolutionRate: number;
  averageResolutionTimeHours: number;
  slaComplianceRate: number;
  responseSlaComplianceRate: number;
  responseSlaComplianceRate?: number; // compat
}

interface ChartItem {
  name: string;
  value: number;
}

export default function RepDashboard() {
  const [activeTab, setActiveTab] = useState<'approvals' | 'oversight' | 'analytics' | 'bans'>('approvals');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Approvals state
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);

  // Oversight state
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Analytics state
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [categoryData, setCategoryData] = useState<ChartItem[]>([]);
  const [departmentData, setDepartmentData] = useState<ChartItem[]>([]);

  // Bans center state
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [banEmail, setBanEmail] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banSearch, setBanSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'approvals') {
        const res = await fetch('/api/admin/registrations');
        if (!res.ok) throw new Error('Failed to load pending users.');
        const data = await res.json();
        setPendingUsers(data.users || []);
      } else if (activeTab === 'oversight') {
        let url = `/api/complaints`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to load oversight feed.');
        const data = await res.json();
        setComplaints(data.complaints || []);
      } else if (activeTab === 'analytics') {
        const res = await fetch('/api/admin/analytics');
        if (!res.ok) throw new Error('Failed to compile system analytics.');
        const data = await res.json();
        setStats(data.statistics);
        setCategoryData(data.categoryData || []);
        setDepartmentData(data.departmentData || []);
      } else if (activeTab === 'bans') {
        const res = await fetch('/api/admin/users');
        if (!res.ok) throw new Error('Failed to load user directories.');
        const data = await res.json();
        setActiveUsers(data.users || []);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/registrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to moderate account.');
      
      setSuccessMsg(data.message);
      setPendingUsers(pendingUsers.filter((u) => u.id !== id));
    } catch (err: any) {
      setError(err.message || 'Error moderating user registration.');
    }
  };

  const handleHideComplaint = async (id: string, currentStatus: string) => {
    setError(null);
    setSuccessMsg(null);
    const nextStatus = currentStatus === 'HIDDEN' ? 'PENDING' : 'HIDDEN';
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to moderate complaint visibility.');
      
      setSuccessMsg(`Complaint has been successfully ${nextStatus === 'HIDDEN' ? 'hidden' : 'unhidden'}.`);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Error moderating complaint.');
    }
  };

  const handleDeleteComplaint = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to permanently delete this complaint? This action is non-reversible.')) {
      return;
    }
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete complaint.');
      
      setSuccessMsg(data.message);
      setComplaints(complaints.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err.message || 'Error deleting complaint.');
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to permanently ban this user? Their active account will be blocked and their email blacklisted.')) {
      return;
    }
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason: banReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to issue ban.');
      
      setSuccessMsg(data.message);
      setBanReason('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Error banning user.');
    }
  };

  const handleBanEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const matchingUser = activeUsers.find((u) => u.email.toLowerCase() === banEmail.toLowerCase().trim());
    if (matchingUser) {
      await handleBanUser(matchingUser.id);
      setBanEmail('');
      return;
    }

    setError('Only registered accounts can be targeted for banning directly from the interface. Please check the email.');
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch = c.summary.toLowerCase().includes(search.toLowerCase()) || 
                          c.description.toLowerCase().includes(search.toLowerCase()) ||
                          c.complainant.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter ? c.categories.includes(categoryFilter) : true;
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredBansUsers = activeUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(banSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(banSearch.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'UNDER_REVIEW': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'AWAITING_STUDENT_RESPONSE': return 'bg-pink-500/10 text-pink-400 border border-pink-500/20';
      case 'SOLVED': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'REJECTED': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'HIDDEN': return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border border-white/[0.04]';
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-3">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] backdrop-blur-xl flex flex-col gap-2 shadow-2xl shadow-black/40">
          <p className="text-[10px] font-black tracking-widest uppercase text-slate-500 px-3 mb-1">Control Hub</p>
          <button
            onClick={() => { setActiveTab('approvals'); setError(null); setSuccessMsg(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-300 text-left group ${
              activeTab === 'approvals'
                ? 'bg-indigo-600/10 border-indigo-500/30 text-white shadow-inner shadow-indigo-500/5'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02] hover:border-white/[0.04]'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeTab === 'approvals' ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span>Registration queue</span>
            {pendingUsers.length > 0 && (
              <span className="ml-auto bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('oversight'); setError(null); setSuccessMsg(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-300 text-left group ${
              activeTab === 'oversight'
                ? 'bg-indigo-600/10 border-indigo-500/30 text-white shadow-inner shadow-indigo-500/5'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02] hover:border-white/[0.04]'
            }`}
          >
            <Eye className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeTab === 'oversight' ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span>Oversight Feed</span>
          </button>

          <button
            onClick={() => { setActiveTab('analytics'); setError(null); setSuccessMsg(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-300 text-left group ${
              activeTab === 'analytics'
                ? 'bg-indigo-600/10 border-indigo-500/30 text-white shadow-inner shadow-indigo-500/5'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02] hover:border-white/[0.04]'
            }`}
          >
            <BarChart3 className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeTab === 'analytics' ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span>System Analytics</span>
          </button>

          <button
            onClick={() => { setActiveTab('bans'); setError(null); setSuccessMsg(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-300 text-left group ${
              activeTab === 'bans'
                ? 'bg-indigo-600/10 border-indigo-500/30 text-white shadow-inner shadow-indigo-500/5'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02] hover:border-white/[0.04]'
            }`}
          >
            <ShieldAlert className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeTab === 'bans' ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span>Permanent Ban Center</span>
          </button>
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 gap-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-200 text-xs font-medium flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-rose-400" />
            <p>{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 text-xs font-medium flex items-start gap-3 shadow-lg">
            <Check className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-emerald-400" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* Tab 1: Pending Approvals */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-white">Pending Account Registrations</h2>
              <p className="text-slate-400 text-xs mt-1">
                Moderate university applicants. To protect anonymity integrity, verify credentials manually before granting entry.
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4 bg-white/[0.01] border border-white/[0.03] rounded-3xl">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Scanning pending directory...</span>
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="p-20 text-center rounded-3xl bg-white/[0.01] border border-white/[0.03] text-slate-500 text-xs font-semibold uppercase tracking-wider">
                All registration applications have been successfully processed.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {pendingUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:border-indigo-500/30 hover:bg-white/[0.02] transition-all duration-300 flex flex-col justify-between shadow-2xl relative overflow-hidden group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-900 border border-white/[0.03] text-indigo-400 shadow">
                          {u.role}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          Registered {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-white mt-4 truncate leading-snug">{u.name}</h3>
                      <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-indigo-400" /> {u.email}
                      </p>
                      {u.department && (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300/80 mt-3 pt-3 border-t border-white/[0.03]">
                          c/Dept: {u.department}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 mt-6 pt-4 border-t border-white/[0.03]">
                      <button
                        onClick={() => handleApproval(u.id, 'APPROVE')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-black uppercase tracking-wider text-white transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" /> Approve Entry
                      </button>
                      <button
                        onClick={() => handleApproval(u.id, 'REJECT')}
                        className="py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-black uppercase tracking-wider text-rose-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Oversight Feed */}
        {activeTab === 'oversight' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] backdrop-blur-xl flex flex-col md:flex-row gap-5 items-stretch md:items-center justify-between shadow-2xl shadow-black/40">
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-white">Representative Oversight Feed</h2>
                <p className="text-slate-400 text-xs mt-1">
                  Full visibility across private, public, and hidden discussions. Real submitter identities are de-anonymized below for administrative oversight.
                </p>
              </div>

              {/* Oversight filter panel */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by student or title..."
                    className="pl-9 pr-4 py-2.5 w-44 sm:w-56 rounded-xl bg-slate-950 border border-white/[0.04] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/[0.04] text-xs text-slate-300 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[#080914] text-slate-500">All Statuses</option>
                    <option value="PENDING" className="bg-[#080914] text-white">Pending</option>
                    <option value="UNDER_REVIEW" className="bg-[#080914] text-white font-semibold text-indigo-400">Under Review</option>
                    <option value="AWAITING_STUDENT_RESPONSE" className="bg-[#080914] text-white">Awaiting Response</option>
                    <option value="SOLVED" className="bg-[#080914] text-white">Resolved</option>
                    <option value="REJECTED" className="bg-[#080914] text-white">Rejected</option>
                    <option value="HIDDEN" className="bg-[#080914] text-white">Hidden / Flagged</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4 bg-white/[0.01] border border-white/[0.03] rounded-3xl">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Retrieving Oversight Logs...</span>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="p-20 text-center rounded-3xl bg-white/[0.01] border border-white/[0.03] text-slate-500 text-xs font-semibold uppercase tracking-wider">
                No complaints recorded in the database matching parameters.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {filteredComplaints.map((c) => (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:border-indigo-500/20 transition-all duration-300 flex flex-col md:flex-row gap-5 items-stretch relative overflow-hidden shadow-2xl"
                  >
                    <div className="absolute inset-0 bg-indigo-500/[0.005] pointer-events-none" />
                    <div className="flex-1 flex flex-col justify-between relative z-10">
                      <div>
                        {/* Status Badges */}
                        <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${getStatusColor(c.status)}`}>
                            {c.status.replace('_', ' ')}
                          </span>

                          <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-900 text-indigo-400 border border-white/[0.03]">
                            {c.visibility}
                          </span>

                          {c.isAnonymous && (
                            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Anonymous Post
                            </span>
                          )}

                          <span className="text-[10px] text-slate-500 font-bold">
                            Posted {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <Link href={`/complaints/${c.id}`} className="block group">
                          <h3 className="text-base font-black text-white group-hover:text-indigo-400 transition-colors duration-300 leading-snug">
                            {c.summary}
                          </h3>
                        </Link>

                        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                          {c.description}
                        </p>
                      </div>

                      {/* De-anonymized Author Details */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-5 pt-4 border-t border-white/[0.03] bg-slate-950/60 p-4 rounded-xl border border-white/[0.03]">
                        <div>
                          <p className="text-[9px] uppercase font-black text-indigo-400 tracking-wider">True Submitter (Auditor View)</p>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] font-bold">
                            <span className="text-white">{c.complainant.name}</span>
                            <span className="text-slate-500 font-medium">({c.complainant.email})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleHideComplaint(c.id, c.status)}
                            className={`py-2 px-3.5 rounded-lg border text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${
                              c.status === 'HIDDEN'
                                ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-inner'
                                : 'bg-slate-900 border-white/[0.04] text-slate-400 hover:text-white hover:border-indigo-500/50'
                            }`}
                          >
                            {c.status === 'HIDDEN' ? (
                              <>
                                <Eye className="w-3.5 h-3.5" /> Unflag Item
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" /> Flag / Hide
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteComplaint(c.id)}
                            className="py-2 px-3.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-black uppercase tracking-wider text-rose-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Purge
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Faculty Target Info */}
                    <div className="md:w-56 flex-shrink-0 flex flex-col justify-between p-4 rounded-xl bg-slate-950/60 border border-white/[0.03] text-xs relative z-10">
                      <div>
                        <p className="text-[9px] uppercase font-black text-indigo-400 tracking-wider">Faculty Target</p>
                        <p className="text-white font-extrabold mt-1 text-xs truncate">
                          {c.targetTeacher ? c.targetTeacher.name : 'General Board'}
                        </p>
                        {c.targetTeacher?.department && (
                          <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 truncate">{c.targetTeacher.department}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-white/[0.03] text-[10px] font-bold">
                        <span className="text-slate-400 uppercase tracking-wider">{c._count.comments} replies</span>
                        <Link href={`/complaints/${c.id}`} className="text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-wider flex items-center gap-0.5 transition-colors">
                          View details →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: System Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-white">Campus SLA & System Analytics</h2>
              <p className="text-slate-400 text-xs mt-1">
                Active tracking of complaint categories, department compliance rates, and strict 48h initial review & 7d final resolution SLAs.
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4 bg-white/[0.01] border border-white/[0.03] rounded-3xl">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Compiling Analytics Matrix...</span>
              </div>
            ) : !stats ? (
              <div className="p-8 text-center text-slate-500 text-xs">No analytics data compiling.</div>
            ) : (
              <div className="space-y-8">
                {/* 4 SLA Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* SLA Compliance (7d resolution) */}
                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.04] backdrop-blur-xl flex flex-col justify-between relative overflow-hidden shadow-2xl group hover:border-emerald-500/30 transition-all duration-300">
                    <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                    <div>
                      <Clock className="w-5 h-5 text-emerald-400 mb-2.5" />
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">7-Day Resolution SLA</p>
                      <h3 className="text-3xl font-black text-white mt-1.5 leading-none">{stats.slaComplianceRate}%</h3>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-4 leading-normal font-medium">
                      Percentage of closed tickets solved inside the 7-day limit.
                    </p>
                  </div>

                  {/* 48h Response SLA */}
                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.04] backdrop-blur-xl flex flex-col justify-between relative overflow-hidden shadow-2xl group hover:border-indigo-500/30 transition-all duration-300">
                    <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                    <div>
                      <Hourglass className="w-5 h-5 text-indigo-400 mb-2.5" />
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">48h Response SLA</p>
                      <h3 className="text-3xl font-black text-white mt-1.5 leading-none">{stats.responseSlaComplianceRate ?? stats.responseSlaComplianceRate ?? 100}%</h3>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-4 leading-normal font-medium">
                      Percentage of complaints reviewed and assigned within 48h.
                    </p>
                  </div>

                  {/* Average Resolution Time */}
                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.04] backdrop-blur-xl flex flex-col justify-between relative overflow-hidden shadow-2xl group hover:border-amber-500/30 transition-all duration-300">
                    <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                    <div>
                      <Clock className="w-5 h-5 text-amber-400 mb-2.5" />
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Avg Resolution Time</p>
                      <h3 className="text-3xl font-black text-white mt-1.5 leading-none">{stats.averageResolutionTimeHours} hrs</h3>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-4 leading-normal font-medium">
                      Average hours required to transition from Pending to Solved.
                    </p>
                  </div>

                  {/* Total Resolution Rate */}
                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.04] backdrop-blur-xl flex flex-col justify-between relative overflow-hidden shadow-2xl group hover:border-violet-500/30 transition-all duration-300">
                    <div className="absolute right-0 bottom-0 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none" />
                    <div>
                      <Award className="w-5 h-5 text-violet-400 mb-2.5" />
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">System Success Rate</p>
                      <h3 className="text-3xl font-black text-white mt-1.5 leading-none">{stats.resolutionRate}%</h3>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-4 leading-normal font-medium">
                      Percentage of total complaints completely solved.
                    </p>
                  </div>
                </div>

                {/* Sub-status counts */}
                <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.03] backdrop-blur-xl shadow-2xl">
                  <h3 className="text-[10px] uppercase font-black text-indigo-300 tracking-wider mb-4">Database Ticket Quantities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-white/[0.03] text-center">
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Total Filed</p>
                      <p className="text-lg font-black text-white mt-1 leading-none">{stats.total}</p>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-white/[0.03] text-center">
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Pending</p>
                      <p className="text-lg font-black text-amber-400 mt-1 leading-none">{stats.pending}</p>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-white/[0.03] text-center">
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Under Review</p>
                      <p className="text-lg font-black text-indigo-400 mt-1 leading-none">{stats.underReview}</p>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-white/[0.03] text-center">
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Awaiting Student</p>
                      <p className="text-lg font-black text-pink-400 mt-1 leading-none">{stats.awaitingResponse}</p>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-white/[0.03] text-center">
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Resolved</p>
                      <p className="text-lg font-black text-emerald-400 mt-1 leading-none">{stats.resolved}</p>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-white/[0.03] text-center">
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Rejected</p>
                      <p className="text-lg font-black text-rose-400 mt-1 leading-none">{stats.rejected}</p>
                    </div>
                  </div>
                </div>

                {/* 2 Column Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category Data Chart */}
                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.04] backdrop-blur-xl shadow-2xl">
                    <h3 className="text-sm font-black text-white mb-5 flex items-center gap-2 uppercase tracking-wider">
                      <BarChart4 className="w-4.5 h-4.5 text-indigo-400" /> Volume by Category
                    </h3>
                    <div className="space-y-4">
                      {categoryData.map((item, idx) => {
                        const percent = stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-slate-300 font-semibold">{item.name}</span>
                              <span className="text-white">{item.value} ({percent}%)</span>
                            </div>
                            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/[0.03]">
                              <div
                                style={{ width: `${percent}%` }}
                                className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Department Data Chart */}
                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.04] backdrop-blur-xl shadow-2xl">
                    <h3 className="text-sm font-black text-white mb-5 flex items-center gap-2 uppercase tracking-wider">
                      <BarChart4 className="w-4.5 h-4.5 text-indigo-400" /> Volume by Department
                    </h3>
                    {departmentData.length === 0 ? (
                      <p className="p-8 text-center text-slate-500 text-xs font-bold uppercase tracking-wider">No department logs recorded.</p>
                    ) : (
                      <div className="space-y-4">
                        {departmentData.map((item, idx) => {
                          const percent = stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0;
                          return (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-300 font-semibold truncate max-w-[200px]">{item.name}</span>
                                <span className="text-white">{item.value} ({percent}%)</span>
                              </div>
                              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/[0.03]">
                                <div
                                  style={{ width: `${percent}%` }}
                                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-teal-600 rounded-full"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Permanent Ban Center */}
        {activeTab === 'bans' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-white">Permanent Ban & Blacklist Center</h2>
              <p className="text-slate-400 text-xs mt-1">
                Permanently restrict access for disruptive or unverified users. Banned emails are blacklisted, automatically blocking future accounts.
              </p>
            </div>

            {/* Ban input block */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] backdrop-blur-xl shadow-2xl">
              <h3 className="text-xs uppercase font-black text-white mb-3.5 flex items-center gap-2 tracking-wider">
                <UserMinus className="w-4.5 h-4.5 text-rose-400 animate-pulse" /> Add Email to Permanent Blacklist
              </h3>
              <form onSubmit={handleBanEmail} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="email"
                  value={banEmail}
                  onChange={(e) => setBanEmail(e.target.value)}
                  placeholder="e.g. academic@school.edu"
                  required
                  className="px-4 py-3 rounded-xl bg-slate-950 border border-white/[0.04] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                />
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Reason for permanent audit ban"
                  required
                  className="px-4 py-3 rounded-xl bg-slate-950 border border-white/[0.04] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                />
                <button
                  type="submit"
                  className="py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black uppercase tracking-wider text-white transition-colors cursor-pointer shadow-lg"
                >
                  Issue Blacklist Ban
                </button>
              </form>
            </div>

            {/* Registered User Directory */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-3 border-b border-white/[0.03]">
                <h3 className="text-xs uppercase font-black text-white tracking-wider">Approved User Directory</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={banSearch}
                    onChange={(e) => setBanSearch(e.target.value)}
                    placeholder="Search directory..."
                    className="pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-white/[0.04] text-xs text-white focus:outline-none w-48 focus:border-indigo-500/40"
                  />
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-500 text-xs font-bold uppercase animate-pulse">Loading directory registry...</div>
              ) : filteredBansUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs border border-white/[0.03] rounded-2xl bg-white/[0.01]">
                  No registered users found in the system registry.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/[0.03] bg-slate-950/40 shadow-2xl">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-white/[0.01] border-b border-white/[0.03] text-indigo-300 font-black uppercase tracking-widest text-[9px]">
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Department</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03] font-medium text-slate-300">
                      {filteredBansUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 text-white font-bold text-xs">{u.name}</td>
                          <td className="p-4 text-slate-400 font-semibold">{u.email}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-white/[0.03] text-[9px] font-black uppercase tracking-widest text-slate-300 shadow">
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4 text-indigo-300 font-semibold">{u.department || 'N/A'}</td>
                          <td className="p-4 text-center">
                            {u.isBanned ? (
                              <span className="px-2.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-black text-[9px] uppercase tracking-wider shadow">
                                Blacklisted
                              </span>
                            ) : u.isApproved ? (
                              <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider shadow">
                                Approved
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase tracking-wider shadow">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {!u.isBanned && u.role !== 'REPRESENTATIVE' && (
                              <button
                                onClick={() => handleBanUser(u.id)}
                                className="py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 font-black uppercase tracking-wider transition-colors cursor-pointer text-[10px]"
                              >
                                Ban User
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

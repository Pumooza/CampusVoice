'use client';

import Link from 'next/link';
import { MessageSquareCode, ShieldAlert, Award, UserCheck, ArrowRight, MessageSquare, ShieldCheck, Heart, Sparkles, HelpCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#07080e] text-white overflow-hidden relative">
      {/* Dynamic Background Glowing Gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-pink-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Overlay for Modern Tech Feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f1123_1px,transparent_1px),linear-gradient(to_bottom,#0f1123_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-white/[0.04] bg-[#07080e]/60 backdrop-blur-xl sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <MessageSquareCode className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                CampusVoice
              </span>
              <span className="block text-[8px] text-indigo-400 font-bold uppercase tracking-widest leading-none mt-0.5">student led</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl text-indigo-200 hover:text-white hover:bg-white/[0.03] border border-white/[0.04] hover:border-indigo-500/30 transition-all text-xs font-semibold"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all text-xs font-semibold shadow-lg shadow-indigo-600/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              Register Account
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 md:py-20 flex flex-col items-center justify-center text-center relative z-10">
        
        {/* Glow Micro Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold mb-8 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>University Moderated Anonymity Network</span>
        </div>

        {/* Dynamic Typography */}
        <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight max-w-4xl bg-gradient-to-b from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent mb-6">
          Speak Freely. <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
            Hold Power Accountable.
          </span>
        </h1>

        <p className="text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed mb-12">
          CampusVoice is a high-engagement university board. File named or anonymous complaints safely. Checked by moderated student reps, shielding you from retaliation while driving real academic and administrative response.
        </p>

        {/* Action Callouts */}
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link
            href="/register"
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 font-bold text-sm hover:from-indigo-500 hover:to-violet-500 transition-all shadow-xl shadow-indigo-600/15 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            Create Your Account <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.04] transition-all font-bold text-sm flex items-center justify-center gap-2 text-slate-300 hover:text-white"
          >
            Explore Dashboard
          </Link>
        </div>

        {/* Interactive Mockup (Reddit-Style Feed Card Preview) to Wow the User */}
        <div className="w-full max-w-2xl mb-24 animate-fade-in">
          <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest mb-4">Live Platform Preview</p>
          <div className="glass-card p-5 rounded-2xl text-left border border-white/[0.06] bg-slate-900/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] relative">
            <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full text-[9px] font-bold text-white shadow-lg animate-pulse">
              Active SLA Review
            </div>
            
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Under Review
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                c/Academic
              </span>
              <span className="text-[10px] text-slate-500">
                • posted by anonymous • 2h ago
              </span>
            </div>

            {/* Title */}
            <h3 className="text-base font-bold text-white hover:text-indigo-400 transition-colors leading-tight">
              Inconsistent grading rubrics applied during Final Exams in Department C
            </h3>
            
            {/* Description Snippet */}
            <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
              We observed a variance of up to 15% in grades between similar student submissions without written feedback. We request a standardized rubric review across all core blocks...
            </p>

            {/* Reddit/Social Strip */}
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/[0.04]">
              {/* Upvote Button Mockup */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] text-xs font-bold text-indigo-300 transition-colors">
                <Heart className="w-3.5 h-3.5 fill-indigo-400/20 text-indigo-400" />
                <span>48 agreements</span>
              </div>

              {/* Comment Button Mockup */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold hover:text-white transition-colors">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>12 responses</span>
              </div>

              <div className="ml-auto text-[9px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>SLA Guarded</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {/* Card 1 */}
          <div className="p-8 rounded-3xl bg-slate-900/20 border border-white/[0.03] hover:border-indigo-500/20 transition-all hover:translate-y-[-4px] text-left group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-all">
              <ShieldAlert className="w-5.5 h-5.5 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold mb-3 text-white">Anonymity Guard</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Post securely. Randomized keys mask your identity completely from teachers. Only student representatives retain verification keys to eliminate toxic spam.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl bg-slate-900/20 border border-white/[0.03] hover:border-indigo-500/20 transition-all hover:translate-y-[-4px] text-left group">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-6 group-hover:bg-violet-500/20 transition-all">
              <Award className="w-5.5 h-5.5 text-violet-400" />
            </div>
            <h3 className="text-lg font-bold mb-3 text-white">Guaranteed SLAs</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No complaint gets ignored. Strict 48-hour response SLAs force department reviews, tracking a 7-day institutional resolution target transparently.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl bg-slate-900/20 border border-white/[0.03] hover:border-indigo-500/20 transition-all hover:translate-y-[-4px] text-left group">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:bg-pink-500/20 transition-all">
              <UserCheck className="w-5.5 h-5.5 text-pink-400" />
            </div>
            <h3 className="text-lg font-bold mb-3 text-white">Interactive Feed</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upvote agreements, write replies, and attach verified evidence directly. Student reps and faculty collaborate in structured channels to push tickets forward.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.03] py-10 mt-auto bg-[#07080e]/40 z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-slate-500 text-[11px] gap-4">
          <p>© 2026 CampusVoice Platform. Official institutional deployment.</p>
          <div className="flex items-center gap-6">
            <span className="font-semibold text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Deployment Stable
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}


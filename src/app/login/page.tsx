'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { MessageSquareCode, ShieldAlert, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#07080e] text-white items-center justify-center p-6 relative">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f1123_1px,transparent_1px),linear-gradient(to_bottom,#0f1123_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="w-full max-w-md bg-slate-900/35 border border-white/[0.06] rounded-3xl p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 hover:border-indigo-500/20 transition-all duration-300">
        
        {/* Brand Logo & Intro */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/15 mb-4">
            <MessageSquareCode className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Welcome back</h2>
          <p className="text-xs text-slate-400 mt-1.5">Sign in to access your CampusVoice student feed</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-200 text-xs animate-fade-in">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <div>
              <p className="font-bold text-rose-100">Sign in failed</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-2">
              University Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@school.edu"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-white/[0.04] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 transition-all duration-300 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-950/50 border border-white/[0.04] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 transition-all duration-300 focus:ring-1 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || submitting}
            className="w-full py-3.5 px-5 mt-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-bold text-sm text-white transition-all shadow-lg shadow-indigo-600/10 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading || submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin" />
                Signing In...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Sign In <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center text-xs text-slate-400">
          New to CampusVoice?{' '}
          <Link href="/register" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
            Create an account
          </Link>
        </div>
      </div>
      
      <Link href="/" className="mt-8 text-[10px] uppercase font-bold tracking-widest text-indigo-400/40 hover:text-indigo-400/85 transition-colors">
        ← Return to Landing Page
      </Link>
    </div>
  );
}

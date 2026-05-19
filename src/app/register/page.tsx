'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { MessageSquareCode, ShieldAlert, ArrowRight, CheckCircle2, UserCheck, Eye, EyeOff } from 'lucide-react';

const DEPARTMENTS = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Business Administration',
  'Humanities',
  'Physics',
  'Chemistry'
];

export default function RegisterPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'TEACHER' | 'ALUMNI'>('STUDENT');
  const [department, setDepartment] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (role === 'TEACHER' && !department) {
      setError('Please select a department.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          department: role === 'TEACHER' ? department : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setSuccessMessage(data.message || 'Registration successful! Your account is pending approval by the Student Representative.');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col min-h-screen bg-[#07080e] text-white items-center justify-center p-6 relative">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f1123_1px,transparent_1px),linear-gradient(to_bottom,#0f1123_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/35 border border-white/[0.06] rounded-3xl p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center relative z-10 hover:border-indigo-500/20 transition-all duration-300 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Registration Received!</h2>
          <p className="text-slate-300 text-xs leading-relaxed mb-6">
            {successMessage}
          </p>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-white/[0.04] text-xs text-indigo-300 text-left space-y-2 mb-6">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span className="font-bold uppercase tracking-wider text-[10px]">Next Step: manual verification</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Your account details are sent to the Student Representatives. Once they verify your credentials, you will be approved to log in. This keeps CampusVoice secure and authentic.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-bold text-sm text-white transition-all shadow-lg shadow-indigo-600/10 hover:scale-[1.01] active:scale-[0.99] items-center justify-center gap-2"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#07080e] text-white items-center justify-center p-6 relative">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f1123_1px,transparent_1px),linear-gradient(to_bottom,#0f1123_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/35 border border-white/[0.06] rounded-3xl p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 hover:border-indigo-500/20 transition-all duration-300">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/15 mb-4">
            <MessageSquareCode className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Join CampusVoice</h2>
          <p className="text-xs text-slate-400 mt-1.5">Register your university feedback account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-200 text-xs animate-fade-in">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <div>
              <p className="font-bold text-rose-100">Registration failed</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-white/[0.04] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 transition-all duration-300 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>

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
            <label className="block text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-2">
              Password
            </label>
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

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-2">
              I am a
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['STUDENT', 'TEACHER', 'ALUMNI'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    if (r !== 'TEACHER') setDepartment('');
                  }}
                  className={`py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    role === r
                      ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                      : 'bg-slate-950/40 border-white/[0.04] text-slate-400 hover:border-indigo-500/30 hover:text-indigo-200'
                  }`}
                >
                  {r.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {role === 'TEACHER' && (
            <div className="animate-fade-in space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-2">
                Department
              </label>
              <div className="relative">
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-white/[0.04] text-sm text-white focus:outline-none focus:border-indigo-500/80 transition-all duration-300 focus:ring-1 focus:ring-indigo-500/20 appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-[#0b0c16] text-slate-500">
                    Select your department...
                  </option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept} className="bg-[#0b0c16] text-white">
                      {dept}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 border-l border-white/[0.04] pl-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">▼</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-5 mt-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-bold text-sm text-white transition-all shadow-lg shadow-indigo-600/10 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin" />
                Registering...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Register <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign in
          </Link>
        </div>
      </div>
      <Link href="/" className="mt-8 text-[10px] uppercase font-bold tracking-widest text-indigo-400/40 hover:text-indigo-400/85 transition-colors">
        ← Return to Landing Page
      </Link>
    </div>
  );
}

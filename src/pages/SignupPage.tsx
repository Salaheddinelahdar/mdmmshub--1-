import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { resizeAvatarFile } from '../lib/firebase';
import { Avatar } from '../components/Avatar';

export function SignupPage() {
  const { navigate, signupStudent } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingSuccess, setPendingSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    try {
      const resized = await resizeAvatarFile(file);
      setPhotoUrl(resized);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to process image.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith('@uca.ac.ma') || normalizedEmail === '@uca.ac.ma') {
      setErrorMsg('Only UCA university emails are accepted (@uca.ac.ma)');
      return;
    }
    setSubmitting(true);
    const res = await signupStudent({ name, email: normalizedEmail, password, photoUrl });
    setSubmitting(false);
    if (!res.ok) {
      setErrorMsg(res.error || 'Unable to register.');
      return;
    }
    setPendingSuccess(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {pendingSuccess ? (
        <main className="mx-auto max-w-md px-4 sm:px-6 py-12">
          <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md p-6 sm:p-8 space-y-4">
            <p className="text-xs font-semibold text-amber-300">Pending Approval</p>
            <h1 className="font-display text-2xl font-bold text-white">
              Registration Submitted
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Your student profile for <strong className="text-white">{name}</strong> has been created. Your account stays inactive on the public leaderboard until the class admin approves your signup.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors cursor-pointer"
              >
                Go to My Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/[0.12] transition-colors cursor-pointer"
              >
                View Leaderboard
              </button>
            </div>
          </section>
        </main>
      ) : (
        <main className="mx-auto max-w-md px-4 sm:px-6 py-12">
      <section className="rounded-2xl border border-white/[0.08] bg-[#11182E]/85 backdrop-blur-md p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-bold text-white">Student Sign Up</h1>
          <p className="text-sm text-slate-400">
            Join the Marketing Digital class leaderboard. New accounts require admin approval.
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Profile photo upload */}
          <div className="flex items-center gap-4">
            <Avatar name={name || 'New Student'} src={photoUrl} size="lg" />
            <div className="space-y-1.5">
              <label
                htmlFor="signup-photo"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-slate-100 hover:bg-white/[0.12] transition-colors cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{photoUrl ? 'Change Photo' : 'Upload Profile Photo'}</span>
              </label>
              <input
                id="signup-photo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />
              <p className="text-xs text-slate-500">Square portrait recommended (JPG/PNG).</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-name" className="block text-xs font-medium text-slate-300">
              Full Name
            </label>
            <input
              id="signup-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Salma Bennani"
              className="w-full rounded-xl border border-white/10 bg-[#0A0F1E]/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-email" className="block text-xs font-medium text-slate-300">
              University Email
            </label>
            <input
              id="signup-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@uca.ac.ma"
              className="w-full rounded-xl border border-white/10 bg-[#0A0F1E]/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-password" className="block text-xs font-medium text-slate-300">
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full rounded-xl border border-white/10 bg-[#0A0F1E]/80 pl-3.5 pr-11 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {submitting ? 'Creating Account...' : 'Create Student Account'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Already registered?{' '}
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
            className="text-indigo-300 hover:text-indigo-200 font-medium underline underline-offset-4"
          >
            Sign in
          </a>
        </p>
      </section>
        </main>
      )}
    </motion.div>
  );
}

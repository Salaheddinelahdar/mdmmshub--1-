import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { resizeAvatarFile } from '../lib/firebase';
import { Avatar } from '../components/Avatar';

export function SignupPage() {
  const { navigate, signupStudent } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingSuccess, setPendingSuccess] = useState(false);

  const hasMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

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
    if (!passwordsMatch) {
      setErrorMsg('Passwords do not match.');
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex-1 flex flex-col"
    >
      {pendingSuccess ? (
        <main className="flex-1 flex items-center justify-center px-4 py-4">
          <section className="w-full max-w-[420px] rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md p-6 space-y-4">
            <p className="text-xs font-semibold text-amber-300">Pending Approval</p>
            <h1 className="font-display text-2xl font-bold text-white">
              Registration Submitted
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Your profile for <strong className="text-white">{name}</strong> has been created. Your account will appear on the leaderboard once approved by the instructor.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors cursor-pointer"
              >
                Go to My Profile
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
        <main className="flex-1 flex items-center justify-center px-4 py-4">
          <section className="w-full max-w-[420px] rounded-2xl border border-white/[0.08] bg-[#11182E]/85 backdrop-blur-md p-5 sm:p-6 shadow-2xl shadow-black/30 space-y-4">
            {/* Large tappable centered profile photo circle */}
            <div className="flex flex-col items-center gap-1.5">
              <label
                htmlFor="signup-photo"
                className="relative group cursor-pointer rounded-full focus-within:ring-2 focus-within:ring-indigo-400"
                aria-label={photoUrl ? 'Change profile photo' : 'Upload profile photo'}
              >
                {photoUrl ? (
                  <Avatar name={name || 'Student'} src={photoUrl} size="xl" className="h-20 w-20" />
                ) : (
                  <div className="h-20 w-20 rounded-full border-2 border-dashed border-white/20 bg-white/[0.04] flex flex-col items-center justify-center gap-1 text-slate-300 group-hover:border-indigo-400/70 group-hover:bg-indigo-500/10 transition-colors">
                    <Camera className="h-5 w-5 text-indigo-300" aria-hidden="true" />
                    <span className="text-[11px] font-medium">Photo</span>
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full bg-indigo-500 border-2 border-[#11182E] flex items-center justify-center shadow">
                  <Camera className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                </span>
                <input
                  id="signup-photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-200"
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <div className="space-y-1">
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
                  className="w-full rounded-xl border border-white/10 bg-[#0A0F1E]/80 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="space-y-1">
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
                  className="w-full rounded-xl border border-white/10 bg-[#0A0F1E]/80 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="space-y-1">
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
                    className="w-full rounded-xl border border-white/10 bg-[#0A0F1E]/80 pl-3.5 pr-11 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="signup-confirm-password" className="block text-xs font-medium text-slate-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    aria-invalid={hasMismatch}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className={`w-full rounded-xl border bg-[#0A0F1E]/80 pl-3.5 pr-11 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
                      hasMismatch
                        ? 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-white/10 focus:border-indigo-500 focus:ring-indigo-500/30'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    aria-pressed={showConfirmPassword}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {hasMismatch && (
                  <p role="alert" className="text-xs text-rose-300">
                    Passwords do not match.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || !passwordsMatch}
                className="w-full rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {submitting ? 'Creating Account...' : 'Create Account'}
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

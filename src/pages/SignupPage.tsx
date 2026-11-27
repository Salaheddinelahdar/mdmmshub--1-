import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { resizeAvatarFile } from '../lib/firebase';
import { Avatar } from '../components/Avatar';

// Optional class code. Set VITE_CLASS_CODE in the build environment to turn it on.
// Note: this is a front-end gate only (it is visible in the built JS). Real enforcement needs a Firestore rule.
const CLASS_CODE: string = (((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_CLASS_CODE) ?? '').trim();

export function SignupPage() {
  const { navigate, signupStudent } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [classCode, setClassCode] = useState('');
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
    if (CLASS_CODE && classCode.trim().toLowerCase() !== CLASS_CODE.toLowerCase()) {
      setErrorMsg('Wrong class code. Ask your instructor for the code.');
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
          <section className="w-full max-w-[420px] rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-4">
            <p className="text-xs font-semibold text-(color:--c-amber)">Pending Approval</p>
            <h1 className="font-display text-2xl font-bold text-(color:--c-ink)">
              Registration Submitted
            </h1>
            <p className="text-sm text-(color:--c-sub) leading-relaxed">
              Your profile for <strong className="text-(color:--c-ink)">{name}</strong> has been created. Your account will appear on the leaderboard once approved by the instructor.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="rounded-xl bg-(color:--c-accent) px-4 py-2.5 text-sm font-semibold text-white hover:bg-(color:--c-accent-d) transition-colors cursor-pointer"
              >
                Go to My Profile
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-ink)/[0.045] px-4 py-2.5 text-sm font-medium text-(color:--c-ink2) hover:bg-(color:--c-ink)/[0.045] transition-colors cursor-pointer"
              >
                View Leaderboard
              </button>
            </div>
          </section>
        </main>
      ) : (
        <main className="flex-1 flex items-center justify-center px-4 py-4">
          <section className="w-full max-w-[420px] rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-5 sm:p-6 shadow-sm shadow-sm space-y-4">
            {/* Large tappable centered profile photo circle */}
            <div className="flex flex-col items-center gap-1.5">
              <label
                htmlFor="signup-photo"
                className="relative group cursor-pointer rounded-full focus-within:ring-2 focus-within:ring-(color:--c-accent)"
                aria-label={photoUrl ? 'Change profile photo' : 'Upload profile photo'}
              >
                {photoUrl ? (
                  <Avatar name={name || 'Student'} src={photoUrl} size="xl" className="h-20 w-20" />
                ) : (
                  <div className="h-20 w-20 rounded-full border-2 border-dashed border-(color:--c-ink)/[0.10] bg-(color:--c-ink)/[0.045] flex flex-col items-center justify-center gap-1 text-(color:--c-sub) group-hover:border-(color:--c-accent)/70 group-hover:bg-(color:--c-accent)/10 transition-colors">
                    <Camera className="h-5 w-5 text-(color:--c-accent-d)" aria-hidden="true" />
                    <span className="text-[11px] font-medium">Photo</span>
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full bg-(color:--c-accent) border-2 border-(color:--c-surface) flex items-center justify-center shadow">
                  <Camera className="h-3.5 w-3.5 text-(color:--c-ink)" aria-hidden="true" />
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
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs text-(color:--c-red)"
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <div className="space-y-1">
                <label htmlFor="signup-name" className="block text-xs font-medium text-(color:--c-sub)">
                  Full Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Salma Bennani"
                  className="w-full rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) px-3.5 py-2 text-sm text-(color:--c-ink) placeholder:text-(color:--c-faint) focus:border-(color:--c-accent)/40 focus:outline-none focus:ring-2 focus:ring-(color:--c-accent)/30"
                />
              </div>

              {CLASS_CODE && (
                <div className="space-y-1">
                  <label htmlFor="signup-code" className="block text-xs font-medium text-(color:--c-sub)">
                    Class code
                  </label>
                  <input
                    id="signup-code"
                    type="text"
                    required
                    autoComplete="off"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    placeholder="Given by your instructor"
                    className="w-full rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) px-3.5 py-2 text-sm text-(color:--c-ink) placeholder:text-(color:--c-faint) focus:border-(color:--c-accent)/40 focus:outline-none focus:ring-2 focus:ring-(color:--c-accent)/30"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="signup-email" className="block text-xs font-medium text-(color:--c-sub)">
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
                  className="w-full rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) px-3.5 py-2 text-sm text-(color:--c-ink) placeholder:text-(color:--c-faint) focus:border-(color:--c-accent)/40 focus:outline-none focus:ring-2 focus:ring-(color:--c-accent)/30"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="signup-password" className="block text-xs font-medium text-(color:--c-sub)">
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
                    className="w-full rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) pl-3.5 pr-11 py-2 text-sm text-(color:--c-ink) placeholder:text-(color:--c-faint) focus:border-(color:--c-accent)/40 focus:outline-none focus:ring-2 focus:ring-(color:--c-accent)/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-(color:--c-muted) hover:text-(color:--c-ink) focus:outline-none focus-visible:ring-2 focus-visible:ring-(color:--c-accent) cursor-pointer"
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
                <label htmlFor="signup-confirm-password" className="block text-xs font-medium text-(color:--c-sub)">
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
                    className={`w-full rounded-xl border bg-white pl-3.5 pr-11 py-2 text-sm text-(color:--c-ink) placeholder:text-(color:--c-faint) focus:outline-none focus:ring-2 ${
                      hasMismatch
                        ? 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-(color:--c-ink)/[0.10] focus:border-(color:--c-accent)/40 focus:ring-(color:--c-accent)/30'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    aria-pressed={showConfirmPassword}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-(color:--c-muted) hover:text-(color:--c-ink) focus:outline-none focus-visible:ring-2 focus-visible:ring-(color:--c-accent) cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {hasMismatch && (
                  <p role="alert" className="text-xs text-(color:--c-red)">
                    Passwords do not match.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || !passwordsMatch}
                className="w-full rounded-xl bg-(color:--c-accent) px-4 py-2.5 text-sm font-semibold text-white hover:bg-(color:--c-accent-d) disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {submitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-xs text-(color:--c-muted)">
              Already registered?{' '}
              <a
                href="/login"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
                className="text-(color:--c-accent-d) hover:text-(color:--c-accent-d) font-medium underline underline-offset-4"
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

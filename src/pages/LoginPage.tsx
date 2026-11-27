import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function LoginPage() {
  const { navigate, loginWithEmail } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }
    setSubmitting(true);
    const res = await loginWithEmail(email, password, remember);
    setSubmitting(false);
    if (!res.ok) {
      setErrorMsg(res.error || 'Unable to sign in.');
      return;
    }
    navigate(res.role === 'admin' ? '/admin' : '/dashboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex-1 flex flex-col"
    >
      <main className="flex-1 flex items-center justify-center px-4 py-4">
        <section className="w-full max-w-[420px] rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-6 shadow-sm shadow-sm space-y-5">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              <span className="text-(color:--c-ink)">Welcome </span>
              <span className="text-(color:--c-accent)">
                back
              </span>
            </h1>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-(color:--c-red)"
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            <div className="space-y-1">
              <label htmlFor="login-email" className="block text-xs font-medium text-(color:--c-sub)">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@uca.ac.ma"
                className="w-full rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) px-3.5 py-2.5 text-sm text-(color:--c-ink) placeholder:text-(color:--c-faint) focus:border-(color:--c-accent)/40 focus:outline-none focus:ring-2 focus:ring-(color:--c-accent)/30"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="login-password" className="block text-xs font-medium text-(color:--c-sub)">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) pl-3.5 pr-11 py-2.5 text-sm text-(color:--c-ink) placeholder:text-(color:--c-faint) focus:border-(color:--c-accent)/40 focus:outline-none focus:ring-2 focus:ring-(color:--c-accent)/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-(color:--c-muted) hover:text-(color:--c-ink) focus:outline-none focus-visible:ring-2 focus-visible:ring-(color:--c-accent) cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-(color:--c-sub) cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-(color:--c-ink)/[0.25] accent-[#C96442] cursor-pointer"
              />
              Remember me
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-(color:--c-accent) px-4 py-2.5 text-sm font-semibold text-white hover:bg-(color:--c-accent-d) disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-(color:--c-muted)">
            New to the class?{' '}
            <a
              href="/signup"
              onClick={(e) => {
                e.preventDefault();
                navigate('/signup');
              }}
              className="text-(color:--c-accent-d) hover:text-(color:--c-accent-d) font-medium underline underline-offset-4"
            >
              Create account
            </a>
          </p>
        </section>
      </main>
    </motion.div>
  );
}

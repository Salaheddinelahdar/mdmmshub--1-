import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Navbar() {
  const { pathname, navigate, session, logout } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLeaderboard = pathname === '/' || pathname.startsWith('/student/');
  const isRules = pathname === '/rules';
  const isDashboard = pathname === '/dashboard';
  const isAdmin = pathname === '/admin';

  const handleNav = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0A0F1E]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Brand Logo & Wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleNav('/');
          }}
          className="inline-flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md px-1"
        >
          <img src="/logo.svg" alt="" aria-hidden="true" className="h-7 w-7 shrink-0" />
          <span>MDMMS space</span>
        </a>

        {/* Zone 2: Concise single-line nav links (desktop) */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/');
            }}
            className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors hover:text-white py-1 ${
              isLeaderboard ? 'text-white underline decoration-indigo-500 decoration-2 underline-offset-8' : 'text-slate-400'
            }`}
          >
            Leaderboard
          </a>
          <a
            href="/rules"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/rules');
            }}
            className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors hover:text-white py-1 ${
              isRules ? 'text-white underline decoration-indigo-500 decoration-2 underline-offset-8' : 'text-slate-400'
            }`}
          >
            Rules
          </a>
          <a
            href="/dashboard"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/dashboard');
            }}
            className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors hover:text-white py-1 ${
              isDashboard ? 'text-white underline decoration-indigo-500 decoration-2 underline-offset-8' : 'text-slate-400'
            }`}
          >
            Dashboard
          </a>
          <a
            href="/admin"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/admin');
            }}
            className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors hover:text-white py-1 ${
              isAdmin ? 'text-white underline decoration-indigo-500 decoration-2 underline-offset-8' : 'text-slate-400'
            }`}
          >
            Admin
          </a>
          {!session && (
            <a
              href="/signup"
              onClick={(e) => {
                e.preventDefault();
                handleNav('/signup');
              }}
              className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors hover:text-white py-1 ${
                pathname === '/signup' ? 'text-white underline decoration-indigo-500 decoration-2 underline-offset-8' : 'text-slate-400'
              }`}
            >
              Sign Up
            </a>
          )}
        </nav>

        {/* Zone 3: Single Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          {session ? (
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 text-xs sm:text-sm font-medium text-slate-100 hover:bg-white/[0.12] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign Out
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleNav('/login')}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm shadow-indigo-500/25"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.1] cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Animated Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="md:hidden fixed inset-x-0 top-16 z-40 border-b border-white/[0.08] bg-[#0A0F1E] shadow-2xl"
          >
            <nav aria-label="Mobile navigation" className="px-4 py-3 flex flex-col gap-1">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('/');
                }}
                className={`rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                  isLeaderboard ? 'bg-indigo-500/15 text-white' : 'text-slate-300 hover:bg-white/[0.05]'
                }`}
              >
                Leaderboard
              </a>
              <a
                href="/rules"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('/rules');
                }}
                className={`rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                  isRules ? 'bg-indigo-500/15 text-white' : 'text-slate-300 hover:bg-white/[0.05]'
                }`}
              >
                Rules
              </a>
              <a
                href="/dashboard"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('/dashboard');
                }}
                className={`rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                  isDashboard ? 'bg-indigo-500/15 text-white' : 'text-slate-300 hover:bg-white/[0.05]'
                }`}
              >
                Dashboard
              </a>
              <a
                href="/admin"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('/admin');
                }}
                className={`rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                  isAdmin ? 'bg-indigo-500/15 text-white' : 'text-slate-300 hover:bg-white/[0.05]'
                }`}
              >
                Admin
              </a>
              {!session && (
                <a
                  href="/signup"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav('/signup');
                  }}
                  className={`rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                    pathname === '/signup' ? 'bg-indigo-500/15 text-white' : 'text-slate-300 hover:bg-white/[0.05]'
                  }`}
                >
                  Sign Up
                </a>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ThemeToggle } from './ThemeToggle';
import { useQuizzes } from '../lib/useQuizzes';

export function Navbar() {
  const { pathname, navigate, session, logout } = useApp();
  const { openQuiz } = useQuizzes();
  const quizDot = Boolean(openQuiz) && session?.role !== 'admin';
  const dot = quizDot ? (
    <span className="relative ml-1.5 inline-flex h-2 w-2 align-middle" aria-label="A quiz is open">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(color:--c-accent) opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-(color:--c-accent)" />
    </span>
  ) : null;
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLeaderboard = pathname === '/' || pathname.startsWith('/student/');
  const isRules = pathname === '/rules';
  const isQuiz = pathname === '/quiz';
  const isContact = pathname === '/contact';
  const isDashboard = pathname === '/dashboard';
  const isAdmin = pathname === '/admin';

  const handleNav = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-(color:--c-ink)/[0.10] bg-(color:--c-page)/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleNav('/');
          }}
          aria-label="MDMMSspace"
          className="inline-flex items-baseline font-display text-xl leading-none tracking-tight whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(color:--c-accent) rounded-md px-1 select-none"
        >
          <span className="font-bold text-(color:--c-ink)">MDMMS</span>
          <span className="font-normal text-(color:--c-accent)">
            space
          </span>
        </a>

        {/* Zone 2: Concise single-line nav links (desktop) */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-6">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/');
            }}
            className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors hover:text-(color:--c-ink) py-1 ${
              isLeaderboard ? 'text-(color:--c-ink) underline decoration-(color:--c-accent) decoration-2 underline-offset-8' : 'text-(color:--c-muted)'
            }`}
          >
            Leaderboard
          </a>
          <a
            href="/quiz"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/quiz');
            }}
            className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors hover:text-(color:--c-ink) py-1 ${
              isQuiz ? 'text-(color:--c-ink) underline decoration-(color:--c-accent) decoration-2 underline-offset-8' : 'text-(color:--c-muted)'
            }`}
          >
            Quiz{dot}
          </a>
          <a
            href="/rules"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/rules');
            }}
            className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors hover:text-(color:--c-ink) py-1 ${
              isRules ? 'text-(color:--c-ink) underline decoration-(color:--c-accent) decoration-2 underline-offset-8' : 'text-(color:--c-muted)'
            }`}
          >
            Rules
          </a>
          <a
            href="/contact"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/contact');
            }}
            className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors hover:text-(color:--c-ink) py-1 ${
              isContact ? 'text-(color:--c-ink) underline decoration-(color:--c-accent) decoration-2 underline-offset-8' : 'text-(color:--c-muted)'
            }`}
          >
            Contact
          </a>
          <a
            href="/dashboard"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/dashboard');
            }}
            className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors hover:text-(color:--c-ink) py-1 ${
              isDashboard ? 'text-(color:--c-ink) underline decoration-(color:--c-accent) decoration-2 underline-offset-8' : 'text-(color:--c-muted)'
            }`}
          >
            Profile
          </a>
          <a
            href="/admin"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/admin');
            }}
            className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors hover:text-(color:--c-ink) py-1 ${
              isAdmin ? 'text-(color:--c-ink) underline decoration-(color:--c-accent) decoration-2 underline-offset-8' : 'text-(color:--c-muted)'
            }`}
          >
            Admin
          </a>
        </nav>

        {/* Zone 3: Single Primary Action + Mobile Menu Trigger */}
        <div
          className={`flex items-center gap-2.5 shrink-0 ${
            !session && (pathname === '/login' || pathname === '/signup') ? 'md:hidden' : ''
          }`}
        >
          <ThemeToggle />
          {session ? (
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-lg border border-(color:--c-ink)/[0.10] bg-(color:--c-ink)/[0.045] px-4 py-2 text-xs sm:text-sm font-medium text-(color:--c-ink2) hover:bg-(color:--c-ink)/[0.045] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign Out
            </button>
          ) : pathname !== '/login' && pathname !== '/signup' ? (
            <button
              type="button"
              onClick={() => handleNav('/login')}
              className="rounded-lg bg-(color:--c-accent) px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-(color:--c-accent-d) transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
            >
              Sign In
            </button>
          ) : null}

          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-(color:--c-ink)/[0.10] bg-(color:--c-ink)/[0.045] text-(color:--c-ink2) hover:bg-(color:--c-ink)/[0.045] cursor-pointer"
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
            className="md:hidden fixed inset-x-0 top-16 z-40 border-b border-(color:--c-ink)/[0.10] bg-(color:--c-page)/95 backdrop-blurshadow-sm"
          >
            <nav aria-label="Mobile navigation" className="px-4 py-3 flex flex-col gap-1">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('/');
                }}
                className={`rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                  isLeaderboard ? 'bg-(color:--c-accent)/15 text-(color:--c-ink)' : 'text-(color:--c-sub) hover:bg-(color:--c-ink)/[0.045]'
                }`}
              >
                Leaderboard
              </a>
              <a
                href="/quiz"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('/quiz');
                }}
                className={`rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                  isQuiz ? 'bg-(color:--c-accent)/15 text-(color:--c-ink)' : 'text-(color:--c-sub) hover:bg-(color:--c-ink)/[0.045]'
                }`}
              >
                Quiz{dot}
              </a>
              <a
                href="/rules"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('/rules');
                }}
                className={`rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                  isRules ? 'bg-(color:--c-accent)/15 text-(color:--c-ink)' : 'text-(color:--c-sub) hover:bg-(color:--c-ink)/[0.045]'
                }`}
              >
                Rules
              </a>
              <a
                href="/contact"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('/contact');
                }}
                className={`rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                  isContact ? 'bg-(color:--c-accent)/15 text-(color:--c-ink)' : 'text-(color:--c-sub) hover:bg-(color:--c-ink)/[0.045]'
                }`}
              >
                Contact
              </a>
              <a
                href="/dashboard"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('/dashboard');
                }}
                className={`rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                  isDashboard ? 'bg-(color:--c-accent)/15 text-(color:--c-ink)' : 'text-(color:--c-sub) hover:bg-(color:--c-ink)/[0.045]'
                }`}
              >
                Profile
              </a>
              <a
                href="/admin"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('/admin');
                }}
                className={`rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                  isAdmin ? 'bg-(color:--c-accent)/15 text-(color:--c-ink)' : 'text-(color:--c-sub) hover:bg-(color:--c-ink)/[0.045]'
                }`}
              >
                Admin
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

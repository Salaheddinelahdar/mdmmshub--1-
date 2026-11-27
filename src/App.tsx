/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { RulesPage } from './pages/RulesPage';
import { ContactPage } from './pages/ContactPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { QuizPage } from './pages/QuizPage';
import { Footer } from './components/Footer';
import { ThemeToggle } from './components/ThemeToggle';

function RouterView() {
  const { pathname } = useApp();

  let page: React.ReactNode;
  if (pathname.startsWith('/student/')) {
    const id = decodeURIComponent(pathname.replace('/student/', '').split('/')[0] || '');
    page = <StudentProfilePage key={pathname} studentId={id} />;
  } else if (pathname === '/rules') {
    page = <RulesPage key={pathname} />;
  } else if (pathname === '/contact') {
    page = <ContactPage key={pathname} />;
  } else if (pathname === '/login') {
    page = <LoginPage key={pathname} />;
  } else if (pathname === '/signup') {
    page = <SignupPage key={pathname} />;
  } else if (pathname === '/dashboard') {
    page = <DashboardPage key={pathname} />;
  } else if (pathname === '/quiz') {
    page = <QuizPage key={pathname} />;
  } else if (pathname === '/admin') {
    page = <AdminPage key={pathname} />;
  } else {
    page = <LeaderboardPage key={pathname} />;
  }

  return <AnimatePresence mode="wait">{page}</AnimatePresence>;
}

function GateHeader() {
  const { session, logout } = useApp();
  return (
    <header className="sticky top-0 z-40 border-b border-(color:--c-ink)/[0.10] bg-(color:--c-page)/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <span className="inline-flex items-baseline font-display text-xl leading-none tracking-tight select-none">
          <span className="font-bold text-(color:--c-ink)">MDMMS</span>
          <span className="font-normal text-(color:--c-accent)">space</span>
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-xl border border-(color:--c-ink)/[0.10] px-3.5 py-2 text-sm font-medium text-(color:--c-ink2) hover:bg-(color:--c-ink)/[0.045] cursor-pointer"
            >
              Sign out
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function PendingScreen() {
  const { session } = useApp();
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-[460px] rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-3">
        <p className="text-xs font-semibold text-(color:--c-amber)">Pending Approval</p>
        <h1 className="font-display text-2xl font-bold text-(color:--c-ink)">Waiting for approval</h1>
        <p className="text-sm text-(color:--c-sub) leading-relaxed">
          Your account{session?.email ? ` (${session.email})` : ''} was created. This space is only for students of the cohort. Your instructor needs to approve you before you can see anything. This page updates by itself once you are approved.
        </p>
      </section>
    </main>
  );
}

function Shell() {
  const { session, authReady, pathname } = useApp();
  const allowed = Boolean(session && (session.role === 'admin' || session.approved));

  if (!authReady) {
    return (
      <div className="min-h-screen bg-(color:--c-page) flex items-center justify-center text-sm text-(color:--c-muted)">
        Loading...
      </div>
    );
  }

  let body: React.ReactNode;
  if (allowed) {
    return (
      <div className="min-h-screen bg-(color:--c-page) text-(color:--c-ink2) flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col">
          <RouterView />
        </div>
        <Footer />
      </div>
    );
  }
  if (session) {
    body = <PendingScreen />;
  } else if (pathname === '/signup') {
    body = <SignupPage key="signup" />;
  } else {
    body = <LoginPage key="login" />;
  }
  return (
    <div className="min-h-screen bg-(color:--c-page) text-(color:--c-ink2) flex flex-col">
      <GateHeader />
      <div className="flex-1 flex flex-col">{body}</div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MotionConfig reducedMotion="user">
        <Shell />
      </MotionConfig>
    </AppProvider>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AnimatePresence } from 'motion/react';
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
import { Footer } from './components/Footer';

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
  } else if (pathname === '/admin') {
    page = <AdminPage key={pathname} />;
  } else {
    page = <LeaderboardPage key={pathname} />;
  }

  return <AnimatePresence mode="wait">{page}</AnimatePresence>;
}

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[#0A0F1E] text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col">
          <RouterView />
        </div>
        <Footer />
      </div>
    </AppProvider>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import NavMobileSheet from './NavMobileSheet';
import { SignOutButton } from '../app/(dashboard)/SignOutButton';

type MobileNavProps = {
  userName: string;
  userInitial: string;
  userEmail: string;
};

export function MobileNav({ userName, userInitial, userEmail }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Return focus to hamburger button when sheet closes
  useEffect(() => {
    if (!isOpen && hamburgerRef.current) {
      hamburgerRef.current.focus();
    }
  }, [isOpen]);

  return (
    <>
      {/* Hamburger button - visible on mobile only (< 768px) */}
      <button
        ref={hamburgerRef}
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-[100] w-11 h-11 rounded-lg bg-slate-800/95 backdrop-blur-sm border border-slate-700 shadow-lg flex items-center justify-center text-white hover:bg-slate-700 hover:border-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-950 min-h-[44px] min-w-[44px]"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Navigation Sheet */}
      <NavMobileSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="Menu">
        <nav className="space-y-1">
          <MobileNavItem href="/home" icon="grid" onClick={() => setIsOpen(false)}>
            All Apps
          </MobileNavItem>
          <MobileNavItem href="/dashboard" icon="home" onClick={() => setIsOpen(false)}>
            Dashboard
          </MobileNavItem>
          <MobileNavItem href="/taskflow" icon="tasks" onClick={() => setIsOpen(false)}>
            TaskFlow
          </MobileNavItem>
          <MobileNavItem href="/taskflow/daily-plan" icon="calendar" onClick={() => setIsOpen(false)}>
            Daily Plan
          </MobileNavItem>
          <MobileNavItem href="/meetingflow" icon="video" onClick={() => setIsOpen(false)}>
            MeetingFlow
          </MobileNavItem>
          <MobileNavItem href="/scheduleflow" icon="schedule" onClick={() => setIsOpen(false)}>
            ScheduleFlow
          </MobileNavItem>
          <MobileNavItem href="/documents" icon="document" onClick={() => setIsOpen(false)}>
            Documents
          </MobileNavItem>
          
          <div className="pt-4 mt-4 border-t border-slate-800">
            <p className="px-3 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Admin</p>
            <MobileNavItem href="/admin/team" icon="users" onClick={() => setIsOpen(false)}>
              Team
            </MobileNavItem>
            <MobileNavItem href="/admin/ai-actions" icon="sparkles" onClick={() => setIsOpen(false)}>
              AI Actions
            </MobileNavItem>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800">
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-slate-900 font-bold text-sm">{userInitial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{userName}</p>
                <p className="text-xs text-slate-400 truncate">{userEmail}</p>
              </div>
            </Link>
            <div className="px-3 mt-2">
              <SignOutButton />
            </div>
          </div>
        </nav>
      </NavMobileSheet>
    </>
  );
}

function MobileNavItem({ 
  href, 
  icon, 
  children, 
  onClick 
}: { 
  href: string; 
  icon: string; 
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const icons: Record<string, React.ReactNode> = {
    grid: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    home: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    tasks: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    calendar: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    users: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    sparkles: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    video: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    schedule: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    document: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  };

  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
    >
      {icons[icon]}
      <span className="text-sm font-medium">{children}</span>
    </Link>
  );
}


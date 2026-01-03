/**
 * TimeClockFlow Home Page
 * 
 * Mobile-first time tracking with clock in/out and break controls.
 * See: docs/timeclockflow/frontend-prd-home.md
 * 
 * @module timeclockflow/page
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Feature flag
const FEATURE_TIMECLOCKFLOW = process.env.NEXT_PUBLIC_FEATURE_TIMECLOCKFLOW === 'true';

// =============================================================================
// Types
// =============================================================================

type ClockStatus = 'clocked_out' | 'clocked_in' | 'on_break';

type CurrentShift = {
  startAt: string;
  durationMinutes: number;
  breakMinutes: number;
  onBreak: boolean;
  breakStartAt?: string;
};

type Anomaly = {
  id: string;
  type: string;
  message: string;
  detectedAt: string;
};

// =============================================================================
// Page Component
// =============================================================================

export default function TimeClockFlowPage() {
  const router = useRouter();
  
  // State
  const [status, setStatus] = useState<ClockStatus>('clocked_out');
  const [currentShift, setCurrentShift] = useState<CurrentShift | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  // Timer for shift duration
  useEffect(() => {
    if (status === 'clocked_in' || status === 'on_break') {
      const interval = setInterval(() => {
        if (currentShift) {
          setCurrentShift((prev) => prev ? {
            ...prev,
            durationMinutes: prev.durationMinutes + (1/60),
          } : null);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status, currentShift]);

  // Feature flag check
  if (!FEATURE_TIMECLOCKFLOW) {
    return <FeatureDisabledState />;
  }

  async function fetchStatus() {
    setIsLoading(true);
    try {
      // TODO: Fetch from API
      // const response = await fetch('/api/timeclock/status');
      // const data = await response.json();
      // setStatus(data.status);
      // setCurrentShift(data.currentShift);
      // setAnomalies(data.anomalies || []);
      
      // Stub: default to clocked out
      setStatus('clocked_out');
      setCurrentShift(null);
      setAnomalies([]);
    } catch (err) {
      setError('Failed to load status');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleClockIn() {
    setIsActioning(true);
    setError(null);
    
    try {
      // Get GPS if available
      let geo = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
            });
          });
          geo = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
        } catch {
          // GPS failed, continue without it
        }
      }

      // TODO: Call API
      // await fetch('/api/timeclock/clock-in', {
      //   method: 'POST',
      //   body: JSON.stringify({ geo }),
      // });

      // Optimistic update
      setStatus('clocked_in');
      setCurrentShift({
        startAt: new Date().toISOString(),
        durationMinutes: 0,
        breakMinutes: 0,
        onBreak: false,
      });
    } catch (err) {
      setError('Failed to clock in. Please try again.');
    } finally {
      setIsActioning(false);
    }
  }

  async function handleClockOut() {
    // Confirmation
    if (!confirm('Are you sure you want to clock out?')) {
      return;
    }

    setIsActioning(true);
    setError(null);

    try {
      // TODO: Call API
      // await fetch('/api/timeclock/clock-out', { method: 'POST' });

      // Optimistic update
      setStatus('clocked_out');
      setCurrentShift(null);
    } catch (err) {
      setError('Failed to clock out. Please try again.');
    } finally {
      setIsActioning(false);
    }
  }

  async function handleBreakStart() {
    setIsActioning(true);
    try {
      // TODO: Call API
      setStatus('on_break');
      if (currentShift) {
        setCurrentShift({
          ...currentShift,
          onBreak: true,
          breakStartAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      setError('Failed to start break.');
    } finally {
      setIsActioning(false);
    }
  }

  async function handleBreakEnd() {
    setIsActioning(true);
    try {
      // TODO: Call API
      setStatus('clocked_in');
      if (currentShift) {
        setCurrentShift({
          ...currentShift,
          onBreak: false,
          breakMinutes: currentShift.breakMinutes + 30, // TODO: Calculate actual break duration
          breakStartAt: undefined,
        });
      }
    } catch (err) {
      setError('Failed to end break.');
    } finally {
      setIsActioning(false);
    }
  }

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto space-y-6">
      {/* Anomaly Banner */}
      {anomalies.length > 0 && (
        <AnomalyBanner anomalies={anomalies} />
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Clock Widget */}
      <div className="card p-6 text-center">
        {/* Status Indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className={`w-3 h-3 rounded-full ${
            status === 'clocked_out' ? 'bg-slate-500' :
            status === 'on_break' ? 'bg-amber-500 animate-pulse' :
            'bg-emerald-500'
          }`} />
          <span className="text-lg font-medium">
            {status === 'clocked_out' ? 'Ready to Clock In' :
             status === 'on_break' ? 'On Break' :
             'Clocked In'}
          </span>
        </div>

        {/* Timer */}
        {currentShift && (
          <div className="mb-6">
            <div className="text-4xl font-mono font-bold mb-1">
              {formatDuration(currentShift.durationMinutes)}
            </div>
            <div className="text-sm text-slate-400">
              {status === 'on_break' ? 'Break duration' : 'Current shift'}
            </div>
            {currentShift.startAt && status !== 'on_break' && (
              <div className="text-xs text-slate-500 mt-1">
                Started {new Date(currentShift.startAt).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        {/* Primary Action Button */}
        {status === 'clocked_out' ? (
          <button
            onClick={handleClockIn}
            disabled={isActioning}
            className="w-full py-4 rounded-xl font-semibold text-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px]"
          >
            {isActioning ? 'Clocking In...' : '🟢 CLOCK IN'}
          </button>
        ) : status === 'on_break' ? (
          <button
            onClick={handleBreakEnd}
            disabled={isActioning}
            className="w-full py-4 rounded-xl font-semibold text-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50 min-h-[56px]"
          >
            {isActioning ? 'Ending Break...' : '🟠 END BREAK'}
          </button>
        ) : (
          <button
            onClick={handleClockOut}
            disabled={isActioning}
            className="w-full py-4 rounded-xl font-semibold text-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 min-h-[56px]"
          >
            {isActioning ? 'Clocking Out...' : '🔴 CLOCK OUT'}
          </button>
        )}

        {/* Secondary Actions */}
        {status === 'clocked_in' && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={handleBreakStart}
              disabled={isActioning}
              className="btn-secondary py-3"
            >
              Start Break
            </button>
            <Link
              href="/timeclockflow/timesheet"
              className="btn-secondary py-3 text-center"
            >
              View Details
            </Link>
          </div>
        )}
      </div>

      {/* Today's Summary */}
      {status !== 'clocked_out' && currentShift && (
        <TodaySummary shift={currentShift} />
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/timeclockflow/timesheet"
          className="card p-4 text-center hover:border-slate-600 transition-colors"
        >
          <TimesheetIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <span className="text-sm font-medium">Timesheet</span>
        </Link>
        <Link
          href="/settings/timeclock"
          className="card p-4 text-center hover:border-slate-600 transition-colors"
        >
          <SettingsIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <span className="text-sm font-medium">Settings</span>
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// Components
// =============================================================================

function AnomalyBanner({ anomalies }: { anomalies: Anomaly[] }) {
  return (
    <Link
      href="/timeclockflow/anomalies"
      className="block bg-amber-500/10 border border-amber-500/30 rounded-lg p-4"
    >
      <div className="flex items-center gap-3">
        <div className="text-amber-400">⚠️</div>
        <div className="flex-1">
          <div className="font-medium text-amber-400">
            {anomalies.length} issue{anomalies.length > 1 ? 's' : ''} need{anomalies.length === 1 ? 's' : ''} your attention
          </div>
          <div className="text-sm text-amber-300/70">
            {anomalies[0].message}
          </div>
        </div>
        <ChevronRightIcon className="w-5 h-5 text-amber-400" />
      </div>
    </Link>
  );
}

function TodaySummary({ shift }: { shift: CurrentShift }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Today</h3>
        <span className="text-sm text-slate-400">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Clocked in</span>
          <span>{new Date(shift.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Break taken</span>
          <span>{shift.breakMinutes} min</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Time worked</span>
          <span className="font-medium">{formatDuration(shift.durationMinutes - shift.breakMinutes)}</span>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto">
      <div className="card p-6 animate-pulse">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-slate-700" />
          <div className="h-6 bg-slate-700 rounded w-32" />
        </div>
        <div className="h-12 bg-slate-700 rounded w-40 mx-auto mb-6" />
        <div className="h-14 bg-slate-700 rounded-xl" />
      </div>
    </div>
  );
}

function FeatureDisabledState() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="text-center">
        <ClockIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">TimeClockFlow Coming Soon</h2>
        <p className="text-slate-400 max-w-md">
          Mobile-first time tracking with GPS verification and anomaly detection 
          is under development. Check back soon!
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Utilities
// =============================================================================

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const secs = Math.floor((minutes * 60) % 60);
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// =============================================================================
// Icons
// =============================================================================

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TimesheetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

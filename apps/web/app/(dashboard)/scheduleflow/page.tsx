/**
 * ScheduleFlow Home Page
 * 
 * List and manage project schedules with filtering and pagination.
 * See: docs/scheduleflow/frontend-prd-home.md
 * 
 * @module scheduleflow/page
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Feature flag - disable if ScheduleFlow not enabled
const FEATURE_SCHEDULEFLOW = process.env.NEXT_PUBLIC_FEATURE_SCHEDULEFLOW === 'true';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'ScheduleFlow | BuildFlow Pro',
  description: 'Manage project schedules, activities, and crew notifications',
};

// =============================================================================
// Types
// =============================================================================

type ScheduleStatus = 'draft' | 'pending' | 'approved' | 'rejected';

type Schedule = {
  id: string;
  name: string;
  description?: string;
  startAt: string;
  endAt: string;
  status: ScheduleStatus;
  activityCount: number;
  assignedUsers: { id: string; name: string; avatarUrl?: string }[];
  updatedAt: string;
};

type ScheduleFilters = {
  status?: string;
  from?: string;
  to?: string;
  search?: string;
};

// =============================================================================
// Page Component
// =============================================================================

export default async function ScheduleFlowPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  // Feature flag check
  if (!FEATURE_SCHEDULEFLOW) {
    return <FeatureDisabledState />;
  }

  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/signin');
  }

  const filters: ScheduleFilters = {
    status: searchParams.status,
    from: searchParams.from,
    to: searchParams.to,
    search: searchParams.search,
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">ScheduleFlow</h1>
          <p className="text-slate-400">Manage project schedules and activities</p>
        </div>
        <Link
          href="/scheduleflow/new"
          className="btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          New Schedule
        </Link>
      </div>

      {/* Filters */}
      <ScheduleFiltersBar filters={filters} />

      {/* Schedule List */}
      <Suspense fallback={<ScheduleListSkeleton />}>
        <ScheduleList filters={filters} />
      </Suspense>
    </div>
  );
}

// =============================================================================
// Components
// =============================================================================

function ScheduleFiltersBar({ filters }: { filters: ScheduleFilters }) {
  const statuses: ScheduleStatus[] = ['draft', 'pending', 'approved', 'rejected'];
  
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Status Filter */}
      <div className="flex items-center gap-2 border border-slate-700 rounded-lg p-1">
        <FilterChip
          href="/scheduleflow"
          active={!filters.status}
        >
          All
        </FilterChip>
        {statuses.map((status) => (
          <FilterChip
            key={status}
            href={`/scheduleflow?status=${status}`}
            active={filters.status === status}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </FilterChip>
        ))}
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xs">
        <input
          type="search"
          placeholder="Search schedules..."
          defaultValue={filters.search}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          // TODO: Implement search with debounce
        />
      </div>
    </div>
  );
}

function FilterChip({ 
  href, 
  active, 
  children 
}: { 
  href: string; 
  active: boolean; 
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors min-h-[36px] flex items-center ${
        active
          ? 'bg-cyan-500/20 text-cyan-400'
          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
      }`}
    >
      {children}
    </Link>
  );
}

async function ScheduleList({ filters }: { filters: ScheduleFilters }) {
  // TODO: Fetch from API
  // const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  // const response = await fetch(`${API_BASE_URL}/v1/schedules?${new URLSearchParams(filters as any)}`);
  // const data = await response.json();

  // Stub: empty state for now
  const schedules: Schedule[] = [];

  if (schedules.length === 0) {
    return <EmptyState hasFilters={!!filters.status || !!filters.search} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {schedules.map((schedule) => (
        <ScheduleCard key={schedule.id} schedule={schedule} />
      ))}
    </div>
  );
}

function ScheduleCard({ schedule }: { schedule: Schedule }) {
  return (
    <Link
      href={`/scheduleflow/${schedule.id}`}
      className="card p-4 hover:border-slate-600 transition-all group"
      aria-label={`View ${schedule.name} schedule`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors truncate">
          {schedule.name}
        </h3>
        <StatusBadge status={schedule.status} />
      </div>
      
      <p className="text-sm text-slate-400 mb-3">
        {formatDateRange(schedule.startAt, schedule.endAt)}
      </p>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">
          {schedule.activityCount} {schedule.activityCount === 1 ? 'activity' : 'activities'}
        </span>
        
        {schedule.assignedUsers.length > 0 && (
          <AvatarStack users={schedule.assignedUsers} />
        )}
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: ScheduleStatus }) {
  const styles: Record<ScheduleStatus, string> = {
    draft: 'bg-slate-500/20 text-slate-400 ring-slate-500/30',
    pending: 'bg-amber-500/20 text-amber-400 ring-amber-500/30',
    approved: 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-400 ring-red-500/30',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ring-1 ring-inset ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function AvatarStack({ users }: { users: { id: string; name: string; avatarUrl?: string }[] }) {
  return (
    <div className="flex -space-x-2">
      {users.slice(0, 3).map((user) => (
        <div
          key={user.id}
          className="w-6 h-6 rounded-full bg-slate-700 ring-2 ring-slate-900 flex items-center justify-center text-xs font-medium"
          title={user.name}
        >
          {user.name.charAt(0)}
        </div>
      ))}
      {users.length > 3 && (
        <div className="w-6 h-6 rounded-full bg-slate-600 ring-2 ring-slate-900 flex items-center justify-center text-xs">
          +{users.length - 3}
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <div className="text-center py-12">
        <SearchIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No schedules match your filters</h3>
        <p className="text-slate-400 mb-4">Try adjusting your search or filters.</p>
        <Link href="/scheduleflow" className="btn-secondary">
          Clear Filters
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">No schedules yet</h3>
      <p className="text-slate-400 mb-4">Create your first schedule to start planning.</p>
      <Link href="/scheduleflow/new" className="btn-primary">
        Create Schedule
      </Link>
    </div>
  );
}

function ScheduleListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="h-5 bg-slate-700 rounded w-32" />
            <div className="h-5 bg-slate-700 rounded w-16" />
          </div>
          <div className="h-4 bg-slate-700 rounded w-40 mb-3" />
          <div className="flex items-center justify-between">
            <div className="h-4 bg-slate-700 rounded w-20" />
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="w-6 h-6 rounded-full bg-slate-700" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeatureDisabledState() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <CalendarIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">ScheduleFlow Coming Soon</h2>
        <p className="text-slate-400 max-w-md">
          AI-powered schedule generation and management is under development.
          Check back soon!
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Utilities
// =============================================================================

function formatDateRange(startAt: string, endAt: string): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  
  return `${start.toLocaleDateString('en-US', options)} – ${end.toLocaleDateString('en-US', options)}`;
}

// =============================================================================
// Icons
// =============================================================================

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

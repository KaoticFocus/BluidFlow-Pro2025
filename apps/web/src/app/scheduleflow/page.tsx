import Link from 'next/link';
import { Suspense } from 'react';

export default function ScheduleFlowPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const status = (searchParams?.status as string) ?? '';
  const range = (searchParams?.range as string) ?? '';

  return (
    <main className="container mx-auto px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">ScheduleFlow</h1>
        <div className="space-x-2">
          <Link className="btn btn-primary" href="/scheduleflow/new">New Plan</Link>
        </div>
      </header>

      <section className="mb-4 text-sm text-gray-500">
        <div>Filters applied:</div>
        <ul className="list-disc list-inside">
          <li>Status: {status || '—'}</li>
          <li>Range: {range || '—'}</li>
        </ul>
      </section>

      <Suspense fallback={<div>Loading plans…</div>}>
        <div className="rounded border p-4">
          <p className="text-gray-600">Plan list goes here. Fetch from /api/schedule/plans with status/range.</p>
          <div className="mt-2 space-x-2 text-sm">
            <Link href="/scheduleflow?status=approved" className="link">Approved</Link>
            <Link href="/scheduleflow?status=draft" className="link">Draft</Link>
            <Link href="/scheduleflow" className="link">Clear</Link>
          </div>
        </div>
      </Suspense>
    </main>
  );
}

import Link from 'next/link';
import { Suspense } from 'react';

export default function TasksPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const status = (searchParams?.status as string) ?? '';
  const due = (searchParams?.due as string) ?? '';
  const assigneeId = (searchParams?.assigneeId as string) ?? '';
  const q = (searchParams?.q as string) ?? '';
  const page = (searchParams?.page as string) ?? '1';

  return (
    <main className="container mx-auto px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">TaskFlow</h1>
        <div className="space-x-2">
          <Link className="btn btn-primary" href="/tasks/new">New Task</Link>
        </div>
      </header>

      <section className="mb-4 text-sm text-gray-500">
        <div>Filters applied:</div>
        <ul className="list-disc list-inside">
          <li>Status: {status || '—'}</li>
          <li>Due: {due || '—'}</li>
          <li>Assignee: {assigneeId || '—'}</li>
          <li>Query: {q || '—'}</li>
          <li>Page: {page}</li>
        </ul>
      </section>

      <Suspense fallback={<div>Loading tasks…</div>}>
        <div className="rounded border p-4">
          <p className="text-gray-600">Task list goes here. Implement data fetch to /api/tasks with status/due/q/assigneeId/page.</p>
          <div className="mt-2 space-x-2 text-sm">
            <Link href="/tasks?status=overdue" className="link">Overdue</Link>
            <Link href="/tasks?due=today" className="link">Due Today</Link>
            <Link href="/tasks" className="link">Clear</Link>
          </div>
        </div>
      </Suspense>
    </main>
  );
}

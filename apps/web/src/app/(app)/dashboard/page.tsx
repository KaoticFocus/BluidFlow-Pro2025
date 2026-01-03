import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/tasks?status=overdue" className="rounded border p-4 hover:bg-gray-50 transition">
          <div className="text-sm text-gray-500">Overdue Tasks</div>
          <div className="text-2xl font-bold">—</div>
        </Link>
        <Link href="/tasks?due=today" className="rounded border p-4 hover:bg-gray-50 transition">
          <div className="text-sm text-gray-500">Tasks Due Today</div>
          <div className="text-2xl font-bold">—</div>
        </Link>
        <Link href="/scheduleflow?status=approved" className="rounded border p-4 hover:bg-gray-50 transition">
          <div className="text-sm text-gray-500">Latest Plans</div>
          <div className="text-2xl font-bold">—</div>
        </Link>
      </section>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/tasks" className="rounded border p-4 hover:bg-gray-50">Go to TaskFlow</Link>
        <Link href="/scheduleflow" className="rounded border p-4 hover:bg-gray-50">Go to ScheduleFlow</Link>
      </section>

      {/* Telemetry placeholders */}
      {/* TODO: instrument events: dashboard.tile.click, with tile id and query params */}
    </main>
  );
}

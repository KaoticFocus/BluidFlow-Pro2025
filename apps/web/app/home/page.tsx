import React from "react";
import TileGrid from "@/components/home/TileGrid";
import ModuleTile from "@/components/home/ModuleTile";

export const metadata = { title: "Home" };

async function fetchSummary() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
  const urls = [
    `${base}/v1/home/summary`,
    `${base}/home/summary`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) return res.json();
    } catch (e) {
      // continue to next
    }
  }
  return {} as any;
}

export default async function HomePage() {
  const data = await fetchSummary();

  const tiles = [
    {
      id: "tasks",
      label: "Tasks",
      href: "/taskflow",
      enabled: true,
      badge: { type: "count" as const, value: data?.tasks?.todo ?? 0, intent: (data?.tasks?.overdue ?? 0) > 0 ? "danger" : "info" },
    },
    { id: "meetings", label: "Meetings", href: "/meetings", enabled: true, badge: { type: "count" as const, value: data?.meetings?.reviewPending ?? 0, intent: "warning" } },
    { id: "leads", label: "Leads", href: "/leads", enabled: true, badge: { type: "count" as const, value: data?.leads?.new7d ?? 0, intent: "info" } },
    { id: "schedule", label: "Schedule", href: "/scheduleflow", enabled: true, badge: { type: "count" as const, value: data?.schedule?.today ?? 0, intent: "info" } },
    { id: "time", label: "Time", href: "/timeclockflow", enabled: true, badge: { type: "count" as const, value: data?.time?.missing ?? 0, intent: "warning" } },
    { id: "documents", label: "Documents", href: "/documents", enabled: true, badge: { type: "dot" as const, intent: "info" } },
    { id: "ai", label: "AI", href: "/ai", enabled: Boolean(data?.ai?.available), badge: { type: "dot" as const, intent: "info" } },
  ];

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Home</h1>
        <p className="text-sm text-neutral-500">Choose a module to get started</p>
      </header>
      <TileGrid>
        {tiles.map((t) => (
          <ModuleTile key={t.id} id={t.id} label={t.label} href={t.href} enabled={t.enabled} badge={t.badge} onClickTelemetryKey="home.tile_clicked" />
        ))}
      </TileGrid>
    </main>
  );
}

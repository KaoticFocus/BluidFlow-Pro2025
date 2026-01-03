"use client";

import Link from "next/link";
import React from "react";
import { track } from "@/app/../lib/telemetry";

export type ModuleTileBadge = {
  type: "count" | "dot";
  value?: number;
  intent?: "info" | "warning" | "danger";
};

export type ModuleTileProps = {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  enabled?: boolean;
  badge?: ModuleTileBadge;
  onClickTelemetryKey?: string;
};

export function ModuleTile({ id, label, href, icon, enabled = true, badge, onClickTelemetryKey }: ModuleTileProps) {
  const intentColor = badge?.intent === "danger" ? "bg-red-500" : badge?.intent === "warning" ? "bg-yellow-500" : "bg-sky-500";

  const handleClick = () => {
    if (onClickTelemetryKey) track(onClickTelemetryKey, { tileId: id, href });
  };

  const content = (
    <div className={`relative flex h-28 w-full items-center justify-start gap-3 rounded-lg border p-4 transition-colors ${enabled ? "hover:bg-neutral-50 dark:hover:bg-neutral-900" : "opacity-50"}`} aria-disabled={!enabled}>
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-800">
        {icon ?? <span className="text-xl">📦</span>}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-neutral-500">{enabled ? "Open" : "Coming soon"}</span>
      </div>
      {badge && (
        <div className="absolute right-3 top-3">
          {badge.type === "count" ? (
            <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs text-white ${intentColor}`}>
              {badge.value ?? 0}
            </span>
          ) : (
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${intentColor}`} />
          )}
        </div>
      )}
    </div>
  );

  return enabled ? (
    <Link href={href} onClick={handleClick} aria-label={`${label} module`}>
      {content}
    </Link>
  ) : (
    <div role="button" aria-label={`${label} module (coming soon)`} className="cursor-not-allowed">
      {content}
    </div>
  );
}

export default ModuleTile;

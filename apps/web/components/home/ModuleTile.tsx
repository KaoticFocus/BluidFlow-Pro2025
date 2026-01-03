"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/telemetry";

export interface ModuleTileProps {
  id: string;
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  badge?: number | string;
  badgeType?: "default" | "warning" | "success" | "error";
  disabled?: boolean;
  comingSoon?: boolean;
}

const badgeColors = {
  default: "bg-slate-600 text-slate-200",
  warning: "bg-amber-500/20 text-amber-400",
  success: "bg-emerald-500/20 text-emerald-400",
  error: "bg-red-500/20 text-red-400",
};

export function ModuleTile({
  id,
  href,
  title,
  description,
  icon,
  iconBg,
  iconColor,
  badge,
  badgeType = "default",
  disabled = false,
  comingSoon = false,
}: ModuleTileProps) {
  const handleClick = () => {
    trackEvent("home.tile_clicked", { tileId: id, href, title });
  };

  const content = (
    <>
      <div className={`h-12 w-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
        <div className={`h-6 w-6 ${iconColor}`}>{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold truncate">{title}</h3>
          {badge !== undefined && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badgeColors[badgeType]}`}>
              {badge}
            </span>
          )}
          {comingSoon && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-700 text-slate-400">
              Coming soon
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400 truncate mt-1">{description}</p>
      </div>
      <ChevronRightIcon className="h-5 w-5 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0" />
    </>
  );

  if (disabled || comingSoon) {
    return (
      <div
        className="card p-4 flex items-center gap-4 opacity-60 cursor-not-allowed min-h-[88px]"
        aria-label={`${title} - ${comingSoon ? "Coming soon" : "Disabled"}`}
        role="button"
        aria-disabled="true"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="card p-4 flex items-center gap-4 group hover:border-slate-700 hover:bg-slate-800/30 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-950 min-h-[88px]"
      aria-label={`Open ${title}${badge ? ` (${badge})` : ""}`}
    >
      {content}
    </Link>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default ModuleTile;
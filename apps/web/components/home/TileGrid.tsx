import { ModuleTile, type ModuleTileProps } from "./ModuleTile";

export interface TileGridProps {
  tiles: ModuleTileProps[];
  className?: string;
}

/**
 * TileGrid - Responsive grid of module tiles
 * 
 * Mobile: 1 column (360px)
 * Small: 2 columns
 * Medium: 3 columns
 * Large: 4 columns
 * 
 * All tiles have minimum 44x44px tap targets for accessibility.
 */
export function TileGrid({ tiles, className = "" }: TileGridProps) {
  if (tiles.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="h-16 w-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <GridIcon className="h-8 w-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-medium mb-2">No modules available</h3>
        <p className="text-slate-400 max-w-sm mx-auto">
          Contact your administrator to enable modules for your account.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-w-0 ${className}`}
      role="list"
      aria-label="Available modules"
    >
      {tiles.map((tile) => (
        <div key={tile.id} role="listitem">
          <ModuleTile {...tile} />
        </div>
      ))}
    </div>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

export default TileGrid;
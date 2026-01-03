import * as React from 'react';

export type PlanRowProps = {
  id: string;
  name: string;
  status: 'draft' | 'approved' | 'archived';
  startsAt?: string;
  endsAt?: string;
  onClick?: (id: string) => void;
};

export const PlanRow: React.FC<PlanRowProps> = ({ id, name, status, startsAt, endsAt, onClick }) => {
  return (
    <div
      className="flex items-center justify-between border-b py-3 cursor-pointer hover:bg-gray-50"
      onClick={() => onClick?.(id)}
      role="button"
      aria-label={`Open plan ${name}`}
    >
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-xs text-gray-500">{startsAt || '—'} → {endsAt || '—'}</div>
      </div>
      <span className="text-xs uppercase tracking-wide text-gray-600">{status}</span>
    </div>
  );
};

export default PlanRow;

import * as React from 'react';

export type PlanFiltersProps = {
  status?: string;
  range?: string;
  onChange?: (filters: { status?: string; range?: string }) => void;
};

export const PlanFilters: React.FC<PlanFiltersProps> = ({ status, range, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <select
        className="border rounded px-2 py-1"
        value={status || ''}
        onChange={(e) => onChange?.({ status: e.target.value || undefined, range })}
      >
        <option value="">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="approved">Approved</option>
        <option value="archived">Archived</option>
      </select>
      <select
        className="border rounded px-2 py-1"
        value={range || ''}
        onChange={(e) => onChange?.({ status, range: e.target.value || undefined })}
      >
        <option value="">Any Range</option>
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
      </select>
    </div>
  );
};

export default PlanFilters;

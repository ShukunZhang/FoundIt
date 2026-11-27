import React from 'react';
import { CATEGORY_OPTIONS } from '../lib/categories';
import type { CampusStats } from '../types';

interface CampusStatsProps {
  stats: CampusStats | null;
}

function categoryLabel(category: string): string {
  return CATEGORY_OPTIONS.find((option) => option.id === category)?.label ?? category;
}

export const CampusStatsCard: React.FC<CampusStatsProps> = ({ stats }) => {
  if (!stats) return null;
  const top = stats.categories[0];
  const max = top?.count ?? 1;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-5 gap-3" aria-label="Campus lost and found stats">
      <div className="sm:col-span-2 bg-slate-950 text-white rounded-3xl p-5">
        <p className="text-[11px] uppercase tracking-wider font-bold text-amber-300">Returned by FoundIt</p>
        <p className="mt-2 text-4xl font-black">{stats.returnedTotal}</p>
        <p className="mt-1 text-xs text-slate-300">Lost items handed back after a WATID check.</p>
      </div>
      <div className="sm:col-span-3 bg-white rounded-3xl border border-slate-200 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Most lost last week</p>
            <p className="mt-1 text-lg font-black text-slate-950">
              {top ? categoryLabel(top.category) : 'Nothing reported'}
            </p>
          </div>
          <p className="text-xs text-slate-500">{`${stats.lostLastWeek} ${stats.lostLastWeek === 1 ? 'item' : 'items'}`}</p>
        </div>
        {stats.categories.length === 0 ? (
          <p className="mt-4 text-xs text-slate-500">No items logged in the past 7 days.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {stats.categories.map((row) => (
              <li key={row.category}>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                  <span>{categoryLabel(row.category)}</span>
                  <span>{row.count}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${row.category === top?.category ? 'bg-amber-400' : 'bg-slate-400'}`}
                    style={{ width: `${Math.max(8, Math.round((row.count / max) * 100))}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

import React from 'react';
import { Archive } from 'lucide-react';
import type { FoundItem } from '../types';
import { ItemPhoto } from './CategoryIcon';

interface StaffArchiveProps {
  items: FoundItem[];
  selectedDesk: string;
}

function archivedLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const StaffArchive: React.FC<StaffArchiveProps> = ({ items, selectedDesk }) => {
  const archived = items
    .filter((item) => item.archivedAt && (selectedDesk === 'All Desks' || item.desk === selectedDesk))
    .sort((a, b) => (b.archivedAt ?? '').localeCompare(a.archivedAt ?? ''));

  return (
    <div className="space-y-4 pb-16">
      <div className="bg-white p-5 rounded-3xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-950">Archive</h2>
        <p className="text-xs text-slate-500 mt-1">
          Items handed back after a WATID check. Records older than 4 months are removed automatically.
        </p>
      </div>
      {archived.length === 0 ? (
        <p className="text-sm text-slate-600 bg-white rounded-2xl border border-slate-200 p-6">Nothing in the archive for this desk.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {archived.map((item) => (
            <article key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex gap-3 min-w-0">
                <ItemPhoto item={item} className="h-16 w-16 rounded-xl shrink-0" />
                <div>
                <p className="font-mono text-sm font-bold text-slate-950">{item.itemCode}</p>
                <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-500">
                  {item.colour} {item.category} · {item.desk}
                  {item.archivedAt ? ` · Returned ${archivedLabel(item.archivedAt)}` : ''}
                </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                <Archive className="w-3.5 h-3.5" />
                {item.returnedWatid ? `WATID ${item.returnedWatid}` : 'Returned'}
              </span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

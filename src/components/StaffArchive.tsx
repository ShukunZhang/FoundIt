import React from 'react';
import type { FoundItem } from '../types';
import { ItemPhoto } from './CategoryIcon';

interface StaffArchiveProps {
  items: FoundItem[];
  selectedDesk: string;
}

function traceWhen(iso: string | undefined): string {
  if (!iso) return 'Time not recorded';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function claimedBy(item: FoundItem): string {
  if (item.claimedName && item.returnedWatid) return `${item.claimedName} · WATID ${item.returnedWatid}`;
  if (item.returnedWatid) return `WATID ${item.returnedWatid}`;
  return 'WATID not recorded';
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
          Each record keeps when the item was found and who claimed it. Records older than 4 months are removed automatically.
        </p>
      </div>
      {archived.length === 0 ? (
        <p className="text-sm text-slate-600 bg-white rounded-2xl border border-slate-200 p-6">Nothing in the archive for this desk.</p>
      ) : (
        <div className="space-y-3">
          {archived.map((item) => (
            <article key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-3">
              <ItemPhoto item={item} className="h-16 w-16 rounded-xl shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-bold text-slate-950">{item.itemCode}</p>
                <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {item.colour} {item.category} · {item.desk}
                </p>
                <ol className="mt-3 space-y-2 border-l border-slate-200 ml-1 pl-3">
                  <li>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Found</p>
                    <p className="text-xs text-slate-700">{traceWhen(item.loggedAt ?? item.dateLogged)}</p>
                    <p className="text-xs text-slate-500">
                      {item.locationFound ? item.locationFound : 'Place not recorded'}
                      {item.loggedByName ? ` · logged by ${item.loggedByName}` : ''}
                    </p>
                  </li>
                  <li>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-700">Claimed</p>
                    <p className="text-xs text-slate-700">{traceWhen(item.archivedAt)}</p>
                    <p className="text-xs text-slate-500">{claimedBy(item)}</p>
                  </li>
                </ol>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import type { FoundItem, ItemMatch, LostReport } from '../types';
import { studentItemLabel } from '../lib/studentView';

interface MatchesViewProps {
  matches: ItemMatch[];
  items: FoundItem[];
  reports: LostReport[];
  onDecide: (matchId: string, status: 'confirmed' | 'rejected') => Promise<void>;
}

export const MatchesView: React.FC<MatchesViewProps> = ({ matches, items, reports, onDecide }) => {
  const visible = matches.filter((match) => match.status !== 'rejected');
  if (visible.length === 0) {
    return <p className="text-sm text-slate-600 bg-white rounded-2xl p-6 border border-slate-200">No ranked matches yet. A match can come from a similar photo, or from the category plus a brand, detail, or place.</p>;
  }
  return (
    <div className="space-y-3">
      {visible.map((match) => {
        const item = items.find((entry) => entry.id === match.foundItemId);
        const report = reports.find((entry) => entry.id === match.lostReportId);
        if (!item || !report) return null;
        return (
          <article key={match.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
            <div className="flex justify-between">
              <h3 className="font-bold">{match.confidence}% match</h3>
              <span className="text-[11px] uppercase font-bold">{match.status}</span>
            </div>
            <p className="text-xs">Lost: {report.title} · Found: {studentItemLabel(item)} at {item.desk}</p>
            <p className="text-xs text-emerald-800">{match.reasons.join(' · ') || 'Shared traits'}</p>
            {match.differences.length > 0 && <p className="text-xs text-rose-800">{match.differences.join(' · ')}</p>}
            {match.status === 'pending' && (
              <div className="flex gap-2">
                <button type="button" className="px-3 py-2 rounded-xl bg-slate-950 text-white text-xs font-bold" onClick={() => void onDecide(match.id, 'confirmed')}>Yes, this matches</button>
                <button type="button" className="px-3 py-2 rounded-xl bg-slate-100 text-xs font-bold" onClick={() => void onDecide(match.id, 'rejected')}>Not mine</button>
              </div>
            )}
            {match.status === 'confirmed' && (
              <p className="text-xs font-semibold text-slate-800">
                Go to {item.desk}. Show item code <span className="font-mono">{item.itemCode ?? 'on the item'}</span> and your WATID.
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
};

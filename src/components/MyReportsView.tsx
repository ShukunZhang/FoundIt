import React from 'react';
import type { ItemMatch, LostReport } from '../types';

interface MyReportsViewProps {
  reports: LostReport[];
  matches: ItemMatch[];
  onOpenMatches: () => void;
}

export const MyReportsView: React.FC<MyReportsViewProps> = ({ reports, matches, onOpenMatches }) => {
  if (reports.length === 0) {
    return <p className="text-sm text-slate-600 bg-white rounded-2xl p-6 border border-slate-200">You have not reported a lost item yet.</p>;
  }
  return (
    <div className="space-y-3">
      {reports.map((report) => {
        const related = matches.filter((match) => match.lostReportId === report.id && match.status !== 'rejected');
        return (
          <article key={report.id} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex justify-between gap-3">
              <h3 className="font-bold">{report.title}</h3>
              <span className="text-[11px] uppercase font-bold text-amber-800">{report.status}</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">{[report.colour, report.category].filter((part) => part.trim()).join(' ')}{report.subcategory ? ` · ${report.subcategory}` : ''}{report.brand ? ` · ${report.brand}` : ''}</p>
            {report.building.trim() ? <p className="text-xs text-slate-600">{report.building}{report.locationDetail ? ` · ${report.locationDetail}` : ''}</p> : null}
            <p className="text-xs text-slate-500 mt-1">Lost {new Date(report.lostAt).toLocaleString()}</p>
            <p className="text-xs mt-2">{related.length} potential match{related.length === 1 ? '' : 'es'}</p>
            {related.length > 0 && (
              <button type="button" onClick={onOpenMatches} className="mt-2 text-xs font-bold text-amber-800">Review matches</button>
            )}
          </article>
        );
      })}
    </div>
  );
};

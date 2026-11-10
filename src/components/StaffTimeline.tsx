import React from 'react';
import type { TimelineEvent } from '../types';

interface StaffTimelineProps {
  events: TimelineEvent[];
}

export const StaffTimeline: React.FC<StaffTimelineProps> = ({ events }) => {
  if (events.length === 0) {
    return <p className="text-sm text-slate-600 bg-white rounded-2xl p-6 border border-slate-200">No activity yet. Logging, moving, and claims will show up here.</p>;
  }
  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex justify-between gap-3">
            <p className="text-xs font-bold uppercase text-amber-800">{event.eventType}</p>
            <p className="text-[11px] text-slate-500">{new Date(event.createdAt).toLocaleString()}</p>
          </div>
          <p className="text-sm mt-1">{event.message}</p>
          <p className="text-[11px] text-slate-400 mt-1">{event.visibility === 'staff' ? 'Staff only' : 'Visible to students'}</p>
        </li>
      ))}
    </ol>
  );
};

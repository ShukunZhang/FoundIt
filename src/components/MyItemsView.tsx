import React from 'react';
import type { FoundItem, ItemMatch, LostReport, NotificationItem } from '../types';
import { InboxView } from './InboxView';
import { MatchesView } from './MatchesView';
import { MyReportsView } from './MyReportsView';

export type MineSection = 'reports' | 'matches' | 'inbox';

interface MyItemsViewProps {
  section: MineSection;
  onSection: (section: MineSection) => void;
  reports: LostReport[];
  matches: ItemMatch[];
  items: FoundItem[];
  notifications: NotificationItem[];
  unreadCount: number;
  onBack: () => void;
  onDecide: (matchId: string, status: 'confirmed' | 'rejected') => Promise<void>;
  onMarkAllAsRead: () => void;
  onNotificationAction: (note: NotificationItem) => void;
}

const SECTIONS: Array<[MineSection, string]> = [
  ['reports', 'Lost reports'],
  ['matches', 'Matches'],
  ['inbox', 'Inbox'],
];

export const MyItemsView: React.FC<MyItemsViewProps> = ({
  section,
  onSection,
  reports,
  matches,
  items,
  notifications,
  unreadCount,
  onBack,
  onDecide,
  onMarkAllAsRead,
  onNotificationAction,
}) => {
  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-xs font-bold text-slate-700 underline">
        Back to search
      </button>
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onSection(id)}
            className={`px-3 py-2 rounded-xl text-xs font-bold ${section === id ? 'bg-slate-950 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}
          >
            {label}
            {id === 'inbox' && unreadCount > 0 ? ` (${unreadCount})` : ''}
          </button>
        ))}
      </div>
      {section === 'reports' && (
        <MyReportsView reports={reports} matches={matches} onOpenMatches={() => onSection('matches')} />
      )}
      {section === 'matches' && (
        <MatchesView matches={matches} items={items} reports={reports} onDecide={onDecide} />
      )}
      {section === 'inbox' && (
        <InboxView
          notifications={notifications}
          onMarkAllAsRead={onMarkAllAsRead}
          onNotificationAction={onNotificationAction}
        />
      )}
    </div>
  );
};

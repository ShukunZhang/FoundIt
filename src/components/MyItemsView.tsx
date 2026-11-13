import React from 'react';
import type { FoundItem, ItemMatch, LostReport, NotificationItem, UserProfile } from '../types';
import { InboxView } from './InboxView';
import { MatchesView } from './MatchesView';
import { MyClaimsView } from './MyClaimsView';
import { MyReportsView } from './MyReportsView';

export type MineSection = 'reports' | 'matches' | 'claims' | 'inbox';

interface MyItemsViewProps {
  section: MineSection;
  onSection: (section: MineSection) => void;
  reports: LostReport[];
  matches: ItemMatch[];
  items: FoundItem[];
  user: UserProfile;
  notifications: NotificationItem[];
  unreadCount: number;
  onDecide: (matchId: string, status: 'confirmed' | 'rejected') => Promise<void>;
  onClaim: (item: FoundItem) => void;
  onShowPickupCode: (code: string, title: string, desk: string) => void;
  onExplore: () => void;
  onSignIn: () => void;
  onMarkAllAsRead: () => void;
  onNotificationAction: (note: NotificationItem) => void;
}

const SECTIONS: Array<[MineSection, string]> = [
  ['reports', 'Lost reports'],
  ['matches', 'Matches'],
  ['claims', 'Claims'],
  ['inbox', 'Inbox'],
];

export const MyItemsView: React.FC<MyItemsViewProps> = ({
  section,
  onSection,
  reports,
  matches,
  items,
  user,
  notifications,
  unreadCount,
  onDecide,
  onClaim,
  onShowPickupCode,
  onExplore,
  onSignIn,
  onMarkAllAsRead,
  onNotificationAction,
}) => {
  return (
    <div className="space-y-4">
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
        <MatchesView matches={matches} items={items} reports={reports} onDecide={onDecide} onClaim={onClaim} />
      )}
      {section === 'claims' && (
        <MyClaimsView items={items} user={user} onShowPickupCode={onShowPickupCode} onExplore={onExplore} onSignIn={onSignIn} />
      )}
      {section === 'inbox' && (
        <InboxView
          notifications={notifications}
          onMarkAllAsRead={onMarkAllAsRead}
          onNotificationAction={onNotificationAction}
          onShowPickupCode={onShowPickupCode}
        />
      )}
    </div>
  );
};

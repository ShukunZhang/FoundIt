import React from 'react';
import type { BuildingInfo, Category, DeskInfo, FoundItem, ItemMatch, LostReport, NotificationItem, ReturnTag, UserProfile } from '../types';
import { CampusMapView } from './CampusMapView';
import { InboxView } from './InboxView';
import { MatchesView } from './MatchesView';
import { MyClaimsView } from './MyClaimsView';
import { MyReportsView } from './MyReportsView';
import { ReturnTagsView } from './ReturnTagsView';
import { StudentBackBar } from './TabBar';
import { StudentHome } from './StudentHome';

export type StudentTab = 'explore' | 'reports' | 'matches' | 'tags' | 'map' | 'claims' | 'inbox';

const PAGE_TITLES: Record<Exclude<StudentTab, 'explore'>, string> = {
  reports: 'My lost reports',
  matches: 'Matches',
  tags: 'Return tags',
  map: 'Campus map',
  claims: 'My claims',
  inbox: 'Notifications',
};

interface StudentAreaProps {
  tab: StudentTab;
  onTabChange: (tab: StudentTab) => void;
  signedIn: boolean;
  items: FoundItem[];
  user: UserProfile;
  reports: LostReport[];
  matches: ItemMatch[];
  tags: ReturnTag[];
  buildings: BuildingInfo[];
  desks: DeskInfo[];
  notifications: NotificationItem[];
  onSelectItem: (item: FoundItem) => void;
  onOpenReportFound: () => void;
  onOpenLost: () => void;
  onDecideMatch: (id: string, status: 'confirmed' | 'rejected') => Promise<void>;
  onClaim: (item: FoundItem) => void;
  onCreateTag: (label: string, category: Category, colour: string) => Promise<void>;
  onScanTag: (code: string) => Promise<void>;
  onShowPickupCode: (code: string, title: string, desk: string) => void;
  onSignIn: () => void;
  onMarkAllRead: () => void;
  onNotificationAction: (note: NotificationItem) => void;
}

export const StudentArea: React.FC<StudentAreaProps> = ({
  tab,
  onTabChange,
  signedIn,
  items,
  user,
  reports,
  matches,
  tags,
  buildings,
  desks,
  notifications,
  onSelectItem,
  onOpenReportFound,
  onOpenLost,
  onDecideMatch,
  onClaim,
  onCreateTag,
  onScanTag,
  onShowPickupCode,
  onSignIn,
  onMarkAllRead,
  onNotificationAction,
}) => {
  const pageTitle = tab === 'explore' ? '' : PAGE_TITLES[tab];
  const needsAccount = tab === 'reports' || tab === 'matches' || tab === 'tags' || tab === 'claims';

  return (
    <div>
      {pageTitle && <StudentBackBar title={pageTitle} onBack={() => onTabChange('explore')} />}
      {tab === 'explore' && (
        <StudentHome
          items={items}
          onSelectItem={onSelectItem}
          onOpenReportFound={onOpenReportFound}
          onOpenLost={onOpenLost}
          onOpenNotifyMe={onOpenLost}
        />
      )}
      {needsAccount && !signedIn && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-950">{pageTitle}</h2>
          <p className="text-sm text-slate-600 mt-1">Sign in to open this page.</p>
          <button type="button" onClick={onSignIn} className="mt-4 px-4 py-2 rounded-xl bg-slate-950 text-white text-xs font-bold">
            Sign in
          </button>
        </section>
      )}
      {tab === 'reports' && signedIn && (
        <MyReportsView reports={reports} matches={matches} onOpenMatches={() => onTabChange('matches')} />
      )}
      {tab === 'matches' && signedIn && (
        <MatchesView matches={matches} items={items} reports={reports} onDecide={onDecideMatch} onClaim={onClaim} />
      )}
      {tab === 'tags' && signedIn && <ReturnTagsView tags={tags} onCreate={onCreateTag} onSimulateScan={onScanTag} />}
      {tab === 'map' && <CampusMapView buildings={buildings} desks={desks} items={items} reports={reports} />}
      {tab === 'claims' && signedIn && (
        <MyClaimsView items={items} user={user} onShowPickupCode={onShowPickupCode} onExplore={() => onTabChange('explore')} onSignIn={onSignIn} />
      )}
      {tab === 'inbox' && (
        <InboxView
          notifications={notifications}
          onMarkAllAsRead={onMarkAllRead}
          onNotificationAction={onNotificationAction}
          onShowPickupCode={onShowPickupCode}
        />
      )}
    </div>
  );
};

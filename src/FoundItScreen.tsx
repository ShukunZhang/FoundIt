import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Bell, Compass, FileCheck, LayoutDashboard, Map, PlusCircle, Scan, ShieldCheck, Tag } from 'lucide-react';
import { useAuth } from './context/AuthProvider';
import { categoryIsValuable } from './lib/categories';
import {
  createClaim,
  createFoundItem,
  createLostReport,
  createReturnTag,
  fetchBuildings,
  fetchClaims,
  fetchDesks,
  fetchItems,
  fetchMatches,
  fetchNotifications,
  fetchReports,
  fetchTags,
  fetchTimeline,
  markNotificationsRead,
  reviewClaim,
  scanReturnTag,
  setMatchStatus,
  updateItemStatus,
  uploadPhoto,
} from './lib/db';
import { attachClaims } from './lib/mappers';
import { forStudentView, studentItemLabel } from './lib/studentView';
import { getNearestDesk } from './mockData';
import type { Category, FoundItem, NotificationItem } from './types';
import { Navbar } from './components/Navbar';
import { StudentHome } from './components/StudentHome';
import { MyClaimsView } from './components/MyClaimsView';
import { InboxView } from './components/InboxView';
import { ItemDetailModal } from './components/ItemDetailModal';
import { ClaimModal } from './components/ClaimModal';
import { ReportFoundModal } from './components/ReportFoundModal';
import { NotifyMeModal } from './components/NotifyMeModal';
import { QRCodeModal } from './components/QRCodeModal';
import { StaffDashboard } from './components/StaffDashboard';
import { StaffInventory } from './components/StaffInventory';
import { StaffClaimsQueue } from './components/StaffClaimsQueue';
import { StaffLogItem } from './components/StaffLogItem';
import { StaffScanCode } from './components/StaffScanCode';
import { AuthModal } from './components/AuthModal';
import { GuideTour, type GuideStep } from './components/GuideTour';
import { CampusMapView } from './components/CampusMapView';
import { LostReportModal, type LostReportDraft } from './components/LostReportModal';
import { MyReportsView } from './components/MyReportsView';
import { MatchesView } from './components/MatchesView';
import { ReturnTagsView } from './components/ReturnTagsView';
import { StaffTimeline } from './components/StaffTimeline';

const GUIDE_KEY = 'foundit.guide.v1';

const STUDENT_GUIDE: GuideStep[] = [
  { selector: '[data-tour="search"]', title: 'Search every desk', body: 'Browse without an account. Filters cover category, building, and how long an item has been waiting.' },
  { selector: '[data-tour="actions"]', title: 'Lost or found', body: 'I lost something files a report. I found something logs an item for the nearest desk. Claims, codes, and return tags live under your profile after you sign in.' },
  { selector: '[data-tour="map"]', title: 'Campus map', body: 'The map in the top right shows which buildings hold items and where the staffed desks are.' },
  { selector: '[data-tour="inbox"]', title: 'Notifications', body: 'Matches, WatCard alerts, approvals, and pickup reminders stay in the inbox.' },
];

type StudentTab = 'explore' | 'reports' | 'matches' | 'tags' | 'map' | 'claims' | 'inbox';
type StaffTab = 'dashboard' | 'inventory' | 'claims' | 'log' | 'scan' | 'map' | 'timeline';

export function FoundItScreen() {
  const { configured, loading, profile, signOut, needsNewPassword } = useAuth();
  const queryClient = useQueryClient();
  const signedIn = profile.isSignedIn;
  const isStaff = profile.role === 'staff' || profile.role === 'admin';
  const [role, setRole] = useState<'student' | 'staff'>('student');
  const [studentTab, setStudentTab] = useState<StudentTab>('explore');
  const [staffTab, setStaffTab] = useState<StaffTab>('dashboard');
  const [staffDesk, setStaffDesk] = useState('All Desks');
  const [authOpen, setAuthOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(() => localStorage.getItem(GUIDE_KEY) !== 'done');
  const [reportFoundOpen, setReportFoundOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [selected, setSelected] = useState<FoundItem | null>(null);
  const [claimItem, setClaimItem] = useState<FoundItem | null>(null);
  const [qr, setQr] = useState({ open: false, code: '', title: '', desk: '' });
  const [scanCode, setScanCode] = useState('');
  const [banner, setBanner] = useState('');

  React.useEffect(() => {
    if (needsNewPassword) setAuthOpen(true);
  }, [needsNewPassword]);

  React.useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('error=')) return;
    const expired = hash.includes('otp_expired') || hash.includes('access_denied');
    setBanner(expired
      ? 'That confirmation link was already used, and it was sent to localhost. Your account is confirmed. Stay on this site and sign in with your email and password.'
      : 'The email link could not be opened. Sign in with your email and password.');
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, []);

  const desks = useQuery({ queryKey: ['desks'], queryFn: fetchDesks, enabled: configured });
  const buildings = useQuery({ queryKey: ['buildings'], queryFn: fetchBuildings, enabled: configured });
  const itemQuery = useQuery({ queryKey: ['items', isStaff], queryFn: () => fetchItems(isStaff), enabled: configured && !loading });
  const claimQuery = useQuery({ queryKey: ['claims'], queryFn: fetchClaims, enabled: signedIn });
  const noteQuery = useQuery({ queryKey: ['notes'], queryFn: fetchNotifications, enabled: signedIn });
  const reportQuery = useQuery({ queryKey: ['reports'], queryFn: fetchReports, enabled: signedIn });
  const matchQuery = useQuery({ queryKey: ['matches'], queryFn: fetchMatches, enabled: signedIn });
  const tagQuery = useQuery({ queryKey: ['tags'], queryFn: fetchTags, enabled: signedIn });
  const timelineQuery = useQuery({ queryKey: ['timeline'], queryFn: fetchTimeline, enabled: configured });

  const refresh = async () => {
    await queryClient.invalidateQueries();
  };

  const items = useMemo(
    () => attachClaims(itemQuery.data ?? [], claimQuery.data ?? [], profile.id ?? '', isStaff),
    [itemQuery.data, claimQuery.data, profile.id, isStaff],
  );
  const studentItems = useMemo(() => items.map(forStudentView), [items]);

  const reminders = useMemo<NotificationItem[]>(() => {
    return items.flatMap((item) => {
      if (item.claim?.claimantId !== profile.id) return [];
      const limit = item.valuable ? 60 : 30;
      const left = limit - item.daysAgo;
      if (left > 5 || left < 0 || item.status === 'picked-up') return [];
      return [{
        id: `reminder-${item.id}`,
        type: 'expiring_soon' as const,
        title: 'Your item leaves soon',
        message: `${studentItemLabel(item)} leaves the desk in ${left} days.`,
        timestamp: 'Today',
        read: false,
        relatedItemId: item.id,
      }];
    });
  }, [items, profile.id]);

  const notifications = [...reminders, ...(noteQuery.data ?? [])];
  const showError = (error: unknown) => setBanner(error instanceof Error ? error.message : 'Something went wrong.');

  const deskIdFor = (name: string) => desks.data?.find((desk) => desk.name === name)?.id ?? desks.data?.[0]?.id ?? '';

  const saveFound = async (draft: Omit<FoundItem, 'id' | 'dateLogged' | 'daysAgo'> & { photoFile?: File | null }) => {
    const valuable = draft.valuable || categoryIsValuable(draft.category);
    const bucket = valuable ? 'private-photos' : 'public-photos';
    const imagePath = draft.photoFile ? await uploadPhoto(draft.photoFile, bucket) : undefined;
    const created = await createFoundItem({
      title: valuable ? draft.publicDescription : draft.title,
      category: draft.category,
      subcategory: draft.subcategory,
      colour: draft.colour,
      brand: draft.brand,
      publicDescription: draft.publicDescription,
      distinctiveFeatures: draft.distinctiveFeatures,
      deskId: deskIdFor(draft.desk),
      valuable,
      storageSpot: draft.storageSpot,
      locationFound: draft.locationFound,
      imagePath,
      imageBucket: imagePath ? bucket : undefined,
      detailedDescription: draft.detailedDescription,
      watcardName: draft.watcardName,
      status: draft.status,
    });
    await refresh();
    const matchedAlert = (matchQuery.data ?? []).some((match) => match.foundItemId === created.id) || false;
    return { item: created, dropOffCode: created.dropOffCode || '', matchedAlert };
  };

  if (!configured) {
    return <main className="max-w-lg mx-auto p-8"><h1 className="text-2xl font-bold">FoundIt needs its database</h1><p className="text-sm mt-2">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart.</p></main>;
  }
  if (loading || desks.isLoading) {
    return <main className="p-8 text-sm">Loading campus desks…</main>;
  }

  const closeGuide = () => {
    localStorage.setItem(GUIDE_KEY, 'done');
    setGuideOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        currentView={role}
        onViewChange={setRole}
        user={profile}
        onToggleSignIn={() => { if (signedIn) void signOut(); else setAuthOpen(true); }}
        unreadCount={notifications.filter((note) => !note.read).length}
        onOpenInbox={() => { setRole('student'); setStudentTab('inbox'); }}
        onOpenMap={() => { setRole('student'); setStudentTab('map'); }}
        activeClaimsCount={items.filter((item) => item.claim?.claimantId === profile.id && item.status !== 'picked-up').length}
        onOpenMyClaims={() => { setRole('student'); setStudentTab('claims'); }}
        onOpenReports={() => { setRole('student'); setStudentTab('reports'); }}
        onOpenTags={() => { setRole('student'); setStudentTab('tags'); }}
        selectedStaffDesk={staffDesk}
        onStaffDeskChange={setStaffDesk}
        onOpenGuide={() => setGuideOpen(true)}
      />
      {banner && <p className="bg-rose-50 text-rose-800 text-xs px-4 py-2">{banner}</p>}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 pb-16">
        {role === 'student' ? (
          <div>
            <TabBar
              tabs={[
                ['explore', 'Search', Compass],
                ['reports', 'Lost reports', FileCheck],
                ['matches', 'Matches', ShieldCheck],
                ['tags', 'Return tags', Tag],
                ['map', 'Map', Map],
                ['claims', 'Claims', FileCheck],
                ['inbox', 'Inbox', Bell],
              ]}
              active={studentTab}
              onChange={(tab) => setStudentTab(tab as StudentTab)}
            />
            {studentTab === 'explore' && (
              <StudentHome
                items={studentItems}
                onSelectItem={setSelected}
                onOpenReportFound={() => signedIn ? setReportFoundOpen(true) : setAuthOpen(true)}
                onOpenLost={() => signedIn ? setLostOpen(true) : setAuthOpen(true)}
                onOpenNotifyMe={() => signedIn ? setLostOpen(true) : setAuthOpen(true)}
              />
            )}
            {studentTab === 'reports' && <MyReportsView reports={reportQuery.data ?? []} matches={matchQuery.data ?? []} onOpenMatches={() => setStudentTab('matches')} />}
            {studentTab === 'matches' && (
              <MatchesView
                matches={matchQuery.data ?? []}
                items={studentItems}
                reports={reportQuery.data ?? []}
                onDecide={async (id, status) => { await setMatchStatus(id, status); await refresh(); }}
                onClaim={setClaimItem}
              />
            )}
            {studentTab === 'tags' && (
              <ReturnTagsView
                tags={tagQuery.data ?? []}
                onCreate={async (label, category, colour) => { await createReturnTag(label, category, colour); await refresh(); }}
                onSimulateScan={async (code) => { await scanReturnTag(code); await refresh(); setBanner('The owner was notified. Their contact details stayed private.'); }}
              />
            )}
            {studentTab === 'map' && <CampusMapView buildings={buildings.data ?? []} desks={desks.data ?? []} items={studentItems} reports={reportQuery.data ?? []} />}
            {studentTab === 'claims' && (
              <MyClaimsView items={studentItems} user={profile} onShowPickupCode={(code, title, desk) => setQr({ open: true, code, title, desk })} onExplore={() => setStudentTab('explore')} onSignIn={() => setAuthOpen(true)} />
            )}
            {studentTab === 'inbox' && (
              <InboxView
                notifications={notifications}
                onMarkAllAsRead={() => { void markNotificationsRead().then(refresh); }}
                onNotificationAction={(note) => {
                  const item = studentItems.find((entry) => entry.id === note.relatedItemId);
                  if (item) setSelected(item);
                }}
                onShowPickupCode={(code, title, desk) => setQr({ open: true, code, title, desk })}
              />
            )}
          </div>
        ) : !isStaff ? (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg">
            <h2 className="text-xl font-bold">Staff desk sign-in</h2>
            <p className="text-sm text-slate-600 mt-2">Student accounts can browse and claim. Desk tools need a staff code for SLC, DC, Dana Porter, PAC, REV, or campus admin.</p>
            <button type="button" className="mt-4 px-4 py-2 rounded-xl bg-slate-950 text-white text-sm font-bold" onClick={() => setAuthOpen(true)}>
              {signedIn ? 'Create a staff account' : 'Sign in'}
            </button>
          </section>
        ) : (
          <div>
            <TabBar
              tabs={[
                ['dashboard', 'Dashboard', LayoutDashboard],
                ['inventory', 'Inventory', Archive],
                ['claims', 'Claims', ShieldCheck],
                ['log', 'Log item', PlusCircle],
                ['scan', 'Scan', Scan],
                ['map', 'Map', Map],
                ['timeline', 'Timeline', FileCheck],
              ]}
              active={staffTab}
              onChange={(tab) => setStaffTab(tab as StaffTab)}
              dark
            />
            {staffTab === 'dashboard' && <StaffDashboard items={items} selectedDesk={staffDesk} onSelectDesk={setStaffDesk} onNavigateTab={setStaffTab} />}
            {staffTab === 'inventory' && <StaffInventory items={items} selectedDesk={staffDesk} onUpdateItemStatus={(id, status, note) => updateItemStatus(id, status, undefined, note).then(refresh).catch(showError)} />}
            {staffTab === 'claims' && (
              <StaffClaimsQueue
                items={items}
                selectedDesk={staffDesk}
                onApproveClaim={(itemId) => {
                  const item = items.find((entry) => entry.id === itemId);
                  const claim = [...(item?.contestedClaims ?? []), item?.claim].find((entry) => entry && (entry.status === 'pending' || entry.status === 'contested'));
                  if (!claim) return;
                  void reviewClaim(claim.id, 'approved', 'Approved at the desk').then(refresh).catch(showError);
                }}
                onRejectClaim={(itemId, reason) => {
                  const item = items.find((entry) => entry.id === itemId);
                  const claim = [...(item?.contestedClaims ?? []), item?.claim].find((entry) => entry && entry.status !== 'rejected' && entry.status !== 'completed');
                  if (!claim) return;
                  void reviewClaim(claim.id, 'rejected', reason).then(refresh).catch(showError);
                }}
              />
            )}
            {staffTab === 'log' && (
              <StaffLogItem
                selectedDesk={profile.deskName ?? staffDesk}
                onItemLogged={async (item) => {
                  const result = await saveFound(item);
                  const matchedWatcard = Boolean(item.watcardName);
                  return { matchedAlert: result.matchedAlert, matchedWatcard };
                }}
              />
            )}
            {staffTab === 'scan' && (
              <StaffScanCode
                items={items}
                initialCode={scanCode}
                onCompletePickup={(id) => updateItemStatus(id, 'picked-up').then(refresh).catch(showError)}
                onAcceptDropOff={(id, spot) => updateItemStatus(id, 'available', spot).then(refresh).catch(showError)}
                onScanReturnTag={async (code) => { await scanReturnTag(code); await refresh(); }}
              />
            )}
            {staffTab === 'map' && <CampusMapView buildings={buildings.data ?? []} desks={desks.data ?? []} items={items} reports={reportQuery.data ?? []} />}
            {staffTab === 'timeline' && <StaffTimeline events={timelineQuery.data ?? []} />}
          </div>
        )}
      </main>

      <ItemDetailModal
        item={selected}
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        onClaimItem={(item) => { setSelected(null); setClaimItem(item); }}
        user={profile}
        timeline={(timelineQuery.data ?? []).filter((event) => event.itemId === selected?.id && (role === 'staff' || event.visibility === 'public'))}
      />
      <ClaimModal
        item={claimItem}
        isOpen={Boolean(claimItem)}
        onClose={() => setClaimItem(null)}
        user={profile}
        onSignIn={() => setAuthOpen(true)}
        onSubmitClaim={async (item, data) => {
          const claim = await createClaim(item.id, data.verificationAnswer, data.distinguishingDetail);
          await refresh();
          return { pickupCode: claim.pickupCode };
        }}
        onShowPickupCode={(code, title, desk) => setQr({ open: true, code, title, desk })}
      />
      <ReportFoundModal
        isOpen={reportFoundOpen}
        onClose={() => setReportFoundOpen(false)}
        onSubmitReport={async (draft) => {
          const nearest = getNearestDesk(draft.locationFound || draft.desk);
          return saveFound({ ...draft, desk: draft.desk || nearest.desk, status: 'in-transit' });
        }}
      />
      <NotifyMeModal
        isOpen={notifyOpen}
        onClose={() => setNotifyOpen(false)}
        initialCategory="all"
        initialSearchQuery=""
        onSaveAlert={async (alert) => {
          await createLostReport({
            title: alert.brandOrKeyword || `${alert.colour} ${alert.category}`,
            category: alert.category as Category,
            colour: alert.colour || 'Unknown',
            brand: alert.brandOrKeyword,
            description: alert.brandOrKeyword || alert.category,
            building: alert.locationLost || 'Campus',
            lostAt: new Date(alert.dateLost).toISOString(),
          });
          await refresh();
        }}
      />
      <LostReportModal
        isOpen={lostOpen}
        onClose={() => setLostOpen(false)}
        onSubmit={async (draft: LostReportDraft) => {
          const imagePath = draft.photo ? await uploadPhoto(draft.photo, 'private-photos') : undefined;
          await createLostReport({ ...draft, lostAt: new Date(draft.lostAt).toISOString(), imagePath });
          await refresh();
          setStudentTab('reports');
        }}
      />
      <QRCodeModal
        isOpen={qr.open}
        onClose={() => setQr((current) => ({ ...current, open: false }))}
        code={qr.code}
        itemTitle={qr.title}
        deskName={qr.desk}
        onSimulateStaffScan={() => { setScanCode(qr.code); setRole('staff'); setStaffTab('scan'); }}
      />
      {needsNewPassword && !authOpen && (
        <button type="button" onClick={() => setAuthOpen(true)} className="fixed bottom-4 right-4 z-40 px-4 py-2 rounded-xl bg-slate-950 text-white text-xs font-bold shadow-lg">
          Choose a new password
        </button>
      )}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} choosingNewPassword={needsNewPassword} initialStaff={role === 'staff'} />
      <GuideTour open={guideOpen && role === 'student'} steps={STUDENT_GUIDE} onClose={closeGuide} />
    </div>
  );
}

function TabBar({
  tabs,
  active,
  onChange,
  dark = false,
}: {
  tabs: Array<[string, string, React.ComponentType<{ className?: string }>]>;
  active: string;
  onChange: (tab: string) => void;
  dark?: boolean;
}) {
  return (
    <div className="grid grid-cols-7 gap-1 mb-5 w-full p-1.5 bg-white rounded-2xl border border-slate-200">
      {tabs.map(([id, label, Icon]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`min-w-0 py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl flex items-center justify-center gap-1 text-center ${active === id ? (dark ? 'bg-slate-950 text-white' : 'bg-amber-400 text-slate-950') : 'text-slate-600'}`}
        >
          <Icon className="w-3.5 h-3.5 shrink-0 hidden sm:block" />
          <span className="truncate">{label}</span>
        </button>
      ))}
    </div>
  );
}

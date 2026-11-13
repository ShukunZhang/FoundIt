import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Compass, FileCheck, LayoutDashboard, Map, PlusCircle, QrCode, Scan, ShieldCheck, Tag } from 'lucide-react';
import { useAuth } from './context/AuthProvider';
import { categoryIsValuable } from './lib/categories';
import {
  completePickup,
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
  withdrawClaim,
  scanReturnTag,
  setMatchStatus,
  updateItemStatus,
  uploadPhoto,
} from './lib/db';
import { attachClaims } from './lib/mappers';
import { describeForMatch, rememberEmbedding } from './lib/embed';
import { forStudentView, studentItemLabel } from './lib/studentView';
import { getNearestDesk } from './mockData';
import type { Category, FoundItem, NotificationItem } from './types';
import { Navbar } from './components/Navbar';
import { StudentHome } from './components/StudentHome';
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
import { ReturnTagsView } from './components/ReturnTagsView';
import { StaffTimeline } from './components/StaffTimeline';
import { MyItemsView, type MineSection } from './components/MyItemsView';
import { PickupCodesView } from './components/PickupCodesView';
import { useClaimAlerts } from './hooks/useClaimAlerts';

const GUIDE_KEY = 'foundit.guide.v1';

const STUDENT_GUIDE: GuideStep[] = [
  { selector: '[data-tour="search"]', title: 'Search every desk', body: 'Browse without an account. Filters cover category, building, and how long an item has been waiting.' },
  { selector: '[data-tour="actions"]', title: 'Lost or found', body: 'I lost something files a report. I found something logs an item for the nearest desk. Lost reports, matches, return tags, and claims live under your profile after you sign in.' },
  { selector: '[data-tour="map"]', title: 'Campus map', body: 'The Map tab shows which desks are holding items and where to pick them up.' },
  { selector: '[data-tour="inbox"]', title: 'Notifications', body: 'The bell keeps matches, WatCard alerts, approvals, and pickup reminders.' },
];

type StudentTab = 'explore' | 'mine' | 'codes' | 'tags' | 'map';
type StaffTab = 'dashboard' | 'inventory' | 'claims' | 'log' | 'scan' | 'map' | 'timeline';

export function FoundItScreen() {
  const { configured, loading, profile, signOut, needsNewPassword } = useAuth();
  const queryClient = useQueryClient();
  const signedIn = profile.isSignedIn;
  const isStaff = profile.role === 'staff' || profile.role === 'admin';
  const [studentTab, setStudentTab] = useState<StudentTab>('explore');
  const [mineSection, setMineSection] = useState<MineSection>('reports');
  const [staffTab, setStaffTab] = useState<StaffTab>('dashboard');
  const [staffDesk, setStaffDesk] = useState('All Desks');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [authAudience, setAuthAudience] = useState<'student' | 'staff'>('student');
  const [guideOpen, setGuideOpen] = useState(() => localStorage.getItem(GUIDE_KEY) !== 'done');
  const [reportFoundOpen, setReportFoundOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [selected, setSelected] = useState<FoundItem | null>(null);
  const [claimItem, setClaimItem] = useState<FoundItem | null>(null);
  const [qr, setQr] = useState({ open: false, code: '', title: '', desk: '', claimId: '' });
  const [scanCode, setScanCode] = useState('');
  const [banner, setBanner] = useState('');
  const [pickupNotice, setPickupNotice] = useState<{ code: string; message: string } | null>(null);

  React.useEffect(() => {
    if (needsNewPassword) setAuthOpen(true);
  }, [needsNewPassword]);

  React.useEffect(() => {
    if (!signedIn && (studentTab === 'mine' || studentTab === 'codes')) setStudentTab('explore');
  }, [signedIn, studentTab]);

  const openWatIam = () => {
    setAuthAudience('student');
    setAuthMode('sign-in');
    setAuthOpen(true);
  };

  const openStaffAuth = () => {
    setAuthAudience('staff');
    setAuthMode('sign-in');
    setAuthOpen(true);
  };

  const openMine = (section: MineSection) => {
    if (!profile.isSignedIn) {
      openWatIam();
      return;
    }
    setMineSection(section);
    setStudentTab('mine');
  };

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
  const matchQuery = useQuery({
    queryKey: ['matches', profile.id],
    queryFn: fetchMatches,
    enabled: signedIn && Boolean(profile.id),
  });
  const tagQuery = useQuery({ queryKey: ['tags'], queryFn: fetchTags, enabled: signedIn });
  const timelineQuery = useQuery({ queryKey: ['timeline'], queryFn: fetchTimeline, enabled: configured });
  useClaimAlerts(signedIn ? profile.id : undefined, setPickupNotice);

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

  const openPickup = (code: string, title: string, desk: string) => {
    const claim = (claimQuery.data ?? []).find((entry) => entry.pickupCode === code && entry.claimantId === profile.id && entry.status !== 'withdrawn' && entry.status !== 'rejected');
    setQr({ open: true, code, title, desk, claimId: claim?.id ?? '' });
  };

  const cancelWrongClaim = async (claimId: string) => {
    await withdrawClaim(claimId);
    await refresh();
    setQr((current) => ({ ...current, open: false }));
    setBanner('Claim cancelled. The item stays at the desk, and your lost report is still active.');
  };

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
    await rememberEmbedding('found', created.id, {
      file: draft.photoFile,
      text: describeForMatch([
        draft.title,
        draft.category,
        draft.subcategory,
        draft.colour,
        draft.brand,
        draft.publicDescription,
        draft.distinctiveFeatures,
        draft.locationFound,
      ]),
    }).catch(() => undefined);
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
        currentView={isStaff ? 'staff' : 'student'}
        user={profile}
        onToggleSignIn={() => {
          if (signedIn) {
            void signOut();
            setStudentTab('explore');
          } else {
            openWatIam();
          }
        }}
        onGoHome={() => {
          if (isStaff) setStaffTab('dashboard');
          else setStudentTab('explore');
        }}
        unreadCount={notifications.filter((note) => !note.read).length}
        onOpenInbox={() => openMine('inbox')}
        onOpenMap={() => setStudentTab('map')}
        activeClaimsCount={items.filter((item) => {
          const claim = item.claim;
          return Boolean(claim && claim.claimantId === profile.id && claim.status !== 'completed' && claim.status !== 'rejected' && claim.status !== 'withdrawn' && item.status !== 'picked-up' && item.status !== 'donated');
        }).length}
        pendingMatchCount={signedIn && profile.id ? (matchQuery.data ?? []).filter((match) => match.status === 'pending').length : 0}
        onOpenMyClaims={() => setStudentTab('codes')}
        onOpenReports={() => openMine('reports')}
        onOpenMatches={() => openMine('matches')}
        onOpenTags={() => setStudentTab('tags')}
        onOpenStaffSignIn={openStaffAuth}
        selectedStaffDesk={staffDesk}
        onStaffDeskChange={setStaffDesk}
        onOpenGuide={() => setGuideOpen(true)}
      />
      {banner && <p className="bg-rose-50 text-rose-800 text-xs px-4 py-2">{banner}</p>}
      {pickupNotice && (
        <button
          type="button"
          onClick={() => {
            if (!isStaff) setStudentTab('codes');
            openPickup(pickupNotice.code, 'Your item', 'the desk');
            setPickupNotice(null);
          }}
          className="bg-emerald-50 text-emerald-900 text-xs px-4 py-2 text-left font-semibold"
        >
          {pickupNotice.message} Tap to show the code.
        </button>
      )}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 ${isStaff ? 'pb-16' : 'pb-24 sm:pb-16'}`}>
        {!isStaff ? (
          <div>
            <TabBar
              dock
              tabs={[
                ['explore', 'Search', Compass],
                ...(signedIn ? [['mine', 'My items', FileCheck] as [string, string, typeof Compass]] : []),
                ...(signedIn ? [['codes', 'Codes', QrCode] as [string, string, typeof Compass]] : []),
                ['tags', 'Return tags', Tag],
                ['map', 'Map', Map, 'map'],
              ]}
              active={studentTab}
              onChange={(tab) => setStudentTab(tab as StudentTab)}
            />
            {studentTab === 'explore' && (
              <StudentHome
                items={studentItems}
                onSelectItem={setSelected}
                onOpenReportFound={() => signedIn ? setReportFoundOpen(true) : openWatIam()}
                onOpenLost={() => signedIn ? setLostOpen(true) : openWatIam()}
                onOpenNotifyMe={() => signedIn ? setLostOpen(true) : openWatIam()}
              />
            )}
            {studentTab === 'mine' && signedIn && (
              <MyItemsView
                section={mineSection}
                onSection={setMineSection}
                reports={reportQuery.data ?? []}
                matches={matchQuery.data ?? []}
                items={studentItems}
                user={profile}
                notifications={notifications}
                unreadCount={notifications.filter((note) => !note.read).length}
                onDecide={async (id, status) => { await setMatchStatus(id, status); await refresh(); }}
                onClaim={setClaimItem}
                onShowPickupCode={openPickup}
                onExplore={() => setStudentTab('explore')}
                onSignIn={openWatIam}
                onMarkAllAsRead={() => { void markNotificationsRead().then(refresh); }}
                onNotificationAction={(note) => {
                  if (note.pickupCode) {
                    const item = studentItems.find((entry) => entry.id === note.relatedItemId);
                    openPickup(note.pickupCode, item ? studentItemLabel(item) : note.title, item?.desk ?? 'the desk');
                    setStudentTab('codes');
                    return;
                  }
                  const item = studentItems.find((entry) => entry.id === note.relatedItemId);
                  if (item) setSelected(item);
                }}
              />
            )}
            {studentTab === 'codes' && signedIn && (
              <PickupCodesView
                claims={claimQuery.data ?? []}
                items={studentItems}
                userId={profile.id ?? ''}
                onShowPickupCode={openPickup}
                onWrongClaim={cancelWrongClaim}
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
          </div>
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
            {staffTab === 'inventory' && <StaffInventory items={items} selectedDesk={staffDesk} onUpdateItemStatus={(id, status, note) => {
              const task = status === 'picked-up' ? completePickup(id) : updateItemStatus(id, status, undefined, note);
              void task.then(refresh).catch(showError);
            }} />}
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
                onCompletePickup={async (id) => { await completePickup(id); await refresh(); }}
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
        timeline={(timelineQuery.data ?? []).filter((event) => event.itemId === selected?.id && (isStaff || event.visibility === 'public'))}
      />
      <ClaimModal
        item={claimItem}
        isOpen={Boolean(claimItem)}
        onClose={() => setClaimItem(null)}
        user={profile}
        onSignIn={openWatIam}
        onSubmitClaim={async (item, data) => {
          const claim = await createClaim(item.id, data.verificationAnswer, data.distinguishingDetail);
          await refresh();
          return { pickupCode: claim.pickupCode };
        }}
        onShowPickupCode={openPickup}
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
          const title = alert.brandOrKeyword || `${alert.colour} ${alert.category}`;
          const description = alert.brandOrKeyword || alert.category;
          const created = await createLostReport({
            title,
            category: alert.category as Category,
            colour: alert.colour || 'Unknown',
            brand: alert.brandOrKeyword,
            description,
            building: alert.locationLost || 'Campus',
            lostAt: new Date(alert.dateLost).toISOString(),
          });
          await rememberEmbedding('lost', created.id, {
            text: describeForMatch([title, alert.colour, alert.category, alert.brandOrKeyword, alert.locationLost, description]),
          }).catch(() => undefined);
          await refresh();
        }}
      />
      <LostReportModal
        isOpen={lostOpen}
        onClose={() => setLostOpen(false)}
        onSubmit={async (draft: LostReportDraft) => {
          const imagePath = draft.photo ? await uploadPhoto(draft.photo, 'private-photos') : undefined;
          const parsedLostAt = draft.lostAt ? new Date(draft.lostAt) : new Date();
          const colour = draft.colour.trim();
          const description = draft.description.trim() || draft.title.trim();
          const building = draft.building.trim();
          const created = await createLostReport({
            ...draft,
            colour,
            description,
            building,
            lostAt: Number.isNaN(parsedLostAt.getTime()) ? new Date().toISOString() : parsedLostAt.toISOString(),
            imagePath,
          });
          await rememberEmbedding('lost', created.id, {
            file: draft.photo,
            text: describeForMatch([
              draft.title,
              draft.category,
              draft.subcategory,
              colour,
              draft.brand,
              description,
              draft.distinctiveFeatures,
              building,
              draft.locationDetail,
            ]),
          }).catch(() => undefined);
          await refresh();
          setMineSection('reports');
          setStudentTab('mine');
        }}
      />
      <QRCodeModal
        isOpen={qr.open}
        onClose={() => setQr((current) => ({ ...current, open: false }))}
        code={qr.code}
        itemTitle={qr.title}
        deskName={qr.desk}
        onSimulateStaffScan={isStaff ? () => { setScanCode(qr.code); setStaffTab('scan'); } : undefined}
        onWrongClaim={qr.claimId ? () => cancelWrongClaim(qr.claimId) : undefined}
      />
      {needsNewPassword && !authOpen && (
        <button type="button" onClick={() => setAuthOpen(true)} className="fixed bottom-20 right-4 z-40 px-4 py-2 rounded-xl bg-slate-950 text-white text-xs font-bold shadow-lg sm:bottom-4">
          Choose a new password
        </button>
      )}
      <AuthModal key={`${authMode}-${authAudience}`} isOpen={authOpen} onClose={() => setAuthOpen(false)} choosingNewPassword={needsNewPassword} initialMode={authMode} audience={authAudience} />
      <GuideTour open={guideOpen && !isStaff} steps={STUDENT_GUIDE} onClose={closeGuide} />
    </div>
  );
}

function TabBar({
  tabs,
  active,
  onChange,
  dark = false,
  dock = false,
}: {
  tabs: Array<[string, string, React.ComponentType<{ className?: string }>, string?]>;
  active: string;
  onChange: (tab: string) => void;
  dark?: boolean;
  dock?: boolean;
}) {
  const columns = tabs.length === 5 ? 'grid-cols-5' : tabs.length === 4 ? 'grid-cols-4' : tabs.length === 3 ? 'grid-cols-3' : 'grid-cols-7';
  return (
    <div className={dock
      ? `fixed bottom-0 inset-x-0 z-40 grid ${columns} border-t border-slate-200 bg-white px-1 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))] sm:static sm:z-auto sm:mb-5 sm:rounded-2xl sm:border sm:p-1.5`
      : `grid ${columns} gap-1 mb-5 w-full p-1.5 bg-white rounded-2xl border border-slate-200`}>
      {tabs.map(([id, label, Icon, tour]) => (
        <button
          key={id}
          type="button"
          data-tour={tour}
          onClick={() => onChange(id)}
          className={`min-w-0 py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 text-center leading-tight ${active === id ? (dark ? 'bg-slate-950 text-white' : 'bg-amber-400 text-slate-950') : 'text-slate-600'}`}
        >
          <Icon className={`w-4 h-4 shrink-0 ${dock ? '' : 'hidden sm:block'}`} />
          <span className={dock ? '' : 'truncate'}>{label}</span>
        </button>
      ))}
    </div>
  );
}

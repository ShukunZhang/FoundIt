import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Compass, FileCheck, LayoutDashboard, Package, PlusCircle, Scan, Tag } from 'lucide-react';
import { useAuth } from './context/AuthProvider';
import { categoryIsValuable } from './lib/categories';
import {
  archiveFoundItem,
  createFoundItem,
  createLostReport,
  createReturnTag,
  fetchDesks,
  fetchItems,
  fetchMatches,
  fetchNotifications,
  fetchReports,
  fetchTags,
  markNotificationsRead,
  scanReturnTag,
  setMatchStatus,
  uploadPhoto,
} from './lib/db';
import { describeForMatch, rememberEmbedding } from './lib/embed';
import { forStudentView } from './lib/studentView';
import type { FoundItem } from './types';
import { Navbar } from './components/Navbar';
import { StudentHome } from './components/StudentHome';
import { ItemDetailModal } from './components/ItemDetailModal';
import { StaffDashboard } from './components/StaffDashboard';
import { StaffInventory } from './components/StaffInventory';
import { StaffLogItem } from './components/StaffLogItem';
import { StaffHandoff } from './components/StaffScanCode';
import { StaffArchive } from './components/StaffArchive';
import { AuthModal } from './components/AuthModal';
import { GuideTour, type GuideStep } from './components/GuideTour';
import { LostReportModal, type LostReportDraft } from './components/LostReportModal';
import { ReturnTagsView } from './components/ReturnTagsView';
import { MyItemsView, type MineSection } from './components/MyItemsView';

const GUIDE_KEY = 'foundit.guide.v2';

const STUDENT_GUIDE: GuideStep[] = [
  { selector: '[data-tour="search"]', title: 'Search every desk', body: 'Browse what staff have logged. Valuable covers keys, WatCards, electronics, and wallets.' },
  { selector: '[data-tour="actions"]', title: 'Go to the desk', body: 'Open an item, note its code, and go to that desk. Show the code and your WATID. Staff check the ID and hand the item over. There is no claim to file.' },
  { selector: '[data-tour="inbox"]', title: 'Notifications', body: 'The bell keeps match alerts and WatCard notices.' },
];

type StudentTab = 'explore' | 'mine' | 'tags';
type StaffTab = 'dashboard' | 'inventory' | 'archive' | 'log' | 'handoff';

export function FoundItScreen() {
  const { configured, loading, profile, signOut, needsNewPassword } = useAuth();
  const queryClient = useQueryClient();
  const signedIn = profile.isSignedIn;
  const isStaff = profile.role === 'staff' || profile.role === 'admin';
  const [studentTab, setStudentTab] = useState<StudentTab>('explore');
  const [mineSection, setMineSection] = useState<MineSection>('reports');
  const [staffTab, setStaffTab] = useState<StaffTab>('dashboard');
  const [staffDesk, setStaffDesk] = useState(profile.deskName || 'All Desks');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [authAudience, setAuthAudience] = useState<'student' | 'staff'>('student');
  const [guideOpen, setGuideOpen] = useState(() => localStorage.getItem(GUIDE_KEY) !== 'done');
  const [lostOpen, setLostOpen] = useState(false);
  const [selected, setSelected] = useState<FoundItem | null>(null);
  const [banner, setBanner] = useState('');

  React.useEffect(() => {
    if (needsNewPassword) setAuthOpen(true);
  }, [needsNewPassword]);

  React.useEffect(() => {
    if (!signedIn && studentTab === 'mine') setStudentTab('explore');
  }, [signedIn, studentTab]);

  React.useEffect(() => {
    if (profile.deskName) setStaffDesk(profile.deskName);
  }, [profile.deskName]);

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
      ? 'That confirmation link was already used. Your account is confirmed. Sign in with your email and password.'
      : 'The email link could not be opened. Sign in with your email and password.');
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, []);

  const desks = useQuery({ queryKey: ['desks'], queryFn: fetchDesks, enabled: configured });
  const itemQuery = useQuery({ queryKey: ['items', isStaff], queryFn: () => fetchItems(isStaff), enabled: configured && !loading });
  const noteQuery = useQuery({ queryKey: ['notes'], queryFn: fetchNotifications, enabled: signedIn });
  const reportQuery = useQuery({ queryKey: ['reports'], queryFn: fetchReports, enabled: signedIn });
  const matchQuery = useQuery({
    queryKey: ['matches', profile.id],
    queryFn: fetchMatches,
    enabled: signedIn && Boolean(profile.id),
  });
  const tagQuery = useQuery({ queryKey: ['tags'], queryFn: fetchTags, enabled: signedIn });

  const refresh = async () => {
    await queryClient.invalidateQueries();
  };

  const items = itemQuery.data ?? [];
  const studentItems = useMemo(
    () => items.filter((item) => !item.archivedAt).map(forStudentView),
    [items],
  );
  const notifications = noteQuery.data ?? [];

  const deskIdFor = (name: string) => desks.data?.find((desk) => desk.name === name)?.id ?? profile.deskId ?? desks.data?.[0]?.id ?? '';

  const saveFound = async (draft: Omit<FoundItem, 'id' | 'dateLogged' | 'daysAgo'> & { photoFile?: File | null }) => {
    const valuable = draft.valuable || categoryIsValuable(draft.category);
    const imagePath = draft.photoFile ? await uploadPhoto(draft.photoFile, 'public-photos') : undefined;
    const created = await createFoundItem({
      title: draft.title,
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
      imageBucket: imagePath ? 'public-photos' : undefined,
      detailedDescription: draft.detailedDescription,
      watcardName: draft.watcardName,
    });
    await rememberEmbedding('found', created.id, {
      file: draft.photoFile,
      text: describeForMatch([
        draft.title,
        draft.category,
        draft.colour,
        draft.publicDescription,
        draft.locationFound,
      ]),
    }).catch(() => undefined);
    await refresh();
    return created;
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
        pendingMatchCount={signedIn && profile.id ? (matchQuery.data ?? []).filter((match) => match.status === 'pending').length : 0}
        onOpenReports={() => openMine('reports')}
        onOpenMatches={() => openMine('matches')}
        onOpenTags={() => setStudentTab('tags')}
        onOpenStaffSignIn={openStaffAuth}
        selectedStaffDesk={staffDesk}
        onStaffDeskChange={setStaffDesk}
        onOpenGuide={() => setGuideOpen(true)}
      />
      {banner && <p className="bg-rose-50 text-rose-800 text-xs px-4 py-2">{banner}</p>}
      {itemQuery.isError && (
        <p className="bg-rose-50 text-rose-800 text-xs px-4 py-2">
          Items could not be loaded. Apply the latest database migration if item codes are not in the database yet.
        </p>
      )}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 ${isStaff ? 'pb-16' : 'pb-24 sm:pb-16'}`}>
        {!isStaff ? (
          <div>
            <TabBar
              dock
              tabs={[
                ['explore', 'Search', Compass],
                ...(signedIn ? [['mine', 'My items', FileCheck] as [string, string, typeof Compass]] : []),
                ['tags', 'Return tags', Tag],
              ]}
              active={studentTab}
              onChange={(tab) => setStudentTab(tab as StudentTab)}
            />
            {studentTab === 'explore' && (
              <StudentHome
                items={studentItems}
                onSelectItem={setSelected}
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
                notifications={notifications}
                unreadCount={notifications.filter((note) => !note.read).length}
                onDecide={async (id, status) => { await setMatchStatus(id, status); await refresh(); }}
                onMarkAllAsRead={() => { void markNotificationsRead().then(refresh); }}
                onNotificationAction={(note) => {
                  const item = studentItems.find((entry) => entry.id === note.relatedItemId);
                  if (item) setSelected(item);
                }}
              />
            )}
            {studentTab === 'tags' && (
              <ReturnTagsView
                tags={tagQuery.data ?? []}
                onCreate={async (label, category, colour) => { await createReturnTag(label, category, colour); await refresh(); }}
                onSimulateScan={async (code) => { await scanReturnTag(code); await refresh(); setBanner('The owner was notified. Their contact details stayed private.'); }}
              />
            )}
          </div>
        ) : (
          <div>
            <TabBar
              tabs={[
                ['dashboard', 'Dashboard', LayoutDashboard],
                ['inventory', 'At desk', Package],
                ['archive', 'Archive', Archive],
                ['log', 'Log item', PlusCircle],
                ['handoff', 'Hand over', Scan],
              ]}
              active={staffTab}
              onChange={(tab) => setStaffTab(tab as StaffTab)}
              dark
            />
            {staffTab === 'dashboard' && (
              <StaffDashboard items={items} selectedDesk={staffDesk} onSelectDesk={setStaffDesk} onNavigateTab={setStaffTab} />
            )}
            {staffTab === 'inventory' && <StaffInventory items={items} selectedDesk={staffDesk} />}
            {staffTab === 'archive' && <StaffArchive items={items} selectedDesk={staffDesk} />}
            {staffTab === 'log' && (
              <StaffLogItem
                selectedDesk={profile.deskName || staffDesk}
                staffName={profile.name}
                onItemLogged={async (item) => {
                  const created = await saveFound(item);
                  return { itemCode: created.itemCode || '' };
                }}
              />
            )}
            {staffTab === 'handoff' && (
              <StaffHandoff
                items={items}
                onArchive={async (code, watid) => {
                  await archiveFoundItem(code, watid);
                  await refresh();
                }}
              />
            )}
          </div>
        )}
      </main>

      <ItemDetailModal
        item={selected}
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        user={profile}
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
              colour,
              description,
              draft.distinctiveFeatures,
              building,
            ]),
          }).catch(() => undefined);
          await refresh();
          setMineSection('reports');
          setStudentTab('mine');
        }}
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
  return (
    <div
      className={dock
        ? 'fixed bottom-0 inset-x-0 z-40 grid border-t border-slate-200 bg-white px-1 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))] sm:static sm:z-auto sm:mb-5 sm:rounded-2xl sm:border sm:p-1.5'
        : 'grid gap-1 mb-5 w-full p-1.5 bg-white rounded-2xl border border-slate-200'}
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
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

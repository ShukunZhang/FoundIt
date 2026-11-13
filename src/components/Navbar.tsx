import React from 'react';
import { Shield, Bell, Tag, FileCheck, LogOut, LogIn, ChevronDown, Menu, X } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  currentView: 'student' | 'staff';
  onViewChange: (view: 'student' | 'staff') => void;
  user: UserProfile;
  onToggleSignIn: () => void;
  unreadCount: number;
  onOpenInbox: () => void;
  onOpenMap: () => void;
  activeClaimsCount: number;
  onOpenMyClaims: () => void;
  onOpenReports: () => void;
  onOpenTags: () => void;
  selectedStaffDesk?: string;
  onStaffDeskChange?: (desk: string) => void;
  onOpenGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  user,
  onToggleSignIn,
  unreadCount,
  onOpenInbox,
  onOpenMap,
  activeClaimsCount,
  onOpenMyClaims,
  onOpenReports,
  onOpenTags,
  selectedStaffDesk,
  onStaffDeskChange,
  onOpenGuide,
}) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [mobileMenu, setMobileMenu] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center shadow-xs">
              <span className="font-black text-amber-400 text-sm tracking-tight">F</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-950">FoundIt</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                  UW
                </span>
              </div>
            </div>
          </div>

          {/* Central Role Toggle (Student vs Staff) */}
          <div data-tour="role" className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => onViewChange('student')}
              className={`px-2.5 sm:px-3.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                currentView === 'student'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student view
            </button>
            <button
              onClick={() => onViewChange('staff')}
              className={`px-2.5 sm:px-3.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                currentView === 'staff'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3 h-3 text-amber-400" />
              <span>Staff view</span>
            </button>
          </div>

          {/* Right Action Zone: Inbox & UW Sign-In */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Student Notifications (Inbox) */}
            {onOpenGuide && (
              <button type="button" onClick={onOpenGuide} className="hidden sm:inline px-2 py-1 text-[11px] font-bold rounded-lg text-slate-700 hover:bg-slate-100">
                Guide
              </button>
            )}
            <button
              data-tour="inbox"
              onClick={onOpenInbox}
              className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              title="Notifications Inbox"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Fake UW Sign-In / User Profile Button */}
            <div className="relative hidden sm:block">
              {user.isSignedIn ? (
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 sm:gap-2 pl-2 pr-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-slate-900 hover:bg-amber-100 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-[11px] font-bold text-slate-950">
                    {user.name.slice(0, 2).toUpperCase() || 'UW'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold leading-tight text-slate-900">{user.name}</p>
                    <p className="text-[10px] text-slate-500 leading-tight">{user.email}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>
              ) : (
                <button
                  onClick={onToggleSignIn}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sign in with WatIAM</span>
                </button>
              )}

              {/* User Dropdown */}
              {showUserMenu && user.isSignedIn && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-40 animate-fade-in text-xs">
                    <div className="pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-xs font-bold text-slate-950">
                          LL
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <p className="text-[11px] text-slate-500">{user.role === 'student' ? `ID: ${user.studentId || 'student'}` : user.role}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{user.email}</p>
                      <div className="mt-2 bg-slate-50 p-2 rounded-lg text-[11px] text-slate-600 flex justify-between items-center">
                        <span>Weekly Instant Claims:</span>
                        <span className="font-semibold text-slate-900">
                          {user.maxWeeklyInstantClaims - user.claimsUsedThisWeek} of {user.maxWeeklyInstantClaims} left
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 space-y-1">
                      <button
                        onClick={() => {
                          onOpenReports();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-1.5"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>My lost reports</span>
                      </button>

                      <button
                        onClick={() => {
                          onOpenTags();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-1.5"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>Return tags</span>
                      </button>

                      <button
                        onClick={() => {
                          onOpenMyClaims();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-medium flex items-center justify-between"
                      >
                        <span>My claims & codes</span>
                        <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">
                          {activeClaimsCount} active
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          onToggleSignIn();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 font-medium flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              className="sm:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
              aria-label="Open menu"
              onClick={() => setMobileMenu(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      {mobileMenu && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-3 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-900">Menu</p>
            <button type="button" aria-label="Close menu" onClick={() => setMobileMenu(false)} className="p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { onViewChange('student'); setMobileMenu(false); }} className={`py-2 rounded-xl text-xs font-bold ${currentView === 'student' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'}`}>Student view</button>
            <button type="button" onClick={() => { onViewChange('staff'); setMobileMenu(false); }} className={`py-2 rounded-xl text-xs font-bold ${currentView === 'staff' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'}`}>Staff view</button>
          </div>
          <button type="button" onClick={() => { onOpenMap(); setMobileMenu(false); }} className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100">Campus map</button>
          {onOpenGuide && (
            <button type="button" onClick={() => { onOpenGuide(); setMobileMenu(false); }} className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100">Guide</button>
          )}
          {user.isSignedIn ? (
            <div className="space-y-1">
              <button type="button" onClick={() => { onOpenReports(); setMobileMenu(false); }} className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"><FileCheck className="w-3.5 h-3.5" /> My lost reports</button>
              <button type="button" onClick={() => { onOpenTags(); setMobileMenu(false); }} className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Return tags</button>
              <button type="button" onClick={() => { onOpenMyClaims(); setMobileMenu(false); }} className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100">My claims & codes</button>
              <button type="button" onClick={() => { onToggleSignIn(); setMobileMenu(false); }} className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5" /> Sign out</button>
            </div>
          ) : (
            <button type="button" onClick={() => { onToggleSignIn(); setMobileMenu(false); }} className="w-full py-2.5 rounded-xl bg-slate-950 text-white text-xs font-bold flex items-center justify-center gap-1.5">
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              Sign in with WatIAM
            </button>
          )}
        </div>
      )}
    </header>
  );
};

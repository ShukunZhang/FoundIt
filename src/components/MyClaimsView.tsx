import React from 'react';
import { 
  ShieldCheck, 
  Clock, 
  MapPin, 
  QrCode, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Package
} from 'lucide-react';
import { FoundItem, UserProfile } from '../types';
import { CAMPUS_DESKS } from '../mockData';
import { studentItemLabel } from '../lib/studentView';

interface MyClaimsViewProps {
  items: FoundItem[];
  user: UserProfile;
  onShowPickupCode: (code: string, itemTitle: string, deskName: string) => void;
  onExplore: () => void;
  onSignIn: () => void;
}

export const MyClaimsView: React.FC<MyClaimsViewProps> = ({
  items,
  user,
  onShowPickupCode,
  onExplore,
  onSignIn,
}) => {
  // Filter items where claim claimant matches Lily Lu or current user
  const claimedItems = items.filter(
    (item) => item.claim && item.claim.claimantId === user.id
  );

  const activeClaims = claimedItems.filter(
    (item) => item.status === 'reserved' || item.status === 'under-review' || item.status === 'ready-pickup'
  );

  const completedClaims = claimedItems.filter((item) => item.status === 'picked-up');

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 animate-fade-in">
      {/* Top Banner with Quota */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">My Campus Claims</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track held items, view active pickup codes, and monitor staff verification reviews.
          </p>
        </div>

        {user.isSignedIn ? (
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 shrink-0 text-right">
            <span className="text-[11px] font-semibold text-slate-600 block">Weekly Quota</span>
            <span className="text-sm font-bold text-slate-950">
              {user.maxWeeklyInstantClaims - user.claimsUsedThisWeek} of {user.maxWeeklyInstantClaims} Instant Claims left
            </span>
          </div>
        ) : (
          <button
            onClick={onSignIn}
            className="py-2 px-4 rounded-xl bg-slate-950 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Sign in to view claims
          </button>
        )}
      </div>

      {!user.isSignedIn ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="font-bold text-slate-900 text-base">Sign in to access your claims</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You need to be signed in as a student to check your reserved items and show pickup passes at the desk.
          </p>
          <button
            onClick={onSignIn}
            className="mt-2 py-2.5 px-5 rounded-xl bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-xs"
          >
            Sign in as Lily Lu
          </button>
        </div>
      ) : activeClaims.length === 0 && completedClaims.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No items currently claimed</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Browse found items on campus. If you see something that belongs to you, tap "This is mine".
          </p>
          <button
            onClick={onExplore}
            className="mt-2 py-2 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors"
          >
            Browse Campus Inventory
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Claims List */}
          {activeClaims.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Active Holds & Verification</span>
                <span className="text-xs font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                  {activeClaims.length}
                </span>
              </h3>

              <div className="space-y-3">
                {activeClaims.map((item) => {
                  const desk = CAMPUS_DESKS[item.desk];
                  const isApproved = item.status === 'reserved' || item.status === 'ready-pickup';

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                            <span className="capitalize font-medium text-slate-700">{item.category}</span>
                            <span>·</span>
                            <span>{item.colour}</span>
                            {item.valuable && (
                              <span className="text-amber-800 font-semibold bg-amber-100 text-[10px] px-1.5 py-0.2 rounded">
                                Valuable
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-slate-900">{studentItemLabel(item)}</h4>
                        </div>

                        {/* Status pill */}
                        {isApproved ? (
                          <span className="bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-xl shrink-0 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Ready for Pickup</span>
                          </span>
                        ) : (
                          <span className="bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-xl shrink-0 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                            <span>Staff Review Pending</span>
                          </span>
                        )}
                      </div>

                      {/* Desk Location & Hours */}
                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 text-xs space-y-2">
                        <div className="flex items-start gap-2.5 text-slate-700">
                          <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-900">{item.desk}</span>
                            <p className="text-slate-500 text-[11px]">{desk?.room}, {desk?.building}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 text-slate-600 border-t border-slate-200/60 pt-2">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium text-slate-800">{desk?.hours}</span>
                            <p className="text-[11px] text-amber-800 font-medium">
                              Hold expires: {item.claim?.holdExpiresAt ? 'in 7 days' : 'in 7 days (Nov 13, 2026)'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Pickup Pass Button or Review status */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                        {item.claim?.verificationAnswer && (
                          <p className="text-xs text-slate-500 italic max-w-sm">
                            Proof submitted: "{item.claim.verificationAnswer.slice(0, 50)}..."
                          </p>
                        )}

                        {item.claim?.pickupCode ? (
                          <button
                            onClick={() =>
                              onShowPickupCode(
                                item.claim!.pickupCode,
                                studentItemLabel(item),
                                item.desk
                              )
                            }
                            className="w-full sm:w-auto ml-auto py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                          >
                            <QrCode className="w-4 h-4" />
                            <span>Show Pickup Pass ({item.claim.pickupCode})</span>
                          </button>
                        ) : (
                          <div className="w-full sm:w-auto ml-auto text-xs text-amber-800 font-semibold bg-amber-50 py-2 px-3 rounded-lg border border-amber-200">
                            Awaiting staff desk approval
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past History */}
          {completedClaims.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h3 className="text-sm font-bold text-slate-500">Claim History (Picked Up)</h3>
              <div className="space-y-2">
                {completedClaims.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200/60 p-3.5 text-xs text-slate-600 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{studentItemLabel(item)}</span>
                      <p className="text-[11px] text-slate-400">
                        Picked up from {item.desk}
                      </p>
                    </div>
                    <span className="bg-slate-100 text-slate-600 text-[11px] font-semibold px-2 py-0.5 rounded">
                      Completed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

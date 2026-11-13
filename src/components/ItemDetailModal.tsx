import React from 'react';
import { X, MapPin, Clock, Calendar, ShieldCheck, Lock, AlertTriangle, ArrowRight } from 'lucide-react';
import { FoundItem, TimelineEvent, UserProfile } from '../types';
import { CAMPUS_DESKS, getDaysUntilDeskTransfer, getRetentionPolicyDays } from '../mockData';
import { formatHistoryLine, studentItemLabel } from '../lib/studentView';
import { ItemPhotoPlaceholder } from './CategoryIcon';

interface ItemDetailModalProps {
  item: FoundItem | null;
  isOpen: boolean;
  onClose: () => void;
  onClaimItem: (item: FoundItem) => void;
  user: UserProfile;
  timeline?: TimelineEvent[];
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onClaimItem,
  user,
  timeline = [],
}) => {
  if (!isOpen || !item) return null;

  const desk = CAMPUS_DESKS[item.desk] || {
    name: item.desk,
    building: item.desk,
    room: 'Front Desk',
    hours: 'Mon–Sun: 8:00 AM – 11:00 PM',
    description: 'Campus reception desk',
    phone: '519-888-4567',
  };

  const deskWindowDays = 14;
  const daysUntilDeskMove = getDaysUntilDeskTransfer(item.daysAgo, item.valuable);
  const daysRemainingRatio = Math.min(100, Math.max(0, (daysUntilDeskMove / deskWindowDays) * 100));
  const totalRetentionDays = getRetentionPolicyDays(item.valuable);
  const daysUntilDonation = Math.max(0, totalRetentionDays - item.daysAgo);

  const isReserved = item.status === 'reserved';
  const isUnderReview = item.status === 'under-review';
  const isPickedUp = item.status === 'picked-up';
  const isInTransit = item.status === 'in-transit';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top visual section */}
        <div className="relative">
          <ItemPhotoPlaceholder
            category={item.category}
            colour={item.colour}
            valuable={item.valuable}
            className="h-48 w-full"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Aging badge or transit indicator */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            {isInTransit ? (
              <span className="bg-amber-400 text-slate-950 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                In Transit to {item.desk}
              </span>
            ) : item.daysAgo < 14 ? (
              <span className="bg-emerald-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-lg shadow-sm">
                Logged {item.daysAgo === 0 ? 'Today' : `${item.daysAgo}d ago`} (Fresh)
              </span>
            ) : item.daysAgo < 30 ? (
              <span className="bg-amber-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-lg shadow-sm">
                Logged {item.daysAgo}d ago (Moving soon)
              </span>
            ) : (
              <span className="bg-rose-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-lg shadow-sm">
                Logged {item.daysAgo}d ago (Eligible for donation)
              </span>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-semibold text-slate-700 capitalize">{item.category}</span>
              <span>·</span>
              <span>Colour: {item.colour}</span>
              {item.valuable && (
                <>
                  <span>·</span>
                  <span className="text-amber-800 font-medium flex items-center gap-0.5">
                    <Lock className="w-3 h-3" /> Valuable
                  </span>
                </>
              )}
            </div>

            <h3 className="text-xl font-bold text-slate-900">
              {studentItemLabel(item)}
            </h3>

            <div className="mt-2 p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Students only see the colour, type, and desk. Brand, photos, and marks stay with staff. Describe one of those when you claim, and the desk checks it before handing the item over.
              </span>
            </div>
          </div>

          {/* Desk Location & Hours Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-900">{desk.name}</p>
                <p className="text-xs text-slate-600">{desk.room}</p>
                <p className="text-[11px] text-slate-400">{desk.building}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-slate-200/60">
              <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-800">{desk.hours}</p>
                <p className="text-[11px] text-slate-500">Phone: {desk.phone}</p>
              </div>
            </div>
          </div>

          {/* Lifecycle & Desk Retention Timeline */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Days remaining at {desk.name}:</span>
              </span>
              <span className="font-bold text-slate-900">
                {daysUntilDeskMove > 0
                  ? `${daysUntilDeskMove} days left at desk`
                  : 'Ready for Central Storage transfer'}
              </span>
            </div>

            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden" aria-hidden="true">
              <div
                className={`h-full rounded-full ${
                  daysUntilDeskMove > 7 ? 'bg-emerald-500' : daysUntilDeskMove > 0 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${daysRemainingRatio}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-500">
              {item.valuable
                ? 'Valuables are secured for 60+ days before transfer to UW Police Services.'
                : 'General items stay at desk for 14 days, then move to Central Storage before 30-day donation.'}
            </p>
            {daysUntilDonation <= 5 && daysUntilDonation > 0 && (
              <p className="text-[11px] font-bold text-rose-700">This item leaves the desk in {daysUntilDonation} days.</p>
            )}
          </div>

          {timeline.length > 0 && (
            <ol className="space-y-2">
              {timeline.map((event) => (
                <li key={event.id} className="text-xs bg-white border border-slate-200 rounded-xl p-2">
                  <span className="font-bold">{formatHistoryLine(event.eventType, event.createdAt)}</span>
                  <p className="text-slate-700 mt-0.5">{event.message}</p>
                </li>
              ))}
            </ol>
          )}

          {/* Contested / Reserved status note */}
          {isReserved && !item.claim && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Reserved by another student</p>
                <p className="text-[11px] text-amber-800">
                  Another student has placed a hold. If this is genuinely yours, you can submit a contested claim for staff review.
                </p>
              </div>
            </div>
          )}

          {isUnderReview && (
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900">
              <p className="font-bold">Claim Under Staff Review</p>
              <p className="text-[11px] text-sky-800">Staff are currently verifying ownership details for this item.</p>
            </div>
          )}

          {isPickedUp && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
              <p className="font-bold">Item Picked Up</p>
              <p className="text-[11px] text-emerald-800">This item was successfully returned to its owner.</p>
            </div>
          )}

          {/* Claim Action Button */}
          {!isPickedUp && (
            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onClaimItem(item);
                }}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] ${
                  isReserved && !item.claim
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                    : item.valuable
                    ? 'bg-slate-950 text-white hover:bg-slate-800'
                    : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                }`}
              >
                <span>{isReserved && !item.claim ? 'Contest claim' : 'This is mine (Claim Item)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

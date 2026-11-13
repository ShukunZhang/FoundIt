import React from 'react';
import { MapPin, Lock, Clock } from 'lucide-react';
import { FoundItem } from '../types';
import { studentItemLabel } from '../lib/studentView';
import { ItemPhotoPlaceholder } from './CategoryIcon';

interface ItemCardProps {
  item: FoundItem;
  onClick: (item: FoundItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onClick }) => {
  const isValuable = item.valuable;
  const heldByViewer = Boolean(item.claim);
  const reservedByOther = item.status === 'reserved' && !heldByViewer;
  const isInTransit = item.status === 'in-transit';
  const isUnderReview = item.status === 'under-review';
  const statusLabel = reservedByOther
    ? 'Reserved by another student'
    : heldByViewer && item.status === 'reserved'
      ? 'On hold for you'
      : isInTransit
        ? `In transit to ${item.desk.split(' ')[0]}`
        : isUnderReview
          ? 'Under review'
          : null;
  const actionLabel = reservedByOther
    ? 'Contest claim'
    : heldByViewer && item.status === 'reserved'
      ? 'View claim'
      : 'View & Claim';

  return (
    <div
      onClick={() => onClick(item)}
      className="group bg-white rounded-2xl border border-slate-200/80 hover:border-amber-400/80 shadow-xs hover:shadow-md transition-all overflow-hidden cursor-pointer flex flex-col active:scale-[0.99]"
    >
      {/* Visual Header */}
      <div className="relative">
        <ItemPhotoPlaceholder
          category={item.category}
          colour={item.colour}
          valuable={isValuable}
          className="h-36 sm:h-40 w-full group-hover:scale-102 transition-transform duration-300"
        />

        {/* Status badges */}
        {statusLabel && (
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
            <span className={`font-semibold text-[10px] px-2 py-0.5 rounded shadow-xs ${
              reservedByOther || isInTransit
                ? 'bg-amber-400 text-slate-950 font-bold'
                : isUnderReview
                  ? 'bg-sky-100 border border-sky-300 text-sky-900'
                  : 'bg-amber-100 border border-amber-300 text-amber-900'
            }`}>
              {statusLabel}
            </span>
          </div>
        )}

        {/* Age Indicator */}
        <div className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-xs text-slate-700 font-mono text-[10px] px-1.5 py-0.5 rounded border border-slate-200/60 flex items-center gap-1 shadow-2xs">
          <Clock className="w-2.5 h-2.5 text-slate-400" />
          <span>{item.daysAgo === 0 ? 'Today' : `${item.daysAgo}d ago`}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Unboxed Metadata row */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
            <span className="font-semibold text-slate-700 capitalize">{item.category}</span>
            <span>·</span>
            <span>{item.colour}</span>
            {isValuable && (
              <>
                <span>·</span>
                <span className="text-amber-800 font-medium flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Valuable
                </span>
              </>
            )}
          </div>

          {/* Title: Valuable items show generic description */}
          <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-amber-700 transition-colors">
            {studentItemLabel(item)}
          </h4>

          {/* Location Desk */}
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">{item.desk}</span>
          </div>
        </div>

        {/* Footer info & CTA preview */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end text-[11px]">
          <span className="font-semibold text-amber-700 group-hover:underline">
            {actionLabel} →
          </span>
        </div>
      </div>
    </div>
  );
};

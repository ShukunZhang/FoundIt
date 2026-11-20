import React from 'react';
import { MapPin, Lock, Clock } from 'lucide-react';
import { FoundItem } from '../types';
import { studentItemLabel } from '../lib/studentView';
import { ItemPhoto } from './CategoryIcon';

interface ItemCardProps {
  item: FoundItem;
  onClick: (item: FoundItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onClick }) => {
  return (
    <div
      onClick={() => onClick(item)}
      className="group bg-white rounded-2xl border border-slate-200/80 hover:border-amber-400/80 shadow-xs hover:shadow-md transition-all overflow-hidden cursor-pointer flex flex-col active:scale-[0.99]"
    >
      <div className="relative">
        <ItemPhoto
          item={item}
          className="h-36 sm:h-40 w-full group-hover:scale-102 transition-transform duration-300"
        />
        <div className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-xs text-slate-700 font-mono text-[10px] px-1.5 py-0.5 rounded border border-slate-200/60 flex items-center gap-1 shadow-2xs">
          <Clock className="w-2.5 h-2.5 text-slate-400" />
          <span>{item.daysAgo === 0 ? 'Today' : `${item.daysAgo}d ago`}</span>
        </div>
      </div>

      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
            <span className="font-semibold text-slate-700 capitalize">{item.category}</span>
            <span>·</span>
            <span>{item.colour}</span>
            {item.valuable && (
              <>
                <span>·</span>
                <span className="text-amber-800 font-medium flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Valuable
                </span>
              </>
            )}
          </div>
          <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-amber-700 transition-colors">
            {studentItemLabel(item)}
          </h4>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">{item.desk}</span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="font-mono font-bold text-slate-900">{item.itemCode ?? 'Code pending'}</span>
          <span className="font-semibold text-amber-700 group-hover:underline">View desk</span>
        </div>
      </div>
    </div>
  );
};

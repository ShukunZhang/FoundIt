import React from 'react';
import { Lock, MapPin } from 'lucide-react';
import type { FoundItem } from '../types';
import { ItemPhoto } from './CategoryIcon';

interface StaffInventoryProps {
  items: FoundItem[];
  selectedDesk: string;
}

export const StaffInventory: React.FC<StaffInventoryProps> = ({ items, selectedDesk }) => {
  const active = items.filter(
    (item) => !item.archivedAt && (selectedDesk === 'All Desks' || item.desk === selectedDesk),
  );

  return (
    <div className="space-y-4 pb-16">
      <div className="bg-white p-5 rounded-3xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-950">At the desk</h2>
        <p className="text-xs text-slate-500 mt-1">
          {active.length} item{active.length === 1 ? '' : 's'} waiting. Students come to the desk with the item code and their WATID.
        </p>
      </div>
      {active.length === 0 ? (
        <p className="text-sm text-slate-600 bg-white rounded-2xl border border-slate-200 p-6">No items are waiting at this desk.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {active.map((item) => (
            <article key={item.id} className="p-4 flex gap-3">
              <ItemPhoto item={item} className="h-16 w-16 rounded-xl shrink-0" />
              <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm font-bold text-slate-950">{item.itemCode}</p>
                {item.valuable && (
                  <span className="bg-slate-900 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Valuable
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{item.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {item.colour} {item.category}
                {item.storageSpot ? ` · Kept in ${item.storageSpot}` : ''}
              </p>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                {item.desk}
                {item.locationFound ? ` · Found ${item.locationFound}` : ''}
                {` · ${item.dateLogged}`}
              </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

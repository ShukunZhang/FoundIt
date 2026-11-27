import React from 'react';
import { Lock, MapPin } from 'lucide-react';
import type { FoundItem } from '../types';
import { categoryIsValuable } from '../lib/categories';
import { ItemPhoto } from './CategoryIcon';

export type InventoryScope = 'valuable' | 'everyday';

interface StaffInventoryProps {
  items: FoundItem[];
  selectedDesk: string;
  scope: InventoryScope;
  onScope: (scope: InventoryScope) => void;
}

type AgeTier = 'green' | 'yellow' | 'red';

const AGE_COLUMNS: { id: AgeTier; title: string; detail: string; tone: string }[] = [
  { id: 'green', title: 'Under 14 days', detail: 'Still fresh', tone: 'border-emerald-300 bg-emerald-50' },
  { id: 'yellow', title: '14–29 days', detail: 'Getting old', tone: 'border-amber-300 bg-amber-50' },
  { id: 'red', title: '30+ days', detail: 'Ready to clear', tone: 'border-rose-300 bg-rose-50' },
];

const SCOPES: { id: InventoryScope; label: string }[] = [
  { id: 'valuable', label: 'Valuable' },
  { id: 'everyday', label: 'Non-valuable' },
];

function isValuableItem(item: FoundItem): boolean {
  return item.valuable || categoryIsValuable(item.category, item.subcategory);
}

function ageTier(days: number): AgeTier {
  if (days < 14) return 'green';
  if (days < 30) return 'yellow';
  return 'red';
}

function ageLabel(item: FoundItem): string {
  const days = `${item.daysAgo}d`;
  if (isValuableItem(item)) return `${days} · keep at the desk`;
  if (item.daysAgo < 14) return `${days} · still fresh`;
  if (item.daysAgo < 30) return `${days} · getting old`;
  return `${days} · ready to clear`;
}

function InventoryCard({ item, narrow = false }: { item: FoundItem; narrow?: boolean }) {
  return (
    <article className={`bg-white rounded-xl border border-slate-200 min-w-0 overflow-hidden ${narrow ? 'p-1.5 flex flex-col gap-1.5 sm:p-3 sm:flex-row sm:gap-3' : 'p-3 flex gap-3'}`}>
      <ItemPhoto item={item} className={narrow ? 'h-16 w-full rounded-lg sm:h-14 sm:w-14 sm:shrink-0' : 'h-14 w-14 rounded-lg shrink-0'} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className={`font-mono font-bold text-slate-950 leading-tight ${narrow ? 'text-[11px] sm:text-sm truncate' : 'text-sm'}`}>{item.itemCode}</p>
          {isValuableItem(item) && (
            <span className="bg-slate-900 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
              <Lock className="w-2.5 h-2.5" /> Valuable
            </span>
          )}
        </div>
        <h4 className={`font-bold text-slate-900 leading-tight ${narrow ? 'text-[11px] sm:text-sm mt-0.5 line-clamp-2' : 'text-sm mt-1'}`}>{item.title}</h4>
        <p className={`text-slate-500 leading-tight ${narrow ? 'text-[10px] sm:text-xs mt-0.5 line-clamp-2' : 'text-xs mt-0.5'}`}>
          {item.colour} {item.category}
          {item.storageSpot ? ` · Kept in ${item.storageSpot}` : ''}
        </p>
        {narrow && item.locationFound && (
          <p className="text-[10px] text-slate-600 leading-tight truncate sm:hidden">{item.locationFound}</p>
        )}
        <p className={narrow ? 'hidden sm:flex text-xs text-slate-600 gap-1 leading-tight mt-0.5 items-start' : 'text-xs text-slate-600 mt-1 flex gap-1 leading-tight items-center'}>
          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            {item.desk}
            {item.locationFound ? ` · Found ${item.locationFound}` : ''}
            {` · ${ageLabel(item)}`}
          </span>
        </p>
      </div>
    </article>
  );
}

export const StaffInventory: React.FC<StaffInventoryProps> = ({ items, selectedDesk, scope, onScope }) => {
  const waiting = items.filter((item) => {
    if (item.archivedAt) return false;
    if (selectedDesk !== 'All Desks' && item.desk !== selectedDesk) return false;
    const valuable = isValuableItem(item);
    if (scope === 'valuable' && !valuable) return false;
    if (scope === 'everyday' && valuable) return false;
    return true;
  });

  return (
    <div className="space-y-4 pb-16">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">
            {scope === 'valuable' ? 'Valuable' : 'Non-valuable'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {scope === 'valuable'
              ? 'Keys, WatCards, electronics, and wallets stay at the desk until a student shows the item code and WATID.'
              : 'Under 14 days is green, 14–29 days is yellow, and 30 days or more is red. Clear items in the red column.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SCOPES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onScope(option.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl ${
                scope === option.id ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {scope === 'valuable' ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3">
          <p className="text-[11px] text-slate-600">{waiting.length} at the desk</p>
          {waiting.length === 0 ? (
            <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3">No valuable items at this desk.</p>
          ) : (
            waiting.map((item) => <InventoryCard key={item.id} item={item} />)
          )}
        </section>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 items-start">
          {AGE_COLUMNS.map((column) => {
            const columnItems = waiting.filter((item) => ageTier(item.daysAgo) === column.id);
            return (
              <section key={column.id} className={`min-w-0 overflow-hidden rounded-2xl border p-1.5 sm:p-3 space-y-2 sm:space-y-3 ${column.tone}`}>
                <div className="min-w-0">
                  <h3 className="text-[11px] sm:text-sm font-bold text-slate-950 leading-tight">{column.title}</h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-600 leading-tight">{column.detail} · {columnItems.length}</p>
                </div>
                {columnItems.length === 0 ? (
                  <p className="text-[10px] sm:text-xs text-slate-600 bg-white/80 rounded-xl p-1.5 sm:p-3 leading-tight">No items in this column.</p>
                ) : (
                  columnItems.map((item) => <InventoryCard key={item.id} item={item} narrow />)
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

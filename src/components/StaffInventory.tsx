import React, { useState } from 'react';
import { Lock, MapPin } from 'lucide-react';
import type { FoundItem } from '../types';
import { categoryIsValuable } from '../lib/categories';
import { ItemPhoto } from './CategoryIcon';

export type InventoryScope = 'valuable' | 'everyday' | 'all';

interface StaffInventoryProps {
  items: FoundItem[];
  selectedDesk: string;
  scope: InventoryScope;
  onScope: (scope: InventoryScope) => void;
}

type AgeTier = 'green' | 'yellow' | 'red';

const SCOPES: { id: InventoryScope; label: string }[] = [
  { id: 'valuable', label: 'At desk' },
  { id: 'everyday', label: 'Non-valuable' },
  { id: 'all', label: 'All items' },
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

export const StaffInventory: React.FC<StaffInventoryProps> = ({ items, selectedDesk, scope, onScope }) => {
  const [age, setAge] = useState<'all' | AgeTier>('all');
  const waiting = items.filter(
    (item) => !item.archivedAt && (selectedDesk === 'All Desks' || item.desk === selectedDesk),
  );
  const visible = waiting.filter((item) => {
    const valuable = isValuableItem(item);
    if (scope === 'valuable' && !valuable) return false;
    if (scope === 'everyday' && valuable) return false;
    if (scope !== 'valuable' && age !== 'all' && ageTier(item.daysAgo) !== age) return false;
    return true;
  });

  return (
    <div className="space-y-4 pb-16">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">
            {scope === 'valuable' ? 'At the desk' : scope === 'everyday' ? 'Non-valuable inventory' : 'All items'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {scope === 'valuable'
              ? 'Keys, WatCards, electronics, and wallets stay here until a student shows the item code and WATID.'
              : 'Green is under 14 days, yellow is 14–29 days, and red is 30 days or more. Clear non-valuable items when they turn red. Valuable items stay at the desk.'}
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
        {scope !== 'valuable' && (
          <div className="flex flex-wrap gap-1.5">
            {([
              ['all', 'Any age'],
              ['green', 'Under 14 days'],
              ['yellow', '14–29 days'],
              ['red', '30+ days'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setAge(id)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg ${
                  age === id ? 'bg-white border border-slate-300 text-slate-900' : 'text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      {visible.length === 0 ? (
        <p className="text-sm text-slate-600 bg-white rounded-2xl border border-slate-200 p-6">Nothing in this list for the selected desk.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {visible.map((item) => {
            const tier = ageTier(item.daysAgo);
            const bar = tier === 'green' ? 'bg-emerald-500' : tier === 'yellow' ? 'bg-amber-500' : 'bg-rose-500';
            return (
              <article key={item.id} className="p-4 flex gap-3">
                {scope !== 'valuable' && <span className={`w-1.5 self-stretch rounded-full ${bar}`} aria-hidden="true" />}
                <ItemPhoto item={item} className="h-16 w-16 rounded-xl shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-bold text-slate-950">{item.itemCode}</p>
                    {isValuableItem(item) && (
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
                    {` · ${ageLabel(item)}`}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Archive, Package, PlusCircle, ShieldCheck } from 'lucide-react';
import { FoundItem } from '../types';
import { CAMPUS_DESKS } from '../mockData';

interface StaffDashboardProps {
  items: FoundItem[];
  selectedDesk: string;
  onSelectDesk: (desk: string) => void;
  onNavigateTab: (tab: 'inventory' | 'archive' | 'log' | 'handoff') => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  items,
  selectedDesk,
  onSelectDesk,
  onNavigateTab,
}) => {
  const deskItems = items.filter((item) => selectedDesk === 'All Desks' || item.desk === selectedDesk);
  const active = deskItems.filter((item) => !item.archivedAt);
  const valuable = active.filter((item) => item.valuable);
  const archived = deskItems.filter((item) => item.archivedAt);

  return (
    <div className="space-y-6 pb-16">
      <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-amber-400">Staff desk</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">Found items</h1>
            <p className="text-xs text-slate-400 mt-1">
              Log what you found. The item code is created for you. When a student arrives, check their WATID and archive the item.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Desk</label>
            <select
              value={selectedDesk}
              onChange={(event) => onSelectDesk(event.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-xs font-bold text-amber-400 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value="All Desks">All desks</option>
              {Object.keys(CAMPUS_DESKS).map((desk) => (
                <option key={desk} value={desk}>{desk}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button type="button" onClick={() => onNavigateTab('inventory')} className="text-left bg-slate-900/80 hover:bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
            <Package className="w-4 h-4 text-amber-400" />
            <p className="text-xl font-bold text-white mt-2">{active.length} waiting</p>
            <p className="text-[11px] text-slate-400">At the desk now</p>
          </button>
          <button type="button" onClick={() => onNavigateTab('inventory')} className="text-left bg-slate-900/80 hover:bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <p className="text-xl font-bold text-white mt-2">{valuable.length} valuable</p>
            <p className="text-[11px] text-slate-400">Keys, WatCards, electronics, wallets</p>
          </button>
          <button type="button" onClick={() => onNavigateTab('archive')} className="text-left bg-slate-900/80 hover:bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
            <Archive className="w-4 h-4 text-emerald-400" />
            <p className="text-xl font-bold text-white mt-2">{archived.length} archived</p>
            <p className="text-[11px] text-slate-400">Removed after 4 months</p>
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <button type="button" onClick={() => onNavigateTab('log')} className="text-left bg-amber-400 hover:bg-amber-300 p-5 rounded-2xl text-slate-950">
          <PlusCircle className="w-6 h-6 mb-2" />
          <h3 className="font-bold text-base">Log a found item</h3>
          <p className="text-xs text-slate-800 mt-1">Photo, description, and where it was found. Your staff desk and today's date are filled in.</p>
        </button>
        <button type="button" onClick={() => onNavigateTab('handoff')} className="text-left bg-white hover:border-amber-400 p-5 rounded-2xl border border-slate-200 text-slate-900">
          <ShieldCheck className="w-6 h-6 mb-2" />
          <h3 className="font-bold text-base">Hand an item over</h3>
          <p className="text-xs text-slate-500 mt-1">Look up the item code, check the WATID on their ID, then archive it.</p>
        </button>
      </section>
    </div>
  );
};

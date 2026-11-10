import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Package, 
  Truck, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck,
  Building2,
  Calendar
} from 'lucide-react';
import { FoundItem } from '../types';
import { CAMPUS_DESKS } from '../mockData';

interface StaffDashboardProps {
  items: FoundItem[];
  selectedDesk: string;
  onSelectDesk: (desk: string) => void;
  onNavigateTab: (tab: 'inventory' | 'claims' | 'log' | 'scan') => void;
  onOpenQuickScanItem?: (code: string) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  items,
  selectedDesk,
  onSelectDesk,
  onNavigateTab,
}) => {
  // Filter by desk if not 'All Desks'
  const deskItems = items.filter(
    (item) => selectedDesk === 'All Desks' || item.desk === selectedDesk
  );

  // Calculate To-Do statistics
  // 1. Items to move: items 14+ days old still marked available or reserved
  const itemsToMove = deskItems.filter(
    (item) => item.daysAgo >= 14 && (item.status === 'available' || item.status === 'reserved')
  );

  // 2. Pickups waiting: reserved or ready-pickup items
  const pickupsWaiting = deskItems.filter(
    (item) => item.status === 'reserved' || item.status === 'ready-pickup'
  );

  // 3. Claims to approve: under-review items
  const claimsToApprove = deskItems.filter((item) => item.status === 'under-review');

  // 4. In-transit items awaiting student drop-off
  const inTransitItems = deskItems.filter((item) => item.status === 'in-transit');

  // Status counts
  const availableCount = deskItems.filter((i) => i.status === 'available').length;
  const underReviewCount = claimsToApprove.length;
  const readyPickupCount = pickupsWaiting.length;
  const movedOrDonatedCount = deskItems.filter(
    (i) => i.status === 'moved-storage' || i.status === 'donated' || i.status === 'picked-up'
  ).length;

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header & Desk Switcher */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
                Staff Operations Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Desk Operations Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Live intake, student verification, code scanners, and aging automation.
            </p>
          </div>

          {/* Active Desk Selector */}
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Active Duty Desk
            </label>
            <select
              value={selectedDesk}
              onChange={(e) => onSelectDesk(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-xs font-bold text-amber-400 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value="All Desks">All Campus Desks (5 locations)</option>
              {Object.keys(CAMPUS_DESKS).map((desk) => (
                <option key={desk} value={desk}>
                  {desk}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick To-Do summary ticker */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            onClick={() => onNavigateTab('inventory')}
            className="bg-slate-900/80 hover:bg-slate-900 p-3.5 rounded-2xl border border-slate-800 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Aging Due</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl font-bold text-white mt-1">
              {itemsToMove.length} items to move
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              14+ days old, ready for long-term storage
            </p>
          </div>

          <div
            onClick={() => onNavigateTab('scan')}
            className="bg-slate-900/80 hover:bg-slate-900 p-3.5 rounded-2xl border border-slate-800 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Pickups Waiting</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-white mt-1">
              {pickupsWaiting.length} pickups waiting
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Reserved with active pickup codes
            </p>
          </div>

          <div
            onClick={() => onNavigateTab('claims')}
            className="bg-slate-900/80 hover:bg-slate-900 p-3.5 rounded-2xl border border-slate-800 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Claims Queue</span>
              <ShieldCheck className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-xl font-bold text-white mt-1">
              {claimsToApprove.length} claim to approve
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Valuable verification answers waiting
            </p>
          </div>
        </div>
      </div>

      {/* Status Breakdown Counts */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Inventory Status Counts</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Available at Desk</span>
            <span className="text-2xl font-mono font-bold text-slate-900 mt-0.5 block">
              {availableCount}
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">Ready for student claim</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Under Staff Review</span>
            <span className="text-2xl font-mono font-bold text-amber-700 mt-0.5 block">
              {underReviewCount}
            </span>
            <span className="text-[10px] text-amber-800 font-medium">Requires identity check</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Reserved / Hold</span>
            <span className="text-2xl font-mono font-bold text-sky-700 mt-0.5 block">
              {readyPickupCount}
            </span>
            <span className="text-[10px] text-sky-800 font-medium">Holding for 7-day pickup</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Archived / Processed</span>
            <span className="text-2xl font-mono font-bold text-slate-600 mt-0.5 block">
              {movedOrDonatedCount}
            </span>
            <span className="text-[10px] text-slate-500">Picked up or moved</span>
          </div>
        </div>
      </section>

      {/* Quick Action Navigation Tiles */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div
          onClick={() => onNavigateTab('log')}
          className="bg-amber-400 hover:bg-amber-300 p-5 rounded-2xl text-slate-950 cursor-pointer shadow-xs transition-all active:scale-[0.99] flex flex-col justify-between"
        >
          <div>
            <Sparkles className="w-6 h-6 mb-2" />
            <h3 className="font-bold text-base">Log Incoming Item</h3>
            <p className="text-xs text-slate-800 mt-1">
              Photo-first, big tap targets, automatic timestamp, and instant WatCard lookup.
            </p>
          </div>
          <span className="mt-4 font-bold text-xs flex items-center gap-1">
            Open Intake Form →
          </span>
        </div>

        <div
          onClick={() => onNavigateTab('inventory')}
          className="bg-white hover:border-amber-400 p-5 rounded-2xl border border-slate-200 text-slate-900 cursor-pointer shadow-xs transition-all active:scale-[0.99] flex flex-col justify-between"
        >
          <div>
            <Calendar className="w-6 h-6 text-slate-800 mb-2" />
            <h3 className="font-bold text-base">Aging Inventory</h3>
            <p className="text-xs text-slate-500 mt-1">
              Green (&lt;14d), Yellow (14-29d), Red (30+d), with safe-move warnings.
            </p>
          </div>
          <span className="mt-4 font-bold text-xs text-amber-800 flex items-center gap-1">
            View Inventory Grid →
          </span>
        </div>

        <div
          onClick={() => onNavigateTab('scan')}
          className="bg-white hover:border-amber-400 p-5 rounded-2xl border border-slate-200 text-slate-900 cursor-pointer shadow-xs transition-all active:scale-[0.99] flex flex-col justify-between"
        >
          <div>
            <Package className="w-6 h-6 text-slate-800 mb-2" />
            <h3 className="font-bold text-base">Scan Pickup / Drop-Off</h3>
            <p className="text-xs text-slate-500 mt-1">
              Verify 6-character codes (e.g. WLO-204) or accept finder drops (DROP-419).
            </p>
          </div>
          <span className="mt-4 font-bold text-xs text-amber-800 flex items-center gap-1">
            Open Code Scanner →
          </span>
        </div>
      </section>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Lock, 
  AlertTriangle, 
  ArrowRight, 
  Check, 
  MapPin, 
  Archive, 
  HeartHandshake, 
  Clock, 
  X,
  Filter
} from 'lucide-react';
import { FoundItem, ItemStatus } from '../types';
import { CAMPUS_DESKS } from '../mockData';

interface StaffInventoryProps {
  items: FoundItem[];
  selectedDesk: string;
  onUpdateItemStatus: (itemId: string, newStatus: ItemStatus, note?: string) => void;
}

export const StaffInventory: React.FC<StaffInventoryProps> = ({
  items,
  selectedDesk,
  onUpdateItemStatus,
}) => {
  const [filterAge, setFilterAge] = useState<'all' | 'green' | 'yellow' | 'red'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [movingItem, setMovingItem] = useState<FoundItem | null>(null);
  const [earlyMoveOverride, setEarlyMoveOverride] = useState(false);

  // Filter items by desk, age, category
  const filteredItems = items.filter((item) => {
    if (selectedDesk !== 'All Desks' && item.desk !== selectedDesk) return false;
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;

    if (filterAge === 'green' && item.daysAgo >= 14) return false;
    if (filterAge === 'yellow' && (item.daysAgo < 14 || item.daysAgo >= 30)) return false;
    if (filterAge === 'red' && item.daysAgo < 30) return false;

    return true;
  });

  const handleOpenMoveModal = (item: FoundItem) => {
    setMovingItem(item);
    setEarlyMoveOverride(false);
  };

  const handleConfirmMove = (destination: 'moved-storage' | 'donated') => {
    if (!movingItem) return;
    onUpdateItemStatus(movingItem.id, destination, earlyMoveOverride ? 'Supervisor override recorded at the desk' : undefined);
    setMovingItem(null);
  };

  return (
    <div className="space-y-5 animate-fade-in pb-16">
      {/* Top Banner and Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Campus Desk Inventory & Aging</h2>
          <p className="text-xs text-slate-500">
            Items automatically transition through green (&lt;14d), yellow (14–29d), and red (30+d) retention tiers.
          </p>
        </div>

        {/* Age Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterAge('all')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              filterAge === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterAge('green')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
              filterAge === 'green' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>&lt;14d Desk</span>
          </button>
          <button
            onClick={() => setFilterAge('yellow')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
              filterAge === 'yellow' ? 'bg-white text-amber-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>14–29d Storage</span>
          </button>
          <button
            onClick={() => setFilterAge('red')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
              filterAge === 'red' ? 'bg-white text-rose-800 shadow-2xs' : 'text-slate-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>30+d Donate</span>
          </button>
        </div>
      </div>

      {/* Legend Indicator Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center gap-2 text-emerald-950">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
          <div>
            <span className="font-bold">Green (&lt; 14 days):</span>
            <span className="text-emerald-800 ml-1">Fresh at desk for immediate owner recovery.</span>
          </div>
        </div>

        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center gap-2 text-amber-950">
          <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
          <div>
            <span className="font-bold">Yellow (14–29 days):</span>
            <span className="text-amber-800 ml-1">Move to Central Long-Term Storage.</span>
          </div>
        </div>

        <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-xl flex items-center gap-2 text-rose-950">
          <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0"></span>
          <div>
            <span className="font-bold">Red (30+ days):</span>
            <span className="text-rose-800 ml-1">Ready for WUSA student donation drive.</span>
          </div>
        </div>
      </div>

      {/* Items Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="divide-y divide-slate-100">
          {filteredItems.map((item) => {
            const isGreen = item.daysAgo < 14;
            const isYellow = item.daysAgo >= 14 && item.daysAgo < 30;
            const isRed = item.daysAgo >= 30;
            const isMoved = item.status === 'moved-storage' || item.status === 'donated';

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
              >
                {/* Left Item Details */}
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Aging Colour Pill */}
                  <div
                    className={`w-3.5 h-12 rounded-full shrink-0 ${
                      isGreen ? 'bg-emerald-500' : isYellow ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    title={
                      isGreen
                        ? 'Under 14 days'
                        : isYellow
                        ? '14-29 days: Transfer to Central Storage'
                        : '30+ days: Ready to donate'
                    }
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
                      <span className="font-semibold text-slate-800 capitalize">{item.category}</span>
                      <span>·</span>
                      <span>{item.colour}</span>
                      <span>·</span>
                      <span className="font-mono">{item.desk}</span>
                      {item.storageSpot && (
                        <>
                          <span>·</span>
                          <span className="bg-slate-100 px-1.5 py-0.2 rounded font-mono text-slate-700 font-semibold">
                            Loc: {item.storageSpot}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {item.title}
                      </h4>
                      {item.valuable && (
                        <span className="bg-slate-900 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                          <Lock className="w-2.5 h-2.5" /> 60d Valuable
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {item.detailedDescription || item.publicDescription}
                    </p>

                    <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                      <span>Logged: <strong className="text-slate-800">{item.dateLogged}</strong> ({item.daysAgo}d ago)</span>
                      <span>·</span>
                      <span>
                        Status: <strong className="capitalize text-slate-800">{item.status.replace('-', ' ')}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {isMoved ? (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                      Archived ({item.status})
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenMoveModal(item)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                        isYellow
                          ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                          : isRed
                          ? 'bg-rose-500 text-white hover:bg-rose-600'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>Mark as Moved</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Move Confirmation & Early Move Warning Modal */}
      {movingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-950 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">Move Item from Desk Inventory</h3>
              <button
                onClick={() => setMovingItem(null)}
                className="w-7 h-7 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs text-slate-500">Target Item:</span>
                <h4 className="font-bold text-slate-900 text-base">{movingItem.title}</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Located at {movingItem.desk} · Logged {movingItem.daysAgo} days ago ({movingItem.dateLogged})
                </p>
              </div>

              {/* Requirement: Warning if item isn't due yet (< 14 days) */}
              {movingItem.daysAgo < 14 ? (
                <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl text-amber-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Policy Warning: Item Not Yet Due</span>
                  </div>
                  <p className="text-xs leading-relaxed text-amber-900">
                    This item has only been logged for <strong>{movingItem.daysAgo} days</strong>. Standard campus policy keeps items at the initial front desk for at least <strong>14 days</strong> before moving to Central Long-Term Storage.
                  </p>
                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={earlyMoveOverride}
                      onChange={(e) => setEarlyMoveOverride(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-amber-900">
                      Override policy and move early (Special supervisor authorization)
                    </span>
                  </label>
                </div>
              ) : movingItem.valuable && movingItem.daysAgo < 60 ? (
                <div className="bg-sky-50 border border-sky-300 p-4 rounded-2xl text-sky-950 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-sky-900">
                    <Lock className="w-4 h-4 text-sky-700 shrink-0" />
                    <span>Valuable Item 60-Day Lock</span>
                  </div>
                  <p className="text-xs text-sky-900">
                    This valuable item will be transferred to <strong>Central Vault</strong> and retained for 60 days before campus police transfer.
                  </p>
                </div>
              ) : null}

              {/* Destination Choices */}
              <div className="space-y-2 pt-1">
                <button
                  disabled={movingItem.daysAgo < 14 && !earlyMoveOverride}
                  onClick={() => handleConfirmMove('moved-storage')}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-between transition-colors ${
                    movingItem.daysAgo < 14 && !earlyMoveOverride
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Archive className="w-4 h-4" />
                    <span>Move to Central Long-Term Storage</span>
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  disabled={(movingItem.daysAgo < 30 || (movingItem.valuable && movingItem.daysAgo < 60)) && !earlyMoveOverride}
                  onClick={() => handleConfirmMove('donated')}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-between transition-colors ${
                    (movingItem.daysAgo < 30 || (movingItem.valuable && movingItem.daysAgo < 60)) && !earlyMoveOverride
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4" />
                    <span>Transfer to WUSA Student Donation Drive (30+ days)</span>
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setMovingItem(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

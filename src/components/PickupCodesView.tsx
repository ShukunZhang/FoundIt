import React from 'react';
import { Clock, QrCode } from 'lucide-react';
import type { ClaimRecord, FoundItem } from '../types';
import { studentItemLabel } from '../lib/studentView';

interface PickupCodesViewProps {
  claims: ClaimRecord[];
  items: FoundItem[];
  userId: string;
  onShowPickupCode: (code: string, title: string, desk: string) => void;
}

export const PickupCodesView: React.FC<PickupCodesViewProps> = ({
  claims,
  items,
  userId,
  onShowPickupCode,
}) => {
  const mine = claims.filter((claim) => claim.claimantId === userId && claim.status !== 'rejected');
  const ready = mine.filter((claim) => claim.pickupCode && (claim.status === 'approved' || claim.status === 'contested'));
  const waiting = mine.filter((claim) => !claim.pickupCode && (claim.status === 'pending' || claim.status === 'contested'));

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-950">Pickup codes</h2>
        <p className="text-xs text-slate-500 mt-1">Show this code at the desk when your claim is approved.</p>
      </div>
      {ready.length === 0 && waiting.length === 0 ? (
        <p className="text-sm text-slate-600 bg-white rounded-2xl p-6 border border-slate-200">
          No pickup codes yet. When a desk approves your claim, the code appears here.
        </p>
      ) : (
        <div className="space-y-3">
          {ready.map((claim) => {
            const item = items.find((entry) => entry.id === claim.itemId);
            const title = item ? studentItemLabel(item) : 'Your item';
            const desk = item?.desk ?? 'the desk';
            return (
              <article key={claim.id} className="bg-white rounded-2xl border border-emerald-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-emerald-800">Ready for pickup</p>
                    <h3 className="font-bold text-slate-950">{title}</h3>
                    <p className="text-xs text-slate-500">{desk}</p>
                  </div>
                  <p className="font-mono text-sm font-bold tracking-wide text-slate-950">{claim.pickupCode}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onShowPickupCode(claim.pickupCode, title, desk)}
                  className="w-full py-2.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  Show pickup code
                </button>
              </article>
            );
          })}
          {waiting.map((claim) => {
            const item = items.find((entry) => entry.id === claim.itemId);
            return (
              <article key={claim.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <div>
                  <h3 className="font-bold text-sm text-slate-950">{item ? studentItemLabel(item) : 'Your claim'}</h3>
                  <p className="text-xs text-slate-500">Waiting for the desk to approve this claim.</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

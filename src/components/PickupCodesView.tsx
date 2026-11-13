import React, { useState } from 'react';
import { Clock, QrCode } from 'lucide-react';
import type { ClaimRecord, FoundItem } from '../types';
import { studentItemLabel } from '../lib/studentView';

interface PickupCodesViewProps {
  claims: ClaimRecord[];
  items: FoundItem[];
  userId: string;
  onShowPickupCode: (code: string, title: string, desk: string) => void;
  onWrongClaim: (claimId: string) => Promise<void>;
}

export const PickupCodesView: React.FC<PickupCodesViewProps> = ({
  claims,
  items,
  userId,
  onShowPickupCode,
  onWrongClaim,
}) => {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const closed = new Set(['rejected', 'completed', 'withdrawn']);
  const mine = claims.filter((claim) => claim.claimantId === userId && !closed.has(claim.status));
  const open = mine.filter((claim) => {
    const item = items.find((entry) => entry.id === claim.itemId);
    return item?.status !== 'picked-up' && item?.status !== 'donated';
  });
  const ready = open.filter((claim) => claim.pickupCode && (claim.status === 'approved' || claim.status === 'contested'));
  const waiting = open.filter((claim) => !ready.includes(claim));

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
                {confirmingId === claim.id ? (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600">This is not your item. The claim will be cancelled. The item stays at the desk, and your lost report stays on your account.</p>
                    {error && <p className="text-xs text-rose-700">{error}</p>}
                    <div className="flex gap-2">
                      <button type="button" disabled={busyId === claim.id} onClick={() => setConfirmingId(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-xs font-bold">Keep claim</button>
                      <button
                        type="button"
                        disabled={busyId === claim.id}
                        onClick={() => {
                          setBusyId(claim.id);
                          setError('');
                          void onWrongClaim(claim.id).catch((cancelError: unknown) => {
                            setError(cancelError instanceof Error ? cancelError.message : 'Could not cancel the claim.');
                            setBusyId(null);
                          });
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-rose-700 text-white text-xs font-bold"
                      >
                        {busyId === claim.id ? 'Cancelling…' : 'Wrong claim'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => { setError(''); setConfirmingId(claim.id); }} className="w-full py-2.5 rounded-xl border border-rose-300 text-rose-800 text-xs font-bold">
                    Wrong claim
                  </button>
                )}
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

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Check, 
  X, 
  AlertCircle, 
  Lock, 
  User, 
  Mail, 
  Clock, 
  CheckCircle2,
  FileQuestion,
  HelpCircle
} from 'lucide-react';
import { FoundItem, ClaimRecord } from '../types';
import { generatePickupCode } from '../mockData';

interface StaffClaimsQueueProps {
  items: FoundItem[];
  selectedDesk: string;
  onApproveClaim: (itemId: string, pickupCode: string) => void;
  onRejectClaim: (itemId: string, reason: string) => void;
}

export const StaffClaimsQueue: React.FC<StaffClaimsQueueProps> = ({
  items,
  selectedDesk,
  onApproveClaim,
  onRejectClaim,
}) => {
  const [rejectingItem, setRejectingItem] = useState<FoundItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Verification answer did not match item attributes.');

  // Find items requiring staff review
  const pendingClaims = items.filter((item) => {
    if (selectedDesk !== 'All Desks' && item.desk !== selectedDesk) return false;
    return item.status === 'under-review' && item.claim;
  });

  const handleApprove = (item: FoundItem) => {
    const code = item.claim?.pickupCode || generatePickupCode();
    onApproveClaim(item.id, code);
  };

  const handleConfirmReject = () => {
    if (!rejectingItem) return;
    onRejectClaim(rejectingItem.id, rejectReason);
    setRejectingItem(null);
    setRejectReason('Verification answer did not match item attributes.');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Valuable & Contested Claims Queue</h2>
          <p className="text-xs text-slate-500">
            Carefully verify ownership answers before granting pickup QR codes for high-value items.
          </p>
        </div>
        <span className="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
          {pendingClaims.length} awaiting review
        </span>
      </div>

      {pendingClaims.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Claims Queue Clear!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All submitted valuable claims and ownership verifications have been evaluated.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingClaims.map((item) => {
            const claim = item.claim!;
            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border-2 border-amber-300/80 p-5 sm:p-6 shadow-sm space-y-5"
              >
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="capitalize font-semibold text-slate-800">{item.category}</span>
                      <span>·</span>
                      <span>{item.desk}</span>
                      {item.storageSpot && (
                        <>
                          <span>·</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-700 font-bold">
                            Vault Loc: {item.storageSpot}
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                      <span>{item.title}</span>
                      {item.valuable && (
                        <span className="bg-slate-950 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Valuable
                        </span>
                      )}
                    </h3>
                  </div>

                  <div className="text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl shrink-0">
                    <p className="text-[11px] text-slate-400">Claimant</p>
                    <p className="font-bold text-slate-900">{claim.claimantName}</p>
                    <p className="text-slate-500 text-[11px]">{claim.claimantEmail}</p>
                  </div>
                </div>

                {/* Staff Reference: Ground Truth details */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Actual Item Ground Truth (Vault Log)
                  </span>
                  <p className="text-xs font-medium text-slate-800">
                    {item.detailedDescription || item.publicDescription}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Found at: {item.locationFound || item.desk}
                  </p>
                </div>

                {/* Claimant's Verification Answer */}
                <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                    <FileQuestion className="w-4 h-4 text-amber-700" />
                    <span>Claimant's Submitted Ownership Proof:</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-amber-200 text-xs text-slate-900 font-medium italic">
                    "{claim.verificationAnswer || claim.distinguishingDetail || 'No detailed answer provided.'}"
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Does this description match the internal contents / serial / physical marks?
                  </p>
                </div>

                {/* Staff Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => handleApprove(item)}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Claim & Issue Pickup Pass</span>
                  </button>

                  <button
                    onClick={() => setRejectingItem(item)}
                    className="w-full sm:w-auto py-3 px-5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject Claim</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-950">Reject Valuable Claim</h3>
            <p className="text-xs text-slate-600">
              Provide a brief explanation for <strong>{rejectingItem.claim?.claimantName}</strong>:
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRejectingItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { X, Clock, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { CAMPUS_DESKS } from '../mockData';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  itemTitle: string;
  deskName: string;
  holdExpiresAt?: string;
  onSimulateStaffScan?: () => void;
  onWrongClaim?: () => Promise<void>;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  code,
  itemTitle,
  deskName,
  holdExpiresAt = 'in 7 days (Nov 13, 2026)',
  onSimulateStaffScan,
  onWrongClaim,
}) => {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) return;
    setConfirming(false);
    setBusy(false);
    setError('');
  }, [isOpen]);

  if (!isOpen) return null;

  const cancelClaim = async () => {
    if (!onWrongClaim) return;
    setBusy(true);
    setError('');
    try {
      await onWrongClaim();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Could not cancel the claim.');
      setBusy(false);
    }
  };

  const desk = CAMPUS_DESKS[deskName] || {
    name: deskName,
    building: deskName,
    room: 'Circulation Desk',
    hours: 'Mon–Sun: 8:00 AM – 11:00 PM',
  };

  // Generate deterministic pseudo-random QR matrix pattern from code
  const size = 21;
  const matrix: boolean[][] = Array(size).fill(false).map(() => Array(size).fill(false));
  
  // Finder patterns (3 corners)
  const drawCorner = (rStart: number, cStart: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[rStart + r][cStart + c] = true;
        }
      }
    }
  };
  drawCorner(0, 0);
  drawCorner(0, size - 7);
  drawCorner(size - 7, 0);

  // Fill in data dots deterministically from code string
  let seed = 0;
  for (let i = 0; i < code.length; i++) {
    seed = (seed * 31 + code.charCodeAt(i)) % 9973;
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Don't overwrite finder patterns
      if ((r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8)) {
        continue;
      }
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      matrix[r][c] = (seed % 100) > 46;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header bar */}
        <div className="bg-amber-400 px-6 py-4 flex items-center justify-between text-slate-950">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950"></span>
            <span className="font-bold text-sm tracking-wide uppercase">Official Pickup Pass</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-amber-500/40 hover:bg-amber-500/60 flex items-center justify-center transition-colors text-slate-900"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-center">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            Claim Confirmed
          </p>
          <h3 className="text-xl font-bold text-slate-900 line-clamp-1 mb-4">{itemTitle}</h3>

          {/* QR Code Container */}
          <div className="mx-auto w-52 h-52 p-3 bg-white border-2 border-slate-900 rounded-2xl shadow-sm flex items-center justify-center relative">
            <svg viewBox="0 0 21 21" className="w-full h-full shape-rendering-crispEdges">
              {matrix.map((row, r) =>
                row.map((active, c) =>
                  active ? (
                    <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#0f172a" />
                  ) : null
                )
              )}
            </svg>
            {/* Center mini UW logo badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-9 h-9 rounded-lg bg-amber-400 border-2 border-slate-900 flex items-center justify-center shadow-md">
                <span className="text-slate-950 font-black text-xs tracking-tighter">UW</span>
              </div>
            </div>
          </div>

          {/* 6-character pickup code */}
          <div className="mt-4 inline-block bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
            <p className="text-[11px] text-slate-500 font-medium">Pickup verification code</p>
            <p className="text-2xl font-mono font-bold tracking-widest text-slate-950">{code}</p>
          </div>

          {/* Desk & Pickup details */}
          <div className="mt-5 text-left bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs text-slate-700">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">{desk.name}</p>
                <p className="text-slate-500">{desk.room}, {desk.building}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-800">{desk.hours}</p>
                <p className="text-amber-700 font-medium mt-0.5">Hold expires: {holdExpiresAt}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Show this screen or quote the 6-character code at the desk</span>
          </div>

          {onWrongClaim && !confirming && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="mt-4 w-full py-2.5 px-4 rounded-xl border border-rose-300 text-rose-800 font-bold text-xs"
            >
              Wrong claim
            </button>
          )}
          {onWrongClaim && confirming && (
            <div className="mt-4 text-left space-y-2">
              <p className="text-xs text-slate-600">
                This is not your item. The claim will be cancelled. The item stays at the desk, and your lost report stays on your account.
              </p>
              {error && <p className="text-xs text-rose-700">{error}</p>}
              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={() => setConfirming(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-xs font-bold">Keep claim</button>
                <button type="button" disabled={busy} onClick={() => void cancelClaim()} className="flex-1 py-2.5 rounded-xl bg-rose-700 text-white text-xs font-bold">
                  {busy ? 'Cancelling…' : 'Wrong claim'}
                </button>
              </div>
            </div>
          )}

          {onSimulateStaffScan && (
            <button
              onClick={() => {
                onSimulateStaffScan();
                onClose();
              }}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Demo Staff Hand-Off (Scan this code now)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

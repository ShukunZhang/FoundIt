import React, { useEffect, useState } from 'react';
import { 
  Scan, 
  QrCode, 
  CheckCircle2, 
  UserCheck, 
  Package, 
  MapPin, 
  Search, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { FoundItem } from '../types';

interface StaffScanCodeProps {
  items: FoundItem[];
  onCompletePickup: (itemId: string) => void;
  onAcceptDropOff: (itemId: string, storageSpot: string) => void;
  initialCode?: string;
  onScanReturnTag?: (code: string) => Promise<void>;
}

export const StaffScanCode: React.FC<StaffScanCodeProps> = ({
  items,
  onCompletePickup,
  onAcceptDropOff,
  initialCode = '',
  onScanReturnTag,
}) => {
  const [codeInput, setCodeInput] = useState(initialCode);
  const [matchedItem, setMatchedItem] = useState<FoundItem | null>(null);
  const [codeType, setCodeType] = useState<'pickup' | 'dropoff' | null>(null);
  const [storageSpot, setStorageSpot] = useState('Shelf A-1');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Available test codes in current mock data for instant 1-tap testing
  const samplePickupItems = items.filter(
    (i) => i.claim?.pickupCode && i.status !== 'picked-up'
  );
  const sampleDropOffItems = items.filter(
    (i) => i.dropOffCode && i.status === 'in-transit'
  );

  const handleLookup = (code: string) => {
    setFeedbackMsg(null);
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    // Check if it's a pickup code
    const pickupMatch = items.find(
      (i) => i.claim?.pickupCode?.toUpperCase() === cleanCode
    );

    if (pickupMatch) {
      setMatchedItem(pickupMatch);
      setCodeType('pickup');
      return;
    }

    // Check if it's a dropoff code
    const dropoffMatch = items.find(
      (i) => i.dropOffCode?.toUpperCase() === cleanCode
    );

    if (dropoffMatch) {
      setMatchedItem(dropoffMatch);
      setCodeType('dropoff');
      return;
    }

    if (cleanCode.startsWith('WAT-') && onScanReturnTag) {
      void onScanReturnTag(cleanCode).then(() => {
        setFeedbackMsg({ type: 'success', text: `Return tag ${cleanCode} scanned. The owner was notified, and their contact details stayed private.` });
      }).catch((scanError: unknown) => {
        setFeedbackMsg({ type: 'error', text: scanError instanceof Error ? scanError.message : 'Unknown return tag.' });
      });
      return;
    }

    setMatchedItem(null);
    setCodeType(null);
    setFeedbackMsg({
      type: 'error',
      text: `Code "${cleanCode}" was not found or has already been fulfilled.`,
    });
  };

  useEffect(() => {
    if (initialCode) handleLookup(initialCode);
    // Prefill once when a student pickup pass hands the code over.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  const handleVerifyPickup = () => {
    if (!matchedItem) return;
    onCompletePickup(matchedItem.id);
    setFeedbackMsg({
      type: 'success',
      text: `Pickup verified! "${matchedItem.title}" has been marked as Picked Up and handed to ${matchedItem.claim?.claimantName || 'student'}.`,
    });
    setMatchedItem(null);
    setCodeInput('');
  };

  const handleConfirmDropOff = () => {
    if (!matchedItem) return;
    onAcceptDropOff(matchedItem.id, storageSpot);
    setFeedbackMsg({
      type: 'success',
      text: `Drop-off accepted! "${matchedItem.title}" is now Available in desk inventory (${storageSpot}). Finder thank-you dispatched.`,
    });
    setMatchedItem(null);
    setCodeInput('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Search / Scan Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Scan Pickup or Drop-Off Code</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter or scan a 6-character student pickup code (e.g. <code>WLO-204</code>) or a finder's drop-off code (e.g. <code>DROP-419</code>).
          </p>
        </div>

        {/* Code Input Form */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <QrCode className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value.toUpperCase());
                handleLookup(e.target.value);
              }}
              placeholder="e.g. WLO-204 or DROP-419"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold tracking-wider text-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase"
            />
          </div>
          <button
            onClick={() => handleLookup(codeInput)}
            className="py-3 px-5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Search className="w-4 h-4 text-amber-400" />
            <span>Look Up</span>
          </button>
        </div>

        {/* Quick Demo Test Pill Badges */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Quick 1-Tap Demo Codes (Click to auto-fill)
          </p>
          <div className="flex flex-wrap gap-2">
            {samplePickupItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCodeInput(item.claim!.pickupCode);
                  handleLookup(item.claim!.pickupCode);
                }}
                className="py-1 px-2.5 rounded-lg bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-mono text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <span>Pickup:</span>
                <span className="underline">{item.claim!.pickupCode}</span>
                <span className="text-[10px] text-emerald-700 font-sans font-normal">({item.title.split(' ')[0]})</span>
              </button>
            ))}

            {sampleDropOffItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCodeInput(item.dropOffCode!);
                  handleLookup(item.dropOffCode!);
                }}
                className="py-1 px-2.5 rounded-lg bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 font-mono text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <span>Drop-off:</span>
                <span className="underline">{item.dropOffCode}</span>
                <span className="text-[10px] text-amber-700 font-sans font-normal">({item.title.split(' ')[0]})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-2.5 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border border-rose-300 text-rose-950'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Matched Record Display */}
      {matchedItem && codeType === 'pickup' && (
        <div className="bg-white rounded-3xl border-2 border-emerald-400 p-6 shadow-md space-y-5 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Valid Student Pickup Pass</span>
            </span>
            <span className="font-mono text-base font-bold text-slate-900">
              {matchedItem.claim?.pickupCode}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 font-medium">Claimant Information</p>
              <h3 className="text-base font-bold text-slate-900">{matchedItem.claim?.claimantName}</h3>
              <p className="text-xs text-slate-600">{matchedItem.claim?.claimantEmail}</p>
              <p className="text-[11px] text-slate-500 mt-1">Claimed: {matchedItem.claim?.claimedAt?.slice(0, 10)}</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-400 font-medium">Item to Retrieve</p>
              <h4 className="text-sm font-bold text-slate-900">{matchedItem.title}</h4>
              <p className="text-xs text-slate-600 mt-0.5">Desk: {matchedItem.desk}</p>
              <p className="text-xs font-bold text-amber-800 mt-1">
                Storage Spot: {matchedItem.storageSpot || 'Front Desk Bin A'}
              </p>
            </div>
          </div>

          {/* Student distinguishing detail note */}
          {(matchedItem.claim?.distinguishingDetail || matchedItem.claim?.verificationAnswer) && (
            <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-950">
              <p className="font-bold mb-0.5">Verification Detail Provided by Student:</p>
              <p className="italic">
                "{matchedItem.claim.distinguishingDetail || matchedItem.claim.verificationAnswer}"
              </p>
            </div>
          )}

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => {
                setMatchedItem(null);
                setCodeInput('');
              }}
              className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleVerifyPickup}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify WatCard ID & Hand Over Item (Close Pickup)</span>
            </button>
          </div>
        </div>
      )}

      {/* Matched Record Display: Drop-off code */}
      {matchedItem && codeType === 'dropoff' && (
        <div className="bg-white rounded-3xl border-2 border-amber-400 p-6 shadow-md space-y-5 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-800" />
              <span>Pending Finder Drop-Off Code</span>
            </span>
            <span className="font-mono text-base font-bold text-slate-900">
              {matchedItem.dropOffCode}
            </span>
          </div>

          <div>
            <p className="text-xs text-slate-400 font-medium">Pre-Filled Item Details from Finder</p>
            <h3 className="text-base font-bold text-slate-900">{matchedItem.title}</h3>
            <p className="text-xs text-slate-600 mt-1">
              Category: <strong className="capitalize">{matchedItem.category}</strong> · Colour: {matchedItem.colour}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Found at: {matchedItem.locationFound || 'Campus area'}
            </p>
          </div>

          {/* Storage Spot Assignment */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900">
              Assign Permanent Desk Storage Spot
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={storageSpot}
                onChange={(e) => setStorageSpot(e.target.value)}
                placeholder="e.g. Shelf B-2, Safe Drawer 1"
                className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 font-semibold"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              The item will transition from "In transit" to "Available at desk" and trigger matching search alerts.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => {
                setMatchedItem(null);
                setCodeInput('');
              }}
              className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDropOff}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Accept Item into Inventory & Notify Finder</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

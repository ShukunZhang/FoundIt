import React, { useState, useEffect } from 'react';
import { 
  X, 
  Camera, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  ArrowRight,
  CreditCard,
  QrCode
} from 'lucide-react';
import { Category, FoundItem, PhotoScanResult } from '../types';
import { getNearestDesk, CAMPUS_DESKS } from '../mockData';
import { PhotoScanField } from './PhotoScanField';

interface ReportFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (reportedItem: Omit<FoundItem, 'id' | 'dateLogged' | 'daysAgo'> & { photoFile?: File | null }) => Promise<{
    item: FoundItem;
    dropOffCode: string;
    matchedAlert: boolean;
  }>;
}

const CATEGORIES: { id: Category; label: string; valuable: boolean }[] = [
  { id: 'WatCard', label: 'WatCard', valuable: true },
  { id: 'wallet', label: 'Wallet', valuable: true },
  { id: 'electronics', label: 'Electronics', valuable: true },
  { id: 'keys', label: 'Keys', valuable: false },
  { id: 'bottle', label: 'Bottle', valuable: false },
  { id: 'clothing', label: 'Clothing', valuable: false },
  { id: 'bag', label: 'Bag', valuable: false },
  { id: 'supplies', label: 'Supplies', valuable: false },
  { id: 'other', label: 'Other', valuable: false },
];

export const ReportFoundModal: React.FC<ReportFoundModalProps> = ({
  isOpen,
  onClose,
  onSubmitReport,
}) => {
  const [category, setCategory] = useState<Category>('keys');
  const [colour, setColour] = useState('');
  const [locationFound, setLocationFound] = useState('');
  const [publicDescription, setPublicDescription] = useState('');
  const [watcardName, setWatcardName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [suggestedDesk, setSuggestedDesk] = useState('SLC Front Desk');
  const [deskReason, setDeskReason] = useState('Central 24/7 campus desk.');
  const [submittedResult, setSubmittedResult] = useState<{
    item: FoundItem;
    dropOffCode: string;
    matchedAlert: boolean;
  } | null>(null);

  useEffect(() => {
    if (locationFound) {
      const rec = getNearestDesk(locationFound);
      setSuggestedDesk(rec.desk);
      setDeskReason(rec.reason);
    }
  }, [locationFound]);

  if (!isOpen) return null;

  const currentCategoryMeta = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];
  const isValuable = currentCategoryMeta.valuable;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const title = category === 'WatCard'
      ? `WatCard - ${watcardName.trim() || 'Student'}`
      : `${colour || 'Item'} ${currentCategoryMeta.label}`;

    const reportData = {
      title,
      category,
      colour: colour.trim() || 'Standard',
      publicDescription: publicDescription.trim() || `${colour} ${currentCategoryMeta.label}`,
      detailedDescription: `Found at ${locationFound}. ${publicDescription.trim()}`,
      desk: suggestedDesk,
      status: 'in-transit' as const,
      valuable: isValuable,
      watcardName: category === 'WatCard' ? watcardName.trim() : undefined,
      locationFound: locationFound.trim() || 'Campus',
      photoFile,
    };

    const res = await onSubmitReport(reportData);
    setSubmittedResult(res);
  };

  const deskDetails = CAMPUS_DESKS[suggestedDesk];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm tracking-wide">Report a Found Item</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center transition-colors text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {submittedResult ? (
            <div className="space-y-5 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-xl font-bold text-slate-900">Thank You, Good Samaritan!</h4>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Your report has been logged. The item now appears in campus search as <strong>"In transit to {suggestedDesk}"</strong>.
                </p>
              </div>

              {/* WatCard notification notice */}
              {category === 'WatCard' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-left text-amber-900 flex items-start gap-2.5">
                  <CreditCard className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Owner Notification Dispatched</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      If a FoundIt account uses the name <strong>{watcardName || 'on the card'}</strong>, that student gets an in-app notice. No email is sent.
                    </p>
                  </div>
                </div>
              )}

              {/* Matching Notify Me alert notice */}
              {submittedResult.matchedAlert && (
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 text-xs text-left text-sky-900">
                  <p className="font-bold">⚡ Instant Student Match!</p>
                  <p className="text-[11px] text-sky-800 mt-0.5">
                    A student with a matching "Notify Me" alert was automatically alerted: <em>"Is this yours?"</em>
                  </p>
                </div>
              )}

              {/* Drop-off Code Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                <p className="text-xs text-slate-500 font-medium">Your Finder Drop-Off Code</p>
                <p className="text-3xl font-mono font-black text-slate-950 tracking-widest my-1">
                  {submittedResult.dropOffCode}
                </p>
                <p className="text-[11px] text-slate-500">
                  Quote this code at the desk so staff can quickly confirm intake.
                </p>
              </div>

              {/* Recommended Drop-off Location */}
              <div className="text-left bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <Navigation className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">Please drop off at: {suggestedDesk}</p>
                    <p className="text-slate-600">{deskDetails?.room}, {deskDetails?.building}</p>
                    <p className="text-[11px] text-amber-800 font-medium mt-1">
                      Hours: {deskDetails?.hours}
                    </p>
                  </div>
                </div>
                {isValuable && (
                  <p className="text-[11px] text-rose-700 font-semibold pt-1 border-t border-amber-200/60">
                    Important: For valuable items (phones, wallets, laptops), please hand directly to desk staff or UW Police Services (SLC 1st Floor).
                  </p>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Upload Simulator */}
              <PhotoScanField
                onScanned={(result: PhotoScanResult) => {
                  setPhotoFile(result.file);
                  if (result.colour) setColour(result.colour);
                  if (result.category) setCategory(result.category);
                  if (result.description) setPublicDescription(result.description);
                }}
              />

              {/* Category Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`px-2 py-1.5 text-xs font-semibold rounded-lg capitalize border transition-all text-center ${
                        category === cat.id
                          ? 'bg-amber-400 text-slate-950 border-amber-500 font-bold shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* WatCard Special Name input */}
              {category === 'WatCard' && (
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold text-amber-950">
                    Full Name Printed on WatCard <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={watcardName}
                    onChange={(e) => setWatcardName(e.target.value)}
                    placeholder="e.g. Lily Lu or Marcus Chen"
                    className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  <p className="text-[11px] text-amber-800">
                    We will instantly match this name against campus directories to alert the student!
                  </p>
                </div>
              )}

              {/* Colour & Public Description */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Primary Colour <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={colour}
                    onChange={(e) => setColour(e.target.value)}
                    placeholder="e.g. Black, Navy, Yellow"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={publicDescription}
                    onChange={(e) => setPublicDescription(e.target.value)}
                    placeholder="e.g. Hydro flask with sticker, gym bag"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Location Found (Building + Room) */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Where did you find it? (Building + Room) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={locationFound}
                    onChange={(e) => setLocationFound(e.target.value)}
                    placeholder="e.g. MC 3004, DC Library 1st floor, PAC gym"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Type a building code (MC, DC, DP, PAC, REV, SLC) to calculate the nearest desk.
                </p>
              </div>

              {/* Suggested Desk Recommendation Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Recommended Drop-Off Desk
                  </span>
                  <span className="text-[11px] text-amber-700 font-semibold">Nearest to location</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <Navigation className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">{suggestedDesk}</p>
                    <p className="text-slate-500 text-[11px]">{deskReason}</p>
                  </div>
                </div>
              </div>

              {/* Valuable Advisory */}
              {isValuable && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Valuable Item Safety:</span> Please bring this item directly to a staffed desk or UW Police Services for secure storage.
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-xs transition-colors"
                >
                  Publish Report & Get Code
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

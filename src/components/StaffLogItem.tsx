import React, { useState } from 'react';
import { 
  Camera, 
  Sparkles, 
  CreditCard, 
  CheckCircle2, 
  MapPin, 
  Lock, 
  Clock, 
  Archive,
  Tag
} from 'lucide-react';
import { Category, FoundItem, PhotoScanResult } from '../types';
import { CAMPUS_DESKS } from '../mockData';
import { PhotoScanField } from './PhotoScanField';

interface StaffLogItemProps {
  selectedDesk: string;
  onItemLogged: (item: FoundItem & { photoFile?: File | null }) => Promise<{ matchedAlert: boolean; matchedWatcard: boolean }>;
}

const CATEGORIES: { id: Category; label: string; valuable: boolean }[] = [
  { id: 'WatCard', label: 'WatCard', valuable: true },
  { id: 'wallet', label: 'Wallet', valuable: true },
  { id: 'electronics', label: 'Electronics', valuable: true },
  { id: 'keys', label: 'Keys', valuable: false },
  { id: 'bottle', label: 'Bottle / Mug', valuable: false },
  { id: 'clothing', label: 'Clothing', valuable: false },
  { id: 'bag', label: 'Bag', valuable: false },
  { id: 'supplies', label: 'Supplies', valuable: false },
  { id: 'other', label: 'Other', valuable: false },
];

const COLOURS = [
  'Black',
  'White',
  'Navy Blue',
  'Grey',
  'Yellow',
  'Red',
  'Green',
  'Purple',
  'Brown',
];

const STORAGE_PRESETS = [
  'Safe Drawer 1',
  'Safe Drawer 2',
  'Shelf A-1',
  'Shelf B-2',
  'Key Box A',
  'Bin Apparel-1',
  'Lockbox Tech',
];

export const StaffLogItem: React.FC<StaffLogItemProps> = ({
  selectedDesk,
  onItemLogged,
}) => {
  const currentDesk = selectedDesk === 'All Desks' ? 'SLC Front Desk' : selectedDesk;

  const [category, setCategory] = useState<Category>('WatCard');
  const [colour, setColour] = useState('Black');
  const [storageSpot, setStorageSpot] = useState('Safe Drawer 1');
  const [customStorage, setCustomStorage] = useState('');
  const [watcardName, setWatcardName] = useState('Lily Lu');
  const [watcardId, setWatcardId] = useState('20894123');
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [desk, setDesk] = useState(currentDesk);
  const [successResult, setSuccessResult] = useState<{
    item: FoundItem;
    matchedAlert: boolean;
    matchedWatcard: boolean;
  } | null>(null);

  const isWatcard = category === 'WatCard';
  const isValuable = CATEGORIES.find((c) => c.id === category)?.valuable || false;

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();

    const timestamp = '2026-11-06';
    const finalStorage = customStorage.trim() || storageSpot;

    const title = isWatcard
      ? `WatCard - ${watcardName.trim() || 'Student'}`
      : `${colour} ${category.charAt(0).toUpperCase() + category.slice(1)}`;

    const newItem: FoundItem = {
      id: `item-${Date.now()}`,
      title,
      category,
      colour,
      publicDescription: isWatcard
        ? 'University of Waterloo WatCard (Undergraduate)'
        : isValuable
        ? `${colour} ${category}`
        : `${colour} ${category} at ${desk}`,
      detailedDescription: isWatcard
        ? `WatCard belonging to ${watcardName.trim()}${watcardId ? `, ID: ${watcardId}` : ''}.`
        : notes.trim() || `${colour} ${category} intake at ${desk}`,
      desk,
      dateLogged: timestamp,
      daysAgo: 0,
      status: 'available',
      valuable: isValuable,
      storageSpot: finalStorage,
      watcardName: isWatcard ? watcardName.trim() : undefined,
      photoFile,
    };

    const res = await onItemLogged(newItem);
    setSuccessResult({
      item: newItem,
      matchedAlert: res.matchedAlert,
      matchedWatcard: res.matchedWatcard,
    });
  };

  const resetForm = () => {
    setSuccessResult(null);
    setNotes('');
    setCustomStorage('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-16">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">Fast Item Intake</h2>
            <p className="text-xs text-slate-500">
              Minimal typing, auto-timestamp, and automatic student directory matching.
            </p>
          </div>
          <div className="bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{new Date().toLocaleDateString()} (Auto)</span>
          </div>
        </div>

        {successResult ? (
          <div className="text-center py-8 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-950">
                Item Successfully Logged & Tagged!
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Stored in <strong>{successResult.item.storageSpot}</strong> at <strong>{successResult.item.desk}</strong>.
              </p>
            </div>

            {/* Special WatCard notification confirmation */}
            {successResult.matchedWatcard && (
              <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl text-left text-xs text-amber-950 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-700" />
                  <span>Owner Notification Dispatched Instantly!</span>
                </p>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  If a FoundIt account uses the name <strong>{successResult.item.watcardName}</strong>, that student gets an in-app notice that the card is at {successResult.item.desk}. No email is sent.
                </p>
              </div>
            )}

            {/* Matched student notify-me alert */}
            {successResult.matchedAlert && (
              <div className="bg-sky-50 border border-sky-300 p-4 rounded-2xl text-left text-xs text-sky-950 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-700" />
                  <span>Student "Notify Me" Match Triggered!</span>
                </p>
                <p className="text-[11px] text-sky-900 leading-relaxed">
                  A matching lost item alert was detected. An in-app prompt: <em>"Is this yours?"</em> has been sent to the student.
                </p>
              </div>
            )}

            <button
              onClick={resetForm}
              className="py-3 px-6 rounded-xl bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-xs"
            >
              Log Another Item
            </button>
          </div>
        ) : (
          <form onSubmit={handleLog} className="pt-4 space-y-5">
            {/* Desk Location Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Intake Desk Location
              </label>
              <select
                value={desk}
                onChange={(e) => setDesk(e.target.value)}
                className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {Object.keys(CAMPUS_DESKS).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Photo-First Tap Target */}
            <PhotoScanField
              onScanned={(result: PhotoScanResult) => {
                setPhotoFile(result.file);
                if (result.colour) setColour(result.colour);
                if (result.category) setCategory(result.category);
                if (result.description) setNotes(result.description);
              }}
            />

            {/* Category - Big Tap Targets */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2">
                Category (Big Tap Targets)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-3 rounded-xl font-bold text-xs border text-left flex flex-col justify-between h-16 transition-all ${
                      category === cat.id
                        ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="text-[10px] opacity-70">
                      {cat.valuable ? '🔒 60d Valuable' : '30d Policy'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Special WatCard Student Lookup */}
            {isWatcard && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-800" />
                  <span className="text-xs font-bold text-amber-950">
                    WatCard Student Directory Integration
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Full Name on WatCard <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={watcardName}
                      onChange={(e) => setWatcardName(e.target.value)}
                      placeholder="e.g. Lily Lu"
                      className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Student ID (8 Digits)
                    </label>
                    <input
                      type="text"
                      value={watcardId}
                      onChange={(e) => setWatcardId(e.target.value)}
                      placeholder="e.g. 20894123"
                      className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-amber-800">
                  Tip: Logging a card belonging to "Lily Lu" will immediately notify the sample student profile in Student View!
                </p>
              </div>
            )}

            {/* Colour Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Primary Colour
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COLOURS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setColour(col)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      colour === col
                        ? 'bg-amber-400 text-slate-950 border-amber-500 font-bold shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>

            {/* Storage Spot Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Storage Spot (Bin / Drawer / Shelf)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {STORAGE_PRESETS.map((spot) => (
                  <button
                    key={spot}
                    type="button"
                    onClick={() => {
                      setStorageSpot(spot);
                      setCustomStorage('');
                    }}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                      storageSpot === spot && !customStorage
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {spot}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customStorage}
                onChange={(e) => setCustomStorage(e.target.value)}
                placeholder="Or type custom storage code (e.g. Locker 14, Bin C-4)..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Short Staff Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Internal Staff Notes <span className="text-slate-400 font-normal">(Private)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Found on 2nd floor, contains cards and cash, slight scratch on corner"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm shadow-md transition-colors active:scale-[0.99]"
            >
              Log Item to {desk} (Save & Tag)
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

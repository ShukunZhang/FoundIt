import React, { useState } from 'react';
import { CheckCircle2, Clock, MapPin } from 'lucide-react';
import { Category, FoundItem, PhotoScanResult } from '../types';
import { CAMPUS_DESKS } from '../mockData';
import { CATEGORY_OPTIONS, categoryIsValuable } from '../lib/categories';
import { PhotoScanField } from './PhotoScanField';

interface StaffLogItemProps {
  selectedDesk: string;
  staffName: string;
  onItemLogged: (item: FoundItem & { photoFile?: File | null }) => Promise<{ itemCode: string }>;
}

const COLOURS = ['Black', 'White', 'Navy Blue', 'Grey', 'Yellow', 'Red', 'Green', 'Purple', 'Brown'];

export const StaffLogItem: React.FC<StaffLogItemProps> = ({ selectedDesk, staffName, onItemLogged }) => {
  const lockedDesk = selectedDesk !== 'All Desks' ? selectedDesk : '';
  const [category, setCategory] = useState<Category>('WatCard');
  const [colour, setColour] = useState('Black');
  const [locationFound, setLocationFound] = useState('');
  const [storageSpot, setStorageSpot] = useState('');
  const [notes, setNotes] = useState('');
  const [watcardName, setWatcardName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [subcategory, setSubcategory] = useState('');
  const [brand, setBrand] = useState('');
  const [parsedDetails, setParsedDetails] = useState('');
  const [desk, setDesk] = useState(lockedDesk || 'SLC Front Desk');
  const [itemCode, setItemCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const deskName = lockedDesk || desk;
  const valuable = categoryIsValuable(category);

  const handleLog = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const title = category === 'WatCard'
      ? `WatCard${watcardName.trim() ? ` - ${watcardName.trim()}` : ''}`
      : `${colour} ${category}`;
    try {
      const result = await onItemLogged({
        id: '',
        title,
        category,
        colour,
        subcategory: subcategory || undefined,
        brand: brand || undefined,
        publicDescription: parsedDetails || notes.trim() || `${colour} ${category}`,
        distinctiveFeatures: parsedDetails || undefined,
        detailedDescription: notes.trim() || parsedDetails || undefined,
        desk: deskName,
        dateLogged: new Date().toISOString().slice(0, 10),
        daysAgo: 0,
        status: 'available',
        valuable,
        storageSpot: storageSpot.trim() || undefined,
        locationFound: locationFound.trim(),
        watcardName: category === 'WatCard' ? watcardName.trim() : undefined,
        photoFile,
      });
      setItemCode(result.itemCode);
    } catch (logError) {
      setError(logError instanceof Error ? logError.message : 'Could not log this item.');
    } finally {
      setBusy(false);
    }
  };

  const resetForm = () => {
    setItemCode('');
    setLocationFound('');
    setStorageSpot('');
    setNotes('');
    setWatcardName('');
    setPhotoFile(null);
    setSubcategory('');
    setBrand('');
    setParsedDetails('');
    setError('');
  };

  return (
    <div className="max-w-2xl mx-auto pb-16">
      <div className="bg-white p-5 rounded-3xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">Log a found item</h2>
            <p className="text-xs text-slate-500">Staff desk and the date are filled in. You add the photo, details, and location.</p>
          </div>
          <div className="bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {itemCode ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Item code</p>
              <p className="font-mono text-4xl font-black text-slate-950 mt-1">{itemCode}</p>
              <p className="text-xs text-slate-600 mt-2">Write this on the tag. Students will show the same code at {deskName}.</p>
            </div>
            <button type="button" onClick={resetForm} className="py-3 px-6 rounded-xl bg-slate-950 text-white font-bold text-xs">
              Log another item
            </button>
          </div>
        ) : (
          <form onSubmit={(event) => void handleLog(event)} className="pt-4 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <p className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <span className="block font-bold text-slate-900">Logged by</span>
                <span className="text-slate-600">{staffName || 'Desk staff'}</span>
              </p>
              <p className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <span className="block font-bold text-slate-900 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Desk</span>
                {lockedDesk ? (
                  <span className="text-slate-600">{lockedDesk}</span>
                ) : (
                  <select value={desk} onChange={(event) => setDesk(event.target.value)} className="mt-1 w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold">
                    {Object.keys(CAMPUS_DESKS).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                )}
              </p>
            </div>

            <PhotoScanField
              onScanned={(result: PhotoScanResult) => {
                setPhotoFile(result.file);
                if (result.colour) setColour(result.colour);
                if (result.category) setCategory(result.category);
                if (result.subcategory) setSubcategory(result.subcategory);
                if (result.brand) setBrand(result.brand);
                const detail = [result.description, result.distinctiveFeatures].filter(Boolean).join('. ');
                if (result.description) setNotes(result.description);
                if (detail) setParsedDetails(detail);
                if (result.locationDetail) setLocationFound(result.locationDetail);
              }}
            />

            <div>
              <p className="text-xs font-bold text-slate-900 mb-2">Category</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setCategory(option.id)}
                    className={`p-3 rounded-xl text-xs font-bold text-left border ${category === option.id ? 'bg-slate-950 text-white border-slate-950' : 'bg-slate-50 text-slate-800 border-slate-200'}`}
                  >
                    <span className="block">{option.label}</span>
                    <span className="text-[10px] opacity-70">{option.valuable ? 'Valuable' : 'Non-valuable'}</span>
                  </button>
                ))}
              </div>
            </div>

            {category === 'WatCard' && (
              <label className="block text-xs font-bold text-slate-900">
                Name on the WatCard
                <input value={watcardName} onChange={(event) => setWatcardName(event.target.value)} className="mt-1 w-full text-xs p-2.5 rounded-xl border border-slate-300 font-normal" />
              </label>
            )}

            <div>
              <p className="text-xs font-bold text-slate-900 mb-1.5">Colour</p>
              <div className="flex flex-wrap gap-1.5">
                {COLOURS.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => setColour(swatch)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${colour === swatch ? 'bg-amber-400 border-amber-500 text-slate-950' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                  >
                    {swatch}
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-xs font-bold text-slate-900">
              Where it was found
              <input required value={locationFound} onChange={(event) => setLocationFound(event.target.value)} placeholder="Building, room, or nearby landmark" className="mt-1 w-full text-xs p-2.5 rounded-xl border border-slate-300 font-normal" />
            </label>

            <label className="block text-xs font-bold text-slate-900">
              Kept in <span className="font-normal text-slate-400">(optional)</span>
              <input value={storageSpot} onChange={(event) => setStorageSpot(event.target.value)} placeholder="Drawer, bin, or shelf" className="mt-1 w-full text-xs p-2.5 rounded-xl border border-slate-300 font-normal" />
            </label>

            <label className="block text-xs font-bold text-slate-900">
              Notes <span className="font-normal text-slate-400">(staff only)</span>
              <input value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 w-full text-xs p-2.5 rounded-xl border border-slate-300 font-normal" />
            </label>

            {error && <p className="text-xs text-rose-700">{error}</p>}
            <button disabled={busy} className="w-full py-3.5 rounded-2xl bg-amber-400 text-slate-950 font-extrabold text-sm">
              {busy ? 'Saving…' : `Log item at ${deskName}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

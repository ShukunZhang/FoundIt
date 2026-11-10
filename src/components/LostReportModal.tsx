import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Category, PhotoScanResult } from '../types';
import { CATEGORY_OPTIONS, SUBCATEGORIES } from '../lib/categories';
import { PhotoScanField } from './PhotoScanField';

export interface LostReportDraft {
  title: string;
  category: Category;
  subcategory: string;
  colour: string;
  brand: string;
  description: string;
  distinctiveFeatures: string;
  privateDetails: string;
  building: string;
  locationDetail: string;
  lostAt: string;
  photo: File | null;
}

interface LostReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (draft: LostReportDraft) => Promise<void>;
}

export const LostReportModal: React.FC<LostReportModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [draft, setDraft] = useState<LostReportDraft>({
    title: '',
    category: 'bottle',
    subcategory: '',
    colour: '',
    brand: '',
    description: '',
    distinctiveFeatures: '',
    privateDetails: '',
    building: 'DC',
    locationDetail: '',
    lostAt: new Date().toISOString().slice(0, 16),
    photo: null,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const applyScan = (result: PhotoScanResult) => {
    setDraft((current) => ({
      ...current,
      photo: result.file,
      colour: result.colour || current.colour,
      category: result.category ?? current.category,
      subcategory: result.subcategory || current.subcategory,
      brand: result.brand || current.brand,
      distinctiveFeatures: result.distinctiveFeatures || current.distinctiveFeatures,
      description: result.description || current.description,
    }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSubmit(draft);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save the report.');
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full text-xs p-2.5 rounded-xl border border-slate-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <form onSubmit={(event) => void submit(event)} className="w-full max-w-lg bg-white rounded-3xl p-5 space-y-3 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="font-bold">Report a lost item</h2>
          <button type="button" onClick={onClose} aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <PhotoScanField onScanned={applyScan} />
        <input required className={field} placeholder="Item name" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <select className={field} value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as Category })}>
            {CATEGORY_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
          <select className={field} value={draft.subcategory} onChange={(event) => setDraft({ ...draft, subcategory: event.target.value })}>
            <option value="">Subcategory</option>
            {SUBCATEGORIES[draft.category].map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input required className={field} placeholder="Colour" value={draft.colour} onChange={(event) => setDraft({ ...draft, colour: event.target.value })} />
          <input className={field} placeholder="Brand" value={draft.brand} onChange={(event) => setDraft({ ...draft, brand: event.target.value })} />
        </div>
        <textarea required className={field} rows={2} placeholder="What it looks like" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
        <input className={field} placeholder="Distinctive detail (sticker, scratch, engraving)" value={draft.distinctiveFeatures} onChange={(event) => setDraft({ ...draft, distinctiveFeatures: event.target.value })} />
        <input className={field} placeholder="Private detail only you and staff should see" value={draft.privateDetails} onChange={(event) => setDraft({ ...draft, privateDetails: event.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input required className={field} placeholder="Building (DC, SLC, REV…)" value={draft.building} onChange={(event) => setDraft({ ...draft, building: event.target.value })} />
          <input className={field} placeholder="Room or spot" value={draft.locationDetail} onChange={(event) => setDraft({ ...draft, locationDetail: event.target.value })} />
        </div>
        <input required type="datetime-local" className={field} value={draft.lostAt} onChange={(event) => setDraft({ ...draft, lostAt: event.target.value })} />
        {error && <p className="text-xs text-rose-700">{error}</p>}
        <button disabled={busy} className="w-full py-3 rounded-xl bg-slate-950 text-white text-xs font-bold">{busy ? 'Saving…' : 'Save lost report'}</button>
      </form>
    </div>
  );
};

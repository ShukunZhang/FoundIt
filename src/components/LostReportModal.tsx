import React, { useEffect, useState } from 'react';
import { BellRing, CheckCircle2, X } from 'lucide-react';
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

interface LostReportFormState extends Omit<LostReportDraft, 'category'> {
  category: Category | '';
}

interface LostReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (draft: LostReportDraft) => Promise<void>;
}

const field = 'w-full text-xs p-2.5 rounded-xl border border-slate-300';

function emptyDraft(): LostReportFormState {
  return {
    title: '',
    category: '',
    subcategory: '',
    colour: '',
    brand: '',
    description: '',
    distinctiveFeatures: '',
    privateDetails: '',
    building: '',
    locationDetail: '',
    lostAt: '',
    photo: null,
  };
}

function FieldLabel({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold text-slate-800">
        {label}
        {required ? (
          <>
            <span className="text-rose-600" aria-hidden="true"> *</span>
            <span className="sr-only"> required</span>
          </>
        ) : null}
      </span>
      {children}
    </label>
  );
}

export const LostReportModal: React.FC<LostReportModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [draft, setDraft] = useState<LostReportFormState>(emptyDraft);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [submittedTitle, setSubmittedTitle] = useState('');
  const [notifyConfirmed, setNotifyConfirmed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(emptyDraft());
    setError('');
    setBusy(false);
    setSubmittedTitle('');
    setNotifyConfirmed(false);
  }, [isOpen]);

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
    const title = draft.title.trim();
    if (!title || !draft.category) {
      setError('Item name and category are required.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await onSubmit({
        ...draft,
        title,
        category: draft.category,
        subcategory: draft.subcategory.trim(),
        colour: draft.colour.trim(),
        brand: draft.brand.trim(),
        description: draft.description.trim(),
        distinctiveFeatures: draft.distinctiveFeatures.trim(),
        privateDetails: draft.privateDetails.trim(),
        building: draft.building.trim(),
        locationDetail: draft.locationDetail.trim(),
      });
      setSubmittedTitle(title);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save the report.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-lg bg-white rounded-3xl p-5 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="font-bold">{submittedTitle ? 'Lost item reported' : 'Report a lost item'}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedTitle ? (
          <div className="mt-4 space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-900">{submittedTitle}</span> is saved. Campus desks will keep checking turned-in items against this report.
            </p>
            {notifyConfirmed ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-left text-xs text-amber-950">
                <p className="font-bold">We&apos;ll notify you when it gets matched</p>
                <p className="mt-1">You&apos;ll get an inbox alert that says &quot;Is this yours?&quot; when a logged item looks like this one.</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setNotifyConfirmed(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-xs font-bold text-slate-950"
              >
                <BellRing className="h-4 w-4" />
                Notify me when it gets matched
              </button>
            )}
            <button type="button" onClick={onClose} className="w-full rounded-xl bg-slate-950 py-3 text-xs font-bold text-white">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="mt-3 space-y-3">
            <p className="text-[11px] text-slate-500">
              Only the name and category are required. The rest helps matching, and you can leave it blank.
            </p>
            <PhotoScanField onScanned={applyScan} />
            <FieldLabel label="Item name" required>
              <input
                required
                className={field}
                placeholder="Blue Hydro Flask, house keys…"
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />
            </FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <FieldLabel label="Category" required>
                <select
                  required
                  className={field}
                  value={draft.category}
                  onChange={(event) => {
                    const category = event.target.value as Category | '';
                    const subcategory = category && SUBCATEGORIES[category].includes(draft.subcategory) ? draft.subcategory : '';
                    setDraft({ ...draft, category, subcategory });
                  }}
                >
                  <option value="">Choose a category</option>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <FieldLabel label="Subcategory">
                <select
                  className={field}
                  value={draft.subcategory}
                  disabled={!draft.category}
                  onChange={(event) => setDraft({ ...draft, subcategory: event.target.value })}
                >
                  <option value="">Optional</option>
                  {draft.category
                    ? SUBCATEGORIES[draft.category].map((option) => (
                        <option key={option}>{option}</option>
                      ))
                    : null}
                </select>
              </FieldLabel>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FieldLabel label="Colour">
                <input className={field} placeholder="Optional" value={draft.colour} onChange={(event) => setDraft({ ...draft, colour: event.target.value })} />
              </FieldLabel>
              <FieldLabel label="Brand">
                <input className={field} placeholder="Optional" value={draft.brand} onChange={(event) => setDraft({ ...draft, brand: event.target.value })} />
              </FieldLabel>
            </div>
            <FieldLabel label="What it looks like">
              <textarea className={field} rows={2} placeholder="Optional" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            </FieldLabel>
            <FieldLabel label="Distinctive detail">
              <input className={field} placeholder="Sticker, scratch, engraving (optional)" value={draft.distinctiveFeatures} onChange={(event) => setDraft({ ...draft, distinctiveFeatures: event.target.value })} />
            </FieldLabel>
            <FieldLabel label="Private detail">
              <input className={field} placeholder="Only you and staff should see this (optional)" value={draft.privateDetails} onChange={(event) => setDraft({ ...draft, privateDetails: event.target.value })} />
            </FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <FieldLabel label="Building">
                <input className={field} placeholder="DC, SLC, REV… (optional)" value={draft.building} onChange={(event) => setDraft({ ...draft, building: event.target.value })} />
              </FieldLabel>
              <FieldLabel label="Room or spot">
                <input className={field} placeholder="Optional" value={draft.locationDetail} onChange={(event) => setDraft({ ...draft, locationDetail: event.target.value })} />
              </FieldLabel>
            </div>
            <FieldLabel label="When you last had it">
              <input type="datetime-local" className={field} value={draft.lostAt} onChange={(event) => setDraft({ ...draft, lostAt: event.target.value })} />
            </FieldLabel>
            {error && <p className="text-xs text-rose-700">{error}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-slate-950 py-3 text-xs font-bold text-white disabled:opacity-60">
              {busy ? 'Saving…' : 'Save lost report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

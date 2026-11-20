import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Hand, Search } from 'lucide-react';
import type { FoundItem } from '../types';
import { ItemPhoto } from './CategoryIcon';

interface StaffHandoffProps {
  items: FoundItem[];
  code?: string;
  onArchive: (itemCode: string, watid: string) => Promise<void>;
}

export const StaffHandoff: React.FC<StaffHandoffProps> = ({ items, code = '', onArchive }) => {
  const [codeInput, setCodeInput] = useState(() => code.trim().toUpperCase());
  const [watid, setWatid] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const normalized = codeInput.trim().toUpperCase();
  const matched = normalized
    ? items.find((entry) => entry.itemCode?.toUpperCase() === normalized && !entry.archivedAt) ?? null
    : null;
  const lookupError = normalized && !matched ? `No waiting item uses ${normalized}.` : '';

  const lookup = (raw: string) => {
    setCodeInput(raw.trim().toUpperCase());
    setMessage('');
    setError('');
  };

  const handOver = async () => {
    if (!matched?.itemCode) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await onArchive(matched.itemCode, watid);
      setMessage(`${matched.itemCode} is archived. The item was handed over.`);
      setCodeInput('');
      setWatid('');
    } catch (handoffError) {
      setError(handoffError instanceof Error ? handoffError.message : 'Could not archive this item.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-16">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Hand over by item code</h2>
          <p className="text-xs text-slate-500 mt-1">
            The student shows the code from the website and their WATID. Check the ID yourself, then archive the item.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              value={codeInput}
              onChange={(event) => lookup(event.target.value)}
              placeholder="ITM-XXXX"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold uppercase"
            />
          </div>
        </div>
        {(error || lookupError) && <p className="text-xs text-rose-700">{error || lookupError}</p>}
        {message && (
          <p className="text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {message}
          </p>
        )}
      </div>

      {matched && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handOver();
          }}
          className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4"
        >
          <div className="flex gap-3">
            <ItemPhoto item={matched} className="h-24 w-24 rounded-2xl shrink-0" />
            <div>
            <p className="font-mono text-lg font-black text-slate-950">{matched.itemCode}</p>
            <h3 className="font-bold text-slate-900">{matched.title}</h3>
            <p className="text-xs text-slate-500 mt-1">
              {matched.colour} {matched.category} · {matched.desk}
              {matched.storageSpot ? ` · Kept in ${matched.storageSpot}` : ''}
            </p>
            {matched.locationFound && <p className="text-xs text-slate-500">Found: {matched.locationFound}</p>}
            </div>
          </div>
          <label className="block text-xs font-bold text-slate-900">
            WATID on the ID you checked
            <input
              required
              value={watid}
              onChange={(event) => setWatid(event.target.value)}
              placeholder="WATID"
              className="mt-1 w-full text-sm p-3 rounded-xl border border-slate-300 font-mono"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl bg-slate-950 text-white text-sm font-bold flex items-center justify-center gap-2"
          >
            <Hand className="w-4 h-4" />
            {busy ? 'Handing over…' : 'Hand item over'}
            {!busy && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      )}
    </div>
  );
};

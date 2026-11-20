import React, { useState } from 'react';
import { CheckCircle2, Search, ShieldCheck } from 'lucide-react';
import type { FoundItem } from '../types';
import { ItemPhoto } from './CategoryIcon';

interface StaffHandoffProps {
  items: FoundItem[];
  onArchive: (itemCode: string, watid: string) => Promise<void>;
}

export const StaffHandoff: React.FC<StaffHandoffProps> = ({ items, onArchive }) => {
  const [codeInput, setCodeInput] = useState('');
  const [watid, setWatid] = useState('');
  const [matched, setMatched] = useState<FoundItem | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const lookup = (raw: string) => {
    const code = raw.trim().toUpperCase();
    setCodeInput(code);
    setMessage('');
    setError('');
    if (!code) {
      setMatched(null);
      return;
    }
    const item = items.find((entry) => entry.itemCode?.toUpperCase() === code && !entry.archivedAt);
    setMatched(item ?? null);
    if (!item) setError(`No waiting item uses ${code}.`);
  };

  const handOver = async () => {
    if (!matched?.itemCode) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await onArchive(matched.itemCode, watid);
      setMessage(`${matched.itemCode} is archived. The item was handed over.`);
      setMatched(null);
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
        {error && <p className="text-xs text-rose-700">{error}</p>}
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
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            {busy ? 'Archiving…' : 'ID checked — archive item'}
          </button>
        </form>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import type { Category, ReturnTag } from '../types';
import { CATEGORY_OPTIONS } from '../lib/categories';
import { QRCodeModal } from './QRCodeModal';

interface ReturnTagsViewProps {
  tags: ReturnTag[];
  onCreate: (label: string, category: Category, colour: string) => Promise<void>;
  onSimulateScan: (code: string) => Promise<void>;
}

export const ReturnTagsView: React.FC<ReturnTagsViewProps> = ({ tags, onCreate, onSimulateScan }) => {
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<Category>('bottle');
  const [colour, setColour] = useState('');
  const [error, setError] = useState('');
  const [active, setActive] = useState<ReturnTag | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await onCreate(label, category, colour);
      setLabel('');
      setColour('');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create a tag.');
    }
  };

  return (
    <div data-tour="tags" className="space-y-4">
      <form onSubmit={(event) => void submit(event)} className="bg-white rounded-2xl border border-slate-200 p-4 grid sm:grid-cols-4 gap-2">
        <input required value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Bottle, laptop, keys…" className="text-xs p-2.5 rounded-xl border border-slate-300 sm:col-span-2" />
        <select value={category} onChange={(event) => setCategory(event.target.value as Category)} className="text-xs p-2.5 rounded-xl border border-slate-300">
          {CATEGORY_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
        <input value={colour} onChange={(event) => setColour(event.target.value)} placeholder="Colour" className="text-xs p-2.5 rounded-xl border border-slate-300" />
        <button className="sm:col-span-4 py-2.5 rounded-xl bg-slate-950 text-white text-xs font-bold">Generate return tag</button>
        {error && <p className="sm:col-span-4 text-xs text-rose-700">{error}</p>}
      </form>
      <div className="grid sm:grid-cols-2 gap-3">
        {tags.map((tag) => (
          <article key={tag.id} className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-2xl font-mono font-black tracking-widest">{tag.code}</p>
            <p className="text-sm font-bold mt-1">{tag.label}</p>
            <p className="text-xs text-slate-500">{tag.colour} {tag.category}</p>
            <div className="flex gap-2 mt-3">
              <button type="button" className="text-xs font-bold px-3 py-2 rounded-xl bg-amber-400" onClick={() => setActive(tag)}>Show QR</button>
              <button type="button" className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-100" onClick={() => void onSimulateScan(tag.code)}>Simulate finder scan</button>
            </div>
          </article>
        ))}
      </div>
      <QRCodeModal
        isOpen={Boolean(active)}
        onClose={() => setActive(null)}
        code={active?.code ?? ''}
        itemTitle={active?.label ?? ''}
        deskName="Personal return tag"
      />
    </div>
  );
};

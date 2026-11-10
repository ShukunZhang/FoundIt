import React, { useState } from 'react';
import { X, BellRing, CheckCircle2, Sparkles, MapPin, Calendar, Tag } from 'lucide-react';
import { Category, NotifyAlert } from '../types';

interface NotifyMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: Category | 'all';
  initialSearchQuery?: string;
  onSaveAlert: (alert: Omit<NotifyAlert, 'id' | 'createdAt' | 'active'>) => void;
}

const CATEGORIES: Category[] = [
  'WatCard',
  'wallet',
  'electronics',
  'keys',
  'bottle',
  'clothing',
  'other',
];

export const NotifyMeModal: React.FC<NotifyMeModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'all',
  initialSearchQuery = '',
  onSaveAlert,
}) => {
  const [category, setCategory] = useState<Category>(
    initialCategory !== 'all' ? initialCategory : 'electronics'
  );
  const [colour, setColour] = useState('');
  const [brandOrKeyword, setBrandOrKeyword] = useState(initialSearchQuery);
  const [locationLost, setLocationLost] = useState('');
  const [dateLost, setDateLost] = useState('2026-11-06');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAlert({
      category,
      colour: colour.trim() || 'Any colour',
      brandOrKeyword: brandOrKeyword.trim() || 'Lost item',
      locationLost: locationLost.trim() || 'Campus',
      dateLost,
    });
    setSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-400 px-6 py-4 flex items-center justify-between text-slate-950">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-slate-950" />
            <h3 className="font-bold text-sm tracking-wide">Create Lost Item Alert</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-amber-500/40 hover:bg-amber-500/60 flex items-center justify-center transition-colors text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {saved ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Alert Activated!</h4>
                <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
                  We saved your alert for <span className="font-semibold text-slate-900">{brandOrKeyword || category}</span> ({colour}). As soon as a student or staff desk logs a match, we'll notify you in-app with <em>"Is this yours?"</em>
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-950 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
              >
                Back to Campus Search
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-600">
                Can't find your item right now? Tell us what you lost. Our smart matching system monitors all 5 campus desk logs 24/7.
              </p>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-2 py-1.5 text-xs font-medium rounded-lg capitalize border transition-all text-center ${
                        category === cat
                          ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colour & Brand / Keywords */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Colour
                  </label>
                  <input
                    type="text"
                    value={colour}
                    onChange={(e) => setColour(e.target.value)}
                    placeholder="e.g. Navy blue, Yellow"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Brand / Model
                  </label>
                  <input
                    type="text"
                    value={brandOrKeyword}
                    onChange={(e) => setBrandOrKeyword(e.target.value)}
                    placeholder="e.g. Hydro Flask, Apple"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    required
                  />
                </div>
              </div>

              {/* Location Lost */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Where did you lose it? (Building / Room)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={locationLost}
                    onChange={(e) => setLocationLost(e.target.value)}
                    placeholder="e.g. DC Library 2nd floor, MC 2065, or SLC"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    required
                  />
                </div>
              </div>

              {/* Date Lost */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Date Lost
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={dateLost}
                    onChange={(e) => setDateLost(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    required
                  />
                </div>
              </div>

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
                  Save Notification Alert
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

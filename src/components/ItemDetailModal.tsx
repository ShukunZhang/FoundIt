import React from 'react';
import { X, MapPin, Clock, Lock } from 'lucide-react';
import { FoundItem, UserProfile } from '../types';
import { CAMPUS_DESKS } from '../mockData';
import { studentItemLabel } from '../lib/studentView';
import { ItemPhoto } from './CategoryIcon';

interface ItemDetailModalProps {
  item: FoundItem | null;
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  user,
}) => {
  if (!isOpen || !item) return null;

  const desk = CAMPUS_DESKS[item.desk] || {
    name: item.desk,
    building: item.desk,
    room: 'Front Desk',
    hours: 'Mon–Sun: 8:00 AM – 11:00 PM',
    description: 'Campus reception desk',
    phone: '519-888-4567',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
        <div className="relative">
          <ItemPhoto item={item} className="h-56 w-full" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-3">
            <span className="bg-white text-slate-900 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm">
              Logged {item.daysAgo === 0 ? 'today' : `${item.daysAgo}d ago`}
            </span>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-semibold text-slate-700 capitalize">{item.category}</span>
              <span>·</span>
              <span>Colour: {item.colour}</span>
              {item.valuable && (
                <>
                  <span>·</span>
                  <span className="text-amber-800 font-medium flex items-center gap-0.5">
                    <Lock className="w-3 h-3" /> Valuable
                  </span>
                </>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900">{studentItemLabel(item)}</h3>
          </div>

          <div className="rounded-2xl border border-slate-900 bg-slate-950 text-white p-4 text-center">
            <p className="text-[11px] uppercase tracking-wider text-amber-300 font-bold">Item code</p>
            <p className="mt-1 font-mono text-3xl font-black tracking-wide">{item.itemCode ?? '—'}</p>
            <p className="mt-2 text-xs text-slate-300">
              Go to {desk.name}. Show this code and your WATID. Staff check the ID, then hand you the item.
            </p>
            {user.isSignedIn && user.studentId && (
              <p className="mt-2 text-xs text-amber-200">Your WATID: <span className="font-mono font-bold">{user.studentId}</span></p>
            )}
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-900">{desk.name}</p>
                <p className="text-xs text-slate-600">{desk.room}</p>
                <p className="text-[11px] text-slate-400">{desk.building}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 pt-2 border-t border-slate-200/60">
              <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-800">{desk.hours}</p>
                <p className="text-[11px] text-slate-500">Phone: {desk.phone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

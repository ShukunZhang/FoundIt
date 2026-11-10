import React from 'react';
import { 
  CreditCard, 
  Wallet, 
  Laptop, 
  Key, 
  Droplet, 
  Shirt, 
  Package,
  Backpack,
  Calculator,
  LucideIcon 
} from 'lucide-react';
import { Category } from '../types';

export const CATEGORY_META: Record<Category, { label: string; icon: LucideIcon; bg: string; text: string }> = {
  WatCard: {
    label: 'WatCard',
    icon: CreditCard,
    bg: 'bg-amber-100',
    text: 'text-amber-800',
  },
  wallet: {
    label: 'Wallet',
    icon: Wallet,
    bg: 'bg-amber-100',
    text: 'text-amber-900',
  },
  electronics: {
    label: 'Electronics',
    icon: Laptop,
    bg: 'bg-sky-100',
    text: 'text-sky-800',
  },
  keys: {
    label: 'Keys',
    icon: Key,
    bg: 'bg-violet-100',
    text: 'text-violet-800',
  },
  bottle: {
    label: 'Bottle',
    icon: Droplet,
    bg: 'bg-teal-100',
    text: 'text-teal-800',
  },
  clothing: {
    label: 'Clothing',
    icon: Shirt,
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
  },
  bag: {
    label: 'Bag',
    icon: Backpack,
    bg: 'bg-orange-100',
    text: 'text-orange-800',
  },
  supplies: {
    label: 'Supplies',
    icon: Calculator,
    bg: 'bg-lime-100',
    text: 'text-lime-800',
  },
  other: {
    label: 'Other',
    icon: Package,
    bg: 'bg-slate-100',
    text: 'text-slate-800',
  },
};

export const CategoryIcon: React.FC<{ category: Category; className?: string }> = ({ category, className = 'w-4 h-4' }) => {
  const meta = CATEGORY_META[category] || CATEGORY_META.other;
  const IconComponent = meta.icon;
  return <IconComponent className={className} />;
};

export const ItemPhotoPlaceholder: React.FC<{
  category: Category;
  colour: string;
  valuable: boolean;
  className?: string;
}> = ({ category, colour, valuable, className = 'h-40 w-full' }) => {
  const meta = CATEGORY_META[category] || CATEGORY_META.other;
  const Icon = meta.icon;

  // Render stylized SVG illustration
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-slate-100 ${className}`}>
      {/* Background patterned mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-amber-50/40" />
      
      {/* Decorative concentric rings */}
      <div className="absolute w-32 h-32 rounded-full border border-slate-200/60 -top-10 -right-10 pointer-events-none" />
      <div className="absolute w-24 h-24 rounded-full border border-amber-200/40 -bottom-6 -left-6 pointer-events-none" />

      {/* Central icon lockup */}
      <div className="relative flex flex-col items-center gap-1.5 z-10">
        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200/80 flex items-center justify-center text-slate-800">
          <Icon className="w-7 h-7 text-slate-700" />
        </div>
        <span className="text-[11px] font-semibold text-slate-600 tracking-tight">
          {colour} {meta.label}
        </span>
      </div>

      {/* WatCard special badge */}
      {category === 'WatCard' && (
        <div className="absolute top-2.5 left-2.5 bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm tracking-wider">
          WatCard ID
        </div>
      )}

      {/* Valuable badge in staff or neutral indicator */}
      {valuable && category !== 'WatCard' && (
        <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
          <span>Valuable</span>
        </div>
      )}
    </div>
  );
};

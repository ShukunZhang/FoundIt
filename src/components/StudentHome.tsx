import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  PlusCircle,
  BellRing,
  X,
  Calendar,
} from 'lucide-react';
import { Category, FoundItem } from '../types';
import { ItemCard } from './ItemCard';

interface StudentHomeProps {
  items: FoundItem[];
  onSelectItem: (item: FoundItem) => void;
  onOpenReportFound: () => void;
  onOpenLost: () => void;
  onOpenNotifyMe: (category?: Category | 'all', searchQuery?: string) => void;
}

const CATEGORIES: { id: Category | 'all'; label: string }[] = [
  { id: 'all', label: 'All Items' },
  { id: 'WatCard', label: 'WatCard' },
  { id: 'wallet', label: 'Wallets' },
  { id: 'electronics', label: 'Tech & Electronics' },
  { id: 'keys', label: 'Keys & Fobs' },
  { id: 'bottle', label: 'Bottles & Mugs' },
  { id: 'clothing', label: 'Apparel' },
  { id: 'bag', label: 'Bags' },
  { id: 'supplies', label: 'School supplies' },
  { id: 'other', label: 'Other' },
];

const DESK_FILTERS = [
  'All Desks',
  'SLC Front Desk',
  'DC Library',
  'Dana Porter Library',
  'PAC Equipment Desk',
  'REV Front Desk',
];

const DATE_FILTERS = [
  { id: 'all', label: 'Any time' },
  { id: '3d', label: 'Past 3 days' },
  { id: 'week', label: 'Past week' },
  { id: '2w', label: 'Past 2 weeks' },
  { id: '30', label: '30+ days' },
];

export const StudentHome: React.FC<StudentHomeProps> = ({
  items,
  onSelectItem,
  onOpenReportFound,
  onOpenLost,
  onOpenNotifyMe,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedDesk, setSelectedDesk] = useState('All Desks');
  const [selectedDate, setSelectedDate] = useState('all');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Filter items: hide items that are already picked up
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (item.status === 'picked-up') return false;

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Desk filter
      if (selectedDesk !== 'All Desks' && item.desk !== selectedDesk) {
        return false;
      }

      // Date filter
      if (selectedDate === '3d' && item.daysAgo > 3) return false;
      if (selectedDate === 'week' && item.daysAgo > 7) return false;
      if (selectedDate === '2w' && item.daysAgo > 14) return false;
      if (selectedDate === '30' && item.daysAgo < 30) return false;

      // Search query (search title, category, colour, public description, desk)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const textToMatch = `${item.category} ${item.subcategory ?? ''} ${item.colour} ${item.desk}`.toLowerCase();
        if (!textToMatch.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedCategory, selectedDesk, selectedDate, searchQuery]);

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedDesk !== 'All Desks' ? 1 : 0) +
    (selectedDate !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedDesk('All Desks');
    setSelectedDate('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Hero Search & Quick Action Buttons */}
      <section className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs relative overflow-hidden">
        {/* Subtle decorative gold circle */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold mb-3">
            <span>UWaterloo Campus Network</span>
            <span aria-hidden="true">·</span>
            <span>5 Active Desks</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight leading-tight">
            Lost something on campus? <br className="hidden sm:inline" />
            Check all desks in one place.
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Instant search across SLC, DC, Porter, PAC, and REV desks with verified ownership hand-off.
          </p>
        </div>

        {/* Big Search Input */}
        <div className="mt-5 relative" data-tour="search">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by colour or type (black, bottle, keys)..."
            className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-300 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4" data-tour="actions">
          <button
            onClick={onOpenLost}
            className="py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Search className="w-4 h-4 text-amber-400" />
            <span>I lost something</span>
          </button>

          <button
            onClick={onOpenReportFound}
            className="py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span>I found something</span>
          </button>
        </div>

        {/* Category Horizontal Filter Chips */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-slate-950 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Filter and Results Bar */}
      <div id="search-grid" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-950">Campus Found Items</h2>
            <span className="text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
              {filteredItems.length}
            </span>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs font-semibold text-amber-800 hover:underline ml-1"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Desk and Date Selectors */}
          <div className="flex items-center gap-2">
            {/* Desk Dropdown */}
            <div className="relative">
              <select
                value={selectedDesk}
                onChange={(e) => setSelectedDesk(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 pr-7 appearance-none focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-2xs"
              >
                {DESK_FILTERS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Date Dropdown */}
            <div className="relative">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 pr-7 appearance-none focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-2xs"
              >
                {DATE_FILTERS.map((df) => (
                  <option key={df.id} value={df.id}>
                    {df.label}
                  </option>
                ))}
              </select>
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Item Photo Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} onClick={onSelectItem} />
            ))}
          </div>
        ) : (
          /* Empty Search State with "Notify Me" Form Prompt */
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200/60">
              <BellRing className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                No matching items currently logged
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Items often take a few hours or days to be turned in to campus desks. Set an in-app alert and we'll notify you as soon as it arrives!
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onOpenNotifyMe(selectedCategory, searchQuery)}
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 mx-auto shadow-xs transition-colors"
              >
                <BellRing className="w-4 h-4" />
                <span>Notify me when it turns up</span>
              </button>
            </div>
          </div>
        )}

        {/* Persistent "Notify Me" Helper Strip */}
        {filteredItems.length > 0 && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-200/60 flex items-center justify-center text-amber-900 shrink-0 mt-0.5">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Don't see your lost item in the list?
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Set a notification rule with your item's description. We scan newly logged items at all 5 desks.
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenNotifyMe(selectedCategory, searchQuery)}
              className="py-2 px-3.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold text-xs whitespace-nowrap shrink-0 transition-colors"
            >
              Create "Notify Me" Alert
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

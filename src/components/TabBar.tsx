import React from 'react';

interface TabBarProps {
  tabs: Array<[string, string, React.ComponentType<{ className?: string }>, string?]>;
  active: string;
  onChange: (tab: string) => void;
  dark?: boolean;
  dock?: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, active, onChange, dark = false, dock = false }) => {
  return (
    <div
      className={dock
        ? 'fixed bottom-0 inset-x-0 z-40 grid border-t border-slate-200 bg-white px-1 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))] sm:static sm:z-auto sm:mb-5 sm:rounded-2xl sm:border sm:p-1.5'
        : 'grid gap-1 mb-5 w-full p-1.5 bg-white rounded-2xl border border-slate-200'}
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map(([id, label, Icon, tour]) => (
        <button
          key={id}
          type="button"
          data-tour={tour}
          onClick={() => onChange(id)}
          className={`min-w-0 py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 text-center leading-tight ${active === id ? (dark ? 'bg-slate-950 text-white' : 'bg-amber-400 text-slate-950') : 'text-slate-600'}`}
        >
          <Icon className={`w-4 h-4 shrink-0 ${dock ? '' : 'hidden sm:block'}`} />
          <span className={dock ? '' : 'truncate'}>{label}</span>
        </button>
      ))}
    </div>
  );
};

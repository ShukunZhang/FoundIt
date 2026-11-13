import React from 'react';

interface TabBarProps {
  tabs: Array<[string, string, React.ComponentType<{ className?: string }>]>;
  active: string;
  onChange: (tab: string) => void;
  dark?: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, active, onChange, dark = false }) => {
  return (
    <div className="grid grid-cols-7 gap-1 mb-5 w-full p-1.5 bg-white rounded-2xl border border-slate-200">
      {tabs.map(([id, label, Icon]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`min-w-0 py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl flex items-center justify-center gap-1 text-center ${active === id ? (dark ? 'bg-slate-950 text-white' : 'bg-amber-400 text-slate-950') : 'text-slate-600'}`}
        >
          <Icon className="w-3.5 h-3.5 shrink-0 hidden sm:block" />
          <span className="truncate">{label}</span>
        </button>
      ))}
    </div>
  );
};

interface StudentBackBarProps {
  title: string;
  onBack: () => void;
}

export const StudentBackBar: React.FC<StudentBackBarProps> = ({ title, onBack }) => {
  return (
    <div className="mb-4 flex items-center gap-2">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-50"
      >
        Back to search
      </button>
      <span className="text-xs font-semibold text-slate-500">{title}</span>
    </div>
  );
};

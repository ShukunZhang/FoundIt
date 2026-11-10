import React, { useState } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  QrCode, 
  CheckCircle2, 
  Shield, 
  User, 
  ChevronDown, 
  ChevronUp,
  CreditCard,
  BellRing
} from 'lucide-react';

interface DemoScenariosBarProps {
  onTriggerScenario: (scenario: string) => void;
  onResetData: () => void;
  currentRole: 'student' | 'staff';
  onSwitchRole: (role: 'student' | 'staff') => void;
}

export const DemoScenariosBar: React.FC<DemoScenariosBarProps> = ({
  onTriggerScenario,
  onResetData,
  currentRole,
  onSwitchRole,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40 max-w-sm sm:max-w-md w-[calc(100%-1.5rem)]">
      <div className="bg-slate-950/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-amber-400/40 p-3 sm:p-3.5 transition-all text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-bold tracking-tight text-amber-400 text-[11px] uppercase">
              Project Prototype Guide
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSwitchRole(currentRole === 'student' ? 'staff' : 'student')}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded font-semibold text-slate-200 transition-colors"
            >
              Switch to {currentRole === 'student' ? 'Staff' : 'Student'}
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-400 hover:text-white p-0.5"
              aria-label="Toggle Demo Controls"
            >
              {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-2">
            <p className="text-[11px] text-slate-300">
              One-click interactive test scenarios:
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onTriggerScenario('show_pickup_pass')}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700 text-left text-[11px] font-medium text-amber-300 flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">View Lily's Pickup QR</span>
              </button>

              <button
                onClick={() => onTriggerScenario('trigger_notify_match')}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700 text-left text-[11px] font-medium text-sky-300 flex items-center gap-1.5"
              >
                <BellRing className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Simulate "Is this yours?"</span>
              </button>

              <button
                onClick={() => onTriggerScenario('watcard_found_alert')}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700 text-left text-[11px] font-medium text-emerald-300 flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Log WatCard for Lily</span>
              </button>

              <button
                onClick={onResetData}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700 text-left text-[11px] font-medium text-rose-300 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Reset Mock Data</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

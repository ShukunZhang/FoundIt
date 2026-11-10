import React, { useEffect, useState } from 'react';

export interface GuideStep {
  selector: string;
  title: string;
  body: string;
}

interface GuideTourProps {
  open: boolean;
  steps: GuideStep[];
  onClose: () => void;
}

export const GuideTour: React.FC<GuideTourProps> = ({ open, steps, onClose }) => {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = steps[index];

  useEffect(() => {
    if (!open) return;
    const node = step ? document.querySelector(step.selector) : null;
    if (node instanceof HTMLElement) {
      node.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setRect(node.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [open, step]);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  if (!open || !step) return null;

  const top = rect ? Math.min(window.innerHeight - 180, rect.bottom + 12) : 80;
  const left = rect ? Math.min(window.innerWidth - 320, Math.max(12, rect.left)) : 16;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-slate-950/55" />
      {rect && (
        <div
          className="absolute rounded-2xl border-2 border-amber-300 shadow-[0_0_0_9999px_rgba(28,24,20,0.45)]"
          style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}
        />
      )}
      <div className="absolute w-[300px] bg-white rounded-2xl p-4 shadow-xl" style={{ top, left }}>
        <p className="text-[11px] font-bold text-amber-700">Step {index + 1} of {steps.length}</p>
        <h3 className="font-bold text-slate-950 mt-1">{step.title}</h3>
        <p className="text-xs text-slate-600 mt-1">{step.body}</p>
        <div className="flex gap-2 mt-3">
          <button type="button" className="text-xs px-3 py-2 rounded-lg bg-slate-100" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}>Back</button>
          {index < steps.length - 1 ? (
            <button type="button" className="text-xs px-3 py-2 rounded-lg bg-slate-950 text-white" onClick={() => setIndex((value) => value + 1)}>Next</button>
          ) : (
            <button type="button" className="text-xs px-3 py-2 rounded-lg bg-amber-400 font-bold" onClick={onClose}>Finish</button>
          )}
          <button type="button" className="text-xs px-3 py-2 rounded-lg text-slate-500 ml-auto" onClick={onClose}>Skip</button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Loader2, Mic } from 'lucide-react';
import type { ItemFeatures } from '../types';
import { extractItemDescription } from '../lib/itemExtract';
import { dictate, speechInputSupported } from '../lib/speech';

interface VoiceDescribeFieldProps {
  onExtracted: (features: ItemFeatures) => void;
}

export const VoiceDescribeField: React.FC<VoiceDescribeFieldProps> = ({ onExtracted }) => {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [note, setNote] = useState(
    speechInputSupported()
      ? 'Describe the item, where you lost it, and when. The form fills from what you say.'
      : 'Type a description. This browser cannot use the microphone.',
  );
  const [error, setError] = useState('');
  const [stop, setStop] = useState<(() => void) | null>(null);
  const supported = speechInputSupported();

  const fillFrom = async (text: string) => {
    const spoken = text.trim();
    if (spoken.length < 2) {
      setError('Say a little more about the item.');
      return;
    }
    setExtracting(true);
    setError('');
    try {
      const features = await extractItemDescription(spoken);
      if (!features) {
        setNote('The words were captured, but the server has no model key yet. You can still type the fields below.');
        return;
      }
      onExtracted(features);
      setNote('Form filled from your description. Check the fields before saving.');
    } catch (extractError) {
      setError(extractError instanceof Error ? extractError.message : 'Could not fill the form from that description.');
    } finally {
      setExtracting(false);
    }
  };

  const start = () => {
    setError('');
    setListening(true);
    setNote('Listening… speak, then tap stop.');
    const session = dictate(setTranscript);
    setStop(() => session.stop);
    void session.done
      .then((finalText) => {
        setTranscript(finalText);
        if (finalText.trim()) return fillFrom(finalText);
        setNote('No speech was captured. Try again, or type the description.');
        return undefined;
      })
      .catch((speechError: unknown) => {
        setError(speechError instanceof Error ? speechError.message : 'Voice input failed.');
      })
      .finally(() => {
        setListening(false);
        setStop(null);
      });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-900">Describe it</p>
        {supported && (
          <button
            type="button"
            onClick={() => (listening ? stop?.() : start())}
            disabled={extracting}
            aria-pressed={listening}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${
              listening ? 'bg-rose-600 text-white' : 'bg-slate-950 text-white'
            }`}
          >
            {extracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
            {extracting ? 'Reading…' : listening ? 'Stop and fill' : 'Use voice'}
          </button>
        )}
      </div>
      <textarea
        value={transcript}
        onChange={(event) => setTranscript(event.target.value)}
        rows={2}
        placeholder="Black Hydro Flask, lost in DC yesterday afternoon, dent on the lid"
        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
      />
      <button
        type="button"
        disabled={extracting || listening}
        onClick={() => void fillFrom(transcript)}
        className="text-xs font-bold text-amber-800 disabled:opacity-50"
      >
        {extracting ? 'Reading the description…' : 'Fill the form from this text'}
      </button>
      <p className="text-[11px] text-slate-600">{note}</p>
      {error && <p className="text-[11px] text-rose-700">{error}</p>}
    </div>
  );
};

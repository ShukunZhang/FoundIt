import React, { useState } from 'react';
import { Camera, Loader2, Sparkles } from 'lucide-react';
import type { PhotoScanResult } from '../types';
import { scanPhoto } from '../lib/photoScan';

interface PhotoScanFieldProps {
  onScanned: (result: PhotoScanResult) => void;
}

export const PhotoScanField: React.FC<PhotoScanFieldProps> = ({ onScanned }) => {
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState('Take or upload a photo. We read the main colour here, and a server model fills the rest when it is configured.');
  const [error, setError] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setScanning(true);
    setError('');
    try {
      const result = await scanPhoto(file);
      setPreview(result.previewUrl);
      setNote(result.source === 'gemini'
        ? 'Photo scanned. Confirm the suggested category, colour, and details before saving.'
        : `Main colour looks ${result.colour}. Confirm the category yourself. A Gemini key is not configured on the server.`);
      onScanned(result);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Could not read that photo.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div data-tour="scanner">
      <label className="block text-xs font-bold text-slate-900 mb-1.5">Photo scan</label>
      <label className="relative w-full min-h-28 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 flex items-center gap-3 p-4 cursor-pointer overflow-hidden">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        {preview ? (
          <img src={preview} alt="Selected item" className="w-16 h-16 rounded-xl object-cover border border-white" />
        ) : (
          <span className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
            {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
          </span>
        )}
        <span className="text-left">
          <span className="flex items-center gap-1 text-xs font-bold text-slate-900">
            <Sparkles className="w-3.5 h-3.5" /> {scanning ? 'Scanning photo…' : 'Take or upload a photo'}
          </span>
          <span className="block text-[11px] text-slate-600 mt-1">{note}</span>
        </span>
        {scanning && <span className="absolute inset-x-0 bottom-0 h-1 bg-amber-400 animate-pulse" />}
      </label>
      {error && <p className="text-[11px] text-rose-700 mt-1">{error}</p>}
    </div>
  );
};

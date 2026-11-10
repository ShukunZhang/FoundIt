import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthProvider';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStaff?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialStaff = false }) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-up');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [showStaff, setShowStaff] = useState(initialStaff);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (mode === 'sign-in') {
        await signIn(email, password);
        onClose();
      } else {
        const result = await signUp({
          name,
          email,
          password,
          studentId,
          staffCode: showStaff ? staffCode : undefined,
        });
        if (result === 'confirm-email') {
          setMessage('Check your inbox, then sign in with the same password.');
        } else {
          onClose();
        }
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <form onSubmit={(event) => void submit(event)} className="w-full max-w-md bg-white rounded-3xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{mode === 'sign-in' ? 'Sign in' : 'Create your FoundIt account'}</h2>
          <button type="button" onClick={onClose} aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-slate-600">Browsing stays open without an account. Claiming, lost reports, and return tags need a sign-in. Staff tools need a desk code.</p>
        {mode === 'sign-up' && (
          <>
            <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" className="w-full text-sm p-3 rounded-xl border border-slate-300" />
            <input value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="Student number (optional)" className="w-full text-sm p-3 rounded-xl border border-slate-300" />
          </>
        )}
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="w-full text-sm p-3 rounded-xl border border-slate-300" />
        <input required type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="w-full text-sm p-3 rounded-xl border border-slate-300" />
        {mode === 'sign-up' && (
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input type="checkbox" checked={showStaff} onChange={(event) => setShowStaff(event.target.checked)} />
            I have a staff desk code
          </label>
        )}
        {showStaff && mode === 'sign-up' && (
          <input value={staffCode} onChange={(event) => setStaffCode(event.target.value)} placeholder="Staff code" className="w-full text-sm p-3 rounded-xl border border-slate-300" />
        )}
        {error && <p className="text-xs text-rose-700">{error}</p>}
        {message && <p className="text-xs text-emerald-800">{message}</p>}
        <button disabled={busy} className="w-full py-3 rounded-xl bg-slate-950 text-white text-sm font-bold">
          {busy ? 'Working…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
        </button>
        <button type="button" className="w-full text-xs text-slate-600" onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}>
          {mode === 'sign-in' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  );
};

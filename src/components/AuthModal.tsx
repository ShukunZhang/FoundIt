import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthProvider';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'sign-in' | 'sign-up';
  audience?: 'student' | 'staff';
  choosingNewPassword?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'sign-up',
  audience = 'student',
  choosingNewPassword = false,
}) => {
  const { signIn, signUp, signOut, acceptSession, requestPasswordReset, updatePassword, refreshProfile } = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'forgot'>('sign-up');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const forStaff = audience === 'staff';

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setError('');
    setMessage('');
  }, [isOpen, initialMode, audience]);

  const expectAudience = async (role: string | undefined) => {
    const staffAccount = role === 'staff' || role === 'admin';
    if (forStaff && !staffAccount) {
      await signOut();
      throw new Error('This account is not a staff desk account. Use student sign in.');
    }
    if (!forStaff && staffAccount) {
      await signOut();
      throw new Error('Staff accounts use Staff sign in.');
    }
  };

  if (!isOpen) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (choosingNewPassword) {
        if (password !== confirmPassword) throw new Error('Those passwords do not match.');
        await updatePassword(password);
        onClose();
        return;
      }
      if (mode === 'forgot') {
        await requestPasswordReset(email);
        setMessage('If an account uses that email, a reset link is on its way. Open it in this browser, then choose a new password.');
        return;
      }
      if (mode === 'sign-in') {
        const signedInProfile = await signIn(email, password);
        await expectAudience(signedInProfile.role);
        acceptSession(signedInProfile);
        onClose();
      } else {
        if (forStaff && !staffCode.trim()) throw new Error('Enter the staff desk code.');
        const result = await signUp({
          name,
          email,
          password,
          studentId: forStaff ? '' : studentId,
          staffCode: forStaff ? staffCode : undefined,
        });
        if (result === 'confirm-email') {
          setMessage('Check your inbox, then sign in with the same password.');
        } else {
          const signedInProfile = await refreshProfile();
          await expectAudience(signedInProfile.role);
          acceptSession(signedInProfile);
          onClose();
        }
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  const title = choosingNewPassword
    ? 'Choose a new password'
    : mode === 'forgot'
      ? 'Reset your password'
      : forStaff
        ? (mode === 'sign-in' ? 'Staff sign in' : 'Create a staff account')
        : (mode === 'sign-in' ? 'Sign in' : 'Create your FoundIt account');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <form onSubmit={(event) => void submit(event)} className="w-full max-w-md bg-white rounded-3xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        {!choosingNewPassword && mode === 'sign-up' && (
          <>
            <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" className="w-full text-sm p-3 rounded-xl border border-slate-300" />
            {!forStaff && (
              <input value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="Student number (optional)" className="w-full text-sm p-3 rounded-xl border border-slate-300" />
            )}
          </>
        )}
        {!choosingNewPassword && (
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={forStaff ? 'Staff email' : 'Email'} className="w-full text-sm p-3 rounded-xl border border-slate-300" />
        )}
        {mode !== 'forgot' && (
          <input required type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={choosingNewPassword ? 'New password' : 'Password'} className="w-full text-sm p-3 rounded-xl border border-slate-300" />
        )}
        {choosingNewPassword && (
          <input required type="password" minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" className="w-full text-sm p-3 rounded-xl border border-slate-300" />
        )}
        {forStaff && mode === 'sign-up' && !choosingNewPassword && (
          <input required value={staffCode} onChange={(event) => setStaffCode(event.target.value)} placeholder="Staff desk code" className="w-full text-sm p-3 rounded-xl border border-slate-300" />
        )}
        {error && <p className="text-xs text-rose-700">{error}</p>}
        {message && <p className="text-xs text-emerald-800">{message}</p>}
        <button disabled={busy} className="w-full py-3 rounded-xl bg-slate-950 text-white text-sm font-bold">
          {busy ? 'Working…' : choosingNewPassword ? 'Save password' : mode === 'forgot' ? 'Send reset link' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
        </button>
        {!choosingNewPassword && mode === 'sign-in' && (
          <button type="button" className="w-full text-xs font-semibold text-amber-800" onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}>
            Forgot password?
          </button>
        )}
        {!choosingNewPassword && (
          <button
            type="button"
            className="w-full text-xs text-slate-600"
            onClick={() => {
              setMode(mode === 'sign-in' || mode === 'forgot' ? 'sign-up' : 'sign-in');
              setError('');
              setMessage('');
            }}
          >
            {mode === 'sign-up' ? 'Already have an account? Sign in' : 'Need an account? Create one'}
          </button>
        )}
      </form>
    </div>
  );
};

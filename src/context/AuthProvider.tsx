import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { UserProfile } from '../types';
import { fetchProfile, redeemStaffCode } from '../lib/db';
import { supabase, supabaseConfigured } from '../lib/supabase';

const PENDING_CODE_KEY = 'foundit.pendingStaffCode';

export const GUEST_PROFILE: UserProfile = {
  id: '',
  name: '',
  email: '',
  studentId: '',
  claimsUsedThisWeek: 0,
  maxWeeklyInstantClaims: 3,
  isSignedIn: false,
  role: 'student',
  deskId: null,
  deskName: null,
};

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  profile: UserProfile;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signUp: (input: { name: string; email: string; password: string; studentId: string; staffCode?: string }) => Promise<string>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  needsNewPassword: boolean;
  signOut: () => Promise<void>;
  acceptSession: (next: UserProfile) => void;
  redeemCode: (code: string) => Promise<void>;
  refreshProfile: () => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(GUEST_PROFILE);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);
  const [needsNewPassword, setNeedsNewPassword] = useState(false);
  const generation = useRef(0);
  const holdProfile = useRef(false);

  const publishProfile = useCallback((next: UserProfile, generationAtStart: number) => {
    if (generation.current !== generationAtStart || holdProfile.current) return;
    setProfile(next);
  }, []);

  const refreshProfile = useCallback(async (): Promise<UserProfile> => {
    const generationAtStart = generation.current;
    if (!supabase) return GUEST_PROFILE;
    const { data } = await supabase.auth.getUser();
    if (generation.current !== generationAtStart) return GUEST_PROFILE;
    if (!data.user) {
      publishProfile(GUEST_PROFILE, generationAtStart);
      return GUEST_PROFILE;
    }
    const next = await fetchProfile(data.user.id);
    if (generation.current !== generationAtStart) return GUEST_PROFILE;
    let resolved = next ?? { ...GUEST_PROFILE, id: data.user.id, email: data.user.email ?? '', isSignedIn: true };
    const pending = localStorage.getItem(PENDING_CODE_KEY);
    if (pending && next && next.role === 'student') {
      await redeemStaffCode(pending);
      localStorage.removeItem(PENDING_CODE_KEY);
      const upgraded = await fetchProfile(data.user.id);
      if (generation.current !== generationAtStart) return GUEST_PROFILE;
      if (upgraded) resolved = upgraded;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    if (generation.current !== generationAtStart || !sessionData.session) return GUEST_PROFILE;
    publishProfile(resolved, generationAtStart);
    return resolved;
  }, [publishProfile]);

  const signOut = useCallback(async () => {
    generation.current += 1;
    holdProfile.current = true;
    setProfile(GUEST_PROFILE);
    setNeedsNewPassword(false);
    try {
      if (supabase) await supabase.auth.signOut();
    } finally {
      holdProfile.current = false;
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (data.session?.user) await refreshProfile();
      if (active) setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setNeedsNewPassword(true);
      void refreshProfile();
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    setAuthError(null);
    holdProfile.current = true;
    let sessionStarted = false;
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        holdProfile.current = false;
        setAuthError(error.message);
        throw new Error(error.message);
      }
      sessionStarted = true;
      const next = await refreshProfile();
      if (!next.isSignedIn) throw new Error('Could not load this account.');
      return next;
    } catch (error) {
      if (sessionStarted) await signOut();
      else holdProfile.current = false;
      throw error;
    }
  }, [refreshProfile, signOut]);

  const signUp = useCallback(async (input: { name: string; email: string; password: string; studentId: string; staffCode?: string }) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    setAuthError(null);
    const { error: registerError } = await supabase.rpc('register_account', {
      p_email: input.email,
      p_password: input.password,
      p_full_name: input.name,
      p_student_id: input.studentId,
      p_staff_code: input.staffCode?.trim() ?? '',
    });
    if (registerError) {
      setAuthError(registerError.message);
      throw new Error(registerError.message);
    }
    holdProfile.current = true;
    let sessionStarted = false;
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: input.email.trim(),
        password: input.password,
      });
      if (error) {
        holdProfile.current = false;
        setAuthError(error.message);
        throw new Error(error.message);
      }
      sessionStarted = true;
      const next = await refreshProfile();
      if (!next.isSignedIn) throw new Error('Could not load this account.');
      return 'signed-in';
    } catch (error) {
      if (sessionStarted) await signOut();
      else holdProfile.current = false;
      throw error;
    }
  }, [refreshProfile, signOut]);

  const requestPasswordReset = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
    });
    if (error) throw new Error(error.message);
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    setNeedsNewPassword(false);
    await refreshProfile();
  }, [refreshProfile]);

  const acceptSession = useCallback((next: UserProfile) => {
    holdProfile.current = false;
    setProfile(next);
  }, []);

  const redeemCode = useCallback(async (code: string) => {
    await redeemStaffCode(code);
    await refreshProfile();
  }, [refreshProfile]);

  const value = useMemo<AuthContextValue>(() => ({
    configured: supabaseConfigured,
    loading,
    profile,
    authError,
    signIn,
    signUp,
    requestPasswordReset,
    updatePassword,
    needsNewPassword,
    signOut,
    acceptSession,
    redeemCode,
    refreshProfile,
  }), [loading, profile, authError, signIn, signUp, requestPasswordReset, updatePassword, needsNewPassword, signOut, acceptSession, redeemCode, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

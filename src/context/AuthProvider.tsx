import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { name: string; email: string; password: string; studentId: string; staffCode?: string }) => Promise<string>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  needsNewPassword: boolean;
  signOut: () => Promise<void>;
  redeemCode: (code: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(GUEST_PROFILE);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);
  const [needsNewPassword, setNeedsNewPassword] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setProfile(GUEST_PROFILE);
      return;
    }
    const next = await fetchProfile(data.user.id);
    setProfile(next ?? { ...GUEST_PROFILE, id: data.user.id, email: data.user.email ?? '', isSignedIn: true });
    const pending = localStorage.getItem(PENDING_CODE_KEY);
    if (pending && next && next.role === 'student') {
      await redeemStaffCode(pending);
      localStorage.removeItem(PENDING_CODE_KEY);
      const upgraded = await fetchProfile(data.user.id);
      if (upgraded) setProfile(upgraded);
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      throw new Error(error.message);
    }
    await refreshProfile();
  }, [refreshProfile]);

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
    const { error } = await supabase.auth.signInWithPassword({
      email: input.email.trim(),
      password: input.password,
    });
    if (error) {
      setAuthError(error.message);
      throw new Error(error.message);
    }
    await refreshProfile();
    return 'signed-in';
  }, [refreshProfile]);

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

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setNeedsNewPassword(false);
    setProfile(GUEST_PROFILE);
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
    redeemCode,
    refreshProfile,
  }), [loading, profile, authError, signIn, signUp, requestPasswordReset, updatePassword, needsNewPassword, signOut, redeemCode, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

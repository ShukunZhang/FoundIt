import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface ApprovalNotice {
  code: string;
  message: string;
}

function approvalNotice(value: unknown): ApprovalNotice | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as { type?: unknown; pickup_code?: unknown; message?: unknown };
  if (row.type !== 'claim_approved' || typeof row.pickup_code !== 'string' || row.pickup_code.length === 0) return null;
  const message = typeof row.message === 'string' && row.message.trim()
    ? row.message
    : `Your claim was approved. Pickup code ${row.pickup_code}.`;
  return { code: row.pickup_code, message };
}

/** Refreshes claims and inbox when the desk approves a pickup code. */
export function useClaimAlerts(userId: string | undefined, onApproved: (notice: ApprovalNotice) => void): void {
  const queryClient = useQueryClient();
  const onApprovedRef = useRef(onApproved);
  onApprovedRef.current = onApproved;

  useEffect(() => {
    if (!userId) return;
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
      void queryClient.invalidateQueries({ queryKey: ['claims'] });
      void queryClient.invalidateQueries({ queryKey: ['items'] });
    };
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);

    const client = supabase;
    if (!client) {
      return () => window.removeEventListener('focus', onFocus);
    }

    const channel = client
      .channel(`claim-alerts-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
        refresh();
        const notice = approvalNotice(payload.new);
        if (notice) onApprovedRef.current(notice);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'claims', filter: `claimant_id=eq.${userId}` }, () => {
        refresh();
      })
      .subscribe();

    return () => {
      window.removeEventListener('focus', onFocus);
      void client.removeChannel(channel);
    };
  }, [userId, queryClient]);
}

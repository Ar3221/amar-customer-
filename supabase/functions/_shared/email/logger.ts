// ==================================================
// AMAR INDUSTRIES ERP — EMAIL LOGGING SERVICE
// ==================================================

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import type { EmailLogStatus, EmailTemplateName } from './types.ts';

export async function logEmail(
  supabase: SupabaseClient,
  entry: {
    recipient: string;
    subject: string;
    templateName: EmailTemplateName;
    status: EmailLogStatus;
    errorMessage?: string;
    orderId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
    retryCount?: number;
  }
) {
  const { error } = await supabase.from('email_logs').insert({
    recipient: entry.recipient,
    subject: entry.subject,
    template_name: entry.templateName,
    status: entry.status,
    error_message: entry.errorMessage ?? null,
    order_id: entry.orderId ?? null,
    user_id: entry.userId ?? null,
    metadata: entry.metadata ?? {},
    retry_count: entry.retryCount ?? 0,
    sent_at: entry.status === 'sent' ? new Date().toISOString() : null,
  });

  if (error) console.error('[Email Logger] Failed to write log:', error);
}

export async function canSendToUser(
  supabase: SupabaseClient,
  userId: string | undefined,
  preferenceKey: string
): Promise<boolean> {
  if (!userId) return true;

  const { data } = await supabase
    .from('email_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) return true;
  if (!data.emails_enabled) return false;
  return data[preferenceKey] !== false;
}

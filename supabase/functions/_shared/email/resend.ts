// ==================================================
// AMAR INDUSTRIES ERP — RESEND API INTEGRATION
// ==================================================

import { EMAIL_FROM } from './config.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';

export interface SendResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendViaResend(
  to: string,
  subject: string,
  html: string
): Promise<SendResult> {
  if (!RESEND_API_KEY) {
    console.warn('[Resend] RESEND_API_KEY not set — email simulated in logs only.');
    return { success: true, id: `mock_${Date.now()}` };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject,
        html,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data?.message || `Resend API error (${response.status})`,
      };
    }

    return { success: true, id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Resend error';
    return { success: false, error: message };
  }
}

export async function sendWithRetry(
  to: string,
  subject: string,
  html: string,
  maxRetries = 3,
  delayMs = 1500
): Promise<SendResult> {
  let lastError = 'Unknown error';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendViaResend(to, subject, html);
    if (result.success) return result;
    lastError = result.error || lastError;
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, delayMs * attempt));
    }
  }

  return { success: false, error: lastError };
}

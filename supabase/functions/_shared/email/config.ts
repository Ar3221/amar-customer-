// ==================================================
// AMAR INDUSTRIES ERP — EMAIL CONFIGURATION
// ==================================================

export const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'Amar Industries ERP <noreply@amarsplints.com>';
export const SUPPORT_EMAIL = Deno.env.get('SUPPORT_EMAIL') || 'support@amarsplints.com';
export const SUPPORT_PHONE = Deno.env.get('SUPPORT_PHONE') || '+91 98765 43210';
export const COMPANY_WEBSITE = Deno.env.get('COMPANY_WEBSITE') || 'https://www.amarindustries.com';
export const ADMIN_DASHBOARD_URL = Deno.env.get('ADMIN_DASHBOARD_URL') || 'http://localhost:5173';
export const CUSTOMER_PORTAL_URL = Deno.env.get('CUSTOMER_PORTAL_URL') || 'http://localhost:5174';
export const HIGH_VALUE_ORDER_THRESHOLD = Number(Deno.env.get('HIGH_VALUE_ORDER_THRESHOLD') || '500000');
export const MAX_EMAIL_RETRIES = 3;
export const EMAIL_RETRY_DELAY_MS = 1500;

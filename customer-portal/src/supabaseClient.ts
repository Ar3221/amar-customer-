// ==================================================
// AMAR INDUSTRIES ERP — SUPABASE CLIENT DEFINITION
// Path: customer-portal/src/supabaseClient.ts
// ==================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.log(
    'ℹ️ [Supabase Client]: No VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables found. B2B portal will run in local-first secure mock database mode.'
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

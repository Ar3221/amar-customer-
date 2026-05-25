// ==================================================
// AMAR INDUSTRIES ERP — EMAIL PREFERENCES PANEL
// ==================================================

import { useEffect, useState } from 'react';
import { Mail, Save } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import type { User } from '../types';

export interface EmailPreferencesState {
  emails_enabled: boolean;
  order_received: boolean;
  order_status_updates: boolean;
  escalation_alerts: boolean;
  inventory_alerts: boolean;
  high_value_alerts: boolean;
  supervisor_alerts: boolean;
  marketing_emails: boolean;
}

const DEFAULT_PREFS: EmailPreferencesState = {
  emails_enabled: true,
  order_received: true,
  order_status_updates: true,
  escalation_alerts: true,
  inventory_alerts: true,
  high_value_alerts: true,
  supervisor_alerts: true,
  marketing_emails: false,
};

const STORAGE_KEY = 'amar_email_preferences';

interface EmailPreferencesProps {
  currentUser: User;
}

export function EmailPreferences({ currentUser }: EmailPreferencesProps) {
  const [prefs, setPrefs] = useState<EmailPreferencesState>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase
          .from('email_preferences')
          .select('*')
          .eq('public_user_id', currentUser.id)
          .maybeSingle();
        if (data) {
          setPrefs({
            emails_enabled: data.emails_enabled,
            order_received: data.order_received,
            order_status_updates: data.order_status_updates,
            escalation_alerts: data.escalation_alerts,
            inventory_alerts: data.inventory_alerts,
            high_value_alerts: data.high_value_alerts,
            supervisor_alerts: data.supervisor_alerts,
            marketing_emails: data.marketing_emails,
          });
        }
      } else {
        const stored = localStorage.getItem(`${STORAGE_KEY}_${currentUser.id}`);
        if (stored) setPrefs(JSON.parse(stored));
      }
      setLoading(false);
    };
    load();
  }, [currentUser.id]);

  const handleSave = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('email_preferences').upsert({
        public_user_id: currentUser.id,
        ...prefs,
        updated_at: new Date().toISOString(),
      });
    } else {
      localStorage.setItem(`${STORAGE_KEY}_${currentUser.id}`, JSON.stringify(prefs));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggle = (key: keyof EmailPreferencesState) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  if (loading) return null;

  const items: { key: keyof EmailPreferencesState; label: string; desc: string }[] = [
    { key: 'order_received', label: 'Order Received', desc: 'Confirmation when your order inquiry is submitted' },
    { key: 'order_status_updates', label: 'Status Updates', desc: 'Approved, rejected, processing, and dispatch notifications' },
    { key: 'marketing_emails', label: 'Product Updates', desc: 'Catalog launches and commercial announcements' },
  ];

  return (
    <div className="glass-panel p-6 rounded-xl space-y-5 bg-slate-900/30 border border-industrial-800">
      <div className="flex items-center gap-3 border-b border-industrial-800 pb-4">
        <Mail className="w-5 h-5 text-brand-cyan" />
        <div>
          <h4 className="font-bold text-sm uppercase text-slate-200 tracking-wider">Email Preferences</h4>
          <p className="text-[10px] text-slate-500 font-mono-custom mt-0.5">Control order notification emails</p>
        </div>
      </div>

      <label className="flex items-center justify-between p-3 rounded-lg bg-industrial-950 border border-industrial-800 cursor-pointer">
        <span className="text-xs font-bold text-slate-300">Enable All Emails</span>
        <input
          type="checkbox"
          checked={prefs.emails_enabled}
          onChange={() => toggle('emails_enabled')}
          className="accent-brand-cyan w-4 h-4"
        />
      </label>

      <div className="space-y-2">
        {items.map(({ key, label, desc }) => (
          <label
            key={key}
            className="flex items-start justify-between gap-4 p-3 rounded-lg bg-slate-900/50 border border-industrial-800/60 cursor-pointer"
          >
            <div>
              <span className="text-xs font-semibold text-slate-300 block">{label}</span>
              <span className="text-[10px] text-slate-500">{desc}</span>
            </div>
            <input
              type="checkbox"
              checked={prefs[key]}
              disabled={!prefs.emails_enabled}
              onChange={() => toggle(key)}
              className="accent-brand-cyan w-4 h-4 mt-0.5 shrink-0"
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="flex items-center gap-2 px-4 py-2 bg-brand-cyan hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase rounded-lg transition cursor-pointer"
      >
        <Save className="w-3.5 h-3.5" />
        {saved ? 'Saved' : 'Save Preferences'}
      </button>
    </div>
  );
}

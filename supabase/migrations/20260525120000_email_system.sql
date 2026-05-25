-- ==================================================
-- AMAR INDUSTRIES ERP — EMAIL INFRASTRUCTURE
-- Migration: 20260525120000_email_system.sql
-- ==================================================

CREATE TYPE email_log_status AS ENUM ('queued', 'sent', 'failed', 'retrying');

CREATE TABLE email_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient text NOT NULL,
    subject text NOT NULL,
    template_name text NOT NULL,
    status email_log_status NOT NULL DEFAULT 'queued',
    error_message text,
    order_id text,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    retry_count integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_at timestamp with time zone
);

CREATE TABLE email_preferences (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    emails_enabled boolean NOT NULL DEFAULT true,
    order_received boolean NOT NULL DEFAULT true,
    order_status_updates boolean NOT NULL DEFAULT true,
    escalation_alerts boolean NOT NULL DEFAULT true,
    inventory_alerts boolean NOT NULL DEFAULT true,
    high_value_alerts boolean NOT NULL DEFAULT true,
    supervisor_alerts boolean NOT NULL DEFAULT true,
    marketing_emails boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_order ON email_logs(order_id);
CREATE INDEX idx_email_logs_user ON email_logs(user_id);
CREATE INDEX idx_email_logs_template ON email_logs(template_name);
CREATE INDEX idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX idx_email_preferences_user ON email_preferences(user_id);

CREATE TRIGGER update_email_preferences_modtime
    BEFORE UPDATE ON email_preferences
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view email logs" ON email_logs
    FOR SELECT USING (get_current_user_role() IN ('supervisor', 'admin'));

CREATE POLICY "Service role manages email logs" ON email_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own email preferences" ON email_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences" ON email_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email preferences" ON email_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all email preferences" ON email_preferences
    FOR SELECT USING (get_current_user_role() IN ('supervisor', 'admin'));

# Amar Industries ERP — Email System

Enterprise workflow email infrastructure powered by **Resend**, **React Email**, **Supabase Edge Functions**, and **PostgreSQL**.

## Architecture

```
Frontend (customer-portal / admin)
        ↓  supabase.functions.invoke('send-email')
Supabase Edge Function (send-email)
        ↓  React Email render → Resend API
Email delivery
        ↓
PostgreSQL (email_logs, email_preferences)
```

Emails are **never** sent from the browser directly.

## Setup

### 1. Install template dependencies (local preview)

```bash
cd emails
npm install
```

### 2. Environment variables

**Resend key (server only)** — stored in `supabase/.env` for local dev (gitignored). For production:

```bash
supabase secrets set RESEND_API_KEY=re_your_key
supabase secrets set EMAIL_FROM="Amar Industries ERP <onboarding@resend.dev>"
```

Use `onboarding@resend.dev` until your domain is verified in Resend.

**Frontend** — copy `.env.example` into `customer-portal/.env` and `admin/.env`:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` only
- Do **not** put `RESEND_API_KEY` in frontend env files

### 3. Database migration

```bash
supabase db push
```

Creates `email_logs` and `email_preferences` tables.

### 4. Deploy Edge Functions

```bash
supabase functions deploy send-email
supabase functions deploy escalate-orders
```

Set secrets in Supabase Dashboard → Edge Functions → Secrets.

## Email types

| Template | Trigger | Recipient |
|----------|---------|-----------|
| `customer_order_received` | Order created | Customer |
| `customer_order_approved` | Status → approved | Customer |
| `customer_order_rejected` | Status → rejected | Customer |
| `customer_order_processing` | Status → processing | Customer |
| `customer_order_dispatched` | Status → dispatched | Customer |
| `supervisor_new_order` | Order created | Supervisors |
| `admin_escalation` | 7-day SLA breach | Admins |
| `admin_low_inventory` | Stock below threshold | Admins |
| `admin_high_value_order` | Order above threshold | Admins |

## Folder structure

```
supabase/functions/_shared/email/     # Service layer + React Email templates
supabase/functions/send-email/      # Main dispatcher Edge Function
supabase/functions/escalate-orders/ # Cron escalation + emails
emails/                             # npm package for react-email dev preview
customer-portal/src/lib/emailClient.ts
admin/src/lib/emailClient.ts
```

## Preview templates locally

```bash
cd emails && npm run dev
```

## Cron: escalation engine

Schedule `escalate-orders` daily via Supabase cron or external scheduler.

# Amar Industries Customer Order Portal

This repository contains the Amar Industries customer order portal, admin ERP panel, React Email templates, and Supabase schema/functions.

## Apps

- `admin` - internal ERP/admin dashboard
- `customer-portal` - customer-facing order portal
- `emails` - React Email template preview package
- `supabase` - database migrations and Edge Functions

## Run Locally

Install all app dependencies:

```bash
npm run install:all
```

Start the admin dashboard:

```bash
npm run admin:dev
```

Start the customer portal in another terminal:

```bash
npm run customer:dev
```

Build both frontend apps:

```bash
npm run build
```

## Environment Variables

Copy `.env.example` into `admin/.env`, `customer-portal/.env`, and `supabase/.env` as needed.

Do not commit real `.env` files. They are ignored by Git.

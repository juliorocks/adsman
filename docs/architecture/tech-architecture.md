# Technical Architecture Document (TAD) - Meta Ads Integration

## Executive Summary
This document defines the architectural standards and patterns for the "Meta Ads Management System". The system leverages **Next.js** for the frontend, **Supabase** for backend services (Auth, Database, Realtime), and **Edge Functions** for scalable, serverless interaction with the Meta Graph API.

## System Overview

### Core Stack
- **Frontend:** Next.js (App Router), React, TailwindCSS.
- **Backend:** Supabase (PostgreSQL, GoTrue, Realtime).
- **Compute:** Supabase Edge Functions (Deno).
- **Integration:** Meta Graph API (v19.0+).

### High-Level Diagram
```mermaid
graph TD
    User[User (Browser)] -->|HTTPS/React| NextJS[Next.js App]
    NextJS -->|Supabase SDK| Auth[Supabase Auth]
    NextJS -->|Supabase SDK| DB[(Postgres DB)]
    NextJS -->|RPC Call| EdgeFn[Edge Functions]
    EdgeFn -->|Graph API| Meta[Meta Ads Platform]
    Meta -->|Webhooks| EdgeFn
    EdgeFn -->|Write| DB
```

## Module Architecture

### 1. Authentication & Token Management
- **OAuth Flow:** Handled via Edge Function `auth-meta` to exchange authorization codes for long-lived access tokens.
- **Token Storage:** Encrypted in `vault.secrets` (Supabase Vault) or a dedicated `integration_tokens` table with Row Level Security (RLS) enabled. Keys managed via project environment variables.

### 2. Campaign Management (CRUD)
- **Read:** Cached data stored in local Postgres tables (`campaigns`, `ad_sets`, `ads`) synced via webhooks or periodic jobs. Front-end queries local DB for speed.
- **Write:** Mutations (Create/Update) sent to Edge Function `manage-campaign`, which validates payload, calls Meta API, and updates local DB on success.

### 3. AI Optimization Engine
- **Event-Driven:** Uses `pg_net` or Edge Functions triggered by database changes (e.g., new performance metric row) or scheduled via `pg_cron`.
- **Logic:**
  - *Analyzer:* Checks metrics against user-defined rules (ROAS < 2.0).
  - *Executor:* Dispatches Meta API calls to pause/scale.

### 4. Generative Studio
- **Pipeline:**
  - Input: User prompts or existing ad data.
  - Processing: LLM API (OpenAI/Anthropic) for copy; Image Gen API (DALL-E/Midjourney) for visuals.
  - Output: Stored in Supabase Storage buckets and linked to `creative_library` table.

## Data Model (Simplified)

### `integrations`
- `id`: uuid
- `user_id`: uuid
- `platform`: 'meta'
- `access_token_ref`: string (pointer to vault)
- `ad_account_id`: string

### `campaigns`
- `id`: uuid
- `meta_id`: string (unique)
- `name`: string
- `status`: string
- `objective`: string
- `daily_budget`: numeric

### `performance_metrics`
- `id`: uuid
- `entity_id`: string (campaign/adset/ad id)
- `date`: date
- `impressions`: int
- `spend`: numeric
- `clicks`: int
- `roas`: numeric

## Security & Compliance
- **Encryption:** All PII and Access Tokens encrypted at rest.
- **RLS:** Strict Row Level Security policies to ensure users only access their own integrations and data.
- **Audit:** All write actions logged to `audit_logs` table.

## Deployment Strategy
- **Frontend:** Vercel or compatible Next.js host.
- **Backend/Edge:** Supabase managed platform.

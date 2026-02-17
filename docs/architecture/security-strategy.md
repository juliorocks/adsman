# Security Strategy - Meta Ads Integration

## Overview
This document outlines the security measures for protecting sensitive user data, particularly **Meta Access Tokens** and personally identifiable information (PII) associated with ad accounts.

## Core Security Pillars

### 1. Token Management & Encryption
- **Vault:** All long-lived Meta Access Tokens MUST be stored in **Supabase Vault** (if available) or a dedicated secrets table with encryption at rest.
- **Algorithm:** AES-256-GCM for encryption if implementing custom storage.
- **Access Control:** Only specific Edge Functions (`auth-meta`, `manage-campaign`) can decrypt tokens. The frontend NEVER receives the raw access token.
- **Rotation:** Tokens are refreshed automatically before expiration.

### 2. Row Level Security (RLS)
- **Principle of Least Privilege:**
  - `integrations` table: `view` only for owner, `insert` only for owner (via edge function). No `update` allowed directly.
  - `campaigns`, `ad_sets`: `select` for owner. `insert/update/delete` BLOCKED for all roles (must go through Edge Function API).
- **Service Role:** Only Edge Functions run with `service_role` privileges to bypass RLS for system operations.

### 3. API Security
- **Edge Functions:**
  - **Authentication:** Require valid JWT from Supabase Auth (`Authorization: Bearer <token>`).
  - **Validation:** All inputs validated against JSON Schema (Zod) to prevent injection attacks.
  - **Rate Limiting:** Implement token bucket rate limiting per user IP to prevent abuse.

### 4. Direct Database Access
- **No Direct Writes:** The frontend App cannot write directly to `campaigns` or `ads` tables to ensure business logic and Meta API synchronization integrity.
- **Read Replicas:** If feasible, use read replicas for heavy analytics queries to protect the primary transactional database.

## Compliance
- **GDPR/CCPA:** Provide mechanisms for users to export their data and request deletion ("Right to be Forgotten"). This triggers a cascade delete of all stored ad data.
- **Audit Logs:** All critical actions (linking account, creating campaign, changing budget) are logged to an immutable `audit_logs` table.

## Threat Model
| Threat | Mitigation |
| :--- | :--- |
| **Token Theft** | Encrypted storage, never exposed to client, short-lived session tokens. |
| **SQL Injection** | Use of parameterised queries (PostgREST default) and ORM-like builders. |
| **Data Leakage** | Strict RLS policies; specific `select` limits in API responses. |
| **DDoS on API** | Rate limiting at the Edge (Supabase/Functions layer). |

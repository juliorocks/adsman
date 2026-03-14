-- Support multiple Meta integrations per user (one per client)
-- Previously, UNIQUE(user_id, platform) allowed only 1 Meta integration per user.
-- This migration removes that constraint and adds a partial unique index instead.

-- Step 1: Remove the old single-integration unique constraint (if it exists)
-- The constraint name may vary depending on how the table was created.
-- Try all common names:
ALTER TABLE public.integrations DROP CONSTRAINT IF EXISTS integrations_user_id_platform_key;
ALTER TABLE public.integrations DROP CONSTRAINT IF EXISTS integrations_user_id_platform_unique;

-- Step 2: Add a partial unique index — same user cannot have two integrations
-- for the exact same ad_account_id + platform combination (only when ad_account_id is set)
CREATE UNIQUE INDEX IF NOT EXISTS integrations_user_platform_account_unique
    ON public.integrations (user_id, platform, ad_account_id)
    WHERE ad_account_id IS NOT NULL;

-- Step 3: Add client_name column if it doesn't exist yet
ALTER TABLE public.integrations ADD COLUMN IF NOT EXISTS client_name TEXT DEFAULT NULL;

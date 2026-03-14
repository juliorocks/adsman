-- Add allowed_integration_ids to team_members
-- NULL = access to all integrations (backwards compatible default for existing members)
-- Non-null array = access only to those specific integration UUIDs

ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS allowed_integration_ids uuid[] DEFAULT NULL;

ALTER TABLE public.social_interactions DROP CONSTRAINT IF EXISTS social_interactions_status_check;
ALTER TABLE public.social_interactions ADD CONSTRAINT social_interactions_status_check CHECK (status IN ('PENDING', 'PROCESSING', 'DRAFT', 'COMPLETED', 'FAILED', 'IGNORED'));

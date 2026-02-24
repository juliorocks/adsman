-- Create table for storing and queuing social interactions (comments, messages)
CREATE TABLE IF NOT EXISTS public.social_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('facebook', 'instagram')),
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('comment', 'message')),
    external_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'IGNORED')),
    ai_response TEXT,
    error_log TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for querying pending interactions quickly
CREATE INDEX IF NOT EXISTS idx_social_interactions_status ON public.social_interactions(status);
CREATE INDEX IF NOT EXISTS idx_social_interactions_integration ON public.social_interactions(integration_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_social_interactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_social_interactions_updated_at ON public.social_interactions;
CREATE TRIGGER trg_social_interactions_updated_at
BEFORE UPDATE ON public.social_interactions
FOR EACH ROW
EXECUTE FUNCTION update_social_interactions_updated_at();

-- Add RLS Policies
ALTER TABLE public.social_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own integration's interactions"
    ON public.social_interactions FOR SELECT
    USING (
        integration_id IN (
            SELECT id FROM public.integrations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own integration's interactions"
    ON public.social_interactions FOR UPDATE
    USING (
        integration_id IN (
            SELECT id FROM public.integrations WHERE user_id = auth.uid()
        )
    );

-- We allow insert from anywhere securely so webhooks can insert via service key.

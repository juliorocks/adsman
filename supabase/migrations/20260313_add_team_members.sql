-- Team members table: allows an admin/owner to grant access to their workspace
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,          -- The admin's user_id (workspace owner)
    user_id UUID,                    -- The member's user_id (set at invite time)
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'editor' CHECK (role IN ('reader', 'editor', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(owner_id, email)
);

CREATE INDEX IF NOT EXISTS idx_team_members_owner_id ON public.team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id  ON public.team_members(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Owner can see and manage their entire team
CREATE POLICY "team_members_owner_all"
    ON public.team_members FOR ALL
    USING (owner_id = auth.uid());

-- Member can see their own membership record
CREATE POLICY "team_members_member_select"
    ON public.team_members FOR SELECT
    USING (user_id = auth.uid());

-- Execute este comando no Editor SQL do seu projeto Supabase para criar a tabela de conhecimento
-- Isso permitirá que a IA lembre das informações do seu negócio

CREATE TABLE IF NOT EXISTS business_context (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(), -- Link to auth.users if possible, otherwise just UUID
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general', -- 'brand', 'product', 'audience', 'competitor'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar segurança (RLS)
ALTER TABLE business_context ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (apenas o dono pode ver/editar)
CREATE POLICY "Users can manage their own context" ON business_context
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

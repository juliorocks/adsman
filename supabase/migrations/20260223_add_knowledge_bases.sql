-- Habilitar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de Base de Conhecimento (Pastas/Clientes)
CREATE TABLE IF NOT EXISTS knowledge_bases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_name VARCHAR(255) NOT NULL, -- Para agrupar as bases ("Imobiliária X")
  name VARCHAR(255) NOT NULL, -- Ex: "Dores e Dúvidas Frequentes"
  content TEXT, -- Todo o conteúdo em plain text, para quando não precisarmos de RAG
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Documentos/Chunks para Busca Vetorial RAG
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- Trecho do arquivo ou pedaço de texto
  embedding vector(1536), -- Para embeddings da OpenAI (text-embedding-3-small/ada-002)
  metadata JSONB, -- Para guardar nome do arquivo original, página etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indice para velocidade na busca Vetorial (pgvector HNSW)
CREATE INDEX ON knowledge_documents USING hnsw (embedding vector_cosine_ops);

-- Função Helper para Busca de Similaridade no Supabase
CREATE OR REPLACE FUNCTION match_knowledge_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  client_filter varchar DEFAULT NULL,
  user_filter uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  knowledge_base_id uuid,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    kd.id,
    kd.knowledge_base_id,
    kd.content,
    1 - (kd.embedding <=> query_embedding) AS similarity
  FROM knowledge_documents kd
  JOIN knowledge_bases kb ON kb.id = kd.knowledge_base_id
  WHERE (client_filter IS NULL OR kb.client_name = client_filter)
    AND (user_filter IS NULL OR kb.user_id = user_filter)
    AND 1 - (kd.embedding <=> query_embedding) > match_threshold
  ORDER BY kd.embedding <=> query_embedding
  LIMIT match_count;
$$;

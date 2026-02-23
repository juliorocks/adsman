-- Tabela para gerenciar a Sincronização e os Arquivos Vinculados a uma Base de Conhecimento
CREATE TABLE IF NOT EXISTS knowledge_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  source_type VARCHAR(50) NOT NULL, -- 'GOOGLE_DRIVE', 'URL', 'TEXT'
  source_ref TEXT NOT NULL, -- File ID (Google Drive), URL, or raw text if small
  metadata JSONB, -- { name: 'relatorio.pdf', mimeType: 'application/pdf', size: 1024 }
  sync_status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'SYNCING', 'SYNCED', 'FAILED'
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

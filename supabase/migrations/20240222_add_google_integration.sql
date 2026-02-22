-- Adiciona colunas necessárias para integração com Google Drive e outros serviços OAuth
ALTER TABLE integrations 
ADD COLUMN IF NOT EXISTS refresh_token_ref TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Comentário para documentação
COMMENT ON COLUMN integrations.refresh_token_ref IS 'Token de atualização criptografado para renovar o access_token';
COMMENT ON COLUMN integrations.expires_at IS 'Data de expiração do access_token atual';

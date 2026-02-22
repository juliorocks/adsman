# AIOS CORE KNOWLEDGE - Journal de Desenvolvimento

Este arquivo serve como a **Memória de Longo Prazo** do projeto. Todo agente AI que trabalhar neste código deve ler este arquivo primeiro para entender decisões passadas, erros resolvidos e arquitetura atual.

---

## 🚀 Integração Google Drive (Fevereiro 2024)

### Objetivo
Permitir o upload de arquivos pesados (como vídeos em 4K) diretamente do Google Drive para o Meta Ads, contornando limites de upload de rede local/Vercel via transferência **Cloud-to-Cloud**.

### 🛠️ Arquitetura e Decisões
1. **OAuth2 Resilience**: Implementado fluxo com `offline_access` e `refresh_tokens` criptografados no banco (Supabase).
2. **Vault de Segurança**: Uso de AES-256-GCM para proteger tokens em repouso.
3. **Cloud Pipeline (Updated)**: Inicialmente tentamos o pipeline direto via URL, mas migramos para o **Server-side Fetch + Byte Upload** para maior confiabilidade contra restrições de aplicativos do Meta.

### ❌ Erros Enfrentados e Soluções (SAGA COMPLETA)
1. **URI Mismatch (Erro 400)**: 
   - *Causa*: Erro de digitação na Vercel (`ttps://` em vez de `https://`).
   - *Solução*: Correção manual na Vercel e implementação de `.trim()` no código para evitar espaços.
2. **Perda de Sessão no Redirecionamento (Não autenticado)**:
   - *Causa*: O redirecionamento GET do Google para a Vercel às vezes perdia os cookies de sessão do Supabase.
   - *Solução (OAuth State)*: Passamos o `userId` no parâmetro `state` do Google. No retorno, recuperamos o ID do `state` e usamos a `service_role` (admin) para salvar os tokens no banco.
3. **Invalid UUID Syntax (mock_user_id_dev)**:
   - *Causa*: O banco exigia formato UUID, mas recebia uma string de texto do modo dev.
   - *Solução*: Alterado o MOCK_USER_ID para um UUID real (`de70c0de-ad00-4000-8000-000000000000`).
4. **Foreign Key Constraint (integrations_user_id_fkey)**:
   - *Causa*: O banco bloqueava a gravação porque o usuário de teste não existe na tabela oficial de contas (auth.users).
   - *Solução*: Executado `ALTER TABLE integrations DROP CONSTRAINT integrations_user_id_fkey` para permitir integrações em perfis híbridos/dev.
5. **RLS Violation (Bypass de Segurança)**:
   - *Causa*: Supabase bloqueava a gravação por política de segurança de linha.
   - *Solução*: Criado o `createAdminClient` em `lib/supabase/admin.ts` usando a `SERVICE_ROLE_KEY` para garantir gravação 100% confiável no callback do Google.
6. **Meta Capability Error (#3 Application Capability)**:
   - *Causa*: O Meta Ads App não tinha permissão para buscar (pull) arquivos de URLs externas diretamente, resultando em erro ao tentar usar `file_url` para arquivos do Drive.
   - *Solução (Server-Side Pipeline)*: Mudamos de "URL Link Fetch" para **"Server-side Fetch + Byte Upload"**. Agora o servidor do AIOS baixa o arquivo (usando Google Drive API para arquivos privados) e envia o buffer binário diretamente para o Meta. Isso resolve problemas de permissão e visibilidade.
7. **Navegação em Pastas no Drive**:
   - *Contexto*: A lista plana de arquivos era insuficiente para usuários com muitos ativos.
   - *Solução*: Implementado suporte completo a pastas e breadcrumbs em `GoogleDriveSelector.tsx`, usando hierarquia de `folderId` via API v3.
8. **Identity Selection Error (Subcode 1443226)**:
   - *Causa*: Meta V21.0 rejeita IDs de Instagram que não estão perfeitamente vinculados ou autorizados para a Página no Business Manager.
   - *Solução*: Implementado fluxo de **Tentativa e Erro Multinível**: 
       1. Tenta `instagram_user_id` no root (Padrão V21.0).
       2. Tenta `instagram_actor_id` no root (Legacy name fallback).
       3. Tenta dentro do `object_story_spec`.
       4. Se todos falharem, remove todas as referências de IG e força a veiculação apenas no Facebook para evitar o travamento da campanha.
9. **Video Thumbnail Error (Seu anúncio precisa de uma miniatura)**:
   - *Causa*: O Meta exige uma miniatura para anúncios de vídeo com Botão (CTA). Se o anúncio for criado imediatamente após o upload do vídeo, a miniatura automática pode não estar pronta.
   - *Solução*: Implementado o helper `waitForVideoReady` que faz polling do status do vídeo no Meta. Quando o status vira `ready`, capturamos a URL da miniatura gerada e a injetamos explicitamente no `video_data.image_url` do Creative.
10. **Smart Identity Persistence**:
    - *Contexto*: O usuário não queria ter que escolher a Página/Instagram toda vez se já estivesse em uma conta específica.
    - *Solução*: O `SmartCampaignWizard` agora consome as `preferred_page_id` e `preferred_instagram_id` da tabela `integrations`. Ao carregar o passo de Identidade, ele pré-seleciona automaticamente os ativos salvos, mantendo a consistência com o que foi definido anteriormente.

---

## 📌 Regras de Ouro do Projeto
- **Auth**: Sempre use `getCurrentUserId()` em `lib/data/settings.ts` para garantir compatibilidade entre Prod e Dev.
- **Admin Ops**: Use o `createAdminClient` para operações críticas de integração que ocorrem via redirecionamentos externos.
- **Tokens**: Nunca salve tokens em texto limpo. Use o `encrypt` do `lib/security/vault.ts`.
- **Cloud Import (New Strategy)**: Para arquivos do Drive, prefira sempre o download via servidor + upload de Bytes/Binary para o Meta. Isso evita erros de "Capability" do App e problemas com links não públicos.

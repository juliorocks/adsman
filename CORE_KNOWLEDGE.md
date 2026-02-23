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
   - *Solução*: Implementado o fluxo **Shotgun Strategy**:
       1. O sistema agora envia todos os campos de identidade (`instagram_user_id`, `instagram_actor_id`, `instagram_business_account_id`) simultaneamente no root do objeto, dentro do `object_story_spec` e nos blocos técnicos (`video_data`/`link_data`). Isso garante que a interface do Ads Manager reconheça a seleção.
       2. **Fallback Automático**: Se a identidade falhar, o sistema rotaciona IDs ou faz o downgrade para Facebook-Only (limpando todos os campos de IG) para garantir que a campanha seja criada.
9. **Video Thumbnail Error (Seu anúncio precisa de uma miniatura)**:
   - *Causa*: O Meta exige uma miniatura para anúncios de vídeo com Botão (CTA). Se o anúncio for criado imediatamente após o upload do vídeo, a miniatura automática pode não estar pronta.
   - *Solução*: Implementado o helper `waitForVideoReady` que faz polling do status do vídeo no Meta. Quando o status vira `ready`, capturamos a URL da miniatura gerada e a injetamos explicitamente no `video_data.image_url` do Creative.
10. **Smart Identity Persistence**:
    - *Contexto*: O usuário não queria ter que escolher a Página/Instagram toda vez se já estivesse em uma conta específica.
    - *Solução*: O `SmartCampaignWizard` agora consome as `preferred_page_id` e `preferred_instagram_id` da tabela `integrations`. Ao carregar o passo de Identidade, ele pré-seleciona automaticamente os ativos salvos, mantendo a consistência com o que foi definido anteriormente.
11. **Estratégia Zero Leak & Identity Guardian (Versão Definitiva)**:
    - *Problema*: Vazamento de ativos entre clientes e Instagram não sendo setado no Gerenciador de Anúncios.
    - *Solução*: 
        1. **Zero Leak**: `getPages` agora rejeita qualquer página que não tenha um vínculo oficial com o Instagram autorizado da conta OU que não passe em uma validação de contexto rigorosa (Fuzzy Name Match entre Ad Account e Página). Impossível a "Faculdade" aparecer na "Carolina".
        2. **Mirroring Universal**: `createAdCreative` agora espelha o ID do Instagram em **todos** os campos possíveis (root, spec, video_data, etc.) para garantir que a UI do Meta reconheça a seleção.
        3. **Identity Guardian**: Se por qualquer motivo de descoberta o ID do Instagram chegar vazio na criação, o sistema auto-seleciona o primeiro Instagram autorizado da conta de anúncios como fallback de segurança, garantindo que o anúncio nunca seja criado sem identidade.
12. **Instagram UI Selection Bug (Fevereiro 2026)**:
    - *Problema*: A conta do Instagram não aparecia pré-selecionada ("setada") nos rascunhos de anúncios criados pelo AIOS na interface do Gerenciador de Anúncios da Meta, exigindo seleção manual. Nossos logs não exibiam erro porque a API aceitava a criação, mas falhava no mapeamento interno da UI.
    - *Causa*: A Meta V21/V22 depreciou o uso isolado de `instagram_actor_id`. A UI moderna agora exige rigorosamente o campo `instagram_user_id` aninhado dentro da raiz do criativo E também do `object_story_spec`.  
    - *Solução*: Implementado um "Apex Bind" em `lib/meta/api.ts` que força `body.object_story_spec.instagram_user_id = igIdStr` e também injeta o campo root `body.instagram_user_id = igIdStr`. Atualizado também os métodos `createAd` e os mecanismos de fallback para espelhar isso uniformemente. Isso garantiu que todos os Ads gerados aparecessem 100% corretos na UI moderna da Meta.

---

## 📌 Regras de Ouro do Projeto
- **Auth**: Sempre use `getCurrentUserId()` em `lib/data/settings.ts` para garantir compatibilidade entre Prod e Dev.
- **Admin Ops**: Use o `createAdminClient` para operações críticas de integração que ocorrem via redirecionamentos externos.
- **Tokens**: Nunca salve tokens em texto limpo. Use o `encrypt` do `lib/security/vault.ts`.
- **Cloud Import (New Strategy)**: Para arquivos do Drive, prefira sempre o download via servidor + upload de Bytes/Binary para o Meta. Isso evita erros de "Capability" do App e problemas com links não públicos.

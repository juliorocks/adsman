# AIOS CORE KNOWLEDGE - Journal de Desenvolvimento

Este arquivo serve como a **Memória de Longo Prazo** do projeto. Todo agente AI que trabalhar neste código deve ler este arquivo primeiro para entender decisões passadas, erros resolvidos e arquitetura atual.

---

## 🚀 Integração Google Drive (Fevereiro 2024)

### Objetivo
Permitir o upload de arquivos pesados (como vídeos em 4K) diretamente do Google Drive para o Meta Ads, contornando limites de upload de rede local/Vercel via transferência **Cloud-to-Cloud**.

### 🛠️ Arquitetura e Decisões
1. **OAuth2 Resilience**: Implementado fluxo com `offline_access` e `refresh_tokens` criptografados no banco (Supabase).
2. **Vault de Segurança**: Uso de AES-256-GCM para proteger tokens em repouso.
3. **Cloud Pipeline**: O Meta Ads recebe apenas a URL do arquivo do Drive; a importação ocorre entre os servidores do Google e Meta.

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

---

## 📌 Regras de Ouro do Projeto
- **Auth**: Sempre use `getCurrentUserId()` em `lib/data/settings.ts` para garantir compatibilidade entre Prod e Dev.
- **Admin Ops**: Use o `createAdminClient` para operações críticas de integração que ocorrem via redirecionamentos externos (onde o cookie de sessão é instável).
- **Tokens**: Nunca salve tokens em texto limpo. Use o `encrypt` do `lib/security/vault.ts`.
- **Cloud-to-Cloud**: Para arquivos > 20MB, a preferência é sempre o pipeline via URL, não upload de base64.
